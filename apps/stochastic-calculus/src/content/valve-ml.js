import { prose, link } from './helpers.js';

export const valveMl = () => prose`
<p>In ${link('learning','crossing-between-readings','Example 3')} the sensor moved continuously. Return to ${link('beyond','choose-model','Section 8’s pressure sensor')}, where an unrecorded valve opening can cause a sudden pressure drop. Pressure was \(1.00\) at noon and \(0.50\) one minute later. The alarm triggers at or below \(0.45\). <strong>Can a model trained on earlier valve logs estimate the chance of an alarm when this minute’s log is missing?</strong></p>
</div>
<div data-lab="valve">
<div class="story">
  <p class="insight" id="valve-target"></p>
  <h3>What can we learn from earlier logs?</h3>
  <p>Each training record contains a one-minute pressure change and whether the valve opened. The equipment specification gives a drop of \(0.60\) per opening. In Section 8’s worked row, pressure changed by \(-0.50\) and the valve opened once. The background fluctuation was \(-0.50-(-0.60)=+0.10\). On a closed minute, the pressure change itself gives the background fluctuation.</p>
  <p>The learner counts the fraction of logged minutes with an opening and estimates the Brownian noise strength from the root mean square of those background changes. It receives no alarm labels. We assume zero drift and at most one opening per minute, independent of the Brownian motion. If it opens, its time is uniform within the minute.</p>
  <div class="controls"><div class="control"><label for="valve-count">Historical minutes</label><select id="valve-count"><option value="1000">1,000</option><option value="10000" selected>10,000</option><option value="100000">100,000</option></select></div>
    <button type="button" data-new="valve">New historical records + refit</button></div>
  <p id="valve-fit" role="status"></p>
  <h3>Can the fitted model recover the missing-log alarm risk?</h3>
  <p>Give both models the same two pressure readings and the same fitted background noise. The continuous-only baseline uses Example 3’s bridge with a lower threshold. The jump model also uses the opening frequency it learned from the logs.</p>
  <div class="table-wrap"><table><caption>Chance of reaching 0.45 during the minute, with the valve log missing</caption><thead><tr><th>Estimate</th><th>Which histories can explain the readings?</th><th>Chance of an alarm</th></tr></thead><tbody>
    <tr><th>Theoretical reference</th><td>Closed or opened, using the known source parameters.</td><td id="valve-reference"></td></tr>
    <tr><th>Continuous-only baseline</th><td>Pressure could dip below the threshold and recover continuously.</td><td id="valve-baseline"></td></tr>
    <tr><th>Learned jump model</th><td>Pressure can also cross the threshold in a single valve drop.</td><td id="valve-alarm"></td></tr>
  </tbody></table></div>
  <p id="valve-interpretation"></p>
  <h3>Why can an opening be more likely than an alarm?</h3>
  <p>If the valve stayed closed, Brownian motion had to produce the whole \(-0.50\) fall. If it opened, the background change only had to be \(+0.10\). At the source noise strength of \(0.10\), these are a five-standard-deviation fall and a one-standard-deviation rise. The endpoint readings strongly favor an opening.</p>
  <p id="valve-inference" role="status"></p>
  <p>An opening at pressure \(1.04\) lands at \(0.44\) and triggers the alarm. An opening at \(1.12\) lands at \(0.52\), after which pressure can reach \(0.50\) without a touch. The fitted model weighs the alarm chance in each possible history.</p>
  <details><summary>Worked calculation · How does the fitted model use the pressure readings when the log is missing?</summary>
    <p><strong>Start with the historical odds.</strong> Before looking at the pressure readings, use the ratio of opened to closed minutes in the training records.</p>
    <p id="valve-history-odds"></p>
    <p><strong>Update those odds using the fall from 1.00 to 0.50.</strong> If the valve stayed closed, the background change was \(-0.50\). If it opened, the drop accounts for \(-0.60\), leaving a background change of \(+0.10\). Under the fitted Gaussian noise model, compare the density of the observed change under these two explanations. Their common normalizing factor cancels:</p>
    \[L=\frac{\exp[-(+0.10)^2/(2\widehat\sigma^2)]}{\exp[-(-0.50)^2/(2\widehat\sigma^2)]}.\]
    <p id="valve-likelihood"></p>
    <p>Bayes’ rule multiplies the historical opening odds by \(L\). If the logbook contains \(n_o\) opened minutes and \(n_c\) closed minutes, the updated odds are \(n_o L\) to \(n_c\). The opening probability is the opening side divided by the total:</p>
    <p class="insight" id="valve-posterior"></p>
    <p><strong>Calculate the alarm chance for each history.</strong> For a closed valve, the readings are 0.55 and 0.05 above the threshold. Example 3’s bridge formula gives \(q_0=\exp[-2(0.55)(0.05)/\widehat\sigma^2]\). For one opening, consider a possible opening time and pressure just before the drop. Apply a bridge on each side of the drop, counting an alarm immediately if the drop lands at or below 0.45. Average over the possible pre-drop pressures and the uniformly distributed opening time. The theoretical calculation below gives the integration formula.</p>
    <p id="valve-conditional-risks"></p>
    <p><strong>Combine the two alarm chances.</strong> Write \(w\) for the updated opening probability. A fraction \(1-w\) receives the closed-valve alarm chance \(q_0\), and a fraction \(w\) receives the one-opening chance \(q_1\).</p>
    <p class="insight" id="valve-mixture"></p>
  </details>
  <h3>What changes if we recover the valve record?</h3>
  <p>Suppose a technician finds the valve entry for that minute. It tells us whether the valve opened. We still have the same two pressure readings. Choose the entry and see how the fitted model updates its alarm estimate.</p>
  <div class="controls"><div class="control"><label for="valve-log">Valve record for this minute</label><select id="valve-log"><option value="closed">Valve stayed closed</option><option value="opened">Opened once, time unknown</option></select></div></div>
  <p class="insight" id="valve-reading" role="status"></p>
  <details><summary>Optional · What if openings occur only once per million minutes?</summary>
    <p>Now suppose you work at a different plant. The valve drops the pressure by the same amount when it opens, but openings are much rarer. Before you see the pressure readings, a closed valve is a much stronger expectation. Choose a frequency to generate historical records for that plant and refit the model.</p>
    <div class="controls"><div class="control"><label for="valve-prior">Source opening frequency</label><select id="valve-prior"><option value="0.001">1 in 1,000 minutes</option><option value="0.000001">1 in 1,000,000 minutes</option></select></div></div>
    <p>With the log missing, the fall from 1.00 to 0.50 still favors an opening. At the rarer plant that evidence raises the theoretical opening probability from one in a million to about 14%. Allowing for both possible valve histories gives a 9.76% alarm chance. Check the training count above: a sample containing zero openings gives this learner an estimated opening frequency of zero.</p>
  </details>
<details><summary>Optional calculation · How the known source parameters give the theoretical benchmark</summary>
  <p>The calculation works in three steps. First calculate the alarm chance assuming the valve stayed closed. Repeat assuming it opened once. When the log is missing, average those two answers using the chances of each valve history given the readings.</p>
  <p>With source parameters, Section 8’s pressure equation is \(X_t=1.00+0.10W_t-0.60N_t\). Here \(N_t\) counts openings by time \(t\). The following values use one opening per 1,000 comparable minutes.</p>
  <p><strong>Valve closed.</strong> The endpoint distances above the alarm are \(1.00-0.45=0.55\) and \(0.50-0.45=0.05\). Apply the bridge formula from ${link('learning','crossing-between-readings','Example 3')} over one minute:</p>
  \[q_0=\exp\!\left(-\frac{2(0.55)(0.05)}{0.10^2}\right)=e^{-5.5}\approx0.00409.\]
  <p><strong>One opening.</strong> Add the \(0.60\) drop back to the final reading. The continuous part now joins \(1.00\) to \(1.10\). At a possible opening time \(t\), the pressure \(z\) just before the drop therefore has a normal distribution with mean \(1.00+0.10t\) and variance \(0.10^2t(1-t)\). Just after the drop the pressure is \(z-0.60\).</p>
  <p>For a particular \(t,z\), use Example 3 twice. Write \(r(a,c;h)\) for the chance a bridge from \(a\) to \(c\) touches the lower threshold in a gap of length \(h\). It equals 1 when either end is at or below the threshold. Given the pressure at the opening, the two bridge segments are independent. The chance of an alarm on either segment is</p>
  \[1-\big[1-r(1.00,z;t)\big]\big[1-r(z-0.60,0.50;1-t)\big].\]
  <p>Average this expression over the normal distribution of \(z\) and the uniform opening time \(t\). Numerical integration gives \(q_1\approx0.67216\). The end readings update the chance of an opening but leave its time uniform here. A single fixed drop has the same effect on the final reading whenever it occurs.</p>
  <p><strong>Log missing.</strong> Let \(\pi\) be the opening frequency from earlier records and \(w\) the chance of an opening given these two readings. The endpoint likelihood ratio is \(L=e^{(5^2-1^2)/2}=e^{12}\). Update the opening probability, then weight the two alarm probabilities:</p>
  \[w=\frac{\pi L}{1-\pi+\pi L},\qquad P(\text{alarm}\mid\text{readings})=(1-w)q_0+wq_1.\]
  <p>At one opening per 1,000 minutes, \(w\approx0.99390\). The resulting alarm probability is \((1-0.99390)(0.00409)+0.99390(0.67216)\approx66.81\%\). The learned jump model repeats this calculation with its fitted noise strength and fitted opening frequency.</p>
</details>
</div>
</div>
<div class="story">
`;
