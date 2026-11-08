import { prose } from './helpers.js';

export const eulerDemo = prose`</div>
<section class="lab" data-lab="euler" aria-labelledby="euler-title">
  <div class="lab-header"><div><span class="lab-kicker">CHECK A NUMERICAL METHOD</span><h3 id="euler-title">How small should the time step be?</h3><p>Approximate the OU model we already solved. Keep the same underlying randomness while refining the grid.</p></div><button data-new="euler">New sample ↻</button></div>
  <div class="controls">
    <div class="control"><label for="euler-k"><span class="control-label">Number of intervals</span><output id="euler-k-value" for="euler-k"></output></label><input id="euler-k" type="range" min="3" max="10" step="1" value="4"></div>
    <div class="control"><label for="euler-theta"><span class="control-label">Restoring strength \(\theta\)</span><output id="euler-theta-value" for="euler-theta"></output></label><input id="euler-theta" type="range" min="0" max="3" step="0.1" value="1"></div>
    <div class="control"><label for="euler-sigma"><span class="control-label">Noise amplitude \(\sigma\)</span><output id="euler-sigma-value" for="euler-sigma"></output></label><input id="euler-sigma" type="range" min="0" max="1.5" step="0.1" value="0.8"></div>
  </div>
  <div class="plots">
    <div class="plot"><div class="plot-title" id="euler-path-title">One driver: exact OU samples and Euler approximation</div><canvas id="euler-path" role="img" aria-labelledby="euler-path-title"></canvas><div class="legend"><span><i></i>Exact OU samples</span><span><i class="coral"></i>Euler approximation · dashed</span></div></div>
    <div class="plot"><div class="plot-title" id="euler-error-title">Endpoint error across 256 coupled paths</div><canvas id="euler-error" role="img" aria-labelledby="euler-error-title"></canvas><div class="legend"><span><i></i>Root mean squared endpoint error</span><span><i class="coral"></i>Selected grid</span></div></div>
  </div>
  <div class="stats"><div class="stat"><span class="stat-label">Time step \(h=4/N\)</span><strong id="euler-step">—</strong></div><div class="stat"><span class="stat-label">Endpoint RMSE</span><strong id="euler-rmse">—</strong></div></div>
  <p class="try"><strong>Try this.</strong> Increase the number of intervals. Then set \(\sigma=0\) to isolate deterministic discretization error, or \(\theta=0\) to see a case where Euler is exact at the grid times. One path’s error need not decrease at every refinement; compare the ensemble error too.</p>
  <p class="method">\(m=0,\ X_0=1,\ T=4\). Exact OU values and Brownian increments are jointly sampled on a 1,024-interval grid. Coarser increments sum the same fine increments. The exact OU integral includes its conditional Gaussian residual, so both methods use a common Brownian driver. Connecting sampled values with lines does not display every fluctuation between them. RMSE is the square root of the average squared difference between exact and approximate endpoints.</p>
</section><div class="story">`;
