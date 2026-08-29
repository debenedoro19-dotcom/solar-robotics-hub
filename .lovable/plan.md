# Investor Dashboard Refactor + Fixes

## Confirmed issues (verified in code/DB)

- **Admin login lands on the user dashboard.** `src/pages/login.tsx` only routes to `/admin` for a hardcoded demo pair (`admin@teslatrade.com` / `admin123`). A real Supabase login always goes to `/dashboard`, so your account never reaches the admin area. The admin page also has no role-based route guard.
- **Admin overview queries a table that doesn't exist** (`support_tickets`), so parts of it fail silently.
- **Inventory shows 12 cards at once** (`PAGE_SIZE = 12` in `LiveInventorySection`).
- **Tables in your spec do not exist yet.** The database has `user_profiles`, `user_balance`, `balance_transactions`, `deposit_records`, `withdrawal_requests` — there is no `profiles`, `investment_plans`, `user_investments`, or `transactions`.
- **Slowness:** every page mounts heavy sections and runs multiple sequential Supabase queries on mount with no caching. Needs measurement before/after, not guesswork.

## 1. Fix admin access
- Add a `user_roles` table + `has_role()` security-definer function (proper, non-escalatable role storage) and grant your account `admin`.
- Login redirects by role: admin → `/admin`, everyone else → `/dashboard`.
- Add an admin route guard on all `/admin/*` routes that checks the role server-side, and remove the hardcoded demo credentials.
- Create the missing `support_tickets` table so admin overview stops erroring.

## 2. Inventory display
- Show **4 cards** in the default open view; the rest stay collapsed under their category tabs (Vehicles / Energy / Solar / Robotics), each with its own Load More.

## 3. Database for the wallet + investment engine
Your spec names `profiles.wallet_balance` etc. This project already has `user_balance` and `balance_transactions` holding the same concepts. Rather than duplicating, I'll:
- Extend `user_balance` as the single wallet source of truth (`available_balance`, `total_invested`, `total_profit`).
- Create `investment_plans` (name, category, daily ROI %, duration, min/max deposit, active flag) + seed real plans across Solar Megapack, Optimus Robotics, Space Infrastructure.
- Create `user_investments` (plan, principal, start/maturity, accrued yield, status).
- Use existing `balance_transactions` as the unified ledger (deposit, plan purchase, yield payout, withdrawal).
- GRANTs + RLS on everything; users see only their own rows, admins see all.

**Deposit-first rule enforced server-side** in a TanStack server function (not in the browser): validate balance ≥ amount and within plan bounds, then atomically deduct balance, increment total invested, insert the contract, and log the ledger debit. Insufficient balance → rejected, with the UI showing red balance + "Deposit Funds" quick action.

## 4. Dashboard rebuild
Dark institutional fintech theme: `#08090C` background, `#0D1117` cards, `border-slate-800/80` glass edges, emerald `#10B981` for positive yields — added as design tokens, not hardcoded.

- **Hero balance card:** large Available Wallet Balance with `+ Deposit`, `↑ Withdraw`, `⚡ Buy Plan`.
- **Metric cards:** Total Active Capital, Total Net Profit Accrued, Active Contracts Count.
- **Portfolio chart:** recharts AreaChart, emerald gradient, 7D / 1M / 1Y / ALL toggles.
- **Active Investments tab:** plan name, category badge, principal, daily ROI %, maturity progress bar, yield earned.
- **Browse & Deploy Capital tab:** all active plans; Invest modal with live balance vs required capital, 25/50/75/MAX quick-select, real-time projected daily payout and maturity return, one-click confirm with instant deduction.

## 5. Wallet rails
- **Deposit modal:** network selector (USDT TRC-20, USDT ERC-20, BTC), copyable address + QR placeholder, amount, submits a `pending` ledger record.
- **Withdrawal modal:** available balance, destination address, amount, 1.5% network fee calc, confirm.
- **Transaction ledger:** date/time, type, amount, status badge (green / amber / red), paginated.

## 6. Performance pass
- Measure first (dev-tools timings + a Playwright load trace), then fix what the trace shows: lazy-load below-fold sections, batch the per-page Supabase round-trips into single queries via TanStack Query with caching, and compress/size the large image assets.
- Report the before/after numbers rather than claiming it "feels faster".

## Technical notes
- Roles in `user_roles` + `has_role()`; never a column on a profile table.
- Balance mutations only through `createServerFn` with `requireSupabaseAuth`; the browser never writes balances.
- Plan purchase runs in a single Postgres function so balance deduction and contract creation cannot partially apply.
