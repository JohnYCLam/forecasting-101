# Tasks: continuous Chapter 6 learner progression

Source: `docs/topic6/CHAPTER_6_LEARNER_PROGRESSION_PLAN_2026-11-07.md`.
Status: implemented after the user's subsequent authorization. Verification and measured limitations: `docs/topic6/CHAPTER_6_IMPLEMENTATION_2026-11-07.md`.

## Scope choices

- Keep one German-load fixed-origin, whole-horizon task across the main sequence.
- Add SVR as 6.2; move progressive tree teaching to 6.3.
- Merge recursive error propagation and historical-only remedies into 6.4; retain uncertainty as 6.6.
- Retain 6.5 as a dedicated extrapolation section: definition, model-specific failure mechanism and evaluated remedies.
- Exclude post-origin updates from strategy comparisons. Compare frozen-information forecasts, with fitting/tuning/correction labels available by the same cutoff.
- Require useful validated forecast improvement, not a manufactured strict ranking of every learner.

## Tasks

- [x] T1 Freeze a shared forecasting and evaluation contract.
  - Files: chapter plan; shared data-protocol helper; evidence notes.
  - Accept: dataset, 30-day candidate horizon, features, label eligibility, fit histories, comparison origins, scoring objective and tuning budgets are recorded before comparing new candidates. Prior-examined periods are not claimed as untouched tests.
  - Verify: audit representative source/target dates, including long horizons and overlapping origins; record the development/reserved-evaluation split.

- [x] T2 Run a read-only model feasibility study before revising the page.
  - Files: focused experiment script and evidence report outside product components.
  - Accept: genuine seasonal naive, linear regression, scaled SVR, single tree, Random Forest and XGBoost use identical information and target tasks. Report validation gains, variation and measured fit cost; no preassigned model ordering.
  - Verify: independently recompute metrics from predictions, compare baseline reuse, inspect all paths and test unavailable-future perturbation invariance. If no useful ML gain is supported, return a concrete dataset/task recommendation before producing a victory narrative.

- [x] T3 Generate shared fitted evidence and learner explanations.
  - Files: generator/shared helper(s), `public/topic6_data.json`, focused validators.
  - Accept: common paths/scores drive 6.1–6.3; training-only scaling for SVR; actual tree routes, constituent forest means and boosting corrections reconcile; model settings selected outside final tests.
  - Verify: repeat deterministically; compare forecast row provenance, trace calculations and per-origin/horizon metrics. Do not substitute in-sample teaching fits for the evaluated model without labelling the distinction.

- [x] T4 Rebuild the baseline → SVR → tree learning sequence.
  - Files: `src/Topic6Intro.jsx`, focused Topic 6 section components, navigation titles.
  - Accept: 6.1 closes with the supported baseline comparison; 6.2 changes the learner while retaining the task; 6.3 motivates splits, resampling/averaging and sequential correction from concrete pain points. The primary outcome remains an actual-versus-forecast timeline.
  - Verify: follow the same origin and record across sections; ensure every factual performance claim agrees with both primary and secondary scores; check explanatory visuals and controls in Chrome.

- [x] T5 Combine forecast strategies with error propagation in 6.4.
  - Files: multistep/correction evidence helper, JSON and section component.
  - Accept: both strategies issue the whole horizon at one original time; recursive step-2 inputs use predictions, never future actuals. Compare pros/cons, conditional use cases, eligible training differences and measured costs. Add full-rollout model selection and a rectify-style historical-error correction; do not rely on forecast updating or a universal direct-model advantage.
  - Verify: reconstruct complete input rows and historical out-of-sample error targets. Assert every correction label date is at or before the real fit cutoff and no displayed final-test error trains/selects the corrector. Compare recursive, pooled/direct and corrected recursive forecasts across fixed origins/horizons. Report raw-versus-corrected gains/losses and extra fit cost. Any deliberately perturbed diagnostic is excluded from rankings.

- [x] T6 Retain and develop dedicated 6.5 Extrapolation.
  - Files: trend/extrapolation helper, JSON and dedicated section component.
  - Accept: define prediction beyond the training input domain; explain failure for the chosen raw-level ML representation without claiming all ML fails; show training-only detrending, remainder prediction and level reconstruction against a suitable trend-and-seasonality baseline. Keep the cutoff identical across remedies.
  - Verify: audit trend-fit dates, genuine earlier residual lags, all model forecasts and reconstruction sums. If using the locked synthetic trend demonstration, label the dataset change/purpose and do not compare its scores numerically with German-load results. Retain actual baseline wins and changed-slope limitations.

- [x] T7 Add uncertainty for the same fixed-origin forecasting task in 6.6.
  - Files: quantile/calibration helper, JSON and final uncertainty component.
  - Accept: point path remains visible; fit/tuning/calibration/evaluation are chronologically defined; calibration unit, per-horizon or pooled policy and sample counts are explicit. No silent reuse of one-step inputs or outputs.
  - Verify: reconstruct one interval/adjustment; independently count coverage, width, misses and proper interval score by declared grouping; inspect both coverage levels. Distinguish marginal, path-wide and realised coverage.

- [x] T8 Consolidate navigation and documentation; verify once.
  - Files: Topic 6 navigation/components, README, dated plan/evidence report.
  - Accept: six coherent sections; dedicated extrapolation clearly distinct from recursive feedback; point-error correction clearly distinct from interval calibration; technical tables in appropriate details; no duplicated algorithm tour, forecast updates in the fixed-information comparison or universal improvement claims.
  - Verify: appropriate application checks, forecast integrity and deterministic evidence checks; commentary review includes extracted components. Chrome checks all changed controls, timelines, both themes and mobile. Record unresolved limitations honestly.

## Final gate

- [x] Reader can explain why each next method is introduced and what changed experimentally.
- [x] Useful forecast improvement is visible and supported by the predefined evaluation; failures and metric disagreements remain visible.
- [x] Same information, origin, target and horizon carry through the main model comparisons.
- [x] One evidence-based verification report identifies completed checks and limits.
