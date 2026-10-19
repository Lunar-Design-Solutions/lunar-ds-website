// Lunar Design enquiry Worker.
// Replaces the old FastAPI POST /api/enquiries endpoint: validates the enquiry form
// and emails it to the studio inboxes via the Email Routing send_email binding.
// Reply-To is set to the visitor, so hitting "Reply" in Gmail answers them directly.

const LIMITS = { name: 120, email: 254, phone: 40, budget: 120, message: 4000, service: 60, services: 10 };
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,25}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

function validate(data) {
  const enquiry = {
    name: clean(data.name, LIMITS.name),
    email: clean(data.email, LIMITS.email),
    phone: clean(data.phone, LIMITS.phone),
    budget: clean(data.budget, LIMITS.budget),
    message: clean(data.message, LIMITS.message),
    services: Array.isArray(data.services)
      ? data.services.slice(0, LIMITS.services).map((s) => clean(s, LIMITS.service)).filter(Boolean)
      : [],
  };
  if (!enquiry.name) return { error: "Please tell us your name." };
  if (!EMAIL_RE.test(enquiry.email)) return { error: "Please enter a valid email address." };
  if (enquiry.phone && !PHONE_RE.test(enquiry.phone)) return { error: "Please enter a valid mobile number." };
  if (!enquiry.message) return { error: "Please include a short project brief." };
  return { enquiry };
}

function renderHtml(e, fromName) {
  const row = (label, value) =>
    `<tr><td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top">${label}</td>` +
    `<td style="padding:8px 16px;color:#111;white-space:pre-wrap">${value}</td></tr>`;
  const rows = [
    row("Name", esc(e.name)),
    row("Email", `<a href="mailto:${esc(e.email)}">${esc(e.email)}</a>`),
    row("Mobile", e.phone ? `<a href="tel:${esc(e.phone.replace(/[^\d+]/g, ""))}">${esc(e.phone)}</a>` : "Not given"),
    row("Services", esc(e.services.join(", ") || "Not specified")),
    row("Budget", esc(e.budget || "Not specified")),
    row("Brief", esc(e.message)),
  ].join("");
  return (
    `<table role="presentation" width="100%" style="font-family:Arial,sans-serif;background:#f7f5ef;padding:24px">` +
    `<tr><td><h2 style="font-family:Georgia,serif;color:#111;margin:0 0 16px">New project enquiry</h2>` +
    `<table role="presentation" width="100%" style="background:#fff;border:1px solid #e5e2d8">${rows}</table>` +
    `<p style="font-size:12px;color:#888;margin-top:16px">Sent by the ${esc(fromName)} enquiry form. Reply to this email to answer ${esc(e.name)} directly.</p>` +
    `</td></tr></table>`
  );
}

function renderText(e) {
  return [
    "New project enquiry",
    "",
    `Name:     ${e.name}`,
    `Email:    ${e.email}`,
    `Mobile:   ${e.phone || "Not given"}`,
    `Services: ${e.services.join(", ") || "Not specified"}`,
    `Budget:   ${e.budget || "Not specified"}`,
    "",
    "Brief:",
    e.message,
  ].join("\n");
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return json({ detail: "Method not allowed" }, 405);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ detail: "Invalid request." }, 400);
    }

    // Honeypot: real visitors never see or fill the "company" field; bots usually do.
    if (data && clean(data.company, 200)) return json({ ok: true });

    const { enquiry, error } = validate(data || {});
    if (error) return json({ detail: error }, 422);

    const to = String(env.NOTIFY_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
    // One message per inbox, so one address Cloudflare hasn't verified can't lose the enquiry.
    const results = await Promise.allSettled(to.map((addr) => env.EMAIL.send({
      from: { email: env.FROM_ADDRESS, name: env.FROM_NAME },
      to: addr,
      replyTo: { email: enquiry.email, name: enquiry.name },
      subject: `New enquiry - ${enquiry.name}`,
      html: renderHtml(enquiry, env.FROM_NAME),
      text: renderText(enquiry),
    })));
    results.forEach((r, i) => { if (r.status === "rejected") console.error("Enquiry email failed", to[i], r.reason?.code, r.reason?.message); });
    if (!results.some((r) => r.status === "fulfilled")) {
      return json({ detail: "We couldn't send your enquiry just now. Please try again." }, 500);
    }

    console.log("Enquiry sent", { services: enquiry.services, hasBudget: Boolean(enquiry.budget) });
    return json({ ok: true });
  },
};
