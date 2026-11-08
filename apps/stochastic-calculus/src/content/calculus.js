import { prose, h, check } from './helpers.js';
import { eulerDemo } from './sde-demos.js';

export const sdes = demos => prose`
${h('sde-definition','What does an SDE specify?')}
<p>Section 5 supplied two tools: an integral for accumulating random changes and a chain rule for transforming them. Now we use those tools to answer one question: <em>if we specify how a system changes locally, how can we find its evolution?</em> We will solve a constant-coefficient equation, learn how transformations help, solve two state-dependent examples, then approximate a solution on a time grid.</p>
<p>Itô’s lemma started with a known process \(W_t\) and computed what happens to a known function of it. In a modeling problem, we usually know a local rule for change and want to find the evolving state. This is the same shift that leads from ordinary derivatives to ordinary differential equations.</p>
<p>An Itô stochastic differential equation specifies:</p>
\[\mathrm dX_t=\underbrace{a(t,X_t)\,\mathrm dt}_{\text{drift}}+\underbrace{b(t,X_t)\,\mathrm dW_t}_{\text{diffusion}},\qquad X_0=x_0.\]
<p>The state is \(X_t\), its known starting value is \(x_0\), and \(W_t\) is the Brownian driving process. Here \(a(t,X_t)\) is the drift and \(b(t,X_t)\) is the diffusion coefficient, or noise amplitude. Over a short interval \(h\), freeze these coefficients at the current time and state:</p>
\[\Delta X\approx a(t,X_t)h+b(t,X_t)\sqrt h\,Z,\qquad Z\sim\mathcal N(0,1).\]
<p>Given the current state, the approximate change has mean \(a(t,X_t)h\), variance \(b(t,X_t)^2h\), and standard deviation \(\lvert b(t,X_t)\rvert\sqrt h\). So the coefficient sets the scale of a random change, not its realized size or direction. The SDE itself means:</p>
\[X_t=x_0+\int_0^t a(s,X_s)\,\mathrm ds+\int_0^t b(s,X_s)\,\mathrm dW_s.\]
<p>A <em>solution</em> is a process \(X_t\) satisfying that integral equation with the specified initial value and Brownian driver. Once a driving path is supplied, the solution describes the corresponding state path. A formula for that process can still contain \(W_t\) or an Itô integral: solving an SDE does not remove its randomness.</p>
<p>After finding the solution, we can ask for its mean and variance across repeated paths. Those statistics answer a different question from the path formula itself.</p>
<p>Appropriate regularity and growth assumptions are needed for existence and uniqueness. Here we use familiar well-behaved examples rather than develop that theory.</p>
${h('additive','First solve an equation with constant coefficients')}
<p>Return to the traveler from Section 1. The clock advances by \(h\); the traveler gains a predictable distance \(\mu h\) and a random displacement \(\sigma\Delta W_i\). Earlier we called a random displacement a “kick.” Its size varies from one interval to the next: \(\Delta W_i=\sqrt h\,Z_i\), where \(Z_i\) is a standard normal draw. The <em>noise amplitude</em> \(\sigma\ge0\) is the multiplier that controls the spread of those displacements:</p>
\[\mathbb E[\sigma\Delta W_i]=0,\qquad \operatorname{SD}(\sigma\Delta W_i)=\sigma\sqrt h.\]
<p>Thus \(\sigma\) is not a fixed distance traveled at each step. For the same interval \(h\), doubling \(\sigma\) doubles the standard deviation of the random displacement. Meanwhile, \(\mu\) is the predictable speed. Add the changes: the durations total \(t\), and the signed random displacements telescope to \(\sigma W_t\), since \(W_0=0\).</p>
\[\Delta X_i=\mu h+\sigma\Delta W_i \quad\Longrightarrow\quad X_t=x_0+\mu t+\sigma W_t.\]
<p>The spread after time \(t\) is \(\sigma\sqrt t\) for \(\sigma\ge0\). Here “spread” means standard deviation. Before touching the controls, predict what doubling the speed will do to that spread.</p>
<p>In the integral notation of Section 5, the same sum reads:</p>
\[\begin{aligned}X_t&=x_0+\int_0^t\mu\,\mathrm ds+\int_0^t\sigma\,\mathrm dW_s\\&=x_0+\mu t+\sigma W_t,\\X_t&\sim\mathcal N(x_0+\mu t,\sigma^2t).\end{aligned}\]
<p>We have now solved the equation: the state at time \(t\) is explicitly expressed using the starting value, elapsed time, and Brownian motion. This returns to the introduction’s steady motion plus disturbances, now as a continuous model. Setting \(\sigma=0\) recovers one deterministic path. Changing \(\mu\) moves the mean, while changing \(\sigma\) changes the spread around it.</p>
` + demos.drift + prose`
${h('general-ito','A tool for changing variables: Itô’s lemma')}
<p>Direct integration worked because the coefficients were constant. If the unknown state appears in those coefficients, writing an integral can leave the unknown inside it. A change of variables may simplify that equation. This is the same strategy as solving an ordinary differential equation by substitution, but we need the stochastic chain rule.</p>
<p>Suppose \(X_t\) obeys our SDE and choose a smooth function \(f(t,x)\). Define a new quantity \(Y_t=f(t,X_t)\). <strong>Itô’s lemma gives the equation for \(Y_t\) from the equation for \(X_t\).</strong> It is a calculation tool. To obtain a solution, choose a useful \(f\), apply the lemma, integrate the simpler equation, and recover \(X_t\).</p>
<p>Section 5 did this for \(f(t,W_t)\). Here the state also has drift and a noise multiplier, so we first calculate its squared differential.</p>
<p>Over a finite step, \(\Delta X_i\approx a_i\Delta t_i+b_i\Delta W_i\). Squaring and then using the accumulated product rules gives:</p>
\[(a_i h+b_i\Delta W_i)^2=a_i^2h^2+2a_ib_i h\,\Delta W_i+b_i^2(\Delta W_i)^2.\]
<p>The first two sums vanish under refinement; the last is a weighted squared-step sum, with \(b_i^2\) known before the next Brownian increment. Its limit is \(\int b^2\,\mathrm dt\). In the shorthand of the table:</p>
\[(\mathrm dX_t)^2=(a\,\mathrm dt+b\,\mathrm dW_t)^2=b^2\,\mathrm dt.\]
<p>Apply the same Taylor-sum argument to \(f(t,X_t)\):</p>
\[\begin{aligned}\mathrm df&=f_t\,\mathrm dt+f_x\,\mathrm dX_t+\tfrac12f_{xx}(\mathrm dX_t)^2\\&=\left(f_t+af_x+\tfrac12b^2f_{xx}\right)\mathrm dt+bf_x\,\mathrm dW_t.\end{aligned}\]
<p>The derivatives and coefficients are evaluated at the current \((t,X_t)\). The diffusion coefficient is squared in the correction because the correction measures local variance, not the signed fluctuation.</p>

<p>Two examples will show how to choose \(f\): an exponential time factor cancels a restoring drift, and a logarithm turns proportional changes into additive changes. In each case we will write down the transformation before doing the algebra.</p>
${h('mean-reversion','A restoring force: Ornstein–Uhlenbeck dynamics')}
<p>Think of a temperature fluctuating around a thermostat setting. Above the setting, the controller tends to lower it; below the setting, the controller tends to raise it. Disturbances keep pushing it away. The <em>Ornstein–Uhlenbeck (OU) process</em> is a simple model of this competition: a restoring drift proportional to the distance from a preferred level, together with constant noise amplitude. “Dynamics” means the rule describing how the state evolves:</p>
\[\mathrm dX_t=-\theta(X_t-m)\,\mathrm dt+\sigma\,\mathrm dW_t,\qquad X_0=x_0,\quad\theta>0,\quad\sigma\ge0.\]
<p>The preferred level is \(m\); the restoring strength is \(\theta\); and \(\sigma\) is the noise amplitude just defined. We take the starting value \(x_0\) to be known. When \(X_t>m\), the drift \(-\theta(X_t-m)\) is negative; when \(X_t<m\), it is positive. Farther from \(m\), the restoring drift is stronger. The random displacement over a short interval still has standard deviation approximately \(\sigma\sqrt h\), regardless of the current state.</p>
<p>“Mean reversion” describes that restoring tendency. It does not promise that every next step moves closer to \(m\): a random displacement can overcome the drift. Our question is: given the starting value and the Brownian driving path, what is \(X_t\)? After solving that, we will calculate its mean and variance.</p>
<h3>Remove the preferred level, then cancel the drift</h3>
<p>First measure the deviation from the preferred level: \(U_t=X_t-m\). Since \(m\) is constant, \(\mathrm dU_t=\mathrm dX_t\), and the equation becomes:</p>
\[\mathrm dU_t=-\theta U_t\,\mathrm dt+\sigma\,\mathrm dW_t,\qquad U_0=x_0-m.\]
<p>Without noise, this deviation would decay as \(U_0e^{-\theta t}\). That suggests multiplying by the opposite exponential, \(A_t=e^{\theta t}\), to undo the decay. This smooth, deterministic factor has differential \(\mathrm dA_t=\theta A_t\,\mathrm dt\).</p>
<p>Apply the lemma to \(f(t,x)=e^{\theta t}(x-m)\), so \(Y_t=A_tU_t\). Its ordinary derivatives are:</p>
\[f_t=\theta e^{\theta t}(x-m),\qquad f_x=e^{\theta t},\qquad f_{xx}=0.\]
<p>Substitute the OU drift \(a=-\theta(X_t-m)\) and diffusion coefficient \(b=\sigma\) into the lemma. The drift terms cancel, and the curvature correction is zero because \(f_{xx}=0\):</p>
\[\begin{aligned}
\mathrm dY_t
&=\left[\theta e^{\theta t}(X_t-m)-\theta(X_t-m)e^{\theta t}
+\tfrac12\sigma^2\cdot0\right]\mathrm dt+\sigma e^{\theta t}\,\mathrm dW_t\\
&=\sigma e^{\theta t}\,\mathrm dW_t.
\end{aligned}\]
<p>This is the payoff from changing variables: the right-hand side no longer contains the unknown \(Y_t\). Equivalently, the product rule gives the same cancellation; its mixed product vanishes because \(\mathrm dA_t\) contains only \(\mathrm dt\), and both \((\mathrm dt)^2\) and \((\mathrm dt)(\mathrm dW_t)\) vanish in the accumulated-product rules.</p>
<h3>Integrate, then undo the multiplication</h3>
<p>Integrating from zero to \(t\) turns the differential on the left into the change of the product. Since \(A_0=1\):</p>
\[e^{\theta t}U_t-U_0=\sigma\int_0^t e^{\theta s}\,\mathrm dW_s.\]
<p>Multiply by \(e^{-\theta t}\). For a fixed final time \(t\), that factor is constant with respect to the integration variable \(s\), so it can go inside the integral:</p>
\[\begin{aligned}
U_t&=U_0e^{-\theta t}+\sigma\int_0^t e^{-\theta t}e^{\theta s}\,\mathrm dW_s\\
&=(x_0-m)e^{-\theta t}+\sigma\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s.
\end{aligned}\]
<p>Add \(m\) back to recover the state:</p>
\[X_t=m+(x_0-m)e^{-\theta t}+\sigma\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s.\]
<p>The first two terms describe the deterministic return toward \(m\). The integral adds the random displacements, each weighted by how long ago it happened. A displacement at time \(s\) is multiplied by \(e^{-\theta(t-s)}\): older disturbances have had longer to fade under the restoring drift.</p>
<h3>Calculate the mean and variance separately</h3>
<p>The weight \(e^{-\theta(t-s)}\) is deterministic and square-integrable over this finite interval. Its Itô integral has mean zero. Taking expectations therefore gives:</p>
\[\begin{aligned}
\mathbb E[X_t]
&=m+(x_0-m)e^{-\theta t}
  +\sigma\,\mathbb E\!\left[\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s\right]\\
&=m+(x_0-m)e^{-\theta t}.
\end{aligned}\]
<p>To find the variance, subtract this mean first. The entire deviation from the mean is the stochastic integral:</p>
\[X_t-\mathbb E[X_t]=\sigma\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s.\]
<p>Variance is the expected square of that deviation. The Itô isometry from Section 5 turns the expected square of the integral into an ordinary integral of the squared weight:</p>
\[\begin{aligned}
\operatorname{Var}(X_t)
&=\sigma^2\,\mathbb E\!\left[\left(\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s\right)^2\right]\\
&=\sigma^2\int_0^t e^{-2\theta(t-s)}\,\mathrm ds.
\end{aligned}\]
<p>Evaluate this ordinary integral by putting \(r=t-s\), the elapsed time since a disturbance. As \(s\) runs from zero to \(t\), \(r\) runs from \(t\) down to zero, and \(\mathrm ds=-\mathrm dr\):</p>
\[\begin{aligned}
\operatorname{Var}(X_t)
&=\sigma^2\int_t^0 e^{-2\theta r}(-\mathrm dr)
 =\sigma^2\int_0^t e^{-2\theta r}\,\mathrm dr\\
&=\sigma^2\left[-\frac{e^{-2\theta r}}{2\theta}\right]_0^t
 =\frac{\sigma^2}{2\theta}(1-e^{-2\theta t}).
\end{aligned}\]
<p>As time grows, the mean approaches \(m\), and the variance approaches \(\sigma^2/(2\theta)\). For \(\sigma>0\), individual paths keep fluctuating: they do not settle permanently at \(m\). New noise keeps arriving while the effects of older noise fade. This balance limits the spread, unlike free Brownian diffusion, whose variance grows as \(\sigma^2t\).</p>
<p>If \(\sigma=0\), only the deterministic exponential return remains. If the restoring strength is set to zero, use the integral expression directly: all weights become one, giving \(X_t=x_0+\sigma W_t\) and variance \(\sigma^2t\). The formula with \(2\theta\) in the denominator is written for \(\theta>0\).</p>
<p>The experiment below fixes the preferred level at \(m=0\), but lets you choose the starting value \(x_0\). Start away from zero to see the mean return toward it. Individual paths wander around that mean. The variance starts at zero because all paths have the same known starting value; it grows toward a plateau. Increase \(\theta\) to strengthen the restoring effect, or set it to zero to recover free diffusion.</p>
` + demos.sde + prose`
${h('gbm','Multiplicative noise: geometric Brownian motion')}
<p>The OU example used constant noise amplitude and a state-dependent drift. Next make both drift and noise amplitude proportional to the current value. We want to find \(S_t\) when:</p>
\[\mathrm dS_t=\mu S_t\,\mathrm dt+\sigma S_t\,\mathrm dW_t,\qquad S_0>0.\]
<p>A two-percent change is larger in absolute terms for a larger state. To solve the model, use \(f(S)=\log S\), whose derivatives are \(f'=1/S\) and \(f''=-1/S^2\):</p>
\[\begin{aligned}\mathrm d\log S_t&=\frac1{S_t}\,\mathrm dS_t-\frac1{2S_t^2}(\mathrm dS_t)^2\\&=\mu\,\mathrm dt+\sigma\,\mathrm dW_t-\frac12\sigma^2\,\mathrm dt\\&=\left(\mu-\frac{\sigma^2}{2}\right)\mathrm dt+\sigma\,\mathrm dW_t.\end{aligned}\]
<p>The transformed equation now has constant coefficients, just like our first solved example. This differential is the output of Itô’s lemma; to finish solving, integrate it and exponentiate to recover \(S_t\):</p>
\[\begin{aligned}\log S_t-\log S_0&=\left(\mu-\frac{\sigma^2}{2}\right)t+\sigma W_t,\\S_t&=S_0\exp\!\left[\left(\mu-\frac{\sigma^2}{2}\right)t+\sigma W_t\right].\end{aligned}\]
${h('volatility-drag','Why mean and median growth differ')}
<p>A gain of 50% followed by a loss of 50% multiplies a value by \(1.5\times0.5=0.75\). Symmetric percentage changes do not cancel under compounding. In the continuous model, this appears in the log-growth rate \(\mu-\sigma^2/2\).</p>
<p>To compute the mean, use the Gaussian exponential moment \(\mathbb E[e^{\sigma W_t}]=e^{\sigma^2t/2}\):</p>
\[\begin{aligned}\mathbb E[S_t]&=S_0e^{(\mu-\sigma^2/2)t}\mathbb E[e^{\sigma W_t}]=S_0e^{\mu t},\\\operatorname{median}(S_t)&=S_0e^{(\mu-\sigma^2/2)t}.\end{aligned}\]
<p>The median follows from the symmetry of \(W_t\) and monotonicity of the exponential. It is a median at each separate time, not a particular sample trajectory. The demo compares these two statistics at the same observation time, so we can see how a rising mean can coexist with a falling median.</p>
` + demos.gbm + prose`

${h('numerics','When a transformation does not give an explicit solution')}
<p>We chose two particularly helpful substitutions. For a general SDE there may be no similarly useful explicit formula. We can still approximate its evolution by freezing the coefficients at the start of each short interval. This is the <em>Euler–Maruyama method</em>:</p>
\[X_{i+1}=X_i+a(t_i,X_i)h+b(t_i,X_i)\Delta W_i,\qquad \Delta W_i=\sqrt h\,Z_i,\quad Z_i\stackrel{\mathrm{iid}}{\sim}\mathcal N(0,1).\]
<p>Start with the known \(X_0=x_0\), evaluate the drift and noise amplitude there, draw the next Brownian increment, and update. Repeat with the new state. The output is a numerical approximation at the grid times.</p>
<p>Test this method on OU, where we already have an exact answer. For \(m=0\), its Euler update is:</p>
\[X_{i+1}^{\mathrm{Euler}}=(1-\theta h)X_i^{\mathrm{Euler}}+\sigma\Delta W_i.\]
<p>The exact update over that same interval keeps the exponential decay and the weighted Brownian integral:</p>
\[X_{t_{i+1}}=e^{-\theta h}X_{t_i}+\sigma\int_{t_i}^{t_{i+1}}e^{-\theta(t_{i+1}-s)}\,\mathrm dW_s.\]
<p>The approximation replaces \(e^{-\theta h}\) by \(1-\theta h\) and the varying integral weight by one. The experiment compares both updates using the same Brownian driver, so their difference measures approximation error rather than different random inputs. Refine the grid and observe the endpoint error across repeated paths.</p>
` + eulerDemo + prose`
<p>OU is our checkable benchmark. For an equation without a known solution, refinement comparisons and appropriate numerical methods become essential. Accuracy and stability depend on both the equation and the time step.</p>
${h('solution-map','What have we learned to do?')}
<p>An SDE specifies local drift and random variation. A solution describes the resulting process. Itô’s lemma describes a transformed process and can help us find a solution. Euler–Maruyama approximates paths when we work on a grid. The three earlier experiments use exact sampled solutions; the final experiment deliberately introduces numerical error so we can study it.</p>
<p>This completes the core introduction: a local rule, a transformation tool, exact examples, and a numerical approximation. Return to an earlier experiment to compare the equation, one path, and its mean and variance.</p>
` + check("Does applying Itô’s lemma automatically solve an SDE?","It gives the equation for a chosen function of the state. A helpful transformation may simplify that equation enough to integrate it; the solution comes from that integration and transforming back.");
