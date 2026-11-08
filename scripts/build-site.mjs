import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { npm } from './npm.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'dist');
if(path.dirname(out)!==path.resolve(root))throw Error('Unexpected build output.');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'site'),out,{recursive:true});
for(const app of ['time-series-forecasting','stochastic-calculus']){
  const dir=path.join(root,'apps',app);
  npm(['run','build'],dir);
  fs.cpSync(path.join(dir,'dist'),path.join(out,app),{recursive:true});
}
await import('./validate-output.mjs');
console.log('Combined static site: dist/');
