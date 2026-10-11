# Topic 4: Volatility & GARCH — Coherence Spec

## Narrative Contract

Every tab must follow the same teaching sequence:

1. **Background / limitation**
2. **What the model is**
3. **What it forecasts**
4. **Real-world use case**
5. **Guided demo (what to look for)**

Progressive disclosure is required: commentary should react to the active tab control (view, slider, or step), rather than showing all explanation at once.

## Tab 4.1 — Introduction to ARCH

**Goal:** Bridge from ARIMA to volatility modeling.

- Start with ARIMA's limitation: constant variance assumption.
- Explain ARCH in plain language: conditional variance depends on recent shocks.
- Clarify forecast target: **ARCH forecasts risk magnitude (variance), not return direction**.
- Use case: short-horizon risk monitoring, position sizing, options risk.
- Demo flow:
  - Time-series view: real white noise vs fake white noise.
  - Rolling variance view: reveal hidden variance clustering in fake noise.
  - Forecast view: show damping back to unconditional variance and explain why volatility forecasting is usually short-term.

## Tab 4.2 — The GARCH(p,q) Model

**Goal:** Show why GARCH is needed and make model order intuition concrete.

- Start with ARCH limitation: long memory requires many ARCH lags and unstable estimation.
- Introduce GARCH(p,q): combines lagged shocks and lagged conditional variance.
- Clarify use case: persistent volatility regimes with compact parameterization.
- Demo flow:
  - Interactive **p/q controls** over pre-generated model fits.
  - Overlay conditional variance on squared returns to show smoothing behavior.
  - Explain relationship to ARMA on squared returns:
    - GARCH(1,1) implies ARMA-like behavior in $r_t^2$.
    - Implication: order selection can use autocorrelation structure in squared returns.

## Tab 4.3 — Performance: Validating the Unobservable

**Goal:** Explain why volatility evaluation differs from regular forecasting.

- State core challenge: true volatility is latent (not directly observed).
- Explain practical proxy: squared returns.
- Introduce risk-aware scoring:
  - MSE against latent truth (simulation-only reference),
  - MSE against noisy proxy,
  - QLIKE as under-prediction-sensitive metric.
- Demo flow:
  - Step 1: observe noisy proxy problem.
  - Step 2: reveal latent true volatility (simulation).
  - Step 3: compare model estimates and metric behavior (including constant-vol baseline).

## Tab 4.4 — Application: Value at Risk (VaR)

**Goal:** Make VaR motivation and mechanics explicit.

- Background: banks/regulators need a downside risk threshold for capital control.
- Goal: estimate worst expected loss over horizon at confidence level.
- Problem: historical-window VaR reacts slowly during regime shifts.
- GARCH link: dynamic volatility estimate maps to dynamic VaR threshold.
- Demo flow:
  - Compare historical VaR vs GARCH VaR at the same confidence level.
  - Clearly define breaches (actual return below threshold).
  - Show breach counts and visual breach markers.
  - Label confidence correctly (e.g., 95% VaR = 5% tail).

## Tab 4.5 — ARIMA-GARCH Integration

**Goal:** Explain complementarity and prove why combined modeling improves risk framing.

- Background: one model for mean, one model for conditional variance.
- Clarify complementarity:
  - ARIMA/ARMA estimates expected path.
  - GARCH estimates time-varying uncertainty around that path.
- Use case: FX/equity/commodity series with both serial dependence and volatility clustering.
- Demo flow:
  - Step 1: mean-only model with constant uncertainty.
  - Step 2: residual diagnostics showing heteroskedasticity.
  - Step 3: combined model with adaptive bands and better empirical coverage.
- Include quantitative comparison (coverage/breaches) to show improvement over mean-only bands.

## Tab 4.6 — EGARCH, APARCH, and Limits of GARCH

**Goal:** Show asymmetric volatility modeling and the boundary of classical parametric models.

- Background: leverage effect (negative shocks often raise volatility more than positive shocks).
- Limitation of standard GARCH: symmetric response to shock sign.
- Extensions:
  - EGARCH for asymmetry in log-variance dynamics.
  - APARCH for asymmetric and power-transformed volatility response.
- Use case: equity indices and risk systems sensitive to crash dynamics.
- Demo flow:
  - Time-series volatility comparison: GARCH vs EGARCH vs APARCH.
  - News-impact curve comparison to visualize asymmetry.
- Final bridge: explain why the GARCH family struggles with high-dimensional cross-asset and unstructured signals, motivating deep learning volatility models.

## Deliverables

- `generate_topic4_data.py` updated for:
  - Tab 2 p/q model grid
  - Tab 3 constant-vol baseline metrics
  - Tab 5 coverage and breach comparison
  - Tab 6 APARCH extension outputs
- `public/topic4_data.json` regenerated from updated generator
- `src/Topic4.jsx` rewritten for progressive, control-driven teaching flow
