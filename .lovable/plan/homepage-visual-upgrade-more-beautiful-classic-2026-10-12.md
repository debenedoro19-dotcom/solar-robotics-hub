# Homepage Visual Upgrade — More Beautiful & Classic

## Goal
Take the home page from a good snap-scroll layout to a genuinely cinematic, high-end experience — smoother motion, richer imagery treatment, and more refined typography — while keeping the Tesla-inspired minimalism and the existing light/dark theme support.

## What changes

### 1. Cinematic motion
- **Slow Ken Burns zoom** on each full-screen panel image (gentle scale drift over ~20s) so the page feels alive even when still.
- **Subtle parallax**: panel images move slightly slower than the scroll, creating depth between panels.
- **Smooth fade-up entrances** for headlines, sub-text and buttons as each panel enters view (staggered: label → title → text → buttons), replacing the current single flat fade.
- A thin **scroll-progress cue** (small animated chevron or line) at the bottom of the first panel inviting visitors to scroll.

### 2. Typography refinement
- Larger, lighter headlines with tighter letter-spacing on the big panels (closer to tesla.com's oversized titles).
- Uppercase micro-labels (spaced-out small caps) above each panel title, matching the "Live Inventory" label style already on the video panel.
- Better text shadowing/scrim so titles stay crisp over bright areas of photos in both light and dark imagery.

### 3. Imagery & video polish
- Regenerate/upscale the panel images that look soft, and add a subtle vignette + bottom gradient so buttons and metrics always sit on a calm, readable band.
- Video panel: keep the 3K inventory video, add a gentle fade-in when it starts playing so there's no jarring pop from poster to video.

### 4. Buttons & metrics bar
- Refine the rounded pill buttons: frosted-glass ghost button with a hairline border, solid button with a soft hover lift — smooth 300ms transitions.
- Metrics bar under the video gets frosted-glass treatment (thin top/bottom hairlines, more breathing room).

### 5. Investment section on home
- Give the investment packages section on the home page a cleaner lead-in: small caps label, calm heading, generous spacing — matching the new panel rhythm.

## What stays the same
- Same panels, same links, same video, same content — this is a visual/motion upgrade only.
- Light/dark theme, header, footer, and all other pages untouched.
- No new paid features, no content changes.

## Technical notes
- All changes in `src/styles.css` (new animation/utility classes) and `src/pages/home.tsx` (structure hooks for the animations); possibly regenerate 1–2 soft images via image generation.
- Animations use CSS transforms/opacity only (GPU-friendly, no layout jank); `prefers-reduced-motion` respected so motion-sensitive users get a static page.
- Verify with a browser pass on desktop and mobile widths, light and dark mode, and confirm the build stays clean.
