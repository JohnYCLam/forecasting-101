# Learning Hub

One static Vercel site with a shared topic homepage and independently maintained Vite apps.

This development checkout includes forecasting Sections 1–6 and calculus Sections 1–6. Main keeps forecasting Sections 1–5 and calculus Sections 1–6.

| Path | Topic |
| --- | --- |
| / | Topic selection |
| /time-series-forecasting/ | Forecasting |
| /stochastic-calculus/ | Stochastic calculus |

## Run and verify

Use Node.js 22.12 or later. No new application dependencies were introduced.

```sh
npm ci
npm test
npm run lint
npm run build
npm run dev
```

The root install runs each app’s locked installation. The root build assembles their outputs and the homepage into `dist/`. The preview command serves that assembled site at http://127.0.0.1:5198.

Both apps retain their own development commands inside `apps/<topic>/`. Forecasting assets and JSON requests use its deployment prefix. Calculus retains relative assets and its standalone offline preview.

## Branches

- `main`: forecasting Sections 1–5 and calculus Sections 1–6.
- `development/forecasting-section-6`: ongoing forecasting Section 6 and its reviews.
- `development/calculus-sections-6-plus`: calculus Sections 7–12 and their references.
- `archive/forecasting-working-2026-11-08`: the original forecasting working files captured before migration.

Development content is physically absent from the published branch, including its public datasets and section-specific references. Both development branches use the shared homepage and theme.

Main shows only roadmap labels for unpublished topics in each sidebar’s “Coming next” group. Existing drafts are marked “In progress”; later forecasting roadmap topics are marked “Planned”. These placeholders do not open lesson pages.

The homepage and both courses share `site/theme.css`, the line icons and saved light/dark preference in `site/theme.js`, and roadmap labels in `site/navigation.js`. The first visit follows the system theme; an explicit choice persists across pages and synchronizes across open tabs.

## Sources and local research

The calculus lesson is based on [Ji-Ha Kim’s Introduction to Stochastic Calculus](https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See `apps/stochastic-calculus/ATTRIBUTION.md` for the adaptation notice.

Local references, experiments, screenshots, and the calculus review/revision Markdown belong under `research-local/`, which is Git-ignored and never copied into the site. Existing external research folders remain in their original locations.

## Vercel

Keep the existing connected GitHub repository. Use the repository root, `npm ci` for installation, `npm run build` for building, and `dist` as output. `vercel.json` sets the framework to Other, supplies these commands, and canonicalizes directory URLs with a trailing slash.
