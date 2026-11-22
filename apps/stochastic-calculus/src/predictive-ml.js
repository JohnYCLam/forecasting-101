// A deliberately small learned model: least-squares conditional mean, then
// Gaussian maximum-likelihood residual variance. No truth parameters enter fit().
import { rng, gaussian } from './math.js';

export const STEP = 0.1;
export const TRUE_RATE = 0.8;
export const TRUE_LEVEL = 0.4;
export const Z90 = 1.6448536269514722;

export function transition(sigma, h = STEP) {
  const a = Math.exp(-TRUE_RATE * h);
  return { a, b: TRUE_LEVEL * (1 - a), variance: sigma ** 2 * (1 - a * a) / (2 * TRUE_RATE) };
}

export function trainingData(sigma, count, seed = 73) {
  const random = rng(seed), normal = gaussian(random), law = transition(sigma);
  const paths = [], pairs = [];
  for (let j = 0; j < count; j++) {
    const path = [-2.5 + 5 * random()];
    for (let i = 0; i < 20; i++) {
      const x = path[i], next = law.a * x + law.b + Math.sqrt(law.variance) * normal();
      pairs.push([x, next]); path.push(next);
    }
    paths.push(path);
  }
  return { paths, pairs };
}

export function fit(pairs) {
  const n = pairs.length;
  if (n < 3) throw new Error('At least three transitions are required');
  let mx = 0, my = 0;
  for (const [x, y] of pairs) { mx += x / n; my += y / n; }
  let xx = 0, xy = 0;
  for (const [x, y] of pairs) { xx += (x - mx) ** 2; xy += (x - mx) * (y - my); }
  if (xx < 1e-20) throw new Error('Training inputs must vary');
  const a = xy / xx, b = my - a * mx;
  let variance = 0;
  for (const [x, y] of pairs) variance += (y - a * x - b) ** 2 / n;
  // Avoid an artificial microscopic band for numerically exact, noiseless data.
  if (variance < 1e-24) variance = 0;
  return { a, b, variance, n, inputMean: mx, inputSumSquares: xx };
}

// Gaussian transition regression with reference prior p(a,b,v) proportional to 1/v.
// The demo fits at least 160 transitions. The Student-t quantile expansion below
// is accurate to better than 1e-7 at the smallest supported degrees of freedom.
export function compareOneStep(model, x) {
  const { a, b, variance, n, inputMean, inputSumSquares } = model;
  const df = n - 2;
  const leverage = 1 / n + (x - inputMean) ** 2 / inputSumSquares;
  const z = Z90;
  const t = z + (z ** 3 + z) / (4 * df)
    + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2)
    + (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3);
  const scale = Math.sqrt(n * variance / df);
  return {
    mean: a * x + b,
    fixedFuture: z * Math.sqrt(variance),
    bayesMean: t * scale * Math.sqrt(leverage),
    bayesFuture: t * scale * Math.sqrt(1 + leverage)
  };
}

export function forecast(model, x0, steps) {
  const mean = [x0], variance = [0];
  for (let i = 0; i < steps; i++) {
    mean.push(model.a * mean[i] + model.b);
    variance.push(model.a ** 2 * variance[i] + model.variance);
  }
  return { mean, variance, lower: mean.map((m, i) => m - Z90 * Math.sqrt(variance[i])), upper: mean.map((m, i) => m + Z90 * Math.sqrt(variance[i])) };
}

// The lesson fits at least 160 transitions. On that range the omitted Student-t
// tail beyond ±12 is negligible. Normalize the density on the integration grid.
function studentGrid(df, bins) {
  const step = 24 / bins;
  const weights = Array.from({ length: bins }, (_, i) => {
    const z = -12 + (i + 0.5) * step;
    return Math.exp(-0.5 * (df + 1) * Math.log1p(z * z / df));
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  return weights.map(w => w / total);
}

export function bayesianForecast(model, x0, steps) {
  const result = { mean: [x0], lower: [x0], upper: [x0] };
  if (steps === 0) return result;
  if (model.variance === 0) {
    const { mean, lower, upper } = forecast(model, x0, steps);
    return { mean, lower, upper };
  }
  const one = compareOneStep(model, x0);
  result.mean.push(one.mean);
  result.lower.push(one.mean - one.bayesFuture);
  result.upper.push(one.mean + one.bayesFuture);
  if (steps === 1) return result;

  // Integrate over the marginal Student-t posterior for the slope. Conditional
  // on a slope, integrating out the intercept and variance gives another t
  // distribution for each future reading. One slope and intercept apply to the
  // whole trajectory; independent disturbances accumulate at every step.
  const df = model.n - 2;
  const rss = model.n * model.variance;
  const slopeScale = Math.sqrt(rss / (df * model.inputSumSquares));
  const weights = studentGrid(df, 192);
  const components = weights.map((weight, i) => {
    const z = -12 + (i + 0.5) * 24 / weights.length;
    const delta = slopeScale * z;
    return {
      weight, slope: model.a + delta, intercept: model.b - delta * model.inputMean,
      noiseScale: Math.sqrt((rss + model.inputSumSquares * delta * delta) / (df + 1)),
      location: x0, interceptFactor: 0, processFactor: 0, scale: 0
    };
  });
  const cdf = [0];
  for (const mass of studentGrid(df + 1, 8192)) cdf.push(cdf.at(-1) + mass);
  function probabilityBelow(z) {
    if (z <= -12) return 0;
    if (z >= 12) return 1;
    const position = (z + 12) * (cdf.length - 1) / 24;
    const i = Math.min(Math.floor(position), cdf.length - 2);
    return cdf[i] + (position - i) * (cdf[i + 1] - cdf[i]);
  }
  function quantile(p, left, right) {
    for (let i = 0; i < 40; i++) {
      const mid = (left + right) / 2;
      let cumulative = 0;
      for (const c of components) cumulative += c.weight * probabilityBelow((mid - c.location) / c.scale);
      if (cumulative < p) left = mid;
      else right = mid;
    }
    return (left + right) / 2;
  }
  for (let k = 1; k <= steps; k++) {
    let mean = 0, left = Infinity, right = -Infinity;
    for (const c of components) {
      c.location = c.slope * c.location + c.intercept;
      c.interceptFactor = 1 + c.slope * c.interceptFactor;
      c.processFactor = 1 + c.slope ** 2 * c.processFactor;
      c.scale = c.noiseScale * Math.sqrt(c.processFactor + c.interceptFactor ** 2 / model.n);
      mean += c.weight * c.location;
      left = Math.min(left, c.location - 3 * c.scale);
      right = Math.max(right, c.location + 3 * c.scale);
    }
    if (k > 1) {
      result.mean.push(mean);
      result.lower.push(quantile(0.05, left, right));
      result.upper.push(quantile(0.95, left, right));
    }
  }
  return result;
}

export function sample(model, x0, steps, count, seed) {
  const normal = gaussian(rng(seed)), paths = [], sd = Math.sqrt(model.variance);
  for (let j = 0; j < count; j++) {
    const path = [x0];
    for (let i = 0; i < steps; i++) path.push(model.a * path[i] + model.b + sd * normal());
    paths.push(path);
  }
  return paths;
}

export function evaluate(prediction, paths) {
  const last = prediction.mean.length - 1, mu = prediction.mean[last];
  let squared = 0, covered = 0;
  for (const p of paths) {
    const y = p[last]; squared += (y - mu) ** 2;
    if (y >= prediction.lower[last] - 1e-10 && y <= prediction.upper[last] + 1e-10) covered++;
  }
  return { rmse: Math.sqrt(squared / paths.length), coverage: covered / paths.length };
}
