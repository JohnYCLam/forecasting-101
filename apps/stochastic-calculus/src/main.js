import './style.css';
import 'katex/dist/katex.min.css';
import '../../../site/theme.css';
import { chapters } from './lesson.js';
import * as M from './math.js';
import * as B from './bsde.js';
import * as P from './predictive-ml.js';
import * as S from './switching-ml.js';
import * as H from './barrier-ml.js';
import { ouComparison } from './ou-comparison.js';
import { pendingTopics } from '../../../site/navigation.js';
import scope from '../../../course-scope.json' with { type: 'json' };
let model=B.learner();
const heldOut=B.testPaths();
let barrierSelectedIndex=null;

const $=id=>document.getElementById(id);
const C={};
function refreshPalette(){
  const styles=getComputedStyle(document.documentElement);
  for(const key of ['teal','coral','blue','gray','gold','muted','line'])C[key]=styles.getPropertyValue(`--${key}`).trim();
}
refreshPalette();
const store=new Map(),seeds={coin:42};let active='intro',replayTimer,coinCount=0,coinSequence=1,coinMessage='Reveal the tosses one at a time.';
const seed=id=>seeds[id]??(seeds[id]=Array.from(id).reduce((s,c)=>Math.imul(s,31)+c.charCodeAt(0),1234)>>>0);
const cached=(id,key,create)=>{const k=`${id}:${seed(id)}:${key}`;if(!store.has(k))store.set(k,create());return store.get(k);};
function clear(id){for(const k of store.keys())if(k.startsWith(id+':'))store.delete(k);}
const value=id=>Number($(id).value);
function out(id,text){$(id).textContent=text;}
const fmt=(x,d=3)=>!Number.isFinite(x)?'—':Math.abs(x)>=10000||Math.abs(x)>0&&Math.abs(x)<.001?x.toExponential(2):x.toLocaleString('en',{maximumFractionDigits:d,minimumFractionDigits:d});
function slider(id,label){out(`${id}-value`,label??fmt(value(id),2));}
const series=(ys,T=1)=>Array.from(ys,(y,i)=>[i*T/(ys.length-1),y]);
function limits(paths,pad=.13,includeZero=true){let lo=includeZero?0:Infinity,hi=includeZero?0:-Infinity;for(const path of paths)for(const y of path){lo=Math.min(lo,y);hi=Math.max(hi,y);}const extra=Math.max(.1,(hi-lo)*pad);return [lo-extra,hi+extra];}
function chart(id,xlim,ylim,xlabel='Time t',ylabel='Value',options={}){
  const canvas=$(id),w=canvas.clientWidth,h=canvas.clientHeight;if(!w)return null;
  canvas.dataset.xMin=xlim[0];canvas.dataset.xMax=xlim[1];
  const ratio=window.devicePixelRatio||1;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);
  const tick=x=>Math.abs(x)<1e-8?'0':Math.abs(x)>=10000?x.toExponential(0):Math.abs(x)<.01?x.toExponential(1):Number(x.toPrecision(3)).toString();
  const rawStep=(ylim[1]-ylim[0])/4,power=10**Math.floor(Math.log10(rawStep)),fraction=rawStep/power;
  const step=([1,2,2.5,5,10].find(n=>n>=fraction)??10)*power;
  const yt=options.yTicks??Array.from({length:Math.max(1,Math.floor((ylim[1]-Math.ceil(ylim[0]/step)*step)/step)+1)},(_,i)=>Math.ceil(ylim[0]/step)*step+i*step);
  ctx.font='11px system-ui';ctx.fillStyle=C.muted;ctx.lineWidth=1;
  const labelWidth=Math.max(...yt.map(y=>ctx.measureText(options.yFormat?options.yFormat(y):tick(y)).width),20);
  const pad={l:Math.max(49,labelWidth+27),r:20,t:17,b:48},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
  const xp=x=>pad.l+(x-xlim[0])/(xlim[1]-xlim[0])*pw,yp=y=>h-pad.b-(y-ylim[0])/(ylim[1]-ylim[0])*ph;
  for(const y of yt){if(y<ylim[0]||y>ylim[1])continue;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(pad.l,yp(y));ctx.lineTo(w-pad.r,yp(y));ctx.stroke();ctx.textAlign='right';ctx.fillText(options.yFormat?options.yFormat(y):tick(y),pad.l-8,yp(y)+3);}
  const xCount=pw<240?2:4;
  const xt=options.xTicks??Array.from({length:xCount+1},(_,i)=>xlim[0]+i*(xlim[1]-xlim[0])/xCount);
  for(const x of xt){ctx.textAlign='center';ctx.fillText(options.xFormat?options.xFormat(x):tick(x),xp(x),h-pad.b+18);}
  ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();
  ctx.textAlign='center';ctx.fillText(xlabel,pad.l+pw/2,h-7);ctx.save();ctx.translate(12,pad.t+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText(ylabel,0,0);ctx.restore();
  function clipped(draw){ctx.save();ctx.beginPath();ctx.rect(pad.l,pad.t,pw,ph);ctx.clip();draw();ctx.restore();}
  return {band(lower,upper,color=C.teal){clipped(()=>{ctx.fillStyle=color;ctx.globalAlpha=.14;ctx.beginPath();[...lower,...upper.toReversed()].forEach(([x,y],i)=>i?ctx.lineTo(xp(x),yp(y)):ctx.moveTo(xp(x),yp(y)));ctx.closePath();ctx.fill();});},line(points,color=C.teal,width=1.7,dash=[],alpha=1){clipped(()=>{ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(xp(x),yp(y)):ctx.moveTo(xp(x),yp(y)));ctx.stroke();});},bars(points,width,color=C.teal,alpha=.45,outline=false){clipped(()=>{ctx.fillStyle=color;ctx.strokeStyle=color;ctx.globalAlpha=alpha;for(const [x,y] of points){const xx=xp(x-width/2),ww=Math.max(.5,xp(x+width/2)-xx);if(outline){ctx.setLineDash([3,2]);ctx.lineWidth=1.6;ctx.strokeRect(xx,yp(Math.max(0,y)),ww,Math.abs(yp(y)-yp(0)));}else ctx.fillRect(xx,Math.min(yp(y),yp(0)),ww,Math.abs(yp(y)-yp(0)));}});},point(x,y,color=C.coral){clipped(()=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(xp(x),yp(y),4,0,Math.PI*2);ctx.fill();});}};
}
function lines(id,paths,T,ylim,reference=[],options={}){
  const c=chart(id,[0,T],ylim??limits(paths),'Time t',options.ylabel??'Position',options);if(!c)return;
  paths.forEach((p,i)=>c.line(series(p,T),options.color??C.teal,i===0?1.7:1,[],i===0?.9:.24));
  for(const r of reference)c.line(r.points??series(r.values,T),r.color??C.coral,r.width??2,r.dash??[],r.alpha??1);
  return c;
}
const histogram=(values,bins,xlim)=>M.histogramDensity(values,bins,xlim);
function densityPlot(id,values,xlim,pdf,color=C.teal,bins=40){
  const h=histogram(values,bins,xlim),curve=Array.from({length:401},(_,i)=>{const x=xlim[0]+i/400*(xlim[1]-xlim[0]);return [x,pdf(x)];});
  const max=Math.max(...h.points.map(p=>p[1]),...curve.map(p=>p[1]))*1.12;
  const c=chart(id,xlim,[0,max],'Position x','Density');if(!c)return;c.bars(h.points,h.width*.94,color);c.line(curve,C.coral,2);
}
function lattice(values,n,dx){const counts=new Array(n+1).fill(0);for(const x of values)counts[Math.round((x/dx+n)/2)]++;return counts.map((c,k)=>[(2*k-n)*dx,c/values.length]);}
function fixedScalingDensity(id,values,dx,sd,xlim){
  const hist=M.latticeDensityHistogram(values,2*dx,xlim);
  // Include a fine grid around zero so a narrow peak stays accurate in the wide view.
  const xs=new Set(Array.from({length:401},(_,i)=>xlim[0]+i/400*(xlim[1]-xlim[0])));
  for(let i=0;i<=200;i++){const x=(i/20-5)*sd;if(x>=xlim[0]&&x<=xlim[1])xs.add(x);}
  const curve=Array.from(xs).sort((a,b)=>a-b).map(x=>[x,M.normalPdf(x,0,sd)]);
  const top=1.15*Math.max(M.normalPdf(0,0,sd),...hist.points.map(p=>p[1]));
  const c=chart(id,xlim,[0,top],'Final position x · fixed scale','Density');
  c?.bars(hist.points,hist.width*.92);c?.line(curve,C.coral,2);
  for(const x of [-sd,sd])c?.line([[x,0],[x,top]],C.blue,1.3,[4,4]);
  return hist;
}

const renderers={
euler(){
  const theta=value('euler-theta'),sigma=value('euler-sigma'),n=2**value('euler-k');
  slider('euler-theta');slider('euler-sigma');slider('euler-k',`${n} intervals`);
  const data=cached('euler',`${theta}:${sigma}`,()=>ouComparison(theta,sigma,seed('euler')));
  const selected=data.levels.find(level=>level.n===n);
  const c=chart('euler-path',[0,data.T],limits([data.exact,selected.example]),'Time t','State');
  c?.line(series(data.exact,data.T),C.teal,2);c?.line(series(selected.example,data.T),C.coral,2,[5,4]);
  const errors=data.levels.map(level=>level.rmse);
  const d=chart('euler-error',[3,10],[0,Math.max(1e-5,...errors)*1.12],'Number of intervals · nested grids','Endpoint RMSE',{xTicks:[3,5,7,10],xFormat:k=>2**k});
  d?.line(data.levels.map(level=>[Math.log2(level.n),level.rmse]),C.teal,2.3);d?.point(Math.log2(n),selected.rmse,C.coral);
  out('euler-step',fmt(data.T/n,5));out('euler-rmse',selected.rmse<1e-12?'0 · roundoff only':fmt(selected.rmse,5));
},
barrier(){
  const intervals=2**value('barrier-observations'),barrier=value('barrier-threshold'),sigma=value('barrier-sigma'),count=value('barrier-count');
  slider('barrier-observations',`${intervals} · gap ${fmt(1/intervals,3)}`);slider('barrier-threshold');slider('barrier-sigma');
  const fitted=cached('barrier',`fit:${sigma}:${count}`,()=>H.fit(H.trainingData(sigma,count,seed('barrier'))));
  const rows=cached('barrier-test','source',()=>H.testData(seed('barrier-test')));
  const results=cached('barrier',`evaluation:${seed('barrier-test')}:${sigma}:${count}:${barrier}`,()=>Array.from({length:7},(_,k)=>H.evaluate(rows,2**k,sigma,fitted.sigma,barrier)));
  const current=results[value('barrier-observations')],exact=H.segmentCrossing(0,0,1,sigma,barrier);
  const missed=H.findMissed(rows,intervals,sigma,barrier,barrierSelectedIndex??-1);
  if(barrierSelectedIndex===null)barrierSelectedIndex=missed??0;
  $('barrier-example').disabled=missed===null;
  const row=rows[barrierSelectedIndex],fine=H.path(seed('barrier-test'),barrierSelectedIndex).values;
  const visible=H.observe(row,intervals,sigma),fineValues=Array.from(fine,x=>sigma*x);
  const pathChart=chart('barrier-path',[0,1],limits([fineValues,[0,barrier]],.12,false),'Time · both endpoints known','Signal');
  pathChart?.line([[0,barrier],[1,barrier]],C.teal,2,[6,4]);
  pathChart?.line(series(fineValues),C.gray,1.5);pathChart?.line(series(visible),C.coral,2.8);
  visible.forEach((x,i)=>pathChart?.point(i/intervals,x,C.blue));
  const p=H.crossingProbability(visible,fitted.sigma,barrier),observedHit=visible.some(x=>x>=barrier),actualHit=sigma*row.continuousMax>=barrier;
  out('barrier-example-note',`Test path ${barrierSelectedIndex+1}: ${observedHit?'the revealed readings already show a crossing':'none of the revealed readings reaches the threshold'}. Simulated continuous source event: ${actualHit?'crossed':'did not cross'}. Given only the revealed readings, the fitted model assigns ${fmt(100*p,1)}% crossing probability. Refine the observation grid to inspect this same path.`);
  out('barrier-fit',`Learned from ${count.toLocaleString()} independent training increments with varied durations: drift ${fmt(fitted.mu,3)}, noise strength ${fmt(fitted.sigma,3)}. Test events were not used in fitting. Constant drift cancels in the conditional bridge calculation.`);
  out('barrier-exact',`${fmt(100*exact,2)}%`);out('barrier-actual',`${fmt(100*current.actual,2)}%`);out('barrier-visible',`${fmt(100*current.seen,2)}%`);
  for(const [name,rate,score]of [['naive',current.seen,current.seenBrier],['sde',current.predicted,current.bridgeBrier],['discrete',current.predicted,current.bridgeBrier]]) {
    out(`barrier-${name}-rate`,`${fmt(100*rate,2)}%`);out(`barrier-${name}-score`,fmt(score,4));
  }
  const ymax=Math.min(1,Math.max(.2,Math.ceil(Math.max(exact,current.actual,...results.map(r=>r.predicted))*12)/10));
  const c=chart('barrier-refinement',[0,6],[0,ymax],'Observation intervals · nested grids','Crossing fraction',{xTicks:[0,1,2,3,4,5,6],xFormat:x=>2**x,yFormat:y=>`${Math.round(100*y)}%`});
  c?.line([[0,current.actual],[6,current.actual]],C.gray,2,[5,3]);c?.line([[0,current.fine],[6,current.fine]],C.gold,1.7,[2,4]);
  c?.line(results.map((r,k)=>[k,r.seen]),C.coral,2.5);c?.line(results.map((r,k)=>[k,r.predicted]),C.teal,2.5);
  c?.point(value('barrier-observations'),current.seen,C.coral);c?.point(value('barrier-observations'),current.predicted,C.teal);
  const calibration=H.reliability(current.predictions,current.labels),d=chart('barrier-calibration',[0,1],[0,1],'Predicted probability','Observed event frequency');
  d?.line([[0,0],[1,1]],C.gray,1.5,[5,4]);
  calibration.forEach(g=>d?.point(g.predicted,g.observed,C.teal));
  out('barrier-grid-note',`At ${intervals} observation intervals, observation checks miss ${fmt(100*(current.actual-current.seen),2)} percentage points of continuous events in this test batch. Even the 1,024-point drawing detects only ${fmt(100*current.fine,2)}%; exact sampled segment maxima provide the continuous event labels (${fmt(100*current.actual,2)}%). Calibration groups shown contain ${calibration.map(g=>g.count.toLocaleString()).join(', ')} paths. More observations reveal the same underlying records; they do not refit the model.`);
},
switching(){
  const sigma=value('switch-noise'),count=value('switch-count'),x0=value('switch-start'),T=value('switch-horizon');
  slider('switch-noise');slider('switch-horizon',`${T} time units`);
  const training=cached('switching',`${sigma}:${count}`,()=>{
    const data=S.trainingData(sigma,count,seed('switching'));
    return {...data,model:S.fit(data.pairs),kernel:S.kernel(data.pairs)};
  });
  const predictions=cached('switching',`forecast:${sigma}:${count}:${x0}:${T}`,()=>({
    point:S.simulate('point',training.model,x0,T,1,seed('switching-futures')),
    sde:S.simulate('sde',training.model,x0,T,S.ENSEMBLE,seed('switching-futures')),
    kernel:S.simulate('kernel',training.kernel,x0,T,S.ENSEMBLE,seed('switching-futures')+1)
  }));
  const test=cached('switching-test',`${sigma}:${x0}:${T}`,()=>S.simulate('source',{sigma},x0,T,S.ENSEMBLE,seed('switching-test'),S.SOURCE_STEP));
  const {point,sde,kernel}=predictions,range=[-2.6,2.6],cs=training.model.coefficients;
  lines('switch-training',training.paths.slice(0,12),4,range);
  const c=chart('switch-paths',[0,T],range,'Time since forecast','State');
  c?.line([[0,S.THRESHOLD],[T,S.THRESHOLD]],C.gray,1,[2,5]);
  sde.paths.forEach(p=>c?.line(series(p,T),C.teal,1.1,[],.3));
  c?.line(series(test.mean,T),C.gray,2,[6,4]);c?.line(series(sde.mean,T),C.gold,2.8);c?.line(series(point.paths[0],T),C.coral,2.8);
  const histograms=Object.fromEntries(Object.entries({test,sde,kernel}).map(([name,result])=>[name,M.histogramDensity(result.endpoints,45,range)]));
  const top=Math.max(.1,...Object.values(histograms).flatMap(h=>h.points.map(p=>p[1])))*1.15;
  const d=chart('switch-density',range,[0,top],'State at final time','Density');
  d?.bars(histograms.test.points,histograms.test.width*.95,C.gray,.65);
  d?.line(histograms.kernel.points,C.blue,2,[5,3]);d?.line(histograms.sde.points,C.teal,2.5);
  d?.line([[point.endpoints[0],0],[point.endpoints[0],top]],C.coral,2.4);
  const p=chart('switch-hits',[0,T],[0,1],'Time since forecast','Probability of reaching right');
  p?.line(series(test.cumulative,T),C.gray,3);p?.line(series(kernel.cumulative,T),C.blue,2,[6,4]);p?.line(series(sde.cumulative,T),C.teal,2.5);p?.line(series(point.cumulative,T),C.coral,2,[3,3]);
  out('switch-fit',`Cubic drift fitted from ${training.model.n.toLocaleString()} observed transitions: coefficients (${cs.map(x=>fmt(x,3)).join(', ')}), in order 1, x, x², x³. Learned noise strength ${fmt(training.model.sigma,3)}. All models use the same training records.`);
  for(const [name,result]of Object.entries(predictions)){
    const score=S.scores(result,test);
    out(`switch-${name}-prob`,`${fmt(100*result.probability,1)}%`);out(`switch-${name}-crps`,fmt(score.crps,4));out(`switch-${name}-brier`,fmt(score.brier,4));
  }
  const sourceMean=test.mean.at(-1),sdeMean=sde.mean.at(-1),pointEnd=point.endpoints[0],q=test.probability;
  out('switch-mean',`At the final time: drift-only position ${fmt(pointEnd,2)}, average SDE position ${fmt(sdeMean,2)}, average unseen source position ${fmt(sourceMean,2)}. The SDE average need not follow the drift-only curve, even though they share exactly the same learned drift.`);
  const omitted=Object.entries(histograms).map(([name,h])=>`${name==='test'?'source':name==='sde'?'SDE':'empirical'} ${h.outside}`).join(', ');
  out('switch-reference',`Observed in the 2,000 unseen source paths: ${fmt(100*q,1)}% reached +0.75 at least once. Approximate sampling margin: ±${fmt(100*1.96*Math.sqrt(q*(1-q)/S.ENSEMBLE),1)} percentage points (normal approximation; unreliable near 0% or 100%). All events are checked on the same 0.05-spaced observation grid. Endpoints outside the fixed display range: ${omitted}.`);
  out('switch-result',sigma===0?(x0===0?'With zero source noise and a start exactly at the hilltop, the source stays at zero. Fitted models may leave it because tiny drift errors grow at this unstable state. This setting exposes model error, rather than genuine random switching.':'At zero source noise, the source stays in the left valley. Small fitted residual noise can remain because finite-interval changes are only approximately described by a cubic Euler drift. Neither the coefficient estimate nor its residual is exact.'):'Both probabilistic models can predict branching futures. Compare their scores: the empirical model may match or beat the SDE. This experiment demonstrates the effect of nonlinear random dynamics, rather than a universal performance advantage for SDEs. Histogram lines and event estimates fluctuate with finite simulated ensembles.');
},
prediction(){
  const sigma=value('pred-noise'),count=value('pred-count'),x0=value('pred-start'),T=value('pred-horizon'),steps=Math.round(T/P.STEP);
  slider('pred-noise');slider('pred-start');slider('pred-horizon',`${fmt(T,1)} time units`);
  const training=cached('prediction',`${sigma}:${count}`,()=>{
    const data=P.trainingData(sigma,count,seed('prediction'));
    return {...data,model:P.fit(data.pairs)};
  });
  const learned=training.model,prediction=P.forecast(learned,x0,steps);
  const tests=cached('prediction-test',`${sigma}:${x0}`,()=>P.sample(P.transition(sigma),x0,40,2000,seed('prediction-test')));
  const shown=tests.slice(0,12).map(p=>p.slice(0,steps+1)),evaluation=P.evaluate(prediction,tests);
  const range=limits([...shown,prediction.lower,prediction.upper],.1,false);
  lines('pred-training',training.paths.slice(0,12),2,limits(training.paths.slice(0,12)),[],{color:C.teal});
  for(const [id,band] of [['pred-point',false],['pred-stochastic',true]]){
    const c=chart(id,[0,T],range,'Time since forecast','Position');
    if(band){c?.band(series(prediction.lower,T),series(prediction.upper,T));c?.line(series(prediction.lower,T),C.teal,1,[4,3]);c?.line(series(prediction.upper,T),C.teal,1,[4,3]);}
    shown.forEach(p=>c?.line(series(p,T),C.gray,1.3,[],.8));
    c?.line(series(prediction.mean,T),C.coral,2.6);
  }
  const mu=prediction.mean[steps],sd=Math.sqrt(prediction.variance[steps]),ends=tests.map(p=>p[steps]);
  const xlim=limits([ends,[mu-4*sd,mu+4*sd]],.06,false),hist=M.histogramDensity(ends,40,xlim);
  const curve=sd>1e-10?Array.from({length:401},(_,i)=>{const x=xlim[0]+i/400*(xlim[1]-xlim[0]);return [x,M.normalPdf(x,mu,sd)];}):[];
  const top=1.15*Math.max(.1,...hist.points.map(p=>p[1]),...curve.map(p=>p[1]));
  const c=chart('pred-density',xlim,[0,top],'Position at final time','Density');
  c?.bars(hist.points,hist.width*.92,C.gray,.7);c?.line(curve,C.teal,2.6);
  for(const edge of [prediction.lower[steps],prediction.upper[steps]])c?.line([[edge,0],[edge,top]],C.blue,1.5,[4,4]);
  c?.line([[mu,0],[mu,top]],C.coral,2.4);
  out('pred-fit',`Fitted from ${count} training paths (${learned.n.toLocaleString()} transitions): a = ${fmt(learned.a,4)}, b = ${fmt(learned.b,4)}, residual standard deviation s = ${fmt(Math.sqrt(learned.variance),4)}. Test outcomes are held out.`);
  out('pred-rmse-point',fmt(evaluation.rmse,4));out('pred-rmse-stochastic',fmt(evaluation.rmse,4));out('pred-sd',fmt(sd,4));out('pred-coverage',`${fmt(100*evaluation.coverage,1)}% · target 90%`);
  out('pred-result',sigma===0?'With no source noise, both models recover the same deterministic motion. The predictive interval collapses; coverage is 100% here because every future is identical, rather than the nominal 90% for a continuous spread.':`Both models have identical mean RMSE because their mean forecasts are identical. The stochastic model additionally predicts a spread: ${fmt(100*evaluation.coverage,1)}% of unseen endpoints fall inside its nominal 90% interval. Small training samples can miss that target.`);
  const truth=P.forecast(P.transition(sigma),x0,steps);
  out('pred-truth',`Analytic source reference at the selected endpoint: mean ${fmt(truth.mean[steps],4)}, standard deviation ${fmt(Math.sqrt(truth.variance[steps]),4)}. These values are for comparison after fitting.`);
},
traces(){
  const w=cached('traces','w',()=>M.brownian(64,1,seed('traces'))[0]),before=.22*w[32],after=before-1;
  const stepped=[];for(let i=0;i<=64;i++){if(i===32)stepped.push([.5,before]);stepped.push([i/64,.22*w[i]-(i>=32?1:0)]);}
  const p=cached('traces','memory',()=>M.fractionalPath(.8,64,seed('traces')+1,M.fractionalCholesky(.8,64)).path);
  const c=chart('trace-jump',[0,1],limits([stepped.map(a=>a[1])]),'Time t','Position');c?.line(stepped,C.teal,2);c?.point(.5,before,C.coral);c?.point(.5,after,C.blue);
  lines('trace-memory',[p],1,limits([p]),[],{ylabel:'Position'});
  out('trace-note',`At t = 0.5 the first record goes from ${fmt(before,2)} to ${fmt(after,2)} with no elapsed time. The second has no jump. Change the sample: the event size stays the same, but the streaks in the continuous record change.`);
},
blur(){
  const t=value('blur-time'),x=value('blur-x'),g=2,y=M.mixturePdf(x,g,t),score=M.mixtureScore(x,g,t);
  slider('blur-time');slider('blur-x');
  const c=chart('blur-density',[-5,5],[0,.78],'Position x','Density');
  const curve=t=>Array.from({length:501},(_,i)=>{const a=-5+i/50;return [a,M.mixturePdf(a,g,t)];});
  c?.line(curve(0),C.gray,1.8,[5,4]);c?.line(curve(t),C.teal,2.5);c?.point(x,y,C.blue);
  if(Math.abs(score)>1e-8){
    const dir=Math.sign(score),tip=x+.55*dir,h=Math.max(.022,y);
    c?.line([[x,y],[x,h],[tip,h]],C.blue,2);c?.line([[tip-.13*dir,h+.018],[tip,h],[tip-.13*dir,h-.018]],C.blue,2);
  }
  out('blur-note',`At x = ${fmt(x,2)}, the score is ${fmt(score,3)}: ${Math.abs(score)<1e-8?'no first-order preference for either direction':score>0?'density increases locally to the right':'density increases locally to the left'}.`);
},
bsde(){
  const ev=B.evaluate(model,heldOut),xs=Array.from({length:101},(_,i)=>-2+i/25);
  const p=xs.map(x=>[x,B.sensitivity(model,.5,x)]),c=chart('bsde-curve',[-2,2],limits([[-4,4],p.map(a=>a[1])]),'Current position x','Multiplier Z');
  c?.line(p,C.teal,2.7);c?.line([[-2,-4],[2,4]],C.coral,1.8,[6,4]);
  out('bsde-steps',model.step);out('bsde-initial',fmt(model.weights[0]));out('bsde-error',fmt(ev.loss,4));out('bsde-benchmark',fmt(ev.exactLoss,4));$('bsde-reset').disabled=model.step===0;
},
coin(){
  const full=cached('coin','steps',()=>M.walks(12,.5,1,seed('coin'),1).paths[0]),path=full.slice(0,coinCount+1);
  const heads=path.reduce((n,x,i)=>n+(i>0&&x>path[i-1]?1:0),0);
  out('coin-count',coinCount);out('coin-heads',heads);out('coin-tails',coinCount-heads);out('coin-position',path[path.length-1]);
  $('coin-toss').disabled=coinCount===12;
  $('coin-reset').disabled=coinCount===0;
  out('coin-sequence-info',`Sequence ${coinSequence} · ${coinMessage}`);
  $('coin-sequence').innerHTML=coinCount?path.slice(1).map((x,i)=>`<span class="coin-chip ${x>path[i]?'coin-right':'coin-left'}" aria-label="Toss ${i+1}: ${x>path[i]?'heads, right, plus one':'tails, left, minus one'}">${x>path[i]?'H → +1':'T ← −1'}</span>`).join(''):'No tosses revealed. Press “Toss next coin”.';
  const bound=Math.max(3,...path.map(Math.abs))+1,c=chart('coin-path',[0,12],[-bound,bound],'Toss number','Position');
  c?.line(path.map((y,x)=>[x,y]),C.teal,2.4);path.forEach((y,x)=>c?.point(x,y,C.teal));
},
drift(){slider('drift-sigma');slider('drift-mu');const sigma=value('drift-sigma'),mu=value('drift-mu'),w=cached('drift','w',()=>M.brownian(128,1,seed('drift'),18));const p=w.map(w=>Array.from(w,(x,i)=>mu*i/128+sigma*x));lines('drift-path',p,1,limits(p),[{points:[[0,0],[1,mu]],color:C.coral}],{ylabel:'Position X(t)'});out('drift-mean',fmt(mu,2));out('drift-spread',fmt(sigma,2));},
walk(){const n=value('walk-n'),p=value('walk-p');slider('walk-n',n);slider('walk-p');const data=cached('walk',`${n}:${p}`,()=>M.walks(n,p,1,seed('walk'))),mu=n*(2*p-1),variance=4*n*p*(1-p),masses=M.binomial(n,p);
  const pathChart=chart('walk-path',[0,n],limits(data.paths),'Toss number','Position Sₙ');
  data.paths.slice(1).forEach(path=>pathChart?.line(series(path,n),C.teal,1.2,[],.45));
  pathChart?.line(series(data.paths[0],n),C.blue,2.3);pathChart?.line([[0,0],[n,mu]],C.coral,2,[5,4]);
  const observed=lattice(data.endpoints,n,1),peak=Math.max(...masses,...observed.map(a=>a[1]));const c=chart('walk-hist',[-n-1,n+1],[0,peak*1.18],'Final position','Probability');c?.bars(observed,1.45);masses.forEach((m,k)=>c?.point(2*k-n,m,C.coral));
  const endpoint=data.paths[0][n],bar=observed[(endpoint+n)/2];
  pathChart?.point(n,endpoint,C.blue);c?.bars([bar],1.7,C.blue,1,true);
  out('walk-highlight',`The blue walk ended at ${endpoint}. The blue outline marks its bar: ${Math.round(bar[1]*data.endpoints.length)} of ${data.endpoints.length.toLocaleString()} walks finished there (${fmt(100*bar[1],1)}%). This walk contributes one count.`);
  out('walk-mean',fmt(mu,2));out('walk-var',fmt(variance,2));out('walk-emp',fmt(M.moments(data.endpoints).mean,2));},
scaling(){const n=2**value('scale-k'),mode=$('scale-mode').value,{dt,dx,variance,sd}=M.scalingParameters(n,mode);slider('scale-k',`${n} steps`);
  const data=cached('scaling',`${n}:${mode}`,()=>M.walks(n,.5,dx,seed('scaling')));
  lines('scale-path',data.paths,1,[-6,6]);
  const close=fixedScalingDensity('scale-hist',data.endpoints,dx,sd,M.SCALING_VIEWS.close);
  const wide=fixedScalingDensity('scale-wide',data.endpoints,dx,sd,M.SCALING_VIEWS.wide);
  const readable=x=>x.toLocaleString('en',{maximumSignificantDigits:5});
  out('scale-n',n);out('scale-dt',readable(dt));out('scale-dx',readable(dx));out('scale-var',readable(variance));out('scale-sd',readable(sd));
  out('scale-outside',`${fmt(close.outside/data.endpoints.length*100,1)}%`);
  out('scale-view-note',`${close.outside.toLocaleString()} of 2,000 endpoints fall outside the close view; ${wide.outside} fall outside the wide view. Out-of-view endpoints are counted, not piled into edge bars. The vertical density scales adjust; compare horizontal widths.`);
},
brownian(){const t=value('brown-time'),w=cached('brownian','w',()=>M.brownian(80,2,seed('brownian'),4000));slider('brown-time',fmt(t,2));const index=Math.round(t/.025),endpoints=w.map(p=>p[index]);
  const c=lines('brown-path',w.slice(0,16),2,limits(w.slice(0,16)));c?.line([[t,-20],[t,20]],C.coral,1.5,[4,4]);
  const ex=Math.max(4*Math.sqrt(t),...endpoints.map(Math.abs))*1.02;densityPlot('brown-hist',endpoints,[-ex,ex],x=>M.normalPdf(x,0,Math.sqrt(t)));
  const m=M.moments(endpoints);out('brown-mean',fmt(m.mean));out('brown-var',fmt(m.variance));out('brown-theory',fmt(t));},
qv(){const n=2**value('qv-k'),w=cached('qv','w',()=>M.brownian(4096,1,seed('qv'))[0]),p=M.partition(w,n);slider('qv-k',`${n} intervals`);
  const c=chart('qv-path',[0,1],limits([w]),'Time t','W(t)');c?.line(series(w),C.gray,1);c?.line(series(p.path),C.teal,1.8);
  const c2=chart('qv-sum',[0,1],[0,Math.max(1.15,p.q[n]*1.15)],'Time t','Squared sum');c2?.line([[0,0],[1,1]],C.coral,2,[5,4]);c2?.line(series(p.q),C.teal,2);
  out('qv-clock',fmt(1/n,5));out('qv-mixed',fmt((p.path[n]-p.path[0])/n,5));out('qv-n',n);out('qv-q',fmt(p.q[n],4));out('qv-tv',fmt(p.tv,2));out('qv-sd',fmt(Math.sqrt(2/n),4));},
integral(){const n=2**value('int-k'),w=cached('integral','w',()=>M.brownian(4096,1,seed('integral'))[0]),p=M.partition(w,n);slider('int-k',`${n} intervals`);const classical=p.path.map(x=>.5*x*x),limit=classical.map((x,i)=>x-.5*i/n),gap=p.q.map(q=>q*.5);
  const c=chart('int-path',[0,1],limits([p.left,classical,limit]),'Time t','Integral');c?.line(series(classical),C.blue,1.5,[3,3]);c?.line(series(limit),C.coral,2,[6,4]);c?.line(series(p.left),C.teal,2);
  const d=chart('int-gap',[0,1],[0,Math.max(.6,gap[n]*1.15)],'Time t','Correction');d?.line([[0,0],[1,.5]],C.coral,2,[5,4]);d?.line(series(gap),C.teal,2);
  out('int-sum',fmt(p.left[n],4));out('int-target',fmt(limit[n],4));out('int-gap-value',fmt(gap[n],4));},
sde(){const theta=value('sde-theta'),sigma=value('sde-sigma'),x0=value('sde-start');slider('sde-theta');slider('sde-sigma');slider('sde-start');const paths=cached('sde',`${theta}:${sigma}:${x0}`,()=>M.ou(theta,sigma,4,160,seed('sde'),20,x0)),mean=Array.from({length:161},(_,i)=>x0*Math.exp(-theta*i/40));lines('sde-path',paths,4,limits([...paths,mean]),[{values:mean,color:C.coral,dash:[5,4]}]);
  const v=Array.from({length:161},(_,i)=>M.ouVariance(theta,sigma,i/40)),free=v.map((_,i)=>sigma*sigma*i/40),c=chart('sde-variance',[0,4],[0,Math.max(.1,free[160]*1.12)],'Time t','Variance');c?.line(series(free,4),C.coral,2,[5,3]);c?.line(series(v,4),C.teal,2.4);
  out('sde-endvar',fmt(v[160]));out('sde-stationary',theta===0?(sigma===0?'0 · constant':'Unbounded'):fmt(sigma*sigma/(2*theta)));},
gbm(){const mu=value('gbm-mu'),sigma=value('gbm-sigma');slider('gbm-mu');slider('gbm-sigma');const w=cached('gbm','w',()=>M.brownian(200,10,seed('gbm'),1000)),rate=mu-.5*sigma*sigma;
  const logs=w.slice(0,24).map(p=>Array.from(p,(x,i)=>Math.log(100)+rate*i/20+sigma*x)),mean=Array.from({length:201},(_,i)=>Math.log(100)+mu*i/20),median=mean.map((_,i)=>Math.log(100)+rate*i/20),lim=limits([...logs,mean,median],.1,false);
  // Keep a readable logarithmic range even when all trajectories coincide.
  const lo=Math.floor(lim[0]/Math.LN10),hi=Math.ceil(lim[1]/Math.LN10),ticks=[];for(let e=lo;e<=hi;e++)for(const q of [1,3]){const tick=e*Math.LN10+Math.log(q);if(tick>=lim[0]&&tick<=lim[1])ticks.push(tick);}
  const c=chart('gbm-path',[0,10],lim,'Time t','Value S · log scale',{yTicks:ticks,yFormat:y=>{const v=Math.exp(y);return v>=10000?v.toExponential(0):v<1?Number(v.toPrecision(2)).toString():Math.round(v).toLocaleString('en');}});
  logs.forEach(p=>c?.line(series(p,10),C.gray,1,[],.7));c?.line(series(mean,10),C.coral,2.6);c?.line(series(median,10),C.teal,2.6,[6,3]);
  out('gbm-mean',fmt(100*Math.exp(mu*10),2));out('gbm-median',fmt(100*Math.exp(rate*10),2));out('gbm-rate',fmt(rate,4));out('gbm-below',fmt(w.filter(p=>rate*10+sigma*p[200]<0).length/10,1)+'%');},
convention(){
  const w=cached('convention','w',()=>M.brownian(512,1,seed('convention'))[0]);
  const left=M.lambdaIntegral(w,0),symmetric=M.lambdaIntegral(w,.5);
  let q=0;for(let i=1;i<w.length;i++)q+=(w[i]-w[i-1])**2;
  lines('convention-driver',[w],1);
  const c=chart('convention-integrals',[0,1],limits([left,symmetric]),'Time t','Accumulated contribution');
  c?.line(series(left),C.teal,2.2);c?.line(series(symmetric),C.coral,2.2);
  out('convention-gap',fmt(symmetric.at(-1)-left.at(-1),4));
  out('convention-squares',fmt(q/2,4));out('convention-limit',fmt(.5,4));
},
lambda(){const lambda=value('lambda-value');slider('lambda-value');const w=cached('lambda','w',()=>M.brownian(512,1,seed('lambda'),2000)),first=w[0],finite=M.lambdaIntegral(first,lambda),limit=Array.from(first,(x,i)=>.5*x*x+(lambda-.5)*i/512),classical=Array.from(first,x=>.5*x*x);
  const c=chart('lambda-path',[0,1],limits([finite,limit,classical]),'Time t','Integral');c?.line(series(classical),C.blue,1.5,[2,3]);c?.line(series(limit),C.coral,2.3,[5,4]);c?.line(series(finite),C.teal,1.8);
  const summaries=cached('lambda','summaries',()=>w.map(p=>{let q=0;for(let i=1;i<p.length;i++)q+=(p[i]-p[i-1])**2;return [.5*p[512]**2,q];}));let avgEnd=0,avgQ=0;for(const [a,q] of summaries){avgEnd+=a/w.length;avgQ+=q/w.length;}const average=avgEnd+(lambda-.5)*avgQ;
  const c2=chart('lambda-mean',[0,1],[-.15,1.2],'Evaluation parameter λ','Expected integral');c2?.line([[0,0],[1,1]],C.coral,2,[5,4]);c2?.line([[0,avgEnd-.5*avgQ],[1,avgEnd+.5*avgQ]],C.teal,2);c2?.point(lambda,average,C.teal);
  out('lambda-name',lambda===0?'Itô':lambda===.5?'Stratonovich':lambda===1?'Right endpoint':`λ = ${lambda.toFixed(2)}`);out('lambda-sum',fmt(finite[512],4));out('lambda-limit',fmt(limit[512],4));out('lambda-average',fmt(average,4));},
conversion(){const sigma=value('conv-sigma');slider('conv-sigma');const w=cached('conversion','w',()=>M.brownian(256,2,seed('conversion'))[0]),ito=Array.from(w,(x,i)=>Math.exp((.1-.5*sigma*sigma)*i/128+sigma*x)),uncorrected=Array.from(w,(x,i)=>Math.exp(.1*i/128+sigma*x));
  const c=chart('conv-path',[0,2],limits([ito,uncorrected]),'Time t','Value X');c?.line(series(uncorrected,2),C.blue,2);c?.line(series(ito,2),C.teal,3.7);c?.line(series(ito,2),C.coral,1.8,[6,5]);out('conv-drift',fmt(.1-.5*sigma*sigma,4)+' × X');out('conv-ratio',fmt(Math.exp(sigma*sigma),3));},
jumps(){const rate=value('jump-rate'),size=value('jump-size');slider('jump-rate',fmt(rate,1));slider('jump-size',fmt(size,1));const d=cached('jumps',`${rate}:${size}`,()=>M.jumpDiffusion(rate,size,seed('jumps')));const c=chart('jump-path',[0,2],limits([d.base.map(p=>p[1]),d.jumped.map(p=>p[1])]),'Time t','Position');c?.line(d.base,C.coral,1.7,[4,4]);c?.line(d.jumped,C.teal,1.9);const first=d.events[0],pair=first?d.jumped.filter(([t])=>t===first.t):[];
  if(pair.length>=2){c?.point(first.t,pair[0][1],C.coral);c?.point(first.t,pair[1][1],C.blue);}
  out('jump-note',pair.length<2?'No event on this sample. Increase the rate or draw another path.':`At the first event (t = ${fmt(first.t,3)}), the position changes from ${fmt(pair[0][1],2)} to ${fmt(pair[1][1],2)}. Its signed jump is ${fmt(first.jump,2)}.`);
  out('jump-count',d.events.length);out('jump-expected',fmt(rate*2,1));},
memory(){const H=value('memory-h');slider('memory-h');const factor=cached('factor',H,()=>M.fractionalCholesky(H,256)),data=cached('memory',H,()=>M.fractionalPath(H,256,seed('memory'),factor));lines('memory-path',[data.path],1,limits([data.path]),[],{ylabel:'Bᴴ(t)'});
  const c=chart('memory-corr',[.5,8.5],[-.6,.8],'Increment lag','Correlation'),sample=[],theory=[];for(let k=1;k<=8;k++){sample.push([k-.12,M.sampleCorrelation(data.increments,k)]);theory.push([k+.12,M.fractionalCorrelation(H,k)]);}c?.bars(sample,.22,C.teal,.75);c?.bars(theory,.22,C.coral,1,true);out('memory-h-stat',fmt(H,2));out('memory-corr-stat',fmt(M.fractionalCorrelation(H,1),3));},
diffusion(){const g=value('diff-g'),progress=value('diff-progress'),idx=Math.round(progress*20),t=1-progress;slider('diff-g');slider('diff-progress',`${Math.round(progress*100)}%`);const data=cached('diffusion',g,()=>M.reverseDiffusion(g,seed('diffusion'))),upto=idx*50;
  const range=limits([...data.pathsS,...data.pathsO]);const c=chart('diff-sde',[0,1],range,'Reverse time s','Position'),d=chart('diff-ode',[0,1],range,'Reverse time s','Position');
  data.pathsS.forEach((path,i)=>{c?.line(path.slice(0,upto+1).map((y,k)=>[k/1000,y]),C.teal,1,[],.45);c?.point(0,path[0],C.teal);});data.pathsO.forEach(path=>{d?.line(path.slice(0,upto+1).map((y,k)=>[k/1000,y]),C.blue,1.2,[],.5);d?.point(0,path[0],C.blue);});
  const a=data.snapS[idx],b=data.snapO[idx],ex=Math.max(3.5,2+4*Math.sqrt(M.mixtureVariance(g,t)),...a.map(Math.abs),...b.map(Math.abs))*1.02;
  densityPlot('diff-sde-hist',a,[-ex,ex],x=>M.mixturePdf(x,g,t),C.teal,55);densityPlot('diff-ode-hist',b,[-ex,ex],x=>M.mixturePdf(x,g,t),C.blue,55);
  out('diff-time',fmt(t,2));out('diff-var',fmt(4+M.mixtureVariance(g,t)));out('diff-sde-var',fmt(M.moments(a).variance));out('diff-ode-var',fmt(M.moments(b).variance));}
};

const nav=$('navigation');
nav.insertAdjacentHTML('afterend',pendingTopics('calculus',scope.calculusMax));
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('main').focus();});
nav.innerHTML=chapters.map(ch=>`${ch.id==='reference'?'<div class="nav-divider"></div>':''}<a href="#${ch.id}" data-nav="${ch.id}"><span>${ch.number}</span>${ch.label}</a>`).join('');
$('main').innerHTML=chapters.map((ch,i)=>`<article class="chapter" data-id="${ch.id}" id="chapter-${ch.id}" ${i?'hidden':''}>${ch.id==='intro'?'':`<div class="chapter-top"><div class="chapter-num">${/^\d/.test(ch.number)?'SECTION':'REFERENCE'} ${ch.number}</div><h1>${ch.title}</h1><p class="deck">${ch.deck}</p></div><div class="chapter-outline" aria-label="In this section"></div>`}${ch.html()}<div class="chapter-bottom">${i?`<a href="#${chapters[i-1].id}">← ${chapters[i-1].label}</a>`:'<span></span>'}${i<chapters.length-1?`<a class="next" href="#${chapters[i+1].id}">Continue · ${chapters[i+1].label} →</a>`:'<a class="next" href="#intro">Back to the beginning ↑</a>'}</div></article>`).join('');
document.querySelectorAll('.chapter').forEach(ch=>{
  const outline=ch.querySelector('.chapter-outline');if(!outline)return;
  const label=document.createElement('span');label.className='outline-label';label.textContent='IN THIS SECTION';outline.append(label);
  ch.querySelectorAll('h2[data-section]').forEach(heading=>{const a=document.createElement('a');a.href=`#${ch.dataset.id}/${heading.dataset.section}`;a.textContent=heading.textContent;outline.append(a);});
});
document.querySelectorAll('button[data-new]').forEach(button=>{
  button.textContent=button.textContent.replace(' ↻','');
  const icon=document.createElement('span');icon.dataset.icon='refresh';icon.setAttribute('aria-hidden','true');button.append(icon);
});
window.dispatchEvent(new Event('hub:controls-ready'));
function drawChapter(id){document.querySelectorAll(`#chapter-${id} [data-lab]`).forEach(l=>renderers[l.dataset.lab]?.());}
function destinationIn(article,section){
  return Array.from(article.querySelectorAll('[data-section], [data-lab]')).find(el=>
    el.dataset.section===section || (el.dataset.lab && `demo-${el.dataset.lab}`===section));
}
function navigate(scroll=true){
  clearInterval(replayTimer);let [id,section]=location.hash.slice(1).split('/');
  // Preserve bookmarked subsection and demo links when a discussion moves chapters.
  if(section){
    const original=document.getElementById(`chapter-${id}`);
    if(!original || !destinationIn(original,section)){
      const moved=Array.from(document.querySelectorAll('.chapter')).find(article=>destinationIn(article,section));
      if(moved){id=moved.dataset.id;history.replaceState(null,'',`#${id}/${section}`);}
    }
  }
  active=chapters.some(c=>c.id===id)?id:'intro';
  document.querySelectorAll('.chapter').forEach(el=>el.hidden=el.dataset.id!==active);
  document.querySelectorAll('[data-nav]').forEach(el=>{const yes=el.dataset.nav===active;el.classList.toggle('active',yes);if(yes)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const ch=chapters.find(c=>c.id===active);$('breadcrumb').textContent=`${ch.number} / ${ch.label.toUpperCase()}`;document.title=`${ch.label} · Stochastic Calculus`;
  if(innerWidth<=780)$('mobile-menu').open=false;
  drawChapter(active);
  if(scroll){
    const article=$(`chapter-${active}`);
    const destination=section && destinationIn(article,section);
    if(destination){
      const disclosure=destination.closest('details');
      if(disclosure)disclosure.open=true;
      if(destination.hasAttribute('data-lab'))destination.tabIndex=-1;
      destination.scrollIntoView({block:'start',behavior:'instant'});
      destination.focus({preventScroll:true});
    }else{
      window.scrollTo({top:0,behavior:'instant'});
      $('main').focus({preventScroll:true});
    }
  }
}
document.addEventListener('input',e=>{const lab=e.target.closest('[data-lab]');if(!lab)return;clearInterval(replayTimer);if(e.target.id==='diff-g')clear('diffusion');renderers[lab.dataset.lab]?.();});
document.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.new){const id=btn.dataset.new;seeds[id]=(seed(id)+7919)>>>0;clear(id);if(id==='coin'){coinCount=0;coinSequence++;coinMessage='A new sequence is ready. Reveal its tosses below.';}renderers[id]?.();}
  if(btn.id==='coin-toss'){coinCount=Math.min(12,coinCount+1);coinMessage=`${coinCount} of 12 tosses revealed.`;renderers.coin();}
  if(btn.id==='coin-reset'){coinCount=0;coinMessage='Same sequence rewound. “Toss next coin” reveals the same outcomes again.';renderers.coin();}
  if(btn.dataset.preset){$('lambda-value').value=btn.dataset.preset==='ito'?'0':'.5';renderers.lambda();}
  if(btn.id==='diff-replay'){clearInterval(replayTimer);$('diff-progress').value=0;renderers.diffusion();replayTimer=setInterval(()=>{const next=Math.min(1,value('diff-progress')+.05);$('diff-progress').value=next;renderers.diffusion();if(next>=1)clearInterval(replayTimer);},150);}
  if(btn.id==='bsde-train'){B.train(model);renderers.bsde();}
  if(btn.id==='bsde-reset'){model=B.learner();renderers.bsde();}
  if(btn.id==='pred-test'){seeds['prediction-test']=(seed('prediction-test')+7919)>>>0;clear('prediction-test');renderers.prediction();}
  if(btn.id==='switch-test'){seeds['switching-test']=(seed('switching-test')+7919)>>>0;clear('switching-test');renderers.switching();}
  if(btn.id==='barrier-test'){seeds['barrier-test']=(seed('barrier-test')+7919)>>>0;clear('barrier-test');barrierSelectedIndex=null;renderers.barrier();}
  if(btn.id==='barrier-example'){
    const rows=cached('barrier-test','source',()=>H.testData(seed('barrier-test')));
    const next=H.findMissed(rows,2**value('barrier-observations'),value('barrier-sigma'),value('barrier-threshold'),barrierSelectedIndex??-1);
    if(next!==null)barrierSelectedIndex=next;renderers.barrier();
  }
});
window.addEventListener('hashchange',()=>navigate());
window.addEventListener('hub:theme-change',()=>{refreshPalette();drawChapter(active);});
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);if(innerWidth>780)$('mobile-menu').open=true;resizeFrame=requestAnimationFrame(()=>drawChapter(active));});
window.addEventListener('beforeprint',()=>{refreshPalette();document.querySelectorAll('.chapter').forEach(el=>el.hidden=false);chapters.filter(c=>c.id!=='review').forEach(ch=>drawChapter(ch.id));document.querySelectorAll('details').forEach(d=>{d.dataset.wasOpen=d.open?'1':'0';d.open=true;});});
window.addEventListener('afterprint',()=>{refreshPalette();document.querySelectorAll('details').forEach(d=>d.open=d.dataset.wasOpen==='1');navigate(false);});
navigate(Boolean(location.hash.includes('/')));
