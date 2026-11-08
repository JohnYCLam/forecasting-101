import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../src/switching-ml.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} versus ${b}`);

test('cubic regression learns coefficients from observed transitions without source labels',()=>{
  const coefficients=[.2,.7,-.1,-.9];
  const pairs=Array.from({length:201},(_,i)=>{const x=-2+i/50;return [x,x+S.OBS_STEP*S.drift({coefficients},x)];});
  const fitted=S.fit(pairs);
  fitted.coefficients.forEach((c,i)=>close(c,coefficients[i]));assert.ok(fitted.sigma<1e-12);
  const data=S.trainingData(.8,512,4401),learned=S.fit(data.pairs);
  close(learned.coefficients[0],0,.08);close(learned.coefficients[1],1,.17);
  close(learned.coefficients[2],0,.08);close(learned.coefficients[3],-1,.17);close(learned.sigma,.8,.06);
});

test('CRPS rewards the correct two-mode distribution and reduces to absolute error for a point',()=>{
  close(S.crps([1],[0,2]),1);close(S.crps([0,2],[1]),.5);
  close(S.crps([-1,1],[-1,1]),.5);close(S.crps([0],[-1,1]),1);
  const p={probability:.2,endpoints:[0]},q={probability:.3,endpoints:[0]};
  close(S.scores(p,q).brier,.22);
});

test('first hits are counted on the observation grid and cumulative probabilities never fall',()=>{
  const p=S.simulate('point',{coefficients:[2,0,0,0],sigma:0},0,1,1,2);
  assert.equal(p.hits[0],8);assert.equal(p.cumulative[7],0);assert.equal(p.cumulative[8],1);
  for(let i=1;i<p.cumulative.length;i++)assert.ok(p.cumulative[i]>=p.cumulative[i-1]);
  const zero={coefficients:[0,1,0,-1],sigma:0};
  const deterministic=S.simulate('point',zero,-1,2,1,4),stochastic=S.simulate('sde',zero,-1,2,100,5);
  close(stochastic.mean.at(-1),deterministic.mean.at(-1));assert.equal(stochastic.probability,0);
});

test('both learned probabilistic models recover switching and improve endpoint scores on fresh source paths',()=>{
  const data=S.trainingData(.8,512,4401),model=S.fit(data.pairs),testPaths=S.simulate('source',{sigma:.8},-1,6,6000,992,S.SOURCE_STEP);
  const point=S.simulate('point',model,-1,6,1,173),pointScore=S.scores(point,testPaths);
  for(const [kind,fitted]of [['sde',model],['kernel',S.kernel(data.pairs)]]) {
    const p=S.simulate(kind,fitted,-1,6,4000,173),scores=S.scores(p,testPaths);
    close(p.probability,testPaths.probability,.08);
    assert.ok(scores.crps<pointScore.crps*.8);assert.ok(scores.brier<pointScore.brier);
    assert.ok(p.endpoints.filter(x=>x>0).length>p.endpoints.length*.15);
    assert.ok(p.endpoints.filter(x=>x<0).length>p.endpoints.length*.4);
  }
});

test('source event frequencies and endpoint distributions are stable under step refinement',()=>{
  const a=S.simulate('source',{sigma:.8},-1,6,6000,617,.005);
  const b=S.simulate('source',{sigma:.8},-1,6,6000,911,.0025);
  close(a.probability,b.probability,.04);close(a.mean.at(-1),b.mean.at(-1),.06);
  // Draws are independent; this is a distribution check, not pathwise convergence.
  assert.ok(Math.abs(S.crps(a.endpoints,b.endpoints)-S.crps(b.endpoints,b.endpoints))<.02);
});
