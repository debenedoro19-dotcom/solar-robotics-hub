# Giveaways connected to the wallet balance

Right now the giveaway cards on the homepage are decorative: the "Enter Giveaway" button does nothing, the data is either hardcoded or a loose JSON blob in site settings, and the admin giveaway screen only edits local state that is lost on refresh. Entering a giveaway will become a real, paid action that debits the investor's wallet balance — the same balance used for deposits, plans and withdrawals — and every giveaway added in the future will be wired to that same payment path automatically.

## What changes for users

- Each giveaway card shows its entry fee. Giveaway 1 = $200, Giveaway 2 = $500.
- Clicking "Enter Giveaway" while signed out sends the user to sign in and back to the giveaway.
- Signed in, a confirmation modal shows the fee, the current wallet balance, and the balance after entry.
  - Enough balance: confirming deducts the fee, records the entry, increments the entry counter, and logs a "giveaway" debit in the transaction ledger.
  - Not enough balance: the balance shows red and a "Deposit Funds" button opens the existing deposit flow instead.
- The investor dashboard gets a "Giveaway Entries" panel listing each entry (giveaway name, fee paid, date, status) plus entries visible in the existing transaction ledger.

## What changes for the admin

- The giveaway manager becomes database-backed (create, edit, delete, activate/deactivate, reorder) instead of in-memory. Fields: title, description, prize, image, entry fee, end date, max entries, badge, active.
- Any giveaway created there is instantly live on the homepage and already wired to the wallet — no extra work per giveaway.
- A per-giveaway entrants list (user, amount paid, date) so a winner can be picked.

## Images

Replace the giveaway visuals with accurate, correctly-labelled vehicle imagery so the section reads as legitimate: a Model 3 image for the Model 3 campaign and a Cybertruck image for the Cybertruck campaign, stored as local assets like the inventory images (no mismatched stock photos).

## Technical notes

- Migration: `public.giveaways` (title, description, prize, image_url, entry_fee numeric, ends_at, max_entries, entries_count, badge, sort_order, is_active, timestamps) and `public.giveaway_entries` (giveaway_id, user_id, amount_paid, status, created_at, unique per user+giveaway unless multiple entries are allowed). Grants + RLS: anon/authenticated read active giveaways; users read their own entries; admins full access via `is_admin()`. Seed the two current campaigns with fees 200 and 500.
- Payment goes through one security-definer RPC, `enter_giveaway(_giveaway_id uuid)`, mirroring `purchase_investment_plan`: locks `user_balance`, validates active/not ended/not full/sufficient `available_balance`, deducts the fee, inserts the entry, increments `entries_count`, and inserts a `balance_transactions` row of type `giveaway`. All-or-nothing, so no giveaway can be entered without a real debit — this single function is what makes every future giveaway automatically wallet-connected.
- Frontend: `GiveawaysSection.tsx` loads from the `giveaways` table (keeping the current cards as instant-paint fallback) and calls the RPC through a shared entry modal built on the existing `useWallet` hook in `src/components/investor/wallet.ts`, so balances refresh live via the existing realtime channel.
- Dashboard entries panel added to `src/pages/investor-dashboard.tsx`; ledger already renders `balance_transactions` rows, so `giveaway` debits appear with no extra work.
- Admin giveaway view in `src/pages/admin-overview.tsx` switches from local state to Supabase reads/writes, with image upload reusing the inventory image upload pattern.
