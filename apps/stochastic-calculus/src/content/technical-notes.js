import { prose, h } from './helpers.js';

export const technicalNotes = () => prose`
${h('physical-crossover','Optional note: the physical crossover to diffusion')}
<p>Section 2 uses the observed/modelled spreading law to motivate the coin-walk scaling. A more detailed equilibrium inertial model keeps velocity as well as position:</p>
\[m\,\mathrm dV_t=-\gamma V_t\,\mathrm dt+\sqrt{2\gamma k_B\mathcal T}\,\mathrm dW_t,\qquad\mathrm dX_t=V_t\,\mathrm dt.\]
<p>With stationary initial velocity, define the relaxation time \(\tau=m/\gamma\) and diffusivity \(D=k_B\mathcal T/\gamma\). Integrating the stationary velocity covariance gives:</p>
\[\mathbb E[(X_t-X_0)^2]=2D\left[t-\tau(1-e^{-t/\tau})\right].\]
<p>For \(t\ll\tau\), expand the exponential to obtain approximately \((D/\tau)t^2\), the ballistic regime. For \(t\gg\tau\), the leading term is \(2Dt\), the diffusive regime. The relaxation time depends on the particle and fluid. This distinguishes the continuous Brownian position model from the microscopic inertial motion it approximates.</p>
${h('brownian-regularity','Optional note: Brownian path regularity')}
<p>The main lesson explains the consequence needed for calculus: Brownian paths have no ordinary derivative, and their squared changes accumulate. More technically, the Gaussian fourth moment is \(\mathbb E[|W_t-W_s|^4]=3|t-s|^2\). The usual continuity arguments give versions whose paths, on bounded time intervals, are Hölder continuous of every order \(\alpha<1/2\). They are not uniformly \(1/2\)-Hölder on any nontrivial interval; the borderline behavior involves logarithmic corrections.</p>
<p>Brownian paths have infinite total variation. On a uniform partition, one illustrative calculation is:</p>
\[\mathbb E\!\left[\sum_{i=0}^{n-1}|\Delta W_i|\right]=n\sqrt{\frac{2\Delta t}{\pi}}=\sqrt{\frac{2Tn}{\pi}}.\]
<p>The expectation's growth illustrates the roughness; the infinite-variation and nowhere-differentiability statements require pathwise theorems, not only this expectation calculation. The Evans reference provides the formal treatment.</p>
${h('weighted-squares','Optional note: why starting-point weights preserve the squared-step rule')}
<p>Taylor expansion in Section 4 creates the weights: the factor \(\tfrac12 f_{xx}(t_i,W_i)\) changes with the starting point of the step. This is why we need a weighted version of quadratic variation.</p>
<p>For bounded coefficients \(G_i\) determined before the next increment, write the difference between a weighted squared-step sum and its time-step counterpart as:</p>
\[R_n=\sum_iG_i\bigl[(\Delta W_i)^2-\Delta t\bigr].\]
<p>Each bracket has conditional mean zero given the past. Consequently cross expectations between different intervals vanish, and the mean square of the difference is:</p>
\[\mathbb E[R_n^2]=2(\Delta t)^2\sum_i\mathbb E[G_i^2]\longrightarrow0.\]
<p>The boundedness assumption makes the last expression at most a constant times \(T\Delta t\). If the time sums converge to an ordinary integral, the weighted squared sums have the same limit. Unbounded cases require suitable integrability or localization. These qualifications support the calculus derivation; they are not prerequisites for understanding the finite-step examples in the main text.</p>
<p>The vanishing product rules also tolerate bounded starting-point weights. For \(|G_i|\le C\), the weighted time-squared sum has absolute value at most \(CT\Delta t\). By the finite-sum Cauchy–Schwarz inequality, the weighted mixed sum satisfies:</p>
\[\left|\sum_iG_i\Delta t\,\Delta W_i\right|\le C\sqrt{\sum_i(\Delta t)^2}\sqrt{\sum_i(\Delta W_i)^2}=C\sqrt{T\Delta t}\sqrt{Q_n}\longrightarrow0.\]
<p>For the square-integrable Itô integral, a formal construction uses suitably measurable, past-dependent integrands with \(\mathbb E[\int_0^T H_t^2\,\mathrm dt]<\infty\), first defines elementary sums, and extends them using the isometry. For the derivation, enough smoothness to control Taylor remainders is convenient. Itô's formula extends to \(C^{1,2}\) functions under the usual local conditions.</p>
${h('symbolic-calculus','Optional note: symbolic stochastic differentiation')}
<p>One algebraic representation of the retained orders uses \(\mathbb R[\varepsilon]/(\varepsilon^3)\), identifying \(\varepsilon\) with a formal noise increment and \(\varepsilon^2\) with the time contribution. This extends the dual-number idea used in ordinary automatic differentiation. It is a representation of the multiplication rules, not a replacement for constructing the stochastic integral.</p>
<p>The source author explores this approach in <a href="https://jiha-kim.github.io/posts/automatic-stochastic-differentiation/" target="_blank" rel="noreferrer">Automatic Stochastic Differentiation</a>.</p>
`;
