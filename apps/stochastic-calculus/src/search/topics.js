// Search labels for headings whose display titles describe an activity or analogy.
export const topics = {
  'ito/finite-increments':'Brownian increments, Gaussian steps and square root of elapsed time',
  'ito/quadratic-variation':'Brownian quadratic variation. Accumulated squared increments converge to elapsed time.',
  'ito/demo-qv':'Quadratic variation experiment. Compare squared increments and absolute changes on one path.',
  'ito/ito-lemma':'Itô’s lemma, stochastic chain rule and second derivative correction',
  'ito/multiplication-table':'Itô multiplication table for dW², dt dW and dt²',
  'sde/mean-reversion':'Mean reversion. A restoring drift pulls the process back to its long-run average.',
  'sde/demo-sde':'Ornstein–Uhlenbeck mean reversion simulation',
  'sde/volatility-drag':'Volatility drag in geometric Brownian motion. Typical compound growth, median stock price and mean price.',
  'sde/demo-gbm':'Geometric Brownian motion experiment comparing mean and median price paths',
  'sde/demo-euler':'Euler–Maruyama numerical simulation versus the exact Ornstein–Uhlenbeck solution',
  'stratonovich/demo-lambda':'Interactive Itô, midpoint and Stratonovich integration conventions',
  'reference/notation':'Glossary of stochastic calculus notation and mathematical symbols'
};

export function topic(passage) {
  const anchor = passage.href.slice(1);
  return topics[anchor] ?? anchor.split('/').at(-1).replaceAll('-',' ');
}
