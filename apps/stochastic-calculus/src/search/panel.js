import katex from 'katex';
import passageUrl from './generated/passages.json?url';
import {buildLexical, tokens} from './lexical.js';
import {results} from './retrieve.js';
import './panel.css';

export function mountCourseSearch(navigateToCurrent) {
  const byId = id => document.getElementById(id);
  const launcher = byId('ask-launcher'), panel = byId('ask-panel'), input = byId('ask-input');
  const log = byId('ask-log'), status = byId('ask-status');
  const pending = new Map();
  let passages, loading, lexical, worker, timeout, ready = false, sequence = 0;

  async function loadPassages() {
    const embedded = byId('ask-passages');
    if (embedded) passages = JSON.parse(embedded.textContent);
    else {
      const response = await fetch(passageUrl);
      if (!response.ok) throw new Error('Course index unavailable');
      passages = await response.json();
    }
    lexical = buildLexical(passages);
  }

  function fallback() {
    clearTimeout(timeout);
    worker?.terminate();
    worker = null;
    ready = false;
    for (const turn of pending.values()) turn.reply.removeAttribute('aria-busy');
    pending.clear();
    status.textContent = 'Keyword search available';
  }
  async function start() {
    if (!lexical) {
      status.textContent = 'Opening course index…';
      try {
        loading ??= loadPassages();
        await loading;
      } catch {
        loading = null;
        status.textContent = 'Course index unavailable · reopen to retry';
        return;
      }
    }
    if (worker) return;
    if (location.protocol === 'file:' || document.documentElement.hasAttribute('data-offline-preview')) {
      status.textContent = 'Offline · keyword search';
      return;
    }
    status.textContent = 'Loading semantic search · keywords available';
    try {
      worker = new Worker(new URL('./semantic.worker.js',import.meta.url),{type:'module'});
      worker.onerror = fallback;
      worker.onmessage = ({data}) => {
        if (data.type === 'unavailable') return fallback();
        if (data.type === 'ready') {
          clearTimeout(timeout);
          ready = true;
          status.textContent = 'Search by keyword and meaning';
          for (const [id,turn] of pending) worker.postMessage({id,query:turn.query});
        } else if (pending.has(data.id)) {
          const turn = pending.get(data.id);
          pending.delete(data.id);
          render(turn.reply,results(passages,turn.lexicalHits,data.hits));
          turn.reply.removeAttribute('aria-busy');
          if (log.lastElementChild === turn.reply) log.scrollTop = log.scrollHeight;
        }
      };
      worker.postMessage({type:'init',base:new URL('.',document.baseURI).href,
        vectors:new URL('./generated/vectors.bin',import.meta.url).href,count:passages.length});
      timeout = setTimeout(fallback,120000);
    } catch { fallback(); }
  }
  function openPanel(open, restoreFocus = true) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded',String(open));
    if (open) {
      input.focus();
      start();
    } else if (restoreFocus) launcher.focus();
  }
  function el(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    if (value) node.textContent = value;
    return node;
  }
  function render(reply,hits) {
    reply.replaceChildren();
    if (!hits.length) {
      reply.textContent = 'I couldn’t find a close section. Try naming the process, equation, or experiment you want to explore.';
      return;
    }
    const best = hits[0];
    reply.append(el('span','ask-section','Section ' + best.number + ' · ' + best.chapter));
    const link = el('a','ask-result',best.title);
    link.href = best.href;
    reply.append(link);
    const excerpt = el('p','ask-excerpt');
    for (const part of best.excerpt.split(/(\\\([\s\S]*?\\\))/g)) {
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const math = document.createElement('span');
        katex.render(part.slice(2,-2), math, {throwOnError:false});
        excerpt.append(math);
      } else excerpt.append(document.createTextNode(part));
    }
    reply.append(excerpt);
    if (hits.length > 1) {
      const more = el('details','ask-related');
      more.append(el('summary','','Related sections'));
      for (const hit of hits.slice(1)) {
        const a = el('a','',hit.title);
        a.href = hit.href;
        more.append(a);
      }
      reply.append(more);
    }
  }
  async function submit(query) {
    query = query.trim();
    if (!query) return;
    input.value = '';
    if (!lexical) await start();
    byId('ask-welcome').hidden = true;
    log.append(el('p','ask-question',query));
    const reply = el('div','ask-answer');
    log.append(reply);
    if (!lexical) reply.textContent = 'The course index could not be opened. Try your question again when it is available.';
    else if (!tokens(query).length) reply.textContent = 'Which topic would you like to explore? Include it in your question, for example “Show me a Brownian motion experiment.”';
    else {
      const lexicalHits = lexical(query);
      render(reply,results(passages,lexicalHits));
      if (worker) {
        const id = ++sequence;
        reply.setAttribute('aria-busy','true');
        pending.set(id,{query,lexicalHits,reply});
        if (ready) worker.postMessage({id,query});
      }
    }
    log.scrollTop = log.scrollHeight;
    input.focus();
  }
  launcher.addEventListener('click',() => openPanel(panel.hidden));
  byId('ask-close').addEventListener('click',() => openPanel(false));
  panel.addEventListener('keydown',event => {
    if (event.key === 'Escape') openPanel(false);
  });
  byId('ask-form').addEventListener('submit',event => {
    event.preventDefault();
    submit(input.value);
  });
  byId('ask-example').addEventListener('click',event => submit(event.currentTarget.textContent));
  log.addEventListener('click',event => {
    const a = event.target.closest('a[href^="#"]');
    if (!a || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    openPanel(false,false);
    if (a.hash === location.hash) {
      event.preventDefault();
      navigateToCurrent();
    }
  });
}
