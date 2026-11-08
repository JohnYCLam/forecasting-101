<!-- agy smoke ok -->
# Time Series Forecasting Interactive Course Dashboard

This repository contains the interactive frontend dashboard for our comprehensive Time Series Forecasting course. Built with React, Vite, Recharts, and KaTeX, this application brings complex statistical models and machine learning pipelines to life through dynamic, slider-driven visualizations, honest backtesting, and interactive case studies.

## The Syllabus

This dashboard is designed to walk students through the entire landscape of Time Series Forecasting, from traditional statistical models to modern deep learning and foundation models:

1. **Basic Forecast** (Exponential Smoothing, Holt, Holt-Winters) — *Completed*
2. **ARIMA & Selection** (ARMA, Auto-ARIMA, SARIMAX) — *Completed*
3. **Metrics & Validation** (Loss landscapes, CV splits, data leakage) — *Completed*
4. **Volatility: GARCH** (Conditional heteroskedasticity, VaR, ARIMA-GARCH) — *Completed*
5. **VARIMA** (Multivariate feedback, Granger causality, CUSUM stability, VECM) — *Completed*
6. **Traditional ML** (Linear regression, SVR, tree ensembles, forecast strategies, extrapolation and prediction ranges)
7. **Facebook Prophet** — *Upcoming*
8. **Traditional DL** (RNNs, LSTMs, CNNs) — *Upcoming*
9. **Modern DL** (Transformers) — *Upcoming*
10. **RAG Demo** (Retrieval-Augmented Generation for Time Series) — *Upcoming*
11. **Foundation Models** (Zero-shot forecasting) — *Upcoming*

## Current Progress

### Architecture & UI/UX
- **Tech Stack:** React 19, Vite 8, Recharts 3, KaTeX, Lucide Icons, `@vercel/analytics`.
- **Shared Zoom Layer:** Modular zoom/pan architecture (`ZoomableChartShell`, `SyncedDualChart`, `SyncedStackedChart`) supporting synchronized dual-axis views, dynamic Y-domain auto-scaling, wheel-zoom, and touch/click focal pinning.
- **Design System:** Responsive "glassmorphism" aesthetic with light/dark theme switching and collapsible desktop navigation.
- **Mobile First:** Responsive layout seamlessly scaling across desktop and mobile devices.
- **Data Pipeline:** Python generator scripts (`statsmodels`, `arch`, `scikit-learn`, `xgboost`) pre-compute all model permutations into static JSON payloads. The React frontend is 100% static, instantly responsive, and cost-effective to deploy.
- **Forecast Honesty Hard Gate:** Enforced anti-fabrication standards; all forecasts and evaluation metrics originate strictly from fitted models with validated seeds (see `docs/audit/INCIDENT_REPORT_FORECAST_AUDIT.md`).

---

### Topic 1: Exponential Smoothing (Completed)
Visualizes the mechanics of classical smoothing techniques:
- **Simple Exponential Smoothing (SES):** Interactive $\alpha$ slider demonstrating memory decay on stationary series.
- **Holt's Linear Trend:** Interactive $\alpha$ and $\beta$ sliders showing the interplay between level tracking and trend inertia.
- **Holt-Winters:** Full seasonal model with interactive $\alpha$, $\beta$, and $\gamma$ sliders on changing seasonal amplitudes.

### Topic 2: ARIMA & Model Selection (Completed)
A comprehensive 6-tab deep dive into the ARIMA family:
1. **ARMA(p, q) Basics:** Synthetic data generation governed by interactive `p` and `q` sliders.
2. **Synthetic Battles:** ARIMA vs Holt-Winters on transient shocks (MA), aperiodic cycles (AR2), and high-frequency mean reversion (AR1).
3. **Real World Data:** Demonstrating how ARIMA captures the 11-year Solar Cycle (Sunspots) and Treasury Bill inertia better than baseline linear trends.
4. **Auto vs Manual:** Highlighting the danger of blind Auto-ARIMA ($d=1$, unit root) versus constrained manual ARIMA ($d=0$, mean reversion / damping).
5. **SARIMA vs Holt-Winters:** Handling heteroskedasticity in Australian Monthly Gas Production via log transformations and seasonal differencing.
6. **The Magic of SARIMAX:** Modeling Weekly Retail Sales with a simulated Promotion Calendar, comparing baseline Holt-Winters, SARIMA, and SARIMAX with exogenous promotional markers.

### Topic 3: Metrics & Validation (Completed)
Rigorous evaluation and backtesting methodology across 4 interactive modules:
1. **Metrics Deep Dive:** Comparing MAE ($L_1$), MSE ($L_2$), RMSE, and MAPE/sMAPE across normal, heavy-tailed, and skewed error distributions.
2. **Loss Landscape & Penalty Gradients:** Interactive penalty parameter exploration contrasting $L_1$ median robustness against $L_2$ sensitivity to volatile market shocks.
3. **Cross-Validation Strategies:** Walk-forward (expanding window) vs rolling window cross-validation, demonstrating why standard shuffled K-fold cross-validation is invalid for temporal data.
4. **Data Leakage & Production Pitfalls:** Demonstrating lookahead bias, scaler/normalizer contamination, and train-test horizon overlaps.

### Topic 4: Volatility & GARCH (Completed)
Dynamic risk and market shock modeling across 6 subtabs:
1. **Introduction to ARCH:** Volatility clustering, fat tails, and heteroskedastic return series using S&P 500 daily market data.
2. **The GARCH(p, q) Model:** Interactive $\omega, \alpha, \beta$ controls exploring volatility persistence, unconditional variance, and stability boundaries ($\alpha + \beta < 1$).
3. **Performance Validation:** Comparing rolling window standard deviations against realized volatility proxies across calm and crisis regimes.
4. **Value at Risk (VaR):** Parametric 95% and 99% VaR thresholds with historical exceedance backtesting (Kupiec proportion of failures test).
5. **ARIMA-GARCH Joint Modeling:** Two-stage modeling coupling conditional mean estimation (ARIMA) with conditional variance dynamics (GARCH).
6. **Extensions & Limits:** Asymmetric leverage effects (EGARCH, TGARCH) and Student's $t$ heavy-tailed distributions.

### Topic 5: VARIMA — Forecasting Connected Series (Completed)
Multivariate econometric modeling and cross-series feedback across 8 subtabs:
1. **What VARMA Is:** Multivariate autoregression with simultaneous feedback loops (GDP, Consumption, Investment).
2. **Coefficient Matrices:** Interactive inspection of lag transition matrices and cross-variable impulse coupling.
3. **Problems with VARMA:** Parameter proliferation ($k^2 p$ burden) and model order identification via AIC/BIC criteria.
4. **Granger Causality:** Empirical Wald testing to determine directional predictive feedback between macroeconomic indicators.
5. **Walk-Forward Validation:** Multi-step expanding-window backtesting comparing multivariate VAR against univariate ARIMA baselines.
6. **Curse of Dimensionality:** Empirical demonstration of parameter degradation as system dimension $k$ increases, motivating shrinkage and parsimony.
7. **Coefficient Stability & Resilience:** Parameter drift tracking across historical regimes (pre-1984 Volcker disinflation vs Great Moderation) with automated CUSUM boundary breach diagnostics ($\pm 0.948$).
8. **Cointegration & VECM:** Johansen cointegration tests and Vector Error Correction Models (VECM) for non-stationary series bound by long-run equilibrium.

### Topic 6: Traditional Machine Learning
Paired controlled and real hourly rental forecasts, with a complete next-day horizon issued from each daily origin:
1. **From Time Series to ML:** Ordinary linear regression, complete training records and weights, forecast-time information leakage, and feature engineering against a seasonal-naive baseline.
2. **Support Vector Regression:** A nonlinear learner on the identical training records, fitted support-vector contributions, training tolerance and full-horizon forecasts.
3. **Trees & Classical Comparison:** Follow a fitted decision tree, average genuine forest constituents, inspect XGBoost corrections, compare controlled/real results, and use the dedicated **ML versus classical** tab for Holt-Winters, seasonal ARIMA, seasonal VAR and a matched-predictor regression-plus-ARIMA comparator.
4. **Direct & Recursive Forecasting:** Complete input records and provenance, strategy tradeoffs, full-rollout model selection, and a historically learned recursive point-error correction without new post-origin observations.
5. **Trend & Extrapolation:** A continuing synthetic trend, fitted boundary routing, trend/remainder reconstruction and an honest comparison with linear trend plus weekday indicators.
6. **Prediction Ranges & Calibration:** Preserve the same fixed-origin point path, fit quantile boundaries, widen using reconstructed historical forecast errors, and evaluate coverage, width, misses and interval score. Empirical rolling-origin calibration is not presented as a split-conformal guarantee.

Sections 6.1–6.4 and 6.6 share a 24-hour task and the same Dataset/origin selectors. The real source is UCI Capital Bikeshare; the controlled simulation has declared working-day/hour/weather interactions and fixed seed 42. Twenty-one earlier development days select settings. All 366 daily origins in 2012 evaluate point forecasts, including every observed target hour. Four predefined quarterly origins provide fitted teaching illustrations. Section 6.5 explicitly switches to its separate seeded rising-load experiment. Recursive correction and uncertainty are evaluated on the illustrated days, with their narrower scope stated.

Forest mean daily MAE improves over last-week repetition by 21.2% in the controlled case and 21.0% in the real case. The four-week average remains competitive. Full-year losses, model-ranking changes, an inspected real-data rebound and interval-width costs remain visible. These results support this task, not universal ML superiority.

Regenerate with `python scripts/generators/regenerate_topic6_pairs.py` (or `npm run data:topic6`). This refits the complete evaluation and teaching evidence. For isolated case refits, run `--evaluate-case controlled` and `--evaluate-case real`; then `--check --reuse-canonical` independently rebuilds the teaching evidence and compares the saved output, excluding timing diagnostics. Frozen grids, development results and selected settings are in `scripts/generators/topic6_pair_selection.json`. The former partial/regression regenerators refuse to overwrite the paired schema. The active components are `Topic6PairedIntro.jsx`, `Topic6Pairs.jsx` and the shared/extrapolation helpers in `Topic6Sections.jsx`.

See [the paired redesign and verification report](docs/topic6/CHAPTER_6_PAIRED_REDESIGN_2026-11-07.md). The earlier [German-load implementation report](docs/topic6/CHAPTER_6_IMPLEMENTATION_2026-11-07.md) is retained as a historical record.

---

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run verification tests & chart integrity checks:
   ```bash
   npm test
   npm run test:charts
   ```

4. To regenerate topic datasets from source models:
   ```bash
   # Using npm:
   npm run data:topic1
   npm run data:topic6
   npm run data:all

   # Or using the Python runner CLI:
   python scripts/generators/run.py 6
   python scripts/generators/run.py 6 --validate
   python scripts/generators/run.py all
   ```
