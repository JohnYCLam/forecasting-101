# Real excerpts to imitate (from Topic 4 and Topic 5)

These are the target voice. Study the pattern: bold label, plain language, concrete visual reference.

## 1. Limitation-first opener (Topic 4.1)
> **Why ARIMA alone fails for risk:** ARIMA is built for conditional mean behavior and typically assumes stable residual variance. Financial returns violate that through volatility clustering: calm regimes and stress regimes arrive in clumps.

Pattern: "**Why <previous model> alone fails for <goal>:** <what it assumes>. <Real data violates it by ...>."

## 2. Clear forecast target (Topic 4.1)
> **What ARCH is forecasting:** not direction, but next-step conditional variance. This is a risk-magnitude signal that can be converted into position sizing and limit controls.

Pattern: "**What X is forecasting:** not <common confusion>, but <actual target>. <What it is used for>."

## 3. Real-world use (Topic 4.1)
> **How traders use this:** when predicted variance rises, desks often reduce gross exposure, widen stop-loss bands, raise margin buffers, and hedge more aggressively. When variance normalizes, those controls can be relaxed.

## 4. Chart definition (Topic 4.1)
> **What this chart shows:** rolling variance at time t is the average of squared returns over the latest 20 days. It is a local volatility meter, so it exposes variance structure that raw return lines hide.

Pattern: define the plotted quantity precisely, then say what it reveals.

## 5. Visual reading guide per panel (Topic 4.1)
> **Visual reading guide (top: real white noise):** look for isolated bumps that quickly revert. You should not see long elevated plateaus. That "spike then fade" behavior is what no-volatility-memory looks like.
>
> **Visual reading guide (bottom: fake white noise from ARCH):** look for persistent elevated zones, where variance rises and stays high across many consecutive points.

Pattern: one paragraph per panel: what to look for, what it should NOT look like, what that means.

## 6. Shaded zone legend (Topic 4.1)
> **Shaded zones:** red marks a persistent high-volatility regime, while blue marks a persistent low-volatility regime. This contrast between long high and low patches is evidence of volatility persistence (clustering).

## 7. Explaining an odd-looking result (Topic 4.2 forecast view)
> **Why test-period bands converge:** with stationary ARCH assumptions (stable parameters, finite long-run variance, no future shocks known), the minimum-MSE multi-step forecast reverts toward long-run variance.

Pattern: "**Why <surprising thing>:** <assumptions>, <mechanism>."

## 8. Step-by-step calculation (Topic 4.4)
> **Step 1 - ARCH output:** the model predicts conditional volatility σₜ and mean μₜ.
> **Step 2 - Build bounds:** Upperₜ = μₜ + σₜ and Lowerₜ = μₜ − σₜ.
> **Step 3 - Map charts:** top-chart amber train bounds come from one-step σₜ; red dashed test bounds come from multi-step σₜ₊ₕ|ₜ shown below.
> **Step 4 - Read width:** wider gap means higher predicted risk; narrower gap means calmer expected moves.
> **Step 5 - Compare with realized magnitude:** |rₜ − μₜ| is plotted as a proxy for the realized shock size. It is only a proxy because the latent σₜ is not observed.

Pattern: numbered steps tied to named chart elements; ends with an honest caveat.

## 9. Model intro with equation and naming (Topic 5.1, tab "What VARMA is")
> **Why univariate ARIMA is not enough:** a separate model for each series sees only its own past. It misses delayed feedback: price triggers battery dispatch, then dispatch suppresses price.
>
> **What VARMA is:** the multivariate cousin of ARMA. Instead of one series and scalar coefficients, we model a vector with matrix coefficients so each equation can use lags of every included series.
> [centered equation box]
> **Naming:** VAR(p) uses only lagged values (like multivariate AR). VARMA(p, q) also uses lagged shocks. If the series need differencing, we speak of VARIMA.

Pattern: bridge from the previous topic ("cousin of ARMA", "same idea as Topic 2"), equation, naming.

## 10. Demo narrative with data-driven numbers (Topic 5.1, tab "The microgrid loop")
> **Where independent ARIMA fails:** after the $250/MWh spike at 10:00, price ARIMA still sees only its own history and forecasts a slow retreat ... Dispatch ARIMA saw an idle battery and keeps forecasting near 0.6 MW, blind to the price breach.
>
> **How joint VAR uses the other series:** training includes the 07:00 contingency spike and the ~80 MW response at 07:05, so the model learns that high prices precede discharge and discharge precedes price collapse.
>
> **Out-of-sample MAE:** price 60% lower for VAR ($X vs $Y); dispatch ...

Pattern: say what the baseline does wrong, what the new model uses, then the metric. In code every number is interpolated from loaded JSON.

## 11. "How to read the charts" tab (Topic 5.1)
> **Fit lines vs the forecast origin:** faint lines are one-step predictions. Sudden shocks are innovations, so the fit reacts one step later. Interval 120 is the observed origin, not a prediction ...
>
> **Why the first price step looks similar, then diverges:** at 10:00 the battery is still idle, so the first VAR price step has little cross-lag dampening yet. Once VAR projects the injection, the next price step collapses.

Pattern: pre-empt the viewer's confusion about a visual detail.

## 12. Dataset card (Topic 5.1)
> Synthetic 5-minute microgrid series (00:00-10:25, 126 intervals): wholesale spot price ($/MWh) and battery dispatch (MW). Baseload price sits near $45-$55/MWh; the battery stays idle until price exceeds $75/MWh ... Training (intervals 0-119) includes a 07:00 contingency spike and is shared across shock sizes. Compared models are AIC-selected on that training window.

Pattern: what, period/size, units, behavior, train/test split, how models were chosen.

## Layout of a card in JSX (shape only)
```jsx
<div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
  <p><strong>Why X alone fails:</strong> ...</p>
  <p><strong>What X is:</strong> ...</p>
  <div style={{ background: 'var(--primary-bg)', padding: '0.55rem', borderRadius: '6px', textAlign: 'center' }}>
    <MathText tex="\mathbf{y}_t = \mathbf{c} + \sum_{i=1}^{p} A_i \mathbf{y}_{t-i} + \boldsymbol{\varepsilon}_t" />
  </div>
  <p><strong>Naming:</strong> ...</p>
</div>
```
