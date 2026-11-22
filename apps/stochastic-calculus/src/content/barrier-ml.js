import { prose } from './helpers.js';

export const barrierMl = () => prose`
<p>In Example 2 the logger recorded visits to a flag. Here a sensor alarm triggers as soon as the signal touches a threshold, and the logger can miss the touch. <strong>Can a model estimate the chance of a missed alarm using training records that contain only sensor readings?</strong></p>
</div>
<div data-lab="barrier">
<div class="story">
  <h3>What does the model learn from the training data?</h3>
  <p>Each training example gives the change in the sensor reading and the time elapsed. We assume the continuous sensor model from Example 1, \(\mathrm dX_t=\mu\,\mathrm dt+\sigma\,\mathrm dW_t\). The learner fits the drift \(\mu\) from the average change per unit time. It learns the noise strength \(\sigma\) from how far the changes scatter around that trend, accounting for each interval’s duration. Training requires no alarm labels.</p>
  <p>For a new interval with two known readings, we assume the signal between them follows a <em>Brownian bridge</em>. Fixing both ends cancels the constant drift. The fitted noise strength then determines how much the signal can wander between those readings, and hence its chance of touching the threshold.</p>
  <div class="controls">
    <div class="control"><label for="barrier-count">Training increments</label><select id="barrier-count"><option value="128">128</option><option value="1024" selected>1,024</option><option value="8192">8,192</option></select></div>
    <button type="button" data-new="barrier">New training data + refit</button>
  </div>
  <p class="insight" id="barrier-fit" role="status"></p>
  <h3>How close does the learned model get?</h3>
  <p>The new interval lasts one time unit and both endpoint readings are zero. At the default threshold of \(+1\) and source noise strength of \(1\), theory gives a <strong>13.53%</strong> chance of a touch. A straight line joining the zeros predicts a quiet interval. The learned model uses its own estimate of the noise strength in the bridge formula. Compare its prediction against theory for two sets of readings.</p>
  <div class="table-wrap"><table><caption>Chance of an alarm in the same interval, using the current fit and sensor settings</caption>
    <thead><tr><th>Available readings</th><th>Theory</th><th>Straight line</th><th>Learned bridge</th></tr></thead>
    <tbody><tr><th>Only the two zeros</th><td id="barrier-exact"></td><td id="barrier-visible"></td><td id="barrier-estimated"></td></tr>
    <tr><th>Also +0.60 halfway through</th><td id="barrier-mid-exact"></td><td id="barrier-mid-visible"></td><td id="barrier-mid-estimated"></td></tr></tbody>
  </table></div>
  <p id="barrier-fit-result"></p>
  <p>Try <strong>New training data + refit</strong> and read across the first row again. A fresh sample can change the fitted noise strength and its prediction while the theoretical target stays fixed. Reading down the learned column shows a different operation. The midpoint adds evidence about this interval while the fit stays fixed.</p>
  <details><summary>Change the source noise or alarm threshold</summary>
    <div class="controls">
      <div class="control"><label for="barrier-threshold">Alarm threshold <output id="barrier-threshold-value"></output></label><input id="barrier-threshold" type="range" min="0.3" max="1.5" step="0.1" value="1"></div>
      <div class="control"><label for="barrier-sigma">Source noise strength <output id="barrier-sigma-value"></output></label><input id="barrier-sigma" type="range" min="0.4" max="1.4" step="0.1" value="1"></div>
    </div>
  </details>
</div>
<details id="barrier-diagnostics" data-charts class="barrier-comparison"><summary>Optional · How well do the probabilities predict alarms across many paths?</summary>
  <p>This check uses both endpoints and the actual midpoint of each of 4,000 independent test paths. The fit is fixed during evaluation. The test simulator supplies an alarm label for each path so we can check the predictions. Each method assigns that path a chance of touching the threshold. Its Brier score is the average squared difference between that probability and the simulated outcome (1 for a touch, 0 otherwise). Lower scores are better.</p>
  <div class="table-wrap"><table><thead><tr><th>Method</th><th>Mean Brier score</th></tr></thead><tbody><tr><th>Straight-line baseline</th><td id="barrier-naive-score"></td></tr><tr><th>Learned bridge model</th><td id="barrier-sde-score"></td></tr></tbody></table></div>
  <div class="plot"><div class="plot-title">How often does an alarm trigger at each predicted probability?</div><canvas id="barrier-calibration" role="img" aria-label="Average learned probability versus observed alarm frequency for groups of test paths"></canvas></div>
  <p class="method">Each dot groups paths with similar learned probabilities. A group on the diagonal has the predicted fraction of alarms. Groups contain at least 20 paths.</p>
  <button type="button" id="barrier-test">New unseen test paths</button>
</details>
<div class="story">
  <details>
    <summary>Optional calculation · Why is the chance of a missed alarm 13.53%?</summary>
  <p>Start with the continuous sensor model from Example 1. This isolates what Brownian fluctuations can do between readings. The drift \(\mu\) gives its average change per unit time, and the noise strength \(\sigma\) sets the size of the fluctuations:</p>
  \[\mathrm dX_t=\mu\,\mathrm dt+\sigma\,\mathrm dW_t.\]
  <p>Fix the start and end readings. The paths joining them still wander in the middle. Their conditional motion is called a <em>Brownian bridge</em>. For two zero readings one time unit apart, the probability of touching a positive threshold \(b\) is \(\exp(-2b^2/\sigma^2)\). With the default \(b=1\) and \(\sigma=1\), this gives \(e^{-2}\approx13.53\%\).</p>
    <p>With the default settings, the sensor starts at 0, ends at 0 one time unit later, and has noise strength \(\sigma=1\). Among paths with those two readings, what fraction touch \(+1\)? Fixing the endpoints removes the constant drift. Those paths have the same bridge law as driftless Brownian motion.</p>
    <p><strong>Reflect a path at its first touch.</strong> Picture a path that reaches \(+1\) and then returns to 0. Keep everything up to its first touch. Mirror the rest across the line at \(+1\). The final reading 0 becomes \(2\times1-0=2\). Conversely, every continuous path from 0 to 2 passes through \(+1\). Mirroring it after its first touch recovers a path that touches \(+1\) and ends at 0. Brownian increments are symmetric after that touch, so the paired paths carry equal weight.</p>
    <p><strong>Turn the pairing into a probability.</strong> Imagine counting paths whose final reading falls in a narrow band around 0. Among these, the paths that touch \(+1\) pair with all paths ending in an equally wide band around 2. As the bands shrink, the fraction becomes the endpoint density at 2 divided by the endpoint density at 0.</p>
    <p>After one time unit with unit noise, the driftless endpoint has standard normal density \(\phi(z)=e^{-z^2/2}/\sqrt{2\pi}\). The density ratio simplifies to</p>
    \[\frac{\phi(2)}{\phi(0)}
      =\frac{e^{-2^2/2}}{e^{-0^2/2}}
      =e^{-2}\approx 0.135335.\]
    <p>So <strong>13.53%</strong> is the chance the alarm triggered during the gap, given only the two zeros. This is the reference for the two endpoints alone.</p>
  </details>
</div>
<details data-charts><summary>Can an extra reading make a missed alarm more likely?</summary>
<div class="story">
  <p>Suppose the logger recovers a third reading. Halfway through the time unit, the signal was \(+0.60\). The alarm threshold is still \(+1\), and both end readings are still zero. Now we know the signal came within \(0.40\) of the alarm. A touch followed by a return to zero is easier to explain. How much does that change the probability?</p>
  <p><strong>One gap becomes two.</strong> With the default noise strength \(\sigma=1\), consider the first half, from 0 to \(0.60\). Its ends lie \(1.00\) and \(0.40\) below the threshold. For a bridge whose endpoints are distances \(d_1,d_2\) below the threshold, the chance of a touch during a gap of length \(h\) is \(\exp[-2d_1d_2/(\sigma^2h)]\). With \(h=0.50\) this gives</p>
  \[q_{\rm first}=\exp\!\left(-\frac{2(1.00)(0.40)}{1^2(0.50)}\right)
      =e^{-1.6}\approx20.19\%.\]
  <p>The return from \(0.60\) to 0 has the same distances in reverse and the same duration, so it has the same touch probability. Given the midpoint, the two bridges are independent. The alarm stays silent only if <em>both</em> halves miss. That gives</p>
  \[P(\text{touch in either half})=1-(1-e^{-1.6})^2\approx36.30\%.\]
  <p>The extra reading raises the theoretical chance from <strong>13.53% to 36.30%</strong>. With the default training data, substituting the fitted noise strength gives <strong>12.34% to 33.98%</strong>. These are updated estimates for the same alarm over the same time unit.</p>
  <h3>How much does the reading’s value matter?</h3>
  <p>Try other midpoint readings. At the default settings, a midpoint of <strong>0</strong> lowers the theoretical chance to <strong>3.63%</strong> because the signal would have to travel up to \(+1\) and back within a single half. A midpoint of <strong>+0.90</strong> raises it to <strong>89.13%</strong>. At \(+1\) the reading itself confirms the alarm. Each point on the curve answers “what if the logger had recorded this value?”</p>
</div>
<section class="lab barrier-comparison" aria-labelledby="barrier-title">
  <div class="lab-header"><div><h3 id="barrier-title">Alarm probability versus the extra reading</h3></div></div>
  <div class="plot"><canvas id="barrier-response" role="img" aria-label="Probability of a touch versus the extra sensor reading, for theory and the fitted bridge" aria-describedby="barrier-evidence"></canvas>
    <div class="legend"><span><i></i>Theory</span><span><i class="blue"></i>Learned bridge · dashed</span><span><i class="gray"></i>Theory with endpoints alone · dotted</span></div>
  </div>
  <div class="controls">
    <div class="control"><label for="barrier-reading">Extra reading <output id="barrier-reading-value"></output></label><input id="barrier-reading" type="range" min="-1" max="1.5" step="0.01" value="0.60"></div>
    <div class="control"><label for="barrier-time">Time of extra reading <output id="barrier-time-value"></output></label><input id="barrier-time" type="range" min="0.05" max="0.95" step="0.05" value="0.50"></div>
  </div>
  <p class="method" id="barrier-evidence" role="status"></p>
</section>
<div class="story">
  <h3>What if the extra reading comes earlier or later?</h3>
  <p>Keep the extra reading at \(+0.60\) and move its time from \(0.50\) to \(0.25\). The first gap now lasts \(0.25\), leaving less time for a hidden excursion. The second lasts \(0.75\), leaving more. At the default settings the two touch probabilities become <strong>4.08%</strong> and <strong>34.42%</strong>. Combining them gives <strong>37.09%</strong> for the full time unit.</p>
  <p>For a reading \(m\) at any interior time \(t\), call the two gap probabilities \(q_1=q(0,m;t)\) and \(q_2=q(m,0;1-t)\). The whole-interval chance is still \(1-(1-q_1)(1-q_2)\). Try \(t=0.75\) with the same reading. Because both endpoints are zero, it swaps the two gap probabilities and gives exactly the same total as \(t=0.25\).</p>
  <p id="barrier-gaps" class="method" role="status"></p>
</div>
</details>
<div class="story">
  <details><summary>Optional calculation · From training increments to a missed-alarm probability</summary>
    <p>An increment of duration \(h_i\) follows \(\Delta X_i\sim\mathcal N(\mu h_i,\sigma^2 h_i)\). For \(N\) increments the Gaussian maximum-likelihood estimates are</p>
    \[\widehat\mu=\frac{\sum_i\Delta X_i}{\sum_i h_i},\qquad
      \widehat\sigma^2=\frac1N\sum_i\frac{(\Delta X_i-\widehat\mu h_i)^2}{h_i}.\]
    <p>For readings \(x,y\) below threshold \(b\), separated by time \(h\), reflection of Brownian paths at the threshold gives the single-gap touch probability</p>
    \[q(x,y;h)=\exp\!\left[-\frac{2(b-x)(b-y)}{\sigma^2h}\right].\]
    <p>With a midpoint reading \(m\), both gaps last \(1/2\). Conditional on all three readings, the two bridges are independent. Multiply the chances of missing in both gaps, then subtract from one:</p>
    \[p_{\rm touch}=1-\big(1-q(0,m;1/2)\big)\big(1-q(m,0;1/2)\big).\]
    <p>With more readings, multiply one miss probability per gap. Any reading at or above the threshold establishes a touch. Use the known \(\sigma\) for theory and \(\widehat\sigma\) for the learned estimate. A discrete Gaussian model with the same assumptions inside each gap gives the same result.</p>
    <p>For the optional scoring check, the simulator samples continuous maxima within 1,024 fine intervals to include touches between observations. Test paths are generated independently of training. The calculation assumes Brownian fluctuations, constant coefficients and accurate sensor readings.</p>
    <p>The single-gap formula appears in §3.4 of <a href="https://wrap.warwick.ac.uk/id/eprint/30043/1/WRAP_Casella1_07-26w.pdf" target="_blank" rel="noreferrer">Casella and Roberts</a>. A practical application to barrier options appears in <a href="https://github.com/lballabio/QuantLib/blob/master/ql/pricingengines/barrier/mcbarrierengine.hpp" target="_blank" rel="noreferrer">QuantLib’s barrier engine</a>.</p>
  </details>
</div>
</div>
<div class="story">
<p>Two endpoints can be consistent with both a quiet interval and a missed alarm. The training data tell us how much the signal typically fluctuates. The bridge assumption turns that learned noise strength and the available readings into a probability for the unseen interval. <a href="#learning/valve-alarm">Example 4</a> adds Section 8’s valve back into the equation and asks how a missing jump changes the alarm estimate.</p>
`;
