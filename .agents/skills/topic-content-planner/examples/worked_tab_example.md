# Worked example: one fully filled plan tab

Modeled on Topic 4, tab 4.4 (Value at Risk). Content comes from `topic4_plan.md` (tab 4.4) and the JSON keys that really exist in
`public/topic4_data.json` under `tab4` (`returns`, `hist_var`, `garch_cond_vol`, `garch_var`, `hist_breaches`, `garch_breaches`,
`hist_breach_flags`, `garch_breach_flags`). Use it as the SHAPE of a good tab block. Do not copy the topic content into other topics.

---

## Tab 4.4 — Application: Value at Risk (VaR)

**Goal:** Make VaR motivation and mechanics explicit, and show why a dynamic volatility estimate gives a better risk threshold than a fixed window.
**Key claim:** A VaR threshold built from GARCH volatility adapts when markets turn turbulent; a historical-window VaR reacts late, so it is breached in clusters.

- **Background / limitation:** banks and regulators need a downside-risk threshold for capital control. Historical-window VaR assumes the recent past is a good guide, which fails when the volatility regime shifts (it is slow to react).
- **What the model is:** VaR at confidence level c is the loss that should be exceeded only (1 - c) of the time. With GARCH, the threshold is the conditional mean minus a quantile multiple of the conditional volatility: `VaR_t = mu_t - z * sigma_t`.
- **What it forecasts:** the worst expected one-day loss at the chosen confidence level, updated every day. It does not forecast direction.
- **Real-world use case:** daily risk limits on a trading desk, capital reserve calculation, margin setting.
- **Dataset:** the Topic 4 daily return series used in earlier tabs (synthetic, seeded), split into train and test. Why it shows the effect: it contains calm and turbulent stretches (volatility clustering), which is exactly the case where a fixed window lags.
- **Controls:** confidence level buttons (90% / 95% / 99%). DEFAULT = 95%, because the 5% tail is easy to count by eye and breaches are visible in the default view.
- **Demo flow:**
  - Step 1: plot returns with the historical-window VaR line (flat-ish, slow to move).
  - Step 2: add the GARCH VaR line (moves with volatility).
  - Step 3: mark breaches (return below threshold) for each method and show the counts next to the nominal expectation (for example, 5% of test days at 95%).
- **Baseline compared:** historical-window VaR (rolling empirical quantile), tuned with a sensible window, not a deliberately poor one.
- **Expected result (stated before building):** the GARCH threshold widens in turbulent stretches and narrows in calm ones. Historical-window breaches cluster right after volatility rises. The GARCH breach count should sit close to the nominal rate; the historical one may be off and clustered. No number is claimed here; the numbers come from the data.
- **Falsifier:** if the GARCH breach count is not closer to nominal than the historical one, or both are far from nominal, the claim is too strong. Change the claim and commentary to the honest finding; do not tune the window or seed until it looks good.
- **Commentary changes per control state:** the nominal expected breach count, the observed counts, and the sentence about which method is closer are all computed from `data` for the selected confidence level. At 99% the text must warn that few breaches make counts noisy.
- **Limitations to state:** breach counts on a short test window are noisy; GARCH assumes the volatility model is well specified; VaR says nothing about how large the loss is beyond the threshold.
- **Notebook source:** none for this tab; the generator fits the models (state this in the plan instead of citing a cell).
- **JSON keys needed (real keys under `tab4`):** `returns`, `hist_var`, `garch_var`, `garch_cond_vol`, `hist_breach_flags`, `garch_breach_flags`, `hist_breaches`, `garch_breaches`. Confirm each one exists with
  `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py public/topic4_data.json --require-keys tab4.returns,tab4.hist_var,tab4.garch_var`.

### Draft commentary (first two paragraphs; placeholders instead of numbers)

> **Why a fixed window is not enough for risk limits:** historical-window VaR takes the worst recent returns at face value. When the market suddenly becomes turbulent, the window still contains mostly calm days, so the threshold lags behind and losses break through it again and again.
>
> **What VaR is:** the loss that should be exceeded only {tail_pct}% of the time. At the selected {confidence_pct}% confidence, a good threshold is breached on about {expected_breaches} of the {n_test} test days. GARCH builds the threshold from today's estimated volatility, so it moves when risk moves.

(Placeholders in braces are filled from JSON values at build time; they are not typed numbers.)

### Why this block is a good template
- The claim, expected result and falsifier are written BEFORE any code, so a weak outcome is handled honestly.
- The default control state already shows the key effect.
- Every number in the commentary has a stated source.
- It names a limitation and a fair baseline.
- It lists the real JSON keys so the data task and the UI task agree.
