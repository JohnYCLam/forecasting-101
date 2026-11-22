import {topic} from './topics.js';

const stop = new Set(('a an and are as at be by can could did do does for from has have how i in into is it its me my of on or our should show that the their them then there these they this those to us was we what when where which who why will with would you your please about find explain tell example examples more give course section up lets one another').split(' '));
const aliases = [
  [/\b(?:ornstein[\s–—-]+uhlenbeck|ou)\b/g, 'ornstein_uhlenbeck'],
  [/\b(?:geometric brownian motion|gbm)\b/g, 'geometric_brownian_motion'],
  [/\b(?:stochastic differential equations?|sdes?)\b/g, 'stochastic_differential_equation'],
  [/\b(?:central limit theorem|clt)\b/g, 'central_limit_theorem'],
  [/\b(?:euler[\s–—-]+maruyama|euler maruyama)\b/g, 'euler_maruyama'],
  [/\b(?:wiener process|brownian motion)\b/g, 'brownian motion'],
  [/\b(?:glossary|notation|symbols)\b/g, 'notation'],
  [/\b(?:simulation|simulate|interactive|experiment|demo)\b/g, 'experiment']
];

export function tokens(input) {
  let value = input.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
    .replace(/\\mathrm\{d\}|\\mathrm\s+d/g,'d')
    .replace(/\(?\s*\bd\s*w\b\s*\)?\s*(?:²|\^\s*\{?2\}?)/g,' dw_squared ')
    .replace(/\\delta|δ/g,' delta ').replace(/\bdelta\s*w\b/g,' brownian_increment ');
  for (const [pattern,replacement] of aliases) value = value.replace(pattern, replacement);
  return (value.match(/[\p{L}][\p{L}\p{N}_]*/gu) || [])
    .filter(word => word.length > 1 && !stop.has(word))
    .map(word => word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0,-1) : word);
}

export function buildLexical(passages) {
  const df = new Map();
  const docs = passages.map(p => {
    const headings = tokens(p.title + ' ' + topic(p));
    const words = [...headings,...headings,...tokens(p.context + ' ' + p.text)];
    const counts = new Map();
    for (const word of words) counts.set(word,(counts.get(word) || 0) + 1);
    for (const word of counts.keys()) df.set(word,(df.get(word) || 0) + 1);
    return {counts, length:words.length};
  });
  const mean = docs.reduce((n,d) => n + d.length,0) / docs.length;
  return query => {
    const terms = [...new Set(tokens(query))];
    return docs.map(({counts,length},i) => {
      let score = 0;
      for (const term of terms) {
        const tf = counts.get(term);
        if (!tf) continue;
        const idf = Math.log(1 + (docs.length - df.get(term) + 0.5) / (df.get(term) + 0.5));
        score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * length / mean));
      }
      return {i,score};
    }).filter(hit => hit.score > 0).sort((a,b) => b.score - a.score);
  };
}
