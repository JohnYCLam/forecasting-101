import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import scope from '../course-scope.json' with {type:'json'};
const root=fileURLToPath(new URL('../dist/',import.meta.url));
for(const topic of ['time-series-forecasting','stochastic-calculus']){
  const dir=path.join(root,topic),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    if(!/\.(?:js|css|svg)$/.test(url))continue;
    const target=url.startsWith('/')?path.join(root,url.slice(1)):path.resolve(dir,url);
    assert.ok(fs.existsSync(target),'Missing built asset '+url);
  }
}
for(let i=1;i<=scope.forecastingMax;i++)assert.ok(fs.existsSync(path.join(root,'time-series-forecasting',`topic${i}_data.json`)));
assert.equal(fs.existsSync(path.join(root,'time-series-forecasting/topic6_data.json')),scope.forecastingMax>=6);
assert.ok(!fs.existsSync(path.join(root,'research-local')));
assert.ok(fs.readFileSync(path.join(root,'stochastic-calculus/preview.html'),'utf8').includes('creativecommons.org/licenses/by/4.0/'));
console.log('Combined output: assets, datasets, source attribution and branch scope verified.');
