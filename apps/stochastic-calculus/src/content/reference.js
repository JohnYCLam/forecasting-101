import { prose, h } from './helpers.js';
import examples from '../examples.json' with { type: 'json' };
import { referenceHtml } from '../reference-v1.js';
import { technicalNotes } from './technical-notes.js';
import { sourceAttribution, lessonReferences } from './sources.js';

export const escapeHtml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const codeExamples = examples;

export function reference() {
  let text=sourceAttribution()+referenceHtml.replace('<h2>The symbols we use</h2>',h('notation','Notation')).replace('<h2>About the experiments</h2>',lessonReferences()+h('methods','About the experiments'));
  text+=technicalNotes();
  text+=prose`
${h('code','Companion code and illustrations')}
<p>The browser experiments need no Python installation. For readers who want to reproduce the source article’s figures and animations, the nine original code appendices are available below in corrected form. Each entry can be opened to inspect the code or downloaded as a standalone file.</p>
<p>Python examples require NumPy, Matplotlib, SciPy, ImageIO, and Pillow; the TikZ example requires a LaTeX installation. <a href="./examples/requirements.txt" download>Download Python requirements</a>. Animation scripts can generate many frame images and take longer than the browser demos. The Python files were checked for syntax; they were not all executed to render their animations in this revision.</p>
<p>Corrections include matching Brownian initial values to the first plotted time, comparing normal bin probabilities with binomial masses, lattice-aligned histogram bins, and using millisecond GIF durations. The browser demos are the primary illustrations for following the lesson.</p>
`;
  text+=examples.map(ex=>prose`${h(ex.id,escapeHtml(ex.title))}<p>${escapeHtml(ex.note)}</p><p><a href="./examples/${ex.file}" download>Download ${escapeHtml(ex.file)}</a></p><details class="code-example"><summary>View source code</summary><pre><code>${escapeHtml(ex.source)}</code></pre></details>`).join('');
  return text;
}
