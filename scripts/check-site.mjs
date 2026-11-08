import { npm } from './npm.mjs';
for(const app of ['time-series-forecasting','stochastic-calculus'])npm(['test'],new URL('../apps/'+app+'/',import.meta.url));
npm(['exec','--','node','--test','tests/site.test.mjs'],new URL('../',import.meta.url));
