import { prose, h, check, link, note } from './helpers.js';

export const introduction = () => prose`
<div class="intro-heading"><div class="eyebrow">Introduction to stochastic calculus</div><h1>A little noise.<br>A different <em>calculus.</em></h1><p class="deck">Start with motion you can predict. Then ask what changes when each step becomes uncertain.</p></div>
${h('steady-motion','First, a predictable journey')}
<p>Imagine an object moving along a straight line at a constant speed. If we know where it starts and how fast it moves, we can predict where it will be:</p>
\[x(t)=x_0+vt.\]
<p>Every second adds the same displacement. Repeating the experiment under the same idealized rule gives the same line. Ordinary calculus helps us describe such motion even when the speed varies.</p>
${h('uncertain-steps','Now make the steps uncertain')}
<p>Suppose small disturbances sometimes push the object a little farther right and sometimes left. The steady part of its motion is still useful, but it no longer determines the exact position. Repeating the experiment produces different paths.</p>
<p>We now want to answer two questions: <strong>what does one possible journey look like, and how are the possible destinations distributed?</strong> Stochastic calculus develops tools for describing change with this kind of uncertainty.</p>
<p>To begin, set the steady motion aside and isolate the disturbances. Replace all their physical complexity with one simple rule: at each step a fair coin chooses a push to the right or left. Heads means right; tails means left. A sequence of tosses then becomes a random walk. This is a deliberately simplified model that we can count and understand before taking a continuous limit.</p>
${h('applications','Why study this?')}
<ul><li><strong>Physics:</strong> many unresolved molecular collisions make the position of a tiny suspended particle uncertain. We want to describe how a cloud of particles spreads.</li>
<li><strong>Finance:</strong> a price model describes a range of possible future values. Connecting those models to option pricing requires a calculus for random changes.</li>
<li><strong>Biology:</strong> diffusion helps describe molecules moving through a cell.</li>
<li><strong>Machine learning:</strong> some generative models learn how to reverse a process that gradually adds noise to data. The ${link('diffusion','','ML application chapter')} develops that idea after its mathematical ingredients are in place.</li></ul>
<p>We will start with coins, count their possible paths, and ask how very many small steps become a continuous process. That will reveal why ordinary calculus needs one extra term.</p>
<p class="method">Assumed background: basic calculus, averages, and variance. This interactive lesson is based on Ji-Ha Kim’s <a href="https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/" target="_blank" rel="noopener noreferrer"><cite>Introduction to Stochastic Calculus</cite></a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a>. Our explanations, derivations, and experiments adapt and extend that foundation. See the ${link('reference','sources','source attribution and description of changes')}.</p>
`;

export const randomWalk = demos => prose`
${h('coin-model','From a coin toss to a step')}
<p>Take the left/right disturbance from the introduction. Draw a number line and start at zero. Moving right increases the coordinate by one; moving left decreases it by one:</p>
<div class="table-wrap"><table><thead><tr><th>Coin outcome</th><th>Direction</th><th>Change in position</th></tr></thead><tbody><tr><td>Heads (H)</td><td>Right →</td><td>\(+1\)</td></tr><tr><td>Tails (T)</td><td>Left ←</td><td>\(-1\)</td></tr></tbody></table></div>
<p>For example, H, T, H gives positions \(0\to1\to0\to1\). The changes are \(+1,-1,+1\), and their sum is the final position \(+1\). For now the coin is fair, and each toss is independent of the earlier tosses.</p>
<p>The coin stands in for an uncertain kick. It is not a claim that molecules literally toss coins. Its value is that we can list every possibility and ask how a repeated local rule builds a path.</p>
` + demos.coin + prose`
${h('pascal','Counting routes with Pascal’s triangle')}
<p>After one step there are two possible positions. After two steps, right-then-left and left-then-right both return to zero. At every later step, the number of ways to reach a node is the sum of the numbers at its two parent nodes:</p>
\[\begin{array}{ccccccc}&&&1&&&\\&&1&&1&&\\&1&&2&&1&\\1&&3&&3&&1\end{array}\]
<p>These are the first four rows of Pascal’s triangle. Using zero-based indexing, row \(n\) counts paths after \(n\) steps. Its entry \(k\) counts paths with \(k\) right steps:</p>
\[\binom nk=\frac{n!}{k!(n-k)!},\qquad k=0,1,\ldots,n.\]
<p>For three steps and two right moves, the routes are RRL, RLR, and LRR. There are \(\binom32=3\) of them. Each ends at position \(+1\), but follows a different intermediate path.</p>
${h('binomial','From route counts to probabilities')}
<p>We will use three statistical symbols: \(\mathbb P\) means probability, \(\mathbb E\) means the average over many repetitions, and \(\operatorname{Var}\) measures the average squared distance from that average. The standard deviation is the square root of the variance and gives a spread in the same units as position.</p>
<p>Now allow a biased coin: the probability of a right step is \(p\), and of a left step is \(q=1-p\). Under independence, probabilities multiply. Any particular sequence containing \(k\) right moves and \(n-k\) left moves has probability \(p^kq^{n-k}\). Multiplying by the number of such sequences gives the binomial law:</p>
\[\mathbb P(K=k)=\binom nk p^k(1-p)^{n-k}.\]
<p>Here \(K\) counts right moves. Position is a different variable: subtract the number of left moves from the number of right moves:</p>
\[S_n=(+1)K+(-1)(n-K)=2K-n.\]
<p>For example, with three fair tosses the probability of ending at \(+1\) is \(3(1/2)^3=3/8\). The endpoints lie on a lattice; probability mass at a reachable position is not a continuous probability density.</p>
` + demos.walk + prose`
${h('discrete-drift','Separate a trend from its fluctuations')}
<p>Set the right-step probability in the graph to 75%. Each toss still moves exactly one unit. Yet the dashed line rises by half a unit per toss: \(0.75(+1)+0.25(-1)=0.5\). How can the average step be a step the walker never takes? Imagine four moves containing three heads and one tail. They gain two units altogether, or half a unit per move. Individual runs need not contain those exact counts.</p>
<p>The dashed line describes the average over repetitions; the blue walk shows the departures from that average. A right step lies \(+0.5\) above the predicted <em>change</em>; a left step misses it by \(-1.5\). Their weighted average is zero. We can do this bookkeeping for any step length. For spatial steps \(\Delta X_i\in\{-\Delta x,+\Delta x\}\), compute the mean of one step:</p>
\[m:=\mathbb E[\Delta X_i]=(p-q)\Delta x=(2p-1)\Delta x.\]
<p>Adding and subtracting that mean splits an individual step into a systematic part and a centered random part:</p>
\[\Delta X_i=\underbrace{m}_{\text{mean step}}+\underbrace{(\Delta X_i-m)}_{\text{zero-mean fluctuation}}.\]
<p>The centered part of a biased two-point step need not be symmetric. What matters here is that its expectation is zero. Its variance follows from \(\mathbb E[(\Delta X_i)^2]=(\Delta x)^2\):</p>
\[\operatorname{Var}(\Delta X_i)=(\Delta x)^2-m^2=4p(1-p)(\Delta x)^2.\]
<p>For independent steps, means and variances add. With unit steps, \(\mathbb E[S_n]=n(2p-1)\) and \(\operatorname{Var}(S_n)=4np(1-p)\). These describe an ensemble of walks, not the destination of every individual walk.</p>
${h('local-rules','Why local rules lead beyond the binomial formula')}
<p>So far you have changed one slider for the entire walk. What if the walker changes the coin at each location? Try a rule on paper: heads has probability \(1/2\) at zero, \(1/4\) to its right, and \(1/2\) to its left. Right–left returns to zero with probability \((1/2)(3/4)=3/8\); left–right also returns to zero, but with probability \((1/2)(1/2)=1/4\). The route count is still two. Multiplying it by a single route probability no longer works.</p>
<p>The binomial expression relies on the same step size and probability at every trial. If a restoring force makes a rightward position favor leftward steps, a route’s probability depends on the intermediate positions. Two routes can still meet, but no longer have equal probabilities merely because their right-step counts agree.</p>
<p>In a price model, the size of a fluctuation may instead grow with the current price. The local rule now depends on the state. We can describe that rule even when one global path-counting formula is unavailable. This is the motivation for differential equations with random input.</p>
${note('<strong>Assess the assumption.</strong> Independence is a modeling choice. A streak alone does not prove dependence, and a model’s usefulness must be checked against the system or data it is meant to describe.')}
<p>Before letting the rule depend on location, let’s give the fair walk a clock. If we fit twice as many tosses into one second, how far should each toss move us?</p>
` + check('Does a fair coin mean every walk finishes at zero?', 'No. It means the expected endpoint is zero. Individual endpoints differ; zero is not even reachable after an odd number of unit steps.');

