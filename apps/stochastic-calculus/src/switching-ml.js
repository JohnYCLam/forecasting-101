// Learned nonlinear dynamics and a nonparametric discrete-time comparator.
// Source, fitting, and held-out simulation use separate seeds and functions.
import { rng, gaussian } from './math.js';
export const OBS_STEP = .05;
export const SOURCE_STEP = .005;
export const SOLVER_STEP = .01;
export const THRESHOLD = .75;
export const ENSEMBLE = 2000;
export const sourceDrift = x => x - x*x*x;

function solve(matrix, vector) {
  const a=matrix.map((row,i)=>[...row,vector[i]]),n=vector.length;
  for(let k=0;k<n;k++) {
    let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
    [a[k],a[pivot]]=[a[pivot],a[k]];
    if(Math.abs(a[k][k])<1e-12)throw new Error('Insufficient variation to fit drift');
    const divisor=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=divisor;
    for(let i=0;i<n;i++)if(i!==k){const r=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=r*a[k][j];}
  }
  return a.map(row=>row[n]);
}

export function trainingData(sigma,count,seed=4401) {
  const random=rng(seed),normal=gaussian(random),pairs=[],paths=[];
  for(let j=0;j<count;j++) {
    let x=-1.8+3.6*random();const path=[x];
    for(let i=0;i<80;i++) {
      const before=x;
      for(let k=0;k<10;k++)x+=sourceDrift(x)*SOURCE_STEP+sigma*Math.sqrt(SOURCE_STEP)*normal();
      pairs.push([before,x]);path.push(x);
    }
    paths.push(path);
  }
  return {pairs,paths};
}

export function fit(pairs) {
  const matrix=Array.from({length:4},()=>[0,0,0,0]),vector=[0,0,0,0];
  for(const [x,y] of pairs){const f=[1,x,x*x,x*x*x],v=(y-x)/OBS_STEP;
    for(let i=0;i<4;i++){vector[i]+=f[i]*v;for(let j=0;j<4;j++)matrix[i][j]+=f[i]*f[j];}}
  const coefficients=solve(matrix,vector);
  let variance=0;
  for(const [x,y]of pairs)variance+=(y-x-drift({coefficients},x)*OBS_STEP)**2/(pairs.length*OBS_STEP);
  return {coefficients,sigma:Math.sqrt(variance),n:pairs.length};
}
export const drift=(model,x)=>model.coefficients[0]+x*(model.coefficients[1]+x*(model.coefficients[2]+x*model.coefficients[3]));

export function kernel(pairs,neighbors=64) {
  const sorted=pairs.map(([x,y])=>[x,y-x]).sort((a,b)=>a[0]-b[0]);
  return {sorted,neighbors:Math.min(neighbors,sorted.length)};
}
function lowerBound(values,x,get) {
  let lo=0,hi=values.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(get(values[mid])<x)lo=mid+1;else hi=mid;}
  return lo;
}
function increment(k,x,random) {
  let left=lowerBound(k.sorted,x,row=>row[0])-1,right=left+1;
  // Select the actual nearest k training states, including at the boundaries.
  for(let i=0;i<k.neighbors;i++){
    if(left<0)right++;
    else if(right>=k.sorted.length)left--;
    else if(x-k.sorted[left][0]<=k.sorted[right][0]-x)left--;
    else right++;
  }
  return k.sorted[left+1+Math.floor(random()*k.neighbors)][1];
}

// Retain only 12 plotted paths; all endpoints and first hits enter evaluation.
export function simulate(kind,model,x0,T,count,seed,step=SOLVER_STEP) {
  const random=rng(seed),normal=gaussian(random),steps=Math.round(T/OBS_STEP),paths=[],endpoints=[],hits=[];
  const substeps=Math.round(OBS_STEP/step),dt=OBS_STEP/substeps,mean=new Array(steps+1).fill(0);
  for(let j=0;j<count;j++) {
    let x=x0,hit=x>=THRESHOLD?0:Infinity;const path=[x];mean[0]+=x/count;
    for(let i=1;i<=steps;i++) {
      if(kind==='kernel')x+=increment(model,x,random);
      else for(let k=0;k<substeps;k++) {
        const f=kind==='source'?sourceDrift(x):drift(model,x);
        const sigma=kind==='point'?0:model.sigma;
        x+=f*dt+sigma*Math.sqrt(dt)*normal();
      }
      if(!Number.isFinite(x))throw new Error('Simulation diverged; reduce the integration step');
      if(hit===Infinity&&x>=THRESHOLD)hit=i;
      mean[i]+=x/count;
      if(j<12)path.push(x);
    }
    if(j<12)paths.push(path);endpoints.push(x);hits.push(hit);
  }
  const cumulative=Array.from({length:steps+1},(_,i)=>hits.filter(h=>h<=i).length/count);
  return {paths,endpoints,hits,cumulative,mean,probability:cumulative[steps]};
}

export function crps(samples,observations) {
  const sorted=[...samples].sort((a,b)=>a-b),n=sorted.length,prefix=[0];
  let halfPair=0;
  sorted.forEach((x,i)=>{prefix.push(prefix[i]+x);halfPair+=(2*i-n+1)*x/(n*n);});
  let total=0;
  for(const y of observations){const k=lowerBound(sorted,y,x=>x);
    total+=(k*y-prefix[k]+prefix[n]-prefix[k]-(n-k)*y)/n-halfPair;}
  return total/observations.length;
}
export function scores(prediction,test) {
  const p=prediction.probability,q=test.probability;
  return {crps:crps(prediction.endpoints,test.endpoints),brier:q*(1-p)**2+(1-q)*p*p};
}
