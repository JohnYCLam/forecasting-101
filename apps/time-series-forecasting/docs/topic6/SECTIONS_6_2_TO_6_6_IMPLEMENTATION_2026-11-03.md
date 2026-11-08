# Sections 6.2–6.6: implementation and verification

Date: 2026-11-03. Authorization: user instruction, “do the 6.2 to 6.6 improvement execution”, following the review plan. No additional approval was required.

## Result

The five sections now follow the approved sequence, with four teaching views each. Section 6.1's component and data were preserved. All later forecasts, scores, tree traces and interval boundaries come from fitted models; no preferred winning scores were retained as acceptance targets.

| Section | Implemented reader journey |
|---|---|
| 6.2 | One fitted tree path → actual forest constituent predictions and average → genuine XGBoost prediction stages → controlled input response and unseen-record errors. |
| 6.3 | Forecast cutoff → one selected model versus actuals/baseline → named-model gains over five origins → a genuine baseline victory. SARIMA supplies the seasonal ARIMA comparison; VARIMA is not implemented. |
| 6.4 | Frozen pooled-model records → full recursive inputs with observed/predicted provenance → selected forecast paths → per-lead MAE averaged over five predefined origins. |
| 6.5 | Continuing synthetic trend → boundary routing in a separately fitted time-only teaching tree → trend/remainder reconstruction → comparison with a suitable linear trend-and-weekday baseline. |
| 6.6 | Interval meaning and misses → complete quantile input/output example → a genuine calibration score and signed adjustment → full-period coverage, width, misses and interval score. |

Long scorecards no longer separate the introductory explanation from its primary evidence. Each commentary step selects its relevant view. Technical definitions and fit details are expandable. Shared chart shells provide zoom/pan; lines and labels use theme-aware colors. Smaller tables wrap, and wider tables scroll with a visible instruction.

## Files changed by this implementation

- `src/Topic6.jsx`: retained the existing shared Layout and 6.1 route; replaced obsolete later-section UI with the revised component and added a fetch failure message.
- `src/Topic6Sections.jsx`: five focused teaching sequences, shared display helpers, controls and charts. Forecast/model calculations remain in Python; frontend transforms only select, label and display existing evidence.
- `src/App.jsx`: updated section names, including “ML & Classical Baselines” and “Trend & Extrapolation”.
- `scripts/generators/topic6_sections.py`: fitted model/evidence functions for all five sections. Uses fixed seeds, original synthetic DGPs and declared splits.
- `scripts/generators/generate_topic6_data.py`: later-section functions now delegate to the focused module. The full generator retains 6.1 and rejects nonfinite JSON output.
- `scripts/generators/regenerate_topic6_sections.py`: targeted regeneration, deterministic comparison, metric/trace invariants and future-measurement perturbation checks; preserves the existing 6.1 payload.
- `public/topic6_data.json`: regenerated later-section evidence, approximately 510 KiB, below the 1,024 KiB budget.
- `README.md`, review plan and task checklist: actual implemented scope and verification status.

Existing unrelated workspace changes were preserved. No changes were made to shared chart implementations, checker baselines, dependency versions, Topic 6.1 content, or previous topics.

## Model and information contracts

**6.2:** Original seed-42 process and train/test indices retained. Ordinary linear regression, a shallow mean-leaf tree, an 80-tree Random Forest and 100-tree XGBoost are actually fitted. The forest has fixed depth/leaf constraints; XGBoost has fixed depth, learning rate and child weight. Observed previous-day/week loads update at each daily one-step issue, and target-day temperature is explicitly supplied. This temperature assumption needs a forecast or a different issue time in deployment. Controlled response curves use the same fitted models and fixed training-median load inputs, with target calendar set explicitly. They are diagnostics, not independent forecasts or empirical causal effects.

**6.3:** Five original fixed-origin dates retained: 2019-10-01, 2019-12-15, 2020-03-01, 2020-05-15 and 2020-08-01. Pooled ML training uses expanding origins sampled every other day, with all full-horizon labels available by the fit cutoff. The shared ML table includes horizon, target calendar, observed load lags/means and origin solar/wind observations. Linear regression replaces Ridge through an actual new fit, not a renamed result. SARIMA uses 181 recent target observations and fixed orders; all saved fits converged. No silent fallback substitutes another model. Different histories and additional ML information are disclosed, so this is a practical pipeline comparison, not an isolated algorithm experiment.

**6.4:** Same pooled features/models versus one-step fits and recursive rollout, for both XGBoost and Random Forest. Recursive target history appends only predictions after the original cutoff. Renewable inputs remain frozen at the original issue date in both strategies. Calendar inputs advance to the target date. Eligible training sets/objectives differ and are disclosed. Five original origins contribute to average horizon errors; 2020-01-01 is an additional illustrative origin excluded from that average. Its actual targets are 2020-01-02–2020-01-31. There is one fitted model per strategy/family, not a mandatory model for each horizon.

**6.5:** Original seed-101 constant-slope trend, weekly cycle and noise retained. Training target indices are 7–350, with 149 test targets at indices 351–499. The trend is estimated on training observations. The first residual lags now use genuine earlier residuals, rather than wrapping from the end of the training vector. Raw and remainder XGBoost forecasts are genuine recursive predictions. The time-plus-weekday linear baseline is fitted on the same training target dates. A separate fitted time-only shallow tree illustrates boundary routing without asserting a universal original-target bound for boosted models.

**6.6:** Original train (2017-01-01–2019-06-30), calibration (2019-07-01–2019-12-31), and test (2020-01-01–2020-09-30) periods and quantile/point model settings retained. Daily one-step predictors use preceding actual observations; parameters and calibration adjustments remain fixed. Raw quantiles and CQR are compared with a fixed-width absolute-residual conformal interval calibrated on the same held-out dates. All 274 test days are exported; excerpt and full-period views are explicit. Negative CQR corrections remain negative. Standard exchangeability-based marginal validity is distinguished from realised coverage under dependent or shifting conditions.

## Observed outcomes

| Evidence | Actual regenerated result |
|---|---|
| 6.2 overall test MAE | Linear 7.958547 MW; single tree 6.727804; forest 3.869510; XGBoost 3.333251; daily updated weekly naive 11.091984. |
| 6.3 mean MAE across five origins | Linear 3,054.357115 MW; forest 2,915.423358; XGBoost 2,620.192595; naive 3,261.210833; SARIMA 3,261.790854. XGBoost wins three windows, forest one, naive one. |
| 6.3 May window | Naive MAE 2,493.55 MW; XGBoost about 4,056 MW. This is an observed forecast failure; no event is asserted to be its identified cause. |
| 6.4 XGBoost average MAE, leads 1 / 7 / 30 | Pooled approximately 1,633.6 / 2,039.5 / 2,652.0 MW; recursive 1,003.9 / 2,351.0 / 1,820.8. No monotonic error-growth story or universal direct-model winner is claimed. |
| 6.5 full future-path MAE | Raw 22.689452 MW; trend + XGBoost remainder 2.014245; linear trend + weekday 1.701350. The simpler suitable baseline wins this simple DGP. |
| 6.6 at 80% nominal | Raw coverage 80.656934%, width 7,759.850586 MW; CQR coverage 78.832117%, width 7,167.663086 MW. Offset −296.093750 MW. |
| 6.6 at 90% nominal | Raw coverage 87.591241%, width 12,977.056641 MW; CQR coverage 82.846715%, width 12,266.002930 MW. Offset −355.526042 MW. |

The narrow fixed-width comparator has a lower average interval score than the wider quantile intervals in these test results while missing nominal coverage. The page explicitly separates that scoring tradeoff from coverage attainment.

Two unchanged-computation reference checks against the reviewed pre-revision export: first-origin SARIMA MAE 1,770.46 versus regenerated 1,770.459912 MW; raw 80% quantile coverage 80.66% versus regenerated 80.656934%. Differences are display rounding. These are saved-export cross-checks, not notebook replication; no notebook with this exact redesigned protocol was identified or claimed.

## Verification evidence

Python used for execution: `../experiments/section6_methods_2026-11-03/python_env/Scripts/python.exe` (scientific packages and Playwright already installed).

- **Deterministic refit:** `scripts/generators/regenerate_topic6_sections.py --check` passed against the stored later-section evidence. After adding the boundary and quantile-record evidence, final refitting again matched. The boundary example was also independently regenerated twice with equal output.
- **Numerical invariants:** model MAE/RMSE independently reconciled against displayed path arrays; forest mean and boosting-stage additions reconciled; recursive step-2 newest load equals the preceding prediction; pooled newest load stays fixed; average lead errors reconciled across origins; trend/remainder sum reconciled; all interval widths, coverage, counts and interval scores independently recomputed. Crossed calibration/test boundaries and nonfinite values are rejected.
- **Information isolation:** replacing all post-origin load/solar/wind measurements with extreme values left eligible training rows/labels and fixed-origin predictor matrices unchanged at all five arena origins. Last training labels were checked against issue dates. This does not certify real publication delays, which remain an explicit assumption.
- **6.1 preservation:** its JSON object is exactly equal to the saved pre-execution object. All four introduction tabs were smoke-tested; its component was not edited.
- **Diff review:** the original `gen_tab1` function body is also exactly unchanged. New files have no trailing whitespace. Repository-wide `git diff --check` still reports pre-existing trailing whitespace in the older evidence report and introduction generator; these unrelated edits were preserved rather than reformatted.
- **Lint:** PASS, no new warnings. Existing unused-variable warnings in earlier topics/App and the shared chart hook warning remain.
- **Tests:** PASS, all 11 shared chart-math tests and chart architecture gate. No changes were made to those shared implementations after the observed test run.
- **Production build:** PASS. Existing large-bundle warning remains; no bundle-limit settings were relaxed.
- **Forecast integrity:** PASS with the changed JSON and canonical generator, required keys for all five sections, and the 1,024 KiB limit. This heuristic check supplements, rather than replaces, the numerical and cutoff checks above.
- **Commentary guards:** PASS with no new hits. The guards' original default filename matcher does not include extracted section components; the unchanged guard code was additionally run in memory with matching extended to `Topic6Intro.jsx` and `Topic6Sections.jsx`. Checker baselines and source were not modified. Reproducible helper: `../experiments/section6_review_2026-11-03/check_component_commentary.mjs`, run from the app directory.
- **Chrome:** 80 screenshot states (20 teaching views × light/dark × desktop/mobile), 192 exercised control selections, and zoom-in/out/reset/pan across all five sections. No page errors, console errors, failed resources or page-wide horizontal overflow on the development-server pass. Zoom visibly changed plotted paths in every section. Selected screenshots were inspected, including mobile interval charts and transformation/input tables.
- **Built preview:** existing `http://127.0.0.1:5185/` served the revised build; all 24 Topic 6 tabs were navigated without page exceptions. Its pre-existing `/_vercel/insights/script.js` request still returns 404; the forecast UI remains functional. No claim of a clean production network console is made.

Browser evidence and repeatable Chrome script: `../experiments/section6_review_2026-11-03/browser_after/` and `verify_execution.py`. Chrome's installed executable was used throughout; Edge was not used. The temporary development server used for this work is stopped after verification; the user's existing preview server is left running.

## Plan items and scope choices

T1–T12 are implemented. Approved simplifications: remove the unsupported complexity dial and current importance analysis; keep differencing, Gaussian training-residual diagnostics and the broad Topics 1–6 decision guide outside the main sequence. None of these optional expansions is required for the approved core story. A suitable simpler baseline replaces the under-specified nonseasonal Holt comparison in the trend example.

Limits retained: synthetic mechanisms are deliberate teaching examples; repeated real windows are limited evidence; unequal pipeline histories and information prevent algorithm-only claims; observed inputs differ from fixed-origin paths; real publication lags are unmodelled; conformal calibration is not guaranteed under arbitrary time dependence/shift. No deployment, commit or external publication was performed.

Open questions: none required for this implementation. Further changes can follow the user's reading of the revised demo.

## Follow-up: tree drawing and restored forecast timeline

2026-11-03, authorized by the user's “yes” to restoring the timeline and instruction to draw the tree in tab 1.

- **Tab 1:** the complete fitted teaching tree is drawn as an accessible SVG: nine nodes, five leaves, actual feature thresholds, training counts and leaf means. Blue highlights the selected record's decision route and green its predicted leaf. All three example records use the same fitted tree. The source record and expandable text route remain available. The diagram scrolls within its card on mobile and recenters its root after resizing or switching examples.
- **Tab 4:** the default view is the daily forecast timeline, showing actual load, one selected fitted model and repeat last week. Linear regression, the teaching tree, Random Forest and XGBoost can each be selected. Temperature response remains an explicitly selected secondary view, with weekday/weekend controls. Commentary changes with the view and selected model; the compact score table includes the teaching tree as well.
- **Data:** regenerated only `tab2` to add fitted node descriptions, geometry and route node IDs. Confirmed identical existing metrics, timeline, response and protocol. All other section payloads are exactly unchanged. Repeated generation produced equal evidence. The shared validator checks every node's child counts/weighted means and reconstructs every example's route and terminal prediction.
- **Checks:** lint, all 11 chart-math tests, chart architecture, production build, forecast integrity and extended component commentary guards pass. Existing unrelated lint/build warnings remain. No shared chart code or checker baseline was edited.
- **Chrome:** 12 tree states (three records × both themes × desktop/mobile), 16 forecast states (four selected models × both themes × desktop/mobile), eight temperature-response states, plus zoom in/out/reset for both graph views. Selected highlighted node IDs match generated paths; root visibility and horizontal scrolling were checked. No page exceptions or page-wide horizontal overflow. The existing production analytics-script 404 remains unrelated.
- **Evidence:** `../experiments/section6_review_2026-11-03/tree_timeline/`, with `verify_tree_timeline.py` providing repeatable installed-Chrome checks against the built preview at port 5185. No temporary server was needed for this follow-up.
