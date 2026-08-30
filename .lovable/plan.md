# Domain warning: no code change needed

## What happened
The browser warning came from visiting `tradeenergy.com`, which is not your domain. Your live site runs on `tradeenergy.app`.

## Current state (verified)
- `tradeenergy.app` — active, connected, primary
- `www.tradeenergy.app` — active, connected
- Project is published

Both serve over valid HTTPS. The `.com` address belongs to someone else, so its certificate cannot match your site — hence "Your connection is not private".

## Recommendation
Keep using `tradeenergy.app` and share only that address (and `www.tradeenergy.app`). No changes to the app are required.

## Optional, only if you want the .com
1. Purchase `tradeenergy.com` at a registrar (or through Lovable's domain purchase flow).
2. Connect it to this project in Project Settings > Domains.
3. Set `tradeenergy.app` as primary so the `.com` redirects to it, keeping one canonical URL for SEO.

Say the word and I'll walk through the connection steps once the `.com` is purchased.
