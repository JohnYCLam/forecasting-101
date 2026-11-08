import { prose, h } from './helpers.js';

export const predictiveMl = () => prose`
${h('learn-random-motion', 'Can a model learn the randomness too?')}
<p>Suppose a sensor follows a quantity that wanders but tends to return toward a comfortable level. We can simulate repeated records, then hide the generating rule and ask two models to learn from exactly the same observations. One predicts the average next position. The other also predicts how widely actual next positions vary around that average.</p>
<p>We use linear regression, a small machine-learning model whose fit can be checked directly. Both models learn the same intercept and slope from pairs of consecutive observations. The stochastic model additionally learns the variance of the residuals, the differences between observations and fitted means. Neither fit receives the generating coefficients or the test paths.</p>
\[\begin{aligned}
\text{Point model:}\quad&\widehat X_{i+1}=a\widehat X_i+b,\\
\text{Stochastic model:}\quad&\widetilde X_{i+1}=a\widetilde X_i+b+sZ_i,
\qquad Z_i\sim\mathcal N(0,1).
\end{aligned}\]
<p>At forecast time, both start from the same known position. The point model traces one mean path. The stochastic model generates possible futures and a central 90% prediction interval at each observation time. Before looking, predict what will happen to the mean error and the spread when we increase the noise.</p>
</div>
<section class="lab ml-comparison" data-lab="prediction" aria-labelledby="prediction-title">
  <div class="lab-header"><div><span class="lab-kicker">LEARN FROM SYNTHETIC DATA</span><h3 id="prediction-title">One prediction or a range of futures?</h3><p>Same training records. Same fitted mean. An extra learned quantity: the size of the random changes.</p></div></div>
  <div class="controls">
    <div class="control"><label for="pred-noise">Noise in the source <output id="pred-noise-value"></output></label><input id="pred-noise" type="range" min="0" max="1.2" step="0.1" value="0.7"></div>
    <div class="control"><label for="pred-count">Training trajectories</label><select id="pred-count"><option value="8">8 paths · 160 transitions</option><option value="32" selected>32 paths · 640 transitions</option><option value="128">128 paths · 2,560 transitions</option><option value="512">512 paths · 10,240 transitions</option></select></div>
    <div class="control"><label for="pred-start">Known starting position <output id="pred-start-value"></output></label><input id="pred-start" type="range" min="-2" max="2" step="0.2" value="2"></div>
    <div class="control"><label for="pred-horizon">Forecast duration <output id="pred-horizon-value"></output></label><input id="pred-horizon" type="range" min="0.5" max="4" step="0.5" value="3"></div>
  </div>
  <div class="controls"><button type="button" data-new="prediction">New training data + refit</button><button type="button" id="pred-test">New unseen futures</button></div>
  <p class="method" id="pred-fit" role="status" aria-live="polite"></p>
  <div class="plot"><div class="plot-title">Training records · first 12 paths, with different initial positions</div><canvas id="pred-training" role="img" aria-label="Synthetic training paths used by both regression models"></canvas></div>
  <p class="try"><strong>Now forecast from one known position.</strong> The gray paths below are 12 unseen futures from the source. They are identical in both panels; neither model was fitted to them.</p>
  <div class="plots">
    <div class="plot"><div class="plot-title">Point prediction · deterministic model</div><canvas id="pred-point" role="img" aria-label="Point forecast compared with unseen trajectories"></canvas><div class="legend"><span><i class="gray"></i>Unseen actual paths</span><span><i class="coral"></i>Learned mean</span></div></div>
    <div class="plot"><div class="plot-title">Distribution prediction · stochastic model</div><canvas id="pred-stochastic" role="img" aria-label="Learned mean and 90 percent prediction interval compared with the same unseen trajectories"></canvas><div class="legend"><span><i class="gray"></i>Same unseen paths</span><span><i class="coral"></i>Same learned mean</span><span><i></i>Central 90% interval</span></div></div>
  </div>
  <div class="plot"><div class="plot-title">At the final time · test all 2,000 unseen outcomes</div><canvas id="pred-density" role="img" aria-label="Unseen endpoint histogram compared with learned Gaussian density and deterministic endpoint"></canvas><div class="legend"><span><i class="gray"></i>Actual endpoint histogram</span><span><i></i>Learned endpoint density</span><span><i class="coral"></i>Point prediction</span><span><i class="blue"></i>90% interval endpoints</span></div></div>
  <div class="table-wrap"><table><caption>Held-out endpoint evaluation · 2,000 independent futures</caption><thead><tr><th>What we check</th><th>Point model</th><th>Stochastic model</th></tr></thead><tbody><tr><th>Mean prediction RMSE ↓</th><td id="pred-rmse-point"></td><td id="pred-rmse-stochastic"></td></tr><tr><th>Predicted endpoint standard deviation</th><td>Not modeled</td><td id="pred-sd"></td></tr><tr><th>Outcomes inside a 90% interval</th><td>No interval provided</td><td id="pred-coverage"></td></tr></tbody></table></div>
  <p class="notice" id="pred-result" role="status" aria-live="polite"></p>
  <p class="try"><strong>Try this.</strong> Set noise to zero: the forecasts collapse to the same curve. Restore noise, then compare 8 and 512 training paths. More data can improve the estimated spread, but cannot eliminate fresh random disturbances. Change the forecast duration to watch uncertainty accumulate. A particular sample need not improve monotonically.</p>
  <p class="method">Models fit automatically on load and when training settings change; the fit is solved directly, with no simulated training animation. Changing the start, horizon or unseen futures leaves the fitted coefficients fixed. Axes match across the forecast panels. The shaded band contains 90% probability at each time under the fitted model; it is not a 90% guarantee for an entire path or a confidence interval for the fitted mean. Test paths never enter the fit.</p>
  <details><summary>Show the source, fitting rule and connection to stochastic calculus</summary>
    <p>The source is the Itô SDE below. Its coefficients are used only to generate data and report an analytic reference, never as fitting labels:</p>
    \[\mathrm dX_t=0.8(0.4-X_t)\,\mathrm dt+\sigma\,\mathrm dW_t.\]
    <p>We sample its exact Gaussian transition at intervals \(h=0.1\), avoiding Euler simulation error. Each training path has 20 transitions. The fit minimizes squared error to estimate \(a,b\), then estimates \(s^2\) by the average squared residual. These are also the Gaussian conditional maximum-likelihood estimates. Both mean models have exactly the same capacity.</p>
    \[\widehat s^2=\frac1N\sum_{j=1}^N(y_j-\widehat a x_j-\widehat b)^2.\]
    <p>Forecasts propagate the learned distribution, rather than merely adding independent error bars to each mean:</p>
    \[m_{k+1}=\widehat a m_k+\widehat b,\qquad v_{k+1}=\widehat a^2v_k+\widehat s^2,\qquad m_0=x_0,\ v_0=0.\]
    <p>For a mean-reverting SDE with rate \(\kappa\), level \(\mu\) and noise \(\sigma\), the exact transition has \(a=e^{-\kappa h}\), \(b=\mu(1-a)\), and \(s^2=\sigma^2(1-a^2)/(2\kappa)\). At small \(h\), this gives \(s\approx\sigma\sqrt h\): the same scaling derived from coin steps earlier.</p>
    <p id="pred-truth"></p>
    <p>This experiment assumes linear drift, constant diffusion, a known initial state and no measurement error. It measures future process noise while treating fitted parameters as fixed. A small dataset can give poorly calibrated intervals. Gaussian assumptions match this synthetic source; real data can violate them. Neural SDEs generalize the coefficient functions, but do not automatically improve accuracy or calibration. A deterministic network can also output distributions or quantiles without an SDE; this comparison isolates point forecasting versus a learned stochastic transition model.</p>
  </details>
</section><div class="story">
<p>The point forecast was useful: it learned the average direction. The stochastic model answers an additional question: how much can the next record differ, and how does that uncertainty carry forward? We can replace the simple coefficients with networks when the local law needs more flexibility. The next examples introduce that idea and another use of random steps during training.</p>
`;
