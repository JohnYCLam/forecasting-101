import { prose, h, check } from './helpers.js';
import { deepBsde } from './deep-bsde.js';
export const payoffLearning = demos => prose`
${h('payoff-question','A different task: what is a future payoff worth today?')}
<p>Generating a new sample and valuing an uncertain future outcome ask different questions. Here we specify a stochastic state model and a payoff at a future time. We seek a function giving its value now, then show how a neural network can approximate such a function.</p>
<p>Black–Scholes supplies a financial example of this question. We will derive its pricing equation, explain what that equation determines, then train a network on a simpler payoff whose exact answer we can check. The browser trainer solves that simpler problem, not a Black–Scholes option.</p>
${h('finance','Application: where option pricing enters')}
<p>An option is a contract with a payoff depending on a future price. For example, a call pays \(g(S_T)=\max(S_T-K,0)\) at expiry \(T\), where \(K\) is its agreed purchase price. Write \(V(t,S)\) for its current value when the underlying asset price is \(S\). Section 6 supplied the geometric Brownian motion model \(\mathrm dS=\mu S\,\mathrm dt+\sigma S\,\mathrm dW\).</p>
<p>The classical Black–Scholes calculation assumes frictionless continuous trading with constant volatility and a constant risk-free interest rate \(r\), the rate earned by the model’s bank account. We seek a price that permits no arbitrage under these assumptions. A hedge offsets sensitivity to the next price change. Here \(V_t=\partial V/\partial t\), \(V_S=\partial V/\partial S\), and \(V_{SS}\) is the second price derivative.</p>
<p>Apply Section 6’s Itô chain rule to the option value. The asset-price model gives:</p>
\[\mathrm dV=\left(V_t+\mu SV_S+\tfrac12\sigma^2S^2V_{SS}\right)\mathrm dt+\sigma SV_S\,\mathrm dW.\]
<p>For one hedge interval, hold the option and short \(\delta=V_S(t,S)\) shares. Subtract the gain on those shares from the option’s change. Both the price-drift term and the random term cancel:</p>
\[\begin{aligned}
\mathrm dV-\delta\,\mathrm dS
&=\left(V_t+\mu SV_S+\tfrac12\sigma^2S^2V_{SS}-V_S\mu S\right)\mathrm dt\\
&\quad+(\sigma SV_S-V_S\sigma S)\,\mathrm dW\\
&=\left(V_t+\tfrac12\sigma^2S^2V_{SS}\right)\mathrm dt.
\end{aligned}\]
<p>The hedged position has value \(V-SV_S\). Adjustments in shares are financed through the cash account, so this is a self-financing strategy. Its locally riskless gain must earn the bank-account rate \(r\), giving:</p>
\[(V_t+\tfrac12\sigma^2 S^2 V_{SS})\,\mathrm dt=r(V-SV_S)\,\mathrm dt.\]
<p>Collect terms and specify the contract’s payoff \(V(T,S)=g(S)\) at expiry to obtain the pricing problem:</p>
\[V_t+\frac12\sigma^2S^2V_{SS}+rSV_S-rV=0.\]
<p>This is the connection between the random price model and a deterministic partial differential equation (PDE) for the option value. It requires assumptions about trading, financing, volatility, and the absence of arbitrage; the physical drift \(\mu\) is not simply an option-pricing formula. This is a mathematical illustration, not a forecast of actual prices.</p>
<p><strong>What did we obtain?</strong> A deterministic equation for the unknown price function \(V(t,S)\), together with its terminal payoff. This is different from finding the asset-price path \(S_t\). For a well-behaved payoff, its solution also has the risk-neutral expectation representation:</p>
\[V(t,S)=e^{-r(T-t)}\mathbb E^{\mathbb Q}[g(S_T)\mid S_t=S],\qquad \mathrm dS_t=rS_t\,\mathrm dt+\sigma S_t\,\mathrm dW_t^{\mathbb Q}.\]
<p>The superscript \(\mathbb Q\) denotes the pricing probability law: the drift under this law is \(r\). The discount factor converts the future payoff to a present value. This is not the same as averaging real-world prices with drift \(\mu\).</p>
<p>There is no learning in the hedge derivation itself. Learning enters when a network approximates the unknown value or its sensitivity. We now make that role concrete on a simpler problem with no discounting and an exact answer.</p>
` + deepBsde(demos);
