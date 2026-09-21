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
- P0: Deploy to production on the client's domain
- P1: Grow portfolio as new client work ships; custom favicon set
- P2: Admin view for enquiries, CMS-editable portfolio, analytics

## Next Tasks
1. Deploy to production
2. Add new client work as it launches
