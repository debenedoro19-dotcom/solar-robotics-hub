# Fix "Your connection is not private" Warning

## Diagnosis (confirmed)
The screenshot shows Chrome's `NET::ERR_CERT_AUTHORITY_INVALID` on **https://tradeenergy.com**.
Your website is published and live on **tradeenergy.app** and **www.tradeenergy.app** — both are active with valid SSL. The `.com` domain is a different domain that you do not own, so Chrome correctly refuses it. There is no bug in the app and nothing to repair in code.

## Plan
1. **No code changes.** Verify nothing in the app links to `tradeenergy.com` (all internal links, emails, and SEO metadata use `tradeenergy.app`).
2. **Use the correct address:** always visit/share `https://www.tradeenergy.app`.
3. **Optional (requires your action, not possible from the editor):** if you want `tradeenergy.com` to also work, you must buy that domain from a registrar, then add it as a custom domain in Project Settings → Domains. Lovable will then issue a certificate for it. Until you own it, the warning cannot be removed.

## Notes
- Buying/pointing `tradeenergy.com` requires a paid Lovable plan for custom domains (you already have custom domains working, so your plan covers it) — no extra credits needed.
