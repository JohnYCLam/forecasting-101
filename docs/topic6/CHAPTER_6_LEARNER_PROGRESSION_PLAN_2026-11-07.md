# Chapter 6: a continuous forecasting story

Date: 2026-11-07. Status: implemented after the user's subsequent “do it”. The original proposal below is retained as the design record; execution decisions and verification are documented in [the implementation report](CHAPTER_6_IMPLEMENTATION_2026-11-07.md).

## Recommended structure

Use six main sections, following the user's clarification on 2026-11-07:

1. **6.1 Prepare a forecasting task and fit linear regression.**
2. **6.2 Change the learner: support vector regression.**
3. **6.3 Learn rules, average trees, and add corrections.**
4. **6.4 Produce the horizon directly or recursively, including error propagation.**
5. **6.5 Extrapolation: recognise the limitation and model the trend.**
6. **6.6 Move from point forecasts to calibrated prediction ranges.**

The user retained extrapolation as a dedicated section. Merge recursive error propagation and remedies into 6.4; keep extrapolation distinct in 6.5 and uncertainty in 6.6. The prior five-section recommendation is superseded. All remedies compared in 6.4 use the same forecast origin and information cutoff; updating with post-origin observations is excluded.

The narrative is: **prepare the task → see the limits of the linear baseline → try another nonlinear learner → understand tree-based alternatives → choose the horizon strategy and address feedback → handle extrapolation → quantify the uncertainty left over.**

The prior implementation weakened this narrative by changing both the dataset and forecast task between adjacent sections. Additional prose does not repair that experimental discontinuity.

## Evidence and claims that need care

- Current 6.1 full-feature linear regression: MAE 1,692.688414 MW and RMSE 3,338.047396 MW. Seasonal naive: MAE 1,870.533333 and RMSE 2,941.566600 MW. Source: `public/topic6_data.json`, `tab1.linear_intro.metrics.safe_full.test` and `tab1.linear_intro.repeat_week.metrics`. It wins one metric and loses the other. The proposed closing message is therefore **“Substantial feature preparation does not guarantee a reliable improvement over seasonal naive”**, not “linear regression cannot beat naive.” A stronger claim needs newly defined evaluation evidence.
- At planning time the new SVR comparison had not been run. It has now been evaluated using the frozen shared protocol; see the implementation report for measured outcomes rather than an assumed ranking.
- The chapter should demonstrate a useful forecast gain, rather than merely introduce algorithm names. Aim for a reproducible gain from a suitable ML approach over seasonal naive and the linear baseline on the shared task. However, a strict chain in which every added model beats every previous model is not a valid acceptance requirement. In particular, do not weaken SVR or the single-tree baseline to manufacture an ensemble victory.
- Random forests address the sensitivity of individual trees through averaging; boosting learns sequential corrections. Boosting is an alternative ensemble construction, not normally a procedure that starts with and repairs a fitted random forest. [scikit-learn ensemble documentation](https://scikit-learn.org/stable/modules/ensemble.html).
- Both direct and recursive methods can issue an entire horizon at the same original time. In the recursive method, intermediate *predictions* become inputs; intermediate actuals are still unavailable. Standard ARIMA and VAR multi-step calculations provide a valid bridge, with ARIMA also handling error terms and differencing. [FPP: ARIMA forecasting](https://otexts.com/fpp3/arima.html#forecasting), [FPP: vector autoregressions](https://otexts.com/fpp3/advanced.html#vector-autoregressions).

## One shared forecasting contract

**Primary candidate:** existing German daily electricity-load data; daily average load in MW; a complete 30-day forecast issued from each fixed origin. Keep the original 6.1 window as an explicitly identified illustration while evaluating a wider, predeclared panel of origins.

For 6.1–6.3, change the learner while preserving:

- Training target dates and label-availability rules; same history span and origin stride.
- Complete origin–horizon training tasks and the same predictor definitions.
- Origin-relative observed load/renewable history, known target calendar, and requested days ahead.
- Frozen observed information throughout each 30-day forecast. No newly observed test loads enter later rows.
- The same seasonal-naive forecasts, which repeat the last observed week by weekday throughout the horizon.
- Identical evaluation targets, scoring, and origin selector. A given selected origin means the same period in every section.

Start from the legitimate 6.1 feature table. If a known-ahead holiday flag or other feature is added, refit all relevant learners with that same information; do not give later learners extra information and credit the algorithm for the resulting gain. Exclude realised future temperature/solar/wind unless actual historical forecast vintages available at the origin are supplied and used consistently. Drop the synthetic temperature experiment from the main forecast comparison; it may survive as a clearly labelled optional mechanism illustration.

Scaling is fitted on training data only. SVR needs explicit feature scaling and deliberate target-unit treatment; tree models need not share that numerical transformation, but must share the underlying information. Use bounded chronological validation for model settings. Fix the scoring objective and tuning budgets before assessing the final evaluation; report MAE and RMSE together. Do not select RMSE only because the current linear model loses on that metric.

**Evidence gate before prose:** perform a read-only feasibility study on development/validation data, comparing seasonal naive, linear regression, scaled SVR, a tuned single tree, Random Forest and XGBoost on this contract. Record feature sets, fit costs, per-origin errors and visible failure modes. Keep historical periods already inspected in earlier demos identified as illustrative/design evidence; do not claim them as untouched tests. Reserve evaluation periods before comparing new candidates, and disclose any prior exposure.

If there is no useful validated ML gain, stop the implementation of the planned victory narrative. Diagnose whether the available information supports the task. A documented change of dataset or forecast horizon may be proposed and then applied consistently across the chapter before freezing the final experiment. Do not repeatedly search final-test windows, seeds, or weakened baselines for the desired ordering.

## 6.1 — From a time series to a forecasting model

**Goal / key claim:** A valid training table and engineered inputs are necessary preparation, but do not guarantee an advantage over a strong simple forecast.

**Narrative contract:** Earlier statistical models take a chronological series → introduce a supervised regression record and linear regression → issue the full next-period load path from a fixed cutoff → relate it to preparing a planning schedule in advance → inspect a training row, forecast inputs, the actual forecast and baseline errors.

| Tab | Message | Evidence and reader action |
|---|---|---|
| 1. Start with linear regression | A starting level plus weighted inputs produces a load prediction. | Preserve the introductory explanation and one reconstructed prediction. |
| 2. Prepare training records | Past source observations become predictors; a later observed outcome supplies the training answer. | Complete raw/transformed record, legitimate feature sources, fitted weights and contributions. |
| 3. Issue the complete horizon | Requested horizon and target calendar change while observed origin information stays frozen. | Complete valid forecast row, deliberately invalid future-answer row and visible leakage effect. Distinguish issue date, horizon and lookback. |
| 4. Compare with repeat last week | Adding useful features can change the shape without producing a clear win on the chosen accuracy objective. | Actual-versus-forecast chart, progressive feature sets and the identical seasonal-naive path. End with a specific unresolved error pattern and a reason to try another learner. |

**Dataset / controls / defaults:** Shared German-load task. Default one predeclared origin, the established feature progression, and seasonal naive visible. Keep the useful row/horizon controls and avoid new decorative prediction cards.

**Definitions / equation:** Retain the established weighted-sum equation and plain definitions of input, weight, target, origin and horizon. Explain overlap between origin–horizon tasks without treating rows as independent experiments.

**Expected result / observable:** The user can reconstruct a fitted value, identify unavailable inputs and see a forecast from one fixed cutoff. The closing comparison is whichever MAE/RMSE result the declared evaluation supports; current evidence is a mixed result.

**Baseline / limits / falsifier:** Seasonal naive is a genuine strong comparator. No claim of a universal linear-model failure or feature futility. Reject a closing sentence that contradicts either displayed metric or attributes a miss to a missing feature without testing it.

**Source / data plan:** Existing `gen_tab1`, `topic6_linear_intro.py`, legitimate training/test records and `tab1.linear_intro` outputs. Retain genuine fits; if adopting a shared multi-origin panel, regenerate the linear evidence under the newly frozen protocol. Existing notebook parity is not claimed for this revised design.

## 6.2 — A nonlinear alternative: support vector regression

**Goal / key claim:** Change how the same input records map to a prediction, then measure whether that change improves the same forecast task.

**Narrative contract:** Linear regression's additive response may leave predictable nonlinear errors → introduce SVR, the regression form of support vector machines → predict the same target load and complete horizon → relate nonlinear response fitting to the same planning task → show a fitted mechanism illustration and then the full-period forecast against unchanged comparators.

| Tab | Message | Evidence and reader action |
|---|---|---|
| 1. From a weighted sum to a flexible response | Another learner can use the same records to represent nonlinear responses. | A small fitted linear-versus-kernel response illustration, with other inputs fixed and the mapping back to the original forecast records made explicit. |
| 2. How SVR is fitted | SVR balances a simple/smooth fit against errors outside a chosen tolerance. | A training-only illustration of the tolerance band and support vectors, the records with nonzero fitted influence. Explain that the band is a training loss tolerance, not a prediction interval. |
| 3. Forecast the same horizon | New learner; unchanged issue date, information and target period. | Actual load, SVR, linear regression and seasonal naive, with no daily observed-input refresh. Show a complete representative forecast row. |
| 4. Evaluate the gain and remaining cost | Nonlinear flexibility needs validation and has practical tradeoffs. | Per-origin errors, gain magnitude, fit cost and observed remaining errors. End by motivating a different nonlinear representation rather than declaring SVR inherently obsolete. |

**Dataset / controls / defaults:** Same shared table and origin selector as 6.1. Default a validation-selected RBF-kernel SVR, with its settings fixed for final evaluation. A linear-kernel comparison is optional only if it helps explain the kernel, not another mandatory algorithm detour. Keep tuning details in Dataset Details; do not make test-set parameter searching an interactive teaching exercise.

**Definitions / equation:** Kernel = similarity rule used to build a nonlinear response. Support vectors = training records with nonzero fitted contribution. Epsilon = an error tolerance during fitting. Introduce the concepts before optional formulas; no classification-margin lecture is required. SVR may use signed contributions, so do not describe it as averaging nearby target values. [scikit-learn: SVR and practical tips](https://scikit-learn.org/stable/modules/svm.html#regression).

**Expected result / observable:** The fitted nonlinear response differs visibly from the linear response, and the entire horizon is genuinely forecast from one cutoff. Whether it improves MAE/RMSE and where it misses remain unverified until the feasibility study. Report the actual improvement or lack of it.

**Baseline / limits / falsifier:** Compare with the same linear and seasonal-naive paths. Scaling, kernel settings and sample size affect practicality; exact training cost is measured here rather than asserted as a universal threshold. Reject any SVR gain based on new future information, different training targets or a silently changed forecast task.

**Source / data plan:** New focused SVR evidence function using `StandardScaler`, `SVR` and training-only target transformation if selected; reuse the frozen shared records. Export training-illustration data, support-vector identifiers, forecast paths, settings, timing and per-origin metrics. No existing SVR result or notebook replication is claimed.

## 6.3 — Tree-based models: rules, averages and corrections

**Goal / key claim:** Understand what each tree construction changes, and judge whether it solves a demonstrated forecasting pain point.

**Narrative contract:** SVR offers a smooth nonlinear response with scaling/tuning demands → introduce explicit input-based rules, then two ensemble constructions → forecast the identical load horizon → relate readable rules and robust nonlinear fitting to the same planning problem → link each mechanism to a visible diagnostic and the same forecast chart.

| Tab | Pain point → new idea | Matching evidence |
|---|---|---|
| 1. Learn explicit decisions | Offer an alternative to the kernel response: thresholds can represent local cases and interactions. This does not mean SVR is incapable of those relationships. | Actual fitted tree with selected input route and leaf prediction. Contrast a genuine SVR/linear error pattern where supported by validation. |
| 2. Stabilize a tree with a forest | One tree can change substantially with its training sample; average diverse fitted trees. | A few actual resampled trees, their differing predictions, the full forest average and held-out errors. Distinguish a small explanatory illustration from the fairly tuned comparison model. |
| 3. Learn sequential corrections | Averaging is one ensemble construction; boosting builds an additive model to reduce its remaining training loss. | Genuine staged XGBoost predictions and corrections. Do not pretend these are corrections appended to the previously fitted forest. |
| 4. Check which changes helped | A more elaborate learner earns its place through observed gains, costs and limitations. | Same full-period forecast with a model selector and a compact across-origin comparison: naive, linear, SVR, single tree, forest and XGBoost. Keep actuals and the baseline visible. |

**Dataset / controls / defaults:** Shared German task and same origin/record choices; no switch to rolling one-step synthetic forecasts. Default a predeclared illustrative record and validation-selected models. Avoid six overlapping forecast lines; show actuals, seasonal naive and a selected learner, with optional previous-learner comparison.

**Definitions / equation:** Split, leaf, resampling, averaging and correction are introduced at their respective steps. Use the forest mean or one additive correction only when needed; avoid a page of ensemble equations.

**Expected result / observable:** The tree route reproduces the fitted prediction; forest averaging and boosting additions reconcile. At least a suitable ML candidate should show a useful forecast gain over the baseline and linear model in the planned successful demonstration. Single-tree→forest→boosting score ordering is not assumed; validate the mechanistic benefit and report actual rankings.

**Baseline / limits / falsifier:** Give all learners reasonable predeclared tuning effort. Do not compare an intentionally poor shallow teaching tree with a heavily tuned forest and claim an isolated ensemble effect. Forests need not beat SVR, and boosting need not beat forests. Reject fabricated hierarchy, supplied future covariates or selected test windows presented as general evidence.

**Trend/extrapolation placement:** End with a brief limitation and a bridge to the dedicated 6.5. Do not pack the full trend experiment into the tree introduction, and do not confuse extrapolation with recursive error accumulation.

**Source / data plan:** Reuse actual tree-node/route and staged-prediction export patterns from `tree_lesson`, but refit on the shared task. Export matched training-perturbation evidence if using instability as an empirical claim. Keep all comparison paths and metrics in one shared results structure to avoid drift between sections. Primary ensemble documentation supports mechanisms; final forecast rankings come only from generated evidence.

## 6.4 — Direct and recursive forecasts, including accumulated error

**Goal / key claim:** Compare two ways to calculate the complete horizon from the same cutoff and understand where recursive feedback can affect later predictions.

**Narrative contract:** The previous sections used horizon-conditioned records → connect recursion to familiar ARIMA/VAR calculations → issue the same entire load schedule → explain fit-data, maintenance and accuracy tradeoffs → follow step 2's inputs before comparing repeated-origin forecast errors.

| Tab | Message | Evidence and reader action |
|---|---|---|
| 1. Revisit the existing whole-horizon method | The pooled model receives origin information and the requested horizon; forecasts do not feed one another. | Complete day-1/day-2 input records, frozen observed history and changing target calendar/horizon. Separate per-horizon direct models are an optional variant, not the claimed existing implementation. |
| 2. Reuse predictions recursively | Predict day 1, append that prediction, and calculate day 2 before either actual is known. | Complete observed/predicted input comparison and a small forecast-dependency drawing. Explain the ARIMA/VAR connection. |
| 3. Follow error propagation | An earlier forecast error can alter later inputs; its effect can grow, decay or cancel. | Actual fitted rollout traces and horizon errors across predefined origins. Any deliberately perturbed intermediate prediction is a labelled mechanism diagnostic, excluded from valid forecast rankings. |
| 4. Reduce error with the same information | Compare strategies, then test a correction learned from historical rollouts. | Recursive versus direct/pooled forecasts, followed by uncorrected versus corrected recursive forecasts. Keep the cutoff fixed; show horizon errors, gain/loss and costs. Include a compact pros/cons/when-to-use comparison. |

**Dataset / controls / defaults:** Same real-data series and evaluation origins. Fix one validation-selected learner as the main paired comparison; a second family is optional to test whether conclusions persist. Default one declared origin, then expose the repeated-origin evidence. Both issue their whole horizon at the original time.

**Definitions / equation:** Recursive refers to dependence on intermediate predictions. Pooled horizon-conditioned refers to one model with horizon as an input. Rolling one-step evaluation is a different service that waits for new actuals; do not silently use it to claim improvement in fixed-origin forecasting.

**Expected result / observable:** At step 2, only recursion uses the preceding forecast as its newest load input. Both strategies exclude future actuals. Forecast-error curves may cross and need not rise monotonically. Training objectives and eligible row counts are recorded rather than pretending feedback is the only experimental difference.

**Baseline / practical choice:** Keep seasonal naive; show SARIMA as a familiar recursive reference if comparably fitted and useful. Compare the same underlying learner family, observed history and known future calendar. One-step versus horizon-specific objectives naturally produce different eligible training tasks; disclose these differences rather than pretending every row can be identical.

| Strategy | Strengths to explain | Costs/limitations to explain | Evidence supporting its use |
|---|---|---|---|
| Recursive one-step model | Reuses one learned transition throughout the horizon; can exploit many eligible one-step tasks. | Prediction errors enter later inputs; a strong one-step fit may be a weak long rollout. | Repeated-origin full-horizon validation shows useful accuracy/stability for the task. |
| Pooled horizon-conditioned model, as in 6.1–6.3 | Predicts requested leads without prediction feedback; shares a fit across horizons. | Must learn horizon effects from eligible historical origin–horizon tasks; no guarantee of better accuracy. | Directly fitting the requested horizons reduces error on the declared validation objective. |
| Separate direct models, optional variant | Can specialize a fitted mapping to each horizon without feedback. | More fitted models and potentially noisier/inconsistent estimates when long-lead data are limited. | Validation gains justify the extra estimation and maintenance. Do not attribute this model count to the pooled method. |

These are conditional tradeoffs, not a rule assigning short horizons to recursion and long horizons to direct forecasts. Measure training/inference costs for the actual implementations. [Ben Taieb and Atiya: strategy comparison](https://souhaib-bentaieb.com/publications/bias-variance-time-series/).

**Concrete remedies without new information:**

1. **Select the recursive model for the whole rollout.** Evaluate candidate lag sets and complexity/regularization on complete historical 30-step rollouts, rather than choosing solely for one-step error. Every validation target must already be observed by the real fit cutoff. Apply comparable full-horizon selection effort to the other strategies. This is rollout-aware model selection, not a claim that tree fitting differentiates through its recursion.
2. **Learn a historical correction while retaining the recursive base.** Fit a separate correction to historical multi-step forecast errors, with horizon and legitimate origin information as predictors. Apply the learned correction to a new recursive path without any post-origin observation. This is a rectify-style hybrid, not forecast updating. The original research provides the underlying approach; our chosen learner and chronological cross-fitting protocol must be labelled as an adaptation, with no claim of automatic unbiasedness or lower test error. [Ben Taieb and Hyndman: rectify](https://robjhyndman.com/papers/rectify.pdf), [boosted multi-step correction](https://proceedings.mlr.press/v32/taieb14.html).
3. **Compare with direct/pooled forecasting.** This removes the intermediate-prediction dependency itself. It is a useful alternative, not the only proposed remedy and not a guarantee against misspecification or unforeseen changes.

**Fair correction training:** At each historical origin r, fit the base using information available at r, then roll it forward without actual future inputs. A historical correction target is actual load at r+h minus that historical forecast, retained only when r+h is at or before the final training cutoff T. Correction inputs contain no actual target-period observations. Select correction complexity using a further chronological split or nested rolling-origin validation inside the pre-T data; do not fit or select it on displayed final-test errors. Refit the base on eligible data through T, freeze the corrector, and issue all final forecasts at T. Report the extra historical fits and training cost. Use low-complexity corrections as candidates; validate them rather than assume a benefit.

**Default final comparison:** Three strategies—recursive, pooled/direct, recursive plus historical-error correction—with the same issue date and targets. Use actuals plus a selected pair of forecast lines rather than an overloaded plot. The baseline score remains available. Include no-correction as a legitimate outcome if correction validation fails; do not manufacture a successful repair.

**Resolution / limits / falsifier:** All fitting, tuning and correction labels obey the same final cutoff. No post-origin updating or reforecasting enters this comparison. Historical correction can address predictable error patterns, not predict previously unknowable shocks; it can overfit and must be tested. Reject monotonic-error-growth claims, test-fitted corrections or a claim that direct forecasting removes all uncertainty.

**Source / data plan:** Extend/refactor existing `multistep` traces and repeated-origin arrays to use the shared feature contract. Add historical out-of-sample rollout records, correction targets, chronological fitting provenance, corrected paths and held-out errors. ARIMA forecasting replaces unknown future observations with forecasts and future innovations with their conditional expectation; VAR similarly recurses through predicted future values. The link concerns multi-step calculation, not identical estimation or model assumptions.

## 6.5 — Extrapolation: what fails and how to tackle it

**Goal / key claim:** Forecasts can fail when asked to extend patterns outside the training range; an appropriate trend representation can supply extrapolation that a raw-level tree does not learn in the example.

**Narrative contract:** Section 6.4 reduced or avoided prediction feedback → introduce the separate difficulty of extending a trend beyond familiar inputs → forecast the full future level path → relate to sustained demand growth → observe the plateau, explain its mechanism, reconstruct a transformed forecast and test its accuracy.

| Tab | Message | Evidence and reader action |
|---|---|---|
| 1. Recognise extrapolation | Future conditions can lie outside the input ranges represented in training. | Training context, cutoff and a continuing-trend future path versus the raw model. Distinguish a continued trend from an unexpected trend break. |
| 2. Explain the model limitation | Some learned mappings do not continue an open-ended slope merely because time or recent levels increase. | Actual fitted tree routing beyond its outer split, connected to the evaluated tree/boosting forecast. Explain why an explicit linear trend can behave differently. |
| 3. Separate trend and remainder | Model the extending component explicitly and let ML predict the remainder. | Complete training-only trend subtraction and future trend-plus-predicted-remainder reconstruction. No future observations fit the trend or update the rollout. |
| 4. Compare remedies and assumptions | Transformation can help under suitable dynamics; it is not compulsory for every model or dataset. | Raw learner, trend-plus-remainder learner, and a suitable linear trend-plus-weekday baseline. Differencing and reconstruction are optional extensions if they add an evidenced lesson. |

**Dataset / fairness:** First seek a genuine illustrative trend case in the shared real series. If it does not expose the mechanism, use the existing clearly labelled controlled continuing-trend simulation for this dedicated explanatory experiment, with its seed/process locked in advance. State the dataset change and its purpose explicitly; never treat its scores as comparable with German-load scores. Within the experiment, all models receive the same observed history, target period and fixed forecast origin. The main real-data learner comparison remains unchanged.

**Definitions / equation:** Extrapolation means predicting beyond the input domain represented in training; the motivating case is a continuing level trend. Future forecast = projected trend + predicted remainder. The trend model is fitted using training data only; remainders are not automatically stationary.

**Controls / defaults:** Default raw versus trend-plus-remainder, with actuals and cutoff visible. A reconstruction record/step selector supports the mechanism. Keep the appropriate linear/seasonal baseline available without adding many unrelated model controls.

**Expected result / observable:** In the controlled trend example, raw-level tree forecasts may stall while a trend component continues growth. The separate remainder predictor adds local structure. Recompute and report actual errors, including whether the simpler linear baseline wins. A future slope break can defeat the extrapolated trend too.

**Limits / falsifier:** Do not say all ML fails at extrapolation: an explicit linear trend can extrapolate, and performance depends on representation and assumptions. Mean-leaf regression trees/forests and additive boosting have different target-range properties; do not claim all boosted predictions are bounded by original training targets. Reject a trend fitted to final-test values, wrapped residual lags, new actuals during rollout or a universal “always detrend” rule. Distinguish an extrapolation failure from recursive propagation even when both coexist.

**Source / data plan:** Preserve and extend the existing `trend_lesson` evidence: fitted boundary example, train-only trend, lagged remainder inputs, reconstruction, appropriate baseline and fixed-origin paths. No new numerical success target is set. Source: generated fitted evidence and primary tree/boosting documentation cited in the earlier review.

## 6.6 — From point forecasts to calibrated prediction ranges

**Goal / key claim:** A point forecast supplies one value; a prediction interval adds a range whose coverage and width must be evaluated on later outcomes.

**Narrative contract:** All preceding forecast charts supply point values → connect to earlier ARIMA/GARCH uncertainty and introduce quantile boundaries and calibration → issue ranges for the same fixed-origin multi-horizon task → explain planning for plausible deviations → trace one interval construction, then count misses and measure width over repeated origins.

| Tab | Message | Evidence and reader action |
|---|---|---|
| 1. A point forecast leaves uncertainty | A good central prediction does not specify how widely outcomes can vary. | Preserve the chosen model's point path; add a clearly labelled interval and actual outcomes. Explain that target coverage is not certainty on each individual date or on the whole path jointly. |
| 2. Estimate lower and upper outcomes | Quantile models fit conditional percentiles rather than merely optimizing a point prediction. | Same origin–horizon input record, fitted lower/upper outputs and a band. Quantile boundaries need not be symmetric about the point path. |
| 3. Adjust using a separate calibration period | Held-out historical forecast errors provide a correction without using final-test answers. | Train/calibration/test split, one genuine score and signed adjustment. Explain widening or shrinking from actual data. |
| 4. Evaluate the tradeoff | Wider ranges can improve inclusion but reduce precision; narrow ranges can miss too often. | Nominal versus observed coverage, width, misses and an interval score, including per-horizon diagnostics where sample size permits. Keep raw and calibrated results visible. |

**Dataset / controls / defaults:** The same real-load origins and fixed-origin information policy. Select a fixed point-model configuration before final evaluation. Add coverage-level and raw/calibrated display controls only when introduced. Display a readable period while labelling all-period summaries accurately.

**Method choice:** Retain quantile XGBoost plus conformalized quantile regression as the main extension. Add a simple absolute-residual fixed-width calibrated comparator if it serves the tradeoff. No Gaussian-vs-ML straw comparison. Preserve the established point path when adding quantile models; explain the point objective rather than casually calling every point estimate a mean or median.

**Distinguish the two corrections:** Section 6.4's historical-error correction changes point predictions to target forecast accuracy. Section 6.6's interval calibration adjusts prediction ranges to target coverage; it is not the same task and need not change the point forecast.

**Calibration design:** Chronologically separate fit, tuning, calibration and final evaluation. For multi-horizon forecasts, define the score unit and pool versus per-horizon calibration explicitly. Recommend per-horizon corrections only if the historical calibration panel provides enough observations; report counts and coarse diagnostics without inventing a universal minimum. Repeated/overlapping origins are dependent and do not automatically satisfy exchangeability. Do not select between calibration variants using final-test coverage. Multi-horizon marginal coverage does not guarantee simultaneous coverage of the entire path.

**Expected result / observable:** The point forecast remains visible and one interval can be reconstructed. Observed width/coverage tradeoffs reconcile with misses. Better calibration on future data is a hypothesis to evaluate, not an outcome guaranteed by past calibration. Current one-step calibration results cannot be transplanted as evidence for this proposed fixed-origin experiment.

**Baseline / limits / falsifier:** Compare uncalibrated quantiles and a matched held-out residual comparator. The standard CQR coverage theorem assumes exchangeability; arbitrary time dependence or shift needs additional treatment. Wider bands do not necessarily improve the point forecast. Reject unexplained switching to rolling one-step inputs, a claimed coverage guarantee from one test percentage, or an operational cost-saving claim without a decision model. [Original CQR paper, Section 4](https://arxiv.org/html/1905.03222v1).

**Source / data plan:** New fixed-origin quantile/calibration evidence derived from the shared records; current `uncertainty` one-step implementation is a reference pattern, not directly reusable output. Export point/lower/upper paths, calibration scores and counts by the chosen unit, coverage/width/miss/score summaries and source availability. No notebook with this exact protocol has been identified; do not claim parity.

## Implementation order and acceptance

1. Freeze the cross-section contract and objective; record development versus reserved evaluation periods.
2. Run the learner feasibility comparison before new UI prose. This is the decision gate for the successful-forecast demonstration and dataset choice.
3. Generate and audit the shared predictions and mechanistic traces, including whole-horizon quantile calibration.
4. Rewrite the sections in sequence with the exact transitions above. Reuse the forecast timeline in every model-comparison step, rather than substituting a response diagnostic for the central outcome.
5. Keep recursive propagation and historical-only remedies in 6.4, retain extrapolation as 6.5, and retain uncertainty as 6.6.
6. Verify numbers, label availability, every learner/view and both themes/mobile; present one final report. Preserve honest failures and metric disagreements.

Acceptance requires a continuous reader story and visibly useful, reproducible evidence. It does not require all algorithms to win in syllabus order. Implementation followed the subsequent explicit authorization.

## Revision history

- 2026-11-07: Initial learner-progression proposal.
- 2026-11-07, user clarification: retain dedicated 6.5 Extrapolation and final 6.6 uncertainty; make 6.4's pros/cons and conditional strategy choice explicit; replace forecast updating with rollout-aware selection and a historically trained recursive-error correction, evaluated with a fixed information cutoff.
- 2026-11-07, execution: the frozen real-load protocol supports a useful forest improvement, with SVR/XGBoost losses retained. To preserve the exact all-eligible-data point fit in 6.6, use horizon-specific empirical rolling-origin widening rather than the proposed split-CQR and signed shrinking adjustment. These reconstructed fits reuse the current development-selected configuration, do not constitute a nested tuning backtest, and carry no split-conformal coverage guarantee. See the implementation report for the full rationale and checks.

- 2026-11-07, subsequent dataset redesign: the user requested stronger corroborating data and a classical comparison, then approved controlled plus real examples with explained disagreements. The paired next-day rental experiment supersedes the original German-load task; the six-section progression is retained. See `CHAPTER_6_PAIRED_REDESIGN_2026-11-07.md` and `TASKS_6_DATASET_REDESIGN_2026-11-07.md`.
