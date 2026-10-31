---
name: demo-correctness-review
description: Verify a demo is statistically correct and really demonstrates the claim - pre-state the expected result, check split discipline and leakage, require a baseline, check the numbers against the notebook, and redesign instead of patching if the effect is not visible. Use when planning data for a demo and again after generating its JSON.
disable-model-invocation: true
---

# demo-correctness-review

Complements `forecast-data-integrity` (honest computation). This skill checks the demo is also CORRECT and TEACHES the claim.

## Phase A: before generating data (write into the plan or task file)
1. Claim: one sentence the demo should prove.
2. Expected result: what the viewer should see, with rough magnitude (for example "VAR price MAE clearly below ARIMA after the shock").
3. Mechanism: why the data should produce that result (what is in the training data that makes the model able to learn it).
4. Baseline: the simple model it is compared to.
5. Falsifier: what result would mean the demo does NOT work.
6. Synthetic-data lock (if applicable): write the data-generating process, seed, shock timing/magnitude, split, and expected signs before the first run. These are design inputs, not knobs to tune after seeing holdout performance.

## Phase B: after `python generate_topicN_data.py`
1. Run `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py` (must PASS).
2. Split discipline:
   - [ ] Parameters, orders (AIC/BIC grids), scaling and hyperparameters selected on TRAIN only.
   - [ ] Test period strictly after train. No shuffling of time series.
   - [ ] No test values in features (no leakage via rolling stats or normalization over the full series).
   - [ ] Multi-step forecasts are truly multi-step (not one-step with true lags unless labeled "one-step").
3. Baselines:
   - [ ] A naive/simple baseline exists (naive, seasonal naive, ARIMA, or previous topic's model).
   - [ ] Baseline is tuned with the same effort as the new model.
4. Metrics:
   - [ ] Metric appropriate to the claim (RMSE/MAE for level, QLIKE for variance, coverage for intervals).
   - [ ] Computed from arrays in the script, same horizon and window for model and baseline.
5. Notebook cross-check: compare 2-3 numbers to the notebook (see `notebook-to-demo`). Record both. Large gap -> investigate.
6. Sanity checks:
   - [ ] Stationarity/invertibility warnings from statsmodels reviewed.
   - [ ] Values finite (no NaN/inf in JSON), plausible units and ranges.
   - [ ] Output deterministic: run twice, compare JSON hash (`Get-FileHash public/topicN_data.json`).
7. Compare actual outcome with the Expected result from Phase A.
8. Inspect all plotted series, equations, and selectable parameters. Record any sign mismatch, surprising loser, visually absent effect, or result the commentary does not explain. One intended winner is not enough for a pass.

## If the outcome does not match the expectation
Pick, in this order, and report which:
1. The data lacks the information for the model to learn the effect -> add informative variation to the TRAINING data (as notebook 101 cell 32 does). Never inject hand-made forecasts.
2. The wrong model/order for the claim -> use the notebook's.
3. The claim is wrong/too strong -> change the claim and commentary to the honest finding, and show the gap.
Never tweak seeds, shock sizes/timing, offsets, splits, or windows after seeing holdout results merely to make the graph or metric look good (that is demo p-hacking). A substantive redesign requires a new stated mechanism and falsifier before rerunning. Record the decision in `.agents/LESSONS.md`.

## Do not
- Do not select orders or hyperparameters using test data.
- Do not compare a tuned new model with an untuned baseline.
- Do not hide a failure case. Show it and explain.
- Do not report a pass without the numbers.

## Done when
Phase A is written, Phase B checks all pass with numbers, and any mismatch has a recorded decision.
