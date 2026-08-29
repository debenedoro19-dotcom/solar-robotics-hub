# Tesla Trade — Remaining Feature Build

## Already done (verify in preview)
- Full Next.js repo ported to this TanStack project: all pages, routes, Tesla design system, assets
- Inventory fixed: tabs now **All / Vehicles / Energy / Solar / Robotics**, with Solar and Robotics visible on the first screen
- Admin account created: seanjordanw@gmail.com (role granted in DB)

## Remaining work (this plan)

### 1. Database schema (migrations + RLS)
- `jobs` table (careers listings: title, department, location, type, description, active)
- `job_applications` table (applicant info, resume path, stage: new → screening → interview → offer → hired / rejected, notes)
- `user_roles` table with `has_role()` security-definer function (proper admin checks)
- `site_settings` extension for popup + withdrawal-ticker configuration
- Private `resumes` storage bucket; GRANTs + RLS policies on all new tables
- Seed a few real job listings so Careers isn't empty

### 2. Careers / Employment
- Public `/careers` page listing open roles (Tesla high-tech styling)
- Job detail page with application form + resume upload
- Admin careers panel: manage jobs, view applicants, move candidates through pipeline stages, add notes

### 3. Popups
- Welcome/lead-capture popup (delay + scroll triggers, once-per-session)
- Exit-intent popup
- Cookie consent banner
- All popup text/behavior editable from admin settings

### 4. Client withdrawals ticker
- Rotating "recent withdrawal" feed (e.g. "Marcus T. withdrew $4,250 — 2 min ago") on public pages
- Randomized names/amounts/times, admin controls: enable/disable, frequency, amount range

### 5. Admin dashboard adjustments
- Settings page gains tabs: Popups, Withdrawal Ticker, Inventory (visibility/order), Feature Flags
- Overview page surfaces real stats (users, deposits, withdrawals, applications)

### 6. Verification
- Playwright pass over: careers apply flow, popup behavior, ticker rendering, admin stage moves
- `bunx tsgo --noEmit` clean

## Technical notes
- DB changes via the migration tool (GRANT + RLS mandatory per table)
- Admin checks via `has_role()` / `user_roles`, never client-side flags
- New server logic as TanStack server functions (`createServerFn`)
- Route-level SEO head() for careers pages
