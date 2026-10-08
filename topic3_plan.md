# Topic 3: Metrics & Validation — Implementation Plan

## Overview

Topic 3 bridges the gap between "fitting models" (Topics 1 & 2) and "evaluating models rigorously." It teaches two core lessons:

1. **Not all error metrics tell the same story** — choosing the wrong metric can make you pick the wrong model.
2. **A single train/test split is fragile** — walk-forward validation provides robust, trustworthy evaluation.

Following the established architecture, we will create:
- **`generate_topic3_data.py`** → Pre-computes all model fits, error calculations, and walk-forward fold results into `public/topic3_data.json`
- **`src/Topic3.jsx`** → React component with 4 interactive tabs
- **Updates to `src/App.jsx`** → Wire Topic 3 into navigation and routing

---

## Tab Structure (4 Tabs)

### Tab 3.1 — "The Metric Zoo" (Interactive Metric Comparison)

**Goal:** Introduce all common forecasting metrics side-by-side on the SAME forecast so users can see how each one "grades" the same model differently.

**Dataset:** Synthetic series with trend + seasonality + a few deliberate large outlier spikes (to expose MAE vs MSE sensitivity).

**Models:** Two pre-fit models on the same data:
- **Model A** — A well-tuned ARIMA that handles the overall shape well but is blindsided by outliers
- **Model B** — A Holt-Winters that tracks outliers slightly better but has worse overall shape fidelity

**Metrics Computed (per model):**

| Metric | Formula Intuition | Key Property |
|--------|------------------|--------------|
| **MAE** | Mean Absolute Error | Linear penalty — treats all errors equally |
| **MSE** | Mean Squared Error | Quadratic penalty — punishes large errors disproportionately |
| **RMSE** | √MSE | Same units as the data — more interpretable than MSE |
| **MAPE** | Mean Absolute % Error | Scale-free — but explodes near zero values |
| **sMAPE** | Symmetric MAPE | Fixes MAPE's asymmetry — bounded 0–200% |
| **MASE** | Mean Absolute Scaled Error | Scale-free, robust — benchmarks against naive forecast |

**Interactive Controls:**
- Toggle between Model A / Model B (button group, same pattern as Tab 2.4)
- A **highlighted residual chart** below the main forecast chart showing the per-point errors as vertical bars (red for positive, blue for negative), so users can visually see WHERE each metric "cares"

**Key Insight Panel Commentary:**
- When Model A is selected: "Model A wins on MAE (X.X) and MASE (X.X) because its errors are small and consistent. But it LOSES on MSE/RMSE because those 2–3 massive outlier misses get squared into enormous penalties."
- When Model B is selected: "Model B wins on MSE/RMSE because it doesn't have any catastrophic outlier errors. But its overall fit is sloppier everywhere else, so MAE/MASE are worse."
- Dynamic bottom callout: "**The Takeaway:** MSE/RMSE is your metric if large errors are catastrophically expensive (e.g., energy grid forecasting). MAE/MASE is better when all errors cost about the same (e.g., inventory planning)."

**Data Generation:**
- Generate a synthetic 200-point series with trend + seasonality + 3-4 injected outlier spikes
- Fit ARIMA(2,1,1) and Holt-Winters(add, add)
- Compute all 6 metrics on the test set
- Store per-point residuals for both models

---

### Tab 3.2 — "MAPE's Fatal Flaw" (The Near-Zero Problem)

**Goal:** A focused, dramatic demo showing why MAPE (the most commonly reported metric in business) can be extremely misleading.

**Dataset:** A series that naturally crosses through zero or near-zero values — e.g., a synthetic "temperature anomaly" or "profit/loss" series that oscillates around zero.

**Demo:** One model with a nearly identical forecast that produces:
- MAE of ~2.0 (perfectly reasonable)
- MAPE of ~850% (absurdly inflated) — because a few near-zero actual values cause the denominator to explode

**Interactive Controls:**
- Slider: **"Zero-Proximity Threshold"** — Lets the user shift the baseline of the data up/down. At baseline = 0, MAPE explodes. As users slide the baseline up to 50, MAPE drops to a sensible 4%. Same model, same errors, completely different MAPE.
- The metric scorecard updates live as the slider moves

**Visualization:**
- Main chart: Actual vs Forecast (shifts with slider)
- Below: A bar showing each metric value — MAPE bar dramatically grows/shrinks as slider moves, while MAE/RMSE/MASE stay rock-steady

**Key Insight:** "MAPE is undefined at zero and explodes near zero. This is why modern forecasting competitions (M4, M5) have moved to MASE and sMAPE. Always sanity-check your data range before reporting MAPE."

**Data Generation:**
- Generate a sinusoidal series oscillating around a configurable baseline (pre-compute for ~11 baseline values: 0, 5, 10, ... 50)
- Fit a single ARIMA model per baseline shift
- Compute all metrics per baseline

---

### Tab 3.3 — "Walk-Forward Validation" (Expanding Window)

**Goal:** Show why a single train/test split is dangerous and how walk-forward validation (expanding window) provides robust, honest evaluation.

**Dataset:** Reuse the Retail Sales + Promotions dataset from Topic 2's SARIMAX tab (the reference material also uses this exact dataset) — great continuity for the syllabus.

**Demo:** 
- **3 Walk-Forward Folds** (expanding training window, fixed 17-week test window each)
- Two models evaluated per fold: **Holt-Winters** vs **SARIMAX**
- Show how each fold produces different metrics — and the AVERAGE across folds is the trustworthy estimate

**Interactive Controls:**
- **Fold selector** (Fold 1 / Fold 2 / Fold 3 / Summary) — clicking each fold zooms the chart to that fold's train/test boundary; "Summary" shows the aggregated metric table
- **Model toggle** — Show/hide each model's forecast lines

**Visualization per fold:**
- Chart showing the full series with the training region shaded light, and the test window highlighted
- Promo events marked with gold dots (as in Topic 2.6)
- Both model forecasts overlaid on the test window
- Metric scorecard for that fold (RMSE, MAE, MAPE, MASE for each model)

**Summary view:**
- A table showing Fold 1/2/3 metrics + the **Mean ± Std** row
- Visual emphasis on how SARIMAX consistently beats HW because it leverages the promo calendar

**Key Insight:** "Walk-Forward Validation simulates real deployment. Each fold moves the cutoff date forward, testing on truly unseen future data. The mean metric across folds is far more trustworthy than any single split. Notice how SARIMAX wins in Folds 2 & 3 (where it has enough data to learn the promo effect) but Fold 1 is tighter — this variance is exactly what single-split evaluation hides!"

**Data Generation (inspired by reference notebook cells 29-30):**
- Generate 156-week retail sales data (identical to Topic 2.6)
- Use `TimeSeriesSplit(n_splits=3, test_size=17)`
- Per fold: fit HW and SARIMAX, store forecasts + per-fold metrics
- Also store the fold boundaries (train_end, test_start, test_end indices)

---

### Tab 3.4 — "Sliding vs Expanding" (Validation Strategy Comparison)

**Goal:** Show the difference between an **expanding window** (all data up to cutoff) and a **sliding window** (fixed-length lookback) — and when each is appropriate.

**Dataset:** A synthetic series with a **regime change** at the midpoint — e.g., a stock-like series that transitions from low-volatility to high-volatility, or a demand series that shifts structurally.

**Demo:**
- Run the SAME model (ARIMA) using two validation strategies across 4 folds:
  - **Expanding window:** train on ALL data up to the fold boundary
  - **Sliding window:** train on only the most recent N observations before the fold boundary
- Show how the expanding window gets poisoned by old-regime data in later folds, while the sliding window adapts

**Interactive Controls:**
- **Strategy Toggle:** Expanding vs Sliding (button group)
- **Window Size Slider** (for sliding window only): 30 / 50 / 70 / 90 observations

**Visualization:**
- A stacked fold view (similar to Tab 3.3) but with the training region visually different:
  - Expanding: full blue shading from t=0 to cutoff
  - Sliding: blue shading only for the last N points before cutoff
- Metric scorecard per fold

**Key Insight:** "When the world changes (regime shifts, concept drift), old data can HURT your model. A sliding window forgets the old regime. An expanding window trusts all history equally. In practice, many production systems use a hybrid: an expanding window with exponential decay weighting."

**Data Generation:**
- Generate 200-point series: first 100 points from ARMA(1,0) with σ=2, next 100 points from ARMA(1,0) with σ=8 (same AR structure, different volatility = regime change)
- For each strategy × window size: run 4-fold walk-forward, store forecasts + metrics per fold

---

## File Deliverables

| File | Description |
|------|-------------|
| [`generate_topic3_data.py`](file:///c:/Users/jeste/Desktop/Projects/time-series-forecasting/ts-forecasting-demo/generate_topic3_data.py) | Python script generating `public/topic3_data.json` |
| [`src/Topic3.jsx`](file:///c:/Users/jeste/Desktop/Projects/time-series-forecasting/ts-forecasting-demo/src/Topic3.jsx) | React component with 4 tabs (reuses `ChartWithZoom`, `Layout` pattern from Topic2) |
| [`src/App.jsx`](file:///c:/Users/jeste/Desktop/Projects/time-series-forecasting/ts-forecasting-demo/src/App.jsx) | Updated: unlock nav item for Topic 3, add routing + sub-topic nav items, update header text |

## Architecture Notes

- **Same static-data pipeline**: Python pre-computes everything → JSON → React reads + renders. Zero backend needed.
- **Reuse `ChartWithZoom` and `Layout`** components from Topic2.jsx (consider extracting to shared file, or duplicate as-is to match existing pattern).
- **No new npm dependencies** required — all charts use existing Recharts + Lucide.
- **Estimated `topic3_data.json` size:** ~200-400KB (much smaller than Topic 1's 3.3MB since we're not doing exhaustive parameter grids).

## Execution Order

1. Write `generate_topic3_data.py` and run it to produce `public/topic3_data.json`
2. Create `src/Topic3.jsx` with all 4 tabs
3. Update `src/App.jsx` to wire in Topic 3
4. Test locally with `npm run dev`
