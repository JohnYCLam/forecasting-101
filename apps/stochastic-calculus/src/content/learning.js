import { prose, h, check, link } from './helpers.js';
import { predictiveMl } from './predictive-ml.js';
import { switchingMl } from './switching-ml.js';
import { barrierMl } from './barrier-ml.js';
export const learnedDynamics = () => prose`
${h('learning-question','What is the machine learning task?')}
<p>In Section 6 we chose an equation and calculated its consequences. Now hide the equation and give a learner observed trajectories. Can it infer the local trend and variability, then predict unseen futures?</p>
<p>This first ML chapter studies that question through three increasingly demanding tasks. First predict a spread around a mean; then predict random switching between states; finally infer whether an event happened between readings. Each experiment separates training observations from evaluation paths and states what it learns.</p>
<p>Sections 9–12 have different purposes: <strong>9</strong> learns dynamics from observations; ${link('diffusion','','10')} generates data by following evolving distributions; ${link('pricing','','11')} uses a network to solve a future-payoff problem; ${link('sampling','','12')} uses noise to explore model parameters. These are different uses of stochastic calculus.</p>
` + predictiveMl() + switchingMl() + barrierMl() + prose`
${h('neural-sde','From regression to a neural SDE')}
<p>The experiments used regression models so their fitted equations could be inspected. A neural network can instead represent the coefficient functions when the relationship is more complex. This changes the model class; it does not remove the need for independent evaluation.</p>
<h3>Neural SDEs</h3>
<p>A neural SDE parameterizes drift and diffusion, for example:</p>
\[\mathrm d\mathbf Z_t=f_\theta(t,\mathbf Z_t)\,\mathrm dt+g_\phi(t,\mathbf Z_t)\,\mathrm d\mathbf W_t.\]
<p>Fitting these coefficients provides a continuous-time model of random trajectories, including generative time-series models. The training objective determines what aspects of the data are matched. Adding a noise term does not automatically make uncertainty estimates calibrated. See <a href="https://arxiv.org/abs/2102.03657" target="_blank" rel="noreferrer">Kidger and colleagues</a>.</p>

<p>The first experiment learns a discrete Gaussian transition; it does not uniquely identify a continuous-time mechanism. The second fits a local nonlinear drift and residual noise. The third uses a continuous-path assumption to infer hidden events. Their empirical alternatives show that an SDE is a modeling choice whose usefulness depends on the task.</p>
` + check("What changes between solving an SDE and learning an SDE from observations?","Solving starts with specified drift and diffusion and finds their consequences. Learning estimates a model from data first, then checks its predictions on observations that were not used to fit it.");
