import { prose, h, check, link, note } from './helpers.js';

export const stratonovich = demos => prose`
${h('endpoint-choice','Why change the integral convention?')}
<p>In the last chapter we read the noise coefficient at the start of each interval. Section 4 gives us a way to test that choice without solving another equation. Follow the same Brownian step from \(W_i\) to \(W_i+\Delta W_i\). What difference would it make to use the average of those two positions as the multiplier?</p>
\[\begin{aligned}
\text{left contribution}&=W_i\Delta W_i,\\
\text{midpoint contribution}&=(W_i+\tfrac12\Delta W_i)\Delta W_i,\\
\text{difference}&=\tfrac12(\Delta W_i)^2 .
\end{aligned}\]
<p>For a move from 0.3 to 0.1, the contributions are −0.06 and −0.04. Even on a downward move, the difference is positive. On a finite grid these differences add to \(Q_n/2\); as the grid is refined, the limit is \(T/2\). We have found Section 4’s missing triangular pieces again.</p>
<p>The left choice is Itô’s. The symmetric choice gives the Stratonovich integral, written with a small circle, \(\circ\,\mathrm dW\). It takes both ends of the step to compute that contribution. Slide a fraction \(\lambda\) of the way from the starting state to the ending state: zero selects the left end and one half selects the midpoint.</p>
<p>The simplest calculation shows why the choice matters. Using the finite identity from Section 4:</p>
\[\begin{aligned}I_{\lambda,n}&=\sum_i(W_{t_i}+\lambda\Delta W_i)\Delta W_i\\&=\frac12W_T^2+\left(\lambda-\frac12\right)Q_n\\&\xrightarrow{L^2}\frac12W_T^2+\left(\lambda-\frac12\right)T.\end{aligned}\]
<p>The arrow marked \(L^2\) means that the average squared error tends to zero. Since \(\mathbb E[W_T^2]=T\), the limiting integral has expectation \(\lambda T\). At \(\lambda=0\), we recover Itô’s mean-zero integral. At \(\lambda=1/2\), we recover \(W_T^2/2\), the familiar chain-rule expression. At \(\lambda=1\), the result is \(W_T^2/2+T/2\), the right-endpoint or Hänggi–Klimontovich convention in this scalar family.</p>
` + demos.lambda + prose`
<h3>From the straight line to a curved multiplier</h3>
<p>Itô’s integral evaluates a coefficient before the next random change. Suppose we instead interpolate between the endpoint states. For a scalar continuous diffusion and sufficiently smooth integrand \(g\), define the endpoint-interpolated family:</p>
\[\int_0^T g(X_t)\diamond_\lambda\mathrm dW_t=\lim_{|\pi|\to0}\sum_i g(X_{t_i}+\lambda\Delta X_i)\,\Delta W_i,\qquad0\le\lambda\le1.\]
<p>The parameter refers to interpolation between states, not evaluation at the physical time \(t_i+\lambda\Delta t_i\). For this smooth setting, \(\lambda=1/2\) gives the Stratonovich integral, equivalently defined by symmetric integrand-endpoint sums.</p>

${h('integral-conversion','Derive the integral conversion')}
<p>The slider changed the value of the integral on one fixed collection of paths. To translate an equation between conventions we need the size of that change for a general multiplier. Let \(X\) have diffusion coefficient \(b\). Expand the interpolated coefficient about the left state:</p>
\[g(X_i+\lambda\Delta X_i)\Delta W_i=g(X_i)\Delta W_i+\lambda g'(X_i)\Delta X_i\Delta W_i+\text{remainder}.\]
<p>Because \(\Delta X_i\approx a_i\Delta t_i+b_i\Delta W_i\), the mixed sum retains \(b_i(\Delta W_i)^2\). The other product, \(a_i\Delta t_i\Delta W_i\), vanishes in the sum. For smooth coefficients with bounded derivatives on the range considered, the next Taylor term is of typical size \(h^{3/2}\) per step; summing \(T/h\) such bounds leaves an error tending to zero. The surviving weighted squares give:</p>
\[\int_0^Tg(X_t)\diamond_\lambda\mathrm dW_t=\int_0^Tg(X_t)\,\mathrm dW_t+\lambda\int_0^T g'(X_t)b(t,X_t)\,\mathrm dt.\]
<p>Subtracting the formulas for two conventions gives:</p>
\[\begin{aligned}&\int_0^Tg(X_t)\diamond_{\lambda_2}\mathrm dW_t-\int_0^Tg(X_t)\diamond_{\lambda_1}\mathrm dW_t\\&\qquad=(\lambda_2-\lambda_1)\int_0^Tg'(X_t)b(t,X_t)\,\mathrm dt.\end{aligned}\]
${h('chain-rule','Derive the chain rule and drift conversion')}
<p>Now change the integrator from \(W\) to \(X\). Its squared changes accumulate at rate \(b^2\): \(\mathrm d[X]_t=b^2\mathrm dt\). In the expansion of \(f_x\,\mathrm dX\), moving the evaluation point adds \(\lambda f_{xx}(\Delta X_i)^2\) on each interval to leading order. Changing the convention for \(f_x\,\mathrm dX\) absorbs \(\lambda b^2f_{xx}\mathrm dt\) of Itô’s correction:</p>
\[\mathrm df(t,X_t)=\left(f_t+\left(\frac12-\lambda\right)b^2f_{xx}\right)\mathrm dt+f_x\diamond_\lambda\mathrm dX_t.\]
<p>Thus the midpoint choice \(\lambda=1/2\) preserves the ordinary chain rule:</p>
\[\mathrm df(t,X_t)=f_t\,\mathrm dt+f_x\circ\mathrm dX_t.\]
<p>To describe the <em>same process</em> with a different convention, its drift must change. Apply the integral-conversion identity with \(g=b\):</p>
\[\begin{aligned}a_{\mathrm{It\hat{o}}}&=a_\lambda+\lambda b\,\partial_xb,\\a_{\lambda_1}-a_{\lambda_2}&=(\lambda_2-\lambda_1)b\,\partial_xb,\\a_{\mathrm{It\hat{o}}}&=a_{\mathrm{Strat}}+\frac12b\,\partial_xb.\end{aligned}\]
<p>For \(b=\sigma X\), the correction is \(\sigma^2X/2\). The Itô equation with drift \(\mu X\) is therefore equivalent to the Stratonovich equation with drift \((\mu-\sigma^2/2)X\). For additive noise, \(\partial_xb=0\), so the convention shift vanishes.</p>
` + demos.conversion + prose`
${h('physical-applications','Applications: what the convention helps describe')}
<p>The conversion demo superimposes two descriptions of one path. Which description is convenient depends on how the model arose. In the first example below, it comes from smoothing the driving signal; in the last, it comes from a measured law for concentration.</p>
<h3>Smooth-noise limits and Wong–Zakai</h3>
<p>Consider ordinary equations driven by suitable smooth approximations \(W^\varepsilon\) to Brownian motion:</p>
\[\dot x^\varepsilon=\widetilde a(x^\varepsilon)+b(x^\varepsilon)\dot W^\varepsilon.\]
<p>For standard piecewise-linear or mollified approximations and appropriate smoothness assumptions, the solutions converge to the Stratonovich equation \(\mathrm dX=\widetilde a\,\mathrm dt+b\circ\mathrm dW\). This is the classical Wong–Zakai connection. Other approximation mechanisms can produce other corrections; calling a noise source “physical” does not universally determine its convention. <a href="https://www.hairer.org/papers/WongZakai.pdf" target="_blank" rel="noreferrer">Hairer and Pardoux’s introduction</a> reviews the classical result.</p>
<h3>Multiplicative growth or decay</h3>
<p>For \(X_0>0\), consider \(\mathrm dX=-kX\,\mathrm dt+\sigma X\circ\mathrm dW\). The ordinary chain rule gives:</p>
\[\mathrm d\log X=-k\,\mathrm dt+\sigma\,\mathrm dW,\qquad X_t=X_0e^{-kt+\sigma W_t}.\]
<p>Its equivalent Itô drift is \((-k+\sigma^2/2)X\). Comparing it to an Itô equation with written drift \(-kX\) would compare different processes. This scalar first-order model describes multiplicative dynamics; an inertial oscillator requires position and velocity equations.</p>
<h3>Coordinate changes and stochastic control</h3>
<p>Under a smooth coordinate transformation, a Stratonovich equation transforms using the familiar chain rule. This makes vector-field descriptions on curved state spaces convenient. For a scalar controlled example:</p>
\[\mathrm dX=(aX+u)\,\mathrm dt+\sigma X\circ\mathrm dW,\qquad\mathrm d(X^2)=(2aX^2+2Xu)\,\mathrm dt+2\sigma X^2\circ\mathrm dW.\]
<p>The equivalent Itô equation has drift \((a+\sigma^2/2)X+u\); applying Itô’s formula there gives the same process and energy evolution. The choice of notation alone does not supply a stabilizing control law or remove noise-induced effects.</p>
<h3>Biological diffusion in a heterogeneous medium</h3>
<p>Suppose the intended concentration equation is Fick’s law with a positive position-dependent diffusivity \(D(x)\):</p>
\[\partial_tp=\partial_x\!\left(D(x)\partial_xp\right).\]
<p>Insert \(b=\sqrt{2D}\) into the ${link('diffusion','fokker-planck','density equation derived in Section 8B')}. The product rule gives:</p>
\[-\partial_x(ap)+\partial_{xx}(Dp)=\partial_x(D\,\partial_xp)+\partial_x\!\left[(D'-a)p\right].\]
<p>To recover the intended law for arbitrary densities, set the extra drift term to zero: \(a=D'\). Since \(bb'=D'\), the equivalent scalar \(\lambda\)-convention drift is:</p>
\[a_\lambda=(1-\lambda)D'.\]
<p>Thus the same Fickian model has drift \(D'\) in Itô form, \(D'/2\) in Stratonovich form, and zero written drift in the right-endpoint convention. A microscopic model determines which macroscopic equation is appropriate; one should not select a convention merely because the system is biological.</p>
${h('midpoint-methods','Numerical methods must match the convention')}
<p>For a scalar Stratonovich equation, an implicit midpoint step is:</p>
\[X_{n+1}=X_n+\widetilde a\!\left(\frac{X_n+X_{n+1}}2\right)\Delta t+b\!\left(\frac{X_n+X_{n+1}}2\right)\Delta W_n.\]
<p>A common explicit Heun predictor–corrector uses the same noise increment in both stages:</p>
\[\begin{aligned}\widehat X&=X_n+\widetilde a(X_n)\Delta t+b(X_n)\Delta W_n,\\X_{n+1}&=X_n+\frac{\widetilde a(X_n)+\widetilde a(\widehat X)}2\Delta t+\frac{b(X_n)+b(\widehat X)}2\Delta W_n.\end{aligned}\]
<p>These are illustrative scalar schemes under suitable coefficient assumptions. A left-endpoint Euler–Maruyama step using the unconverted Stratonovich drift generally targets a different Itô model. Alternatively, convert the drift first, then use an appropriate Itô integrator. Neither midpoint evaluation nor a convention label guarantees stability for every stiff problem.</p>
${h('comparison','Compare the conventions')}
<div class="table-wrap"><table><thead><tr><th>Convention</th><th>Evaluation</th><th>\(\int_0^T W_t\diamond_\lambda\mathrm dW_t\)</th><th>Expected value</th></tr></thead><tbody><tr><td>Itô, \(\lambda=0\)</td><td>Left state</td><td>\(W_T^2/2-T/2\)</td><td>\(0\)</td></tr><tr><td>Stratonovich, \(\lambda=1/2\)</td><td>Symmetric / midpoint limit</td><td>\(W_T^2/2\)</td><td>\(T/2\)</td></tr><tr><td>Right endpoint, \(\lambda=1\)</td><td>Right state</td><td>\(W_T^2/2+T/2\)</td><td>\(T\)</td></tr></tbody></table></div>
<p>For an Itô integral with finite mean-square size and weights chosen using only the past, the best prediction for its next change is zero. Such a running total is called a martingale. The other conventions do not generally have this property. The multidimensional drift correction involves diffusion vector fields and their derivatives; the scalar formula above cannot be copied unchanged into every matrix-valued problem.</p>
<p>All these conventions started with the same noise: continuous Brownian paths with independent increments. Changing the evaluation point cannot turn a continuous path into one with a sudden jump. Section 7 asks when we need to change the noise itself.</p>
` + check('When do all these conventions give the same drift coefficient?',String.raw`For additive noise \(b=b(t)\), the spatial derivative \(\partial_xb\) vanishes. The conversion correction is then zero.`);

export const beyond = demos => prose`
${h('continuous-noise','What is special about Brownian noise?')}
<p>Imagine two instruments recording a signal. One records an abrupt drop at a known event time. The other records a continuous trace whose successive changes tend to have the same sign. Both look noisy. Increasing Brownian noise strength can make its kicks larger, but it neither creates an instantaneous jump nor gives the next kick a memory. Compare these two modeled records:</p>
` + demos.traces + prose`
<p>Read the first trace on either side of its marked event. In the second, follow several successive changes. A short streak can occur by chance even for independent kicks; the correlation experiment below tests what persists across observations.</p>
<details><summary>Which continuous noise does the Brownian classification cover?</summary>
<p>Brownian motion is a useful model, not the definition of all stochastic calculus. A continuous process starting at zero with stationary independent increments is a drifted, scaled Brownian motion, including degenerate deterministic cases. With positive variance rate, subtracting the drift and rescaling the noise to unit variance per unit time yields standard Brownian motion.</p>
<p>This classification is distinct from Lévy’s characterization of Brownian motion as a suitable continuous local martingale with quadratic variation \(t\). Either statement requires its full assumptions. If a system has jumps or correlated increments, we must change the model.</p>
</details>
${h('jumps','Allow sudden events')}
<p>A Poisson process \(N_t\) counts events arriving at rate \(\lambda\). Its increment over duration \(h\) has distribution \(\operatorname{Poisson}(\lambda h)\). For small \(h\), one event has probability \(\lambda h+o(h)\) and two or more have probability \(O(h^2)\). A finite count increment can exceed one. The Poisson formula gives \(\mathbb P(\Delta N=1)=e^{-\lambda h}\lambda h\); subtracting the probabilities of zero and one event from one gives \(1-e^{-\lambda h}(1+\lambda h)=O(h^2)\).</p>
<p>A compound-Poisson jump diffusion adds event sizes \(J_j\) to a continuous component:</p>
\[X_t=\mu t+\sigma W_t+\sum_{j=1}^{N_t}J_j.\]
<p>At a jump time, \(X\) changes by a finite amount. The shorthand \((\mathrm dN)^2=\mathrm dN\) records isolated unit jumps. For a smooth function, the change across an actual jump \(J\) is \(f(X_-+J)-f(X_-)\), not merely its first or second Taylor term. For the square function we can see what would go missing:</p>
\[ (X_-+J)^2-X_-^2=2X_-J+J^2. \]
<p>Here \(X_-\) means the position just before impact. Even when we localize the event perfectly in time, its height \(J\) does not shrink. The linear integral counts \(2X_-J\); the jump correction restores \(J^2\).</p>
` + demos.jumps + prose`
${h('semimartingales','A broader setting: semimartingales')}
<p>Why can we still use much of the old calculus after adding jumps? We can record the continuous accumulation and account for each abrupt change separately. The broader class is called a semimartingale. A semimartingale can be decomposed as \(X=X_0+A+M\), with a finite-variation component \(A\) and a local martingale \(M\). This is the standard broad setting for Itô integration, encompassing many continuous models and processes with jumps.</p>
<p>Continuous martingale fluctuations contribute through quadratic variation, finite-variation parts through their ordinary integrals, and jumps through explicit jump terms. This process class supports the usual robust stochastic integration theory, but does not by itself establish that a financial model is arbitrage-free.</p>
${h('memory','Allow correlated increments')}
<p>Now look at the second trace. It stays continuous. Here the new feature is how one displacement relates to the next one. Let \(H\) control both the size of a displacement over a short interval and the dependence between displacements. Fractional Brownian motion \(B_t^H\), with \(0<H<1\), is the centered Gaussian process determined by:</p>
\[\mathbb E[B_s^HB_t^H]=\frac12\left(s^{2H}+t^{2H}-|t-s|^{2H}\right).\]
<p>Its increments have variance \(|t-s|^{2H}\), so their typical scale is \(|t-s|^H\). At \(H=1/2\) it is standard Brownian motion. For equal-length increments separated by \(k\) steps, the normalized covariance is:</p>
\[\rho_H(k)=\frac12\left((k+1)^{2H}-2k^{2H}+|k-1|^{2H}\right).\]
<p>To get this formula, write each increment as a difference of positions, expand the product of two differences into four covariance terms, then divide by the common increment variance. For neighbors a quick check uses \(\operatorname{Var}(A+B)=2h^{2H}+2\operatorname{Cov}(A,B)=(2h)^{2H}\), giving \(\rho_H(1)=2^{2H-1}-1\). Predict the sign at \(H=0.75\), then compare the measured and theoretical bars.</p>
<p>It is positive for \(H>1/2\) and negative for \(H<1/2\), for positive lags. Changing only the size of independent increments cannot produce this memory.</p>
` + demos.memory + prose`
${h('other-integrals','Why the integration theory must change too')}
<p>For \(H\ne1/2\), fractional Brownian motion is generally not a semimartingale. Ordinary Itô integration cannot simply be reused. Young integration handles many regular-integrand problems when \(H>1/2\). Rough-path constructions cover important rougher cases; the standard multidimensional Gaussian rough-path lift applies for \(H>1/4\). Smaller Hurst parameters need additional constructions or renormalization.</p>
<p>Jump models can represent abrupt claims or shocks. Correlated-noise models can represent persistent or anti-persistent fluctuations. These are modeling possibilities, not evidence that any particular real-world dataset follows one of these processes.</p>
<p>We now have the tools to specify and solve stochastic models. Section 8A changes the starting point: instead of knowing the coefficients, we observe data and ask a learner to estimate the dynamics. Section 8B will then use deliberately added noise to build a generative model.</p>
` + check('Can independent increments scaled by a different power of time reproduce fractional Brownian motion?', 'No. The required correlations between increments are part of its definition. Both scaling and covariance must be represented.');

