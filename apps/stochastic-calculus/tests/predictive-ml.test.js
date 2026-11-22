import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/predictive-ml.js';
const close = (a,b,tol=1e-10) => assert.ok(Math.abs(a-b)<tol, `${a} versus ${b}`);

test('observations alone recover the generating transition and its residual variance', () => {
  const truth=P.transition(.7), fitted=P.fit(P.trainingData(.7,512,73).pairs);
  close(fitted.a,truth.a,.006);close(fitted.b,truth.b,.01);close(fitted.variance,truth.variance,.002);
  const manual=P.fit([[0,1],[1,3],[2,5],[3,7]]);
  close(manual.a,2);close(manual.b,1);assert.equal(manual.variance,0);
});

test('multistep forecast matches analytic OU moments, including accumulated process variance', () => {
  for(const sigma of [0,.3,1.2])for(const steps of [1,5,40]) {
    const f=P.forecast(P.transition(sigma),2,steps),t=steps*P.STEP;
    close(f.mean[steps],P.TRUE_LEVEL+(2-P.TRUE_LEVEL)*Math.exp(-P.TRUE_RATE*t));
    close(f.variance[steps],sigma**2*(1-Math.exp(-2*P.TRUE_RATE*t))/(2*P.TRUE_RATE));
    close(f.upper[steps]-f.mean[steps],P.Z90*Math.sqrt(f.variance[steps]));
  }
});

test('learned forecast gives calibrated endpoint intervals on independently generated futures', () => {
  const fitted=P.fit(P.trainingData(.7,512,73).pairs),prediction=P.forecast(fitted,2,30);
  const tests=P.sample(P.transition(.7),2,40,12000,991),result=P.evaluate(prediction,tests);
  close(result.coverage,.9,.02);
  const theoretical=P.forecast(P.transition(.7),2,30);
  close(result.rmse,Math.sqrt(theoretical.variance[30]+(prediction.mean[30]-theoretical.mean[30])**2),.015);
  assert.deepEqual(P.sample(P.transition(.7),2,40,3,991),tests.slice(0,3));
});

test('one-step Bayesian intervals distinguish the future from its conditional mean', () => {
  const model = P.fit(P.trainingData(.7, 8, 73).pairs);
  const x = model.inputMean;
  const result = P.compareOneStep(model, x);
  const next = P.forecast(model, x, 1);
  close(result.mean, next.mean[1]);
  close(result.fixedFuture, next.upper[1] - result.mean);
  // 95th percentile of Student t with 158 degrees of freedom.
  const scale = Math.sqrt(model.variance * model.n / (model.n - 2));
  close(result.bayesMean / (scale / Math.sqrt(model.n)), 1.654555, .00001);
  close(result.bayesFuture / result.bayesMean, Math.sqrt(model.n + 1));
  assert.ok(result.bayesFuture > result.fixedFuture);
  assert.ok(P.compareOneStep(model, x + 2).bayesMean > result.bayesMean);
  const noiseless = P.compareOneStep(P.fit(P.trainingData(0, 8, 73).pairs), 2);
  assert.equal(noiseless.bayesFuture, 0);
  assert.equal(noiseless.bayesMean, 0);
});

test('Bayesian forecast bands start at the reading and preserve the exact one-step comparison', () => {
  const model = P.fit(P.trainingData(.7, 8, 73).pairs);
  const x = 2, band = P.bayesianForecast(model, x, 40), one = P.compareOneStep(model, x);
  assert.equal(band.lower[0], x);
  assert.equal(band.upper[0], x);
  close(band.lower[1], one.mean - one.bayesFuture);
  close(band.upper[1], one.mean + one.bayesFuture);
  // Holding a slope draw across steps adds Var(a) * (x - inputMean) at step two.
  const slopeVariance = model.n * model.variance / ((model.n - 4) * model.inputSumSquares);
  close(band.mean[2], P.forecast(model, x, 2).mean[2] + slopeVariance * (x - model.inputMean));
  for (let k = 1; k <= 40; k++) assert.ok(band.lower[k] < band.mean[k] && band.mean[k] < band.upper[k]);
  const exact = P.fit(P.trainingData(0, 8, 73).pairs);
  assert.deepEqual(P.bayesianForecast(exact, x, 40).lower, P.forecast(exact, x, 40).mean);
});

test('later predictive quantiles integrate fresh disturbances and a shared uncertain intercept', () => {
  // With effectively known unit slope, the k-step Student-t scale is analytic.
  const model = { n: 160, a: 1, b: 0.1, variance: 0.25, inputMean: 0, inputSumSquares: 1e24 };
  const band = P.bayesianForecast(model, 2, 20);
  const k = 20, center = 2 + k * model.b;
  const halfWidth = 1.654554875 * Math.sqrt(160 * 0.25 / 158 * (k + k ** 2 / 160));
  close(band.upper[k], center + halfWidth, 1e-5);
  close(band.lower[k], center - halfWidth, 1e-5);
});

test('zero process noise collapses the forecast band and survives fitting roundoff', () => {
  const fitted=P.fit(P.trainingData(0,8,73).pairs),prediction=P.forecast(fitted,2,40);
  const paths=P.sample(P.transition(0),2,40,30,991),result=P.evaluate(prediction,paths);
  assert.equal(fitted.variance,0);assert.deepEqual(prediction.lower,prediction.upper);
  assert.ok(result.rmse<1e-10);assert.equal(result.coverage,1);
});
