# Learning Hub workspace

This repository contains two independently built apps. Run shared build/test commands from this root. App-specific commands run from `apps/time-series-forecasting/` or `apps/stochastic-calculus/`.

Preserve existing forecasting instructions in `apps/time-series-forecasting/.agents/`. References there to `ts-forecasting-demo/` now mean `apps/time-series-forecasting/`. Shared presentation tokens live in `site/theme.css`; keep data, numerical algorithms, and chart interaction logic separate from styling.

Main publishes only forecasting Sections 1–5 and calculus Sections 1–6. Later material belongs on the named development branches. Do not restore development sections, datasets, source lists, or navigation links to main during a routine merge.

Forecasting development/review notes are preserved on its development branch. Local research material is ignored under `research-local/`. Local forecasting references and experiments are available under `research-local/forecasting/`; the reference directories are linked to the original files. Preserve the calculus author/source/license attribution on every branch.

Keep both development branches based on current main. After shared site or UI changes on main, merge main forward into both development branches, preserving each branch’s extra lessons, datasets, numbering and references. Validate each branch’s scope and build before publishing the branch updates.
