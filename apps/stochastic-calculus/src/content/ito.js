import { prose, h, check, link, note } from './helpers.js';

export const ito = demos => prose`
${h('finite-increments','Add changes instead of differentiating the path')}
<p>Section 3 gave us a problem and a way forward. Brownian motion has no ordinary velocity, so we cannot rely on a derivative \(W'(t)\). But we can still observe the position at a series of times, subtract consecutive values, and add up those finite changes.</p>
<p>We will do three things: work out the size of a finite Brownian change, determine which products survive when many such changes are added, and use those results to build an integral and a chain rule.</p>
<h3>Define the time grid and its increments</h3>
<p>Divide \([0,T]\) into \(n\) equal intervals, each lasting \(\Delta t=T/n\). Write \(t_i=i\Delta t\), and use \(W_i\) as a short name for \(W(t_i)\). Then:</p>
\[\begin{aligned}\Delta t&=t_{i+1}-t_i,\\\Delta W_i&=W_{i+1}-W_i.\end{aligned}\]
<p>These are actual finite changes. For example, a time interval might last 0.01 seconds, and a sampled path might move from 0.3 to 0.24, giving \(\Delta W_i=-0.06\).</p>
<p>We will also write \(h\) for the common interval length: \(h=\Delta t=T/n\). These two symbols refer to the same time step.</p>
<h3>Derive the square-root representation</h3>
<p>The Brownian increment law from Section 3 says that a displacement over duration \(\Delta t\) is normal with mean zero and variance \(\Delta t\):</p>
\[\Delta W_i\sim\mathcal N(0,\Delta t).\]
<p>Its standard deviation is therefore \(\sqrt{\Delta t}\). To put this normal variable on a unit scale, divide it by its standard deviation and name the result \(Z_i\):</p>
\[Z_i:=\frac{\Delta W_i}{\sqrt{\Delta t}}.\]
<p>Dividing by a positive constant preserves a normal distribution. Its mean remains zero, and its variance becomes:</p>
\[\operatorname{Var}(Z_i)=\frac{\operatorname{Var}(\Delta W_i)}{\Delta t}=1.\]
<p>So \(Z_i\) is a standard normal variable. Rearranging the definition gives:</p>
\[\boxed{\Delta W_i=\sqrt{\Delta t}\,Z_i,\qquad Z_i\sim\mathcal N(0,1).}\]
<p>This is an exact finite-step relation when \(Z_i\) is defined this way. To simulate a step, reverse the procedure: draw a standard normal number and multiply it by \(\sqrt{\Delta t}\). Non-overlapping Brownian increments give independent \(Z_i\).</p>
<p>For \(\Delta t=0.04\), the multiplier is 0.2. A draw \(Z_i=0.7\) produces a displacement 0.14; a draw \(Z_i=-1.2\) produces −0.24. Unlike a single coin, a Gaussian increment can take a continuous range of values. It represents the limiting effect of many small coin-like kicks.</p>
${h('quadratic-variation','Do the squared totals concentrate around their average?')}
<p>Section 3 found that the squared-change total has average \(T\). We now need to know whether its fluctuations shrink as the grid gets finer. Start with the finite-step representation we just derived and square it:</p>
\[(\Delta W_i)^2=\Delta t\,Z_i^2.\]
<p>For a standard normal variable, \(\mathbb E[Z_i^2]=1\). Thus one squared Brownian step has mean \(\Delta t\), but its actual value varies with the draw. A squared draw of 0.49 gives \(0.49\Delta t\); a squared draw of 1.44 gives \(1.44\Delta t\).</p>
<p>Recall the total from Section 3:</p>
\[Q_n:=\sum_{i=0}^{n-1}(\Delta W_i)^2.\]
<p>Unlike the sum of signed moves, this total depends on the observation grid. Suppose a move of \(+0.2\) is followed by \(-0.2\). Observing just the start and finish gives a net move of zero and a squared-move total of \(0^2=0\). Observing the middle point gives the same net move, but a squared-move total of \(0.2^2+(-0.2)^2=0.08\). That dependence on the grid is why we ask what happens as it is refined.</p>
<p>There are \(n\) terms, each with average \(\Delta t\), so:</p>
\[\mathbb E[Q_n]=n\Delta t=T.\]
<p>An average of \(T\) alone is not enough. A quantity that is equally likely to be 0 or \(2T\) also has average \(T\), while remaining far from it. We need the variation of \(Q_n\) to shrink. A standard normal has fourth moment \(\mathbb E[Z_i^4]=3\), so:</p>
\[\begin{aligned}\operatorname{Var}(Z_i^2)&=\mathbb E[Z_i^4]-\mathbb E[Z_i^2]^2=3-1=2,\\\operatorname{Var}((\Delta W_i)^2)&=2(\Delta t)^2.\end{aligned}\]
<p>The squared steps are independent, so their variances add:</p>
\[\begin{aligned}\operatorname{Var}(Q_n)&=n\,2(\Delta t)^2\\&=2T\Delta t\longrightarrow0.\end{aligned}\]
<p>Thus the sum has mean \(T\) and a shrinking spread around \(T\). Equivalently, its average squared error from \(T\) is:</p>
\[\mathbb E[(Q_n-T)^2]=2T\Delta t\longrightarrow0.\]
<p>This is what “converges in mean square” means here: the average squared error tends to zero. The sum approaches \(T\), even though no individual squared step becomes deterministic relative to its own size. We call the limiting accumulated squared change <strong>quadratic variation</strong>, and write \([W]_T=T\).</p>
<p>The experiment below the three product calculations keeps one fine sampled path fixed and reveals more of its observation points. Its squared sum should settle near the elapsed duration. The sum of absolute changes measures total distance instead and keeps growing as we resolve more of the wiggles.</p>
${h('multiplication-table','Three accumulated products give the table')}
<p>We will translate three accumulated-product limits into short differential rules. First calculate with finite changes; only then introduce the corresponding symbols. Observe the same journey over a fixed duration \(T\) on finer and finer grids. Each grid has \(n\) equal intervals of length \(h=T/n\). On each interval, multiply the two changes, then add those products over the journey.</p>
<p><strong>All three arrows below mean convergence in mean square.</strong> For each total \(S_n\) and its proposed limit \(L\), we check that \(\mathbb E[(S_n-L)^2]\) goes to zero. Each path supplies one total. The expectation averages its squared error across paths.</p>
<h3>1. Two time increments</h3>
<p>Each clock interval has length \(h\), so every path gives exactly the same total \(nh^2=Th\). Its ordinary numerical limit is zero. Its squared error is therefore \((Th)^2\) on every path. Averaging gives the very same number, which goes to zero as \(h\) shrinks.</p>
\[\sum_i h^2=Th\xrightarrow{\text{mean square}}0.\]
<p>The symbol \(\mathrm dt\) records elapsed time in differential notation. For the product of two time changes, this vanishing sum gives the shorthand:</p>
\[\boxed{(\mathrm dt)^2=0.}\]
<p>This is a limiting rule for the sum. A finite clock interval still has \(h^2&gt;0\).</p>
<h3>2. A time increment times a Brownian increment</h3>
<p>Factor out the common interval length \(h\). The signed Brownian moves add up to \(W_T-W_0=W_T\). On any path with a finite endpoint, the total \(hW_T\) shrinks to zero. To check the same mean-square criterion as in the first row, use \(\mathbb E[W_T^2]=T\). The average squared error is \(h^2\mathbb E[W_T^2]=Th^2\), which goes to zero.</p>
\[\sum_i h\,\Delta W_i=h\sum_i(W_{i+1}-W_i)=hW_T\xrightarrow{\text{mean square}}0.\]
<p>Write \(\mathrm dW_t\) for the Brownian-change differential. For its product with a time differential, the vanishing sum gives:</p>
\[\boxed{(\mathrm dt)(\mathrm dW_t)=(\mathrm dW_t)(\mathrm dt)=0.}\]
<p>The order of these scalar factors makes no difference. Again, a finite product \(h\Delta W_i\) can be nonzero; it is the accumulated sum that vanishes.</p>
<h3>3. Two Brownian increments</h3>
<p>Multiply the Brownian move on each interval by itself. The finite total is \(Q_n\), the squared-change sum we just studied. Its limit is the quadratic variation of Brownian motion:</p>
\[Q_n=\sum_i(\Delta W_i)^2\xrightarrow{\text{mean square}}[W]_T=T.\]
<p>There are two different operations here. To <em>compute</em> \(Q_n\), use one path and add its squared moves. To <em>check convergence</em>, look across paths at how far \(Q_n\) is from \(T\). Its mean is already \(T\) on every grid. What tends to zero is the average squared error \(\mathbb E[(Q_n-T)^2]=2Th\).</p>
<p>This calculation holds for every ending time, so \([W]_t=t\). The symbol \((\mathrm dW_t)^2\) names the quadratic-variation contribution in Itô calculations. Its meaning is:</p>
\[\boxed{(\mathrm dW_t)^2=\mathrm d[W]_t=\mathrm dt.}\]
<p>Unlike the other two products, squared Brownian changes survive after summation: their limit is elapsed time. This does not make \((\Delta W_i)^2=h\) for one finite step. Now refine one path in the experiment and compare all three totals.</p>
` + demos.qv + prose`
<div class="table-wrap"><table class="ito-table"><caption>Itô multiplication table from the mean-square limits of the three sums</caption><thead><tr><th>\(\times\)</th><th>\(\mathrm dt\)</th><th>\(\mathrm dW_t\)</th></tr></thead><tbody><tr><th>\(\mathrm dt\)</th><td>\(0\)</td><td>\(0\)</td></tr><tr><th>\(\mathrm dW_t\)</th><td>\(0\)</td><td>\(\mathrm dt\)</td></tr></tbody></table></div>
<p>The table collects the rules we just derived. A zero records a vanishing accumulated product; \(\mathrm dt\) records the surviving quadratic variation. These symbols summarize limits of sums, rather than equalities between individual finite increments.</p>
${h('read-the-differentials','Square a change, or change the square?')}
<p>The position of the parentheses matters. Compare the two finite quantities:</p>
\[\begin{aligned}
(\Delta W_i)^2&=(W_{i+1}-W_i)^2,\\
\Delta(W_i^2)&=W_{i+1}^2-W_i^2.
\end{aligned}\]
<p>The first squares the move. The second asks how much the squared position changed. Ordinary algebra relates them:</p>
\[\Delta(W_i^2)=2W_i\,\Delta W_i+(\Delta W_i)^2.\]
<p>Sum this exact identity over the grid. The changes on the left telescope:</p>
\[W_T^2-W_0^2=2\sum_i W_i\,\Delta W_i+Q_n.\]
<p>The notation \(\mathrm d(W_t^2)\) refers to the <em>whole change in squared position</em> on the left. The symbol \((\mathrm dW_t)^2\) refers only to the quadratic-variation contribution coming from \(Q_n\). They are different quantities. The other term contains a changing weight \(W_i\) multiplying each move; we need an integral to describe its limit. That is our next step. After deriving the chain rule, we will return to write the full formula for \(\mathrm d(W_t^2)\).</p>
${h('integral','Use these changes to build an integral')}
<p>The square identity just produced a sum in which the starting position multiplies the next move. To describe the limit of such weighted sums, first compare the two changes we can accumulate: elapsed time and signed position change.</p>
<h3>What are we adding, and what are we integrating against?</h3>
<p>Return to the move from \(0.30\) to \(0.24\) in \(0.01\) seconds. Two things changed during that interval: the clock advanced by \(0.01\), and the position changed by \(0.24-0.30=-0.06\). Which change do we want to accumulate?</p>
<p>Suppose we give each change a weight of \(H=2\), meaning we count it twice. If we are keeping track of time, we add \(2\times0.01=0.02\) to our total. If we are keeping track of signed movement, we add \(2\times(-0.06)=-0.12\). The second total decreases because the particle moved to the left.</p>
<p>Now let the weight change from one interval to the next. Call the weight at time \(t\) the <em>integrand</em>, \(H_t\). On a grid of width \(h=T/n\), we add up the contributions from every interval. The symbol at the end tells us which change to count:</p>
\[\begin{aligned}
\sum_i H_{t_i}\underbrace{h}_{\text{clock change}} &\longrightarrow \int_0^T H_t\,\mathrm dt,\\
\sum_i H_{t_i}\underbrace{(W_{t_{i+1}}-W_{t_i})}_{\text{signed position change}} &\longrightarrow \int_0^T H_t\,\mathrm dW_t .
\end{aligned}\]
<p><strong>When do we read the weight?</strong> In the Itô sum (the second line), use the weight at the <em>start</em> of each interval. This is its “left endpoint” on the time axis. With a constant weight of 2, the timing makes no difference. To see why it can matter, try the rule “use the particle’s current position as the weight,” so \(H_t=W_t\). The move above starts at \(0.30\), so we fix the weight at \(0.30\). When the move ends, we can calculate its contribution: \(0.30\times(-0.06)=-0.018\). The value \(0.24\) becomes available for the <em>next</em> interval. This is all “past-dependent” requires here: we can choose the weight using what we have seen up to and including the start.</p>
<p><strong>What does the second arrow mean?</strong> With a changing weight, a finer grid lets us update it more often. Call the sum on \(n\) intervals \(S_n\), and call the limiting integral \(I\). Both depend on the path. On each path compare \(S_n\) with \(I\) for that same path, square the difference, then average across paths. Saying the sums converge <em>in mean square</em> means that this average error tends to zero as the grid gets finer: \(\mathbb E[(S_n-I)^2]\to0\).</p>
<details><summary>What condition on the weights do we use?</summary><p>We use weights whose squared sizes have a finite average when accumulated over the time interval: \(\mathbb E[\int_0^T H_t^2\,\mathrm dt]&lt;\infty\). For \(H=2\) this quantity is simply \(4T\). For the changing weights in these examples, the starting values also approximate the weights in mean square as the grid is refined.</p></details>
<p>The simplest examples are just accumulated time and accumulated position change:</p>
\[\int_0^T1\,\mathrm dt=T,\qquad\int_0^T1\,\mathrm dW_t=W_T-W_0.\]
<h3>Why does this order keep the mean at zero?</h3>
<p>The next displacement is a fresh mean-zero change, independent of the past. If the multiplier is chosen <em>before</em> that change, its product with the next displacement has mean zero:</p>
\[\mathbb E[H_{t_i}\Delta W_i]=0.\]
<p>Adding such contributions keeps the mean zero. A multiplier that uses the end of the interval would already depend on the displacement being multiplied; we will see in Section 6 that this changes the integral.</p>
<h3>How large can the accumulated integral be?</h3>
<p>Square the finite sum. For a diagonal term, the future squared increment has average \(\Delta t_i\), independently of the multiplier already chosen:</p>
\[\mathbb E[H_{t_i}^2(\Delta W_i)^2]=\mathbb E[H_{t_i}^2]\Delta t_i.\]
<p>Cross terms from different intervals have mean zero. To see why, consider the later interval: the earlier contribution and the new multiplier have already been chosen, while the later increment is still a fresh centered change. This does not require the multipliers themselves to be independent.</p>
<p>After summing the diagonal terms and refining the grid, we obtain the <strong>Itô isometry</strong>:</p>
\[\mathbb E\!\left[\left(\int_0^T H_t\,\mathrm dW_t\right)^2\right]=\int_0^T\mathbb E[H_t^2]\,\mathrm dt.\]
<p>It relates the average squared size of the random integral to an ordinary time integral. It also helps check whether approximating a multiplier gives a good approximation to its integral. For a constant multiplier \(H=2\), the stochastic integral is \(2W_T\), whose variance is \(4T\); the right side is likewise \(\int_0^T4\,\mathrm dt=4T\).</p>
${h('classical-integration','What remains familiar from ordinary calculus?')}
<p>If the integrator is a smooth function \(g(t)\), its increments satisfy \(\Delta g_i\approx g'(t_i)\Delta t_i\). The sums then recover the ordinary rule:</p>
\[\int_0^T H_t\,\mathrm dg(t)=\int_0^T H_tg'(t)\,\mathrm dt.\]
<p>For suitable finite-variation integrators and continuous multipliers, classical integration is also available. Zero quadratic variation alone is not a sufficient assumption for all such claims.</p>
<p>When the integrator is Brownian motion but the multiplier \(f(t)\) is a smooth deterministic function of time, integration by parts gives:</p>
\[\int_0^T f(t)\,\mathrm dW_t=f(T)W_T-f(0)W_0-\int_0^T W_tf'(t)\,\mathrm dt.\]
<p>The final term is an ordinary time integral along the sampled continuous path. When both the multiplier and the integrator depend roughly on Brownian motion, an endpoint-independent classical integral no longer supplies the answer. That is where the new product rules matter.</p>
${h('ito-lemma','Now apply ordinary Taylor expansion to a smooth function')}
<p>Suppose we want to know how a smooth function \(f(t,W_t)\) changes. We cannot differentiate \(W_t\), but we can apply ordinary multivariable Taylor expansion to the finite change from \((t_i,W_i)\) to \((t_i+\Delta t_i,W_i+\Delta W_i)\):</p>
\[\begin{aligned}\Delta f_i={}&f_t\Delta t_i+f_x\Delta W_i+\tfrac12f_{xx}(\Delta W_i)^2\\&+f_{tx}\Delta t_i\Delta W_i+\tfrac12f_{tt}(\Delta t_i)^2+R_i.\end{aligned}\]
<p>The derivatives are ordinary partial derivatives of the function \(f(t,x)\), evaluated at the start of the step, \((t_i,W_i)\). The notation \(R_i\) collects higher-order terms. We assume enough smoothness and control of the derivatives for their summed remainders to vanish.</p>
<p>Sum the expansion over all steps. The product table tells us what remains:</p>
<ul><li>The time-squared and time-times-Brownian products disappear.</li><li>The first-order terms become a time integral and an Itô integral.</li><li>The squared Brownian term survives, contributing \(\frac12\int f_{xx}(t,W_t)\,\mathrm dt\).</li></ul>
<h3>Why does the second derivative act as a multiplier?</h3>
<p>Taylor expansion assigns a factor \(\tfrac12f_{xx}(t_i,W_i)\) to each squared displacement. For \(f(x)=x^2\), that factor is the constant 1. For \(f(x)=x^3\), it is \(3W_i\): the current position determines how strongly that step's square affects the function.</p>
<p>The same averaging of squared increments works with these well-behaved starting-point factors. This is why the surviving term contains the second derivative along the path. The optional ${link('reference','weighted-squares','weighted-sum proof')} gives the mathematical details after this purpose has been established.</p>
<p>The full integral identity is:</p>
\[\begin{aligned}f(T,W_T)-f(0,W_0)={}&\int_0^T\left(f_t+\tfrac12f_{xx}\right)(t,W_t)\,\mathrm dt\\&+\int_0^T f_x(t,W_t)\,\mathrm dW_t.\end{aligned}\]
<p>Using differential notation to record it gives <strong>Itô's lemma</strong>:</p>
\[\boxed{\mathrm df(t,W_t)=\left(f_t+\frac12f_{xx}\right)\mathrm dt+f_x\,\mathrm dW_t.}\]
<p>The extra term records the effect of curvature on many small random changes. On a convex function, symmetric up/down displacements increase the average function value. The mathematics comes from ordinary Taylor expansion plus the different size of Brownian increments.</p>
${h('worked-square','Return to the square: write the full differential')}
<p>We already distinguished the square of a move from the change in squared position. Now use the general chain rule to find the full change. Take \(f(t,x)=x^2\). Its derivatives are \(f_t=0\), \(f_x=2x\), and \(f_{xx}=2\). Substitution gives:</p>
\[\begin{aligned}\mathrm d(W_t^2)&=\left(0+\tfrac12\times2\right)\mathrm dt+2W_t\,\mathrm dW_t\\&=\mathrm dt+2W_t\,\mathrm dW_t.\end{aligned}\]
<p>Thus \((\mathrm dW_t)^2=\mathrm dt\) names just the quadratic-variation term, whereas \(\mathrm d(W_t^2)=2W_t\,\mathrm dW_t+\mathrm dt\) includes the weighted Brownian change as well. Applying \(\mathrm d\) to the squared position is not the same operation as squaring \(\mathrm dW_t\).</p>
<p>Integrate from 0 to \(T\). Because \(W_0=0\), the change in the square is \(W_T^2\), and the accumulated time is \(T\):</p>
\[\begin{aligned}W_T^2&=T+2\int_0^T W_t\,\mathrm dW_t,\\\int_0^T W_t\,\mathrm dW_t&=\frac12W_T^2-\frac12T.\end{aligned}\]
<p>Ordinary smooth-path calculus would have given just \(W_T^2/2\). The extra \(-T/2\) corrects for the squared displacements that did not vanish. The result also has the expected mean zero because \(\mathbb E[W_T^2]=T\).</p>
<h3>Geometry: the omitted triangular pieces</h3>
<p>We can see the same result directly, without Taylor notation. Expand \(W_{i+1}^2=(W_i+\Delta W_i)^2\) and rearrange:</p>
\[W_i\Delta W_i=\frac12(W_{i+1}^2-W_i^2)-\frac12(\Delta W_i)^2.\]
<p>The left-endpoint contribution differs from the symmetric trapezoid contribution by a small triangular piece. Summing the identity cancels the intermediate square values:</p>
\[\sum_iW_i\Delta W_i=\frac12W_T^2-\frac12Q_n.\]
<p>For smooth motion the triangular pieces vanish in total. For Brownian motion they add up to \(T/2\). The next experiment shows this exact finite identity and its limiting value.</p>
` + demos.integral + prose`
<h3>A trading interpretation</h3>
<p>In a toy fair-game price model, choose a holding \(W_i\) before the next price change. Its gain is \(W_i\Delta W_i\). Such gains have mean zero under our finite-average assumptions. A midpoint holding contains part of the future price change and is a different rule. Brownian motion can take negative values, so this is an analogy for the integral, not a realistic stock-price model.</p>
<h3>An energy interpretation</h3>
<p>If a toy velocity is \(V_t=W_t\), its kinetic energy \(E_t=V_t^2/2\) changes by:</p>
\[\Delta E_i=V_i\Delta W_i+\frac12(\Delta W_i)^2.\]
<p>The first term is centered work from the next impulse; the second supplies a positive mean energy input. This model has no dissipative drag, so it is not an equilibrium thermal model. It illustrates how a mean-zero kick can still change the average of a curved quantity such as energy.</p>
${h('algebraic-view','An optional symbolic perspective')}
<p>Some computational methods encode the same multiplication rules using truncated polynomials. This is not needed to follow the derivation above; the ${link('reference','symbolic-calculus','symbolic-calculus note')} retains that perspective and the source author's further reading.</p>
<p>We now have a way to accumulate random changes and a rule for transforming them. Section 5 uses these tools to model systems whose local trend and noise depend on the current state.</p>
` + check('Why does the second-order term disappear for a smooth path but survive for Brownian motion?',String.raw`A smooth displacement has size proportional to \(\Delta t\), so its squares sum to zero. A Brownian displacement has size proportional to \(\sqrt{\Delta t}\), so its squares accumulate at the same scale as time.`);
