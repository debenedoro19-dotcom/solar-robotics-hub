# Deploy Tesla Trade Website

## Goal
Publish the current Tesla Trade website to its public Lovable URL.

## Steps
1. **Security scan check** — run `security--get_scan_results` to confirm there are no unresolved critical findings that would block publishing.
2. **Publish** — call `preview_ui--publish` to start the deployment.
3. **Confirm live URL** — once the deploy starts, share the expected public URL and any first-publish reminders (renaming the Lovable URL, connecting a custom domain).

## Notes
- This is a first-time publish, so the site will become visible at the Lovable-managed public URL according to the workspace's default publish visibility.
- Frontend changes require clicking "Update" in the publish dialog to go live; backend/database changes deploy automatically.
- A custom domain can be connected afterward in Project Settings > Domains or via the Publish dialog.
