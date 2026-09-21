# Lunar Design — Self-Hosting Notes

## Stack
- frontend/ — React 19 + Tailwind + framer-motion + lenis (build with `yarn build`, output in `frontend/build`)
- backend/ — FastAPI + MongoDB (run with `uvicorn server:app --host 0.0.0.0 --port 8001`)

## Environment variables
Copy each `.env.example` to `.env` and fill in your values.
- Backend: MONGO_URL + DB_NAME (your own MongoDB, e.g. Atlas), EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME, OWNER_EMAIL, CORS_ORIGINS
- Frontend (build-time): REACT_APP_BACKEND_URL — must point at wherever the backend is hosted

## Email
Enquiry notifications + autoreplies go through Emergent's managed email proxy using
EMERGENT_EMAIL_KEY (see backend/.env.example). If you leave the Emergent platform, swap
`send_email()` in backend/server.py for your own provider (Resend, SES, SMTP) — the call
sites and templates are self-contained.

## Portfolio auto-screenshots
backend/server.py captures nolasoul.co.uk + lunar-ns.com with headless Chrome on startup,
every 24h, and via POST /api/screenshots/refresh. The runtime needs `google-chrome` installed;
without it the frontend silently falls back to the bundled images in frontend/public.

## Cloudflare notes
- Frontend fits Cloudflare Pages perfectly: build command `yarn build`, output `build`,
  set REACT_APP_BACKEND_URL in Pages env vars, add an SPA fallback (/* -> /index.html).
- The FastAPI backend cannot run on Cloudflare Workers/Pages — host it on any Python-capable
  service (Render, Railway, Fly, a VPS, or a container), then point REACT_APP_BACKEND_URL at it.

## At go-live
Primary domain: lunar-ds.com (.co.uk redirects to it). og:image / twitter:image
in frontend/public/index.html already point at https://lunar-ds.com/og-image.png.
Claude workflow: pull repo -> `yarn build` frontend -> Cloudflare Pages (build output
`build`, SPA fallback /* -> /index.html, env REACT_APP_BACKEND_URL) -> backend on a
Python host with the backend/.env values -> point MongoDB (Atlas) via MONGO_URL.
