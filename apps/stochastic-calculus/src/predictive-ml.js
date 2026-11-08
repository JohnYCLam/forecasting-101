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
  return { a, b, variance, n };
}

export function forecast(model, x0, steps) {
  const mean = [x0], variance = [0];
  for (let i = 0; i < steps; i++) {
    mean.push(model.a * mean[i] + model.b);
    variance.push(model.a ** 2 * variance[i] + model.variance);
  }
  return { mean, variance, lower: mean.map((m, i) => m - Z90 * Math.sqrt(variance[i])), upper: mean.map((m, i) => m + Z90 * Math.sqrt(variance[i])) };
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
