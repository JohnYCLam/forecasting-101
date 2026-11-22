import { prose, h, check } from './helpers.js';
import { predictiveMl } from './predictive-ml.js';
import { switchingMl } from './switching-ml.js';
import { barrierMl } from './barrier-ml.js';
import { valveMl } from './valve-ml.js';
function learningDemo(number, id, title, body) {
  const headingId = 'learning-' + id;
  return `<section class="learning-demo" data-learning-demo="${number}" aria-labelledby="${headingId}">
    <h2 id="${headingId}" data-section="${id}" tabindex="-1"><span class="learning-demo-number">Example ${number}</span> ${title}</h2>
    ${body}</section>`;
}

export const learnedDynamics = () => prose`
${h('learning-question','What is the machine learning task?')}
<p>In Section 6 we chose an equation and calculated its consequences. Now hide the equation and give a learner observed trajectories. Can it infer the local trend and variability, then predict unseen futures?</p>
<p>First learn the spread around a mean, then predict a visit to another valley. The last two examples ask what the logger missed. Example 3 uses a continuous signal. Example 4 returns to Section 8’s pressure sensor, where an unlogged valve opening can also trigger the alarm.</p>
` + learningDemo(1, 'learn-random-motion', 'From one point forecast to a range of readings', predictiveMl())
  + learningDemo(2, 'learn-switching', 'Will the ball reach the other valley?', switchingMl())
  + learningDemo(3, 'crossing-between-readings', 'Can a model learn missed-alarm risk without alarm labels?', barrierMl())
  + learningDemo(4, 'valve-alarm', 'Can historical valve logs predict a missed alarm?', valveMl()) + prose`
${h('neural-sde','What did we learn from the four experiments?')}
<p>In Example 1, a straight-line regression predicted the average next reading, and the residuals told us how much one reading could vary. In Example 2, the same kick could send a path into a different valley, so we counted visits across many paths. In Example 3, two known readings left a gap: estimating a missed crossing required an assumption about how the path moves inside it. In Example 4, earlier valve logs supply a noise estimate and an opening frequency. Together with the end readings, they let us weigh two possible histories and estimate the chance of a low-pressure alarm.</p>
<details><summary>Optional · What would a neural SDE change in Example 2?</summary>
<p>Return to the two valleys in Example 2. We chose a cubic curve for the drift before seeing the data. If the landscape had several hills, that curve could miss a turn. We could keep the Brownian motion and let a network learn the shape of the drift from observed paths. A second network could learn how the strength of the kicks varies with position or time.</p>
\[\mathrm dX_t=f_\theta(t,X_t)\,\mathrm dt+g_\phi(t,X_t)\,\mathrm dW_t.\]
<p>At the current time and position, the first network returns the local trend and the second returns the noise strength. In a short step of duration \(h\), the expected change is approximately \(f_\theta h\) and its standard deviation is approximately \(|g_\phi|\sqrt h\). This is what makes the model a <em>neural SDE</em>. Example 2 used a polynomial and a single fitted noise strength, so you could inspect both. Either choice can be tested on the same held-out question: how often does a path reach the right valley? <a href="https://arxiv.org/abs/2102.03657" target="_blank" rel="noreferrer">Kidger and colleagues</a> develop this idea for learning from time series.</p>
</details>
` + check("What changes between solving an SDE and learning an SDE from observations?","Solving starts with specified drift and diffusion and finds their consequences. Learning estimates a model from data first, then checks its predictions on observations that were not used to fit it.");
