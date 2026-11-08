import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../src/barrier-ml.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} versus ${b}`);
const rows=H.testData(1207,6000);

test('irregular-increment likelihood recovers drift and diffusion without event labels',()=>{
  const fitted=H.fit(H.trainingData(1.2,16384,927));
  close(fitted.mu,.2,.06);close(fitted.sigma,1.2,.025);
  const noiseless=H.fit(H.trainingData(0,128,82));
  close(noiseless.mu,.2);assert.ok(noiseless.sigma<1e-12);
});

test('bridge crossing formula matches reflection examples and conditional gap composition',()=>{
  close(H.segmentCrossing(0,0,1,1,1),Math.exp(-2));
  close(H.segmentCrossing(.2,.4,.5,.8,1),Math.exp(-2*.8*.6/(.8*.8*.5)));
  close(H.crossingProbability([0,.4,0],1,1),1-(1-Math.exp(-2.4))**2);
  assert.equal(H.crossingProbability([0,1,0],1,1),1);
  assert.equal(H.crossingProbability([0,0],0,1),0);
  assert.ok(H.crossingProbability([0,0],.4,1.5)>0);
});

test('source bridges pin both endpoints and exact maxima include every drawing-point crossing',()=>{
  for(const row of rows) {
    assert.equal(row.observed[0],0);assert.equal(row.observed.at(-1),0);
    assert.ok(row.continuousMax+1e-12>=row.fineMax);
  }
  const p=H.path(1207,5);
  assert.equal(p.values[0],0);assert.equal(p.values.at(-1),0);
  for(let i=0;i<=64;i++)close(p.observed[i],p.values[i*16]);
  const index=H.findMissed(rows,1,1,1);
  assert.ok(index!==null);assert.ok(rows[index].fineMax>=1);
  assert.ok(H.observe(rows[index],1,1).every(x=>x<1));
  assert.equal(H.findMissed(rows,64,1,20),null);
});

test('nested observation checks miss continuous events while corrected rates match their analytic reference',()=>{
  let previous=0;
  const exact=Math.exp(-2);
  for(const intervals of [1,2,4,8,16,32,64]) {
    const r=H.evaluate(rows,intervals,1,1,1);
    assert.ok(r.seen>=previous);previous=r.seen;
    assert.ok(r.seen<=r.fine&&r.fine<=r.actual);
    close(r.actual,exact,.014);close(r.predicted,exact,.014);
    assert.ok(r.bridgeBrier<r.seenBrier);
    if(intervals===1){assert.equal(r.seen,0);close(r.predicted,exact);}
  }
});

test('continuous source labels agree across independent fine-grid constructions',()=>{
  let hits=0,n=5000;
  for(let i=0;i<n;i++)hits+=H.path(7411,i,2048).continuousMax>=1?1:0;
  close(hits/n,Math.exp(-2),.016);
});

test('calibration groups retain their observed event counts without using small bins',()=>{
  const groups=H.reliability(Array(40).fill(.2).concat(Array(30).fill(.9),[.5]),Array(8).fill(1).concat(Array(32).fill(0),Array(27).fill(1),Array(4).fill(0)));
  assert.equal(groups.length,2);assert.equal(groups[0].count,40);assert.equal(groups[1].count,30);
  close(groups[0].predicted,.2);close(groups[0].observed,.2);close(groups[1].observed,.9);
});
