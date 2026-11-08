# Tasks: improve Sections 6.2–6.6

Source: `docs/topic6/SECTIONS_6_2_TO_6_6_REVIEW_PLAN_2026-11-03.md`.
Status: implemented on 2026-11-03 following the user instruction to execute the plan. Evidence: docs/topic6/SECTIONS_6_2_TO_6_6_IMPLEMENTATION_2026-11-03.md.
Skills during execution: evidence-first-demo-design, forecast-data-integrity, demo-correctness-review, commentary-storyboard/style, plain-language-guard, chart-design-for-teaching as needed, visual-check, verify-and-report. Load only the current task's relevant instructions.

## Open questions

No input is required to review this proposal. Recommended scope choices: keep five sections; keep synthetic mechanisms in 6.2/6.5; disclose rolling one-step tasks in 6.2/6.6; compare practical pipelines in 6.3; move feature importance and the full-course decision guide out of the main reading path. These scope choices were implemented under the subsequent execution instruction.

## Tasks

- [x] T1 Lock forecasting and evidence contracts for all five sections.
  - Files: review plan; `scripts/generators/generate_topic6_data.py`; relevant reference-data metadata, read only.
  - Details: record origin, label availability, fit history, supplied future covariates, update policy, model variant and baseline; predeclare repeated-origin evaluation and any new validation windows.
  - Accept: each comparison has an explicit purpose; unequal pipeline inputs are disclosed; overlap is not counted as independent evidence; existing synthetic seeds/DGPs are preserved unless a newly justified design is approved.
  - Verify: trace representative first/last training labels and test inputs to source timestamps; compare exported protocol with the plan.

- [x] T2 Make 6.2 predictions and mechanisms match the displayed setting.
  - Files: generator (gen_tab2 or focused helper), `public/topic6_data.json`, focused generator validation.
  - Details: fit ordinary linear baseline; export fitted tree path, actual forest constituents, genuine boosting stages and controlled responses. Export per-setting paths only if retaining complexity controls. Rename presets without unsupported overfit labels.
  - Accept: complete prediction traces reconcile; the same fit drives response, path and score; daily observed-input/temperature assumptions are recorded.
  - Verify: recompute selected predictions and metrics; assert each trace sum/mean matches its model; check held-out evidence before describing overfitting.

- [x] T3 Repair 6.3 comparison and importance evidence.
  - Files: generator (gen_tab3), JSON, focused validation; plan annotations if evidence changes.
  - Details: disclose/align history and feature differences, export fit status, remove silent SARIMA relabelled fallback, compute named-model gains. Remove main-flow importance; recompute only if retaining an optional chronological held-out analysis.
  - Accept: no unseen label enters training; no claimed held-out analysis is trained on its evaluation rows; no hindsight-best gain is presented as a deployable result; event labels do not substitute for evidence.
  - Verify: audit cutoffs and exact fit inputs per fold; recompute gains from paths; induce/inspect fit-failure handling without silently substituting another model. If importance retained, confirm separate dates/models and repeated/grouped permutation scope.

- [x] T4 Add an honest 6.4 rollout and repeated-origin comparison.
  - Files: generator (gen_tab4), JSON, focused validation.
  - Details: export observed/predicted input provenance for steps 1/2 (7 optional); name pooled horizon-conditioned vs recursive correctly; evaluate predeclared origins and derive per-lead averages/sample counts.
  - Accept: recursion appends only its own predictions after cutoff; pooled history stays frozen; individual absolute errors remain distinct from averaged MAE; target dates derive from origin+h; eligible training differences are explicit.
  - Verify: reconstruct step-2 inputs and selected predictions; independently aggregate errors by origin/horizon; compare narrative with every model's actual curve, including crossings or decreasing errors.

- [x] T5 Correct 6.5 residual history and rebuild the transformation comparison.
  - Files: generator (gen_tab5), JSON, focused validation.
  - Details: replace residual wrapping with correctly aligned historical lags; fit trend on training observations; export reconstruction examples and accurate counts; add a trend-plus-weekly-seasonality baseline.
  - Accept: no early training lag references a later date; no test value estimates the trend; predictions are genuine fitted outputs; previous 1.96 MAE/91.5% reduction is not a required result.
  - Verify: audit earliest residual-lag timestamps; reconcile trend+remainder with predicted level; recompute all displayed metrics and compare against the suitable baseline.

- [x] T6 Make 6.6 coverage evaluation and calibration transparent.
  - Files: generator (gen_tab6), JSON, focused validation.
  - Details: export quantile/calibration worked example, correction sign, rolling one-step protocol and all 274 dates; use a matched held-out fixed-width comparator. Add period diagnostics/interval score only if used by the final story.
  - Accept: nominal vs observed coverage distinguished; negative adjustments remain honest; full-period miss counts reconcile with full daily data; interval order and finite values checked; no arbitrary pass threshold replaces nominal coverage.
  - Verify: independently count misses/mean widths and recompute calibration rank/offset; reconcile one adjustment example; check 80% and 90% results without assuming calibration improves test coverage.

- [x] T7 Rebuild the 6.2 story and view sequence.
  - Files: `src/Topic6.jsx` or a focused section component, `src/App.jsx` only if titles change, relevant style utilities only if needed.
  - Accept: tree → forest → boosting → evaluation; new terms have plain explanations; selected examples use real fitted traces; no stale path or unintroduced Ridge dependency.
  - Verify: in Chrome trace one input to its leaf/ensemble/staged prediction; exercise each retained setting and confirm paths, scores and commentary all agree.

- [x] T8 Rebuild the 6.3 story and view sequence.
  - Files: Topic 6 component(s), navigation title if changed.
  - Accept: cutoff → one forecast → repeated dates → interpreted failure; default overlay is legible; full leaderboard optional; no unsupported COVID attribution or identical-input claim.
  - Verify: read in order using only earlier-section knowledge; inspect all five origins and MAE/RMSE; confirm selection is predefined rather than retrospectively choosing each winner.

- [x] T9 Rebuild the 6.4 story and view sequence.
  - Files: Topic 6 component(s), navigation title if changed.
  - Accept: earlier pooled method → recursive records → forecast paths → repeated-origin errors; no universal direct-vs-recursive rule, forced increasing-error description or 30-model compute claim.
  - Verify: follow observed/predicted provenance in the visible records, check active origin/model, inspect both families and reconcile dates/curves with the new payload.

- [x] T10 Rebuild the 6.5 story and view sequence.
  - Files: Topic 6 component(s), `src/App.jsx` for the trend/extrapolation name.
  - Accept: continuing trend → routing limitation → trend/remainder reconstruction → comparison/limits; no universal boosted target bound, “always detrend” prescription or fictitious trend break.
  - Verify: explain the displayed plateau without relying on the maximum line; reconstruct one forecast; inspect the appropriate classical/linear baseline and honest transformed result.

- [x] T11 Rebuild the 6.6 story and view sequence.
  - Files: Topic 6 component(s), navigation title if changed.
  - Accept: interval meaning → learned quantiles → held-out calibration → observed tradeoff/limits; no guarantee under arbitrary shift, universal rolling-window rule, reserve-cost claim or inaccurate summary of classical uncertainty.
  - Verify: compare raw/calibrated 80% and 90% intervals and miss counts; verify active-method flags; ensure exchangeability limits accompany the claim and the mobile chart remains interpretable.

- [x] T12 Complete cross-section reading, layout and verification pass.
  - Files: affected components/styles; README syllabus/status; dated evidence report; plan/task status.
  - Details: shorten repeated definitions, align section bridges/terms/lag conventions, move optional cards after primary evidence, remove internal pass-status UI, fix dark contrast and mobile chart/legend crowding. Preserve unrelated existing workspace edits.
  - Accept: every retained control has a visible teaching effect; one relevant view per story step; dates/units and protocol labels agree; 6.1 stays stable; documentation names only implemented models/methods.
  - Verify: run applicable lint/tests/build, chart gate and forecast-data validation once for the completed change set; run commentary checks and review changed warnings. Use installed Chrome for all story states and retained control states, both themes and mobile. Report actual model/data checks and remaining limitations, including unrelated analytics 404 if still present.

## Final gate

- [x] Five reader questions answered in each section: motivation, available information, prediction mechanism, visible evidence, scope/limits.
- [x] Statistical claims agree with primary sources and exact fitted variants.
- [x] Honest failures/crossings/undercoverage are retained and explained; no test-driven seed/window tuning to force a preferred winner.
- [x] One dated verification report distinguishes completed checks, skipped checks and unresolved evidence limitations.
