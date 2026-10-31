/**
 * Hard gate: time-series zoom charts outside src/charts/ must use the shared shells.
 *
 * Run via: npm run test:charts  (also wired into npm run build / lint)
 *
 * Fails when App / Topic* source:
 * - reimplements zoom handlers or zoomDomain state
 * - builds zoomable Recharts axes without importing ./charts
 * - mounts adjacent dual ZoomableChartShell siblings (use SyncedDual/SyncedStacked)
 * - imports lucide ZoomIn/ZoomOut for chart controls
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');
const chartsDir = path.join(srcDir, 'charts');

const ALLOWED_IMPORT_RE =
  /from\s+['"]\.\/charts(?:\/[^'"]*)?['"]|from\s+['"]\.\/ZoomableChartWrapper['"]/;

const FORBIDDEN_PATTERNS = [
  {
    name: 'local handleZoomIn implementation — use ZoomableChartShell / SyncedDualChart',
    re: /(?:const|function)\s+handleZoomIn\b/,
  },
  {
    name: 'local handleZoomOut implementation — use ZoomableChartShell / SyncedDualChart',
    re: /(?:const|function)\s+handleZoomOut\b/,
  },
  {
    name: 'local handleResetZoom implementation — use ZoomableChartShell',
    re: /(?:const|function)\s+handleResetZoom\b/,
  },
  {
    name: 'local zoomDomain useState — use ZoomableChartShell / useChartZoom from ./charts',
    re: /const\s*\[[^\]]*zoomDomain[^\]]*\]\s*=\s*useState/,
  },
  {
    name: 'lucide ZoomIn import outside charts/ — chart zoom controls live in ChartZoomControls',
    re: /import\s*\{[^}]*\bZoomIn\b[^}]*\}\s*from\s*['"]lucide-react['"]/,
  },
  {
    name: 'lucide ZoomOut import outside charts/ — chart zoom controls live in ChartZoomControls',
    re: /import\s*\{[^}]*\bZoomOut\b[^}]*\}\s*from\s*['"]lucide-react['"]/,
  },
];

function listSubjectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'charts' || entry.name === 'node_modules') continue;
      out.push(...listSubjectFiles(full));
      continue;
    }
    if (!/\.(jsx|tsx|js|ts)$/.test(entry.name)) continue;
    // Topic demos + App are the enforced surface; skip utilities/tests.
    if (
      entry.name === 'App.jsx' ||
      /^Topic\d+\.jsx$/.test(entry.name) ||
      entry.name.startsWith('Topic')
    ) {
      out.push(full);
    }
  }
  return out;
}

const errors = [];
const subjectFiles = listSubjectFiles(srcDir);

if (subjectFiles.length === 0) {
  errors.push('No App.jsx / Topic*.jsx files found under src/');
}

for (const fullPath of subjectFiles) {
  const file = path.relative(srcDir, fullPath).replace(/\\/g, '/');
  const source = fs.readFileSync(fullPath, 'utf8');
  const hasChartsImport = ALLOWED_IMPORT_RE.test(source);

  const usesZoomDomain = /domain=\{zoomDomain\}/.test(source);
  const usesZoomableAxis =
    /allowDataOverflow=\{true\}/.test(source) ||
    /allowDataOverflow\s*=\s*\{true\}/.test(source);

  if ((usesZoomDomain || usesZoomableAxis) && !hasChartsImport) {
    errors.push(
      `${file}: zoomable time-series chart detected (domain={zoomDomain} and/or allowDataOverflow) without importing from ./charts. Use ZoomableChartShell, SyncedDualChart, or SyncedStackedChart.`
    );
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.re.test(source)) {
      errors.push(`${file}: ${pattern.name}`);
    }
  }

  // Adjacent dual shells that are both mounted should be Synced*.
  const shellOpens = [...source.matchAll(/<ZoomableChartShell\b/g)];
  for (let i = 0; i < shellOpens.length - 1; i += 1) {
    const a = shellOpens[i].index;
    const b = shellOpens[i + 1].index;
    const between = source.slice(a, b);
    const lineA = source.slice(0, a).split('\n').length;
    const lineB = source.slice(0, b).split('\n').length;
    if (lineB - lineA > 50) continue;
    if (/<Synced(Dual|Stacked)Chart\b/.test(between)) continue;
    if (!between.includes('</ZoomableChartShell>')) continue;

    const mutuallyExclusive =
      /\)\s*:\s*\(/.test(between) ||
      /ViewMode\s*===|tab\w*View\s*===|tab\w*Mode\s*===/.test(between);

    if (!mutuallyExclusive) {
      errors.push(
        `${file}: adjacent ZoomableChartShell pair near lines ${lineA}-${lineB}; use SyncedDualChart / SyncedStackedChart for shared zoom.`
      );
    }
  }
}

// Shared package surface must stay intact.
const indexPath = path.join(chartsDir, 'index.js');
if (!fs.existsSync(indexPath)) {
  errors.push('src/charts/index.js is missing — shared chart package required.');
} else {
  const indexSrc = fs.readFileSync(indexPath, 'utf8');
  for (const name of [
    'ZoomableChartShell',
    'SyncedDualChart',
    'SyncedStackedChart',
    'useChartZoom',
    'ChartZoomControls',
  ]) {
    if (!indexSrc.includes(name)) {
      errors.push(`charts/index.js missing export surface for ${name}`);
    }
  }
}

// charts/ is the only place allowed to own zoom implementation details.
for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!/\.(jsx|js)$/.test(entry.name)) continue;
  if (entry.name === 'ZoomableChartWrapper.jsx') continue; // thin re-export
  const src = fs.readFileSync(path.join(srcDir, entry.name), 'utf8');
  if (/export\s+default\s+function\s+useChartZoom\b/.test(src)) {
    errors.push(`${entry.name}: useChartZoom must live under src/charts/`);
  }
}

if (errors.length) {
  console.error('Chart component architecture check FAILED.\n');
  console.error('New zoomable graphs must use:');
  console.error('  import { ZoomableChartShell, SyncedDualChart, SyncedStackedChart } from \'./charts\';');
  console.error('');
  for (const err of errors) console.error(` - ${err}`);
  process.exit(1);
}

console.log('Chart component architecture check passed.');
console.log(
  `Checked ${subjectFiles.length} file(s): ${subjectFiles
    .map((f) => path.relative(srcDir, f).replace(/\\/g, '/'))
    .join(', ')}`
);
