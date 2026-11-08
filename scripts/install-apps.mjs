import { npm } from './npm.mjs';
for(const app of ['time-series-forecasting','stochastic-calculus'])npm(['ci'],new URL('../apps/'+app+'/',import.meta.url));
