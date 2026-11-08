import './style.css';
import 'katex/dist/katex.min.css';
import '../../../site/theme.css';
import { chapters } from './lesson.js';
import * as M from './math.js';
import { ouComparison } from './ou-comparison.js';
import { pendingTopics } from '../../../site/navigation.js';
import scope from '../../../course-scope.json' with { type: 'json' };

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
  return Array.from(article.querySelectorAll('h2[data-section], [data-lab]')).find(el=>
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
      if(destination.hasAttribute('data-lab'))destination.tabIndex=-1;
      destination.scrollIntoView({block:'start',behavior:'instant'});
      destination.focus({preventScroll:true});
    }else{
      window.scrollTo({top:0,behavior:'instant'});
      $('main').focus({preventScroll:true});
    }
  }
}
document.addEventListener('input',e=>{const lab=e.target.closest('[data-lab]');if(!lab)return;clearInterval(replayTimer);renderers[lab.dataset.lab]?.();});
document.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.new){const id=btn.dataset.new;seeds[id]=(seed(id)+7919)>>>0;clear(id);if(id==='coin'){coinCount=0;coinSequence++;coinMessage='A new sequence is ready. Reveal its tosses below.';}renderers[id]?.();}
  if(btn.id==='coin-toss'){coinCount=Math.min(12,coinCount+1);coinMessage=`${coinCount} of 12 tosses revealed.`;renderers.coin();}
  if(btn.id==='coin-reset'){coinCount=0;coinMessage='Same sequence rewound. “Toss next coin” reveals the same outcomes again.';renderers.coin();}

});
window.addEventListener('hashchange',()=>navigate());
window.addEventListener('hub:theme-change',()=>{refreshPalette();drawChapter(active);});
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);if(innerWidth>780)$('mobile-menu').open=true;resizeFrame=requestAnimationFrame(()=>drawChapter(active));});
window.addEventListener('beforeprint',()=>{refreshPalette();document.querySelectorAll('.chapter').forEach(el=>el.hidden=false);chapters.filter(c=>c.id!=='review').forEach(ch=>drawChapter(ch.id));document.querySelectorAll('details').forEach(d=>{d.dataset.wasOpen=d.open?'1':'0';d.open=true;});});
window.addEventListener('afterprint',()=>{refreshPalette();document.querySelectorAll('details').forEach(d=>d.open=d.dataset.wasOpen==='1');navigate(false);});
navigate(Boolean(location.hash.includes('/')));
