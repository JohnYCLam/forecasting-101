import test from 'node:test';
import assert from 'node:assert/strict';
import { learner, train, evaluate, testPaths, intervals, sensitivity } from '../src/bsde.js';

test('the exact multiplier has only the predicted finite-grid error',()=>{
  const paths=testPaths(17719,1500);
  const expected=paths.reduce((s,w)=>{
    let q=0;for(let i=0;i<intervals;i++)q+=(w[i+1]-w[i])**2;
    return s+(1-q)**2;
  },0)/paths.length;
  assert.ok(Math.abs(evaluate(learner(),paths).exactLoss-expected)<1e-12);
  assert.ok(Math.abs(expected-2/intervals)<.025);
});
test('training on terminal payoffs learns the starting value and improves unseen predictions',()=>{
  const model=learner(),tests=[testPaths(),testPaths(424156,512)];
  const baseline=tests.map(paths=>evaluate(model,paths).loss);
  train(model,160);
  assert.ok(Math.abs(model.weights[0]-1)<.1);
  for(const x of [-1,-.5,.5,1])assert.ok(Math.abs(sensitivity(model,.5,x)-2*x)<.55);
  for(const [i,paths] of tests.entries()){
    const {loss,exactLoss}=evaluate(model,paths);
    assert.ok(loss<baseline[i]/4 && loss<exactLoss+.05);
  }
});
