import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/math.js';
import { chapters } from '../src/lesson.js';
import {codeExamples} from '../src/content/reference.js';
import sourceCoverage from '../src/coverage.json' with {type:'json'};
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b} (tolerance ${tol})`);

test('complete lesson renders LaTeX before HTML insertion',()=>{
  let displayCount=0,total=0;const ids=new Set();
  for(const chapter of chapters){const html=chapter.html();displayCount+=(html.match(/class="katex-display"/g)||[]).length;total+=(html.match(/class="katex"/g)||[]).length;assert.ok(!html.includes('katex-error'),chapter.id);const withoutCode=html.replace(/<pre>[\s\S]*?<\/pre>/g,'');assert.ok(!/\\\(|\\\[/.test(withoutCode),`${chapter.id}: unrendered formula`);for(const [,id]of html.matchAll(/\sid="([^"]+)"/g)){assert.ok(!ids.has(id),`Duplicate element id: ${id}`);ids.add(id);}}
  assert.ok(displayCount>=85);assert.ok(total>=400);
});
test('every source heading maps to an existing discussion or restored code appendix',()=>{
  const htmls=Object.fromEntries(chapters.map(ch=>[ch.id,ch.html()]));
  assert.equal(sourceCoverage.length,54);assert.equal(codeExamples.length,9);
  for(const row of sourceCoverage)assert.ok(htmls[row.chapter]?.includes(`data-section="${row.section}"`),`Missing destination for ${row.sourceTitle}`);
});
test('opening has no demo and the experiments follow their prerequisite explanations',()=>{
  const htmls=Object.fromEntries(chapters.map(ch=>[ch.id,ch.html()]));
  assert.ok(!htmls.intro.includes('data-lab='));assert.ok(!htmls.intro.includes('Start with a coin flip'));
  assert.ok(htmls.intro.indexOf('steady-motion')<htmls.intro.indexOf('uncertain-steps'));
  assert.ok(htmls.walk.indexOf('coin-model')<htmls.walk.indexOf('data-lab="coin"'));
  assert.ok(htmls.walk.indexOf('binomial')<htmls.walk.indexOf('data-lab="walk"'));
  assert.ok(htmls.sde.indexOf('data-section="additive"')<htmls.sde.indexOf('data-lab="drift"'));
  assert.ok(htmls.ito.includes('class="ito-table"'));
  assert.ok(htmls.diffusion.indexOf('reverse-sde')<htmls.diffusion.indexOf('data-lab="diffusion"'));
});

test('binomial probabilities normalize and agree with walk moments',()=>{
  for(const p of [.1,.5,.9]){const n=17,m=M.binomial(n,p);close(m.reduce((a,b)=>a+b),1);const mean=m.reduce((a,v,k)=>a+v*(2*k-n),0);close(mean,n*(2*p-1));close(m.reduce((a,v,k)=>a+v*(2*k-n-mean)**2,0),4*n*p*(1-p));}
  close(M.binomial(3,.5)[2],3/8);
});
test('the three step scalings preserve, shrink, or grow the endpoint variance',()=>{
  for(const n of [8,64,1024]){
    for(const [mode,variance] of [['brownian',1],['small',1/n],['large',n]]){
      const p=M.scalingParameters(n,mode);close(p.dt,1/n);close(p.variance,variance);close(p.sd**2,variance);
    }
  }
  assert.deepEqual(M.SCALING_VIEWS,{close:[-4,4],wide:[-128,128]});
});
test('fixed-window histograms account for outside samples without putting them in edge bins',()=>{
  const h=M.histogramDensity([-100,-1,0,1,100],2,[-1,1]);
  assert.equal(h.inside,3);assert.equal(h.outside,2);
  close(h.points.reduce((sum,[,density])=>sum+density*h.width,0),3/5);
  close(h.points[1][1],2/5);
  const lattice=M.latticeDensityHistogram([-4,-2,0,0,2,4],2,[-10,10]);
  close(lattice.points.reduce((sum,[,density])=>sum+density*lattice.width,0),1);
  const cropped=M.latticeDensityHistogram([-4,-2,0,0,2,4],2,[-1,1]);
  assert.equal(cropped.inside,2);assert.equal(cropped.outside,4);
});
test('early chapters explain the construction before the calculus that needs it',()=>{
  const html=Object.fromEntries(chapters.map(ch=>[ch.id,ch.html()]));
  assert.ok(html.walk.includes('Replay this sequence'));assert.ok(html.walk.includes('Draw a new sequence'));
  assert.ok(html.walk.includes('shade is not a calibrated path count'));
  assert.ok(html.scaling.indexOf('Give the walk a clock')<html.scaling.indexOf('data-lab="scaling"'));
  assert.ok(html.brownian.indexOf('What has our coin walk become')<html.brownian.indexOf('Write down the model'));
  const taylor=html.ito.indexOf('data-section="ito-lemma"'),weighted=html.ito.indexOf('Why does the second derivative act as a multiplier?');
  assert.ok(taylor>=0&&weighted>taylor);
  assert.ok(!html.ito.includes('conditional mean'));assert.ok(html.reference.includes('conditional mean'));
});
test('Gaussian generator is deterministic with the required moments',()=>{
  const a=M.gaussian(M.rng(729)),b=M.gaussian(M.rng(729));for(let i=0;i<100;i++)close(a(),b());
  const z=M.gaussian(M.rng(17)),m=M.moments(Array.from({length:100000},z));close(m.mean,0,.015);close(m.variance,1,.02);
});
test('finite quadratic-variation and integral identities hold at every nested partition',()=>{
  const w=M.brownian(4096,1,83)[0];for(const n of [8,64,512,4096]){const p=M.partition(w,n);close(p.left[n],.5*w[4096]**2-.5*p.q[n]);for(const lambda of [0,.2,.5,1]){const I=M.lambdaIntegral(p.path,lambda);close(I[n],.5*w[4096]**2+(lambda-.5)*p.q[n]);}}
});
test('Brownian endpoint and quadratic variation have their theoretical moments',()=>{
  const paths=M.brownian(256,2,123,6000),ends=paths.map(w=>w[256]),q=paths.map(w=>M.partition(w,256).q[256]);
  close(M.moments(ends).mean,0,.06);close(M.moments(ends).variance,2,.12);close(M.moments(q).mean,2,.02);close(M.moments(q).variance,8/256,.004);
});
test('OU transitions have correct variance and the Brownian limit',()=>{
  close(M.ouVariance(0,.8,4),2.56);close(M.ouVariance(1,.8,4),.32*(1-Math.exp(-8)));
  const paths=M.ou(1,.8,4,80,29,5000);close(M.moments(paths.map(p=>p[80])).variance,M.ouVariance(1,.8,4),.02);
});
test('multiplicative model conversion preserves the exact solution',()=>{
  const mu=.1,sigma=.65,t=2,w=-.3,aS=mu-.5*sigma*sigma;
  close(M.gbm(1,mu,sigma,t,w),Math.exp(aS*t+sigma*w));
  close(Math.exp(mu*t+sigma*w)/M.gbm(1,mu,sigma,t,w),Math.exp(.5*sigma*sigma*t));
  close(M.gbm(100,.12,0,10,99),100*Math.exp(1.2));
});
test('fractional covariance factorization matches the desired increment law',()=>{
  for(const H of [.2,.5,.8]){const L=M.fractionalCholesky(H,48);for(let i=0;i<48;i++)for(let j=0;j<=i;j++){let v=0;for(let k=0;k<=j;k++)v+=L[i][k]*L[j][k];close(v,M.fractionalCorrelation(H,i-j),1e-10);}}
  close(M.fractionalCorrelation(.5,1),0);assert.ok(M.fractionalCorrelation(.3,1)<0);assert.ok(M.fractionalCorrelation(.7,1)>0);
});
test('jump events use ordered times and exact vertical jump sizes',()=>{
  assert.equal(M.jumpDiffusion(0,.8,1).events.length,0);const d=M.jumpDiffusion(5,.8,17);assert.ok(d.events.length>0);
  let seen=0;for(let i=1;i<d.jumped.length;i++){const prev=d.jumped[i-1],next=d.jumped[i];if(prev[0]===next[0]){close(Math.abs(next[1]-prev[1]),.8);seen++;}}
  assert.equal(seen,d.events.length);for(let i=1;i<d.events.length;i++)assert.ok(d.events[i].t>d.events[i-1].t);
});
test('analytic mixture score equals a numerical log-density derivative',()=>{
  for(const t of [0,.25,1])for(const x of [-5,-2,-.1,0,.8,2,5]){const h=1e-5,derivative=(Math.log(M.mixturePdf(x+h,1.8,t))-Math.log(M.mixturePdf(x-h,1.8,t)))/(2*h);close(M.mixtureScore(x,1.8,t),derivative,2e-6);}
});
test('reverse SDE and ODE recover mixture moments and separated modes',()=>{
  const d=M.reverseDiffusion(1.8,147,6000,1000);assert.equal(d.snapS.length,21);assert.deepEqual(d.snapS[0],d.snapO[0]);
  for(const snapshots of [d.snapS,d.snapO])for(const k of [0,10,20]){const m=M.moments(snapshots[k]),target=4+M.mixtureVariance(1.8,1-k/20);close(m.mean,0,.11);close(m.variance,target,.25);}
  for(const samples of [d.snapS[20],d.snapO[20]]){const signs=samples.filter(x=>x>0).length/samples.length;close(signs,.5,.035);close(M.moments(Array.from(samples,x=>Math.abs(x)-2)).variance,.09,.016);}
});
