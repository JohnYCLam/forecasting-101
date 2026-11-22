import { prose } from './helpers.js';

export const switchingMl = () => prose`
  <p>In Example 1, a disturbance moved a sensor away from its average. Here a disturbance can carry a ball over a hill into another valley. We record its position every \(0.05\) time units. <strong>What is the chance that at least one reading reaches the flag at \(+0.75\) by the deadline?</strong> A ball that reaches the flag and comes back still counts.</p>
  <p>Press Play to follow one journey. The ball’s horizontal position in the landscape is the reading plotted against time beside it. Watch for the first reading at or beyond the flag.</p>
</div>
<div data-lab="switching">
<section class="lab switching-comparison" aria-labelledby="switch-title">
  <div class="lab-header"><div><h3 id="switch-title">Watch one journey</h3></div></div>
  <div class="controls">
    <div class="control"><label for="switch-model">Forecast to replay</label><select id="switch-model"><option value="sde">Learned SDE</option><option value="point">Drift only</option><option value="kernel">Empirical transitions</option></select></div>
    <div class="control"><label for="switch-example">Illustrative path</label><select id="switch-example"></select></div>
  </div>
  <div class="controls switch-playback"><button type="button" id="switch-play">Play</button><div class="control"><label for="switch-frame">Time shown <output id="switch-frame-value"></output></label><input id="switch-frame" type="range" min="0" max="120" step="1" value="0"></div></div>
  <div class="plots">
    <div class="plot"><div class="plot-title">The ball in the two valleys</div><canvas id="switch-valley" role="img" aria-label="Ball moving along the source landscape toward a flag at +0.75" aria-describedby="switch-frame-note"></canvas></div>
    <div class="plot"><div class="plot-title">The same path over time</div><canvas id="switch-walk" role="img" aria-label="Selected forecast trajectory up to the playback time, with its first recorded hit marked" aria-describedby="switch-frame-note"></canvas><div class="legend"><span><i class="gray"></i>Target +0.75 · dotted</span><span><i class="gold"></i>First recorded hit</span></div></div>
  </div>
  <p class="method" id="switch-frame-note"></p>
  <p class="method" id="switch-example-note"></p>
  <details><summary>Change the noise, training data or starting position</summary>
    <div class="controls">
    <div class="control"><label for="switch-noise">Source noise · refits models <output id="switch-noise-value"></output></label><input id="switch-noise" type="range" min="0" max="1.1" step="0.1" value="0.8"></div>
    <div class="control"><label for="switch-count">Training records</label><select id="switch-count"><option value="32">32 paths</option><option value="128" selected>128 paths</option><option value="512">512 paths</option></select></div>
    <div class="control"><label for="switch-start">Known initial state</label><select id="switch-start"><option value="-1" selected>−1 · left valley</option><option value="-0.4">−0.4 · near the hill</option><option value="0">0 · top of the hill</option></select></div>
    <div class="control"><label for="switch-horizon">Forecast duration <output id="switch-horizon-value"></output></label><input id="switch-horizon" type="range" min="2" max="10" step="2" value="6"></div>
  </div>
  <div class="controls"><button type="button" data-new="switching">New training records + refit</button></div>
  </details>
</section>
<div class="story">
  <h3>Why does the ball tend to move right after it passes the hilltop?</h3>
  <p>The landscape shows the local pull in the equation that generated the records. Here \(X_t\) is the ball’s horizontal position, and the Brownian term supplies the random disturbances.</p>
  \[\mathrm dX_t=(X_t-X_t^3)\,\mathrm dt+\sigma\,\mathrm dW_t.\]
  <p>The first term pulls the ball downhill. At \(x=-0.5\) it pulls left at \(0.375\) units per unit time. At \(x=+0.5\) it pulls right at the same rate. Brownian disturbances can carry the ball across the hilltop at zero, or send it back before the next reading.</p>
  <h3>Can three models recover the visit probability from recorded positions?</h3>
  <p class="insight" id="switch-theory" role="status"></p>
  <details>
    <summary>Optional calculation · How does the source equation give the visit probability?</summary>
    <p><strong>Start with one reading.</strong> Let \(h=0.05\) be the time between readings and \(b=0.75\) the flag position. Write \(q_k(x)\) for the chance of recording a hit in the next \(k\) readings from position \(x\). With no readings left, \(q_0(x)=0\). With one reading left, only the next position \(Y=X_h\) matters:</p>
    \[q_1(x)=\Pr(Y\ge b\mid X_0=x).\]

    <p><strong>Give the ball a second chance.</strong> Suppose the next reading is \(0.80\). The ball has reached the flag, so that outcome counts as 1 even if the ball comes back. Suppose the reading is \(0.60\). One reading remains, so the chance from there is \(q_1(0.60)\). Average over all possible next positions, giving each its weight from the source SDE. That gives \(q_2(x)\).</p>
    <p>The same step works with \(k+1\) readings left. For positive noise, write \(p_h(y\mid x)\) for the density of the next position \(y\) given the current position \(x\). Then</p>
    \[\begin{aligned}
    q_{k+1}(x)={}&\underbrace{\int_b^\infty p_h(y\mid x)\,\mathrm dy}_{\text{hit at the next reading}}\\
    &+\underbrace{\int_{-\infty}^{b}p_h(y\mid x)\,q_k(y)\,\mathrm dy}_{\text{miss at the next reading, then hit later}}.
    \end{aligned}\]

    <p><strong>Calculate the average from the SDE.</strong> For this nonlinear drift, the app evaluates the average numerically. Call the value assigned to the next reading \(g_k(y)\). It equals 1 at or above the flag and \(q_k(y)\) below it. Start with \(u(0,x)=g_k(x)\). The backward Kolmogorov equation tells us how to average that value over an interval of length \(s\):</p>
    \[\frac{\partial u}{\partial s}=(x-x^3)\frac{\partial u}{\partial x}
    +\frac{\sigma^2}{2}\frac{\partial^2u}{\partial x^2}.\]
    <p>The coefficient \(x-x^3\) comes from the downhill drift. With the default noise strength \(\sigma=0.8\), the second coefficient is \(0.8^2/2=0.32\). The app solves this equation on a position grid for one interval \(h\), giving \(q_{k+1}(x)=u(h,x)\). It repeats the step for each reading. A crossing that happens and reverses between readings contributes no hit unless a scheduled reading reaches the flag.</p>

    <div class="table-wrap"><table><caption>Worked example with the default starting position \(x=-1\) and noise strength \(\sigma=0.8\)</caption>
      <thead><tr><th>Readings \(k\)</th><th>Deadline \(kh\)</th><th>Chance of at least one recorded hit \(q_k(-1)\)</th></tr></thead>
      <tbody><tr><td>20</td><td>1</td><td>1.99%</td></tr><tr><td>40</td><td>2</td><td>10.19%</td></tr><tr><td>80</td><td>4</td><td>27.96%</td></tr><tr><td>120</td><td>6</td><td>42.59%</td></tr></tbody>
    </table></div>
    <p>By time 6 there are \(6/0.05=120\) readings. Evaluating the last step at the starting position gives \(q_{120}(-1)\approx0.42589\). The recursion defines the theoretical probability exactly. The grid calculation supplies the rounded percentage, using only the source equation and the observation schedule.</p>
  </details>
  <p>Now give all three models the same consecutive position readings and keep the source equation hidden. Each learns how the ball moves over one step. Can it use that rule repeatedly to recover the chance of a visit by the deadline?</p>
  <div class="table-wrap"><table><caption>What each model learns and what it predicts with the current settings</caption><thead><tr><th>Model</th><th>What would we expect?</th><th>Result by the selected horizon</th></tr></thead><tbody>
    <tr><th>Drift only</th><td>Fit a cubic curve to the average change per unit time. Starting at the left valley bottom, the fitted pull should keep the ball nearby. A single trajectory gives a yes-or-no forecast.</td><td id="switch-point-outcome"></td></tr>
    <tr><th>Learned SDE</th><td>Use that same curve and estimate kick strength from the residual changes. With enough noise, some paths should reach the other valley while others stay behind.</td><td id="switch-sde-outcome"></td></tr>
    <tr><th>Empirical transitions</th><td>Sample an observed change from the 64 nearest training positions at each step. If the records capture movement toward and across the hill, this model should reproduce switching too.</td><td id="switch-kernel-outcome"></td></tr>
  </tbody></table></div>
  <p id="switch-interpretation"></p>
</div>

<details data-charts class="switching-comparison"><summary>Inspect the training paths, final positions and model scores</summary>
  <p class="method" id="switch-fit"></p>
  <div class="plot"><div class="plot-title">Training records · first 12 paths; both valleys are represented in the full dataset</div><canvas id="switch-training" role="img" aria-label="Training records showing motion near two stable states"></canvas></div>
  <p class="try"><strong>Forecast from the same known state.</strong> A single drift-only trajectory and 12 futures generated by the learned SDE are shown below. The gold curve averages all 2,000 SDE futures. The gray dashed curve averages 2,000 unseen source futures.</p>
  <div class="plots">
    <div class="plot"><div class="plot-title">Same learned drift · different trajectories and averages</div><canvas id="switch-paths" role="img" aria-label="Learned SDE paths compared with the drift-only trajectory and ensemble means"></canvas><div class="legend"><span><i></i>Learned SDE paths</span><span><i class="coral"></i>Drift only</span><span><i class="gold"></i>SDE average</span><span><i class="gray"></i>Unseen source average · dashed</span></div></div>
    <div class="plot"><div class="plot-title">Final positions · one peak, two peaks, or a point?</div><canvas id="switch-density" role="img" aria-label="Endpoint distributions from unseen source paths, learned SDE and empirical transition model"></canvas><div class="legend"><span><i class="gray"></i>Unseen source histogram</span><span><i></i>Learned SDE</span><span><i class="blue"></i>Empirical transitions · dashed</span><span><i class="coral"></i>Drift-only endpoint</span></div></div>
  </div>
  <p class="notice" id="switch-mean" role="status" aria-live="polite"></p>
  <p class="method" id="switch-reference"></p>
  <div class="table-wrap"><table><caption>Predictions evaluated on the same 2,000 unseen source paths · lower scores are better</caption><thead><tr><th>Learned model</th><th>Chance of reaching right valley</th><th>Endpoint distribution score (CRPS) ↓</th><th>Event probability score (Brier) ↓</th></tr></thead><tbody><tr><th>Drift only</th><td id="switch-point-prob"></td><td id="switch-point-crps"></td><td id="switch-point-brier"></td></tr><tr><th>Empirical transitions</th><td id="switch-kernel-prob"></td><td id="switch-kernel-crps"></td><td id="switch-kernel-brier"></td></tr><tr><th>Learned SDE</th><td id="switch-sde-prob"></td><td id="switch-sde-crps"></td><td id="switch-sde-brier"></td></tr></tbody></table></div>
  <div class="controls"><button type="button" id="switch-test">New unseen test paths</button></div>
  <p class="method" id="switch-result"></p>
  </details>
<div class="story">
  <details><summary>What is learned, and where does stochastic calculus enter?</summary>
    <p id="switch-fit-check"></p>
    <p>The fit receives only pairs of observations separated by \(h=0.05\). A cubic regression learns four coefficients, and the squared residuals estimate a constant noise strength:</p>
    \[\begin{aligned}f_\theta(x)&=c_0+c_1x+c_2x^2+c_3x^3,\\
    \frac{\Delta X_i}{h}&\approx f_\theta(X_i)+\frac{s}{\sqrt h}Z_i,\\
    \widehat s^2&=\frac1{Nh}\sum_i\big(\Delta X_i-f_\theta(X_i)h\big)^2.
    \end{aligned}\]
    <p>The drift-only model solves \(\mathrm dx=f_\theta(x)\,\mathrm dt\). The SDE uses that same fitted function and \(\widehat s\), with fresh independent kicks of size \(\widehat s\sqrt{\Delta t}\). Parameters are point estimates, not Bayesian posterior samples. The method is polynomial regression, not a neural network.</p>
    <p>The drift-only curve is a controlled comparison that removes the kicks. It is not the strongest possible point forecaster: a model trained directly on long-horizon targets could learn their average. Residuals here can contain drift approximation error as well as source noise. At the unstable hilltop, tiny fitting errors can grow strongly, including when source noise is zero.</p>
    <p>For nonlinear drift, evolving the average is not the same as evolving one deterministic trajectory. For the source, averaging its integrated equation gives</p>
    \[\frac{\mathrm d}{\mathrm dt}\mathbb E[X_t]=\mathbb E[X_t]-\mathbb E[X_t^3],\]
    <p>which generally differs from \(m-m^3\) when \(m=\mathbb E[X_t]\). The distribution of states affects the average drift. For an optional view of why the whole distribution matters, Section 10 derives the Fokker–Planck equation. Applied to this model it reads:</p>
    \[\partial_tp=-\partial_x(f_\theta p)+\tfrac12\widehat s^2\partial_{xx}p.\]
    <p>Here we simulate that local stochastic law to estimate full trajectories, future distributions and the probability of reaching a target. The theoretical visit probability uses the known source coefficients in the backward equation. The learned SDE estimates that probability by simulating paths with its fitted coefficients. Adding an independent error bar around the drift-only curve would not model travel between the valleys.</p>
    <p><strong>The empirical comparator:</strong> at each observation time, find the 64 training states nearest the current position, sample one of their observed increments, add it, and repeat. This is a nonparametric stochastic autoregressive model at the original observation spacing. It receives exactly the same pairs and can represent nonlinear, non-Gaussian transitions. Its neighborhood size is fixed in advance, without test-set tuning. It can match or outperform the SDE; its presence prevents us from attributing every benefit of distribution forecasting to calculus.</p>
    <p><strong>Evaluation:</strong> “reaching the right valley” means observing \(X\ge0.75\) at least once on the shared 0.05-spaced grid. Crossings between observations are not counted by any model. Brier score averages \((p-o)^2\), where \(o\) is 1 for a test path that reaches the target and 0 otherwise. CRPS measures the entire endpoint distribution against each observed endpoint; unlike mean error, it penalizes misplaced probability mass. The drift-only model is scored as a point distribution.</p>
    <p><strong>Numerics and limits:</strong> source paths use Euler–Maruyama steps of 0.005; learned SDE and drift-only paths use 0.01. Observations are every 0.05, and each training path lasts 4 time units with a varied starting position. Fine simulation, finite-observation coefficient estimates, finite data and Monte Carlo sampling all introduce error. Fixed graph limits are −2.6 to 2.6; omitted endpoints are reported above. Noise changes regenerate training and test data; they do not secretly change a fitted model. Changing the starting state or forecast duration preserves its fit.</p>
  </details>
</div>
</div>
<div class="story">
<p>The three forecasts counted visits only at recorded times. Suppose the ball reached the flag and came back between two readings. How could we estimate the chance of a visit that every recorded point missed? That is the question in <a href="#learning/crossing-between-readings">Example 3</a>.</p>
`;
