// Pure simulation routines. Every draw is seeded; no browser or network dependency.
export function rng(seed=1) {
  let state=seed>>>0;
  return () => {state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function gaussian(random) {
  let spare;
  return () => {if(spare!==undefined){const z=spare;spare=undefined;return z;}const u=Math.max(random(),Number.MIN_VALUE),v=random(),r=Math.sqrt(-2*Math.log(u)),a=2*Math.PI*v;spare=r*Math.sin(a);return r*Math.cos(a);};
}
export function moments(values) {
  let mean=0,m2=0,n=0;for(const x of values){n++;const d=x-mean;mean+=d/n;m2+=d*(x-mean);}return {mean,variance:n?m2/n:0};
}
export const normalPdf=(x,mean=0,sd=1)=>Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI));
export const SCALING_VIEWS=Object.freeze({close:Object.freeze([-4,4]),wide:Object.freeze([-128,128])});
export function scalingParameters(n,mode){
  if(!Number.isInteger(n)||n<1)throw new Error('A positive integer step count is required');
  const dt=1/n,dx=mode==='brownian'?Math.sqrt(dt):mode==='small'?dt:mode==='large'?1:NaN;
  if(!Number.isFinite(dx))throw new Error('Unknown scaling choice');
  return {n,dt,dx,variance:n*dx*dx,sd:Math.sqrt(n)*dx};
}
export function histogramDensity(values,bins,[lo,hi]){
  const width=(hi-lo)/bins,counts=new Array(bins).fill(0);let inside=0;
  for(const x of values){if(x<lo||x>hi)continue;const k=Math.min(bins-1,Math.floor((x-lo)/width));counts[k]++;inside++;}
  return {points:counts.map((c,k)=>[lo+(k+.5)*width,c/(values.length*width)]),width,inside,outside:values.length-inside};
}
export function latticeDensityHistogram(values,spacing,[lo,hi],maxBins=81){
  // Odd groups keep bin centers on the endpoint lattice (which includes zero here).
  let group=Math.max(1,Math.ceil((hi-lo)/(maxBins*spacing)));if(group%2===0)group++;
  const width=group*spacing,counts=new Map();let inside=0;
  for(const x of values){const k=Math.floor(x/width+.5);counts.set(k,(counts.get(k)??0)+1);if(x>=lo&&x<=hi)inside++;}
  const points=Array.from(counts,([k,c])=>[k*width,c/(values.length*width)]).filter(([x])=>x+width/2>=lo&&x-width/2<=hi).sort((a,b)=>a[0]-b[0]);
  return {points,width,inside,outside:values.length-inside};
}
export function binomial(n,p) {
  const masses=[];let c=1;for(let k=0;k<=n;k++){if(k)c=c*(n-k+1)/k;masses.push(c*p**k*(1-p)**(n-k));}return masses;
}
export function walks(n,p,dx,seed,count=2000) {
  const random=rng(seed),endpoints=[],paths=[];
  for(let m=0;m<count;m++){let x=0;const path=m<12?[0]:null;for(let i=0;i<n;i++){x+=(random()<p?1:-1)*dx;if(path)path.push(x);}endpoints.push(x);if(path)paths.push(path);}return {paths,endpoints};
}
export function brownian(n,T,seed,count=1) {
  const z=gaussian(rng(seed)),step=Math.sqrt(T/n),paths=[];
  for(let m=0;m<count;m++){const w=new Float64Array(n+1);for(let i=1;i<=n;i++)w[i]=w[i-1]+step*z();paths.push(w);}return paths;
}
export function partition(w,n) {
  const stride=(w.length-1)/n;if(!Number.isInteger(stride))throw new Error('Partition must divide the fine grid');
  const path=[w[0]],q=[0],left=[0];let tv=0;
  for(let i=1;i<=n;i++){const x=w[i*stride],d=x-path[i-1];left.push(left[i-1]+path[i-1]*d);q.push(q[i-1]+d*d);tv+=Math.abs(d);path.push(x);}return {path,q,left,tv};
}
export function ouVariance(theta,sigma,t) {return theta===0?sigma*sigma*t:sigma*sigma*(-Math.expm1(-2*theta*t))/(2*theta);}
export function ou(theta,sigma,T,n,seed,count=20,x0=0) {
  const z=gaussian(rng(seed)),decay=Math.exp(-theta*T/n),sd=Math.sqrt(ouVariance(theta,sigma,T/n)),paths=[];
  for(let m=0;m<count;m++){const path=[x0];for(let i=0;i<n;i++)path.push(decay*path[i]+sd*z());paths.push(path);}return paths;
}
export const gbm=(s0,mu,sigma,t,w)=>s0*Math.exp((mu-.5*sigma*sigma)*t+sigma*w);
export function lambdaIntegral(w,lambda) {
  const integral=[0];for(let i=1;i<w.length;i++)integral.push(integral[i-1]+((1-lambda)*w[i-1]+lambda*w[i])*(w[i]-w[i-1]));return integral;
}
export function jumpDiffusion(rate,size,seed,T=2,n=256,sigma=.4) {
  const w=brownian(n,T,seed)[0],random=rng(seed+700),z=gaussian(rng(seed+800));const events=[];
  if(rate>0){let t=0;while(true){t+=-Math.log(Math.max(random(),Number.MIN_VALUE))/rate;if(t>T)break;events.push({t,jump:random()<.5?-size:size});}}
  const base=[],jumped=[];let j=0,total=0;
  for(let i=0;i<n;i++){const t0=i*T/n,t1=(i+1)*T/n;let bt=t0,bw=w[i];if(i===0){base.push([0,0]);jumped.push([0,0]);}
    while(j<events.length&&events[j].t<=t1){const e=events[j++],u=(e.t-bt)/(t1-bt);bw=bw+u*(w[i+1]-bw)+Math.sqrt(Math.max(0,(e.t-bt)*(t1-e.t)/(t1-bt)))*z();bt=e.t;base.push([e.t,sigma*bw]);jumped.push([e.t,sigma*bw+total]);total+=e.jump;jumped.push([e.t,sigma*bw+total]);}
    base.push([t1,sigma*w[i+1]]);jumped.push([t1,sigma*w[i+1]+total]);}
  return {base,jumped,events};
}
export const mixtureVariance=(g,t)=>.09+g*g*t;
export const mixturePdf=(x,g,t)=>.5*(normalPdf(x,-2,Math.sqrt(mixtureVariance(g,t)))+normalPdf(x,2,Math.sqrt(mixtureVariance(g,t))));
export const mixtureScore=(x,g,t)=>(2*Math.tanh(2*x/mixtureVariance(g,t))-x)/mixtureVariance(g,t);
export function reverseDiffusion(g,seed,count=4000,n=1000) {
  const random=rng(seed),normal=gaussian(random),terminalSd=Math.sqrt(mixtureVariance(g,1));
  const initial=Float64Array.from({length:count},()=> (random()<.5?-2:2)+terminalSd*normal());
  const sde=initial.slice(),ode=initial.slice(),snapS=[sde.slice()],snapO=[ode.slice()];
  const pathsS=Array.from({length:20},(_,i)=>[initial[i]]),pathsO=Array.from({length:20},(_,i)=>[initial[i]]);
  const h=1/n,root=Math.sqrt(h),g2=g*g,noise=gaussian(rng(seed+12345));
  for(let k=0;k<n;k++){const t=1-k*h;for(let m=0;m<count;m++){
    sde[m]+=g2*mixtureScore(sde[m],g,t)*h+g*root*noise();
    const velocity=.5*g2*mixtureScore(ode[m],g,t),predictor=ode[m]+h*velocity;
    ode[m]+=.5*h*(velocity+.5*g2*mixtureScore(predictor,g,Math.max(0,t-h)));
    if(m<20){pathsS[m].push(sde[m]);pathsO[m].push(ode[m]);}}
    if((k+1)%(n/20)===0){snapS.push(sde.slice());snapO.push(ode.slice());}}
  return {snapS,snapO,pathsS,pathsO};
}
