import { prose, h, check } from './helpers.js';

export const deepBsde = demos => prose`
${h('deep-bsde','Learn today’s value from a payoff tomorrow')}
<p>The pricing example asked for the current value of a future payoff. To understand the learning method, remove the financial details and solve a smaller version of that question. Watch a Brownian path until time \(T\), and receive its final position squared. Halfway through the walk you know where you are, but not the future kicks. What is the expected payoff from here? And how much should your estimate change after the next kick? These are the same kinds of value and sensitivity questions as in the pricing equation above, now with an answer we can calculate directly.</p>
<h3>First solve a case we can check by hand</h3>
<p>If the current position is \(W_t=x\), write the final position as \(x+\eta\). The remaining increment \(\eta=W_T-W_t\) is independent of what we have seen, with mean zero and variance \(T-t\). Expanding the square therefore gives the value function</p>
\[u(t,x)=\mathbb E[(x+\eta)^2]=x^2+2x\,\mathbb E[\eta]+\mathbb E[\eta^2]=x^2+T-t.\]
<p>Along one path call this value \(Y_t=u(t,W_t)\). At the start \(Y_0=T\), and at the end \(Y_T=W_T^2\). What happens between them? By Itô’s rule, \(\mathrm d(W_t^2)=2W_t\,\mathrm dW_t+\mathrm dt\); the change in \(T-t\) cancels that last term. Thus</p>
\[\mathrm dY_t=Z_t\,\mathrm dW_t,\qquad Z_t=2W_t,\qquad Y_t=W_T^2-\int_t^T Z_s\,\mathrm dW_s.\]
<p>\(Z_t\) here is the sensitivity multiplying the next Brownian increment. It is chosen from what is known at time \(t\); it is not a new Gaussian draw. This is a <em>backward stochastic differential equation</em> (BSDE): we specify the value at the end and seek the earlier value and sensitivity. The simulated Brownian path still runs forward. We are solving for a value, rather than reversing a diffusion to generate data.</p>
<h3>Can a network discover the sensitivity from terminal payoffs alone?</h3>
<p>Hide our two answers from the learner. Give it a trainable starting number \(y\) and a small neural network \(z_\theta(t,x)\). On each new path it chooses the multiplier <em>before</em> it sees the next kick. Then it carries the estimate forward:</p>
\[\widehat Y_0=y,\qquad \widehat Y_{i+1}=\widehat Y_i+z_\theta(t_i,W_{t_i})\,\Delta W_i.\]
<p>At the final time we can check the prediction against the observed square. For a batch of \(M\) paths, update \(y\) and the network weights to reduce</p>
\[\mathcal L(y,\theta)=\frac1M\sum_{m=1}^M\left(\widehat Y_N^{(m)}-(W_T^{(m)})^2\right)^2.\]
<p>Train below, then compare the learned curve with the hand calculation. The error readout uses a separate, fixed set of paths. Neither the exact sensitivity nor those test paths supplies training labels.</p>
` + demos.bsde + prose`
<p><strong>Why is there still an error with the exact sensitivity?</strong> Section 5 gives a pathwise identity: \(\sum_i2W_{t_i}\Delta W_i=W_T^2-\sum_i(\Delta W_i)^2\). Even if we insert \(y=T\) and \(z=2x\), the discrete prediction misses the terminal square by \(T-Q_N\), where \(Q_N=\sum_i(\Delta W_i)^2\). For equal intervals its mean is zero and its mean squared size is \(2T^2/N\). Refining the grid reduces this error; training longer on the same grid does not remove it. A finite test average fluctuates around its population value.</p>
<h3>Why use this for a harder equation?</h3>
<p>The square was a test case. Suppose the state now has many coordinates and moves by \(\mathrm dX_t=b\,\mathrm dt+\sigma\,\mathrm dW_t\). A terminal function \(g(x)\) sets the payoff, and a given function \(F\), called the driver, changes the value along the way. A family of problems for an unknown smooth \(u(t,x)\) has this form:</p>
\[\begin{aligned}
\partial_tu+b\cdot\nabla u+\tfrac12\operatorname{tr}(\sigma\sigma^\top\nabla^2u)+F(t,x,u,\sigma^\top\nabla u)&=0,\\
u(T,x)&=g(x).
\end{aligned}\]
<p>The middle two terms are the multidimensional drift and curvature terms from Itô’s rule: \(\nabla u\) collects the slopes, and \(\nabla^2u\) the second derivatives. Apply the rule to \(Y_t=u(t,X_t)\). Its drift is the first three terms of the equation, hence \(-F\). Its Brownian coefficient is \(Z_t=\sigma^\top\nabla u(t,X_t)\), the sensitivity in each noise direction. So along a path the same equation reads</p>
\[\mathrm dY_t=-F(t,X_t,Y_t,Z_t)\,\mathrm dt+Z_t\cdot\mathrm dW_t,\qquad Y_T=g(X_T).\]
<p>On a grid, add \(-F_i\Delta t\) to the learner’s update above and use \(g(X_T)\) as its target. The square example has \(b=0,\ \sigma=1,\ F=0\). In many dimensions the attraction is practical: sample paths instead of building a full spatial grid. Approximation, time steps, and training still affect accuracy. This is the idea behind the <a href="https://arxiv.org/abs/1707.02568" target="_blank" rel="noreferrer">Deep BSDE method of Han, Jentzen and E</a>. The demo uses one small network shared across times to make the idea visible in a browser.</p>
` + check('In the square-payoff example, why should the learned multiplier be nearly zero when the current position is zero?', 'The payoff is symmetric: moving a little to the right or left of zero changes its current value only to second order. Its slope there is zero, even though the remaining time still gives the payoff a positive expected value.');
