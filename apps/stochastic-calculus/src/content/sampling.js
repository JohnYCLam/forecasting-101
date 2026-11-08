import { prose, h, check } from './helpers.js';
export const parameterSampling = () => prose`
${h('other-ml','One more role for noise: explore model parameters')}
<p>In 8A the randomness described a changing observed state. In 8B it helped generate data. Here the moving quantity is a model’s parameter vector, denoted by \(\Theta\). Instead of selecting only one fitted value, we want to explore a distribution of plausible values.</p>
<p>For Bayesian learning, a posterior density is proportional to a likelihood times a prior: \(\pi(\Theta)\propto p(\text{data}\mid\Theta)p(\Theta)\). A stochastic sampling algorithm is one way to explore this target. Adding random noise to an algorithm does not by itself make it Bayesian; the target and update rule must be specified.</p>
${h('langevin','Turn a target distribution into a motion rule')}
<p>For a target density \(\pi\), the Langevin SDE \(\mathrm d\Theta=\tfrac12\nabla\log\pi(\Theta)\,\mathrm dt+\mathrm dW\) has \(\pi\) as a stationary density under suitable conditions. Euler discretization, using an estimated log-density gradient, gives the SGLD idea. Here \(\varepsilon_k>0\) is the step size and \(Z_k\) is an independent standard Gaussian vector:</p>
\[\Theta_{k+1}=\Theta_k+\frac{\varepsilon_k}{2}\widehat{\nabla\log\pi}(\Theta_k)+\sqrt{\varepsilon_k}\,Z_k.\]
<p><a href="https://icml.cc/2011/papers/398_icmlpaper.pdf" target="_blank" rel="noreferrer">Welling and Teh</a> use stochastic gradients to make Bayesian sampling scalable. Step-size schedules and gradient assumptions matter; a finite-step chain is not automatically an exact posterior sample.</p>
<p>To connect this rule to 8B, use a time-independent target \(\pi\). The Langevin drift is \(\tfrac12\nabla\log\pi\) and its diffusion amplitude is one. In the Fokker–Planck equation, substituting the candidate density \(\pi\) gives:</p>
\[-\nabla\cdot\!\left(\tfrac12\pi\nabla\log\pi\right)+\tfrac12\Delta\pi
=-\tfrac12\Delta\pi+\tfrac12\Delta\pi=0.\]
<p>This verifies stationarity under appropriate regularity and boundary conditions. Convergence from a chosen starting point needs additional assumptions. Discretizing and estimating the gradient introduce further approximation. This chapter supplies the mathematical connection; the earlier trajectory demos keep their fitted parameters fixed and do not sample a posterior.</p>
${h('optimization-noise','When the algorithm itself is noisy')}
<p>Mini-batch optimization also contains random update fluctuations. In appropriate small-step regimes, an SDE can approximate their accumulated effect and help analyze exploration or escape behavior. This is an approximation to a discrete algorithm, not a claim that every SGD trajectory is exactly Brownian or that noise always improves optimization.</p>

` + check("In SGLD, what is moving randomly?","The parameter vector. The target is a specified density over parameter values, such as a Bayesian posterior. This differs from the process noise in forecasts and the data-space noise of a diffusion generator.");
