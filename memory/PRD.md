# Lunar Design — PRD

## Original Problem Statement
"I want to build a website for a web design page called 'Lunar Design' — I have attached logo." User clarified: visitors see an about page, portfolio, and can send enquiries; dark cinematic theme matching the logo (black/white/red/gold); enquiry needs email notification; Instagram link required. The agency deploys & maintains websites, logos, banners, domains, hosting.

## User Personas
- Prospective client (business owner/CMO) browsing work and sending a project enquiry
- Studio owner receiving enquiry notifications by email and via the database

## Architecture
- Frontend: React 19 + Tailwind + framer-motion + lenis (smooth scroll), react-router multi-page (/, /work, /about, /enquiry). Canvas-2D lunar hero with mouse parallax, masked line-by-line hero reveal, editorial marquee, numbered manifesto, bento portfolio with case-study modal, sonner toasts.
- Backend: FastAPI + MongoDB (motor). POST /api/enquiries stores enquiry + fires non-blocking email via Emergent managed Resend proxy (EMAIL_BASE_URL constant, X-Email-Key, from_name "Lunar Design", reply-to = enquirer). GET /api/enquiries lists submissions.
- Env: backend/.env holds EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME, OWNER_EMAIL (currently test address delivered@resend.dev — awaiting owner's real email).
- Brand asset: user's logo served from frontend/public/logo.png.

## Implemented (2026-09-21)
- Dark cinematic multi-page site (Home, Work, About, Enquiry) in brand palette #08080B / #F4F1EA / #C8322B / #D4AF37, Marcellus display type
- Kinetic hero: masked line reveal, live status pill, interactive moon canvas with gold orbit ring, crimson pulse, particles, mouse parallax + scroll parallax
- Slow editorial marquee, 3-chapter manifesto, 6-card services bento, portfolio grid with category filters + case-study modals
- Enquiry form: service chips, budget selector, validation, MongoDB persistence, email notification to owner (verified: 202 Accepted from email proxy)
- Footer with LUNAR watermark, live clock, Instagram link (@lunardesignsolutions)
- Enquiry notifications routed to owner's real email (stephenrae.lunardesigns@gmail.com) — verified 202 Accepted (2026-09-21)
- Real portfolio: Nola Soul (nolasoul.co.uk — real food photography, client's own logo) and Lunar Network Solutions (lunar-ns.com — live site screenshot); both with "Visit live site" links; Lunar Design provides domain & hosting for both
- Hero moon canvas renders tonight's REAL lunar phase (terminator ellipse + illumination % + phase name chip, computed astronomically in-browser)
- About page rewritten as family-run freelance studio; honest stats (2 live sites, 1 point of contact, 0 account managers, 24/7 care)

## Verified
- POST/GET /api/enquiries via curl; email to owner logged as HTTP 202 (both before and after owner-email switch)
- Screenshots: home hero with real moon phase + phase chip, work page with both real client images, case-study modal, enquiry form submit + success toast

## Backlog
- P0: User deploys via own Claude + GitHub workflow (code handoff done; env vars documented in PRD)
- P1: Real client testimonials (slot live in case-study modal — set `quote` per project in frontend/src/data/content.js); custom favicon set
- P2: Admin view for enquiries, CMS-editable portfolio, analytics

## Handoff Notes (for user's own deployment)
- Backend env: MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME, OWNER_EMAIL
- Frontend env: REACT_APP_BACKEND_URL (build-time)
- Auto-screenshots require google-chrome in the backend runtime; without it the portfolio silently falls back to bundled images in frontend/public
- Portfolio screenshots refresh on backend startup, every 24h, and via POST /api/screenshots/refresh

## Implemented (2026-09-21, round 3)
- Phase-aware gold accent: site-wide --gold CSS var computed from real moon illumination (pale gold at new moon -> warm amber at full); tonight hsl(35 76% 54%) at 77% lit
- Auto-updating portfolio screenshots: backend captures live sites via headless Chrome on startup + daily + manual POST /api/screenshots/refresh, served at GET /api/screenshots/{site}.png with frontend fallback to bundled images
- Testimonial slot in every case-study modal ("Client words" — placeholder until real quotes provided)

## Implemented (2026-09-21, round 4)
- Favicon set from client logo: favicon.ico (16/32/48), 32/16 PNGs, apple-touch-icon (180), android-chrome 192/512, site.webmanifest; index.html head updated (theme-color #08080B, real meta description)
- Enquiry autoreply: instant branded dark/gold confirmation email to the enquirer (server-side template, reply-to = owner, rate-limited to 3/hour per email to prevent abuse)
- Footer "next full moon" line (astronomically computed) telling regulars when the gold accent peaks

## Implemented (2026-09-21, round 5)
- OG share card: branded 1200x630 og-image.png (logo, Marcellus wordmark, gold underline, service caps, orbit ring) + full Open Graph/Twitter meta in index.html. NOTE: og:image URL is absolute and points at the preview domain — update to the production domain at go-live
- New-moon easter egg: --gold and --red CSS vars now both computed from real illumination; at new moon accents mute to stone (gold hsl(46 20% 45%), red hsl(3 30% 40%)), warming nightly to full-moon peak

## Implemented (2026-09-21, round 6)
- Red-wash hover on manifesto chapters + "Commission the next one" card only (user rejected extending it to service/portfolio cards — those keep original gold/dark hovers)
- Fixed site-wide regression: Tailwind var(--gold)/--red classes with /opacity modifiers silently generated no CSS; replaced all 12 with explicit color-mix() arbitrary values (still phase-reactive)
- Eclipse Mode: isEclipseNight() with curated total/partial lunar eclipse dates; hero moon turns blood-red (rusted dark side + red tint over lit face) and phase chip reads "Blood Moon Eclipse" on those nights only. NOT visually verifiable until an eclipse date (next: 12 Jan 2028) — logic unit-tested via node

## Next Tasks
1. Add real testimonial quotes when clients provide them
2. Confirm google-chrome exists in the production runtime, or keep fallback images
