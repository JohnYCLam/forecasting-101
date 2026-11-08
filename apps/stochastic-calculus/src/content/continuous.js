import { prose, h, check, link, note } from './helpers.js';

export const scaling = demos => prose`
${h('clt','One destination is not yet a whole journey')}
<p>Section 1 described a walk one coin toss at a time. Now imagine making more and more steps within the <em>same amount of physical time</em>. Can the increasingly detailed walk approach a useful continuous model?</p>
<p>First recall what we know about its final position. Let \(\xi_i\) be the direction of toss \(i\): heads gives \(+1\), tails gives \(-1\). The position after \(n\) unit steps is:</p>
\[S_n=\xi_1+\cdots+\xi_n.\]
<p>A fair step has mean zero and variance one. Because the steps are independent, the sum has mean zero and variance \(n\). Its standard deviation—its typical spread around the mean—is therefore \(\sqrt n\). Dividing by that spread gives a quantity with variance one:</p>
\[\mathbb E[S_n]=0,\qquad\operatorname{Var}\!\left(\frac{S_n}{\sqrt n}\right)=1.\]
<p>The central limit theorem says that the distribution of \(S_n/\sqrt n\) approaches a standard normal bell curve as \(n\) grows. In symbols:</p>
\[\frac{S_n}{\sqrt n}\xrightarrow{d}\mathcal N(0,1).\]
<p>The arrow means that the <em>distribution</em> approaches the normal distribution. It does not say that a particular walk's endpoint approaches a fixed number.</p>
<p>The notation \(\mathcal N(0,1)\) denotes a normal distribution with mean zero and variance one, hence standard deviation one.</p>
<p>But this still describes only <strong>one chosen observation</strong>: the destination at the end. For example, a bell curve for the position at one second says nothing by itself about where the same walker was at a quarter-second or a half-second.</p>
<p>A <strong>random variable</strong> gives one uncertain number per repetition, such as the final position. To describe the journey, we need a random position for every time and a rule connecting those positions into a path. That time-indexed collection is called a <strong>stochastic process</strong>. Our next task is to attach a clock and a distance scale to the coin walk.</p>
${h('diffusive-scaling','Give the walk a clock and a step length')}
<p>Fix the total duration at \(T\), and arrange \(n\) equally spaced tosses. The <strong>time step</strong> is the time between consecutive tosses:</p>
\[\Delta t=\frac{T}{n}.\]
<p>The symbol \(\Delta x\) is the distance moved by each toss. These are different quantities: \(\Delta t\) is a duration; \(\Delta x\) is a length. For a one-second walk with 100 tosses, the time step is 0.01 seconds.</p>
<p>At an observation time \(t\), how many tosses have happened? Divide elapsed time by the time step and round down to count completed steps:</p>
\[m(t)=\left\lfloor\frac{t}{\Delta t}\right\rfloor.\]
<p>The floor brackets mean “round down.” For instance, if a toss occurs every 0.1 seconds, then by \(t=0.35\) seconds three tosses have happened.</p>
<h3>Build the position by adding the completed moves</h3>
<p>Toss \(i\) moves the particle by \(\Delta x\,\xi_i\): either \(+\Delta x\) or \(-\Delta x\). Starting at zero, add the moves completed by time \(t\):</p>
\[\begin{aligned}W_{\Delta t}(t)&=\Delta x\,\xi_1+\cdots+\Delta x\,\xi_{m(t)}\\&=\Delta x\sum_{i=1}^{m(t)}\xi_i.\end{aligned}\]
<p><strong>Read the notation:</strong> \(W_{\Delta t}(t)\) means “the position at time \(t\) of the walk built using time step \(\Delta t\).” The subscript labels which time grid we chose. It is not multiplication by \(\Delta t\), a derivative, or the size of a move. Each smaller time step gives a different, finer approximation.</p>
<h3>Derive its variance, one step at a time</h3>
<p>Multiplying a random variable by \(\Delta x\) multiplies its variance by \((\Delta x)^2\). Since \(\operatorname{Var}(\xi_i)=1\), one physical step has variance \((\Delta x)^2\). Independent variances add, so:</p>
\[\begin{aligned}\operatorname{Var}(W_{\Delta t}(t))&=\sum_{i=1}^{m(t)}\operatorname{Var}(\Delta x\,\xi_i)\\&=m(t)(\Delta x)^2\\&=\left\lfloor\frac{t}{\Delta t}\right\rfloor(\Delta x)^2.\end{aligned}\]
<p>For example, take \(T=1\), \(n=100\), and \(\Delta x=0.1\). At \(t=0.37\), there have been 37 moves. Their position variance is \(37\times0.1^2=0.37\). At one second it is \(100\times0.1^2=1\).</p>
<p>When \(t\) lies exactly on the grid, there is no rounding, and the variance is \(t(\Delta x)^2/\Delta t\). To preserve a finite amount of uncertainty while fitting more tosses into the same duration, we must choose how the spatial step shrinks with the time step.</p>
<div class="table-wrap"><table><thead><tr><th>Spatial step</th><th>Variance by time \(t\), on the grid</th><th>As \(\Delta t\) shrinks</th></tr></thead><tbody><tr><td>Keep \(\Delta x=1\)</td><td>\(t/\Delta t\)</td><td>Spreads without bound: more full-size kicks.</td></tr><tr><td>Choose \(\Delta x=\Delta t\)</td><td>\(t\Delta t\)</td><td>Collapses toward zero: the random kicks shrink too quickly.</td></tr><tr><td>Choose \(\Delta x=\sqrt{\Delta t}\)</td><td>\(t\)</td><td>Keeps the same spread at the same physical time.</td></tr></tbody></table></div>
<p>This is why the square root appears: independent squared step sizes accumulate. We need \((\Delta x)^2\) to shrink at the same rate as \(\Delta t\). A constant multiplier \(\sigma\) is also possible: \(\Delta x=\sigma\sqrt{\Delta t}\) gives variance \(\sigma^2t\).</p>
<p>The experiment shows the endpoint distribution as bars. Their <em>areas</em> represent fractions of all sampled walks; height alone is a density, not a probability. The smooth bell curve approximates those discrete endpoints. Its horizontal width shows the spread.</p>
<p>Two fixed windows make the comparison visible: use the close view to see a cloud shrink toward zero and the wide view to see it spread outward. Neither horizontal axis zooms when you change the controls.</p>
` + demos.scaling + prose`
${h('finite-drift','What if the walk also has a steady trend?')}
<p>Imagine a speck of dye in a stream. Its motion is irregular, but the current carries it downstream by two units per second on average. That average displacement per unit time is its <strong>drift</strong>. We want our coin walk to represent the same stream whether we divide a second into 100 steps or 400. We already know how to keep the random spread finite. How do we keep the current’s speed fixed too?</p>
<h3>What goes wrong if the coin stays 60% right?</h3>
<p>Start with 100 tosses in one second, each moving the speck \(0.1\) unit. A right move cancels a left move of the same size, so only the <em>excess</em> of right moves contributes to the net displacement. A 60% coin gives 60 right and 40 left on average: 20 extra right moves carry the center of the cloud \(20\times0.1=2\) units downstream. At this clock rate the coin works exactly as intended.</p>
<p>Now divide each time interval into four. The square-root rule from the previous experiment says that a step lasting a quarter as long moves <em>half</em> as far. Follow the same one second on both clocks:</p>
<div class="table-wrap"><table><thead><tr><th>Steps in one second</th><th>Distance per step</th><th>Expected right minus left</th><th>Mean displacement</th></tr></thead><tbody><tr><td>100</td><td>\(0.1\)</td><td>\(60-40=20\)</td><td>\(20\times0.1=2\)</td></tr><tr><td>400</td><td>\(0.05\)</td><td>\(240-160=80\)</td><td>\(80\times0.05=4\)</td></tr></tbody></table></div>
<p>The coin gives us <em>four times</em> as many excess right moves, each still <em>half</em> as long. Their combined push doubles. Refine the clock by four again and the predicted drift doubles again. The stream did not speed up; our choice to keep the same preference <em>per toss</em> made the model speed up. The numbers in the table are averages over many walks; an individual speck can still finish upstream.</p>
<p>Here is the same argument in symbols. A toss has mean displacement \(p\Delta x-(1-p)\Delta x=(2p-1)\Delta x\), and there are \(1/\Delta t\) tosses per unit time. For \(\Delta x=\sqrt{\Delta t}\) in our chosen units:</p>
\[\text{drift rate}=\frac{(2p-1)\Delta x}{\Delta t}=\frac{2p-1}{\sqrt{\Delta t}}.\]
<p>With \(p=0.6\), the numerator stays at \(0.2\) while the denominator shrinks toward zero. The mean speed therefore grows without bound. A fair coin avoids this because its numerator is zero, but it would give us no downstream current at all.</p>
<h3>How can the finer walk keep the same current?</h3>
<p>On the 400-step clock, each step is \(0.05\) unit long. To travel two units on average, we need \(2/0.05=40\) extra right moves, not 80. A coin that lands right 55% of the time gives exactly that: \(220-180=40\) on average. Although this coin is closer to fair, \(40\times0.05=2\): it describes the <em>same</em> drift as the 60% coin on the coarser clock.</p>
<p>For any desired drift \(\mu\), the mean displacement during one interval must be \(\mu\Delta t\). Keep the spatial step \(\sigma\sqrt{\Delta t}\), where \(\sigma\) sets the strength of the random fluctuations, and solve for the required right-step probability:</p>
\[\begin{aligned}(2p-1)\sigma\sqrt{\Delta t}&=\mu\Delta t,\\2p-1&=\frac{\mu\sqrt{\Delta t}}{\sigma},\\p&=\frac12+\frac{\mu\sqrt{\Delta t}}{2\sigma},\qquad\sigma>0.\end{aligned}\]
<p>In our stream, \(\mu=2\) and \(\sigma=1\). The formula gives \(p=0.60\) at 100 steps per second and \(p=0.55\) at 400, just as we found by counting. As the grid gets finer the coin approaches fair, but the drift does not disappear: a mean push of \(\mu\Delta t\) per step, repeated \(1/\Delta t\) times, still gives \(\mu\) per unit time.</p>
<p>Does weakening the bias spoil the random spread we just worked to preserve? Each squared step is \(\sigma^2\Delta t\), and the mean step is \(\mu\Delta t\). Subtracting the squared mean gives a single-step variance of \(\sigma^2\Delta t-\mu^2(\Delta t)^2\). Independent steps add their variances, so the variance per unit time is \(\sigma^2-\mu^2\Delta t\), approaching \(\sigma^2\). We keep both the current and the spread. The grid must be fine enough that the calculated \(p\) lies between zero and one.</p>
${h('physical-scaling','Does a real diffusing particle justify this scaling?')}
<p>We have answered a mathematical question: how should we shrink independent coin steps to keep the accumulated spread finite? Now ask the modeling question: <strong>is square-root spreading actually a useful description of a physical particle?</strong></p>
<p>A tiny suspended particle is jostled by the surrounding fluid. Over suitable observation times, its one-dimensional mean squared displacement is modeled by:</p>
\[\mathbb E[(X_t-X_0)^2]=2Dt.\]
<p>Here \(D\) is the diffusivity, which measures the spreading rate. The root-mean-square distance is \(\sqrt{2Dt}\). So the physical diffusion model has exactly the square-root time behavior we obtained by scaling coin steps. This is the connection we wanted; it does not claim that all random motion has this scaling at every time scale.</p>
<h3>Why random kicks can produce it</h3>
<p>Call the signed displacement of kick \(i\) by the name \(Y_i\). Suppose the kicks are independent and centered at zero, with root-mean-square length \(\ell\), meaning \(\mathbb E[Y_i^2]=\ell^2\). For \(N\) such kicks, their squared contributions add while their cross terms average to zero:</p>
\[\begin{aligned}\mathbb E\!\left[\left(\sum_{i=1}^N Y_i\right)^2\right]&=\sum_{i=1}^N\mathbb E[Y_i^2]\\&\quad+2\sum_{i<j}\mathbb E[Y_iY_j]\\&=N\ell^2.\end{aligned}\]
<p>When the number of effectively independent kicks grows in proportion to time, the mean squared displacement grows in proportion to time too. This is the same cancellation mechanism as in the fair coin walk.</p>
<h3>How this connects to the diffusion equation</h3>
<p>Let \(p(x,t)\) be the position density of a large collection of particles. The constant-diffusivity equation is:</p>
\[\frac{\partial p}{\partial t}=D\frac{\partial^2p}{\partial x^2}.\]
<p>Its Gaussian solution, for particles all starting at zero, has variance \(2Dt\). We will derive this density equation from an SDE in Section 8B, where it helps explain diffusion generative models. For spherical particles in the regime where the Stokes–Einstein relation applies, the physical parameters determine \(D\):</p>
\[D=\frac{k_B\mathcal T}{6\pi\eta r}.\]
<p>The symbols are Boltzmann's constant \(k_B\), absolute temperature \(\mathcal T\), viscosity \(\eta\), and particle radius \(r\). Einstein and Smoluchowski developed quantitative theories of this diffusion; Perrin's experiments provided important evidence for the molecular explanation.</p>
<h3>Where the approximation stops working</h3>
<p>A real particle has inertia. At times much shorter than its velocity-relaxation time, its velocity has not yet changed much, so distance scales roughly as time and squared distance as time squared. At longer times, the diffusive square-root law becomes the useful approximation. The ${link('reference','physical-crossover','physical crossover note')} retains the full inertial model and its formula.</p>
${h('path-limit','Give the limiting random walk a name')}
<p>Put the construction together: keep physical time fixed, take more independent centered steps, and shrink each spatial step like the square root of its duration. The continuous limiting random path is called <strong>Brownian motion</strong>.</p>
<p>Informally, Brownian motion is an idealized continuous random walk: it has no preferred direction; changes over disjoint time intervals have no memory of one another; and the variance of a change is proportional to its duration. It models position, not a smooth microscopic velocity.</p>
<p>The central limit theorem explained the endpoint's bell curve. A stronger theorem, Donsker's invariance principle, establishes convergence of the suitably connected paths as well. We will use that result without proving it. Section 3 now turns this picture into a precise set of assumptions and asks what kind of calculus such a path will need.</p>
` + check('If a time step becomes four times shorter, how should a Brownian spatial step change?',String.raw`It becomes half as large: \(\sqrt{\Delta t/4}=\sqrt{\Delta t}/2\). Four independent smaller steps then have the same total variance as the original step.`);

export const brownian = demos => prose`
${h('intuition','What has our coin walk become?')}
<p>At the end of Section 2, we named the limiting picture Brownian motion. Let's describe it before writing the formal definition. Imagine watching a tiny particle in a fluid. Its position changes continuously, but each future displacement is uncertain because of unresolved kicks. Across many repeated experiments, we can predict a cloud of possible positions even though we cannot predict one particular path.</p>
<p>Our mathematical idealization keeps that uncertainty and leaves out the very short-time inertial details. We write \(W(t)\), or equivalently \(W_t\), for its position at time \(t\). The letter \(W\) is conventional and gives the alternative name <em>Wiener process</em>.</p>
<p>How far does the particle move over a short interval? Recall the <a href="#scaling/diffusive-scaling">coin walk in Section 2</a>: each fair toss moved exactly \(\sqrt{\Delta t}\) to the right or left, so its variance was \(\Delta t\). Now watch \(m\) consecutive tosses, starting anywhere along the walk. Call the time we watch \(h=m\Delta t\). The tosses are independent, so their variances add:</p>
\[\operatorname{Var}(\text{net displacement})=m\,\Delta t=h,\qquad \text{standard deviation}=\sqrt h.\]
<p>Standard Brownian motion keeps this rule in the limit. Its net displacement from time \(t\) to time \(t+h\) is \(W_{t+h}-W_t\). It has mean zero, and by its <strong>typical size</strong> we mean its standard deviation, \(\sqrt h\). For example, over \(0.01\) seconds the spread is \(0.1\); an individual path can move less or more, in either direction.</p>
${h('definition','Write down the model we have built')}
<p>A <strong>standard Brownian motion</strong> is the normalized version of that picture. “Standard” means zero drift and variance increasing at rate one. Its assumptions are:</p>
<ol><li><strong>Start at the origin:</strong> \(W_0=0\).</li><li><strong>A Gaussian displacement over each interval:</strong> for \(0\le s<t\), \(W_t-W_s\sim\mathcal N(0,t-s)\).</li><li><strong>No memory between disjoint increments:</strong> the changes over separate, non-overlapping intervals are independent.</li><li><strong>No jumps:</strong> the position path is continuous.</li></ol>
<p>The path properties hold with probability one—often abbreviated “almost surely.” In \(\mathcal N(0,t-s)\), the first number is the mean and the second the variance. The standard deviation is therefore \(\sqrt{t-s}\). Write the displacement from time \(s\) to time \(t\) as:</p>
\[\Delta W(s,t):=W_t-W_s.\]
<p>If a path has reached position 2 at time 1, its next quarter-second displacement is centered at zero with standard deviation 0.5. Its next position is consequently centered at 2. Brownian motion does not pull the particle back to the original starting point. Across fresh full experiments that all start at zero, the position distribution is centered at zero.</p>
<p>The definition specifies how changes across time fit together. A separate bell curve at each time would not, by itself, tell us whether nearby positions belong to a continuous path or how those positions are related.</p>
${h('moments','What can we predict about the cloud?')}
<p>Taking \(s=0\) in the increment law gives:</p>
\[\mathbb E[W_t]=0,\qquad\operatorname{Var}(W_t)=\mathbb E[W_t^2]=t.\]
<p>Here \(\mathbb E\) means average across repeated experiments. The cloud keeps spreading: its standard deviation is \(\sqrt t\). An average of zero does not mean each individual path remains close to zero.</p>
<p>We can also explain why the positions at two times are related. For \(s\le t\), the later position contains all the earlier movement plus a new independent change:</p>
\[W_t=W_s+(W_t-W_s).\]
<p>Multiplying by the earlier position and averaging gives:</p>
\[\begin{aligned}\mathbb E[W_sW_t]&=\mathbb E[W_s^2]+\mathbb E[W_s(W_t-W_s)]\\&=s+0.\end{aligned}\]
<p>The cross term is zero because the new centered change is independent of the earlier position. Since both position means are zero, this average product is their covariance:</p>
\[\operatorname{Cov}(W_s,W_t)=\min\{s,t\}.\]
<p>Thus it is the <em>increments</em>, not the positions themselves, that are independent on disjoint intervals. Now compare one path with the position cloud it belongs to.</p>
` + demos.brownian + prose`
${h('roughness','Can we use the usual idea of velocity?')}
<p>Our goal is a calculus for random motion. In ordinary calculus, the next step would be to find a velocity by dividing a displacement by its duration and making the interval shorter:</p>
\[\text{average velocity over }[t,t+h]=\frac{W_{t+h}-W_t}{h}.\]
<p>For smooth motion, these slopes settle toward a finite tangent slope. For Brownian motion, we just saw that the displacement over \(h\) has standard deviation \(\sqrt h\). Dividing each displacement by the same duration \(h\) divides its standard deviation by \(h\) too. The spread of the slopes is therefore:</p>
\[\frac{\sqrt h}{h}=\frac1{\sqrt h}.\]
<p>Shorter intervals make the slopes fluctuate more strongly, rather than settle. At \(h=0.01\) the slope's standard deviation is 10; at \(h=0.0001\) it is 100. Its sign can go either way. This scaling suggests the rigorous result: Brownian paths are almost surely nowhere differentiable. The scaling argument is intuition for that theorem, not a proof at every point.</p>
<h3>Why this matters for the calculus we want</h3>
<p>We cannot treat Brownian motion as an ordinary smooth curve with a velocity \(W'(t)\). In particular, replacing a random path integral by an ordinary integral involving \(W'(t)\) will not work. We need to accumulate changes directly from the finite displacements instead.</p>
<h3>Where does a squared displacement enter the calculation?</h3>
<p>If all we want is the particle’s position, we just add its signed displacements. But earlier we also used its <em>squared distance from the origin</em>, \(W_t^2\), to measure how the cloud spreads. How does that quantity change during one move? Call the current position \(x\) and the signed move \(\delta\). Subtract the old reading from the new one:</p>
\[\underbrace{(x+\delta)^2-x^2}_{\text{change in squared distance}}=2x\,\delta+\underbrace{\delta^2}_{\text{square of this move}}.\]
<p>Imagine starting at \(x=0\) and moving either \(+0.1\) or \(-0.1\). The slope of \(x^2\) at zero is zero, so the linear estimate \(2x\,\delta\) predicts no change in either case. Yet both moves take the squared distance from zero to \(0.01\). The term \(\delta^2\) accounts for the whole change. For other smooth functions, a similar squared term appears wherever the graph has curvature.</p>
<h3>Why do these squares disappear for smooth motion?</h3>
<p>Let \(x(t)\) describe a smooth motion over a fixed duration \(T\). Suppose its speed stays below a finite bound \(v_{\max}\), so \(|x'(t)|\le v_{\max}\). Divide the duration into \(n\) equal intervals, each lasting \(h=T/n\), with \(t_i=ih\). Call the move on interval \(i\) \(\Delta x_i=x(t_{i+1})-x(t_i)\). Distance traveled is at most maximum speed times elapsed time, so:</p>
\[|\Delta x_i|\le v_{\max}h
\quad\Longrightarrow\quad
(\Delta x_i)^2\le v_{\max}^2h^2.\]
<p>Now add all \(n\) squared moves. There are \(n=T/h\) terms, and each is at most \(v_{\max}^2h^2\):</p>
\[0\le\sum_{i=0}^{n-1}(\Delta x_i)^2
\le n\,v_{\max}^2h^2
=\frac{T}{h}\,v_{\max}^2h^2
=Tv_{\max}^2h
\longrightarrow0.\]
<p>The duration \(T\) and speed bound \(v_{\max}\) stay fixed while \(h\) shrinks. The total is trapped between zero and a bound that shrinks to zero. For a concrete example, move at constant speed 1 for one second. With 100 intervals, the squared moves add to \(100(0.01)^2=0.01\). With 10,000 intervals, they add to \(10{,}000(0.0001)^2=0.0001\). This is why the squared contributions vanish from the accumulated change for smooth motion.</p>
<h3>What stays finite for Brownian motion?</h3>
<p>Use the same duration \(T\), the same \(n=T/h\) intervals, and write \(\Delta W_i=W_{t_{i+1}}-W_{t_i}\) for a move. From the Brownian increment law, each move has mean zero and variance \(h\). Variance is the mean square minus the square of the mean, so:</p>
\[\begin{aligned}
\mathbb E[(\Delta W_i)^2]
&=\operatorname{Var}(\Delta W_i)+\bigl(\mathbb E[\Delta W_i]\bigr)^2\\
&=h+0^2=h.
\end{aligned}\]
<p>Now add the squares along a path and call that total \(Q_n\). To find its average across paths, add the average contribution of each interval:</p>
\[\begin{aligned}
Q_n&=\sum_{i=0}^{n-1}(\Delta W_i)^2,\\
\mathbb E[Q_n]
&=\sum_{i=0}^{n-1}\mathbb E[(\Delta W_i)^2]\\
&=nh=\frac{T}{h}\,h=T.
\end{aligned}\]
<p>There are \(T/h\) terms, and each squared move contributes \(h\) on average. The factors cancel, leaving the fixed duration \(T\) even as the grid gets finer. Over one second, 100 intervals contribute \(100\times0.01=1\) on average. With 10,000 intervals, they still contribute \(10{,}000\times0.0001=1\).</p>
<p>This is why we cannot dismiss the squared changes: their accumulated contribution stays at \(T\) on average. But an average alone does not tell us how close a particular total is to \(T\). As we refine the grid, do the totals concentrate around that average? Section 4 answers this question by <a href="#ito/quadratic-variation">calculating their fluctuations</a>.</p>
<p>In Section 4’s <a href="#ito/demo-qv">Refine one path</a> experiment, you can watch the squared total on finer grids of the same path. <a href="#ito/demo-integral">See the missing half</a> then shows how those squares affect the change in \(W_t^2/2\). That function is half the squared position, so each squared-change contribution is halved too. The ${link('reference','brownian-regularity','optional regularity note')} discusses further path properties.</p>
` + check(String.raw`Are \(W_1\) and \(W_2\) independent?`,String.raw`No. The position at time 2 includes the movement up to time 1. It is the new increment \(W_2-W_1\) that is independent of \(W_1\).`);
