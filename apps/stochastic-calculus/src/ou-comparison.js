import { rng, gaussian, ouVariance } from './math.js';

// J = integral exp(-theta*(h-s)) dW_s is jointly Gaussian with delta W.
// Cov(J,delta W) = (1-exp(-theta*h))/theta. The independent residual
// completes the joint law and couples the exact and Euler updates.
export function ouComparison(theta,sigma,seed,count=256) {
  const T=4,finest=1024,h=T/finest,x0=1,z=gaussian(rng(seed));
  const decay=Math.exp(-theta*h);
  const covariance=theta===0?h:-Math.expm1(-theta*h)/theta;
  const weight=covariance/h;
  const residual=Math.sqrt(Math.max(0,ouVariance(theta,1,h)-covariance*weight));
  const levels=Array.from({length:8},(_,k)=>({n:2**(k+3),error2:0,example:[]}));
  const exactEnds=[],noiseEnds=[];
  let exactExample;
  for(let m=0;m<count;m++){
    const dw=new Float64Array(finest),exact=[x0];
    for(let i=0;i<finest;i++){
      dw[i]=Math.sqrt(h)*z();
      const integral=weight*dw[i]+residual*z();
      exact.push(decay*exact[i]+sigma*integral);
    }
    exactEnds.push(exact[finest]);
    noiseEnds.push(dw.reduce((sum,x)=>sum+x,0));
    if(m===0)exactExample=exact;
    for(const level of levels){
      const stride=finest/level.n,dt=T/level.n;
      let x=x0;
      if(m===0)level.example.push(x);
      for(let i=0;i<level.n;i++){
        let increment=0;
        for(let j=i*stride;j<(i+1)*stride;j++)increment+=dw[j];
        x+=-theta*x*dt+sigma*increment;
        if(m===0)level.example.push(x);
      }
      level.error2+=(x-exact[finest])**2/count;
    }
  }
  return {T,x0,count,exact:exactExample,exactEnds,noiseEnds,
    levels:levels.map(({error2,...level})=>({...level,rmse:Math.sqrt(error2)}))};
}
