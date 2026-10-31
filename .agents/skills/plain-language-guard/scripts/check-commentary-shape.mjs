/**
 * Heuristic gate for reader-friendliness of commentary in src/App.jsx and src/Topic*.jsx.
 *
 *   node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs
 *   node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs --update-baseline   (ONLY the user may ask for this)
 *
 * Checks:
 *  LENGTH   a commentary body (a `return (` inside `commentaryBody = (() => {...})()`) over WORD_BUDGET words.
 *  QUESTION a <strong> heading or quoted <em> that is a question (Q&A pasted into the page).
 *  DUP      the same 10-word run appears in two different paragraphs (guide card repeating dataset card, etc).
 *  JARGON   an advanced term (jargon.json "terms") used in a paragraph with no plain gloss at its FIRST use in the file.
 *  BANNED   a name the user rejected (jargon.json "banned"), anywhere in the file, including chart legends and table headers.
 *
 * Known violations live in commentary_shape_baseline.json and are tolerated; only NEW ones fail.
 * The script prints how many baseline entries are stale (fixed), so the debt stays visible.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..', '..', '..', '..');
const srcDir = fs.existsSync(path.join(rootDir, 'src'))
  ? path.join(rootDir, 'src')
  : path.join(rootDir, 'ts-forecasting-demo', 'src');
const baselineFile = path.join(here, 'commentary_shape_baseline.json');
const { terms, banned } = JSON.parse(fs.readFileSync(path.join(here, 'jargon.json'), 'utf8'));
const WORD_BUDGET = 260;
const SHINGLE = 10;

const ENT = { '&ldquo;': '"', '&rdquo;': '"', '&rsquo;': "'", '&lsquo;': "'", '&ndash;': '-', '&mdash;': '-', '&amp;': '&', '&gt;': '>', '&lt;': '<', '&ne;': '!=', '&nbsp;': ' ' };
const decode = (s) => s.replace(/&[a-z]+;/gi, (m) => ENT[m] ?? ' ');
const stripJsx = (s) => {
  let t = s;
  for (let i = 0; i < 4; i++) t = t.replace(/\{[^{}]*\}/g, ' '); // drop {expressions}, nested a few levels
  t = t.replace(/<[^>]+>/g, ' ');
  return decode(t).replace(/\s+/g, ' ').trim();
};
const words = (s) => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

function matchBrace(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return text.length - 1;
}

const found = [];
const add = (file, line, rule, msg, keyDetail) => found.push({ key: `${file}|${rule}|${keyDetail}`, file, line, rule, msg });

const files = fs.readdirSync(srcDir).filter((f) => /^(App|Topic\d+)\.jsx$/.test(f)).sort();
for (const f of files) {
  const text = fs.readFileSync(path.join(srcDir, f), 'utf8');

  // LENGTH
  const re = /commentaryBody\s*=\s*\(\(\)\s*=>\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = text.indexOf('{', m.index + m[0].length - 1);
    const close = matchBrace(text, open);
    const body = text.slice(open, close);
    const parts = body.split(/\breturn\s*\(/).slice(1);
    parts.forEach((part, i) => {
      const w = words(stripJsx(part));
      if (w > WORD_BUDGET) add(f, lineOf(text, open), 'LENGTH', `commentary body #${i + 1} has ${w} words (budget ${WORD_BUDGET})`, `body${i + 1}@${lineOf(text, open)}`);
    });
  }

  // paragraphs
  const paras = [];
  const pre = /<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g;
  while ((m = pre.exec(text))) paras.push({ line: lineOf(text, m.index), raw: m[2], text: stripJsx(m[2]) });

  // QUESTION
  const qre = /<strong>([^<]*\?[^<]*)<\/strong>|<em>\s*(?:&ldquo;|")([^<]*\?)(?:&rdquo;|")\s*<\/em>/g;
  while ((m = qre.exec(text))) {
    const full = decode(m[1] || m[2] || '').replace(/\s+/g, ' ').trim();
    // short definitional headings ("What is MAPE?") are the established style of Topics 2-3; flag long/conversational ones
    if (/^(what is|what are|why use|why is|how to)\b/i.test(full) && full.split(' ').length <= 9 && (full.match(/\?/g) || []).length === 1) continue;
    const q = full.slice(0, 70);
    add(f, lineOf(text, m.index), 'QUESTION', `conversational question as heading on the page (turn it into a statement): "${q}"`, q);
  }

  // DUP
  const seen = new Map();
  paras.forEach((p, pi) => {
    const w = p.text.toLowerCase().match(/[a-z0-9']+/g) || [];
    for (let i = 0; i + SHINGLE <= w.length; i++) {
      const sh = w.slice(i, i + SHINGLE).join(' ');
      if (seen.has(sh) && seen.get(sh) !== pi) {
        const other = paras[seen.get(sh)];
        add(f, p.line, 'DUP', `paragraph repeats text from line ${other.line}: "${sh}"`, `${other.line}|${sh}`);
        break;
      }
      if (!seen.has(sh)) seen.set(sh, pi);
    }
  });

  // JARGON (first use per term per file)
  const seenTerm = new Set();
  const glossRe = /\b(means|meaning|i\.e\.|that is|in other words|called|stands for|is the|is a|are the)\b/i;
  for (const p of paras) {
    const low = p.text.toLowerCase();
    for (const term of Object.keys(terms)) {
      if (seenTerm.has(term)) continue;
      const idx = low.indexOf(term);
      if (idx < 0) continue;
      seenTerm.add(term);
      const after = p.text.slice(idx, idx + term.length + 70);
      const glossed = /\(/.test(after) || glossRe.test(p.text) || /[:\u2014-]/.test(after.slice(term.length, term.length + 8));
      if (!glossed) add(f, p.line, 'JARGON', `"${term}" used without a plain gloss. Suggested: ${terms[term]}`, term);
    }
  }

  // BANNED
  const lines = text.split(/\r?\n/);
  lines.forEach((ln, i) => {
    const low = ln.toLowerCase();
    for (const b of Object.keys(banned)) {
      if (low.includes(b)) add(f, i + 1, 'BANNED', `"${b}" is a rejected name. Use: ${banned[b]}`, `${b}|${ln.trim().slice(0, 80)}`);
    }
  });
}

// make keys unique with occurrence counters
const counts = new Map();
for (const x of found) {
  const n = (counts.get(x.key) || 0) + 1;
  counts.set(x.key, n);
  x.key = `${x.key}|#${n}`;
}

if (process.argv.includes('--update-baseline')) {
  fs.writeFileSync(baselineFile, JSON.stringify(found.map((x) => x.key), null, 1));
  console.log(`Baseline written: ${found.length} existing violation(s) recorded.`);
  process.exit(0);
}

const baseline = new Set(fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : []);
const keys = new Set(found.map((x) => x.key));
const fresh = found.filter((x) => !baseline.has(x.key));
const stale = [...baseline].filter((k) => !keys.has(k)).length;

console.log(`Commentary-shape check: ${found.length} hit(s), ${baseline.size - stale} in baseline (${stale} baseline entries already fixed), ${fresh.length} NEW.`);
for (const x of fresh) console.log(`  NEW ${x.file}:${x.line} [${x.rule}] ${x.msg}`);
if (fresh.length) {
  console.log('RESULT: FAIL  (restructure into a story, gloss or replace jargon, remove duplicates; see plain-language-guard and commentary-storyboard)');
  process.exit(1);
}
console.log('RESULT: PASS');
