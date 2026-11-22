import { prose, h, check, link, note } from './helpers.js';

export const stratonovich = demos => prose`
${h('endpoint-choice','From smooth forcing to symmetric accumulation')}
<p>Section 6 chose the noise coefficient before each next Brownian increment. Now consider another starting point: an ordinary differential equation responding continuously to a smooth, rapidly varying driving signal. As the signal becomes rougher, which stochastic equation retains that response?</p>
<p>Start with a smooth signal \(w(t)\). Ordinary calculus gives:</p>
\[\int_0^T w(t)\,\mathrm dw(t)=\frac12\bigl(w(T)^2-w(0)^2\bigr).\]
<p>Join successive Brownian readings \(W_i\) and \(W_{i+1}\) with a straight segment. Along that segment, the signal changes continuously, so its ordinary integral uses the average of the endpoint values:</p>
\[\begin{aligned}
\text{segment contribution}
&=\frac{W_i+W_{i+1}}2\,(W_{i+1}-W_i)\\
&=\left(W_i+\frac12\Delta W_i\right)\Delta W_i.
\end{aligned}\]
<p>This suggests <em>symmetric accumulation</em>: include the multiplier's change during the increment, rather than freeze it at the start. Its Brownian limit is the <em>Stratonovich integral</em>, written \(\circ\,\mathrm dW\). The evaluation rule changes the multiplier used for each contribution; the integration bounds remain \(0\) and \(T\).</p>
<details class="read-more"><summary>From smooth driving signals to the Wong–Zakai limit</summary><div>
<p>Let \(W^\varepsilon\) be standard piecewise-linear approximations to Brownian motion, and solve an ordinary equation before taking the limit:</p>
\[\dot x^\varepsilon=\widetilde a(x^\varepsilon)+b(x^\varepsilon)\dot W^\varepsilon.\]
<p>Under suitable coefficient regularity and convergence assumptions, the limiting equation is \(\mathrm dX=\widetilde a(X)\,\mathrm dt+b(X)\circ\mathrm dW\). This is the classical <em>Wong–Zakai</em> connection. It motivates a continuously responding system's equation without treating the noise coefficient as frozen over each segment.</p>
<p>The approximation mechanism matters, especially with several driving signals. A physical noise source does not universally select one convention. <a href="https://arxiv.org/abs/1403.7281" target="_blank" rel="noopener noreferrer">Kelly and Melbourne, <cite>Smooth approximation of stochastic differential equations</cite></a>, discuss the assumptions and extensions.</p>
</div></details>

${h('integral-conversion','The Brownian correction survives')}
<p>On the same step, compare Itô's left-value contribution with the symmetric contribution. Their difference is a squared increment:</p>
\[\begin{aligned}
\text{left contribution}&=W_i\Delta W_i,\\
\text{symmetric contribution}&=\left(W_i+\frac12\Delta W_i\right)\Delta W_i,\\
\text{difference}&=\frac12(\Delta W_i)^2.
\end{aligned}\]
<p>For a smooth path, the sum of squared increments vanishes as the grid is refined. For Brownian motion, Section 5 showed that \(Q_n:=\sum_i(\Delta W_i)^2\to T\) in mean square. Thus the accumulated difference approaches \(T/2\), even though each step becomes tiny.</p>
<p>With \(W_0=0\), the symmetric terms telescope to \(W_T^2/2\). The two limits are therefore:</p>
\[\begin{aligned}
\int_0^T W_t\,\mathrm dW_t&=\frac12(W_T^2-T),\\
\int_0^T W_t\circ\mathrm dW_t&=\frac12W_T^2.
\end{aligned}\]
<p>The circle records a different accumulation rule on the same Brownian path. The symmetric rule retains the term that makes the ordinary chain rule work. It does not describe a trader choosing a holding with knowledge of the next price change.</p>
` + demos.convention + prose`
<p>In the first plot, inspect the Brownian driving path. In the second, teal accumulates the left-value contributions and coral the symmetric contributions. Their terminal gap is exactly \(Q_n/2\) on this finite grid; its Brownian limit is \(T/2\). New sample changes the driver while preserving that identity.</p>
<details class="read-more"><summary>The symmetric definition and its chain rule</summary><div>
<p>A <em>partition</em> \(\pi=\{t_0,\ldots,t_n\}\) divides the time interval into steps, with \(0=t_0&lt;\cdots&lt;t_n=T\). Its <em>mesh</em> \(|\pi|\) is the length of the longest step.</p>
\[|\pi|=\max_{0\leq i&lt;n}(t_{i+1}-t_i).\]
<p>For example, the grid \(\{0,0.2,0.7,1\}\) has a mesh of \(0.5\), the length of the interval from \(0.2\) to \(0.7\). Taking \(|\pi|\to0\) means refining the grid so that even its longest interval tends to zero. The steps may have different lengths.</p>
<p>For continuous semimartingales and suitable integrability, the Stratonovich integral is the limit in probability of symmetric integrand-endpoint sums:</p>
\[\int_0^T H_t\circ\mathrm dW_t
=\lim_{|\pi|\to0}\sum_i\frac{H_{t_i}+H_{t_{i+1}}}{2}\Delta W_i.\]
<p>For a smooth state-dependent integrand, evaluating it at the average of the endpoint states gives the same limit in the setting considered here. Neither expression says that the actual Brownian path follows the straight segment between its readings.</p>
<p>For a smooth function \(f(t,x)\) of a continuous diffusion \(X_t\), the symmetric contribution absorbs Itô's curvature correction, giving:</p>
\[\mathrm d[f(t,X_t)]=f_t(t,X_t)\,\mathrm dt+f_x(t,X_t)\circ\mathrm dX_t.\]
<p>This is the ordinary chain rule in Stratonovich notation. The quadratic variation is still present; it is included in the symmetric integral rather than written as a separate second-derivative term.</p>
</div></details>

${h('chain-rule','Translate the equation, preserve the process')}
<p>Different integral values do not prevent equivalent descriptions of one process. The drift must compensate for the change in accumulation. Return to Section 6's multiplicative model, with constants \(\mu,\sigma\) and the same positive starting value \(X_0\).</p>
<div class="table-wrap"><table><thead><tr><th>Equation with the same written drift</th><th>Solution</th></tr></thead><tbody>
<tr><td>Itô: \(\mathrm dX=\mu X\,\mathrm dt+\sigma X\,\mathrm dW\)</td><td>\(X_t=X_0e^{(\mu-\sigma^2/2)t+\sigma W_t}\)</td></tr>
<tr><td>Stratonovich: \(\mathrm dX=\mu X\,\mathrm dt+\sigma X\circ\mathrm dW\)</td><td>\(X_t=X_0e^{\mu t+\sigma W_t}\)</td></tr>
</tbody></table></div>
<p>The second solution follows by applying the ordinary chain rule to \(\log X\), integrating, then exponentiating. It differs from the first solution. To preserve the first process, subtract \(\sigma^2X/2\) from the Stratonovich drift:</p>
\[\begin{aligned}
\mathrm dX&=\mu X\,\mathrm dt+\sigma X\,\mathrm dW
&&\text{(Itô)},\\
\mathrm dX&=\left(\mu-\frac{\sigma^2}{2}\right)X\,\mathrm dt+\sigma X\circ\mathrm dW
&&\text{(Stratonovich)}.
\end{aligned}\]
<p>These descriptions produce the same path for the same Brownian driver. As with Newtonian, Lagrangian and Hamiltonian mechanics, equivalent formulations can expose different useful structures. Here, changing the integral convention requires translating the drift as well.</p>
` + demos.conversion + prose`
<p>Increase the noise amplitude. Teal is the Itô solution; dashed coral is its converted Stratonovich description, which stays on top of it. Blue keeps the original written drift while changing the convention, so it describes another process. At zero noise, all three coincide.</p>
<details class="read-more"><summary>Derive the scalar drift correction</summary><div>
<p>Write the scalar Stratonovich equation as \(\mathrm dX=a_{\mathrm S}(t,X)\,\mathrm dt+b(t,X)\circ\mathrm dW\). Across one interval, expand the symmetric noise multiplier about its left value. To leading order, its extra contribution is:</p>
\[\frac12\,\partial_xb(t_i,X_i)\,\Delta X_i\,\Delta W_i.\]
<p>The stochastic part of \(\Delta X_i\) is \(b(t_i,X_i)\Delta W_i\). Its product with \(\Delta W_i\) survives summation through Brownian squared increments; drift–noise products vanish. Under the usual smoothness and localization assumptions, the correction is \(\tfrac12\int b\,\partial_xb\,\mathrm dt\).</p>
\[a_{\mathrm I}(t,x)=a_{\mathrm S}(t,x)+\frac12b(t,x)\partial_xb(t,x).\]
<p>Here \(a_{\mathrm I}\) is the Itô drift and \(a_{\mathrm S}\) the Stratonovich drift. For \(b(t,x)=\sigma x\), their difference is \(\sigma^2x/2\). For additive noise \(b=b(t)\), the spatial derivative is zero. Several state variables or Brownian drivers require the appropriate vector-field correction, not a copied scalar formula. See <a href="https://www.math.uh.edu/~sanders/Math3338/LawrenceEvans-SDE-course.pdf" target="_blank" rel="noopener noreferrer">Evans, pp. 111–115</a>.</p>
</div></details>

${h('physical-applications','Choose the form that fits the calculation')}
<p>Once the model is specified, either convention can describe it after conversion. Itô form is convenient when the coefficient is chosen using current information: its Brownian integral has mean zero under square-integrability, and the isometry supports variance calculations. Those are the tools used for OU in Section 6.</p>
<p>Stratonovich form is convenient when deriving a model from suitable smooth driving signals or changing coordinates: the usual chain rule keeps that structure visible. This does not remove noise-induced drift effects; conversion makes them explicit in Itô form.</p>
<p>Section 6 already contains the distinction. OU has constant noise coefficient \(b=\sigma\), so changing convention leaves its drift unchanged. GBM has \(b=\sigma x\), so its equivalent descriptions differ by \(\sigma^2x/2\). The system's mechanism determines the model; the preferred form then depends on the calculation.</p>
<details class="read-more"><summary>Optional applications: coordinates, control and varying diffusivity</summary><div>
<p>A coordinate change can preserve a useful expression for a model. For a scalar controlled equation, with control input \(u_t\):</p>
\[\begin{aligned}
\mathrm dX&=(aX+u_t)\,\mathrm dt+\sigma X\circ\mathrm dW,\\
\mathrm d(X^2)&=(2aX^2+2Xu_t)\,\mathrm dt+2\sigma X^2\circ\mathrm dW.
\end{aligned}\]
<p>The equivalent Itô drift is \((a+\sigma^2/2)X+u_t\); Itô's formula gives the same evolution of \(X^2\). A convenient expression does not itself supply a stabilizing control.</p>
<p>For a second application, suppose a concentration density \(p(t,x)\) is intended to obey Fick's law with positive position-dependent diffusivity \(D(x)\):</p>
\[\partial_tp=\partial_x(D\,\partial_xp).\]
<p>The density equation shows that its scalar Itô representation has \(b=\sqrt{2D}\) and drift \(a_{\mathrm I}=D'\). Since \(b\,b'=D'\), the same model has Stratonovich drift \(D'/2\). In the right-endpoint convention introduced next, its written drift is zero. The desired transport law is the premise here; not every heterogeneous medium must follow it.</p>
</div></details>

${h('lambda-family','Beyond two conventions: the λ-family')}
<p>Itô and Stratonovich cover two important accumulation rules, but some effective models need intermediate corrections. In a noisy electrical circuit, researchers varied the relation between the noise's correlation time—how long a fluctuation remains related to its past—and the feedback delay—how long the circuit takes to respond. They observed a continuous transition from Stratonovich toward Itô behavior, passing through intermediate conventions. <a href="https://doi.org/10.1038/ncomms3733" target="_blank" rel="noopener noreferrer">Pesce and colleagues, <cite>Stratonovich-to-Itô transition in noisy systems with multiplicative feedback</cite> (2013)</a>.</p>
<p>The <em>\(\lambda\)-family</em> provides one scalar notation for such rules. For our linear example, use \(W_i+\lambda\Delta W_i\) as the multiplier. Itô is \(\lambda=0\), Stratonovich is \(\lambda=1/2\), and the right-endpoint or Hänggi–Klimontovich convention is \(\lambda=1\).</p>
\[\begin{aligned}
I_{\lambda,n}
&=\sum_i(W_i+\lambda\Delta W_i)\Delta W_i\\
&=\frac12W_T^2+\left(\lambda-\frac12\right)Q_n,\\
I_\lambda&=\frac12W_T^2+\left(\lambda-\frac12\right)T.
\end{aligned}\]
<p>The first identity is exact on the finite grid; the second expression is its mean-square limit. Since \(\mathbb E[W_T^2]=T\), its expectation is \(\mathbb E[I_\lambda]=\lambda T\). This family changes the integral on a fixed path. To preserve an SDE's process, compensate its drift.</p>
` + demos.lambda + prose`
<p>Start with the Itô and Stratonovich presets, then move the slider between them and toward the right endpoint. Teal is the finite sum; dashed coral is its limiting expression; the dotted blue reference is \(W_t^2/2\). The second plot compares the sample mean with the exact expectation \(\lambda T\). This is a mathematical illustration, not a simulation or fit of the circuit experiment.</p>
<details class="read-more"><summary>General multipliers, conversion and the λ-chain rule</summary><div>
<p>For a scalar diffusion \(X\) with smooth coefficients and a sufficiently smooth function \(g\), define the state-interpolated rule:</p>
\[\begin{aligned}
&\int_0^T g(X_t)\diamond_\lambda\mathrm dW_t\\
&\quad=\lim_{|\pi|\to0}\sum_i g(X_i+\lambda\Delta X_i)\Delta W_i.
\end{aligned}\]
<p>The symbol \(\diamond_\lambda\) labels the convention. Here \(\lambda\) interpolates between endpoint states; it does not select the actual Brownian reading at physical time \(t_i+\lambda\Delta t_i\). For smooth \(g\), the midpoint-state rule has the same limit as the symmetric integrand-endpoint definition.</p>
<p>If \(X\) has noise coefficient \(b(t,X_t)\), Taylor expansion about the left state gives:</p>
\[\begin{aligned}
g(X_i+\lambda\Delta X_i)\Delta W_i
&=g(X_i)\Delta W_i\\
&\quad+\lambda g'(X_i)\Delta X_i\Delta W_i+\text{remainder}.
\end{aligned}\]
<p>The surviving squared-increment sum comes from \(\Delta X_i\Delta W_i\approx b(t_i,X_i)(\Delta W_i)^2\). Under suitable smoothness, moment and localization assumptions, the remainder vanishes in probability, yielding:</p>
\[\begin{aligned}
\int_0^Tg(X_t)\diamond_\lambda\mathrm dW_t
&=\int_0^Tg(X_t)\,\mathrm dW_t\\
&\quad+\lambda\int_0^Tg'(X_t)b(t,X_t)\,\mathrm dt.
\end{aligned}\]
<p>Putting \(g=b\), with any time dependence evaluated at the same time, gives the equivalent scalar drift:</p>
\[\begin{aligned}
a_{\mathrm I}&=a_\lambda+\lambda b\,\partial_xb,\\
a_{\lambda_1}-a_{\lambda_2}
&=(\lambda_2-\lambda_1)b\,\partial_xb.
\end{aligned}\]
<p>For a smooth \(f(t,x)\), the matching chain rule is:</p>
\[\begin{aligned}
\mathrm d[f(t,X_t)]
&=\left(f_t+\left(\frac12-\lambda\right)b^2f_{xx}\right)\mathrm dt\\
&\quad+f_x\diamond_\lambda\mathrm dX_t.
\end{aligned}\]
<p>For a fixed process, changing \(\lambda\) and its drift together is a translation. Relative to a specified underlying drift, a parameter inferred from a microscopic limit can instead encode a noise-induced correction. An unconstrained drift and \(\lambda\) cannot be identified separately from this scalar effective equation alone.</p>
</div></details>

${h('midpoint-methods','Make the numerical method match the model')}
<p>Section 6 used Euler–Maruyama, which evaluates coefficients at the beginning of each step and targets the Itô equation. Giving it an unconverted Stratonovich drift generally simulates a different model.</p>
<p>For the equivalent multiplicative equations above, use the Itô drift \(\mu X\) with Euler–Maruyama. A suitable Stratonovich method instead uses the drift \((\mu-\sigma^2/2)X\). The convention, coefficients and numerical method must describe the same equation.</p>
<details class="read-more"><summary>Scalar midpoint and Heun steps</summary><div>
<p>For a scalar Stratonovich equation with drift \(\widetilde a\) and noise coefficient \(b\), an implicit midpoint step uses the average of the starting and ending states:</p>
\[\begin{aligned}
X_{n+1}&=X_n+\widetilde a\!\left(\frac{X_n+X_{n+1}}2\right)\Delta t\\
&\quad+b\!\left(\frac{X_n+X_{n+1}}2\right)\Delta W_n.
\end{aligned}\]
<p>It is implicit because the unknown endpoint appears on both sides. A common explicit Heun predictor–corrector first predicts an endpoint, then averages coefficients using that prediction. Both stages use the same noise increment:</p>
\[\begin{aligned}
\widehat X&=X_n+\widetilde a(X_n)\Delta t+b(X_n)\Delta W_n,\\
X_{n+1}&=X_n+\frac{\widetilde a(X_n)+\widetilde a(\widehat X)}2\Delta t\\
&\quad+\frac{b(X_n)+b(\widehat X)}2\Delta W_n.
\end{aligned}\]
<p>These illustrative scalar schemes require suitable coefficient assumptions. A midpoint label does not guarantee stability for every stiff problem. Converting the equation to Itô form before using an appropriate Itô method is another valid route.</p>
</div></details>

${h('comparison','One model, several descriptions')}
<p>The symmetric rule arises naturally from suitable smooth-driver limits. Brownian squared increments explain its difference from left accumulation. Adjusting the drift lets both conventions describe the same process; the general family extends that translation when other effective corrections are useful.</p>
<details class="read-more"><summary>Compare the three named conventions</summary><div>
<div class="table-wrap"><table><thead><tr><th>Convention</th><th>\(\lambda\)</th><th>\(\int_0^T W_t\diamond_\lambda\mathrm dW_t\)</th><th>Expected value</th></tr></thead><tbody>
<tr><td>Itô</td><td>\(0\)</td><td>\((W_T^2-T)/2\)</td><td>\(0\)</td></tr>
<tr><td>Stratonovich</td><td>\(1/2\)</td><td>\(W_T^2/2\)</td><td>\(T/2\)</td></tr>
<tr><td>Right endpoint</td><td>\(1\)</td><td>\((W_T^2+T)/2\)</td><td>\(T\)</td></tr>
</tbody></table></div>
<p>For an adapted, square-integrable integrand, the Itô integral's future increment has conditional mean zero. Its running total is a <em>martingale</em>: given current information, its best prediction is its current value. The other conventions do not generally share that property.</p>
</div></details>
<p>Throughout this chapter the driving noise remained Brownian. Section 8 keeps that continuous Brownian motion and adds events that can change the state instantly.</p>
` + check('Does changing the circle symbol preserve the process?',String.raw`Only after the drift is converted too. For scalar smooth coefficients, \(a_{\mathrm I}=a_{\mathrm S}+\tfrac12b\,\partial_xb\). Additive noise has \(\partial_xb=0\), so this correction vanishes.`);


export const beyond = demos => prose`
${h('continuous-noise','What happens when a valve opens?')}
<p>A pressure sensor reads \(1.00\) at noon. While the valve is closed, the pressure wanders up and down. When the valve opens, pressure drops so rapidly that, on the sensor’s time scale, we model the drop as instantaneous. The fluctuations continue from the new level. How can we describe both kinds of motion with one equation?</p>

${h('jumps','Watch a jump change the path')}
<p>The two curves below share the same Brownian fluctuations. One also receives sudden changes called <em>jumps</em>. Set the event rate to zero to see the curves coincide. Then raise the rate and follow the solid curve through its first vertical step. What happens to the gap between the curves after that step?</p>
` + demos.jumps + prose`
<p>Until the next event, both curves move by the same amount and the gap stays fixed. The demo lets jumps go up or down, each with equal probability. The jump size control sets the height of each step. The rate \(\lambda\) sets how often steps occur on average. At a rate of three per time unit, you expect six events over the two units shown.</p>
<details class="read-more"><summary>Poisson event counts over a short interval</summary><div>
<p>Over an interval of length \(h\), the event count \(\Delta N\) has a Poisson distribution with mean \(\lambda h\). The probabilities of zero and one event come from that distribution. Subtract both from one to get the probability of two or more.</p>
\[\begin{aligned}
\mathbb P(\Delta N=0)&=e^{-\lambda h},\\
\mathbb P(\Delta N=1)&=e^{-\lambda h}\lambda h,\\
\mathbb P(\Delta N\geq2)&=1-e^{-\lambda h}(1+\lambda h).
\end{aligned}\]
<p>For \(\lambda=3\) and \(h=0.1\), the mean count is \(0.3\). The probabilities of zero, one, and at least two events are about \(74.1\%\), \(22.2\%\), and \(3.7\%\), respectively. As \(h\) shrinks, the probability of one event is \(\lambda h+O(h^2)\) and the probability of at least two is \(O(h^2)\).</p>
<p>The chance that the next event is more than \(h\) time units away is the chance of zero events during those \(h\) units, \(e^{-\lambda h}\). This is the tail probability of an exponential waiting time. The simulator samples successive waiting times this way to place the jumps along the path.</p>
</div></details>

${h('jump-equation','Write the pressure equation')}
<p>For the valve, use a simpler jump rule. Each opening drops pressure by \(0.60\). Let \(X_t\) be the pressure \(t\) minutes after noon. With zero drift, the continuous change from Chapter 6 is \(\sigma\,\mathrm dW_t\), where \(\sigma\) sets the size of the Brownian fluctuations.</p>
<p>We also need to record when each drop occurs. Let \(N_t\) count valve openings since noon. Between readings at \(a\) and \(b\), the increment \(N_b-N_a\) counts the openings during that interval. In the SDE, \(\mathrm dN_t\) records these increments at the event times. It contributes zero between openings and one at each opening. Multiplying by \(-0.60\) gives the corresponding pressure change.</p>
\[\mathrm dX_t=\underbrace{\sigma\,\mathrm dW_t}_{\text{continuous fluctuation}}-\underbrace{0.60\,\mathrm dN_t}_{\text{drop at each opening}}.\]

${h('jump-solution','Solve the equation and follow one minute')}
<p>Add the changes from noon to time \(t\). The Brownian increments sum to \(W_t-W_0\), and the count increments sum to \(N_t-N_0\). With \(W_0=N_0=0\) and initial pressure \(X_0=1.00\), this gives the pressure at any time along a sample path.</p>
\[X_t=1.00+\sigma W_t-0.60\,N_t.\]
<p>Follow one possible minute. The Brownian changes in the table are in pressure units, so they already include the factor \(\sigma\).</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Time</th><th scope="col">Change</th><th scope="col">Pressure</th></tr></thead><tbody>
<tr><td>Noon</td><td>Starting reading</td><td>1.00</td></tr>
<tr><td>Just before opening</td><td>Brownian fluctuations add 0.04</td><td>1.04</td></tr>
<tr><td>At the opening</td><td>The count rises to one. Pressure drops by 0.60.</td><td>0.44</td></tr>
<tr><td>One minute after noon</td><td>Brownian fluctuations add another 0.06</td><td>0.50</td></tr>
</tbody></table></div>
<p>At the instant of opening, the Brownian path is continuous. The vertical drop comes entirely from the valve. Across the whole minute, the Brownian movement adds \(0.04+0.06=0.10\), and the valve subtracts \(0.60\). The solution gives \(X_1=1.00+0.10-0.60=0.50\).</p>
<p>Return to the demo. If event \(j\) moves the state by a signed amount \(J_j\), replace the fixed drops by the sum of the jumps so far. This gives the demo’s two curves, the baseline \(X_0+\sigma W_t\) and the jump diffusion</p>
\[X_t=X_0+\sigma W_t+\sum_{j=1}^{N_t}J_j.\]
<p>The sum is exactly the gap you saw between the curves. A constant drift \(\mu\) would add \(\mu t\) to both.</p>

<details class="read-more"><summary data-section="learn-event-dynamics">Use a valve log to estimate the Brownian noise level</summary><div>
<p>Now work backward from the two sensor readings. The observed change was \(0.50-1.00=-0.50\). If the valve log independently records a jump of \(-0.60\), subtract it to recover the Brownian contribution over the minute, \(-0.50-(-0.60)=+0.10\). Minute 2 below is the minute we just followed.</p>
<div class="table-wrap"><table><caption>Three illustrative minutes, in pressure units</caption><thead><tr><th scope="col">Minute</th><th scope="col">Observed change</th><th scope="col">Sum of logged jumps</th><th scope="col">Brownian change</th></tr></thead><tbody><tr><td>1</td><td>+0.10</td><td>0</td><td>+0.10</td></tr><tr><td>2</td><td>−0.50</td><td>−0.60</td><td>+0.10</td></tr><tr><td>3</td><td>−0.10</td><td>0</td><td>−0.10</td></tr></tbody></table></div>
<p>With time measured in minutes, a one-minute Brownian increment has mean zero and variance one. The expected square of \(\sigma\,\Delta W\) is therefore \(\sigma^2\). To estimate \(\sigma\), average the squared changes in the last column and take the square root.</p>
\[\widehat{\sigma}=\sqrt{\frac{0.10^2+0.10^2+(-0.10)^2}{3}}=0.10.\]
<p>Using the observed changes directly would give \(0.30\), because the estimate would include the valve drop. For a future minute with no jump, the two calculations give standard deviations of \(0.10\) using the log and \(0.30\) using the raw readings. These three minutes illustrate the arithmetic. A longer log would let us check the forecast against later readings.</p>
</div></details>
<details class="read-more"><summary>If the jump is hidden, how much evidence is there that one happened?</summary><div>
<p>Suppose the valve log is missing for the minute when pressure fell from \(1.00\) to \(0.50\). Earlier records give us a one-minute Brownian standard deviation of \(0.10\). For this example, assume zero drift, at most one opening in the minute, and a drop of \(0.60\) whenever the valve opens. The Brownian fluctuations are independent of the opening.</p>
<p>If the valve stayed closed, Brownian motion alone had to produce \(-0.50\), a fall of five standard deviations. If the valve opened, Brownian motion had to contribute \(-0.50-(-0.60)=+0.10\), a rise of one standard deviation. Both explanations fit the endpoints. Which gives more weight to readings near the change we saw?</p>
<p>For a normal distribution, the density at \(z\) standard deviations from the mean is proportional to \(e^{-z^2/2}\). Both explanations have the same noise level, so the common factor cancels when we divide their densities at the observed change.</p>
\[\frac{\text{density with one opening}}{\text{density with no opening}}
=\frac{e^{-1^2/2}}{e^{-5^2/2}}=e^{12}\approx 163{,}000.\]
<p>This <em>likelihood ratio</em> measures how strongly the reading favors one opening. To turn it into a probability, we also need to know how often the valve opens. Suppose earlier logs show an opening in one out of every 1,000 comparable minutes. The odds before seeing the reading are \(1:999\). Multiply those odds by the likelihood ratio to get about \(163:1\) in favor of an opening, or a probability of about \(99.4\%\).</p>
<p>If openings occur in only one out of a million comparable minutes, the same calculation gives about \(14\%\). The pressure reading supplies the same evidence in both cases. The estimated chance of an opening changes because the starting odds differ.</p>
</div></details>
<details class="read-more"><summary data-section="semimartingales">How does the square of pressure change at the opening?</summary><div>
<p>Chapter 6 used Itô’s rule to track a function of a continuously moving state. At the valve opening we know the pressure on both sides, so we can calculate the change in its square directly as \(0.44^2-1.04^2=-0.888\).</p>
<p>Write \(x=1.04\) for the pressure just before the opening and \(J=-0.60\) for the jump. Expanding the square gives \((x+J)^2-x^2=2xJ+J^2\). Here the first term gives \(-1.248\) and the second adds \(0.36\). To track squared pressure over the whole minute, use the continuous rule between openings and add the full change at each opening.</p>
</div></details>
<details class="read-more"><summary>The assumptions behind Brownian noise</summary><div>
<p>A continuous process starting at zero with stationary, independent increments is a drifted, scaled Brownian motion, including the deterministic case. With positive variance rate, subtracting its drift and rescaling its variance rate to one gives standard Brownian motion.</p>
<p>Lévy’s characterization uses different assumptions. A continuous local martingale starting at zero with quadratic variation \(t\) is standard Brownian motion.</p>
</div></details>

${h('choose-model','What could two pressure readings miss?')}
<p>Now take away the valve log. You see \(1.00\) at noon and \(0.50\) a minute later. The path in the table dipped below \(0.45\) and recovered. A continuous path could also connect those readings while staying above \(0.45\) the whole time. Would a low-pressure alarm set at \(0.45\) have sounded?</p>
<p>The readings leave both possibilities open. Chapter 9’s ${link('learning','crossing-between-readings','between-readings experiment')} tackles this question for a continuous Brownian signal and an upper threshold. Its ${link('learning','valve-alarm','fourth example')} returns to these pressure readings and calculates the low-pressure alarm probability when the valve log is missing.</p>
` + check('Would a continuous path from 1.00 to 0.50 have to stay above 0.45?', 'It could dip below 0.45 and rise again before the next reading. Even knowing the path is continuous leaves the crossing uncertain.');
