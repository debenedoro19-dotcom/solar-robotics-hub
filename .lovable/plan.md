# Fix Giveaway Entry & Plan Purchase Ledger Errors

## Diagnosis (confirmed in database)
The wallet ledger (`balance_transactions`) only allows these transaction types: `deposit`, `withdrawal`, `investment_return`, `investment_debit`.

Two wallet functions write types that are not allowed, so the database rejects them:
- **Giveaway entry** (`enter_giveaway`) writes type `giveaway` → the exact error in your screenshot.
- **Investment plan purchase** (`purchase_investment_plan`) writes type `investment` → same crash, would hit any user buying a plan.

## Fix (one small database migration)
1. Expand the ledger's allowed types to include `giveaway`, `investment`, and `admin_adjustment` (so future wallet operations like admin balance corrections never hit this wall).
2. No code changes needed — the functions, modals, and balances already work; only the database rule is too narrow.

## Result
- "Pay & Enter" on giveaways deducts the wallet balance and records the entry.
- Buying investment plans works end-to-end again.
- All future giveaways remain automatically connected to the wallet as you requested.

## Technical details
- Single migration: drop and recreate the `balance_transactions_type_check` constraint with the widened type list (`deposit`, `withdrawal`, `investment`, `investment_debit`, `investment_return`, `giveaway`, `admin_adjustment`).
- No tables, policies, or app code change; existing rows are untouched.
