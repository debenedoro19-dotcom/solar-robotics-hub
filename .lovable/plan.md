# Admin Panel Rewire + Live Email / OTP System

## What's actually broken (verified)

1. **Payments (wallet addresses) save is blocked by the database.** The security-hardening pass revoked execute permission on the internal `is_admin_user()` helper for signed-in users. Two access rules still call it — the one guarding site settings writes and the one guarding deposit records — so every admin save on those hits a permission error, no matter who is logged in. This is the reason the wallet addresses refused to save.
2. **Most admin settings never persist anywhere real.** Platform, Security, Customer Care and Email-template tabs write to the browser's local storage only. They are per-browser, invisible to the live site, and vanish on another device. Only Payments, Giveaways and Pop-ups talk to the database.
3. **The email system does not exist.** `emailService.ts` posts to `/api/send-email`, and there is no such route in the project. Every welcome / KYC-approved / withdrawal / password / test email silently fails, including the "Send test email" button in admin.
4. No email sender domain is configured for the project yet.

## Part 1 — Make every admin setting real and instant

- **Fix the permission bug**: restore the helper's execute permission and repoint both access rules at the vetted `is_admin()` check, so admin writes work and privilege checks stay locked to the roles table.
- **Move all settings into the database** (`site_settings`, one row per group): platform, security, customer care, email, payments, pop-ups, ticker. Drop local-storage as the source of truth; keep a one-time import so anything currently saved in your browser is migrated on first load.
- **One save path, one shape**: a shared settings hook + save helper used by every tab, with real success/error feedback per tab (no more silent failures) and a saving/disabled state.
- **Take effect immediately**: the public site and dashboards read the same settings rows through a shared cached reader that is invalidated on save, so changes show up on next page render without a redeploy. Concretely wire up:
  - wallet addresses → crypto payment / deposit pages,
  - customer care contacts → footer, support page, floating support widget,
  - platform fields (site name, maintenance mode, min/max amounts, fees) → the surfaces that currently hardcode them,
  - security options → enforced where they can be (session/password rules), clearly labelled where they are Supabase-dashboard-only.
- **Audit sweep of the whole admin section** — users, deposits, withdrawals, plans, sessions, inventory, giveaways, careers — checking each write path actually reaches the database under the admin role, and fixing any that hit the same class of permission/policy fault.

## Part 2 — Webmail + automatic activity emails and OTP

- Set up your sender domain (you own `tradeenergy.app`) through the email setup dialog; Lovable manages the DNS records and delivery.
- **Auth / OTP emails**: branded templates for sign-up verification (OTP code + link), magic link, password reset, email change, invite and re-authentication — sent from your own domain in the app's Obsidian/Crimson style. This covers the registration Verify step and password recovery.
- **Activity-triggered emails**: replace the dead `/api/send-email` with the managed sender and wire real triggers so clients get email automatically on:
  - welcome / account created,
  - deposit received (pending) and deposit approved,
  - withdrawal requested and withdrawal processed,
  - investment purchased and giveaway entry confirmed,
  - KYC submitted / approved / rejected,
  - support ticket received and replied,
  - job application received and stage change.
- **Admin email tab becomes functional**: sender name, editable subject/body per template stored in the database, live preview, and a test-send button that actually delivers.
- Rate-limit settings for auth email are raised to match real signup volume.

## Technical notes

- Migration: `GRANT EXECUTE` restore + policy rewrite to `is_admin()`; `site_settings` rows seeded for each settings group with admin-only write, anon read only for public-safe keys (wallet addresses stay signed-in/admin-scoped as today).
- Settings reads go through a small typed module (`src/lib/siteSettings.ts` extended) with a TanStack Query cache keyed per group.
- Email uses Lovable's managed sending: scaffolded auth webhook + React Email templates under `src/lib/email-templates/`, and sends fired from server functions/routes at each trigger point (never from the browser). `emailService.ts` is rewritten to call those server paths.
- Work order: permission migration → settings persistence + wiring → admin audit sweep → email domain → auth/OTP templates → activity email triggers → admin email tab.
