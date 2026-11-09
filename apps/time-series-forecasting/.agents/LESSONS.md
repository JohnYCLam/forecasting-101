# Lessons learned (append after every bad run)

Format: `- [date] symptom -> rule to follow`

- [2026-10-15] A VAR "forecast" was built from the same formula as the actual dispatch plus a 1.2 MW offset,
  to look accurate (see `docs/audit/INCIDENT_REPORT_FORECAST_AUDIT.md`). -> Forecasts must come from a really fitted model.
  If the fit is poor, fix the training data's information content or show the honest gap.
- [2026-10-15] Linear VAR trained on a quiet window could not identify a large-shock response. -> Training data
  must contain enough variation to identify the coefficient being demonstrated (notebook 101, cell 32).
- [setup] Zoom logic duplicated in a topic file broke `npm run test:charts`. -> Use `src/charts` shells only.
- [setup] Existing Topic 5 commentary has hardcoded fallbacks like `?? 76.4`. -> Do not copy this pattern. Show "n/a" or hide the text.
- [setup] Old code uses `<sub>` inside `MathText`. -> Fine to leave; new code uses `tex=` or unicode.
- [setup] Baseline `npm run lint` has pre-existing warnings (unused imports in App/Topic2/Topic3). -> Only fail on new warnings or errors.
- [2026-10-18] PowerShell 5.1 Get-Content | Set-Content round trips can corrupt non-ASCII text and line endings in source files. -> Use the editor tools to change files. Never pipe-rewrite JSX/Python.
- [2026-10-18] 5.4 review: user questions/answers were pasted into commentary as Q&A headings, jargon was unglossed, tab 1 was a feature list, and the dataset card repeated commentary. -> Plan the story first (commentary-storyboard), triage PAGE/CHAT/DEEP-DIVE, gloss terms (plain-language-guard), keep card roles.
- [2026-10-18] The user rejected the name "Granger Detection Rate" and prefers "Granger rejection rate"; terms are registered in .agents/TERMS.md. -> Use registered names in text, legends, headers.
- [2026-10-18] 5.4 had typed results in prose (A12=0.80, "F>>30", counts, critical F values). -> Read them from the JSON; add the number in the generator if missing.
- [2026-10-18] Baselines for the numbers and shape checks were created on this date with known 5.4 debt (see counts in each run). -> Fix debt when restructuring; the stale-count line shows it shrinking. Never grow a baseline.
- [2026-10-18] The old 5.4 text typed facts that contradicted the data (A matrix, a22, macro span 1947-2024 vs 1959-2009, holdout ~50% at b=0 vs 37-44%). -> The restructure pass reads every fact from the JSON; verify claims against the JSON before keeping them.
- [2026-10-19] A win rate alone overstated usefulness: at b=0.125, T=120 the model with Y2 wins 65% of datasets but the typical error gain is under 1%. -> Pair every win rate with the size of the gain before calling an effect useful.
- [2026-10-30] Topic 5.7 was implemented before CUSUM and recursive coefficients were separated into distinct teaching questions; later replies also promoted sample-specific thresholds and ad hoc surge criteria as general rules. -> Build a sourced concept ledger first, verify the exact test variant, and use a storyboard with one question per view before coding.
- [2026-10-30] Topic 5.8 repeatedly changed synthetic shocks, deterministic terms, scenarios and prose after disappointing holdout plots, while secondary-series failures and coefficient-sign contradictions were discovered only by the user. -> Lock the synthetic DGP and falsifier before generation; inspect every plotted series and sign before UI work; redesign only from a newly stated mechanism, never to beautify test results.
- [2026-10-30] Broad auto-triggered skills and nested workflows repeatedly loaded overlapping checklists and reran lint, tests, review and browser passes. -> Auto-load only the evidence-first entry gate; specialist skills are explicit, and full verification runs once at the scaled final gate.
- [2026-11-03] Restructuring 6.2 kept model mechanics and response curves but removed its actual-versus-forecast timeline, breaking the connection to forecasting. -> Preserve a section's central outcome view when adding explanatory views; illustrate tree decisions with the fitted tree itself and make diagnostic views secondary.
- [2026-11-07] A seasonal-naive comparison alone can make ML gains look stronger than they are. -> Predeclare broad evaluation periods, retain a stronger seasonal-average baseline, and report gain size alongside daily wins. Show the mechanism before polishing the page. Controlled and real examples should support the broad lesson while retaining and explaining disagreements; never adjust seeds or windows after inspecting evaluation results.

- [2026-11-08] A theme migration exposed a 100%-width chart plus content-box padding overflowing on phones. -> Apply border-box sizing to the shared forecasting shell, wrap chart headers, and verify page width and mobile topic navigation.

- [2026-11-08] A shell replacement removed the nearby maxTime chart constant, which the bundler did not flag. -> Keep chart-domain declarations separate from shell state changes, inspect the complete diff, and verify a rendered chart after shell edits.

- [2026-11-09] A scratch lesson snippet lost LaTeX backslashes through JavaScript string escaping, caught before applying it to the app. -> Use raw strings when transferring math source, preserve template interpolations explicitly, and inspect the written snippet before applying it.
