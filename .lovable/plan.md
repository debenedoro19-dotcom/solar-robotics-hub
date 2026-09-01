# Connect Namecheap Domain `tradeenergyhub.com` as Primary

## Goal
Add `tradeenergyhub.com` (managed at Namecheap) to this Lovable project and make it the primary custom domain, so visitors land there and the current `tradeenergy.app` domains redirect to it.

## Current State
- `tradeenergy.app` is the active primary domain.
- `www.tradeenergy.app` is active and redirects to the primary.
- The project is already published, so the new domain will serve content as soon as it is verified and set to primary.

## Steps
1. **Start domain connection in Lovable**
   - Go to **Project Settings → Project section → Domains** (or **Publish dialog → Add custom domain**).
   - Click **Connect Domain**.
   - Enter `tradeenergyhub.com`.
   - Note the verification values Lovable provides: an **A record** target IP and a **TXT record** for `_lovable`.

2. **Configure DNS at Namecheap**
   - Log in to Namecheap and open the DNS settings for `tradeenergyhub.com`.
   - Add an **A record**:
     - Type: A
     - Host: @
     - Value: the IP Lovable provides
   - Add a **TXT record** for verification:
     - Type: TXT
     - Host: _lovable
     - Value: the `lovable_verify=...` string Lovable provides
   - If you also want `www.tradeenergyhub.com` to work, add a second A record:
     - Type: A
     - Host: www
     - Value: the same Lovable IP
   - Save the DNS changes.

3. **Wait for verification**
   - Lovable will detect the records and move the domain through **Verifying → Setting up → Active**.
   - This can take up to 72 hours, but often completes within minutes to a few hours.

4. **Set `tradeenergyhub.com` as primary**
   - Once the domain is **Active**, open its three-dot menu in Lovable Domains and choose **Set as primary**.
   - Lovable will then redirect `tradeenergy.app` and `www.tradeenergy.app` to `tradeenergyhub.com`.

5. **Verify live behavior**
   - Visit `https://tradeenergyhub.com` and confirm the site loads.
   - Visit `https://tradeenergy.app` and confirm it redirects to `https://tradeenergyhub.com`.

## Notes
- Do not delete the existing `tradeenergy.app` domains; setting the new one as primary automatically handles redirection.
- If Namecheap is proxying the domain through Cloudflare, enable proxy mode during Lovable setup so verification uses CNAME instead of A records.
- SSL certificates are provisioned automatically by Lovable once verification succeeds.
