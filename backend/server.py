import asyncio
import ipaddress
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
OWNER_EMAIL = os.environ["OWNER_EMAIL"]

logger = logging.getLogger(__name__)

# --- Email guardrail gate (G2/G3 structural checks) ---
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: Optional[str] = None) -> Optional[str]:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as client_http:
        resp = await client_http.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


# --- Models ---
class EnquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    services: List[str] = Field(default_factory=list, max_length=10)
    budget: Optional[str] = Field(default=None, max_length=60)
    message: str = Field(min_length=1, max_length=4000)


class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    services: List[str] = []
    budget: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def _enquiry_email_html(enquiry: Enquiry) -> str:
    services = ", ".join(escape(s) for s in enquiry.services) or "Not specified"
    rows = "".join([
        f'<tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Name</td>'
        f'<td style="padding:8px 16px;color:#111">{escape(enquiry.name)}</td></tr>',
        f'<tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Email</td>'
        f'<td style="padding:8px 16px;color:#111">{escape(enquiry.email)}</td></tr>',
        f'<tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Services</td>'
        f'<td style="padding:8px 16px;color:#111">{services}</td></tr>',
        f'<tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Budget</td>'
        f'<td style="padding:8px 16px;color:#111">{escape(enquiry.budget or "Not specified")}</td></tr>',
        f'<tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Brief</td>'
        f'<td style="padding:8px 16px;color:#111">{escape(enquiry.message)}</td></tr>',
    ])
    return (f'<table role="presentation" width="100%" style="font-family:Arial,sans-serif;background:#f7f5ef;padding:24px">'
            f'<tr><td><h2 style="font-family:Georgia,serif;color:#111;margin:0 0 16px">New project enquiry</h2>'
            f'<table role="presentation" width="100%" style="background:#fff;border:1px solid #e5e2d8">{rows}</table>'
            f'<p style="font-size:12px;color:#888;margin-top:16px">Sent by {escape(EMAIL_FROM_NAME)} website enquiry form.</p>'
            f'</td></tr></table>')


async def _notify_owner(enquiry: Enquiry) -> None:
    try:
        await send_email(
            to=OWNER_EMAIL,
            subject=f"New enquiry - {enquiry.name}",
            html=_enquiry_email_html(enquiry),
            reply_to=enquiry.email,
        )
    except Exception as e:
        logger.error(f"Enquiry email notification failed: {e}")


# --- Routes ---
@api_router.get("/")
async def root():
    return {"message": "Lunar Design API"}


@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(payload: EnquiryCreate):
    enquiry = Enquiry(**payload.model_dump())
    doc = enquiry.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.enquiries.insert_one(doc)
    asyncio.create_task(_notify_owner(enquiry))
    return enquiry


@api_router.get("/enquiries", response_model=List[Enquiry])
async def list_enquiries():
    docs = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
