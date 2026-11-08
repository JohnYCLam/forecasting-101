// Constant-coefficient diffusion fitted from independent, irregular increments.
// Test data are conditioned on X(0)=X(1)=0: an independent unit Brownian bridge.
import { rng, gaussian } from './math.js';
export const FINE_STEPS=1024;
export const MAX_OBSERVATIONS=64;
export const TEST_COUNT=4000;

export function trainingData(sigma,count,seed=927) {
  const random=rng(seed),normal=gaussian(random),increments=[];
  for(let i=0;i<count;i++) {
    const dt=.03+.22*random();
    increments.push({dt,dx:.2*dt+sigma*Math.sqrt(dt)*normal()});
  }
  return increments;
}

export function fit(increments) {
  let duration=0,displacement=0;
  for(const {dt,dx}of increments){duration+=dt;displacement+=dx;}
  const mu=displacement/duration;
  let variance=0;
  for(const {dt,dx}of increments)variance+=(dx-mu*dt)**2/dt/increments.length;
  return {mu,sigma:Math.sqrt(variance),count:increments.length};
}

export function segmentCrossing(x,y,dt,sigma,barrier) {
  if(Math.max(x,y)>=barrier)return 1;
  if(sigma===0)return 0;
  return Math.exp(-2*(barrier-x)*(barrier-y)/(sigma*sigma*dt));
}

export function crossingProbability(observed,sigma,barrier) {
  const dt=1/(observed.length-1);let logSurvival=0;
  for(let i=1;i<observed.length;i++) {
    const p=segmentCrossing(observed[i-1],observed[i],dt,sigma,barrier);
    if(p===1)return 1;
    logSurvival+=Math.log1p(-p);
  }
  return logSurvival===0?0:-Math.expm1(logSurvival);
}

export function observe(row,intervals,sigma) {
  const stride=MAX_OBSERVATIONS/intervals;
  return Array.from({length:intervals+1},(_,i)=>sigma*row.observed[i*stride]);
}

export function path(seed,index,steps=FINE_STEPS) {
  const normal=gaussian(rng((seed+Math.imul(index+1,7919))>>>0));
  const maxRandom=rng((seed^Math.imul(index+1,104729)^0x9e3779b9)>>>0);
  const values=new Float64Array(steps+1),dt=1/steps;
  for(let i=1;i<=steps;i++)values[i]=values[i-1]+Math.sqrt(dt)*normal();
  const endpoint=values[steps];
  for(let i=0;i<=steps;i++)values[i]-=i/steps*endpoint;
  let fineMax=0,continuousMax=0;
  for(let i=1;i<=steps;i++) {
    const x=values[i-1],y=values[i];fineMax=Math.max(fineMax,y);
    // Exact segment maximum conditional on its endpoints, using an independent
    // uniform. This includes excursions between the 1,024 drawing points.
    const u=Math.max(maxRandom(),Number.MIN_VALUE);
    const maximum=(x+y+Math.sqrt((x-y)**2-2*dt*Math.log(u)))/2;
    continuousMax=Math.max(continuousMax,maximum);
  }
  const stride=steps/MAX_OBSERVATIONS;
  if(!Number.isInteger(stride))throw new Error('Fine grid must contain the observation grid');
  return {values,fineMax,continuousMax,observed:Float64Array.from({length:MAX_OBSERVATIONS+1},(_,i)=>values[i*stride])};
}

export function testData(seed=1207,count=TEST_COUNT) {
  return Array.from({length:count},(_,i)=>{const {values,...row}=path(seed,i);return row;});
}

export function findMissed(rows,intervals,sigma,barrier,after=-1) {
  for(let k=1;k<=rows.length;k++) {
    const index=(after+k)%rows.length,row=rows[index];
    if(sigma*row.fineMax>=barrier&&observe(row,intervals,sigma).every(x=>x<barrier))return index;
  }
  return null;
}

export function evaluate(rows,intervals,sourceSigma,fittedSigma,barrier) {
  let actual=0,fine=0,seen=0,predicted=0,seenBrier=0,bridgeBrier=0;
  const predictions=[],labels=[];
  for(const row of rows) {
    const observed=observe(row,intervals,sourceSigma);
    const label=sourceSigma*row.continuousMax>=barrier?1:0;
    const sampled=observed.some(x=>x>=barrier)?1:0;
    const probability=crossingProbability(observed,fittedSigma,barrier);
    actual+=label;fine+=sourceSigma*row.fineMax>=barrier?1:0;
    seen+=sampled;predicted+=probability;
    seenBrier+=(sampled-label)**2;bridgeBrier+=(probability-label)**2;
    predictions.push(probability);labels.push(label);
  }
  const n=rows.length;
  return {actual:actual/n,fine:fine/n,seen:seen/n,predicted:predicted/n,seenBrier:seenBrier/n,bridgeBrier:bridgeBrier/n,predictions,labels};
}

export function reliability(predictions,labels,bins=8) {
  const groups=Array.from({length:bins},()=>({sum:0,hits:0,count:0}));
  predictions.forEach((p,i)=>{const g=groups[Math.min(bins-1,Math.floor(p*bins))];g.sum+=p;g.hits+=labels[i];g.count++;});
  return groups.filter(g=>g.count>=20).map(g=>({predicted:g.sum/g.count,observed:g.hits/g.count,count:g.count}));
}
