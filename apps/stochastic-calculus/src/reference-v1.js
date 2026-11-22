export const referenceHtml = String.raw`
<div class="story"><h2>The symbols we use</h2>
<div class="table-wrap"><table><thead><tr><th>Symbol</th><th>Meaning</th></tr></thead><tbody><tr><td>\(\mathbb E[X],\operatorname{Var}(X)\)</td><td>Mean and variance across realizations.</td></tr>
<tr><td>\(\mathcal N(\mu,\sigma^2)\)</td><td>Normal distribution with mean \(\mu\) and variance \(\sigma^2\).</td></tr>
<tr><td>\(W_t\), \(\Delta W_i\)</td><td>Standard Brownian position and finite increment \(W_{t_{i+1}}-W_{t_i}\).</td></tr>
<tr><td>\(\mathrm{d}t\), \(\mathrm{d}W_t\)</td><td>Differential notation for integral identities; not isolated numerical increments.</td></tr>
<tr><td>\(a,b\)</td><td>Itô drift and diffusion coefficient; local variance rate is \(b^2\).</td></tr>
<tr><td>\(f_t,f_x,f_{xx}\)</td><td>First time derivative, first and second spatial derivatives.</td></tr>
<tr><td>\([W]_t\)</td><td>Quadratic variation, equal to t for standard Brownian motion.</td></tr>
<tr><td>\(\int H_t\,\mathrm{d}W_t,\quad\int H_t\circ\mathrm{d}W_t\)</td><td>Itô and Stratonovich stochastic integrals.</td></tr>
<tr><td>\(\pi,\ |\pi|\)</td><td>In Section 7, a partition \(\pi=\{t_0,\ldots,t_n\}\) lists the time points. Its mesh \(|\pi|=\max_i(t_{i+1}-t_i)\) is the longest step. Taking \(|\pi|\to0\) refines every step. <a href="#stratonovich/integral-conversion">Section 7’s symmetric sum</a></td></tr>
<tr><td>\(\lambda\) (integration)</td><td>Section 7’s dimensionless convention parameter specifies how the endpoint states enter a sum. The values \(0,\tfrac12,1\) give the Itô, Stratonovich, and right-endpoint rules. <a href="#stratonovich/lambda-family">Integral conventions</a></td></tr>
<tr><td>\(\lambda\) (jumps)</td><td>Section 8 uses the same letter for an event rate, measured in openings per unit time. A Poisson count with constant rate \(\lambda\) has expected count \(\lambda h\) over a gap of length \(h\). <a href="#beyond/jumps">Jump experiment</a></td></tr>
<tr><td>\(N_t,\ \Delta N,\ \mathrm dN_t\)</td><td>\(N_t\) counts openings up to time \(t\). The increment \(\Delta N=N_b-N_a\) counts openings in \((a,b]\). In the valve equation, \(-0.60\,\mathrm dN_t\) contributes one pressure drop of \(0.60\) at each opening. <a href="#beyond/jump-equation">Pressure equation</a></td></tr>
<tr><td>\(\widehat{\sigma},\ \hat a,\ \hat b\)</td><td>A hat marks a value fitted from training records. In Section 9 the first sensor example fits transition coefficients \(\hat a,\hat b\). The alarm examples estimate the background noise strength \(\widehat{\sigma}\).</td></tr>
<tr><td>\(\pi,\ L,\ w\) (valve inference)</td><td>Here \(\pi\) is the opening probability before seeing this minute’s pressure readings. \(L\) compares how likely the observed pressure change is under an opening versus a closed valve. \(w=\pi L/(1-\pi+\pi L)\) is the updated probability that the valve opened. The alarm probability also depends on whether pressure reached the threshold in each case. <a href="#learning/valve-alarm">Section 9’s valve example</a></td></tr>
<tr><td>\(p_t(x)\), \(s_t(x)\)</td><td>Time-t density and score \(\partial_x\log p_t(x)\).</td></tr>
<tr><td>Almost surely</td><td>With probability one under the specified model.</td></tr>
<tr><td>Mean-square convergence</td><td>\(\mathbb E[|X_n-X|^2]\) tends to zero.</td></tr>
<tr><td>Time marginal</td><td>The distribution at one specified time; it does not specify joint behavior across times.</td></tr></tbody></table></div><h2>About the experiments</h2>
<p>In the path simulations, a seed lets readers replay a random draw. A training-data refit can change a model’s estimates. A theoretical reference uses the specified source model and the evidence in the question. Section 9 illustrates the distinction in four ways.</p>
<ul>
<li><a href="#learning/learn-random-motion">Example 1 · Forecast intervals.</a> The sensor paths supply training pairs. The fitted slope, intercept, and residual variance determine the Gaussian forecast band. Bayesian regression also accounts for uncertainty in the fitted parameters.</li>
<li><a href="#learning/learn-switching">Example 2 · Recorded visits.</a> The source equation gives the chance of recording the ball at the flag by the chosen deadline. The app calculates this benchmark numerically on a position grid. The learned stochastic forecasts estimate their visit rates by counting simulated paths.</li>
<li><a href="#learning/crossing-between-readings">Example 3 · A missed alarm.</a> The Brownian bridge gives a closed-form probability of touching the threshold between readings. The theoretical calculation uses the known noise strength. The learned model substitutes its fitted noise strength. An extra reading updates both probabilities with the fit held fixed.</li>
<li><a href="#learning/valve-alarm">Example 4 · A missing valve record.</a> Historical logs supply the fitted opening frequency and background noise. For a closed valve, the bridge formula gives the alarm risk. For one opening, numerical integration averages over its unknown time and the pressure just before the drop. With the log missing, the model weights those two risks using the pressure readings. Recovering the valve record selects the applicable case.</li>
</ul><p>The app has no analytics, login, remote fonts, CDN scripts, or AI calls. Reference links open external sites only when clicked. The lesson and all simulations work without an internet connection once the Vite app is served.</p></div>
`;
