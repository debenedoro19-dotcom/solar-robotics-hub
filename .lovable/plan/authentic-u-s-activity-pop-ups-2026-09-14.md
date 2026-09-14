# Authentic U.S. Activity Pop-ups

## Goal
Replace the simulated withdrawal-only ticker with a privacy-safe activity feed backed by real completed deposits, active investments, and paid withdrawals.

## What will change

### 1. Verified U.S. activity data
- Add a U.S. state field to the existing KYC profile flow so state information is collected and validated against the 50 states plus Washington, D.C.
- Only include users whose approved KYC country is the United States and whose state is valid.
- Use real transaction type, amount, status, and timestamp from completed deposits, active investments, and paid withdrawals.
- Anonymize each customer as first name plus last initial; never expose email, account details, wallet addresses, or full names.
- If no qualifying activity exists, hide the pop-up rather than generating a fake event.

### 2. Secure public activity feed
- Add a small public server function that reads eligible activity on the server and returns only the anonymized fields required by the pop-up.
- Limit results to recent qualifying records and shuffle their display order without changing the underlying facts.
- Keep transaction tables private; no new anonymous database access to deposits, investments, withdrawals, KYC, or profiles.

### 3. Upgraded Tesla-styled pop-ups
- Replace the withdrawal-only message with three clear variants:
  - “James M. from Texas deposited $8,500”
  - “Olivia R. from California invested $12,000”
  - “Noah B. from Florida withdrew $4,250”
- Give deposits, investments, and withdrawals distinct icons and restrained semantic accents while retaining the existing Trade Tesla light/dark theme.
- Show the genuine relative time and a truthful status label such as “Deposit confirmed,” “Investment active,” or “Withdrawal paid.”
- Preserve dismiss behavior, animation, reduced-motion support, mobile sizing, and the existing frequency setting.

### 4. Admin settings
- Rename “Live Withdrawal Ticker” to “Live Activity Feed.”
- Explain that the feed uses anonymized, verified U.S. account activity.
- Keep the on/off and interval controls; use the amount range as a real-activity filter rather than a random amount generator.

## Technical details
- Apply the required schema update through a Supabase migration with existing grants and RLS preserved.
- Validate state values both when submitted and when activity is selected.
- Implement the public read through a TanStack server function with server-only privileged access and a strictly minimized response.
- Update the KYC form, activity settings types/defaults, pop-up manager, and admin copy only where needed.
- Verify the three event variants, empty-state behavior, light/dark presentation, mobile layout, and production build.
