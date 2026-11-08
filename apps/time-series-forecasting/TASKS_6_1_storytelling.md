# Section 6.1 storytelling review and revision plan

Date: 2026-11-03 (Australia/Sydney)
Status: recommendation only; implementation pending review.
Source: user feedback and current working-tree implementation, including uncommitted changes.
Skills: content-feedback-handler, evidence-first-demo-design, commentary-storyboard, commentary-style-guide, plain-language-guard, concept-explainer, plan-to-tasks.

## Assessment

The material is largely present, but prerequisites arrive late. The first tab starts with row expansion; Ridge is introduced as a software pipeline rather than an idea. Important mechanics compete with internal naming explanations. The final tab has useful evidence but attributes a bundled feature change too narrowly.

| User item | Classification | Verdict and placement |
|---|---|---|
| 1. Motivation, model introduction, transformation, forecast protocol, leakage, feature differences | CONFUSION + RECOMMENDATION | Agree. Rebuild the sequence around the reader's decisions. PAGE. |
| 2. Detailed transformed tables in Dataset Details | RECOMMENDATION | Agree with a qualification: keep a tiny worked transformation visible; move exhaustive tables and definitions into details. PAGE + DEEP-DIVE. |
| 3. Replace Safe / Full Safe | RECOMMENDATION | Agree. Describe the information used. PAGE, consistently across controls, legends and tables. |
| 4. Finish with feature engineering and model impact | RECOMMENDATION | Agree. Hold the algorithm fixed, compare feature groups, retain the baseline and mixed metric result. PAGE. |
| 5. Same date from different origins/horizons; why this choice; why no ensemble | QUESTION + RECOMMENDATION | Agree with a qualification: explain origin/horizon on the page; put forecast combination detail in optional details. Training pools examples; it does not ensemble predictions. PAGE + DEEP-DIVE. |

Benefit: prerequisites precede mechanics and every explanation has a visible example.
Risk: a long ML introduction or complete feature dictionary could obscure the forecasting lesson.
Effort: medium for the narrative/UI restructure; medium additional generator work to isolate feature-group effects and expose the existing leakage diagnostic clearly.

## Evidence and corrections

- `src/Topic6.jsx:297-351`: the current first tab begins with source rows and origin expansion. The second introduces "StandardScaler -> Ridge" and a dense description of pooling. Internal column-name compatibility is repeated in the guide, tables and feature reference.
- `scripts/generators/generate_topic6_data.py:83-170`: section 6.1 uses a separate origin-anchored feature builder. History is observed through each origin; future dates supply calendar features. One scaled Ridge model is fitted per feature set.
- Current JSON: 168 training origins, 30 horizons each, 5,040 rows. Training origins start 2018-10-01; the full candidate-origin endpoint is 2019-08-31. Distinguish candidate endpoints, the every-other-day sampled origins actually used, and target-label coverage when reporting dates.
- Test origin: 2019-09-30, predicting 2019-10-01 through 2019-10-30 without updating history or refitting within that path. This is a fixed-origin, 30-day forecast. It is not evidence that a fixed-length rolling training window is best.
- The fitted Ridge uses horizon, sine/cosine horizon encodings, and (in the largest feature set) target-day weekday encodings and a weekend indicator. Calendar and two origin-day renewable inputs are introduced together. The existing comparison cannot isolate their separate contributions.
- Current holdout MAE (MW): history 5,507.83; history + averages 5,487.11; combined calendar/renewable set 1,690.57; seasonal naive 1,870.53. RMSE reverses the last comparison: 3,336.66 versus 2,941.57. Describe this as mixed evidence on one forecast window.
- The two smaller-set forecast paths are nearly flat, not exactly flat: their ranges are approximately 298 MW. Their horizon inputs can vary the path; the current additive representation lacks explicit target-weekday alignment. Do not generalize this result to all lag-based ML models.
- Leakage diagnostic: future target load is deliberately included as an input. Its invalid holdout MAE is 9.86 MW; replacing that unavailable input with origin-day load gives MAE 4,506.22 MW. These are two different input conditions. The fallback is one constructed failure illustration, not the inevitable numerical consequence of leakage.
- The chart payload currently contains the fallback path, not the invalid future-informed path. Exposing the invalid result as an explicitly labelled diagnostic would explain the temptation more clearly.
- The largest combined-set miss is on 2019-10-03: error 14,595.59 MW. The model has weekday/weekend inputs but no holiday flag. Do not imply that switching to trees automatically supplies missing holiday information or fixes this miss.
- `references/boost-vs-forest-ts/scripts/build_daily_dataset.py:39-48` averages hourly load but sums hourly solar/wind. The raw UI labels all three as MW. Verify source units and hourly aggregation and correct renewable labels; do not relabel these sums as average MW. Check reporting-delay assumptions before calling origin-day actuals operationally available.
- Current raw preview is 2018-10-01 through 2018-10-07, but the transformed preview includes earlier lags and targets through 2018-11-14. It cannot serve as a complete worked conversion without additional linked source rows.
- Integrity validator run during review: PASS. This checks the JSON contract; it does not prove statistical correctness or operational data availability. No generator rerun or browser visual inspection was performed for this review.

## Concept ledger

Claim: tabular forecasting depends on constructing useful inputs that would be available when the forecast is issued; keeping Ridge fixed makes the effect of changing those inputs visible.

Definitions: feature = an input column; target = the value to predict; forecast origin = the latest observation date available when issuing the forecast; horizon = days ahead of that origin; information leakage = using information unavailable at that forecast time.

Equation, if useful: target date = origin date + days ahead. Introduce the words before T and h. Introduce ordinary linear regression first: prediction = intercept + weighted inputs, with weights learned by minimizing squared training errors. Then explain regularization as adding a penalty to discourage excessively large weights, and Ridge as linear regression with a squared-weight penalty. Correlated load lags motivate this choice. Explain the trade-off: some training fit is sacrificed in pursuit of more stable predictions on new data; improvement is not guaranteed. A penalized-loss derivation is unnecessary.

Scope: one pooled Ridge per feature set, one output per row, horizons 1-30, one test origin. Shared weights across horizons do not imply arbitrary horizon-dependent interactions. Scaling is fitted on training data only.

Observable: trace a source observation to an input and a later observation to a training target; hide future targets at forecast time; see how changing features changes the forecast and MAE/RMSE.

Falsifier: any input requires post-origin observations, or a claimed feature-group improvement is absent/negative in generated results. Retain honest results and revise the interpretation; do not tune the test window to obtain a preferred story.

## Recommended storyboard

Keep four commentary tabs. Each opens with the result established immediately before it. Use short labelled paragraphs in the established Topic 4/5 voice; approximately 150-220 words per tab, with one takeaway and one limitation.

| Tab / single message | Beat and visible element | Terms and reader action |
|---|---|---|
| 1. From statistical models to ML: models need useful inputs | Connect Topic 5's explicit cross-series relationships and long-run structure to a single-target task with many candidate signals. ML offers alternative ways to learn relationships; it does not supersede those structures or guarantee improvement. | Explain feature and target using load forecasting. |
| 1, continued | Introduce linear regression as an intercept plus weighted inputs learned from historical examples. Related lags can make estimated weights unstable. Introduce regularization as a penalty discouraging excessively large weights, then name Ridge as the squared-weight version. Introduce seasonal naive separately as last week's pattern repeated. Show a small input -> model -> load diagram. | Explain the training-fit versus stability trade-off without promising improvement. Ridge remains linear in the supplied features. Nonlinear model mechanics belong in 6.2. |
| 2. Turn observations into examples: each row is a past forecasting task | Show a small raw-data slice beside three derived rows. Highlight origin, selected historical readings, horizon, target calendar and later-observed target in matching colours. | Begin with one horizon, then expand the same origin to more horizons. A feature is an input; the target is the answer learned from history. |
| 2, continued | Select a second origin; history changes. Within one origin, history stays fixed while horizon, target calendar and labels change. | Specialized forecasting APIs construct temporal structure internally; a general-purpose regressor expects us to supply input/target rows. |
| 3. Issue the forecast: use only information available at the origin | Mark 2019-09-30 and shade the next 30 days. Forecast rows mirror training rows, but target cells are unknown. Show one fitted model scoring each horizon row. | Define origin and horizon. Explain no forecast feeds the next one, and no new actuals arrive within this displayed path. |
| 3, continued | Toggle a separate leakage diagnostic: proper forecast versus future target supplied as input. Pair the suspiciously tiny invalid error with a highlighted forbidden column; optional fallback illustrates what happens when that column is missing. | Mark the invalid line/score as using future observations, never as a competing forecast. Keep it visually separate from valid model rankings. |
| 4. Features shape the forecast: compare inputs while keeping Ridge fixed | Step through history -> recent averages -> calendar -> renewable observations, with the same origin, labels, Ridge settings, baseline and metrics. | Show a short "Added inputs / what they describe" note on each selection. If added features do not improve error, state that. |
| 4, continued | Compare weekly shape, MAE and RMSE; inspect the large October 3 miss. | Useful representation matters; more columns do not guarantee better forecasts. 6.2 then changes how the model learns from the inputs. |

Bridge direction: briefly acknowledge Topic 5.8's lesson that useful structure must be represented. Connect to wider Chapter 5 issues of choosing predictors and model restrictions. Avoid claiming Ridge is nonlinear, ML automatically solves drift, or ARIMA cannot use external regressors.

## Card and terminology plan

- Guide card: motivation, one mechanism, one guided action, one result/limitation. Remove internal compatibility notes and exhaustive pipeline terminology.
- Main demonstration: keep the minimal worked raw-to-training example visible. Use a compact set of columns; disclose the rest progressively.
- Dataset Details: source, frequency, verified units, origin and target spans, sampled-origin count, labels available by cutoff, scaling, fixed alpha, complete feature dictionary, exact calendar encodings and optional expanded tables. Describe facts here; teach concepts in the guide.
- Feature controls: `History`, `+ Recent averages`, `+ Calendar`, `+ Renewable observations`. State once that horizon inputs are included in every model. Use explicit cumulative descriptions in the details.
- Legend: `Ridge forecast`; controls: `Input features`; baseline: `Repeat last week (seasonal naive)` on first use, then `Seasonal naive`.
- Diagnostic: `Uses future load (invalid)` and, if retained, `Missing-input fallback`. Replace Safe / Full Safe consistently. Internal data keys can remain stable.
- Describe history with actual dates or "latest observed load", rather than presenting the internal `lag_1` name as a natural one-day lag from every target.

## Origin, horizon, windows and forecast combinations

Use the user's example: 2019-10-07 is seven days ahead of 2019-09-30 and fourteen days ahead of 2019-09-23. These are different forecasting tasks because the later origin has another week of observations.

Explain three independent choices: training-history coverage, lookback lengths used for features (including seven- and 28-day averages), and the 30-day forecast horizon. The displayed path has one fixed origin. The two-day stride samples historical training tasks for computation; it is not the forecast horizon or a rule that independent samples have been obtained.

Training pools many origin/horizon examples to estimate one set of weights. Multiple rows can share a target date while describing different information sets. Their overlap means 5,040 rows are not 5,040 independent daily observations. Split by time and label availability, not by randomly shuffling rows. Only include labels observed by the training cutoff, and fit preprocessing there as well.

Combining forecasts is possible, but separate from pooling training rows. At September 23, the September 30 forecast does not yet exist. At September 30, an older forecast can be combined with a newer one, but it carries an older information set. For 6.1, choose one fixed origin to make a 30-day planning forecast and feature comparisons easy to inspect; it is a teaching/operational setup, not a claim that fixed-origin forecasting is universally best. Keep combining forecasts in optional details, with weights evaluated on earlier forecast origins rather than chosen using this holdout.

### Follow-up: practical use and demonstration scope

Combining forecasts from different issue dates is used in practice, particularly in weather forecasting, where it is called a lagged ensemble or lagged-average forecasting. ECMWF documents both the interpretation of current/recent ensemble runs and extended-range evidence that including recent older runs can improve skill. This establishes practical use; it does not establish improvement for this electricity-load Ridge model.

Why it can help: earlier runs provide additional forecast alternatives at low incremental computation cost; averaging can reduce errors when their errors differ usefully. Why it can hurt: old runs miss new observations or a recent change, and their errors may closely duplicate the new run's errors. Availability, age, horizon and error dependence all matter. Avoid claiming the newest forecast is always best or a blend is always better. A blend's value must be checked against the latest forecast alone on earlier chronological evaluation periods.

Recommendation for 6.1: include a compact optional visual under tab 3, labelled `Same date, different forecast origins`. Two arrows from September 23 and September 30 converge on October 7 and carry horizon labels 14 and 7. At the September 30 decision date, both forecasts are available. Add an optional conceptual combination arrow with a short explanation of lagged ensembles. If values are shown, generate genuine forecasts from the corresponding information cutoffs; label any hypothetical arithmetic explicitly as illustrative. This is an explanation of origin/horizon and availability, not a new performance contest or a fifth commentary tab.

Defer an evaluated ensemble experiment to a separately scoped extension of 6.4's forecast-strategy comparison: compare latest-only, a predefined equal-weight blend, and optionally weights selected on earlier validation periods, across multiple decision dates and matched target dates/horizons. All component forecasts must have been issued by the decision date. Fit each archived forecast using only labels and preprocessing available at its own origin; do not reconstruct an older forecast with the later model. Keep forecast revision effects separate from claims about ensembling and do not tune weights on the displayed holdout. Show a neutral or worse blend if that is the result. This comparative experiment is not part of the core implementation tasks below.

## Implementation tasks (not started)

- [ ] T1 Update the 6.1 concept and storyboard contract.
  - File: `docs/topic6/TOPIC6_EXECUTION_LEDGER.md`, section 6.1 only.
  - Details: record this four-tab sequence, linear regression -> regularization -> Ridge introduction, fixed-origin protocol, optional origin/horizon visual, feature comparisons, unchanged test window, definitions and honest-result falsifiers.
  - Verify: `rg -n '6.1|falsifier|origin|Calendar' docs/topic6/TOPIC6_EXECUTION_LEDGER.md` -> the approved scope and required contract are present; review the resulting section against this storyboard.
- [ ] T2 Refine `gen_tab1` evidence.
  - File: `scripts/generators/generate_topic6_data.py`, `gen_tab1` only.
  - Details: separate calendar from renewable additions, preserve existing comparison outputs, expose the existing invalid diagnostic predictions with explicit metadata, create a traceable raw-to-row example, export exact sampled-origin/label spans, remove hardcoded empirical status strings. Verify renewable aggregation and units from the reference builder. No seed/origin/test-window search.
  - Verify: `python -m py_compile scripts/generators/generate_topic6_data.py` -> passes; review assertions for feature availability, preview tracing and label cutoff before generation.
- [ ] T3 Generate and validate the updated payload.
  - File: `public/topic6_data.json`, generated only.
  - Details: retain honest results for all added feature tiers. Check unrelated subsection outputs for unintended change.
  - Verify: `python scripts/generators/run.py 6` -> generation succeeds; then `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py public/topic6_data.json` -> PASS. Check origin/label boundaries and feature-specific predictions against the script; validator alone is insufficient.
- [ ] T4 Rebuild the 6.1 guide and matching views.
  - File: `src/Topic6.jsx`, activeTab 1 only.
  - Details: four-tab storyboard, linear regression -> regularization -> Ridge introduction, visible miniature conversion, forecast cutoff, compact optional same-target/two-origin diagram, separate invalid diagnostic, cumulative feature controls, verified units, concise Dataset Details and JSON-driven result text. Do not promise tree models repair missing information. No ensemble performance experiment in this task.
  - Verify: `npm run lint` -> no introduced errors; browser-check every 6.1 tab/control in light/dark and mobile/desktop, including invalid-line labelling and source-to-feature tracing.
- [ ] T5 Record evidence and limitations.
  - File: `docs/topic6/TOPIC6_EVIDENCE_REPORT.md`, section 6.1 only.
  - Details: revised feature comparisons, MAE/RMSE disagreement, diagnostic conditions, information-availability assumptions, single-window scope and no general superiority claim.
  - Verify: `rg -n '6.1|MAE|RMSE|leak|origin' docs/topic6/TOPIC6_EVIDENCE_REPORT.md` -> every revised claim matches generated JSON and the approved narrative.

## Final gate for later implementation

- Apply `demo-correctness-review`, `demo-explainability`, `visual-check` and `verify-and-report` at their relevant gates.
- Run lint, tests, build, integrity and commentary checks once after the final implementation; rerun only affected checks if fixes follow.
- Acceptance: a reader can explain why ML is introduced, what Ridge and seasonal naive do, how one row is built, what is known at the origin, how 30 predictions are produced, why leakage gives deceptive scores, and what each feature group changes.

## Sources

- Current component, generator and `public/topic6_data.json`; previous chapter's final commentary in `src/Topic5.jsx`.
- Reference data aggregation: `../references/boost-vs-forest-ts/scripts/build_daily_dataset.py` and dataset description in `src/data.py` of that reference project.
- Ridge definition: https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Ridge.html
- Lagged-feature construction and chronological evaluation: https://scikit-learn.org/stable/auto_examples/applications/plot_time_series_lagged_features.html
- Linear regression and Ridge regularization: https://scikit-learn.org/stable/modules/linear_model.html
- Practical lagged ensembles: https://confluence.ecmwf.int/spaces/FUG/pages/673550774/Section+6.1.1.2+Lagged+ensembles
- ECMWF extended-range lagged-ensemble evidence: https://www.ecmwf.int/en/newsletter/173/earth-system-science/next-extended-range-configuration-ifs-cycle-48r1

No application, generator or data changes were made during this review.
