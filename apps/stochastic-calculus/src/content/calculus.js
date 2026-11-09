import { prose, h, check, link } from './helpers.js';
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
<p>Suppose \(X_t\) obeys our SDE. Choose a smooth function \(f(t,x)\): this is the transformation rule, with \(x\) as its ordinary input. Substituting the random state \(X_t\) into that rule defines a transformed process:</p>
\[Y_t:=f(t,X_t).\]
<p>So \(f\) names the function, while \(Y_t\) names its value along the process \(X_t\). <strong>Itô’s lemma calculates the change \(\mathrm dY_t\) from the equation for \(\mathrm dX_t\).</strong> To obtain a solution, choose a useful \(f\), apply the lemma, integrate the simpler equation for \(Y_t\), and undo the transformation to recover \(X_t\).</p>
<p>Section 5 did this for \(f(t,W_t)\). Here the state also has drift and a noise multiplier, so we first calculate its squared differential.</p>
<p>Over a finite step, \(\Delta X_i\approx a_i\Delta t_i+b_i\Delta W_i\). Squaring and then using the accumulated product rules gives:</p>
\[(a_i h+b_i\Delta W_i)^2=a_i^2h^2+2a_ib_i h\,\Delta W_i+b_i^2(\Delta W_i)^2.\]
<p>The first two sums vanish under refinement; the last is a weighted squared-step sum, with \(b_i^2\) known before the next Brownian increment. Its limit is \(\int b^2\,\mathrm dt\). In the shorthand of the table:</p>
\[(\mathrm dX_t)^2=(a\,\mathrm dt+b\,\mathrm dW_t)^2=b^2\,\mathrm dt.\]
<p>Apply the same Taylor-sum argument to the transformed process \(Y_t=f(t,X_t)\). Its change is \(\mathrm dY_t=\mathrm d[f(t,X_t)]\), so the lemma reads:</p>
\[\begin{aligned}
\mathrm dY_t&=\mathrm d\!\left[f(t,X_t)\right]\\
&=f_t\,\mathrm dt+f_x\,\mathrm dX_t+\tfrac12f_{xx}(\mathrm dX_t)^2\\
&=\left(f_t+af_x+\tfrac12b^2f_{xx}\right)\mathrm dt+bf_x\,\mathrm dW_t.
\end{aligned}\]
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
<p>Choose the function \(f(t,x)=e^{\theta t}(x-m)\). Following the definition in the lemma, this choice gives the transformed process:</p>
\[Y_t=f(t,X_t)=e^{\theta t}(X_t-m)=A_tU_t.\]
<p>We will apply Itô’s lemma to calculate \(\mathrm dY_t\). First differentiate the function \(f\) with respect to its ordinary inputs \(t\) and \(x\):</p>
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
<p>Integrate the simpler equation for \(Y_t\) from zero to \(t\):</p>
\[Y_t-Y_0=\sigma\int_0^t e^{\theta s}\,\mathrm dW_s.\]
<p>Now undo the definition \(Y_t=A_tU_t=e^{\theta t}U_t\). Since \(A_0=1\), the starting value is \(Y_0=U_0\), giving:</p>
\[e^{\theta t}U_t-U_0=\sigma\int_0^t e^{\theta s}\,\mathrm dW_s.\]
<p>Multiply by \(e^{-\theta t}\). For a fixed final time \(t\), that factor is constant with respect to the integration variable \(s\), so it can go inside the integral:</p>
\[\begin{aligned}
U_t&=U_0e^{-\theta t}+\sigma\int_0^t e^{-\theta t}e^{\theta s}\,\mathrm dW_s\\
&=(x_0-m)e^{-\theta t}+\sigma\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s.
\end{aligned}\]
<p>Add \(m\) back to recover the state:</p>
\[X_t=m+(x_0-m)e^{-\theta t}+\sigma\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s.\]
<p>The first two terms describe the deterministic return toward \(m\). The integral adds the random displacements, each weighted by how long ago it happened. A displacement at time \(s\) is multiplied by \(e^{-\theta(t-s)}\): older disturbances have had longer to fade under the restoring drift.</p>
<h3>Calculate the mean: average the random contribution</h3>
<p>Fix an observation time \(t\). The starting value \(x_0\), preferred level \(m\), and coefficients are known constants. Give the random integral a name so we can follow its contribution:</p>
\[\begin{aligned}
I_t&:=\int_0^t e^{-\theta(t-s)}\,\mathrm dW_s,\\
X_t&=m+(x_0-m)e^{-\theta t}+\sigma I_t.
\end{aligned}\]
<p>The expectation averages over many Brownian paths with that same starting value. To calculate \(\mathbb E[I_t]\), return to the finite sums that define the integral. Choose \(0=s_0&lt;\cdots&lt;s_n=t\), and write:</p>
\[\begin{aligned}
g_i&:=e^{-\theta(t-s_i)},\qquad \Delta s_i:=s_{i+1}-s_i,\\
\Delta W_i&:=W_{s_{i+1}}-W_{s_i},\\
I_t^{(n)}&:=\sum_{i=0}^{n-1}g_i\Delta W_i.
\end{aligned}\]
<p>Each \(g_i\) is deterministic. Each Brownian increment has \(\mathbb E[\Delta W_i]=0\), so every finite sum has mean zero:</p>
\[\mathbb E[I_t^{(n)}]=\sum_i g_i\,\mathbb E[\Delta W_i]=0.\]
<p><strong>Passing from the sums to the integral needs a convergence result.</strong> The construction of the Itô integral gives mean-square convergence: \(\mathbb E[(I_t-I_t^{(n)})^2]\to0\). This means that the expected squared approximation error vanishes. Cauchy–Schwarz then bounds the difference of the expectations:</p>
\[\left|\mathbb E[I_t]-\mathbb E[I_t^{(n)}]\right|\leq\sqrt{\mathbb E[(I_t-I_t^{(n)})^2]}\longrightarrow0.\]
<p>Since every approximating expectation is zero, \(\mathbb E[I_t]=0\). A particular path can still give a positive or negative integral. Only its average across paths vanishes. Taking the expectation of our solved OU process now gives:</p>
\[\begin{aligned}
\mathbb E[X_t]&=m+(x_0-m)e^{-\theta t}+\sigma\,\mathbb E[I_t]\\
&=m+(x_0-m)e^{-\theta t}.
\end{aligned}\]
<details class="read-more"><summary>The limiting step in the mean and second-moment calculations</summary><div>
<p>For this fixed final time, write \(g(s)=e^{-\theta(t-s)}\). Let \(g_n(s)=g(s_i)\) on each interval \([s_i,s_{i+1})\). The stochastic integral of a step function is defined by its finite weighted sum, so the approximation above can be written as:</p>
\[\begin{aligned}
I_t&=\int_0^t g(s)\,\mathrm dW_s,\\
I_t^{(n)}&=\sum_i g(s_i)\Delta W_i\\
&=\int_0^t g_n(s)\,\mathrm dW_s.
\end{aligned}\]
<p>By linearity, subtracting the two integrals gives one integral of the weight error:</p>
\[I_t-I_t^{(n)}=\int_0^t\bigl(g(s)-g_n(s)\bigr)\,\mathrm dW_s.\]
<p>Now apply the ${link('ito','integral','Itô isometry from Section 5')}. For a square-integrable integrand \(H_s\), it states:</p>
\[\mathbb E\!\left[\left(\int_0^t H_s\,\mathrm dW_s\right)^2\right]
=\mathbb E\!\left[\int_0^t H_s^2\,\mathrm ds\right].\]
<p><strong>Here choose \(H_s=g(s)-g_n(s)\).</strong> Substituting this particular integrand shows each step:</p>
\[\begin{aligned}
\mathbb E[(I_t-I_t^{(n)})^2]
&=\mathbb E\!\left[\left(\int_0^t(g(s)-g_n(s))\,\mathrm dW_s\right)^2\right]\\
&=\mathbb E\!\left[\int_0^t|g(s)-g_n(s)|^2\,\mathrm ds\right]\\
&=\int_0^t|g(s)-g_n(s)|^2\,\mathrm ds.
\end{aligned}\]
<p>The last expectation disappears because both weights are deterministic. The isometry has converted the expected squared error of a random integral into an ordinary integral of the squared weight error. We have used linearity and then the isometry; we have not exchanged a sum and an integral, or moved the square inside by algebra.</p>
<p>It remains to bound that ordinary integral. Let \(h\) be the longest partition interval. For \(\theta\geq0\), the derivative satisfies \(|g'(s)|=\theta e^{-\theta(t-s)}\leq\theta\). Throughout each interval:</p>
\[\begin{aligned}
|g(s)-g_n(s)|&=|g(s)-g(s_i)|\\
&\leq\theta|s-s_i|\leq\theta h.
\end{aligned}\]
<p>Substitute this bound into the ordinary integral:</p>
\[\begin{aligned}
\mathbb E[(I_t-I_t^{(n)})^2]
&\leq\int_0^t\theta^2h^2\,\mathrm ds\\
&=\theta^2t h^2\longrightarrow0.
\end{aligned}\]
<p>Its square root is at most \(\theta\sqrt t\,h\), which tends to zero as the grid is refined. This uses the established construction and isometry of the integral; it is a substantive step beyond calculating the expectation of one finite sum.</p>
<p>Mean-square convergence also preserves second moments. Factor the difference of squares and apply Cauchy–Schwarz again:</p>
\[\begin{aligned}
\left|\mathbb E[I_t^2]-\mathbb E[(I_t^{(n)})^2]\right|
&=\left|\mathbb E[(I_t-I_t^{(n)})(I_t+I_t^{(n)})]\right|\\
&\leq\sqrt{\mathbb E[(I_t-I_t^{(n)})^2]}\sqrt{\mathbb E[(I_t+I_t^{(n)})^2]}\longrightarrow0.
\end{aligned}\]
<p>The first factor tends to zero, and the second stays bounded because the approximations converge in mean square. This justifies the second-moment limit used below.</p>
</div></details>
<h3>Calculate the variance: add the squared weights</h3>
<p>Variance is the expected squared distance from the mean. Subtract the mean we just calculated; the deterministic terms cancel:</p>
\[\begin{aligned}
X_t-\mathbb E[X_t]&=\sigma I_t,\\
\operatorname{Var}(X_t)&=\sigma^2\mathbb E[I_t^2].
\end{aligned}\]
<p>Calculate that second moment on the same finite sum first. Squaring a sum produces its squared terms and its cross terms:</p>
\[\begin{aligned}
\mathbb E[(I_t^{(n)})^2]&=\sum_i g_i^2\mathbb E[(\Delta W_i)^2]\\
&\quad+2\sum_{i&lt;j}g_i g_j\,\mathbb E[\Delta W_i\Delta W_j].
\end{aligned}\]
<p>For different intervals, the Brownian increments are independent and have mean zero. Therefore \(\mathbb E[\Delta W_i\Delta W_j]=\mathbb E[\Delta W_i]\mathbb E[\Delta W_j]=0\). Each squared term has \(\mathbb E[(\Delta W_i)^2]=\Delta s_i\), its interval's duration. The result is:</p>
\[\mathbb E[(I_t^{(n)})^2]=\sum_i e^{-2\theta(t-s_i)}\Delta s_i.\]
<p>This is an ordinary Riemann sum. Refining the grid gives the integral of the squared weight, and mean-square convergence carries the second moment to the limit. This is the deterministic-weight case of Itô's isometry:</p>
\[\begin{aligned}
\mathbb E[I_t^2]&=\int_0^t e^{-2\theta(t-s)}\,\mathrm ds,\\
\operatorname{Var}(X_t)&=\sigma^2\int_0^t e^{-2\theta(t-s)}\,\mathrm ds.
\end{aligned}\]
<p>Evaluate this ordinary integral by putting \(r=t-s\), the time elapsed since a disturbance. As \(s\) runs from zero to \(t\), \(r\) runs from \(t\) down to zero, and \(\mathrm ds=-\mathrm dr\):</p>
\[\begin{aligned}
\operatorname{Var}(X_t)&=\sigma^2\int_t^0 e^{-2\theta r}(-\mathrm dr)=\sigma^2\int_0^t e^{-2\theta r}\,\mathrm dr\\
&=\sigma^2\left[-\frac{e^{-2\theta r}}{2\theta}\right]_0^t\\
&=\sigma^2\left(-\frac{e^{-2\theta t}}{2\theta}+\frac1{2\theta}\right)\\
&=\frac{\sigma^2}{2\theta}(1-e^{-2\theta t}).
\end{aligned}\]
<p>As time grows, the mean approaches \(m\), and the variance approaches \(\sigma^2/(2\theta)\). New noise keeps arriving while older disturbances fade. Individual paths continue to fluctuate when \(\sigma>0\); the restoring drift limits their spread.</p>
<p>If \(\sigma=0\), the variance is zero and only the deterministic return remains. If \(\theta=0\), use the integral expression directly: every weight is one, \(X_t=x_0+\sigma W_t\), and \(\operatorname{Var}(X_t)=\sigma^2t\). The displayed quotient assumes \(\theta>0\).</p>
<p>With a known starting value, the weighted Gaussian increments also give a Gaussian OU distribution. Its symmetry makes the mean a median too. In the next model, taking an exponential will reshape the distribution, and those two summaries will separate.</p>
<p>The experiment below fixes \(m=0\) and lets you choose \(x_0\). The mean returns toward zero while individual paths wander around it. The variance starts at zero because all paths share the same known starting value, then grows toward a plateau. Increase \(\theta\) to strengthen restoration, or set it to zero to recover free diffusion.</p>

` + demos.sde + prose`
${h('gbm','Multiplicative noise: geometric Brownian motion')}
<p>Imagine a positive quantity whose changes are naturally expressed as percentages, such as a simplified asset value. If the current value doubles, the same percentage move produces twice the absolute change. Both its trend and its random disturbances can therefore scale with its current size.</p>
<p><em>Geometric Brownian motion (GBM)</em> models that proportional change using Brownian noise. The OU model pulled toward a preferred level with a fixed absolute noise amplitude. GBM has proportional drift and proportional noise, and its positive starting value stays positive under the model:</p>
\[\begin{aligned}
\mathrm dS_t&=\mu S_t\,\mathrm dt+\sigma S_t\,\mathrm dW_t,\\
S_0&>0,\qquad \sigma\geq0.
\end{aligned}\]
<p>Here \(S_t\) is the value, \(\mu\) is its constant relative drift rate, and \(\sigma\) is its relative noise amplitude, often called volatility. Dividing by the current value exposes the local percentage-change rule:</p>
\[\begin{aligned}
\frac{\mathrm dS_t}{S_t}&=\mu\,\mathrm dt+\sigma\,\mathrm dW_t,\\
\frac{\Delta S_t}{S_t}&\approx\mu h+\sigma\sqrt h\,Z,\qquad Z\sim\mathcal N(0,1).
\end{aligned}\]
<p>Over a short interval \(h\), the relative change has approximate mean \(\mu h\) and standard deviation \(\sigma\sqrt h\). The absolute random change has standard deviation approximately \(\sigma S_t\sqrt h\). There is no preferred level \(m\) pulling the value back. Constant coefficients and continuous paths make this an idealized model.</p>
<h3>Use a logarithm to turn proportional changes into additive changes</h3>
<p>A logarithm turns multiplication into addition, which suggests the transformation. For this example choose \(f(t,x)=\log x\) on \(x>0\), and define its value along \(S_t\):</p>
\[\begin{aligned}
Y_t&=f(t,S_t)=\log S_t,\\
f_t&=0,\qquad f_x=\frac1x,\qquad f_{xx}=-\frac1{x^2}.
\end{aligned}\]
<p>Apply the same Itô lemma, using \(S_t\) as the state. Its squared differential is \((\mathrm dS_t)^2=\sigma^2S_t^2\,\mathrm dt\), so:</p>
\[\begin{aligned}
\mathrm dY_t&=\mathrm d[\log S_t]\\
&=\frac1{S_t}\,\mathrm dS_t-\frac1{2S_t^2}(\mathrm dS_t)^2\\
&=\mu\,\mathrm dt+\sigma\,\mathrm dW_t-\frac12\sigma^2\,\mathrm dt\\
&=\left(\mu-\frac{\sigma^2}{2}\right)\mathrm dt+\sigma\,\mathrm dW_t.
\end{aligned}\]
<p>The equation for the log-value now has constant coefficients, just like our first solved example. Itô's lemma supplied this transformed equation. Integrate it, then exponentiate to recover \(S_t\):</p>
\[\begin{aligned}
Y_t-Y_0=\log S_t-\log S_0&=\left(\mu-\frac{\sigma^2}{2}\right)t+\sigma W_t,\\
S_t&=S_0\exp\!\left[\left(\mu-\frac{\sigma^2}{2}\right)t+\sigma W_t\right].
\end{aligned}\]
<p>This exponential form explains the word “geometric”: additive changes in the log-value become multiplicative changes in the value. It also shows why \(S_t\) stays positive when \(S_0>0\).</p>
${h('volatility-drag','Read the GBM solution: mean and median')}
<p>We have a formula for each path. As with OU, the next step is to interpret its distribution at an observation time \(t\). Since \(W_t\sim\mathcal N(0,t)\), the log-value is Gaussian:</p>
\[\log S_t\sim\mathcal N\!\left(\log S_0+\left(\mu-\frac{\sigma^2}{2}\right)t,\ \sigma^2t\right).\]
<p>A positive variable with a Gaussian logarithm is called <em>lognormal</em>. For positive noise at positive time, its distribution is skewed toward large values. The mean averages the values across repeated runs; the median marks the halfway point in probability. Large outcomes can raise the average even when more than half of the outcomes lie below it.</p>
<h3>Calculate the mean by averaging the exponential noise</h3>
<p>At a fixed time, take the deterministic factors outside the expectation. The exponential of the Brownian term remains inside:</p>
\[\mathbb E[S_t]=S_0e^{(\mu-\sigma^2/2)t}\,\mathbb E[e^{\sigma W_t}].\]
<p>A zero-mean Brownian value does not make this exponential factor average to one. The Gaussian exponential moment is \(\mathbb E[e^{\sigma W_t}]=e^{\sigma^2t/2}\). Substituting it cancels the negative half-variance term:</p>
\[\begin{aligned}
\mathbb E[S_t]&=S_0e^{(\mu-\sigma^2/2)t}e^{\sigma^2t/2}\\
&=S_0e^{\mu t}.
\end{aligned}\]
<details class="read-more"><summary>The Gaussian exponential moment</summary><div>
<p>Write \(W_t=\sqrt t\,Z\), where \(Z\sim\mathcal N(0,1)\), and put \(c=\sigma\sqrt t\). Complete the square in the Gaussian density:</p>
\[\begin{aligned}
\mathbb E[e^{cZ}]&=\frac1{\sqrt{2\pi}}\int_{-\infty}^{\infty}e^{cz-z^2/2}\,\mathrm dz\\
&=e^{c^2/2}\frac1{\sqrt{2\pi}}\int_{-\infty}^{\infty}e^{-(z-c)^2/2}\,\mathrm dz\\
&=e^{c^2/2}.
\end{aligned}\]
<p>The remaining integral is a normal density with mean \(c\), so it integrates to one. Taking \(c=\sigma\sqrt t\) gives the factor used above.</p>
</div></details>
<h3>Calculate the median from the halfway probability</h3>
<p>For \(t>0\) and \(\sigma>0\), Brownian symmetry gives \(\mathbb P(W_t\leq0)=1/2\). The exponential is strictly increasing, so values below the zero-noise term inside the exponential correspond exactly to Brownian values below zero:</p>
\[\begin{aligned}
&\mathbb P\!\left(S_t\leq S_0e^{(\mu-\sigma^2/2)t}\right)\\
&\quad=\mathbb P(\sigma W_t\leq0)=\frac12.
\end{aligned}\]
<p>That identifies the median directly:</p>
\[\operatorname{median}(S_t)=S_0e^{(\mu-\sigma^2/2)t}.\]
<p>At each observation time, half the values lie below this level and half above it. This calculation follows the middle probability through an increasing transformation. The mean required averaging the exponential itself. With zero noise, both summaries reduce to the same deterministic value \(S_0e^{\mu t}\); at \(t=0\), both equal \(S_0\).</p>
<h3>Connect the two summaries to the plotted growth</h3>
<p>The mean grows at exponential rate \(\mu\); the median grows at rate \(\mu-\sigma^2/2\). When \(0&lt;\mu&lt;\sigma^2/2\), the mean rises while the median falls. This is a consequence of the distribution's asymmetry and explains why the average alone can give an incomplete description of the model's outcomes.</p>
<p><strong>Interpreting an investment projection.</strong> GBM is used as a simple model of asset prices with proportional random changes. Under the condition just described, expected wealth grows even though more than half the possible outcomes finish below the initial investment: large gains in the upper tail lift the average. A high expected value therefore does not imply a high chance of making a gain. The median locates the middle outcome; assessing a particular goal also requires the probability of a loss or of reaching a target. These are implications of the model, whose assumptions must be assessed for the asset being studied.</p>
<p>In the experiment below, the coral curve is the exact mean and the dashed teal curve is the exact median. Hold \(\mu\) fixed and increase \(\sigma\): the mean curve stays fixed, while the median moves downward. Set \(\sigma=0\), and the summaries and all sample paths coincide.</p>
<p>Each curve is a summary at successive observation times. Neither is a selected random path. The vertical axis is logarithmic, with ticks labelled in the original \(S\) units: the coral curve shows the mean of \(S_t\), not the mean of \(\log S_t\). These summaries complete our interpretation of the solved GBM model before we move on to numerical approximations.</p>

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
