# Layered Data Architecture Checklist Now Scrolls Cleanly with Sticky Column Headers

**30 April 2026**

AgileDataGuides today released a fix for two long-standing usability issues in the Layered Data Architecture Checklist: the matrix can now scroll vertically when it has more pattern rows than the viewport can show, and the layer column headers stay visible at the top of the matrix as users scroll down through the patterns.

## The Problem

Two paper-cuts compounded:

1. **No vertical scroll.** When a checklist had more pattern rows than the screen could fit, the bottom rows were silently cut off. There was no scrollbar and no way to navigate to the hidden rows. For the AgileData example (27 rows) on anything smaller than a 1080p monitor, real content was unreachable.
2. **Column headers scrolled out of view.** Even when scrolling did work (as it sometimes did inside the Context Plane), scrolling down through 20+ rows pushed the layer headers off the top of the screen. Users lost track of which column was which after a few rows.

## The Solution

The matrix now scrolls cleanly inside its bounds when content overflows the viewport, and the column headers (the layers) stay frozen at the top of the matrix area while the body scrolls. Click a row, scroll to the next, the headers stay put.

The dark App Header (Tier 1) and white toolbar (Tier 2) sit above the matrix and don't scroll — only the matrix area itself moves. Wheel, touch, scrollbar, keyboard — every scroll mechanism works.

## How It Works

The fix was a layout-mechanics change to the table wrapper in both the standalone and Context Plane versions:

- The wrapper around the table is now the dedicated vertical scroll container (`overflow: auto`, `flex: 1`, `min-height: 0`)
- The existing `position: sticky; top: 0` CSS on the `<thead>` cells now has a real scroll context to bind to, so headers stay stuck at the top of the visible matrix area
- The parent of the table wrapper is now a flex column with `overflow-hidden`, so the toolbars stay fixed at the top and only the matrix area scrolls

Verified live with end-to-end scroll tests on both versions: programmatic scroll moves cleanly from 0 to 200px, and the header `<th>` elements stay anchored at the top of the wrapper after scrolling.

## Key Benefits

- **All your patterns are reachable** — no more matrices where the bottom rows are silently invisible
- **Headers stay visible** — you always know which column you're filling in, no matter how far down you've scrolled
- **Toolbars stay fixed** — the App Header and Tier 2 toolbar don't scroll out of view
- **Same fix in both modes** — works identically in the standalone app and inside the Context Plane

The scroll fix is available now in the latest release.
