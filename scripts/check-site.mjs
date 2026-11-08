import { npm } from './npm.mjs';
import { spawnSync } from 'node:child_process';
for(const app of ['time-series-forecasting','stochastic-calculus'])npm(['test'],new URL('../apps/'+app+'/',import.meta.url));
const result=spawnSync(process.execPath,['--test','tests/site.test.mjs'],{cwd:new URL('../',import.meta.url),stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
