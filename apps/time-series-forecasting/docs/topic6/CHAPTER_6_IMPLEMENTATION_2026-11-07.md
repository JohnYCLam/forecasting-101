# Chapter 6 implementation and verification

Date: 2026-11-07. Implements the approved six-section learner progression. Replaces the previous 6.2 tree tour / 6.3 classical-model arena / rolling one-step uncertainty sequence.

## Teaching changes

| Section | Reader's question | Implemented evidence |
|---|---|---|
| 6.1 Linear regression | How do records become a forecast, and is the preparation worthwhile? | Retained the four-step introduction, complete records, fitted weights, leakage example and feature comparisons. Added the shared origin selector and a broader baseline comparison. |
| 6.2 SVR | Can a different nonlinear learner improve the same task? | Same 16 inputs and targets; genuine fitted support-vector contributions, training tolerance, whole-horizon forecast and across-origin evaluation. The tolerance is explicitly not a prediction interval. |
| 6.3 Trees and ensembles | What changes when we learn rules, average trees, or add corrections? | A readable actual tree route, collapsed alternative branches, all 80 forest constituents, actual XGBoost stages, and forecast comparisons against the same baseline. |
| 6.4 Forecast strategies | How does prediction feedback change inputs, errors and method choice? | Complete pooled and recursive rows, input provenance, forecast and horizon-error views, conditional pros/cons, full-rollout parameter selection and a historical point-error corrector. No post-origin updates. |
| 6.5 Extrapolation | Why does this tree representation plateau, and how can a trend help? | Retained the explicitly separate fixed-seed simulation, boundary routing, training-only detrending, reconstruction and linear trend-plus-weekday comparator. |
| 6.6 Uncertainty | What does a range add, and what does better inclusion cost? | The exact same-origin XGBoost point path from 6.3, quantile boundaries, horizon-specific historical widening, a residual comparator and coverage/width/miss/interval-score evaluation. |

Navigation follows this sequence. The shared origin survives section changes; changing the 6.1 forecast origin preserves the teaching tab. Detailed methodology lives in Dataset Details. Chart legends now wrap outside the plot so mobile axis labels stay readable.

## Frozen shared experiment

- German daily electricity load, average MW, from the existing OPSD / ENTSO-E source. Solar and wind inputs are origin-day observed energy, MWh. Origin-day measurements are assumed available after that day ends; publication delays are not simulated.
- Entire 30-day forecast issued at one origin. Observed inputs stay frozen; target calendar and horizon are known. No realised future weather, load or renewable observations enter a forecast.
- The legitimate 6.1 full feature set is reused verbatim: six origin-relative load lags, two recent means, weekday sine/cosine, weekend flag, observed solar/wind, and three horizon columns. `lag_1` means origin load; `lag_7` means six days before the origin, not the target's previous week.
- Training origins span one year, sampled every two days. An origin is eligible for the pooled fit only once all its 30 labels are known. There are 168 origins / 5,040 tasks per pooled fit. Repeated targets and overlapping histories are dependent; task count is not independent sample size.
- Settings selected by mean MAE at development origins 2019-01-01, 2019-04-01 and 2019-07-01. OLS has one configuration; SVR four; tree, forest and XGBoost two each. Feature/target scaling is fitted on training records only. Forest has 80 trees; boosting has 100 stages. Fixed seed 42.
- Five display origins: 2019-09-30, 2019-12-15, 2020-03-01, 2020-05-15 and 2020-08-01. These periods were previously explored; they are illustrative evaluation, not untouched independent tests. They did not select the new configurations.
- The seasonal-naive path cycles the last seven observed daily loads across the full horizon. The forecast always preserves weekday alignment.

The pre-fit contract, pilot and browser artifacts are in `../experiments/section6_progression_2026-11-07/` relative to the app. Committed `scripts/generators/topic6_model_selection.json` includes the development candidates and outcomes.

## Measured learner results

These are means of the five per-origin metrics; mean RMSE is not the RMSE of one pooled error vector. Fit times are measured on this machine and are diagnostic, not portable benchmarks.

| Learner | Mean MAE, MW | Mean RMSE, MW | Mean fit, seconds |
|---|---:|---:|---:|
| Repeat last week | 3,293.4 | 4,642.5 | 0.000 |
| Linear regression | 3,596.4 | 4,796.1 | 0.006 |
| SVR | 3,379.9 | 4,337.8 | 0.445 |
| Decision tree | 3,129.6 | 4,124.9 | 0.006 |
| Random forest | 3,082.4 | 4,164.2 | 0.249 |
| XGBoost | 3,582.0 | 4,590.0 | 0.056 |

Forest improves mean MAE by 6.4% versus seasonal naive and 14.3% versus linear regression. The single tree has lower mean RMSE than the forest. SVR improves both metrics versus linear regression but loses MAE to naive; XGBoost is not the final winner. On the original September window, OLS still beats naive in MAE and loses in RMSE. The page retains these disagreements rather than asserting a universal algorithm ladder.

## Recursive correction

The one-step recursive fit has 182 eligible tasks, while the pooled horizon-conditioned fit has 5,040 tasks. They share the observation cutoff and history policy but have different objectives and eligible rows. Both are single fitted XGBoost models; the pooled version is not 30 separate direct models.

Recursive settings are selected by complete 30-step MAE on the same three development dates. At each final origin, reconstruct 24 historical recursive paths at 14-day spacing, with each historical fit excluding later targets. Use the 720 already-observed historical point errors to fit a standardized ridge corrector (linear regression with coefficient shrinkage). It uses horizon, known weekday, origin load/recent mean and base prediction. Internal selection trains on error labels through T−100 and validates on later historical origins, all ending before T. Final error fitting then uses all eligible historical errors. Corrections are applied after the base rollout and do not feed back into it.

| Final origin | Pooled MAE | Recursive MAE | Corrected MAE | Historical validation supports correction? |
|---|---:|---:|---:|---|
| 2019-09-30 | 2,665.8 | 1,300.4 | 1,336.8 | No |
| 2019-12-15 | 6,214.7 | 7,402.2 | 5,988.2 | Yes |
| 2020-03-01 | 2,456.0 | 2,809.8 | 2,455.4 | Yes |
| 2020-05-15 | 4,577.8 | 2,046.1 | 2,217.8 | No |
| 2020-08-01 | 1,995.7 | 3,681.9 | 3,067.9 | Yes |

The full recursive-remedy evidence generation costs about 1.5–1.6 seconds per origin, including historical fits. The page shows the candidate even when historical validation does not support adoption; it says so explicitly. Correction is a tested option, not an unconditional recommendation.

Historical reconstructions reuse the configuration selected using data available before the final issue date, including historical dates earlier than its selection. They are not archived real-time forecasts or a fully nested historical tuning backtest. The same disclosure applies to interval reconstruction. No final-test targets select or train these adjustments.

## Prediction ranges and plan adaptation

The proposed standard split-CQR would hold out a separate calibration period from the final point fit. To preserve the exact all-eligible-data point model already compared in 6.3, this implementation instead uses empirical rolling-origin calibration. Each historical origin refits the fixed configuration using its eligible prefix, generates a full 30-step point/quantile path, and supplies errors only after all targets have occurred. There are 24 calibration observations per lead. All calibration targets are at or before the final origin.

Separately fitted quantiles are ordered if they cross. For each lead and nominal level, order the scores `max(lower − actual, actual − upper, 0)` and use rank `ceil((n+1) × nominal)` (required to be no greater than n for the supported levels). Subtract the selected nonnegative score from the lower bound and add it to the upper bound. This design only widens; it does not implement signed shrinking. A comparator uses symmetric historical absolute-point-error margins separately by horizon. Neither procedure receives post-origin observations.

| Nominal | Method | Coverage | Mean width, MW | Misses / targets | Mean interval score, MW |
|---|---|---:|---:|---:|---:|
| 80% | Raw quantiles | 71.3% | 8,731.1 | 43 / 150 | 17,309.9 |
| 80% | Historical widening | 77.3% | 9,413.1 | 34 / 150 | 17,309.8 |
| 80% | Historical residual margin | 72.0% | 7,728.7 | 42 / 150 | 19,289.0 |
| 90% | Raw quantiles | 89.3% | 14,664.0 | 16 / 150 | 19,043.7 |
| 90% | Historical widening | 92.0% | 16,507.6 | 12 / 150 | 19,577.2 |
| 90% | Historical residual margin | 87.3% | 14,360.1 | 19 / 150 | 26,676.5 |

At 90%, widening increases coverage and worsens interval score: width has a real cost. These are realised forecast-target-pair summaries, not a simultaneous 30-day guarantee or 150 independent trials. Dependent overlapping tasks, reused selected settings and distribution changes preclude the standard split-conformal finite-sample guarantee. The UI names this empirical historical calibration and makes the limitation explicit.

## Verification report

Files changed:
- `src/Topic6Progression.jsx`: shared SVR, tree, strategy and uncertainty teaching views.
- `src/Topic6Sections.jsx`: retained extrapolation and shared display helpers; removed obsolete sections and fixed legend wrapping/tree labels.
- `src/Topic6Intro.jsx`, `src/Topic6.jsx`, `src/App.jsx`: baseline continuity, persistent origin and navigation.
- `scripts/generators/topic6_progression.py`, `topic6_model_selection.json`, `regenerate_topic6_progression.py`: genuine shared fits, traces, historical corrections/calibration and integrity checks.
- `scripts/generators/generate_topic6_data.py`: canonical generator uses the shared pipeline; former partial regeneration entry points now refuse to overwrite the shared schema.
- `public/topic6_data.json`: regenerated, 667 KiB, no nonfinite values.
- `README.md`, chapter plan and task checklist: current teaching sequence, regeneration and evidence links.

Acceptance evidence: the fitted forecast paths and arithmetic support the story; forest offers a useful mean improvement while losses remain visible. Actual tree leaves, forest means, SVR contribution sums, recursive step-2 predicted lags, correction sums and all label cutoffs reconcile. Perturbing every unavailable future load/solar/wind value leaves training records, labels and forecast inputs unchanged.

Commands:
- `npm run lint`: PASS; ten pre-existing warnings outside the new components.
- `npm test`: PASS; 11 chart-unit tests and the chart-architecture check (including all extracted components).
- `npm run build`: PASS; existing large-bundle warning remains.
- `validate_forecast.py public/topic6_data.json --max-kb 1024 --require-keys tab1.origins,tab5,progression.shared,progression.strategies,progression.ranges`: PASS.
- `regenerate_topic6_progression.py --check`: PASS; all shared, correction and interval evidence refitted and reproduced. Measured fit seconds are intentionally excluded from equality.
- `audit_export.py`: PASS; independent arithmetic verifies all 150 baseline/shared point targets, aggregate errors, horizon curves, interval counts/scores and trend reconstruction.
- Extended `check-commentary-numbers.mjs`: PASS; 20 total heuristic hits, zero new.
- Extended `check-commentary-shape.mjs`: PASS; six baseline hits, zero new. The unchanged guards run in memory with coverage extended to extracted Topic 6 components; no baseline edits.
- Instruction/reference review: PASS; historical reports retained, current sequence and regeneration documented. No new dependency or notebook-parity claim.
- Chrome: development audit passed 96 screenshots, 335 control selections, five origin-retention cases and zoom/pan checks in all six sections. No JavaScript, console, resource or horizontal-overflow failures. After the legend adjustment, the production audit also passed all 96 views, 335 selections, five origin-retention cases and six-section zoom/pan checks, with no JavaScript exceptions or horizontal overflow. Representative desktop/mobile screenshots were inspected directly. Its sole failed resource/console message is the pre-existing local Vercel analytics endpoint (`/_vercel/insights/script.js`, 404); forecasting data and UI resources load successfully. Artifacts: `../experiments/section6_progression_2026-11-07/browser_production/report.json` and adjacent screenshots. The review preview is running at http://127.0.0.1:5185/.

Plan items completed: T1–T8. The temporary development server was stopped after verification; the production preview remains available for user review.

Deviations from plan: empirical rolling-origin widening replaces proposed split-CQR/signed shrinking to retain the exact point fit; historical reconstruction reuses the current development-selected configuration; no untouched-test claim; obsolete SARIMA arena removed to keep the agreed continuous learner progression. No VARIMA performance comparison is claimed.

Open questions: none requiring implementation input. Scientific limits remain explicit: a small previously inspected evaluation panel, dependent tasks, no reporting-delay simulation or comprehensive hyperparameter search, correction gains that can fail, and no coverage guarantee under shift.
