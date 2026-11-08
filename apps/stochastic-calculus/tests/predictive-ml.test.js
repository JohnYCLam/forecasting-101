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

test('zero process noise collapses the forecast band and survives fitting roundoff', () => {
  const fitted=P.fit(P.trainingData(0,8,73).pairs),prediction=P.forecast(fitted,2,40);
  const paths=P.sample(P.transition(0),2,40,30,991),result=P.evaluate(prediction,paths);
  assert.equal(fitted.variance,0);assert.deepEqual(prediction.lower,prediction.upper);
  assert.ok(result.rmse<1e-10);assert.equal(result.coverage,1);
});
