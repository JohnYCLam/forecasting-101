import { rng, gaussian } from './math.js';
import { segmentCrossing } from './barrier-ml.js';

const start = 1, end = 0.50, alarm = 0.45, drop = 0.60, sigma = 0.10;
const lowerTouch = (a, b, h, noise) => segmentCrossing(-a, -b, h, noise, -alarm);

function integrate(f, left, right, panels) {
  const width = (right - left) / panels;
  let sum = f(left) + f(right);
  for (let i = 1; i < panels; i++) sum += (i % 2 ? 4 : 2) * f(left + i * width);
  return sum * width / 3;
}

// Given one opening, the Brownian component joins start to end + drop.
// Condition on its value at the opening and apply a bridge on either side.
function openAlarmProbability(noise) {
  return integrate(u => {
    if (u === 0 || u === 1) return 0;
    const t = Math.sin(Math.PI * u / 2) ** 2;
    const mean = start + t * (end + drop - start);
    const sd = noise * Math.sqrt(t * (1 - t));
    const integrand = z => {
      const before = mean + sd * z, after = before - drop;
      const first = lowerTouch(start, before, t, noise);
      const second = lowerTouch(after, end, 1 - t, noise);
      return (first + (1 - first) * second) * Math.exp(-z*z/2) / Math.sqrt(2*Math.PI);
    };
    // Split at the pre-opening value where the valve drop itself triggers the alarm.
    const cut = Math.max(-9, Math.min(9, (alarm + drop - mean) / sd));
    const conditional = integrate(integrand, -9, cut, 96) + integrate(integrand, cut, 9, 96);
    return conditional * Math.PI * Math.sin(Math.PI * u) / 2;
  }, 0, 1, 128);
}

export function historicalMinutes(count, prior, seed) {
  const random = rng(seed);
  const normal = gaussian(random);
  return Array.from({length: count}, () => {
    const opened = random() < prior;
    const change = sigma * normal() - (opened ? drop : 0);
    return {opened, change};
  });
}

export function fitValveHistory(records) {
  let openings = 0, sumSquares = 0;
  for (const {opened, change} of records) {
    if (opened) openings++;
    const residual = change + (opened ? drop : 0);
    sumSquares += residual * residual;
  }
  return {openings, prior: openings / records.length, sigma: Math.sqrt(sumSquares / records.length)};
}

export function valveRisks(noise) {
  return {
    closed: lowerTouch(start, end, 1, noise),
    opened: openAlarmProbability(noise),
    logLikelihoodRatio: ((end - start)**2 - (end - start + drop)**2) / (2 * noise**2)
  };
}

export const sourceRisks = valveRisks(sigma);
export const closedAlarm = sourceRisks.closed;
export const openedAlarm = sourceRisks.opened;

export function inferValve(prior, risks = sourceRisks) {
  let opened = prior;
  if (prior > 0 && prior < 1) {
    const logOdds = Math.log(prior) - Math.log1p(-prior) + risks.logLikelihoodRatio;
    opened = 1 / (1 + Math.exp(-logOdds));
  }
  return {opened, alarm: (1 - opened) * risks.closed + opened * risks.opened};
}
