/**
 * Heuristic gate: no typed-in numeric results / hardcoded fallbacks in Topic UI code.
 *
 * Run from ts-forecasting-demo/:
 *   node .agents/skills/demo-explainability/scripts/check-commentary-numbers.mjs
 *   node .agents/skills/demo-explainability/scripts/check-commentary-numbers.mjs --update-baseline   (ONLY the user may ask for this)
 *
 * Flags, in src/App.jsx and src/Topic*.jsx:
 *  A. `?? <non-zero number>` fallbacks             e.g.  value ?? 76.4   (`?? 0` is allowed)
 *  B. `x != null ? ... : <number>;` fallbacks      e.g.  pt?.v != null ? Number(pt.v.toFixed(1)) : 76.4;
 *  D. typed percentages / "~n" / "\approx n" in prose (e.g. "60%-80% of datasets", "b \approx 0.18"); 0% and 100% allowed
 *  E. typed critical F values (3.8x, 3.9x, 4.0x): they depend on T and must come from the data
 *  C. metric names followed by a typed number in JSX text lines
 *                                                  e.g.  <p>RMSE = 12.34 ...</p>
 *
 * Existing violations are recorded in commentary_baseline.json and tolerated. Only NEW violations fail.
 * Fix a violation by interpolating the value from loaded data, or showing "n/a" when it is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..', '..', '..', '..');
const srcDir = fs.existsSync(path.join(rootDir, 'src'))
  ? path.join(rootDir, 'src')
  : path.join(rootDir, 'ts-forecasting-demo', 'src');
const baselineFile = path.join(here, 'commentary_baseline.json');

const RULES = [
  // non-zero numeric fallbacks only; `?? 0` is a harmless defensive default
  { id: 'A-nullish-number-fallback', re: /\?\?\s*-?(?!0(?![.\d]))\d/ },
  { id: 'B-ternary-number-fallback', re: /!=\s*null\s*\?[^;]*:\s*-?\d+(\.\d+)?\s*;/ },
  // typed result claims in prose: "60%-80%", "~75%", "about 18%" (0% and 100% are allowed)
  // standard test/confidence levels (1, 5, 10, 90, 95, 99, 0, 100 %) are allowed; any other typed percentage is treated as a typed result
  { id: 'D-typed-percent-in-text', re: /(?<![\d.])(?!(?:100|99|95|90|10|5|1|0)(?:\.0)?\s*%)\d+(\.\d+)?\s*%/, textOnly: true, skipIf: /style=|width|height|inset|opacity|flex|margin|padding|toFixed|\bconst\b/ },
  { id: 'D-typed-approx-in-text', re: /(~\s*\d|\u2248\s*\d)/, textOnly: true, skipIf: /style=|\bconst\b|toFixed/ },
  // critical F values depend on T and come from sim.thresholds; typing one is always wrong somewhere
  { id: 'E-typed-critical-value', re: /\b(3\.8[0-9]?|3\.9[0-9]?|4\.0[0-9]?)\b/, textOnly: true, skipIf: /style=|\bconst\b|toFixed|version|rgba|opacity/ },
  {
    id: 'C-typed-metric-in-text',
    re: /\b(RMSE|MAE|MAPE|MSE|AIC|BIC|QLIKE)\b\s*(=|:|is|of)?\s*\$?-?\d+\.\d+/,
    textOnly: true,
  },
];

const files = fs
  .readdirSync(srcDir)
  .filter((f) => /^(App|Topic\d+)\.jsx$/.test(f))
  .sort();

const found = [];
for (const f of files) {
  const lines = fs.readFileSync(path.join(srcDir, f), 'utf8').split(/\r?\n/);
  const seen = new Map();
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return;
    for (const rule of RULES) {
      if (!rule.re.test(trimmed)) continue;
      if (rule.textOnly && /^(const|let|var|import|export)\b/.test(trimmed)) continue;
      if (rule.skipIf && rule.skipIf.test(trimmed)) continue;
      const key = `${f}|${rule.id}|${trimmed}`;
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      found.push({ key: `${key}|#${n}`, file: f, line: i + 1, rule: rule.id, text: trimmed.slice(0, 140) });
    }
  });
}

if (process.argv.includes('--update-baseline')) {
  fs.writeFileSync(baselineFile, JSON.stringify(found.map((x) => x.key), null, 1));
  console.log(`Baseline written: ${found.length} existing violation(s) recorded.`);
  process.exit(0);
}

const baseline = new Set(fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : []);
const fresh = found.filter((x) => !baseline.has(x.key));

console.log(`Commentary-number check: ${found.length} total heuristic hit(s), ${baseline.size} in baseline, ${fresh.length} NEW.`);
for (const x of fresh) {
  console.log(`  NEW ${x.file}:${x.line} [${x.rule}] ${x.text}`);
}
if (fresh.length) {
  console.log('RESULT: FAIL  (interpolate from loaded data or show "n/a"; do not type numbers or fallbacks)');
  process.exit(1);
}
console.log('RESULT: PASS');
