import test from 'node:test';
import assert from 'node:assert/strict';
import { ouComparison } from '../src/ou-comparison.js';
import { ou, ouVariance, moments } from '../src/math.js';
const close=(a,b,tol)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test('zero restoring drift makes every Euler grid agree with the same Brownian path',()=>{
  const data=ouComparison(0,.8,29,32);
  for(const level of data.levels){
    assert.ok(level.rmse<1e-12);
    for(let i=0;i<=level.n;i++)close(level.example[i],data.exact[i*1024/level.n],1e-12);
  }
});

test('zero noise isolates the deterministic Euler error and exact exponential return',()=>{
  const data=ouComparison(1,0,29,8);
  close(data.exact.at(-1),Math.exp(-4),1e-12);
  for(const level of data.levels)close(level.example.at(-1),(1-4/level.n)**level.n,1e-12);
  assert.ok(data.levels.at(-1).rmse<data.levels[0].rmse/50);
  const paths=ou(1,0,4,160,29,3,1.5);
  paths.forEach(path=>{close(path[0],1.5,1e-12);close(path.at(-1),1.5*Math.exp(-4),1e-12);});
});

test('coupled exact OU samples have the correct moments and Brownian cross moment',()=>{
  const data=ouComparison(1,.8,42,4000),stats=moments(data.exactEnds);
  close(stats.mean,Math.exp(-4),.03);
  close(stats.variance,ouVariance(1,.8,4),.025);
  const cross=data.exactEnds.reduce((sum,x,i)=>sum+x*data.noiseEnds[i]/data.count,0);
  close(cross,.8*(1-Math.exp(-4)),.08);
  assert.ok(data.levels.at(-1).rmse<data.levels[0].rmse/50);
});
