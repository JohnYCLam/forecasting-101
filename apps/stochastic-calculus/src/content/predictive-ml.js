import { prose, h } from './helpers.js';

const trainingOptions = `<option value="8">8 paths · 160 transitions</option><option value="32" selected>32 paths · 640 transitions</option><option value="128">128 paths · 2,560 transitions</option><option value="512">512 paths · 10,240 transitions</option>`;

export const predictiveMl = () => prose`
<p>A sensor reads <strong>2</strong> now. Our default fitted forecast for the next reading is <strong>1.885</strong>. Suppose the sensor comes back with <strong>2.10</strong>. Is that a surprising reading? The fitted average gives us a starting point. To judge the reading, we need a range for one sensor’s future.</p>
<h3>Where does the point forecast come from?</h3>
<p>We record each sensor every \(h=0.1\) time units. A record \(1.8,\,1.6,\,1.7,\ldots\) supplies the pairs \((1.8,1.6)\), then \((1.6,1.7)\). Each input \(x_j\) is a current reading and its target \(y_j\) is the next one. We pool 20 pairs per training path and save separate paths for testing.</p>
<p>Fit a line to the training pairs by choosing the slope and intercept that minimize squared errors. The hats denote the resulting estimates. Reading the fitted line at \(x=2\) gives our point forecast \(2\hat a+\hat b\).</p>
\[(\hat a,\hat b)=\underset{a,b}{\arg\min}\sum_{j=1}^N[y_j-(ax_j+b)]^2.\]
<h3>From the point forecast to an SDE interval: how far can the sensor move?</h3>
<p>Suppose we explain the scatter by modelling the sensor’s motion. Our synthetic records come from the Ornstein–Uhlenbeck SDE in <a href="#sde/mean-reversion">Section 6</a>. The drift pulls the sensor toward 0.4 and the Brownian term gives it fresh disturbances along the way:</p>
\[\mathrm dX_t=0.8(0.4-X_t)\,\mathrm dt+\sigma\,\mathrm dW_t.\]
<p>Over one recording interval, its exact rule consists of a straight-line mean and a Gaussian kick. To estimate the kick size, look at how far the actual training readings landed from the fitted line. A prediction of 1.50 followed by a reading of 1.70 gives a residual of \(+0.20\). The mean squared residual estimates the variance of a kick:</p>
\[e_j=y_j-(\hat a x_j+\hat b),\qquad \hat s^2=\frac1N\sum_{j=1}^N e_j^2.\]
<p>Now hold the fitted numbers fixed and start many paths at the same \(x\). Each path takes a step \(X_{\mathrm{next}}=\hat a x+\hat b+\hat s Z\), with its own \(Z\sim\mathcal N(0,1)\). The middle 90% of possible next readings form the <strong>SDE prediction interval</strong>. To go further, repeat from wherever each path landed. The average follows the point forecast because the drift is linear and each fresh kick has mean zero.</p>
<details><summary>How the fitted transition relates to the continuous SDE</summary>
<p>For OU drift \(\kappa(\mu-X_t)\) and diffusion strength \(\sigma\), the exact transition over \(h\) has \(a=e^{-\kappa h}\), \(b=\mu(1-a)\), and \(s^2=\sigma^2(1-a^2)/(2\kappa)\). The demo fits the transition coefficients from observations at this one spacing. The noise slider sets the source’s continuous-time \(\sigma\); the fit estimates the standard deviation \(s\) of a recorded step.</p>
<p>With a known start, the forecast mean and variance begin at \(m_0=x_0,\ v_0=0\). The fitted transition gives \(m_{k+1}=\hat a m_k+\hat b\) and \(v_{k+1}=\hat a^2v_k+\hat s^2\). The variance carried from earlier kicks is scaled by \(\hat a^2\), and the independent new kick adds \(\hat s^2\). The chart uses these exact Gaussian moments.</p>
</details>
<p><strong>Change the source noise.</strong> Move it to zero, then back to 0.7. The gray paths are the same in both panels. Watch how far they spread around the forecast line and how the SDE band responds.</p>
</div>
<section class="lab ml-comparison" data-lab="prediction" aria-labelledby="prediction-title">
  <div class="lab-header"><div><h3 id="prediction-title">Point forecast and stochastic forecast</h3></div></div>
  <div class="controls">
    <div class="control"><label for="pred-noise">Noise in the source <output id="pred-noise-value"></output></label><input id="pred-noise" type="range" min="0" max="1.2" step="0.1" value="0.7"></div>
    <div class="control"><label for="pred-count">Training trajectories</label><select id="pred-count">${trainingOptions}</select></div>
    <div class="control"><label for="pred-start">Known starting position <output id="pred-start-value"></output></label><input id="pred-start" type="range" min="-2" max="2" step="0.2" value="2"></div>
    <div class="control"><label for="pred-horizon">Forecast duration <output id="pred-horizon-value"></output></label><input id="pred-horizon" type="range" min="0.5" max="4" step="0.5" value="3"></div>
  </div>
  <div class="controls"><button type="button" data-new="prediction">New training data + refit</button><button type="button" id="pred-test">New unseen futures</button></div>
  <p class="method" id="pred-fit" role="status" aria-live="polite"></p>
  <div class="plots">
    <div class="plot"><div class="plot-title">Point prediction · deterministic model</div><canvas id="pred-point" role="img" aria-label="Point forecast compared with unseen trajectories"></canvas><div class="legend"><span><i class="gray"></i>12 unseen sensor paths</span><span><i class="coral"></i>Learned mean</span></div></div>
    <div class="plot"><div class="plot-title">Stochastic forecast · fitted SDE transition</div><canvas id="pred-stochastic" role="img" aria-label="Learned mean and 90 percent prediction interval compared with the same unseen trajectories"></canvas><div class="legend"><span><i class="gray"></i>Same unseen paths</span><span><i class="coral"></i>Same learned mean</span><span><i></i>Central 90% interval</span></div></div>
  </div>
  <p class="notice" id="pred-result" role="status"></p>
  <details data-charts><summary>Inspect the training records and endpoint evaluation</summary>
  <div class="plot"><div class="plot-title">First 12 training paths (or all paths when fewer)</div><canvas id="pred-training" role="img" aria-label="Training trajectories from varied initial positions"></canvas></div>
  <div class="plot"><div class="plot-title">At the final time · test all 2,000 unseen outcomes</div><canvas id="pred-density" role="img" aria-label="Unseen endpoint histogram compared with learned Gaussian density and deterministic endpoint"></canvas><div class="legend"><span><i class="gray"></i>Actual endpoint histogram</span><span><i></i>Learned endpoint density</span><span><i class="coral"></i>Point prediction</span><span><i class="blue"></i>90% interval endpoints</span></div></div>
  <div class="table-wrap"><table><caption>Held-out endpoint evaluation · 2,000 independent futures</caption><thead><tr><th>What we check</th><th>Point model</th><th>Stochastic model</th></tr></thead><tbody><tr><th>Mean prediction RMSE ↓</th><td id="pred-rmse-point"></td><td id="pred-rmse-stochastic"></td></tr><tr><th>Predicted endpoint standard deviation</th><td>Not modeled</td><td id="pred-sd"></td></tr><tr><th>Outcomes inside a 90% interval</th><td>No interval provided</td><td id="pred-coverage"></td></tr></tbody></table></div>
  <p class="method" id="pred-truth"></p>
  </details>
</section><div class="story">
${h('bayesian-regression','Would Bayesian regression give the same forecast?')}
<p>The SDE gave us a range by modelling how the sensor moves. Could we also build a range directly from the regression line and the scatter in its training records?</p>
<h3>From the point forecast to a Bayesian interval: what could the next reading be?</h3>
<p>Write the regression as \(Y_{\mathrm{next}}=ax+b+\varepsilon\), where the residual \(\varepsilon\sim\mathcal N(0,v)\) and \(v\) is the residual variance. Several lines and variances could plausibly explain a finite training set \(D\). Bayes’ rule weights each candidate by its prior weight and by how well it explains the observed next readings:</p>
\[p(a,b,v\mid D)\ \propto\ p(a,b,v)\prod_{j=1}^N\mathcal N(y_j\mid ax_j+b,v).\]
<p>To predict one sensor reading, draw a plausible \((a,b,v)\) from that posterior, read its line at \(x=2\), and add one fresh residual drawn with variance \(v\). Repeat. The middle 90% of these possible readings form the <strong>Bayesian prediction interval</strong>. To answer a different question, “where is the <em>average</em> next reading?”, keep just the line heights \(2a+b\). Their middle 90% gives a <strong>credible interval for the mean</strong>.</p>
<h3>Could the next reading be 2.10?</h3>
<p>Read the first two rows together. The SDE interval asks where one sensor could land <em>given the fitted motion rule</em>. The Bayesian prediction interval asks where it could land <em>given the training data and prior</em>, allowing for uncertainty in the line and residual variance too. The last row asks where the <em>average</em> next reading lies.</p>
<p id="pred-center"></p>
<div class="table-wrap"><table><caption>Central 90% intervals · one recording interval ahead</caption><thead><tr><th>Method</th><th>Quantity</th><th>Interval</th></tr></thead><tbody>
    <tr><th>SDE transition · fitted coefficients held fixed</th><td>One new reading</td><td id="pred-fixed-future"></td></tr>
    <tr><th>Gaussian regression · Bayesian fit</th><td>One new reading</td><td id="pred-bayes-future"></td></tr>
    <tr><th>Gaussian regression · Bayesian fit</th><td>Average next reading</td><td id="pred-bayes-mean"></td></tr>
  </tbody></table></div>
<p id="pred-reading-answer" role="status"></p>
<p>That answers the question for one step. If an early disturbance changes the starting point for the next step, how do the two bands evolve further ahead?</p>
</div>
<section class="lab ml-comparison" aria-labelledby="pred-bayes-title">
  <div class="lab-header"><div><h3 id="pred-bayes-title">How do the prediction bands change further ahead?</h3></div></div>
  <div class="controls">
    <div class="control"><label for="pred-band-horizon">Forecast duration <output id="pred-band-horizon-value"></output></label><input id="pred-band-horizon" type="range" min="0.5" max="4" step="0.5" value="3"></div>
    <div class="control"><label for="pred-band-view">Show prediction regions</label><select id="pred-band-view"><option value="both">Both forecasts</option><option value="sde">SDE only</option><option value="bayes">Bayesian regression only</option></select></div>
  </div>
  <div class="plot"><div class="plot-title" id="pred-bounds-title">Future sensor readings · forecast means and central 90% prediction regions</div><canvas id="pred-bounds" role="img" aria-labelledby="pred-bounds-title" aria-describedby="pred-width-note"></canvas><div class="legend"><span><i></i>SDE · solid teal</span><span><i class="blue dashed"></i>Bayesian regression · dashed blue</span></div></div>
  <p class="method" id="pred-width-note" role="status"></p>
  <div class="plot" id="pred-gap-panel">
    <div class="plot-title" id="pred-gap-title">Does more training data bring the band edges closer?</div>
    <p class="method">Keep the forecast duration fixed and the difference scale shared. Change from 8 training paths to 512. Each curve shows a Bayesian bound minus the corresponding SDE bound, in sensor units. Zero means the edges coincide.</p>
    <div class="control"><label for="pred-bayes-count">Training paths</label><select id="pred-bayes-count">${trainingOptions}</select></div>
    <div class="control"><label for="pred-gap-scale">Difference y-scale</label><select id="pred-gap-scale"><option value="shared">Shared across training sizes</option><option value="fit">Fit current differences</option></select></div>
    <canvas id="pred-band-gap" role="img" aria-labelledby="pred-gap-title" aria-describedby="pred-gap-note"></canvas>
    <div class="legend"><span><i class="blue"></i>Upper bound difference · solid</span><span><i class="coral"></i>Lower bound difference · dashed</span></div>
    <p class="method" id="pred-gap-note" role="status"></p>
  </div>
</section><div class="story">
${h('forecast-agreement','Why does the gap shrink while both forecast bands keep their width?')}
<p>At time 3, using the original records, the gap between the upper bounds falls from about <strong>0.276</strong> sensor units with 8 training paths to <strong>0.0025</strong> with 512. Both forecasts still allow a fresh disturbance at each step. What shrinks is the uncertainty about the parameters.</p>
<p>Does this mean Bayesian regression is approximating the SDE? The regression learns directly from the recorded pairs. At their spacing of 0.1, the OU equation gives exactly the Gaussian rule that the regression independently assumes: \(Y_{\mathrm{next}}\mid x,a,b,v\sim\mathcal N(ax+b,v)\). With identical known parameters, their forecasts already agree. With more independent training paths, both fits concentrate on the same transition, so their prediction bounds approach each other at each fixed recording time. A different noise law could lead to different bounds.</p>
<p>The <em>one-step means</em> agree even with a small sample because of the prior chosen here. The <em>prediction intervals</em> get closer as the data pin down the parameters.</p>
<details><summary>Compare the one-step numbers and see how the Bayesian intervals are calculated</summary>
<p>The reference prior \(p(a,b,v)\propto1/v\) centers the Bayesian one-step mean on the least-squares forecast \(\hat a x+\hat b\). A different prior can shift that center.</p>
<div class="table-wrap"><table><caption>Original training records · starting reading 2 · source noise 0.7 · one step ahead</caption>
<thead><tr><th>Training paths</th><th>Shared mean forecast</th><th>SDE · 90% for one reading</th><th>Bayesian · 90% for one reading</th><th>Bayesian · 90% for the mean</th></tr></thead>
<tbody><tr><th>8</th><td>1.8510</td><td>[1.5016, 2.2005]</td><td>[1.4860, 2.2160]</td><td>[1.7611, 1.9409]</td></tr>
<tr><th>512</th><td>1.8733</td><td>[1.5207, 2.2259]</td><td>[1.5206, 2.2261]</td><td>[1.8658, 1.8809]</td></tr></tbody></table></div>
<p>With 8 paths, allowing for parameter uncertainty widens the prediction interval by 4.44%. With 512 paths, it widens it by only 0.04%. Read across each row to compare methods fitted to the same data. Then look down the last column: the estimated average becomes much more precise. One individual reading can still vary by roughly 0.35 on either side of it.</p>
<p>Let \(L=1/N+(x_0-\bar x)^2/\sum_j(x_j-\bar x)^2\), where \(\bar x\) is the mean training input, and let \(r^2=\sum_j e_j^2/(N-2)\). Estimating a slope and an intercept leaves \(N-2\) residual degrees of freedom. With the reference prior and positive residual variance, both posterior intervals are centered at \(\hat a x_0+\hat b\). Their half-widths use the 95th percentile \(t_{0.95,N-2}\) of a Student-\(t\) distribution to leave 5% in each tail:</p>
\[\begin{aligned}
\text{Average next reading:}&\quad t_{0.95,N-2}\,r\sqrt{L},\\
\text{Individual next reading:}&\quad t_{0.95,N-2}\,r\sqrt{1+L}.
\end{aligned}\]
<p>The extra 1 accounts for the new reading’s own disturbance. The fixed-parameter Gaussian interval uses half-width \(1.645\,\hat s\). With exactly zero source noise the display shows the deterministic limit. The table uses these one-step formulas. For the time graph we keep each candidate set of regression parameters fixed across the whole forecast and allow independent residuals at each step. The later Bayesian bounds are numerical 5th and 95th percentiles after averaging the candidate forecasts over the posterior. The means coincide at one step and can diverge later as the fitted slope acts repeatedly. Each shaded slice covers a reading at its own time; a whole path may leave the band.</p>
</details>
<h3>Would the forecasts still agree halfway to the next reading?</h3>
<p>Bayesian regression is a practical choice for the next scheduled reading. Now imagine the same sensor sends an <em>early</em> reading, after 0.05 time units. All our training pairs were 0.1 apart. What can those pairs tell us about the missing half-step?</p>
<p>Start both possible paths at 2. To isolate the effect of the timing assumption, use the known source coefficients: restoring rate 0.8, long-run level 0.4 and noise strength 0.7. From Section 6, the OU mean \(m(h)\) and standard deviation \(s(h)\) at any elapsed time \(h\) are</p>
\[m(h)=0.4+(2-0.4)e^{-0.8h},\qquad s(h)=0.7\sqrt{\frac{1-e^{-1.6h}}{1.6}}.\]
<p>At \(h=0.1\), the <strong>known-source forecast</strong> gives mean 1.8770 (the default fit from 32 paths gave 1.885) and standard deviation 0.2128. At \(h=0.05\), the pull has had less time to act and less Brownian noise has accumulated. Substituting 0.05 gives mean 1.9373 and standard deviation 0.1534. Its central 90% interval is \(1.9373\pm1.645(0.1534)\), or <strong>[1.6849, 2.1897]</strong>.</p>
<p><strong>Why can’t the regression on 0.1-unit pairs pick that interval?</strong> Imagine a second sensor that draws exactly the same endpoint \(Y\) at time 0.1, but travels in a straight line from 2 to \(Y\). Its halfway reading is \((2+Y)/2\). Halving the endpoint displacement also halves its standard deviation to 0.1064. Here are the implications of those two possible paths:</p>
<div class="table-wrap"><table><caption>Known coefficients · 90% interval for one reading starting from 2</caption><thead><tr><th>Motion inside the gap</th><th>At 0.1 (training spacing)</th><th>At 0.05 (halfway)</th></tr></thead><tbody>
<tr><th>OU motion with Brownian disturbances</th><td>[1.5270, 2.2270]</td><td>[1.6849, 2.1897]</td></tr>
<tr><th>Straight line to the same random endpoint</th><td>[1.5270, 2.2270]</td><td>[1.7635, 2.1135]</td></tr></tbody></table></div>
<p>A halfway reading of <strong>2.15</strong> lies inside the OU interval and outside the straight-line interval. Yet every pair recorded at the training spacing has the same likelihood under both stories. Even unlimited endpoint pairs leave that choice open. The SDE supplies an explicit assumption about motion inside the gap. A Bayesian model can make a halfway forecast too once it specifies such a rule or learns from halfway readings.</p>
<p>So far the average has followed a straight-line rule. In the next experiment a disturbance can push the sensor over a hill, where the drift itself changes direction. What will a point forecast miss there?</p>
`;
