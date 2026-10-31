---
name: forecast-data-integrity
description: Generate or modify demo data honestly in generate_topic*_data.py. Use whenever a forecast, fitted value, coefficient, or metric is produced for the dashboard (ARIMA, VAR, VARIMA, GARCH, smoothing, Granger). Prevents hardcoded or faked forecasts.
disable-model-invocation: true
---

# forecast-data-integrity

Background: `docs/audit/INCIDENT_REPORT_FORECAST_AUDIT.md` documents a forecast that was faked to look accurate.
This skill exists so that never happens again.

## When to use
Any edit to `generate_topic*_data.py`, or any task that adds a forecast/metric to the UI.

## The honesty contract
1. Split data into train and test BEFORE fitting. Fit on train only.
2. Forecasts come from a model call (`.forecast(...)`, `.get_forecast(...)`, `.predict(...)`, or an explicit OLS `X @ beta`).
3. Actual and forecast must come from DIFFERENT computations. Forecast must never be `actual + c`, `actual * c`, or the same closed-form formula as the data generator.
4. Metrics (RMSE, MAE, AIC, p-values) are computed from the arrays in the script, then written to JSON.
5. Seed all randomness: `np.random.seed(42)`.
6. If the honest fit is poor, do one of: (a) add informative variation to the TRAINING data (as the notebook does), (b) switch to the model the notebook uses, (c) keep the gap and let the UI explain it. Never patch the numbers.

## Steps
1. Read the matching notebook in `../references/` and the topic plan file for the intended model and settings.
2. Open `templates/honest_forecast.py`. Copy the pattern into the new `gen_*` function.
3. Add the function's output to the topic dict in `main()`.
4. Run `python generate_topicN_data.py`. It must finish with `[OK] Saved ...`.
5. Run `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py`. It must print `RESULT: PASS`.
   For a NEW or changed topic file run it with budget and required keys from the plan, for example:
   `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py public/topicN_data.json --max-kb 1024 --require-keys tab1.actual,tab1.forecast`
   It also fails on NaN/Infinity in the JSON (the browser cannot parse those; use null). Existing big files only produce a WARN without `--max-kb`.
6. Compare 2 numbers from the JSON to the notebook output. Report both numbers. If they differ a lot, say so.

## Do not
- Do not write literals like `+ 1.2` to nudge a forecast.
- Do not build a forecast array from the test/actual array.
- Do not paste numbers from the notebook into the JSON. Re-derive them with the script.
- Do not catch exceptions to substitute fallback numbers.
- Do not change `np.random.seed` just to get a nicer result.

## Done when
Script runs, validator passes, and the report lists which model call produced each forecast.
