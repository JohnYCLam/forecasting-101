# Time Series Forecasting Interactive Course Dashboard

This repository contains the interactive frontend dashboard for our comprehensive Time Series Forecasting course. Built with React, Vite, Recharts, and KaTeX, this application brings complex statistical models and machine learning pipelines to life through dynamic, slider-driven visualizations, honest backtesting, and interactive case studies.

## The Syllabus

This dashboard is designed to walk students through the entire landscape of Time Series Forecasting, from traditional statistical models to modern deep learning and foundation models:

1. **Basic Forecast** (Exponential Smoothing, Holt, Holt-Winters) — *Completed*
2. **ARIMA & Selection** (ARMA, Auto-ARIMA, SARIMAX) — *Completed*
3. **Metrics & Validation** (Loss landscapes, CV splits, data leakage) — *Completed*
4. **Volatility: GARCH** (Conditional heteroskedasticity, VaR, ARIMA-GARCH) — *Completed*
5. **VARIMA** (Multivariate feedback, Granger causality, CUSUM stability, VECM) — *Completed*
6. **Traditional ML** (Feature engineering, Tree ensembles, XGBoost vs RF, multi-step) — *In Progress (Subtabs 6.1–6.2 implemented)*
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

### Topic 6: Traditional Machine Learning (In Progress)
Supervised machine learning applied to time-series forecasting using German electricity load data:
1. **Supervised Learning Table (Completed):** Transforming raw chronological series into tabular lag matrices and rolling window features; illustrating lookahead leakage caused by unshifted rolling statistics.
2. **Tree Ensembles & Boosting (Completed):** Comparing Random Forest against XGBoost / LightGBM split mechanics, non-linear feature interactions, and the step-function nature of decision trees.
3. **The Forecast Arena (Upcoming):** Multi-model tournament benchmarking Linear Ridge, Random Forest, XGBoost, and Seasonal Naive baselines across multiple rolling folds.
4. **Multi-Step Forecasting (Upcoming):** Direct vs Recursive vs Multi-Output multi-step forecasting horizons.
5. **Extrapolation & Drift (Upcoming):** Out-of-distribution trend failures in tree models and hybrid detrending solutions.
6. **Probabilistic ML (Upcoming):** Conformal prediction and quantile regression forests for calibrated uncertainty bands.

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
