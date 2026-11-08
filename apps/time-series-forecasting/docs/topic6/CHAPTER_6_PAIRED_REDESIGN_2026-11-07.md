# Chapter 6: paired rental forecasting redesign

Date: 2026-11-07. Implements the user's dataset-redesign request, the requirement for a classical-model comparison, and the clarification that real results may disagree locally but should broadly support the controlled lesson. Supersedes the German-load experiment without deleting its historical evidence.

## Design decision and provenance

Use a controlled hourly rental simulation alongside the real [UCI Bike Sharing dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset). The original hourly CSV and README already exist in the course reference folder. The simulation has a declared seed and data-generating process; its forecasts come from fitted models, never from the generating formula.

The mechanism is that hourly demand profiles differ between working and nonworking days, while weather changes the scale of activity. The observed training-profile view makes that pattern visible in both cases. This is a descriptive real-data diagnostic, not a causal identification result. The [scikit-learn feature-engineering example](https://scikit-learn.org/stable/auto_examples/applications/plot_cyclical_feature_engineering.html) motivates the interaction mechanism; its task/weather availability differ, so none of its scores are reused.

The task intentionally changes from daily German load over a month to **all 24 hours of the next day**, issued after the last completed labelled hour at 23:00. Observed weather and recent activity are more useful for this shorter task; future realised weather remains excluded. Yesterday's matched-hour value is available for every lead. This input rule must not be extended beyond the next day without redesign.

Earlier candidates were retained rather than quietly replaced:
- The seven-day bike task with origin-only inputs failed against the four-week seasonal average: forest development MAE 41.31 versus 41.15 rentals/hour. Giving it the same observed seasonal references as the baseline produced only a modest improvement.
- The seven-day road-traffic candidate looked stronger on development data but gave mixed results across its frozen reserved year. Its complete evaluation remains in the experiment folder and did not become the main success example.
- The day-ahead bike task was then specified using 21 earlier development days, before opening its 2012 forecast scores. Both the controlled simulation and real task passed that development gate. Their full-year losses did not trigger retuning.

The full chronology, DGP constants, grids and falsifiers are recorded in `TASKS_6_DATASET_REDESIGN_2026-11-07.md`. Experimental source checks, selection files, predictions, logs and browser artifacts are in `../experiments/section6_dataset_redesign_2026-11-07/` relative to the app. Raw traffic downloads remain outside the app repository. No new dependency was installed.

## Frozen forecasting protocol

- Controlled source: seed 42, hourly working-day commute peaks versus a broad nonworking-day peak; persistent temperature/rain, independent daily activity variation, gradual adoption and Poisson counts. The exact rules were written before generation and were not changed after evaluation.
- Real source: Capital Bikeshare hourly counts for 2011–2012, 17,379 recorded hours. Reindex to clock hours; 165 slots are absent across the source period. Keep their answers missing. Past-only filling supplies historical inputs; it never manufactures evaluation answers.
- Shared predictors: origin count lags and recent means, origin component counts, known target calendar/horizon, observed yesterday/last-week/four-week reference hours, and origin-only weather summaries. No future component count or realised future weather enters a valid prediction.
- Trailing origin-history policy: 84 days. Pooled training issues daily next-day tasks; one-step training uses hourly origins. Their training target hours are the same. Pooled tasks have distinct answers, though histories and neighbouring hours remain dependent.
- Development: daily origins in three complete earlier weeks, July 31–August 6, September 30–October 6 and November 30–December 6, 2011. Select by mean daily MAE; retain RMSE too.
- Reserved evaluation: every daily origin from December 31, 2011 through December 30, 2012, at 23:00. The 366 paths cover 2012. Earlier evaluation days can enter later origins' training histories once observed; hyperparameters stay frozen and each issued next-day path remains unchanged.
- Evaluation targets: 8,784 simulated hours and 8,734 observed real hours. Missing real answers are excluded identically for every model, rather than filled with zeros or later measurements.
- Illustrations: four quarterly origins fixed before evaluation. Source/record/tree/strategy/range controls use those dates. A separate explicitly selected largest real loss supports diagnosis and remains in all year summaries.
- Candidate budgets: one ordinary linear model; four SVR configurations; two each for tree, forest and XGBoost; three smoothing variants; two each for seasonal ARIMA, seasonal VAR and regression-plus-ARIMA errors. No exhaustive-search or best-possible-family claim.

Models are fitted separately on each dataset, using the same task and feature definitions. The paired comparison is not transfer of the same fitted weights between datasets.

## Full-year point results

Values are **means of 366 daily MAEs/RMSEs**, in rentals/hour. They are not one pooled RMSE. All daily errors remain in the exported evidence and the full-year error view.

| Pipeline | Controlled MAE | Controlled RMSE | Real MAE | Real RMSE |
|---|---:|---:|---:|---:|
| Repeat last week | 49.15 | 71.06 | 61.36 | 87.83 |
| Four-week same-hour average | 42.08 | 60.54 | 51.74 | 73.43 |
| Linear regression | 48.83 | 62.75 | 57.03 | 74.27 |
| Support vector regression | 45.62 | 59.92 | 52.91 | 70.67 |
| Decision tree | 45.19 | 68.32 | 56.07 | 81.35 |
| Random forest | **38.76** | 57.34 | **48.50** | 70.23 |
| XGBoost | 41.82 | 60.09 | 50.23 | 72.16 |
| Linear + hour/workday interactions | 42.54 | **53.75** | 53.62 | **69.38** |
| Holt-Winters smoothing | 43.91 | 62.85 | 60.11 | 80.18 |
| Seasonal ARIMA | 66.67 | 95.23 | 62.16 | 87.76 |
| Seasonal VAR | 49.45 | 71.10 | 62.25 | 87.64 |
| Regression + ARIMA errors | 47.68 | 62.27 | 56.58 | 74.06 |

The forest's mean MAE gain over seasonal naive is **21.15% controlled / 20.95% real**. It wins 211/366 controlled days and 242/366 real days; median daily gains are 11.77% and 14.24%. Removing any single day leaves at least a 20.54% / 20.46% mean advantage, addressing the former result's dependence on one unusual window.

The stronger four-week average captures much of the benefit. Forest adds 7.91% / 6.25% mean MAE improvement over it and wins 192/366 / 191/366 comparisons. Against matched-predictor regression plus ARIMA errors, forest mean MAE improves by 18.72% / 14.27%. These are useful task-specific gains, not universal ML superiority. The interaction-engineered linear challenger has the lowest mean daily RMSE in both cases; metric disagreement stays visible.

## Classical comparison and fair interpretation

Section **6.3, tab 5: ML versus classical** retains the actual-versus-forecast graph and lets readers select the ML and classical pipelines. It includes current-day errors, full-year errors and measured fit-and-forecast time.

Smoothing and seasonal ARIMA use rental history. Seasonal VAR fits weekly differences of casual and registered rentals, forecasts both components without future observations, then sums their reconstructed levels. It is labelled Seasonal VAR rather than falsely claiming an arbitrary VARIMA specification.

The matched-input comparator fits the same ordinary regression predictors as ML, then an ARIMA model to its chronological residuals. It preserves missing hourly positions in those residuals. This is explicitly a **two-stage** regression-plus-ARIMA fit, not joint-likelihood SARIMAX estimation. Its purpose is to distinguish benefits from richer information from benefits of the nonlinear learner.

Every pipeline uses observations available by the same cutoff and the same scored targets. Different models use different representations/history buffers; the page discloses those differences. Initial weekly smoothing fits had numerical convergence problems, so the unchanged development grid was refitted after training-only scaling and a larger optimizer budget. All selected classical evaluation fits converge; no weak fallback was silently substituted.

## Real disagreement and its explanation

The inspected loss is the largest daily forest MAE loss against naive: origin **2012-11-25 23:00**, predicting November 26. Forest MAE is 87.39 versus naive 21.33 rentals/hour.

The recent daily mean is 101.00, versus 194.54 at the preceding-week origin; the recent weekly mean is 162.59 versus 222.02. The forest forecasts mean 143.51, while actual demand rebounds to 211.96. Last week's matching profile has mean 229.13 and is much closer. The page shows both paths and the source's holiday-week daily counts, including observed-hour counts.

This is a recent-level/shape mismatch rather than evidence that the whole learner advantage reverses. The real series contains patterns beyond the simulation's stable day-type/weather rules. The source association does not establish an isolated causal holiday effect. A retrospective weather-input sensitivity check barely changes MAE (87.39 to 86.46) and worsens RMSE; accordingly, the explanation does not simply blame unexpected weather. No diagnostic substitution was adopted as a forecast or added to rankings.

## Strategies, extrapolation and ranges

The paired next-day task carries through 6.4 and 6.6. Recursive inputs use predictions for later load history while seasonal references remain observed and weather stays frozen. Unknown component columns are omitted. Settings are selected by complete earlier rollouts.

Historical point-error correction uses 21 reconstructed daily origins, a chronological earlier/later split and a ridge corrector. All labels predate the current issue. It helps two controlled illustrations but worsens all four real illustrations, even when earlier validation supported trying it. The page keeps those losses, labels the corrector as a candidate, and explains the reliance on persistence of past error patterns. No claim of a guaranteed recursive-error cure is made.

Section 6.5 retains its separate, already locked rising-load simulation. Its MW errors are not pooled with rental errors. It distinguishes tree boundary behavior, XGBoost's lack of a universal original-target bound, train-only trend/remainder reconstruction and a competitive linear trend-plus-weekday baseline.

Section 6.6 preserves the exact selected-origin XGBoost point path, then adds quantile boundaries and empirical lead-specific historical widening. This uses 21 earlier daily origins, all after the latest development targets for the first illustration. Coverage, width, misses and proper interval score are independently checked. The range evaluation covers **four illustrated days / 96 hours per dataset**, not the complete point-forecast year. Serial dependence and refitting do not justify a standard split-conformal guarantee. Unconstrained fitted boundaries can extend below zero for counts.

At 80% nominal, widening changes coverage from 78.13% to 87.50% in the controlled case and 73.96% to 83.33% in real data. It increases width and worsens interval score in both cases. At 90%, raw ranges already overcover; widening increases that overcoverage and width. These tradeoffs are displayed, not described as automatic improvement.

## Verification report

Files changed:
- `src/Topic6PairedIntro.jsx`, `src/Topic6Pairs.jsx`: active paired teaching sequence, source records/weights, fitted mechanisms, full-year/classical comparisons, loss diagnosis, strategies and ranges.
- `src/Topic6.jsx`, `src/App.jsx`, `src/Topic6Sections.jsx`: persistent dataset/origin controls, navigation, rental units/date labels, scoped layout containment, and separate extrapolation bridge.
- `scripts/generators/topic6_pairs_core.py`, `topic6_pairs_evidence.py`, `topic6_pairs.py`, `topic6_pair_selection.json`, `regenerate_topic6_pairs.py`: frozen selections, genuine model calls, source chronology, simulation, full-year evaluation, fitted traces and calibration.
- Canonical Topic 6 entry point and old regeneration guards: use/protect the paired schema.
- `public/topic6_data.json`: paired evidence, 1,024,262 bytes, below the 1 MiB budget; all forecast numbers computed in Python.
- `README.md`, task checklist and this report: current task, source/validation policy and measured limitations. Historical plans/reports and experimental outputs retained.

Acceptance evidence: the controlled and real cases give similar repeatable forest gains, with positive median gains and all days retained. Raw-source chronology, observed masks, every training-record coefficient sum, actual tree routes, forest means, SVR contribution sums, recursive provenance, point-path identity and interval arithmetic reconcile. A training-only profile chart makes the shared interaction pattern visible.

Commands:
- `npm run lint`: PASS; ten existing warnings in older code, no new warnings.
- `npm test`: PASS; 11 shared chart-unit tests and architecture gate. Reused for unchanged zoom mathematics; later builds reran the architecture gate over all extracted components.
- `npm run build`: PASS; existing large-bundle warning remains.
- `validate_forecast.py public/topic6_data.json --max-kb 1024 --require-keys datasets.controlled,datasets.real,tab5`: PASS.
- `regenerate_topic6_pairs.py --evaluate-case controlled` and `--evaluate-case real`: PASS; independently refit every reserved-year model forecast through the canonical generator.
- `regenerate_topic6_pairs.py --check --reuse-canonical`: PASS; rebuilds the fitted teaching/calibration evidence from those fresh full-year evaluations and reproduces all non-timing exported fields exactly. An initial diagnostic timestamp-format difference was normalized; no forecast numbers changed.
- `audit_export.py`: PASS; independent source-level/date/mean/weight/tree/interval and full-year summary checks for both cases.
- Extended commentary-number guard: PASS; 20 heuristic hits, zero new.
- Extended commentary-shape guard: PASS; six baseline hits, zero new. Guards/baselines were not weakened.
- Source/built JSON identity: PASS.
- Chrome: initial full control audit checked 196 screenshots, 636 select changes, eight cross-section retention cases and zoom/pan across both datasets. No JavaScript exceptions or broken controls. Found desktop overflow in wide tables/trees; fixed the containing layout. A subsequent 200-view layout audit passed desktop/mobile, both themes and expanded Dataset Details. The final profile/date-label recheck passed 208 views and 50 control changes, with no overflow or JavaScript errors. Desktop training-profile and mobile classical-comparison screenshots were visually inspected. The only failed resource is the existing local Vercel analytics script (404), unrelated to the demo.
- Instruction/reference review: PASS; current README links the active components and regeneration path; previous evidence remains available.

Plan items completed: R1–R5.

Deviations from the original task candidate: replace month-ahead German load with paired day-ahead rentals after recorded development/evaluation failures; add a dedicated classical-comparison tab while retaining 6.5 Extrapolation. The user explicitly approved controlled plus real cases with explained disagreements. The exact model ranking is not forced.

Open questions: none requiring user input. Scientific limitations remain: one fixed simulation seed, one reserved real year now explored, modest candidate grids, an 84-day training policy, observed-source-only targets, no true future-weather forecasts or publication-delay model, dependent errors, correction failures and limited interval-evaluation days. Later revisions must not treat the already inspected evaluation year as untouched tuning data.
