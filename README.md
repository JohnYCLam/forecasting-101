# Time Series Forecasting Interactive Course Dashboard

This repository contains the interactive frontend dashboard for our comprehensive Time Series Forecasting course. Built with React, Vite, and Recharts, this application brings complex statistical models to life through dynamic, slider-driven visualizations and interactive case studies.

## The Syllabus

This dashboard is designed to walk students through the entire landscape of Time Series Forecasting, from traditional statistical models to modern deep learning and foundation models:

1. **Basic Forecast** (Exponential Smoothing, Holt, Holt-Winters)
2. **ARIMA & Selection** (ARMA, Auto-ARIMA, SARIMAX)
3. **Metrics & Validation**
4. **Volatility: GARCH**
5. **VARIMA**
6. **Traditional ML** (Tree-based models, regression)
7. **Facebook Prophet**
8. **Traditional DL** (RNNs, LSTMs, CNNs)
9. **Modern DL** (Transformers)
10. **RAG Demo** (Retrieval-Augmented Generation for Time Series)
11. **Foundation Models** (Zero-shot forecasting)

## Current Progress

### Architecture & UI/UX
- **Tech Stack:** React, Vite, Recharts, Lucide Icons.
- **Design System:** Implemented a premium, responsive "glassmorphism" aesthetic with a custom CSS framework.
- **Mobile First:** The application layout seamlessly scales to mobile devices, converting the side-navigation into a horizontally scrollable top-nav.
- **Data Pipeline:** Python generator scripts using `statsmodels` pre-compute all model permutations into static JSON payloads. This allows the React frontend to be 100% static, instantly responsive, and highly cost-effective to host on Vercel.

### Topic 1: Exponential Smoothing (Completed)
Fully interactive dashboard that visualizes the mechanics of:
- **Simple Exponential Smoothing (SES):** Interactive $\alpha$ slider demonstrating memory decay on standard datasets.
- **Holt's Linear Trend:** Interactive $\alpha$ and $\beta$ sliders showing the interplay between level and trend.
- **Holt-Winters:** Full seasonal model with interactive $\alpha$, $\beta$, and $\gamma$ sliders.
- **Features:** Custom mouse-centered zoom controls and drag-to-pan functionality.

### Topic 2: ARIMA & Model Selection (Completed)
A comprehensive 6-tab deep dive into the ARIMA family:
1. **ARMA(p, q) Basics:** Synthetic data generation governed by interactive `p` and `q` sliders.
2. **Synthetic Battles:** ARIMA vs Holt-Winters on transient shocks (MA), aperiodic cycles (AR2), and high-frequency mean reversion (AR1).
3. **Real World Data:** Demonstrating how ARIMA captures the 11-year Solar Cycle (Sunspots) and Treasury Bill inertia better than baseline linear trends.
4. **Auto vs Manual:** Highlighting the danger of blind Auto-ARIMA (d=1, unit root) versus constrained manual ARIMA (d=0, mean reversion / damping).
5. **SARIMA vs Holt-Winters:** Handling heteroskedasticity in Australian Monthly Gas Production via log transformations and seasonal differencing.
6. **The Magic of SARIMAX:** Modeling Weekly Retail Sales with a simulated Promotion Calendar. Includes interactive toggles to compare a baseline Holt-Winters model against a SARIMA model (no exogenous features) and a SARIMAX model (with exogenous promotional markers).

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. To regenerate the datasets, ensure Python is installed with `statsmodels` and `pandas`, then run:
   ```bash
   python generate_topic1_data.py
   python generate_topic2_data.py
   ```
