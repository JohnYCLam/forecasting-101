import { prose, h } from './helpers.js';

export const barrierMl = () => prose`
${h('crossing-between-readings','What happened between the readings?')}
<p>The switching experiment counted events only at observation times. Now ask a different question: did the signal cross a threshold <em>at any time between</em> the readings? A price can touch a barrier and recover before the next recorded price. In a continuously monitored barrier contract, that touch changes the payoff.</p>
<p>Both endpoint readings have already arrived. The signal was zero at time 0 and is zero again at time 1. Drawing a straight line between them misses every excursion. Under a Brownian diffusion with noise strength 1, the chance it reached +1 during the gap is nevertheless \(e^{-2}\), about 13.5%.</p>
<p>We will learn drift and noise strength from a separate set of irregularly spaced increments, then infer crossings in 4,000 unseen records. The source records all have the same two endpoint readings. Revealing more readings lets us check how much the missing path still matters.</p>
</div>
<section class="lab barrier-comparison" data-lab="barrier" aria-labelledby="barrier-title">
  <div class="lab-header"><div><span class="lab-kicker">INFER AN EVENT INSIDE A GAP</span><h3 id="barrier-title">What happened while the sensor was silent?</h3><p>Both endpoints are known. Predict a hidden crossing, then reveal more of the same paths.</p></div></div>
  <div class="controls">
    <div class="control"><label for="barrier-observations">Observation intervals <output id="barrier-observations-value"></output></label><input id="barrier-observations" type="range" min="0" max="6" step="1" value="0"></div>
    <div class="control"><label for="barrier-threshold">Crossing threshold <output id="barrier-threshold-value"></output></label><input id="barrier-threshold" type="range" min="0.3" max="1.5" step="0.1" value="1"></div>
    <div class="control"><label for="barrier-sigma">Source noise strength <output id="barrier-sigma-value"></output></label><input id="barrier-sigma" type="range" min="0.4" max="1.4" step="0.1" value="1"></div>
    <div class="control"><label for="barrier-count">Training increments</label><select id="barrier-count"><option value="128">128 increments</option><option value="1024" selected>1,024 increments</option><option value="8192">8,192 increments</option></select></div>
  </div>
  <div class="controls"><button type="button" data-new="barrier">New training data + refit</button><button type="button" id="barrier-test">New unseen paths</button><button type="button" id="barrier-example">Find another missed crossing</button></div>
  <p class="method" id="barrier-fit" role="status" aria-live="polite"></p>
  <div class="stats"><div class="stat"><span class="stat-label">Exact source risk with only the two endpoints</span><strong id="barrier-exact"></strong></div><div class="stat"><span class="stat-label">Simulated continuous crossings · all 4,000 paths</span><strong id="barrier-actual"></strong></div><div class="stat"><span class="stat-label">Crossings visible at the selected observation grid</span><strong id="barrier-visible"></strong></div></div>
  <div class="plot"><div class="plot-title">Inspect one test path · observation refinement keeps this path fixed</div><canvas id="barrier-path" role="img" aria-label="A hidden Brownian bridge excursion compared with sparse readings and straight-line interpolation"></canvas><div class="legend"><span><i class="gray"></i>Hidden source path · 1,024-point drawing</span><span><i class="coral"></i>Straight lines between readings</span><span><i class="blue"></i>Revealed readings</span><span><i></i>Crossing threshold · dashed</span></div></div>
  <p class="notice" id="barrier-example-note" role="status" aria-live="polite"></p>
  <p class="method">The initial example is selected to show a crossing missed by the sparse readings, if one is available. This illustration is deliberately selected; every score below uses all 4,000 test paths. The “Find another” button changes only the illustration. It does not change the fit or evaluation.</p>
  <div class="plots">
    <div class="plot"><div class="plot-title">Do more readings remove the missed-crossing bias?</div><canvas id="barrier-refinement" role="img" aria-label="Observed and bridge-corrected crossing fractions on seven nested observation grids"></canvas><div class="legend"><span><i class="coral"></i>Observation checks / straight lines</span><span><i></i>Fitted diffusion + bridges</span><span><i class="gray"></i>Continuous source fraction</span><span><i class="gold"></i>1,024-point source checks · lower bound</span></div></div>
    <div class="plot"><div class="plot-title">Are the individual crossing probabilities calibrated?</div><canvas id="barrier-calibration" role="img" aria-label="Predicted crossing probabilities compared with simulated event frequencies"></canvas><div class="legend"><span><i class="gray"></i>Perfect calibration · diagonal</span><span><i></i>Groups of at least 20 test paths</span></div></div>
  </div>
  <p class="method" id="barrier-grid-note"></p>
  <div class="table-wrap"><table><caption>Same observations and fitted coefficients · evaluated against continuous source events</caption><thead><tr><th>Method</th><th>Average estimated crossing fraction</th><th>Mean Brier score ↓</th></tr></thead><tbody><tr><th>Observation checks / straight lines</th><td id="barrier-naive-rate"></td><td id="barrier-naive-score"></td></tr><tr><th>Fitted SDE + Brownian bridges</th><td id="barrier-sde-rate"></td><td id="barrier-sde-score"></td></tr><tr><th>Discrete Gaussian transitions + same bridges</th><td id="barrier-discrete-rate"></td><td id="barrier-discrete-score"></td></tr></tbody></table></div>
  <p class="notice">The two corrected rows agree because they use the same conditional path law. An SDE label is not the advantage. Specifying what happens between observations lets both implementations estimate the missing events.</p>
  <p class="try"><strong>Try this.</strong> With noise and threshold both at 1, begin with one observation interval: all recorded values are zero, yet some paths crossed +1. Refine toward 64 intervals. The observation-only count rises; the corrected crossing fraction should stay nearer the continuous source fraction. A finite sample and fitted noise strength prevent exact agreement. Then change the threshold, noise or training-data size.</p>
  <details><summary>The learned model, bridge formula and independent event labels</summary>
    <p>Training increments come from a constant-coefficient diffusion, observed at varied durations \(h_i\):</p>
    \[\mathrm dX_t=\mu\,\mathrm dt+\sigma\,\mathrm dW_t,\qquad
    \Delta X_i\sim\mathcal N(\mu h_i,\sigma^2h_i).\]
    <p>Gaussian maximum likelihood learns two numbers from those increments alone:</p>
    \[\widehat\mu=\frac{\sum_i\Delta X_i}{\sum_i h_i},\qquad
    \widehat\sigma^2=\frac1N\sum_i\frac{(\Delta X_i-\widehat\mu h_i)^2}{h_i}.\]
    <p>This is statistical parameter learning, not a neural network. No test crossings are used in fitting. The training source has drift 0.2; the test bridges are conditioned to return to zero after one time unit. Constant drift cancels when both endpoints are fixed, so only the fitted diffusion strength enters the conditional crossing calculation.</p>
    <p>For two endpoint readings \(x,y&lt;b\), separated by \(h\), the Brownian-bridge probability of reaching an upper threshold \(b\) is</p>
    \[q(x,y;h)=\exp\!\left[-\frac{2(b-x)(b-y)}{\sigma^2h}\right].\]
    <p>For zero drift, the reflection principle obtains this as the ratio of a Gaussian transition density to the reflected endpoint and the ordinary transition density. Expanding the squared distances in that ratio gives \(2(b-x)(b-y)/(\sigma^2h)\). The conditioned bridge law is the same for any constant drift. If either endpoint already reaches the threshold, the event is certain.</p>
    <p>Conditional on all revealed readings, the bridges on disjoint gaps are independent. Thus the chance of at least one crossing is</p>
    \[p_{\mathrm{cross}}=1-\prod_i\big(1-q(X_{t_i},X_{t_{i+1}};h_i)\big).\]
    <p>The test source is generated independently of training. Exact Gaussian bridge values are sampled at 1,024 drawing intervals; 64 nested observation intervals are retained, then thinned. Checking the drawing alone would still miss some continuous crossings. To obtain continuous source event labels, an independent uniform \(U_i\) samples the exact maximum on each drawing interval with endpoints \(a_i,c_i\):</p>
    \[M_i=\frac{a_i+c_i+\sqrt{(a_i-c_i)^2-2\sigma^2h_i\log U_i}}2.\]
    <p>The event label is 1 if any sampled maximum reaches the threshold. This construction completes the simulated path between drawing points; it uses the true source scale, not the fitted estimate. The gold line shows the lower bound from drawing points alone. The exact whole-interval reference with endpoints zero is \(\exp(-2b^2/\sigma^2)\).</p>
    <p>Both corrected rows use the same bridge probabilities and therefore have identical scores; the discrete row is not a separately trained competitor. Brier score averages \((p-o)^2\) over independent test records. The calibration plot groups predicted probabilities into eight fixed bins and omits groups smaller than 20. These groups are diagnostic checks, not extra training data.</p>
    <p>The benchmark validates the calculation under the stated synthetic diffusion law. It does not establish that real signals are Brownian, or that sparse endpoint data identify the between-observation path law. Noisy measurement, jumps, changing coefficients or a different physical model require a different inference method. Parameter uncertainty is not included in these point-estimate predictions.</p>
    <p>The bridge crossing formula is given in Section 3.4 of <a href="https://wrap.warwick.ac.uk/id/eprint/30043/1/WRAP_Casella1_07-26w.pdf" target="_blank" rel="noreferrer">Casella and Roberts</a>. <a href="https://github.com/lballabio/QuantLib/blob/master/ql/pricingengines/barrier/mcbarrierengine.hpp" target="_blank" rel="noreferrer">QuantLib’s barrier engine</a> documents its Brownian-bridge correction for missed barrier touches.</p>
  </details>
</section><div class="story">
<p>Predicting recorded values and inferring an unrecorded event are different tasks. Here the continuous-time assumption supplies information needed for the second task. A discrete model with the same conditional bridges obtains the same answer.</p>
`;
