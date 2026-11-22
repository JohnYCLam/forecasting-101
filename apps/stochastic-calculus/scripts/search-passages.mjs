import { parseFragment } from 'parse5';
import { chapters } from '../src/chapters.js';

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const children = node => node.childNodes ?? [];
const text = node => node.nodeName === '#text' ? node.value : children(node).map(text).join('');
const clean = value => value.replace(/\s+/g, ' ').trim();
const skip = new Set(['script','style','pre','button','canvas','select','input','output','svg','thead']);

function plainMath(value) {
  return clean(value.replace(/\\(?:mathrm|text|operatorname)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\(?:left|right|,|;|!|quad|qquad)\s*/g, ' ')
    .replace(/\\(?:Delta|delta|sigma|mu|theta|lambda|sqrt|times|to)\b/g, token =>
      ({'\\Delta':'Δ','\\delta':'δ','\\sigma':'σ','\\mu':'μ','\\theta':'θ','\\lambda':'λ','\\sqrt':'√','\\times':'×','\\to':'→'})[token])
    .replace(/\\[()[\]]/g, ''));
}

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of children(node)) {
    const found = find(child, predicate);
    if (found) return found;
  }
}

export function extractPassages() {
  const passages = [];
  for (const chapter of chapters) {
    const root = parseFragment(chapter.content());
    const section = { href:'#' + chapter.id, title:chapter.label, chapter:chapter.label, number:chapter.number };
    let context = '', blocks = [], size = 0, excerpt = '';
    function flush() {
      if (blocks.length) passages.push({...section, context, text:blocks.join(' '), excerpt:excerpt || section.title});
      blocks = [];
      size = 0;
      excerpt = '';
    }
    function add(value) {
      const words = plainMath(value).split(/\s+/).filter(Boolean);
      for (let i = 0; i < words.length; i += 90) {
        const block = words.slice(i,i+90).join(' ');
        if (size + block.length > 720) flush();
        if (!excerpt && !value.trim().startsWith('\\[')) {
          const sentences = clean(value).split(/(?<=[.!?])\s+(?=[A-Z])/);
          excerpt = sentences[0];
        }
        blocks.push(block);
        size += block.length + 1;
      }
    }
    function visit(node) {
      if (skip.has(node.tagName)) return;
      const anchor = attr(node,'data-section');
      const lab = attr(node,'data-lab');
      if (anchor) {
        flush();
        section.href = '#' + chapter.id + '/' + anchor;
        section.title = plainMath(text(node));
        context = '';
      } else if (lab) {
        flush();
        const heading = find(node, item => item.tagName === 'h3');
        const summary = find(node, item => item.tagName === 'p' && clean(text(item)));
        const title = plainMath(heading ? text(heading) : attr(node,'aria-label') || lab);
        const parent = {...section}, previousContext = context;
        section.href = '#' + chapter.id + '/demo-' + lab;
        section.title = title;
        context = 'Interactive simulation experiment. ' + parent.title;
        add(summary ? text(summary) : title);
        function captions(item) {
          if (item === summary || skip.has(item.tagName)) return;
          if (item.tagName === 'p') add(text(item));
          else children(item).forEach(captions);
        }
        captions(node);
        flush();
        Object.assign(section,parent);
        context = previousContext;
      } else if (node.tagName === 'h3' || node.tagName === 'h4') {
        flush();
        context = plainMath(text(node));
      } else if (['p','li','tr','summary','h1'].includes(node.tagName)) {
        add(node.tagName === 'tr' ? children(node).map(text).join(' ') : text(node));
      } else if (node.nodeName === '#text') {
        // Standalone display equations still contribute exact notation.
        if (node.value.trim()) add(node.value);
      } else {
        children(node).forEach(visit);
      }
    }
    visit(root);
    flush();
  }
  return passages;
}
