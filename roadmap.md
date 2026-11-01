# Task Roadmap

## Open
- [ ] Website audit & phased improvements (uploaded audit doc, Nov 1 2026) — present audit, get approval, implement in phases
  - Phase A: Identity & homepage (official name/address, remove unverified stats, blue & gold branding question)
  - Phase B: Public pages review (About, Curriculum, Gallery, Admissions, Blog, FAQ, Contact)
  - Phase C: Admissions conversion form (consent, visit date, lead tracking, WhatsApp follow-up)
  - Phase D: Portal gaps (parent leave requests, etc.)
  - Phase E: Security (remove public Admin nav link, re-verify RLS)
  - Phase F: SEO/perf (fix expired og:image, twitter:site, canonical, GA4 readiness, local SEO)
  - Phase G: QA pass (links, forms, console errors, mobile)
- [ ] WhatsApp webhook secrets (WHATSAPP_VERIFY_TOKEN / WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID) — BLOCKED on user filling the secrets request (cancelled Nov 1); pipeline verified working otherwise

## Done (recent)
- [x] Campus visits restricted to Mon–Fri (admissions-officer edge function, tested live)
