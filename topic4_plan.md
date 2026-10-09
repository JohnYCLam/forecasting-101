# Topic 4: Volatility & GARCH — Implementation Plan

## Overview

Topic 4 shifts the focus from forecasting the *mean* (what will the price/sales be?) to forecasting the *variance* (how risky or volatile will it be?). Standard models like ARIMA assume constant variance (homoskedasticity), which spectacularly fails on financial and high-frequency data. This topic teaches three core lessons:

1. **Volatility Clustering** — Large changes tend to be followed by large changes, and small by small. Risk is not constant.
2. **The GARCH Mechanism** — How to model and forecast time-varying volatility using past shocks and past variance.
3. **The Leverage Effect** — Why negative shocks (bad news) increase volatility more than positive shocks (good news).

Following the established architecture, we will create:
- **`generate_topic4_data.py`** → Pre-computes financial return data, GARCH model fits, and conditional volatility paths into `public/topic4_data.json`
- **`src/Topic4.jsx`** → React component with 4 interactive tabs
- **Updates to `src/App.jsx`** → Wire Topic 4 into navigation and routing

---

## Tab Structure (4 Tabs)

### Tab 4.1 — "The Illusion of Randomness" (Volatility Clustering)

**Goal:** Show users that while financial returns might look like unpredictable white noise (unforecastable mean), their *magnitude* is highly structured and predictable (forecastable variance).

**Dataset:** Simulated financial daily returns featuring distinct periods of calm and crisis (volatility clustering). 

**Demo:** Compare an ARIMA model (which assumes constant risk/variance) against a simple GARCH model on generating confidence intervals.
- **Model A (ARIMA):** Predicts a flat, constant 95% confidence interval for the entire series.
- **Model B (GARCH):** Predicts dynamic 95% confidence intervals that widen during crises and narrow during calm periods.

**Interactive Controls:**
- **Model Toggle:** Show ARIMA Bounds / Show GARCH Bounds
- **Zoom/Pan controls:** To inspect specific "crisis" events in the dataset.

**Key Insight:** "If you only forecast the mean, financial returns look like pure noise. But if you look closely, risk clumps together—crises breed crises. GARCH doesn't try to predict tomorrow's return; it predicts tomorrow's risk."

**Data Generation:**
- Generate a 500-point GARCH(1,1) time series.
- Fit an ARIMA(0,0,0) to get the unconditional constant variance.
- Fit a GARCH(1,1) to extract the conditional volatility $\sigma_t$.
- Compute 95% confidence bounds ($\pm 1.96 \times \sigma$) for both models.

---

### Tab 4.2 — "The GARCH(1,1) Engine" (Mechanics & Parameters)

**Goal:** Demystify how a GARCH(1,1) model actually updates its volatility forecast day by day based on the ARCH (news) and GARCH (memory) components.

**Dataset:** A synthetic series where users can dynamically change the data-generating parameters.

**Demo:** Interactive sliders that control the Alpha ($\alpha$) and Beta ($\beta$) parameters of a GARCH(1,1) process, showing how the generated volatility series responds.

**Interactive Controls:**
- **Shock Reaction ($\alpha$ slider):** Controls how much *today's surprise* impacts tomorrow's volatility. (0.01 to 0.30)
- **Volatility Persistence ($\beta$ slider):** Controls how long a high-volatility state *lasts* before decaying back to the long-run average. (0.50 to 0.95)
- Constraint indicator: Ensure $\alpha + \beta < 1$ (stationarity condition), displaying a warning if it gets too close to 1.

**Visualization:**
- **Top Chart:** Simulated Returns (spiky data).
- **Bottom Chart:** Conditional Volatility (smooth, rolling risk). As sliders move, both charts regenerate to show "jumpy" vs "persistent" markets.

**Key Insight:** "High Alpha means the market panics quickly at new information. High Beta means the market has a long memory and takes a long time to calm down after a crisis."

**Data Generation:**
- Pre-compute a grid of GARCH(1,1) simulations for various combinations of $\alpha$ and $\beta$.
- Provide the generated returns and volatility paths for each parameter pair in the JSON.

---

### Tab 4.3 — "Asymmetric Shocks: The Leverage Effect" (EGARCH)

**Goal:** Demonstrate that in real equity markets, bad news (negative returns) causes a massive spike in volatility, while good news (positive returns) calms the market. Standard GARCH treats $+5\%$ and $-5\%$ identically.

**Dataset:** Real-world equity index data (e.g., S&P 500 during the 2008 or 2020 crash).

**Demo:** Compare standard GARCH(1,1) (symmetric) with EGARCH(1,1) (asymmetric).

**Interactive Controls:**
- **News Impact Curve Toggle:** Switch the visualization between standard time-series view and a "News Impact Curve" (a U-shaped parabola for GARCH, and an asymmetric skewed shape for EGARCH).
- **Model Selector:** Highlight standard GARCH vs EGARCH volatility tracking during a market crash.

**Visualization:**
- The time-series view shows how EGARCH's volatility forecast spikes much higher precisely when the market drops, compared to standard GARCH which underestimates risk during crashes.

**Key Insight:** "Standard GARCH assumes a +5% day and a -5% day create the exact same amount of panic. EGARCH captures the 'Leverage Effect'—the reality that fear (crashes) drives volatility much harder than greed (rallies)."

**Data Generation:**
- Fetch/Bundle ~1000 days of S&P 500 returns.
- Fit standard GARCH(1,1) and EGARCH(1,1,1).
- Extract conditional volatility for both.
- Generate data points for the theoretical News Impact Curve for both models.

---

### Tab 4.4 — "Value at Risk (VaR)" (Application)

**Goal:** Apply GARCH to a real-world risk management scenario: calculating dynamic Value at Risk (VaR) for a portfolio.

**Dataset:** Real stock data (e.g., TSLA, known for high volatility).

**Demo:** Show the portfolio's estimated 1-day maximum loss threshold. Compare a static Historical VaR against a dynamic GARCH VaR.

**Interactive Controls:**
- **Confidence Level Slider:** 90%, 95%, 99% (shows the VaR line moving further down).
- **Strategy Toggle:** Historical VaR (trailing 252 days) vs GARCH VaR.

**Visualization:**
- Daily returns plotted as a bar chart or scatter.
- A red "VaR Threshold" line drawn below zero.
- When Historical is selected, the line is blocky and slow to react.
- When GARCH is selected, the line tightly hugs the return clusters, expanding rapidly when risk increases.
- **Metric Scorecard:** Show "VaR Breaches" (how many times the actual loss exceeded the predicted VaR). GARCH should have fewer clustered breaches.

**Key Insight:** "Static risk models get you fired during a crisis because they react too slowly. Dynamic GARCH VaR anticipates the clustered nature of risk, tightening the safety belt exactly when the road gets bumpy."

**Data Generation:**
- Use a volatile stock's daily returns.
- Calculate 252-day rolling historical VaR (1st, 5th, 10th percentiles).
- Use a GARCH model to forecast 1-day ahead variance, and compute parametric VaR using the normal (or student-t) distribution.
- Count breaches for the scorecard.

---

## File Deliverables

| File | Description |
|------|-------------|
| `generate_topic4_data.py` | Python script using `arch` package to generate `public/topic4_data.json` |
| `src/Topic4.jsx` | React component with 4 tabs (reuses `ChartWithZoom` and `Layout`) |
| `src/App.jsx` | Updated to unlock nav item for Topic 4, add routing |

## Architecture Notes

- **New Python Dependency:** We will need to use the `arch` package in Python (`pip install arch`) for GARCH modeling, as `statsmodels` has limited support for ARCH/GARCH variants.
- **Performance:** Like previous topics, the React frontend remains 100% static. The GARCH grid for Tab 4.2 should be kept to a reasonable resolution (e.g., 5 alphas × 5 betas = 25 paths) to keep JSON size < 1MB.
- **Visuals:** The News Impact Curve in Tab 4.3 will require a standard Line/Scatter chart rather than a time-series chart.

## Execution Order

1. Write `generate_topic4_data.py` (ensure `arch` is installed in the python environment).
2. Run data generation to produce `public/topic4_data.json`.
3. Create `src/Topic4.jsx` building out the 4 tabs.
4. Update `src/App.jsx` and navigation components to wire in Topic 4.
5. Test locally with `npm run dev`.
