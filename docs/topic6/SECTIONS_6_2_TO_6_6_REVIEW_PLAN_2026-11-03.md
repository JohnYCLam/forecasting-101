# Sections 6.2–6.6: review and improvement plan

Date: 2026-11-03. Status: approved and implemented under the subsequent user instruction. The review findings below describe the pre-revision snapshot. See SECTIONS_6_2_TO_6_6_IMPLEMENTATION_2026-11-03.md for the resulting behavior and verification.

## Recommendation

Keep the five sections. Their subjects are useful and distinct, but each needs a teaching sequence built around something the reader can see and explain. The main deficiency is not a shortage of content: abstract summaries, scorecards and confident conclusions currently arrive before the mechanism and evidence.

Continue the revised 6.1 story:

**6.1 Prepare inputs and fit a weighted sum → 6.2 Learn nonlinear relationships with trees → 6.3 Test whether this helps on real forecasts → 6.4 Choose how to produce future steps → 6.5 Handle a continuing trend → 6.6 Estimate and evaluate prediction ranges.**

Use the course's plain explanatory voice. Replace “three philosophies”, “architectural paradigms”, “Gaussian collapse”, “practitioner law” and internal “Falsifier Status: Passed” cards with concrete descriptions. Keep technical settings in Dataset Details. Enrichment should mainly mean worked examples and better evidence, with shorter commentary.

## Review scope and evidence

- Read the 20 commentary states in the running app and traced their claims through `src/Topic6.jsx`, `scripts/generators/generate_topic6_data.py` and `public/topic6_data.json`.
- Used installed **Google Chrome**, not Edge: 20 commentary states, screenshots of five sections at desktop/mobile widths in both themes, and a targeted complexity-selector check. Evidence: `../experiments/section6_review_2026-11-03/browser/report.json` and sibling screenshots. The script captures each section after cycling its commentary; secondary-view state can persist, so screenshots are recorded states, not all fresh defaults.
- No page exceptions or page-wide horizontal overflow in those checks. One existing local Vercel analytics script returns 404. These observations do not establish that every control or tooltip is correct.
- Directly inspected selected screenshots. Large extra cards separate explanation from chart; in recorded desktop states the chart begins roughly 1,580–1,910 pixels down the page. Dark-mode actual-load lines/legend text have poor contrast, and some inactive buttons use nearly black text. On mobile the uncertainty chart is particularly compressed and its legend competes for space.
- Existing evidence reports were treated as historical assertions, not proof. No model regeneration or notebook parity verification was performed in this review. Numerical findings below come from the currently exported JSON; source-data checks are explicitly identified.

## Corrections required before polishing

| Section | Verified finding | Consequence and planned action |
|---|---|---|
| 6.2 | Complexity changes selected scores, but all timeline/residual/temperature prediction paths remain fixed. Only balanced timeline predictions are exported. Chrome confirms identical SVG paths across all three presets. | Export and render matching predictions for each retained setting, or remove the selector. A changed heading does not demonstrate changed predictions. |
| 6.2 | “Overfit” XGBoost has lower test MAE than “Balanced”: 3.38 vs 3.51 overall, 4.38 vs 5.67 on hot weekdays. No training/validation comparison establishes overfitting. Several hyperparameters change together. | Use descriptive settings such as shallow/moderate/deeper, with exact settings in Details. Do not assert noise memorization. Retain a complexity lesson only with suitable training/validation evidence; do not tune the test window until a U-shaped result appears. |
| 6.2 | The temperature line sorts different test records by temperature, changing weekday and lag inputs too. Its XGBoost fit also differs from the balanced timeline fit in sampling settings. | Replace with a controlled input-response view using the same fitted model, or use a labelled scatter of conditional predictions without calling it a pure response curve. State the assumptions behind any artificial input combinations. |
| 6.3 | SARIMA uses 181 recent target observations; ML uses an expanding history and additional calendar/lagged-renewable inputs. The page says identical expanding histories/information. | Choose and disclose the comparison question: practical forecast pipelines at a shared cutoff, or matched-input learners. Recommend the former for classical-vs-ML, with a matched-feature ML subset. No algorithm-only claim from unequal pipelines. |
| 6.3 | Importance uses a newly fitted XGBoost model, fitted and evaluated on the same 90 rows. Some labels extend 15 days beyond the nominal Fold 1 origin. | Current results are not held-out importance of the arena model. Remove from the main story; if retained as an optional analysis, recompute with a fitted arena model on genuinely separate chronological data and label it correctly. This does not invalidate the separately generated arena forecasts. |
| 6.3 | “Median gain” takes the best model after seeing each fold's outcomes. | Label as retrospective best-of-fold, or preferably replace with each named model's gain vs baseline. It is not the attainable gain of a model selected in advance. |
| 6.3 | May–June demand is said to fall below all pre-pandemic history. Source-data minimum before 2020 is 38,952.67 MW; the displayed Fold 4 minimum is 39,486.46 MW. Fold labels and commentary also describe different phenomena. | Remove the false minimum claim and causal certainty about COVID, solar or weather. Use neutral dates and describe observed forecast misses. Contextual event labels require separate evidence and still do not identify the cause of an algorithm's error. |
| 6.4 | Recursive XGBoost's absolute error falls from 4,505.23 at day 1 to 1,713.11 at day 30; commentary says it “climbs”. The 2.6 ratio compares recursive with direct at day 30, not growth over time. | Explain feedback as a possible error pathway; do not call one comparison ratio accumulated error. Show a worked rollout and evaluate many origins before describing average horizon behavior. |
| 6.4 | The displayed curve contains one absolute error per horizon from one origin. The actual test dates are Jan 2–31, 2020. Direct is one pooled horizon-conditioned model per family, not 30 separate fitted models. | Correct error labels, dates, strategy terminology and compute claims. Different eligible training rows/features also prevent isolating feedback as the sole cause of the score difference. |
| 6.5, plus bridges in 6.2/6.4 | All tree ensembles are claimed to average original targets and therefore never exceed the training target range. The demonstrated raw learner is XGBoost, an additive boosted model. | Distinguish mean-leaf regression trees/forests from boosting. Explain lack of learned trend continuation beyond split boundaries; remove the universal target-range theorem. See the primary sources below. |
| 6.5 | Detrended lags use `np.roll` on the already-truncated training residual vector without dropping wrapped rows. The earliest training record receives residuals from the end of that training period. | Fix historical feature alignment with proper shifts and available history before regenerating. This is future information in early training features, not proof that test targets entered the model. Current 1.96 MAE/91.5% reduction must be rechecked, not preserved as acceptance targets. |
| 6.5 | Synthetic trend has the same slope throughout, not a trend break. Test has 149 rows (t=351…499); 36 are at or below the training maximum, contrary to “every test observation” being above it. | Rename to continuing-trend extrapolation; correct sample labels. Treat the training maximum as a reference line, not a universal boosting ceiling. |
| 6.6 | At 80% nominal, raw quantiles cover 80.66% and CQR covers 78.83%; at 90%, raw covers 87.59% and CQR 82.85%. Both CQR adjustments are negative, shrinking intervals. | Teach the actual width/coverage tradeoff. Calibration here does not improve test coverage toward nominal. Remove “empirical proof of valid coverage”, automatic shift repair, and validity-threshold pass language. |
| 6.6 | Gaussian width comes from in-sample training residuals; conformal widths use later calibration residuals. The chart plots 137 sampled dates but summaries count all 274 days. | Separate residual-estimation optimism from distributional/width assumptions. Prefer a comparator calibrated on the same held-out period. Plot all 274 points or clearly disclose and reconcile sampling and miss counts. |
| Across sections | 6.2 and 6.6 refresh lag inputs with actual observations as time advances; 6.3–6.5 forecast entire paths from a fixed origin. Model parameters remain fixed during each respective test. | Add a short statement of forecast origin, horizon, input availability and update policy. Neither updating observed inputs nor fixed-origin forecasting is intrinsically wrong; silently mixing them is confusing. |

### Statistical sources supporting the corrections

- XGBoost is a sum of fitted trees, with learned leaf scores. It is not an average of original target values; the claimed universal original-target bound does not follow. The relevant limitation here is continuation of a trend beyond learned split regions. [XGBoost: Introduction to Boosted Trees](https://xgboost.readthedocs.io/en/stable/tutorials/model.html).
- Squared-error regression trees use leaf means; that description must not be generalized to every tree objective. [scikit-learn: DecisionTreeRegressor](https://scikit-learn.org/stable/modules/generated/sklearn.tree.DecisionTreeRegressor.html).
- Permutation importance can be computed on training or held-out data, but they answer different questions. Correlated encodings complicate interpretation; feature importance is model reliance, not causality or the gain from adding that feature. [scikit-learn: Permutation feature importance](https://scikit-learn.org/stable/modules/permutation_importance.html).
- Split CQR's standard guarantee is marginal coverage under exchangeability; it is not a guarantee of coverage for every weekday, realised test sample, or arbitrary distribution shift. The score/interval equations permit shrinking an initially conservative interval. [Romano, Patterson and Candès: Conformalized Quantile Regression, Section 4 and Theorem 1](https://arxiv.org/html/1905.03222v1).
- Time variation can violate exchangeability; rolling calibration is a candidate adaptation, not a universal 90-day cure. [Barber et al.: Conformal prediction beyond exchangeability](https://arxiv.org/abs/2202.13415).
- Classical prediction intervals can vary with horizon and need not use a Gaussian construction. Avoid implying that all classical intervals are fixed-width; this also conflicts with the course's earlier ARIMA/GARCH material. [Forecasting: Principles and Practice, Sections 5.5–5.6](https://otexts.com/fpp3/toolbox.html).

## Shared design decisions

1. Keep the existing section order and four commentary steps per section where they support the story. Each step selects the relevant visual automatically. Remove the separate “display view” choice when it merely duplicates that navigation.
2. Start with one question and the smallest useful mechanism. A paragraph announcing several algorithm names is not an introduction to those algorithms.
3. Keep full technical feature definitions, split dates, fit windows, parameters, publication assumptions and expandable source records in Dataset Details. Keep a short availability statement visible near the active visual.
4. Bring the primary visual directly after its explanation and relevant controls. Show a compact score comparison when evaluation becomes the teaching question; move full leaderboards and architecture summaries behind optional Details. Avoid adding a separate card for each user question.
5. Retain ordinary linear regression as the familiar baseline where appropriate. Refit it; never rename an existing Ridge result. Keep Ridge only if regularization adds a demonstrated lesson, with a short explanation connecting it to linear regression.
6. Use available inputs consistently. Dependent and overlapping training tasks are acceptable for the prediction objective, but must not be counted as independent evidence. Splits follow target-label availability, not just row/origin dates. Do not mandate arbitrary purge/embargo buffers without explaining what information overlap they prevent.
7. Distinguish observation, mechanism and hypothesis. Explain the plotted result without claiming an untested causal explanation. Do not promise tree superiority, monotonically increasing recursive errors, successful detrending under every future trend, or guaranteed coverage.

## 6.2 — From linear regression to trees

**Goal/key claim:** Explain how feature-dependent splits let a model represent bends and interactions without manually specifying every interaction term.

**Narrative contract:** 6.1 ended with a weighted sum and handcrafted inputs → introduce one fitted decision tree before forests and boosting → predict daily synthetic load from calendar, lagged load and supplied temperature → relate to temperature-sensitive demand → trace one prediction, then compare observed results.

| Step | One message | Matching evidence/view |
|---|---|---|
| 1. A tree makes a sequence of decisions | A tree routes an input record through learned questions to a prediction. | One actual fitted shallow tree, with the selected record's path, leaf observations and predicted mean. Contrast with 6.1's weighted sum. |
| 2. A forest averages trees | Different fitted trees can give different predictions; a forest averages them. | A few real constituent predictions and the ensemble mean, tied to the same record. Distinguish any small teaching forest from the larger evaluation forest. |
| 3. Boosting adds corrections | Boosting builds an additive forecast in stages. | Genuine early-stage predictions/corrections from a fitted model. Explain what one stage changes; identify XGBoost as the implementation used in the comparison, without asserting each regularized leaf equals a simple residual mean. |
| 4. Compare on unseen records | Greater flexibility can help in this designed nonlinear example, but model complexity needs validation. | Controlled temperature response and/or held-out path, followed by compact model errors. Add weekday/weekend comparison only where it explains the designed interaction. |

**Dataset/task:** Keep the seeded synthetic example because its temperature bend and weekend interaction are known by construction. Explicitly say this is a teaching simulation, not measured German demand. Retain daily rolling one-step evaluation only with a prominent supplied-temperature assumption: actual target-day temperature currently acts as a known covariate. Real deployment needs a temperature forecast or a different issue time. Document the actual retained training indices and unexplained gap before day 419; do not present the gap as an essential method.

**Definitions/equation:** Split = an input-based question; leaf = a final group of training examples; forest = average of trees; boosting = accumulated corrections. One small numerical prediction trace matters more than ensemble equations.

**Controls/default:** A record selector with two or three purposeful examples (cool weekday, hot weekday, hot weekend). Default a hot weekday. Retain at most one complexity setting in the final step if each setting drives its actual predictions and commentary; otherwise defer complexity to optional Details. Avoid multiple unrelated settings on the introduction.

**Baseline:** Refit ordinary linear regression on the same inputs and data; keep a simple time-series baseline in the final forecast comparison if the claim concerns forecasting skill rather than conditional response alone.

**Expected/observable:** The fitted path exposes actual split rules; forest averaging and boosting additions reproduce displayed predictions. The controlled-response view shows the synthetic nonlinearity and interaction clearly; unseen-data scores describe what actually improved.

**Falsifier:** A “response curve” mixes uncontrolled inputs; a selected setting displays another fit's path; or an overfitting claim is inferred solely from depth. Revise/remove that lesson rather than manufacture the intended result.

**Limits/bridge:** Trees still need available, informative features and can fail out of sample. End with: this simulation was built to contain a nonlinear relationship; now test the benefit on real load.

**Data/source plan:** `gen_tab2`; existing `tab2.metrics`, `timeline`, `temp_curve`, `dgp_params`; add fitted split/leaf traces, constituent/staged predictions, exact protocol metadata and matching per-setting predictions if retained. Source is the generator, with primary library documentation; no notebook parity is claimed. Preserve the seed and specify any new validation protocol before generating.

## 6.3 — Do trees improve real forecasts?

**Goal/key claim:** A useful model must be judged across forecast dates against a baseline, not by a single attractive fitted path.

**Narrative contract:** Move from the known synthetic relationship to actual German load → compare familiar fitted pipelines rather than reintroducing their mathematics → issue a 30-day forecast at each cutoff → describe repeated planning forecasts → inspect one path, then the spread of results.

| Step | One message | Matching evidence/view |
|---|---|---|
| 1. Recreate a forecast date | Each model must make its forecast using information available at that date. | One cutoff timeline with eligible training labels and a short description of the inputs/history each pipeline uses. Connect to Topic 3 validation. |
| 2. Inspect one forecast | Error scores summarize visible differences between forecast and outcome. | Actuals plus seasonal naive and one selected model, rather than six overlapping lines by default. Compact MAE/RMSE comparison. |
| 3. Repeat across dates | A model's relative performance can change across windows. | Per-model gain against seasonal naive over all five existing origins; show magnitude as well as wins. Full table optional. |
| 4. Interpret a failure | A baseline winning a window is useful evidence about limits, not an inconvenience to explain away. | The existing May 15 window, with descriptive misses and a concise summary of aggregate performance. No unsupported attribution of the miss to a particular event. |

**Dataset/task:** Existing five 30-day fixed-origin German-load windows, with no future actuals updating inputs within a path. At each later origin, refitting may use then-observed earlier outcomes. Explain this distinction. Retain the five dates as illustrative case studies, not exhaustive or independent evidence of deployment reliability.

**Definitions/equation:** Forecast origin = issue date; backtest = recreate a forecast using only then-available data; gain = percentage reduction in error vs the baseline, negative when worse. Define MAE/RMSE briefly by linking to Topic 3. No new algorithm equation needed.

**Controls/default:** One model selector and one origin selector. Default the first chronological origin and a predefined tree model, not a model chosen after seeing that fold's winner. All-model overlay optional. Step 4 may choose the failure window explicitly and explain that selection.

**Baseline/fairness:** Keep weekly seasonal naive and SARIMA as actual pipelines. Either align history windows where sensible or disclose the current differences. Compare ML learners on matching feature sets; distinguish the extra information from algorithm differences. Retain a linear comparator consistent with 6.1, fitted rather than relabelled.

**Expected/observable:** Existing outputs show Random Forest winning two windows, XGBoost two and seasonal naive one by MAE. After any refit, recompute and explain actual rankings; preserve no winner as a requirement. XGBoost currently has the lowest mean MAE, which does not mean it wins every origin or every metric.

**Falsifier:** Declaring “same information/history” while supplying different inputs/windows; presenting retrospective best-model selection as attainable; or using a feature ranking to claim a causal gain. Expose fit failures: the current SARIMA exception handler silently returns naive predictions, though saved paths do not match naive exactly on any fold, so this review found no evidence it fired in the current export.

**Limits/bridge:** Few windows, unequal tuning histories, correlated forecast tasks and metric-dependent rankings constrain conclusions. End with: these ML forecasts all used the pooled horizon method from 6.1; what changes if day 2 uses our prediction for day 1?

**Data/source plan:** `gen_tab3`; `fold_results`, `aggregate_metrics`, `fold_paths`, `win_counts`; replace hindsight-selected aggregate gain with named-model gains, export protocol and fit status. Remove main-flow `permutation_importance`. Optional replacement must use a clearly identified fitted model and held-out dates with all labels eligible; repeat permutations and account for correlated calendar encodings. Source: existing generator/CSV plus permutation documentation, not a claimed new notebook replication.

## 6.4 — Forecasting when tomorrow has not happened yet

**Goal/key claim:** A recursive rollout feeds predictions into later inputs; the pooled horizon model used earlier avoids that particular feedback path, with neither strategy universally superior.

**Narrative contract:** Revisit how 6.1/6.3 issued whole future paths → define recursive versus pooled horizon-conditioned prediction → predict days 1–30 from a fixed cutoff → explain planning before intermediate outcomes exist → trace day 2 inputs before comparing errors.

| Step | One message | Matching evidence/view |
|---|---|---|
| 1. Revisit the earlier method | The existing pooled model takes origin information and the requested days-ahead value. | A compact day-1/day-2 record comparison showing frozen origin history and changing target calendar/horizon. |
| 2. Build a recursive forecast | At the second step, the newest load input is a prediction. | Actual complete forecast input records for steps 1 and 2, with observed versus predicted cells identified; step 7 optional to reveal rolling-window/lag replacement. |
| 3. Follow the two paths | Feedback can alter the later trajectory; one example does not establish a general error law. | A selected origin's two paths with a baseline available. Explain actual behavior, including windows where recursion works well. |
| 4. Compare across horizons | Strategy choice depends on measured errors over repeated origins. | MAE at each horizon averaged over predefined origins, with per-origin variation accessible. Keep individual-day absolute error separate from this average. |

**Dataset/task:** Reuse the arena's fixed-origin dates where feasible, avoiding another disconnected cherry-picked window. Retain Jan 2–31 as an explicitly labelled illustrative case if useful; do not silently replace its dates. No true future load may enter either rollout. Document eligible one-step vs pooled training tasks, common feature meanings, hyperparameters and any unavoidable differences; do not attribute all score differences to feedback alone.

**Definitions/equation:** Recursive = advance one step, append the prediction, repeat. Pooled horizon-conditioned = one fitted model using horizon as an input. Separate direct models = another variant, one model per horizon; explain briefly in Details, do not imply it is implemented. The two implemented approaches both fit one model per family, with different row counts and fitting/inference costs.

**Controls/default:** Default XGBoost pair at one predefined origin, with a lead/step selector for record mechanics. Random Forest comparison optional after the mechanism. Hide the seasonal-naive line in the close comparison if its holiday error compresses the main paths; retain its score and an explicit reveal option. No automatic zoom that hides a poor result.

**Baseline:** Seasonal naive at the same cutoff. A holiday-origin failure is a sample-specific limitation, not grounds for calling naive generally useless.

**Expected/observable:** Step 2 visibly consumes the step-1 prediction only in recursion. Aggregate curves may rise, flatten or cross; preserve the observed ordering. Explain possible error propagation without demanding monotonic growth.

**Falsifier:** Actual future observations enter recursion; a single day's absolute error is labelled multi-origin MAE; ratios between strategies are described as growth over time; or the pooled model is called a mandatory 30-model fit.

**Limits/bridge:** Different objectives/training task counts, finite origins and uncertain future covariates constrain comparisons. End with: avoiding prediction feedback does not itself teach a model how to continue a trend beyond its training inputs.

**Data/source plan:** `gen_tab4`; retain `timeline`/`metrics` for individual origins, add origin-indexed input traces, repeated-origin per-lead errors and averaged summaries with sample counts. Derive correct origin/target dates from exported metadata. Source: generator and fitted model calls; no notebook parity claimed. Fix the proposed evaluation origins and eligibility policy before fitting.

## 6.5 — Forecasting a continuing trend

**Goal/key claim:** A separate trend component can supply extrapolation that a tree fitted to raw levels does not learn in this example.

**Narrative contract:** Move from forecast strategy to target representation → explain boundary routing and a trend-plus-remainder model → forecast a synthetic series with a continuing linear trend and weekly cycle → relate to sustained load growth without claiming real regime detection → inspect the plateau, then reconstruct one transformed prediction.

| Step | One message | Matching evidence/view |
|---|---|---|
| 1. Watch a trend continue | The future level keeps rising while the raw-level model's forecast plateaus. | Training context, clear cutoff and actual future path versus raw prediction. The training maximum is an optional reference, not a proof. |
| 2. Explain the plateau | Learned splits do not provide a formula for continuing the time slope beyond their boundaries. | A small fitted-tree boundary example, with an explicit distinction between a mean-leaf tree/forest and additive boosting. No claim that all boosted forecasts must stay inside the target range. |
| 3. Separate trend and remainder | Predict a remainder with the tree, then add a trend fitted on training observations. | One genuine raw → trend estimate → remainder training record; one future trend + predicted remainder = predicted level. |
| 4. Compare and state the assumption | A successful trend extrapolation assumes the trend continues; transformations are choices to validate. | Recomputed raw/transformed errors and a suitable trend-plus-seasonality baseline. Differencing may be optional, with reconstruction and accumulated-error explanation if retained. |

**Dataset/task:** Keep seed 101 and the existing constant-slope DGP. Rename “Extrapolation & Drift” to “Trend and extrapolation”; no actual drift detector, trend-break experiment or retraining is currently present. Fix residual lag boundaries before trusting transformed results. Use accurate t indices and counts; explain that the displayed history is a subset of the training history.

**Definitions/equation:** Trend = persistent level movement; detrend = subtract the estimated trend; remainder need not automatically be stationary. Only necessary equation: forecast level = projected trend + predicted remainder.

**Controls/default:** Default raw versus detrended, once valid regeneration is complete. A stage/record selector supports the reconstruction. Optional differencing and tracking-error view; do not add a separate remedies table that repeats the story.

**Baseline:** Include a genuine trend-plus-weekly-seasonality comparator, such as ordinary regression on time and weekday or an appropriate additive seasonal smoother. Existing Holt linear lacks the weekly component; its loss alone cannot establish a need for ML on this simple series. Keep the raw tree as the transformation comparison.

**Expected/observable:** The unchanged synthetic trend should make raw-level extrapolation difficult. A training-fitted trend can carry growth outside the observed levels, with the tree modelling the remainder. Recompute scores after fixing rows; a simple classical/linear baseline may match or beat the hybrid and that is an appropriate result.

**Falsifier:** Wrapped training lags reference later observations; the trend is estimated using test data; all test values are said to exceed the training maximum; or the commentary claims every nonstationary series must always be detrended/differenced before ML.

**Limits/bridge:** A continuing linear trend was built into the data; real slopes can change. A rolling average of errors along one fixed forecast path is not rolling refitting or demonstrated adaptation. End with: even a suitable point forecast leaves unanswered how far actual load might fall from it.

**Data/source plan:** `gen_tab5`; correct shifted residual inputs, export the fitted trend, transformation/reconstruction examples, actual counts and fit cutoff. Regenerate `metrics`, `timeline`, `rolling_errors`; add the suitable baseline. Source: generator and primary tree documentation; no notebook replication asserted. Do not retain the existing 91.5% improvement as a pass threshold.

## 6.6 — From a point forecast to a prediction range

**Goal/key claim:** Evaluate prediction intervals by both coverage and width; calibration on past data does not automatically guarantee coverage under changing time-series conditions.

**Narrative contract:** Connect point forecasting in 6.5 with earlier prediction intervals and GARCH's conditional variance → introduce learned quantile boundaries and held-out calibration → predict the next day's load range → relate to planning uncertainty without claiming a reserve-cost calculation → count misses and compare interval width before making a validity claim.

| Step | One message | Matching evidence/view |
|---|---|---|
| 1. What does an 80% interval mean? | A useful range balances including outcomes with being informative. | A short legible excerpt with actuals, a band and highlighted misses; explain coverage and width before four method names. |
| 2. Learn lower and upper boundaries | Quantile models estimate different parts of the outcome distribution given the inputs. | Same dates with raw quantile boundaries; one input record and its two fitted predictions. Introduce asymmetric error penalties in words; pinball-loss formula optional. |
| 3. Calibrate on separate past outcomes | A held-out period supplies a correction without refitting the prediction model on test answers. | Training/calibration/test timeline and one score/interval adjustment example. Show that the current correction shrinks the raw intervals; explain the sign honestly. |
| 4. Check what happened next | Observed coverage and width both matter, especially when conditions change. | Raw versus calibrated comparison at 80%/90%, with all test days and optional period-specific diagnostics. Current undercoverage remains visible. |

**Dataset/task:** Existing real-load train/calibration/test periods can be retained. Explicitly state rolling one-day-ahead inputs, newly observed lag values, fixed fitted models and fixed calibration correction. This is not one nine-month path issued on 2019-12-31, and not dynamically recalibrated intervals. Use the same publication-availability assumptions as 6.1; additional real publication delays remain unmodelled.

**Definitions/equation:** Prediction interval concerns future load, not uncertainty in a mean parameter. Nominal coverage is the intended long-run inclusion rate, not a promise for every test window. Quantile = a conditional percentile; calibration = adjust boundaries using separate past prediction errors. Technical CQR scores and finite-sample rank belong in expandable Details with signs explained.

**Controls/default:** Nominal coverage 80%/90%; raw versus calibrated comparison introduced at the appropriate step. Default a readable period and retain full-period counts, clearly distinguishing subset and overall evaluation. Offer fixed-width residual conformal as the simple calibrated baseline. Gaussian training-residual intervals can be an optional diagnostic; do not center the story on “classical methods collapse”.

**Baseline:** A fixed-width interval based on the same held-out calibration period. If comparing Gaussian and quantile widths, align the residual-estimation/calibration protocol or clearly state that multiple factors differ. Include coverage, width and, if adding a single ranking, a proper interval score that penalizes misses as well as width.

**Expected/observable:** Current CQR reduces average width from 7,759.85 to 7,167.66 MW at 80%, with coverage falling from 80.66% to 78.83%. At 90%, coverage drops from 87.59% to 82.85%. The lesson is a past-calibrated adjustment and its subsequent tradeoff/failure, not automatic improvement. Any changed protocol must be evaluated anew without choosing a window to force nominal coverage.

**Falsifier:** Claiming the smaller interval proves valid coverage; promising exchangeability-based validity under arbitrary time dependence/shift; counting all 274 misses while implying every marker is plotted on the current 137 sampled dates; or claiming interval-width savings equal reserve/cost savings without a decision model.

**Limits/closing:** State the exchangeability limitation before presenting calibration as a guarantee. Evaluate time-local coverage cautiously; short blocks are noisy and correlated. Rolling calibration may be explored later with a proper chronological experiment, but no universal 90-day prescription. Replace the long Topics 1–6 decision guide with a short Topic 6 closing takeaway or optional link; remove “always detrend/use direct” rules.

**Data/source plan:** `gen_tab6`; retain `confidence_levels` and date ranges, add forecast-availability metadata, actual quantile/calibration examples, full daily timeline and optional period diagnostics/interval score. Frontend already recomputes miss flags for the active method; preserve that correct behavior. Sources: generator, original CQR paper and beyond-exchangeability paper; no notebook parity claimed.

## Work order and acceptance

1. **Correct the evidence and lock the task definitions.** Fix stale plotted states, training/validation misdescription, wrapped lags, dates, strategy labels and unjustified theoretical claims. Predeclare evaluation windows and claims before regeneration.
2. **Build only the missing explanatory evidence.** Tree path, forest average, boosting correction; recursive step-2 record; trend/remainder reconstruction; calibration example. Reuse existing raw data and fitted outputs where valid.
3. **Restructure each section in sequence, 6.2 → 6.6.** One message per commentary step and one matching visual. Rewrite bridges after the actual findings are known. Keep 6.1 stable except for any genuinely necessary bridge terminology adjustment.
4. **Simplify layout and verify once at the appropriate final gate.** Put controls with their view; move long scorecards and model guides out of the initial reading path; check dates, units, active states, both themes, mobile and chart legibility.

Each revised section passes only when a reader can answer: Why is this section needed? What is known when forecasting? How is one prediction produced? What visible evidence supports the lesson? What can this example not establish?

Implementation checklist: `TASKS_6_2_TO_6_6_REVIEW.md`. This plan contains no commitment to preserve existing winners, gain percentages or nominal-coverage success.

## Follow-up: restore the forecast view and draw the tree

2026-11-03: User approved restoring the actual-versus-forecast timeline as 6.2 tab 4's main graph, with temperature response optional, and requested a tree drawing in tab 1. Implemented the full fitted teaching tree, all actual learned splits/leaf means, and a highlighted route that changes with the example record. The restored timeline compares actuals, a selected fitted model and weekly seasonal naive; the original prediction arrays and scores remain unchanged. See the implementation report's follow-up evidence.
