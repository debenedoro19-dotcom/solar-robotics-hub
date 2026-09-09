# Trade Tesla — email branding & deliverability ops notes

## Final sender identity (do not mix domains)

| Item | Value |
| --- | --- |
| Display name | `Trade Tesla` |
| From address | `noreply@tradeenergy.app` |
| From (header) domain | `tradeenergy.app` |
| Verified sender subdomain (Lovable) | `notify.tradeenergy.app` |
| Website / links / images | `https://tradeenergyhub.com` |

Reason: SPF/DKIM are provisioned by Lovable on the delegated subdomain
`notify.tradeenergy.app` (NS: `ns3.lovable.cloud`, `ns4.lovable.cloud`).
DMARC alignment therefore works only with a From domain of `tradeenergy.app`.
BIMI must be published on the **From** domain — `tradeenergy.app`.

Code locations: `src/lib/email-templates/send-email.ts`,
`src/routes/lovable/email/auth/webhook.ts`,
`src/routes/api/public/auth-email-hook.ts`.

## DNS records to apply at the registrar (tradeenergy.app)

SPF/DKIM/MX for `notify.tradeenergy.app` are managed automatically inside the
delegated zone — nothing to add manually. Add these at the root zone:

1. DMARC (start in monitoring, then enforce):
   - Host: `_dmarc`
   - Type: TXT
   - Value (phase 1): `v=DMARC1; p=none; rua=mailto:dmarc@tradeenergy.app; adkim=r; aspf=r; pct=100`
   - Value (phase 2, after 2–4 weeks of clean reports — required for BIMI):
     `v=DMARC1; p=quarantine; rua=mailto:dmarc@tradeenergy.app; adkim=r; aspf=r; pct=100`
     then `p=reject` once stable.

2. Root SPF (only if the root domain also sends mail directly):
   - Host: `@` — TXT — `v=spf1 -all` (publishes "root never sends").

3. BIMI (inbox profile logo):
   - Host: `default._bimi`
   - Type: TXT
   - Value without VMC: `v=BIMI1; l=https://tradeenergyhub.com/.well-known/bimi/logo.svg;`
   - Value with VMC: `v=BIMI1; l=https://tradeenergyhub.com/.well-known/bimi/logo.svg; a=https://tradeenergyhub.com/.well-known/bimi/vmc.pem;`

## BIMI logo asset

- File: `public/.well-known/bimi/logo.svg` → served at
  `https://tradeenergyhub.com/.well-known/bimi/logo.svg`
- Format: SVG Tiny PS 1.2 (`baseProfile="tiny-ps"`, `<title>` present,
  square viewBox, solid background, no scripts/links/external refs).

## VMC (needed for Gmail to actually show the mark)

1. Register the logo as a trademark (USPTO/EUIPO/etc.).
2. Buy a Verified Mark Certificate from DigiCert or Entrust — they validate the
   trademark and the domain.
3. Host the issued `.pem` bundle at
   `https://tradeenergyhub.com/.well-known/bimi/vmc.pem` and add `a=` to the
   BIMI record above.
   Gmail requires DMARC at `p=quarantine`/`p=reject` + VMC. Apple Mail requires
   VMC too. Yahoo/Fastmail can show `l=` only.

## In-body logo

`src/lib/email-templates/email-brand.tsx` renders
`https://tradeenergyhub.com/tesla-logo-light.png` at a fixed 44×44 with alt text
"Trade Tesla logo". Every template in `src/lib/email-templates/` imports
`EmailHeader`, so all of them (signup, recovery, withdrawal-code,
account-notification, welcome, security-alert, invite, magic-link,
email-change, reauthentication) carry it.

## Verification checklist

- [ ] MXToolbox: SPF + DKIM + DMARC pass for `tradeenergy.app` and
      `notify.tradeenergy.app`.
- [ ] Mail-Tester: send a live template, score ≥ 9/10, all auth green.
- [ ] Google Postmaster Tools: `tradeenergy.app` verified, reputation monitored.
- [ ] `dig TXT default._bimi.tradeenergy.app` resolves; the SVG loads over HTTPS.
- [ ] Gmail + Apple Mail receipt test: header logo renders; avatar appears once
      DMARC is enforced and a VMC is in place.
