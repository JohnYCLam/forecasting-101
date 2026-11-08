import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
