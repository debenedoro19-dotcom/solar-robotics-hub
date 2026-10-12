# Make Trade Tesla findable on Google

## Goal
People searching for investment platforms and Tesla vehicles should be able to find tradeenergyhub.com in Google results.

## Current state
- `robots.txt` already allows Google and other search engines — good.
- There is **no sitemap**, so Google has no map of the site's pages.
- Pages have **no individual search titles or descriptions**, so Google shows generic or missing text in results.
- The home page already has a social preview image (`og-image.jpg`).

## What I'll do

### 1. Search titles and descriptions on every public page
Add a unique title and description to each public page so Google shows proper results:
- Home — "Trade Tesla — Tesla Vehicles, Energy & Investment Plans"
- Inventory — vehicle listings
- Invest — investment plans
- News, Careers, Ecosystem, Payments, Book a Session, VIP Session, Terms, Privacy
- Sign-in and account pages stay simple (they don't need to rank)

### 2. Sitemap
Create `public/sitemap.xml` listing every public page with the real domain `https://tradeenergyhub.com`, and add a `Sitemap:` line to `robots.txt` so Google finds it.

### 3. Social preview tags
Each public page gets its own preview title/description; the home page keeps the existing preview image.

### 4. Google Search Console (you do this part)
After publishing, I'll give you the short steps to register the site in Google Search Console and submit the sitemap — this is what makes Google index the site quickly instead of waiting weeks.

## What this won't do
- It won't make the site rank on page 1 overnight — new sites take weeks to months to build trust with Google. Good titles, a sitemap, and Search Console registration are the correct foundation.
- No changes to how the site looks or works for visitors.

## Technical notes
- Per-route `head()` in each file under `src/routes/` (TanStack Start pattern).
- `public/sitemap.xml` + `public/robots.txt` update.
- Verified with a build plus browser check of page titles.
