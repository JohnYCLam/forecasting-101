import './style.css';
import 'katex/dist/katex.min.css';
import '../../../site/theme.css';
import { chapters } from './lesson.js';
import * as M from './math.js';
import * as P from './predictive-ml.js';
import * as S from './switching-ml.js';
import { sourceVisitCurve } from './switching-theory.js';
import { drawValley } from './switching-landscape.js';
import * as H from './barrier-ml.js';
import { inferValve, historicalMinutes, fitValveHistory, valveRisks } from './valve-alarm.js';
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
  const pad={l:options.leftPadding??Math.max(49,labelWidth+27),r:20,t:17,b:48},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
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
function sensorForecasts(sigma, count, x0, steps) {
  const training = cached('prediction', `${sigma}:${count}`, () => {
    const data = P.trainingData(sigma, count, seed('prediction'));
    return { ...data, model: P.fit(data.pairs) };
  });
  return cached('prediction', `bands:${sigma}:${count}:${x0}:${steps}`, () => {
    const prediction = P.forecast(training.model, x0, steps);
    const bayes = P.bayesianForecast(training.model, x0, steps);
    const lowerGap = bayes.lower.map((bound, i) => bound - prediction.lower[i]);
    const upperGap = bayes.upper.map((bound, i) => bound - prediction.upper[i]);
    const maxGap = Math.max(...lowerGap.map(Math.abs), ...upperGap.map(Math.abs));
    return { training, prediction, bayes, lowerGap, upperGap, maxGap };
  });
}

function drawBandDifferences(forecasts, duration, maxGap) {
  const { lowerGap, upperGap } = forecasts;
  const scale = maxGap > 0 ? maxGap * 1.12 : 1;
  const ticks = maxGap > 0 ? undefined : [0];
  const plot = chart('pred-band-gap', [0, duration], [-scale, scale], 'Time since forecast',
    'Difference in reading', { leftPadding: 78, yTicks: ticks, yFormat: y => Number(y.toPrecision(3)).toString() });
  if (!plot) return;
  plot.line([[0, 0], [duration, 0]], C.gray, 1.5, [2, 4]);
  plot.line(series(upperGap, duration), C.blue, 2.5);
  plot.line(series(lowerGap, duration), C.coral, 2.5, [6, 4]);
  const signed = x => (x > 0 ? '+' : '') + fmt(x, 5);
  out('pred-gap-note', forecasts.maxGap === 0 ? 'The bounds agree at every time shown.'
    : 'At time ' + fmt(duration, 1) + ', Bayesian minus SDE is ' + signed(upperGap.at(-1))
      + ' for the upper bound and ' + signed(lowerGap.at(-1)) + ' for the lower bound, in sensor units.');
}

function drawPredictiveBands(fixed, bayes, duration) {
  const view = $('pred-band-view').value;
  const range = limits([fixed.lower, fixed.upper, bayes.lower, bayes.upper], 0.08, false);
  const plot = chart('pred-bounds', [0, duration], range, 'Time since forecast', 'Sensor reading', { leftPadding: 78 });
  if (!plot) return;
  const bands = [];
  if (view !== 'bayes') bands.push({ forecast: fixed, color: C.teal, dash: [] });
  if (view !== 'sde') bands.push({ forecast: bayes, color: C.blue, dash: [6, 4] });
  for (const { forecast, color } of bands) {
    plot.band(series(forecast.lower, duration), series(forecast.upper, duration), color);
  }
  for (const { forecast, color, dash } of bands) {
    plot.line(series(forecast.lower, duration), color, 1.6, dash);
    plot.line(series(forecast.upper, duration), color, 1.6, dash);
    plot.line(series(forecast.mean, duration), color, 2.5, dash);
  }
  const endpoint = f => '[' + fmt(f.lower.at(-1), 4) + ', ' + fmt(f.upper.at(-1), 4) + ']';
  out('pred-width-note', 'At time ' + fmt(duration, 1) + ', the SDE prediction interval is '
    + endpoint(fixed) + ' and the Bayesian prediction interval is ' + endpoint(bayes) + '.');
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

let switchingReplay;
let switchingTimer;

function pauseSwitching() {
  clearInterval(switchingTimer);
  switchingTimer = null;
  const play = $('switch-play');
  if (play) play.textContent = 'Play';
}

const switchingLabels = { point: 'Drift only', sde: 'Learned SDE', kernel: 'Empirical transitions' };

function selectSwitchingExamples(result) {
  // Select only from the stored illustration paths; all hits enter the rates.
  const hits = result.hits.slice(0, result.paths.length);
  const choices = [
    [hits.findIndex(Number.isFinite), 'Reaches the flag'],
    [hits.findIndex(hit => !Number.isFinite(hit)), 'Stays below the flag']
  ].filter(([index]) => index >= 0);
  const select = $('switch-example');
  select.replaceChildren(...choices.map(([index, label]) => new Option(label, String(index))));
  select.disabled = choices.length === 1;
  out('switch-example-note', result.paths.length === 1
    ? 'The drift-only forecast has one trajectory from this start.'
    : 'Replays are selected by outcome from the first ' + result.paths.length + ' stored trajectories. '
      + (choices.length === 1 ? 'Only this outcome appears among them. ' : 'Try the other outcome from the same model. ')
      + 'Event rates below use all 2,000 simulated futures.');
}

function drawSwitchingFrame() {
  if (!switchingReplay) return;
  const { predictions, duration, model } = switchingReplay;
  const frame = value('switch-frame'), time = frame * S.OBS_STEP;
  const result = predictions[model], example = value('switch-example');
  const path = result.paths[example], hit = result.hits[example], reached = hit <= frame;
  const color = { point: C.coral, sde: C.teal, kernel: C.blue }[model];
  const extent = Math.max(1.7, ...path.map(x => Math.abs(x) + 0.10));
  drawValley($('switch-valley'), path[frame], extent, S.THRESHOLD, reached, C, color);
  const trace = chart('switch-walk', [0, duration], [-extent, extent], 'Time since forecast', 'Position');
  trace?.line([[0, S.THRESHOLD], [duration, S.THRESHOLD]], C.gray, 1.7, [2, 4]);
  trace?.line([[time, -extent], [time, extent]], C.muted, 1, [2, 4]);
  trace?.line(path.slice(0, frame + 1).map((x, j) => [j * S.OBS_STEP, x]), color, 2.3);
  if (reached) {
    trace?.line([[hit * S.OBS_STEP, S.THRESHOLD], [hit * S.OBS_STEP, path[hit]]], C.gold, 2);
    trace?.point(hit * S.OBS_STEP, S.THRESHOLD, C.gold);
  }
  trace?.point(time, path[frame], color);
  slider('switch-frame', fmt(time, 2));
  out('switch-frame-note', switchingLabels[model] + ' · time ' + fmt(time, 2) + ' · position '
    + fmt(path[frame], 2) + ' · ' + (reached ? 'first recorded hit at time ' + fmt(hit * S.OBS_STEP, 2) : 'flag not yet reached') + '.');

  if (!switchingTimer) $('switch-play').textContent = frame === path.length - 1 ? 'Replay' : 'Play';
}

function playSwitching() {
  if (switchingTimer) { pauseSwitching(); return; }
  const slider = $('switch-frame');
  if (value('switch-frame') >= Number(slider.max)) slider.value = 0;
  $('switch-play').textContent = 'Pause';
  switchingTimer = setInterval(() => {
    slider.value = value('switch-frame') + 1;
    if (value('switch-frame') === Number(slider.max)) pauseSwitching();
    drawSwitchingFrame();
  }, 55);
  drawSwitchingFrame();
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
valve(){
  const prior = value('valve-prior'), count = value('valve-count');
  const fit = cached('valve', `${prior}:${count}`, () => {
    const history = fitValveHistory(historicalMinutes(count, prior, seed('valve')));
    return {...history, risks: valveRisks(history.sigma)};
  });
  const reference = inferValve(prior), prediction = inferValve(fit.prior, fit.risks);
  const pct = p => fmt(100 * p, 2) + '%';
  const frequency = (1 / prior).toLocaleString('en');
  out('valve-target', `With one opening per ${frequency} minutes, a known drop of 0.60 and background noise strength 0.10, the theoretical chance of a low-pressure alarm is ${pct(reference.alarm)}. This is the target for the missing log.`);
  out('valve-fit', `The training log contains ${fit.openings.toLocaleString('en')} openings in ${count.toLocaleString('en')} minutes. The fitted opening frequency is ${fmt(100 * fit.prior, 3)}% per minute and the fitted background noise strength is ${fmt(fit.sigma, 4)}.`);
  out('valve-reference', pct(reference.alarm));
  out('valve-baseline', pct(fit.risks.closed));
  out('valve-alarm', pct(prediction.alarm));
  const gap = 100 * (prediction.alarm - reference.alarm);
  const difference = Math.abs(gap) < 0.01 ? 'within 0.01 percentage points of theory'
    : fmt(Math.abs(gap), 2) + ' percentage points ' + (gap < 0 ? 'below' : 'above') + ' theory';
  out('valve-interpretation', fit.openings === 0
    ? 'These records contain no openings, so the empirical opening frequency is zero. With a missing log the jump model gives all the weight to continuous motion. A longer history may capture an opening.'
    : `The jump model is ${difference}. The continuous-only baseline has the same noise estimate, but can explain the pressure fall only through Brownian motion.`);
  const openings = fit.openings.toLocaleString('en');
  const closures = (count - fit.openings).toLocaleString('en');
  const ratio = Math.exp(fit.risks.logLikelihoodRatio).toLocaleString('en', {maximumFractionDigits: 0});
  const weight = prediction.opened;
  out('valve-history-odds', `Current training records: ${openings} opened and ${closures} stayed closed. The starting opening probability is ${openings} / ${count.toLocaleString('en')} = ${fmt(100 * fit.prior, 3)}%.`);
  out('valve-likelihood', `With fitted noise strength ${fit.sigma.toFixed(7)}, the required fluctuation is ${fmt(0.50 / fit.sigma, 2)} standard deviations below zero if closed, or ${fmt(0.10 / fit.sigma, 2)} above zero if opened. The likelihood ratio L is about ${ratio} in favor of an opening.`);
  out('valve-posterior', `P(opened given the pressure readings) ≈ (${openings} × ${ratio}) / [(${openings} × ${ratio}) + ${closures}] = ${pct(weight)}.`
    + (fit.openings === 0 ? ' With zero openings in the training records, the fitted starting odds are zero. Multiplying them by this evidence leaves them at zero.' : ''));
  out('valve-conditional-risks', `Using the current fit gives q₀ = ${pct(fit.risks.closed)} with the valve closed and q₁ ≈ ${pct(fit.risks.opened)} with one opening (numerical integration).`);
  out('valve-mixture', `P(alarm given the pressure readings) ≈ ${(1-weight).toFixed(6)} × ${pct(fit.risks.closed)} + ${weight.toFixed(6)} × ${pct(fit.risks.opened)} ≈ ${pct(prediction.alarm)}. Displayed inputs are rounded.`);
  out('valve-inference', fit.openings === 0
    ? 'With no openings in the training sample, the fitted opening probability remains zero after the pressure readings.'
    : `In the current fit, the pressure fall raises the opening probability from ${fmt(100 * fit.prior, 3)}% to ${pct(weight)}. The estimated alarm probability is ${pct(prediction.alarm)}.`);
  if ($('valve-log').value === 'closed') {
    out('valve-reading', `The record says the valve stayed closed. A hidden alarm now requires pressure to dip to 0.45 and recover to 0.50 through ordinary fluctuations. The fitted alarm estimate is ${pct(fit.risks.closed)}, compared with ${pct(prediction.alarm)} before finding the record.`);
  } else {
    out('valve-reading', `The record confirms one opening. We still do not know the pressure just before the drop. A drop from 1.04 would trigger the alarm, while a drop from 1.12 would land above the threshold. The fitted alarm estimate is ${pct(fit.risks.opened)}, compared with ${pct(prediction.alarm)} before finding the record.`);
  }
},
barrier(){
  const threshold = value('barrier-threshold'), sigma = value('barrier-sigma'), count = value('barrier-count');
  slider('barrier-threshold');
  slider('barrier-sigma');
  const fitted = cached('barrier', `fit:${sigma}:${count}`, () => H.fit(H.trainingData(sigma, count, seed('barrier'))));
  const reading = value('barrier-reading'), time = value('barrier-time');
  slider('barrier-reading', fmt(reading, 2));
  slider('barrier-time', fmt(time, 2));
  const percent = p => p > 0 && p < 0.0001 ? 'less than 0.01%' : p < 1 && p > 0.9999 ? 'over 99.99%' : fmt(100 * p, 2) + '%';
  const endpoints = H.segmentCrossing(0, 0, 1, sigma, threshold);
  const fittedEndpoints = H.segmentCrossing(0, 0, 1, fitted.sigma, threshold);
  out('barrier-fit', `From ${count.toLocaleString('en')} independent training increments the model estimates a noise strength of ${fmt(fitted.sigma, 3)}. The source setting is ${fmt(sigma, 3)}.`);
  out('barrier-exact', percent(endpoints));
  out('barrier-estimated', percent(fittedEndpoints));
  out('barrier-visible', '0%');
  out('barrier-mid-exact', percent(H.extraReadingRisk(0.60, 0.50, sigma, threshold).total));
  out('barrier-mid-estimated', percent(H.extraReadingRisk(0.60, 0.50, fitted.sigma, threshold).total));
  out('barrier-mid-visible', 0.60 >= threshold ? '100%' : '0%');
  const difference = 100 * (fittedEndpoints - endpoints);
  const gap = Math.abs(difference) < 0.01 ? 'within 0.01 percentage points of theory'
    : fmt(Math.abs(difference), 2) + ' percentage points ' + (difference < 0 ? 'below' : 'above') + ' theory';
  out('barrier-fit-result', 'With just the two zeros, the learned estimate is ' + gap + '. '
    + 'A larger fitted noise strength makes a hidden excursion to the threshold more likely.');

  const panel = chart('barrier-response', [-1, 1.5], [0, 1], 'Extra sensor reading', 'Chance of a touch',
    { xTicks: [-1, -0.5, 0, 0.5, 1, 1.5], yFormat: p => Math.round(100 * p) + '%' });
  panel?.line([[-1, endpoints], [1.5, endpoints]], C.gray, 1.7, [2, 4]);
  for (const [noise, color, dash] of [[sigma, C.teal, []], [fitted.sigma, C.blue, [6, 4]]]) {
    const curve = Array.from({length: 251}, (_, i) => {
      const x = (i - 100) / 100;
      return [x, H.extraReadingRisk(x, time, noise, threshold).total];
    });
    panel?.line(curve, color, 2, dash);
    panel?.point(reading, H.extraReadingRisk(reading, time, noise, threshold).total, color);
  }
  const risk = H.extraReadingRisk(reading, time, sigma, threshold);
  const learned = H.extraReadingRisk(reading, time, fitted.sigma, threshold).total;
  out('barrier-evidence', `For a reading of ${fmt(reading, 2)} at time ${fmt(time, 2)}, theory gives ${percent(risk.total)} and the learned bridge gives ${percent(learned)}. `
    + (reading >= threshold ? 'The reading confirms a touch.' : `The theoretical chance with only the two zeros is ${percent(endpoints)}.`));
  out('barrier-gaps', `At the selected settings the first gap lasts ${fmt(time, 2)} (touch chance ${percent(risk.first)}), and the second lasts ${fmt(1-time, 2)} (touch chance ${percent(risk.second)}). Together they give ${percent(risk.total)}.`);
  if (!$('barrier-diagnostics').open) return;
  const rows = cached('barrier-test', 'source', () => H.testData(seed('barrier-test')));
  const result = cached('barrier', `scores:${seed('barrier-test')}:${sigma}:${count}:${threshold}`,
    () => H.evaluate(rows, 2, sigma, fitted.sigma, threshold));
  out('barrier-naive-score', fmt(result.seenBrier, 4));
  out('barrier-sde-score', fmt(result.bridgeBrier, 4));
  const calibration = chart('barrier-calibration', [0, 1], [0, 1], 'Predicted probability', 'Observed alarm fraction');
  calibration?.line([[0, 0], [1, 1]], C.gray, 1.5, [5,3]);
  H.reliability(result.predictions, result.labels).forEach(group => calibration?.point(group.predicted, group.observed, C.teal));
},
switching(){
  const sigma=value('switch-noise'),count=value('switch-count'),x0=value('switch-start'),T=value('switch-horizon');
  slider('switch-noise');slider('switch-horizon',`${T} time units`);
  const theory = cached('switching-theory', [sigma, x0, T].join(':'), () => sourceVisitCurve(sigma, x0, T));
  const benchmark = theory.at(-1);
  const theoreticalRate = benchmark === 0 ? '0%' : benchmark < 0.0001 ? 'less than 0.01%' : fmt(100 * benchmark, 2) + '%';
  out('switch-theory', 'The theoretical chance is ' + theoreticalRate + ' from position ' + fmt(x0, 1)
    + ' with noise strength ' + fmt(sigma, 1) + ' by time ' + fmt(T, 0) + ' (' + (theory.length - 1) + ' readings).');
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
  const model = $('switch-model').value;
  if (switchingReplay?.predictions !== predictions || switchingReplay.model !== model) {
    pauseSwitching();
    selectSwitchingExamples(predictions[model]);
    $('switch-frame').max = point.paths[0].length - 1;
    $('switch-frame').value = 0;
  }
  switchingReplay = { predictions, duration: T, model };
  drawSwitchingFrame();
  const rate = p => fmt(100 * p, 2) + '%';
  const outcome = result => result.hits.filter(Number.isFinite).length.toLocaleString('en')
    + ' of ' + result.hits.length.toLocaleString('en') + ' paths reach the flag (' + rate(result.probability) + ').';
  out('switch-point-outcome', 'Ends at ' + fmt(point.endpoints[0], 2) + '. '
    + (point.probability ? 'Reaches the flag' : 'Stays below the flag') + ' (' + rate(point.probability) + ').');
  out('switch-sde-outcome', outcome(sde));
  out('switch-kernel-outcome', outcome(kernel));
  out('switch-fit-check', 'At positions −0.5 and +0.5, the source pulls at −0.375 and +0.375 units per unit time. '
    + 'The fitted drift gives ' + fmt(S.drift(training.model, -0.5), 3) + ' and ' + fmt(S.drift(training.model, 0.5), 3)
    + '. The learned SDE estimates kick strength ' + fmt(training.model.sigma, 3) + ' against a source setting of '
    + fmt(sigma, 3) + '. Replaying those learned movements over many steps tests whether the local fit also gets the visit rate right.');

  const gap = p => {
    const points = 100 * (p - benchmark);
    if (points === 0) return 'matches the theoretical rate';
    if (Math.abs(points) < 0.05) return 'is within 0.05 percentage points of theory';
    return 'is ' + fmt(Math.abs(points), 1) + ' percentage points ' + (points < 0 ? 'below' : 'above') + ' the reference';
  };
  const spread = 100 * Math.abs(sde.probability - kernel.probability);
  out('switch-interpretation', 'Against the theoretical probability of ' + theoreticalRate
    + ', drift only ' + gap(point.probability) + ', the learned SDE ' + gap(sde.probability)
    + ', and empirical transitions ' + gap(kernel.probability) + '. '
    + (spread === 0 ? 'The two stochastic forecasts agree in this run.' : 'The two stochastic forecasts differ by ' + fmt(spread, 2) + ' percentage points.')
    + (sigma === 0 ? ' With zero source noise the true path is deterministic; any remaining spread in the fitted models comes from estimation and the observation spacing.'
      : ' The stochastic rates can move with the training records and simulated paths.'));
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
  out('switch-fit',`Cubic drift fitted from ${training.model.n.toLocaleString()} observed transitions: coefficients (${cs.map(x=>fmt(x,3)).join(', ')}), in order 1, x, x², x³. Learned noise strength ${fmt(training.model.sigma,3)}. All models use the same training records.`);
  for(const [name,result]of Object.entries(predictions)){
    const score=S.scores(result,test);
    out(`switch-${name}-prob`,`${fmt(100*result.probability,1)}%`);out(`switch-${name}-crps`,fmt(score.crps,4));out(`switch-${name}-brier`,fmt(score.brier,4));
  }
  const sourceMean=test.mean.at(-1),sdeMean=sde.mean.at(-1),pointEnd=point.endpoints[0];
  out('switch-mean',`At the final time: drift-only position ${fmt(pointEnd,2)}, average SDE position ${fmt(sdeMean,2)}, average unseen source position ${fmt(sourceMean,2)}. The SDE average need not follow the drift-only curve, even though they share exactly the same learned drift.`);
  const omitted=Object.entries(histograms).map(([name,h])=>`${name==='test'?'source':name==='sde'?'SDE':'empirical'} ${h.outside}`).join(', ');
  out('switch-reference',`Endpoint counts outside the plotted range (−2.6 to 2.6) are ${omitted}.`);
  out('switch-result',sigma===0?(x0===0?'With zero source noise and a start exactly at the hilltop, the source stays at zero. Fitted models may leave it because tiny drift errors grow at this unstable state. This setting exposes model error, rather than genuine random switching.':'At zero source noise, the source stays in the left valley. Small fitted residual noise can remain because finite-interval changes are only approximately described by a cubic Euler drift. Neither the coefficient estimate nor its residual is exact.'):'Both probabilistic models can predict branching futures. Compare their scores: the empirical model may match or beat the SDE. This experiment demonstrates the effect of nonlinear random dynamics, rather than a universal performance advantage for SDEs. Histogram lines and event estimates fluctuate with finite simulated ensembles.');
},
prediction(){
  const sigma=value('pred-noise'),count=value('pred-count'),x0=value('pred-start'),T=value('pred-horizon'),steps=Math.round(T/P.STEP);
  slider('pred-noise');slider('pred-start');slider('pred-horizon',`${fmt(T,1)} time units`);
  const forecasts = sensorForecasts(sigma, count, x0, steps);
  const { training, prediction, bayes } = forecasts;
  const learned = training.model;
  const comparison = P.compareOneStep(learned, x0);
  drawPredictiveBands(prediction, bayes, T);
  const comparing = $('pred-band-view').value === 'both';
  $('pred-gap-panel').hidden = !comparing;
  if (comparing) {
    const shared = $('pred-gap-scale').value === 'shared';
    const maxGap = shared
      ? Math.max(...Array.from($('pred-count').options, option => sensorForecasts(sigma, Number(option.value), x0, steps).maxGap))
      : forecasts.maxGap;
    drawBandDifferences(forecasts, T, maxGap);
  }
  $('pred-band-horizon').value = T;
  slider('pred-band-horizon', fmt(T, 1));
  const interval = width => '[' + fmt(comparison.mean - width, 4) + ', ' + fmt(comparison.mean + width, 4) + ']';
  $('pred-bayes-count').value = String(count);
  out('pred-center', count + ' training paths · starting reading ' + fmt(x0, 1) + ' · source noise ' + fmt(sigma, 1) + ' · shared one-step forecast mean ' + fmt(comparison.mean, 4));
  out('pred-fixed-future', interval(comparison.fixedFuture));
  out('pred-bayes-future', interval(comparison.bayesFuture));
  out('pred-bayes-mean', interval(comparison.bayesMean));
  const distance = Math.abs(2.10 - comparison.mean);
  const inSde = distance <= comparison.fixedFuture;
  const inBayes = distance <= comparison.bayesFuture;
  const readings = inSde === inBayes
    ? (inSde ? 'inside both prediction intervals' : 'outside both central prediction intervals')
    : (inBayes ? 'inside only the Bayesian prediction interval' : 'inside only the SDE prediction interval');
  const meanInterval = distance <= comparison.bayesMean ? 'inside' : 'outside';
  out('pred-reading-answer', 'With these settings, 2.10 is ' + readings + ' for one sensor. It is '
    + meanInterval + ' the Bayesian credible interval for the average next reading.');
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
  out('pred-fit', `Fit from ${learned.n.toLocaleString()} training pairs · slope a = ${fmt(learned.a,4)} · intercept b = ${fmt(learned.b,4)} · step noise s = ${fmt(Math.sqrt(learned.variance),4)}.`);
  out('pred-rmse-point',fmt(evaluation.rmse,4));out('pred-rmse-stochastic',fmt(evaluation.rmse,4));out('pred-sd',fmt(sd,4));out('pred-coverage',`${fmt(100*evaluation.coverage,1)}% · target 90%`);
  const intervalAtEnd = '[' + fmt(prediction.lower[steps],3) + ', ' + fmt(prediction.upper[steps],3) + ']';
  out('pred-result', `At time ${fmt(T,1)}, both forecasts give a mean of ${fmt(mu,3)}. The fitted SDE transition gives a 90% prediction interval ${intervalAtEnd}. It contains ${fmt(100*evaluation.coverage,1)}% of the 2,000 unseen readings.`);
  const truth=P.forecast(P.transition(sigma),x0,steps);
  out('pred-truth',`Analytic source reference at the selected endpoint: mean ${fmt(truth.mean[steps],4)}, standard deviation ${fmt(Math.sqrt(truth.variance[steps]),4)}. These values are for comparison after fitting.`);
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
};

const nav=$('navigation');
nav.insertAdjacentHTML('afterend',pendingTopics('calculus',scope.calculusMax));
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('main').focus();});
nav.innerHTML=chapters.map(ch=>`${ch.id==='reference'?'<div class="nav-divider"></div>':''}<a href="#${ch.id}" data-nav="${ch.id}"><span>${ch.number}</span>${ch.label}</a>`).join('');
$('main').innerHTML=chapters.map((ch,i)=>`<article class="chapter" data-id="${ch.id}" id="chapter-${ch.id}" ${i?'hidden':''}>${ch.id==='intro'?'':`<div class="chapter-top"><div class="chapter-num">${/^\d/.test(ch.number)?'SECTION':'REFERENCE'} ${ch.number}</div><h1>${ch.title}</h1><p class="deck">${ch.deck}</p></div><div class="chapter-outline" aria-label="In this section"></div>`}${ch.html()}<div class="chapter-bottom">${i?`<a href="#${chapters[i-1].id}">← ${chapters[i-1].label}</a>`:'<span></span>'}${i<chapters.length-1?`<a class="next" href="#${chapters[i+1].id}">Continue · ${chapters[i+1].label} →</a>`:'<a class="next" href="#intro">Back to the beginning ↑</a>'}</div></article>`).join('');
document.querySelectorAll('.chapter').forEach(ch=>{
  const outline=ch.querySelector('.chapter-outline');if(!outline)return;
  const label=document.createElement('span');label.className='outline-label';label.textContent='IN THIS SECTION';outline.append(label);
  const demoGroups = new Map();
  ch.querySelectorAll('h2[data-section]').forEach(heading => {
    const anchor = document.createElement('a');
    anchor.href = `#${ch.dataset.id}/${heading.dataset.section}`;
    anchor.textContent = heading.textContent.trim();
    const demo = heading.closest('.learning-demo');
    if (!demo) { outline.append(anchor); return; }
    if (!demoGroups.has(demo)) {
      const group = document.createElement('div');
      group.className = 'learning-demo-links';
      group.dataset.learningDemo = demo.dataset.learningDemo;
      outline.append(group);
      demoGroups.set(demo, group);
    }
    demoGroups.get(demo).append(anchor);
  });
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
  pauseSwitching();
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
document.addEventListener('toggle', e => {
  if (e.target.matches('details[data-charts]') && e.target.open) {
    const lab = e.target.closest('[data-lab]');
    renderers[lab.dataset.lab]();
  }
}, true);
$('pred-gap-scale')?.addEventListener('input', () => renderers.prediction());
$('pred-band-view')?.addEventListener('input', () => renderers.prediction());
$('pred-band-horizon')?.addEventListener('input', e => {
  $('pred-horizon').value = e.target.value;
  renderers.prediction();
});
$('pred-bayes-count')?.addEventListener('input', e => {
  $('pred-count').value = e.target.value;
  renderers.prediction();
});
document.addEventListener('input',e=>{if(e.target.id==='switch-example'){pauseSwitching();$('switch-frame').value=0;drawSwitchingFrame();return;}if(e.target.id==='switch-frame'){pauseSwitching();drawSwitchingFrame();return;}const lab=e.target.closest('[data-lab]');if(!lab)return;clearInterval(replayTimer);renderers[lab.dataset.lab]?.();});
document.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.new){const id=btn.dataset.new;seeds[id]=(seed(id)+7919)>>>0;clear(id);if(id==='coin'){coinCount=0;coinSequence++;coinMessage='A new sequence is ready. Reveal its tosses below.';}renderers[id]?.();}
  if(btn.id==='coin-toss'){coinCount=Math.min(12,coinCount+1);coinMessage=`${coinCount} of 12 tosses revealed.`;renderers.coin();}
  if(btn.id==='coin-reset'){coinCount=0;coinMessage='Same sequence rewound. “Toss next coin” reveals the same outcomes again.';renderers.coin();}
  if(btn.dataset.preset){$('lambda-value').value=btn.dataset.preset==='ito'?'0':'.5';renderers.lambda();}
  if(btn.id==='pred-test'){seeds['prediction-test']=(seed('prediction-test')+7919)>>>0;clear('prediction-test');renderers.prediction();}
  if(btn.id==='switch-play')playSwitching();
  if(btn.id==='switch-test'){seeds['switching-test']=(seed('switching-test')+7919)>>>0;clear('switching-test');renderers.switching();}
  if (btn.id === 'barrier-test') {
    seeds['barrier-test'] = (seed('barrier-test') + 7919) >>> 0;
    clear('barrier-test');
    renderers.barrier();
  }
});
window.addEventListener('hashchange',()=>navigate());
window.addEventListener('hub:theme-change',()=>{refreshPalette();drawChapter(active);});
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);if(innerWidth>780)$('mobile-menu').open=true;resizeFrame=requestAnimationFrame(()=>drawChapter(active));});
window.addEventListener('beforeprint',()=>{refreshPalette();document.querySelectorAll('.chapter').forEach(el=>el.hidden=false);chapters.filter(c=>c.id!=='review').forEach(ch=>drawChapter(ch.id));document.querySelectorAll('details').forEach(d=>{d.dataset.wasOpen=d.open?'1':'0';d.open=true;});});
window.addEventListener('afterprint',()=>{refreshPalette();document.querySelectorAll('details').forEach(d=>d.open=d.dataset.wasOpen==='1');navigate(false);});
navigate(Boolean(location.hash.includes('/')));
