# Publish Unified Deposit Changes

## Goal
Ship the recently completed deposit unification work to the live domain so users see the single admin-controlled cryptocurrency deposit flow.

## What changed
- Consolidated all deposit entry points to `/account/deposit`.
- Removed non-cryptocurrency payment submission; bank transfer and card now show redirect notices to cryptocurrency.
- Deposit records are admin-approved and credited to wallet balance.

## Deployment step
- Run a security scan check, then publish the project via Lovable.
- Frontend changes require a publish update to appear on the live custom domain.

## Verification
- Confirm the live site loads `/account/deposit` and shows only the functional cryptocurrency option.
