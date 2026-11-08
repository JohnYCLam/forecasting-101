import { rng, gaussian, brownian } from './math.js';

export const intervals=16;
const width=8, size=2+4*width;
export function learner(seed=1441){
  const r=rng(seed), weights=new Float64Array(size);
  // weights[0] is the initial value; weights[1] is the scalar output bias.
  for(let k=0;k<width;k++){
    const j=2+4*k;
    weights.set([(k%2?1:-1)*(.4+r()),r()-.5,r()-.5,(r()-.5)*.2],j);
  }
  return {weights,m:new Float64Array(size),v:new Float64Array(size),step:0,normal:gaussian(rng(seed+11))};
}
export function sensitivity(model,t,x,gradient,dw=0){
  const w=model.weights;let z=w[1];
  if(gradient)gradient[1]+=dw;
  for(let j=2;j<size;j+=4){
    const a=w[j]*x+w[j+1]*t+w[j+2];if(a<=0)continue;
    z+=w[j+3]*a;
    if(gradient){
      const d=dw*w[j+3];gradient[j]+=d*x;gradient[j+1]+=d*t;
      gradient[j+2]+=d;gradient[j+3]+=dw*a;
    }
  }
  return z;
}
export function train(model,updates=40,batch=48){
  const {weights:w,m,v,normal}=model,grad=new Float64Array(size),pathGrad=new Float64Array(size);
  for(let s=0;s<updates;s++){
    grad.fill(0);
    for(let p=0;p<batch;p++){
      let x=0,y=w[0];pathGrad.fill(0);pathGrad[0]=1;
      for(let i=0;i<intervals;i++){
        const dw=normal()/Math.sqrt(intervals);
        y+=sensitivity(model,i/intervals,x,pathGrad,dw)*dw;x+=dw;
      }
      const d=2*(y-x*x)/batch;
      for(let j=0;j<size;j++)grad[j]+=d*pathGrad[j];
    }
    const k=++model.step;
    for(let j=0;j<size;j++){
      m[j]=.9*m[j]+.1*grad[j];v[j]=.999*v[j]+.001*grad[j]**2;
      w[j]-=.012*(m[j]/(1-.9**k))/(Math.sqrt(v[j]/(1-.999**k))+1e-8);
    }
  }
}
export const testPaths=(seed=971237,count=512)=>brownian(intervals,1,seed,count);
export function evaluate(model,paths){
  let loss=0,exactLoss=0;
  for(const path of paths){
    let y=model.weights[0],exact=1;
    for(let i=0;i<intervals;i++){
      const dw=path[i+1]-path[i];
      y+=sensitivity(model,i/intervals,path[i])*dw;exact+=2*path[i]*dw;
    }
    const target=path[intervals]**2;
    loss+=(y-target)**2;exactLoss+=(exact-target)**2;
  }
  return {loss:loss/paths.length,exactLoss:exactLoss/paths.length};
}
