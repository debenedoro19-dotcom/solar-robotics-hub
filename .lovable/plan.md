# Tesla Trade — Remaining Features

The port, design system, public site, inventory fix (4 items + category tabs), auth, investor dashboard, account sync, and admin role security are done and committed. This plan finishes the remaining items from the original upgrade.

## 1. Careers / employment pipeline

- **New tables** (migration): `job_postings` (title, department, location, type, description, status) and `job_applications` (job, name, email, resume path, stage: new → screening → interview → offer → hired/rejected, internal notes), plus a private Supabase Storage bucket for resumes. RLS: anyone can read open postings; only admins manage postings and view applications; applicants can't read others' data.
- **Public `/careers` route**: listing with department/location/type filters, detail view per posting, application form with resume upload.
- **Admin pipeline**: applicants board grouped by stage with drag-free stage controls, internal notes, and job posting create/edit/close controls.

## 2. Pop-ups (admin-configurable)

- **Pop-up manager** in the root layout, driven by new `site_settings` rows so each can be toggled on/off and its copy/frequency edited from admin settings:
  - Timed welcome/offer modal, frequency-capped per visitor.
  - Lead-capture / exit-intent modal storing emails to a `newsletter_leads` table.
  - Inventory "Inquire / reserve allocation" modal wired into the inventory cards.
  - Cookie/consent bar.

## 3. Live withdrawal ticker

- Rotating corner toasts — "James M. from Austin withdrew $12,480 · 2 min ago" — generated from a randomized client-side pool of names, cities, and amounts (never a fixed repeating script).
- Admin settings controls: on/off, frequency, and amount range.

## 4. Admin settings expansion

- Settings panel gains: pop-up toggles/copy, ticker config, site content fields, maintenance mode flag — all stored in `site_settings` and read via RLS-safe policies.

## Technical notes

- Migrations follow the standard pattern: grants to authenticated/service_role (anon select only where the public needs it), RLS enabled, admin writes verified server-side via `has_role()`/`is_admin()`.
- New routes: `/careers`, `/careers/$slug`, admin applicants board under the existing `_authenticated.admin` gate.
- Work order: migration → careers (public + admin) → pop-ups + ticker → settings panel wiring.
