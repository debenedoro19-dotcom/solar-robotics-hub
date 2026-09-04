# Trade Tesla — Institutional Platform Build

## 1. Email identity (support@, noreply@, walter@)

Today every automated email is sent from `noreply@tradeenergy.app` and the sender
domain is `notify.tradeenergy.app`. The brand spec requires `@tradeenergyhub.com`.

- Switch the sender name to **Trade Tesla** and the visible From address to
  `noreply@tradeenergyhub.com` across the auth webhook and the app-email helper.
- Set `Reply-To: support@tradeenergyhub.com` on all user-facing emails so replies
  reach support instead of a dead noreply box.
- Logo: the shared brand header (Tesla mark + TRADE TESLA wordmark) is applied to
  every template, and the image URL is pinned to `https://tradeenergyhub.com`.
  Verify it renders in both the auth set (signup, recovery, magic link, invite,
  email change, reauthentication) and the app set (welcome, account notification).
- `walter@tradeenergyhub.com`: add a campaign/marketing signature block with a
  generated portrait of a mature professional man, name and title, used as the
  sign-off on outbound campaign-style emails.

Note: sending from `tradeenergyhub.com` needs that domain configured for email.
If it is not yet delegated, the setup dialog runs first; templates and code land
either way and start sending from the new address once verification completes.

## 2. Theme system

Dark stays default; light is the toggle. Audit and fix every surface that still
hardcodes colors — admin tables, charts, modals, badges — so both modes read from
tokens. Tesla Red `#E31937` is the single accent in both modes.

## 3. Public homepage — strict section order

Rebuild `src/pages/home.tsx` to exactly:

1. Sticky nav (already matches spec)
2. Hero — investment headline, two CTAs, live metrics card
3. Trust / platform metrics bar
4. Investment Packages + **interactive Returns Calculator** (new)
5. Ecosystem Exposure — exactly three cards (Vehicles, Energy Systems, Robotics)
6. How It Works — 4 steps (new)
7. Live Market Snapshot
8. Security & Compliance (new)
9. Testimonials (trimmed to 3)
10. Final CTA
11. Minimal footer with the four addresses and © 2026 Trade Tesla

Sections removed from the public page: Giveaways, VIP, Elon Musk feature.

Returns Calculator: amount slider + plan selector, live projection of daily,
monthly and term returns from the real plan rates, CTA into `/register`.

## 4. Withdrawal modals

The four-stage flow (Confirm / Processing / Success / Failed) is already built to
spec. Remaining: light-mode contrast pass and confirm the copy matches the spec
strings word for word.

## 5. Admin dashboard

- Sidebar order: Dashboard | Users | Deposits | Withdrawals | Investment Plans |
  Transactions | Settings | Logout.
- Withdrawals: Pending / Approved / Rejected tabs, Approve and Reject-with-reason,
  the rejection reason stored and included in the notification email.
- Add a Transactions view listing all deposits, withdrawals and ledger entries
  with filters.
- Table, filter and card styling unified and theme-correct.

## 6. Consistency and polish

Sweep the app, admin panel, modals, footer and every route `head()` for the
"Trade Tesla" name and the correct addresses; responsive and spacing pass on
homepage, account, dashboard and admin at mobile and desktop widths.

## Technical notes

- Email brand header: `src/lib/email-templates/email-brand.tsx`; senders in
  `src/lib/email-templates/send-email.ts`, `src/routes/lovable/email/auth/webhook.ts`
  and `src/routes/api/public/auth-email-hook.ts`.
- Walter portrait generated as a project asset and referenced by absolute URL so
  email clients can load it.
- New homepage sections as components under `src/components/sections/`.
- Rejection reason needs a `rejection_reason` column on `withdrawal_requests`
  plus a parameter on the admin status RPC.
