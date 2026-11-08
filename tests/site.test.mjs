import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { sharedTheme } from '../scripts/vite-theme.mjs';
import { pendingTopics, upcomingTopics } from '../site/navigation.js';
import { chapters } from '../apps/stochastic-calculus/src/chapters.js';
import scope from '../course-scope.json' with {type:'json'};
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');

test('published menus and source files match the branch scope',()=>{
  const numeric=chapters.filter(ch=>/^\d/.test(ch.number));
  assert.ok(numeric.every(ch=>parseInt(ch.number,10)<=scope.calculusMax));
  for(let i=0;i<=Math.min(scope.calculusMax,7);i++)assert.ok(numeric.some(ch=>parseInt(ch.number,10)===i));
  assert.equal(fs.existsSync(new URL('apps/time-series-forecasting/src/Topic6.jsx',root)),scope.forecastingMax>=6);
  assert.equal(fs.existsSync(new URL('apps/time-series-forecasting/public/topic6_data.json',root)),scope.forecastingMax>=6);
  const app=read('apps/time-series-forecasting/src/App.jsx');
  assert.equal(app.includes('<Topic6 '),scope.forecastingMax>=6);
  const portal=read('site/index.html');
  assert.ok(portal.includes('Sections 1–'+scope.forecastingMax));
  assert.ok(portal.includes('Sections 0–'+scope.calculusMax));
});

test('all chapter links resolve within the published calculus scope',()=>{
  const htmls=Object.fromEntries(chapters.map(ch=>[ch.id,ch.html()]));
  for(const html of Object.values(htmls))for(const [,id,section]of html.matchAll(/href="#([^"/]+)(?:\/([^"]+))?"/g)){
    assert.ok(htmls[id],`Missing chapter ${id}`);
    if(section)assert.ok(htmls[id].includes(`data-section="${section}"`)||(section.startsWith('demo-')&&htmls[id].includes(`data-lab="${section.slice(5)}"`)),`Missing section ${id}/${section}`);
  }
});

test('topic paths, data requests, shared theme and source attribution survive assembly',()=>{
  const homepage=read('site/index.html');
  for(const topic of ['time-series-forecasting','stochastic-calculus'])assert.ok(homepage.includes('href="/'+topic+'/"'));
  for(const file of fs.readdirSync(new URL('apps/time-series-forecasting/src/',root)).filter(n=>n.endsWith('.jsx'))){
    assert.ok(!/fetch\(['"`]\/topic\d/.test(read('apps/time-series-forecasting/src/'+file)),file);
  }
  for(const p of ['apps/time-series-forecasting/src/main.jsx','apps/stochastic-calculus/src/main.js'])assert.ok(read(p).includes('../../../site/theme.css'));
  assert.ok(read('apps/stochastic-calculus/src/content/sources.js').includes('creativecommons.org/licenses/by/4.0/'));
  const config=JSON.parse(read('vercel.json'));
  assert.equal(config.outputDirectory,'dist');assert.equal(config.framework,null);
});

function themePage({saved=null,darkSystem=false,blockedStorage=false}={}){
  const data=new Map(saved===null?[]:[['learning-hub-theme',saved]]);
  const windowEvents={},documentEvents={},systemEvents={};
  const root={dataset:{},style:{}};
  const system={matches:darkSystem,addEventListener:(name,fn)=>systemEvents[name]=fn};
  const toggle={label:{},icon:{},attributes:{},setAttribute(name,value){this.attributes[name]=value;},querySelector(selector){return selector==='[data-theme-label]'?this.label:this.icon;}};
  const document={documentElement:root,querySelectorAll:selector=>selector==='[data-theme-toggle]'?[toggle]:[],getElementById:()=>null,addEventListener:(name,fn)=>documentEvents[name]=fn};
  const window={matchMedia:query=>query.includes('color-scheme')?system:{matches:false,addEventListener(){}},addEventListener:(name,fn)=>windowEvents[name]=fn,dispatchEvent:event=>windowEvents[event.type]?.(event)};
  const localStorage={getItem:key=>{if(blockedStorage)throw Error('Storage blocked');return data.get(key)??null;},setItem:(key,value)=>{if(blockedStorage)throw Error('Storage blocked');data.set(key,value);}};
  vm.runInNewContext(read('site/theme.js'),{window,document,localStorage,Event});
  return {root,data,system,systemEvents,windowEvents,toggle,click:()=>documentEvents.click({target:{closest:selector=>selector==='[data-theme-toggle]'?toggle:null}})};
}

test('shared theme persists across pages and overrides the system preference',()=>{
  const first=themePage({darkSystem:false});
  assert.equal(first.root.dataset.theme,'light');
  first.click();assert.equal(first.root.dataset.theme,'dark');
  assert.equal(first.toggle.label.textContent,'Light mode');
  assert.equal(first.toggle.attributes['aria-label'],'Switch to light mode');
  const next=themePage({saved:first.data.get('learning-hub-theme'),darkSystem:false});
  assert.equal(next.root.dataset.theme,'dark');
  next.click();assert.equal(next.data.get('learning-hub-theme'),'light');
});

test('theme follows the system until chosen, and works with blocked storage',()=>{
  const page=themePage({saved:'invalid',darkSystem:true,blockedStorage:true});
  assert.equal(page.root.dataset.theme,'dark');
  page.system.matches=false;page.systemEvents.change();
  assert.equal(page.root.dataset.theme,'light');
  page.click();assert.equal(page.root.dataset.theme,'dark');
  page.systemEvents.change();assert.equal(page.root.dataset.theme,'dark');
});

test('theme changes synchronize across open tabs and handle a cleared preference',()=>{
  const page=themePage({saved:'light',darkSystem:true});
  page.windowEvents.storage({key:'learning-hub-theme',newValue:'dark'});
  assert.equal(page.root.dataset.theme,'dark');
  page.windowEvents.storage({key:null,newValue:null});
  assert.equal(page.root.dataset.theme,'dark');
  page.system.matches=false;page.systemEvents.change();
  assert.equal(page.root.dataset.theme,'light');
});

test('both Vite apps use the same theme bootstrap before paint',()=>{
  const plugin=sharedTheme();
  assert.equal(plugin.transformIndexHtml.order,'pre');
  for(const app of ['time-series-forecasting','stochastic-calculus']){
    assert.ok(read(`apps/${app}/vite.config.js`).includes('sharedTheme()'));
    const html=plugin.transformIndexHtml.handler(read(`apps/${app}/index.html`));
    assert.ok(html.includes(read('site/theme.js')));
    assert.ok(html.indexOf('charset=')<html.indexOf('<script>'));
    assert.ok(html.indexOf('<script>')<html.indexOf('<body'));
  }
  assert.ok(read('site/index.html').indexOf('/theme.js')<read('site/index.html').indexOf('/theme.css'));
});

test('roadmaps expose labels and status without links or unpublished lessons',()=>{
  for(const [topic,max] of [['forecasting',scope.forecastingMax],['calculus',scope.calculusMax]]){
    const html=pendingTopics(topic,max);
    assert.ok(!/<a\b|<button\b|href=/.test(html));
    for(const item of upcomingTopics[topic])assert.equal(html.includes(item.label),parseInt(item.number,10)>max);
  }
  assert.ok(pendingTopics('forecasting',5).includes('Planned'));
  assert.ok(!pendingTopics('forecasting',6).includes('Traditional machine learning'));
});
