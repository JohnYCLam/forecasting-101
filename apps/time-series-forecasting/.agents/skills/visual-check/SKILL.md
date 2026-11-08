---
name: visual-check
description: Look at the running page in a browser to verify layout, charts, controls, commentary updates, both themes and mobile width. Use after any UI or commentary change, and inside /ship-check for UI changes. Lint and build cannot catch blank charts or unreadable text.
disable-model-invocation: true
---

# visual-check

## When to use
After any change to `src/*.jsx`, `src/index.css`, or to data a chart reads.

## Steps
1. Start the dev server in the background: `npm run dev` (from `ts-forecasting-demo/`). Read the printed local URL (usually http://localhost:5173).
2. Open the URL in the browser tool. Click the topic and subtab in the sidebar.
3. Default state: take a screenshot. Check:
   - [ ] page loads without a blank chart or "Loading..." stuck
   - [ ] guide card, dataset card, controls bar and chart are all visible
   - [ ] the key effect is visible at default settings
   - [ ] legend names are plain words; forecast region is distinguishable
   - [ ] no text overflowing or overlapping
4. Controls: test every changed control and each state affected by the change. For a new subtab or control architecture, test every control at least twice (min/max for sliders and each button). After each:
   - [ ] chart updates and is not empty
   - [ ] commentary text changes where the skill/plan says it should
5. Zoom: click zoom in, zoom out, reset; drag to pan. Chart must stay readable.
6. Theme: if styles, colors, charts, or layout changed, test light and dark. For text-only edits using existing styles, test the active theme and check for overflow.
7. Narrow width (about 400 px wide, via browser tools if available): required for layout/control changes and new subtabs; optional for text-only edits that stay within the existing card structure.
8. Browser console: check for errors (via browser tool or CDP console). Any red error = FAIL.
9. Stop the dev server when done.
10. Report: list of states checked, screenshots taken, failures found. Fix failures, recheck.

## If you have no browser tool
Write "VISUAL CHECK NOT DONE: no browser available", list the exact steps above for the user to perform, and do NOT claim the page works.

## Do not
- Do not say "looks good" without having taken screenshots.
- Do not skip the states required by the change scope above; most bugs hide at control extremes and responsive boundaries.
- Do not leave the dev server running.

## Done when
All checklist items PASS with screenshots, or NOT DONE is reported explicitly.
