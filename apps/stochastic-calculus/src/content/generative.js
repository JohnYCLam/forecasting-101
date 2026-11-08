import { prose, h, check, link } from './helpers.js';

export const generativeModels = demos => prose`
${h('ml-question','From a model of noise to a generative model')}
<p>Our goal is to generate new samples resembling a dataset. The strategy is to add noise until its distribution becomes simpler, learn information about the intermediate distributions, then use that information to generate samples in reverse. We need to understand how a whole distribution evolves, not just one path.</p>
<p>A <em>density</em> \(p_t(x)\) describes the distribution of positions at time \(t\): the area under it over an interval is the probability of lying in that interval. We call a collection of sampled positions a “cloud.” Its histogram approximates this density.</p>
<p>Imagine a strip of paper with two tight piles of pencil marks, one near −2 and the other near +2. Pick each mark up and move it by an independent Gaussian displacement. With enough noise, the gap between the piles fills in. The left end of the slider below is the original data; move right to spread it out.</p>
` + demos.blur + prose`
<p>Pick a position on the density curve. The arrow there points toward increasing density; at the symmetric center its slope is zero even when the center is a valley. This local clue cannot identify the original mark. Could many such local clues nevertheless guide a <em>cloud</em> back to two piles?</p>
${h('forward-sde','The forward SDE: progressively perturb the data')}
<p>For the marks we just used \(X_t=X_0+gW_t\): the cluster centers stay put and each cluster’s variance grows from \(0.09\) to \(0.09+g^2t\). The bold symbols below allow a mark to have many coordinates; a digital image, for example, has many pixel values. Let \(\mathbf X_0\sim p_{\mathrm{data}}\). A forward diffusion with a chosen drift \(\mathbf f\) and state-independent noise amplitude \(g(t)\) is:</p>
\[\mathrm d\mathbf X_t=\mathbf f(\mathbf X_t,t)\,\mathrm dt+g(t)\,\mathrm d\mathbf W_t,\qquad 0\le t\le T.\]
<p>The schedule is chosen so the terminal distribution can be approximated by a tractable prior. At a finite time it need not be exactly a standard Gaussian. We can draw training examples from the dataset; what is unavailable is an exact tractable density and a direct procedure for generating arbitrary new samples from it.</p>
${h('fokker-planck','From paths to distributions: the Fokker–Planck equation')}
<p>The forward SDE describes individual perturbed samples. To understand what reversing that process must accomplish, we need an equation for their density. The <em>Fokker–Planck equation</em> provides that link: given the SDE’s drift and diffusion, it describes how probability spreads and moves.</p>
<p>First derive it for the scalar SDE \(\mathrm dX=a(t,X)\,\mathrm dt+b(t,X)\,\mathrm dW\). Choose a smooth function \(\varphi(x)\) that vanishes outside a bounded region. Think of it as a probe: its average is large when many paths visit that region. Itô’s lemma gives the probe’s change; taking expectations removes the mean-zero stochastic integral:</p>
\[\frac{\mathrm d}{\mathrm dt}\mathbb E[\varphi(X_t)]=\mathbb E\left[a(t,X_t)\varphi'(X_t)+\tfrac12b(t,X_t)^2\varphi''(X_t)\right].\]
<p>Write the average as \(\int\varphi p\,\mathrm dx\). Move one derivative off \(\varphi'\) and two off \(\varphi''\) by integration by parts. For compactly supported probes the boundary terms vanish:</p>
\[\int\varphi\,\partial_t p\,\mathrm dx=\int\varphi\left[-\partial_x(ap)+\tfrac12\partial_{xx}(b^2p)\right]\mathrm dx.\]
<p>This holds for every such probe. It gives the density equation in the weak sense, and pointwise for sufficiently smooth densities:</p>
\[\frac{\partial p}{\partial t}=-\frac{\partial}{\partial x}(ap)+\frac12\frac{\partial^2}{\partial x^2}(b^2p).\]
<p>This equation evolves a density, whereas the original SDE evolves sample paths. Both describe the same system at different levels. In particular, \(\mathrm dX=g\,\mathrm dW\) gives \(\partial_t p=\tfrac12g^2\partial_{xx}p\), explaining the spreading in the first experiment. We will use the general density equation to construct a deterministic sampler later in this chapter.</p>
<p>For \(a=0\) and \(b=\sqrt{2D}\), this is the diffusion equation \(\partial_tp=D\partial_{xx}p\). For additive coefficients, its solution is a drifting Gaussian cloud.</p>
${h('score','What the score tells us—and how it is learned')}
<p>The arrow in the experiment records which way the density increases. Divide its slope by the density at that position and you get the derivative of the log density. In several coordinates this vector is called the score. The score is a spatial gradient of the current log density:</p>
\[\mathbf s_t(\mathbf x)=\nabla_{\mathbf x}\log p_t(\mathbf x).\]
<p>It points locally toward increasing density and measures how quickly log density changes, rather than simply pointing to one memorized data example. A neural network learns a field \(\mathbf s_\theta(\mathbf x,t)\) that approximates this score at each noise level.</p>
<p>For a Gaussian perturbation kernel \(\mathbf X_t=\alpha_t\mathbf X_0+\nu_t\boldsymbol\varepsilon\), with \(\boldsymbol\varepsilon\sim\mathcal N(0,I)\) and \(\nu_t>0\), the conditional score is known:</p>
\[\nabla_{\mathbf x_t}\log p(\mathbf x_t\mid\mathbf x_0)=-\frac{\mathbf x_t-\alpha_t\mathbf x_0}{\nu_t^2}=-\frac{\boldsymbol\varepsilon}{\nu_t}.\]
<p>A denoising score-matching objective fits the network to this target over data, times, and perturbations:</p>
\[\mathcal L(\theta)=\mathbb E\!\left[w(t)\left\|\mathbf s_\theta(\mathbf X_t,t)+\frac{\boldsymbol\varepsilon}{\nu_t}\right\|^2\right].\]
<p>The squared-error optimum averages the conditional score over the possible clean samples given the noisy sample. Under the standard regularity conditions, that average is the marginal score \(\nabla\log p_t\). Why does averaging work? Differentiate \(p_t(x)=\int p(x\mid x_0)p_0(x_0)\,\mathrm dx_0\) with respect to \(x\), then divide by \(p_t(x)\). Bayes’ rule turns the integrand into \(p(x_0\mid x)\nabla_x\log p(x\mid x_0)\): precisely that conditional average. The mixture demo uses the exact score so we can isolate how sampling works.</p>
${h('reverse-sde','The reverse-time SDE, with an explicit clock')}
<p>We now have a direction field for each noise level. To generate a new mark, start with a draw from the noisy cloud and use the field for the noise level we are leaving. Introduce a reverse clock \(s=T-t\), increasing from 0 to \(T\), and write \(\mathbf Y_s=\mathbf X_{T-s}\). For a sufficiently regular diffusion, its time reversal satisfies:</p>
\[\begin{aligned}\mathrm d\mathbf Y_s={}&\left[-\mathbf f(\mathbf Y_s,T-s)+g(T-s)^2\nabla\log p_{T-s}(\mathbf Y_s)\right]\mathrm ds\\&+g(T-s)\,\mathrm d\widetilde{\mathbf W}_s.\end{aligned}\]
<p>The Brownian motion is with respect to the reversed process’s information. The score term counteracts the dispersal of probability. Writing the equation in the original decreasing clock instead gives the familiar drift \(\mathbf f-g^2\nabla\log p_t\), with time integrated from \(T\) down to zero. Keeping the clock convention explicit prevents a sign error.</p>
<h3>Where does the reverse drift come from?</h3>
<p>In one dimension, Bayes’ rule relates the short reverse transition to the forward transition density \(K_h\):</p>
\[p(X_{t-h}=z\mid X_t=x)=\frac{p_{t-h}(z)K_h(z,x)}{p_t(x)}.\]
<p>For \(\mathrm dX=f\,\mathrm dt+g(t)\,\mathrm dW\), the forward density operator is \(L^*q=-\partial_x(fq)+\tfrac12g^2\partial_{xx}q\). How does this produce a drift? Multiply the reverse transition by a smooth probe \(\varphi(z)\) and integrate over \(z\). Its numerator is \(p_{t-h}\varphi\) evolved forward by one short step. To first order, forward evolution adds \(hL^*(p\varphi)\), while \(p_{t-h}=p_t-hL^*p_t+o(h)\). Thus:</p>
\[\mathbb E[\varphi(X_{t-h})\mid X_t=x]=\varphi(x)+h\,\frac{L^*(p\varphi)-\varphi L^*p}{p}(x)+o(h).\]
<p>Here \(p=p_t\), and \(o(h)\) denotes an error that vanishes faster than \(h\). The coefficient of \(h\) is called the reverse generator. Expanding the products cancels all terms without a derivative of the probe:</p>
\[\begin{aligned}L^{\mathrm{rev}}\varphi&=\frac{L^*(p\varphi)-\varphi L^*p}{p}\\&=\left[-f+g^2\frac{\partial_xp}{p}\right]\varphi'+\frac12g^2\varphi''.\end{aligned}\]
<p>The coefficient of \(\varphi'\) is the reverse drift; that of \(\varphi''/2\) is the unchanged local variance. This also shows why simply changing the sign of the forward drift is insufficient. For state-dependent scalar diffusion \(b(t,x)\), the reverse drift additionally contains \(\partial_x(b^2)\):</p>
\[a^{\mathrm{rev}}=-a+\partial_x(b^2)+b^2\partial_x\log p.\]
${h('probability-flow','Derive the probability-flow ODE')}
<p>The reverse sampler still tosses fresh random kicks. Could a smooth transport move the same amount of probability between neighboring positions? Use the Fokker–Planck equation we just derived:</p>
<p>When \(b=g(t)\) is independent of position and \(p>0\), use \(\partial_xp=p\,\partial_x\log p\) to rewrite the density equation:</p>
\[\begin{aligned}\partial_tp&=-\partial_x(ap)+\tfrac12g^2\partial_x(\partial_xp)\\&=-\partial_x\!\left[\left(a-\tfrac12g^2\partial_x\log p\right)p\right].\end{aligned}\]
<p>The quantity multiplying the density is the transport velocity. In several dimensions with scalar state-independent \(g(t)\), the forward density obeys:</p>
\[\partial_tp_t=-\nabla\cdot(\mathbf f p_t)+\frac12g^2\Delta p_t.\]
<p>Substitute \(\nabla p_t=p_t\nabla\log p_t\) and collect the probability flux:</p>
\[\partial_tp_t=-\nabla\cdot\!\left[\left(\mathbf f-\frac12g^2\nabla\log p_t\right)p_t\right].\]
<p>This is a deterministic continuity equation, generated by the probability-flow ODE:</p>
\[\frac{\mathrm d\mathbf Z_t}{\mathrm dt}=\mathbf f(\mathbf Z_t,t)-\frac12g(t)^2\nabla\log p_t(\mathbf Z_t).\]
<p>To generate samples, integrate this ODE backward from the terminal law. In the increasing reverse clock its velocity is \(-\mathbf f+\frac12g^2\nabla\log p\). The reverse SDE has the full score coefficient and injects randomness; the reverse ODE has half that coefficient and no new Brownian noise.</p>
<p>With the exact score, the correct starting law, and suitable well-posedness conditions, these processes share the same <strong>time-marginal distributions</strong>. They do not have identical trajectories or the same joint laws across time. An ODE trajectory is deterministic once its initial state is chosen; the initial state is still random.</p>
${h('mixture-demo','An example whose score we know exactly')}
<p>Take an equal mixture of two Gaussian clusters centered at \(-2\) and \(+2\), each with standard deviation 0.3. Under \(\mathrm dX=g\,\mathrm dW\), the clusters retain their means and acquire variance \(v(t)=0.09+g^2t\):</p>
\[p_t(x)=\frac12\mathcal N(x;-2,v(t))+\frac12\mathcal N(x;2,v(t)).\]
<p>How did we draw the arrow without a network? Let \(w_+(x)\) be the fraction of the density at \(x\) supplied by the cluster at \(+2\), and \(w_-=1-w_+\). Dividing the two Gaussian densities gives \(w_+/w_-=\exp(4x/v)\). The derivative of a Gaussian log density centered at \(m\) is \((m-x)/v\). The mixture score is therefore the weighted average \([2(w_+-w_-)-x]/v\). Since \(w_+-w_-=\tanh(2x/v)\), we obtain:</p>
\[s_t(x)=\frac{2\tanh(2x/v(t))-x}{v(t)}.\]
<p>Here the reverse drifts are \(g^2s_{T-s}\) for the SDE and \(g^2s_{T-s}/2\) for the ODE. Both samplers below start from the same draws from the exact terminal mixture, rather than a uniform grid or an incorrectly substituted Gaussian.</p>
` + demos.diffusion + prose`
${h('conditioning','Conditioning and inverse problems')}
<p>So far both clusters were allowed. If a measurement favors one of them, how should the arrow change? For a condition or measurement \(\mathbf y\), Bayes’ rule gives a conditional score decomposition:</p>
\[\nabla\log p_t(\mathbf x\mid\mathbf y)=\nabla\log p_t(\mathbf x)+\nabla\log p_t(\mathbf y\mid\mathbf x).\]
<p>This connects an unconditional learned score with a condition-dependent term. The likelihood here is conditioned on the <em>noisy state at time t</em>; it cannot generally be replaced by a clean-data likelihood without further modeling. Conditional score models and approximations to these terms support tasks such as label-conditioned generation and reconstruction from incomplete measurements.</p>
<p>Diffusion methods are used for image generation, scientific structure generation, and inverse problems. Their architectures, representations, and samplers differ. A shared SDE framework does not establish that every named product uses the same equation or achieves a particular accuracy or sampling speed.</p>
${h('likelihood','What the deterministic flow makes possible')}
<p>For ODE velocity \(\mathbf v_t\), the continuity equation implies an instantaneous change of density along a trajectory:</p>
\[\frac{\mathrm d}{\mathrm dt}\log p_t(\mathbf Z_t)=-\nabla\cdot\mathbf v_t(\mathbf Z_t).\]
<p>Given a tractable terminal density, integrating this divergence connects density evaluation at the two ends. A well-posed invertible ODE flow also provides a deterministic correspondence between endpoint states. Learned fields, approximate divergence estimates, and numerical integration affect the computed likelihood and mapping. A small fixed number of solver steps is not a universal guarantee.</p>

<p class="method">The score-based equations follow <a href="https://arxiv.org/abs/2011.13456" target="_blank" rel="noreferrer">Song et al.</a> Both experiments here use an analytically known score. They test the sampling mathematics; they do not train a score network. The score-matching objective above explains what a learned version would fit.</p>
` + check("Do the reverse SDE and probability-flow ODE reproduce identical paths?","They can share the distributions at each individual time when the score and initial law are correct. Their paths and their joint distributions across times differ. The demo uses the correct terminal mixture and shows finite-sample and numerical approximations.");
