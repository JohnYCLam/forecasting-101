import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chapters} from '../src/chapters.js';
import passages from '../src/search/generated/passages.json' with {type:'json'};
import manifest from '../src/search/generated/manifest.json' with {type:'json'};
import {extractPassages} from '../scripts/search-passages.mjs';
import {tokens,buildLexical} from '../src/search/lexical.js';
import {rankVectors,results} from '../src/search/retrieve.js';

test('normalize course names and notation without erasing distinctions',() => {
  for (const [a,b] of [['Itô','Ito'],['OU','Ornstein–Uhlenbeck'],['GBM','geometric Brownian motion'],['dW²','(dW)^2'],['dW^{2}','dW²']]) {
    assert.deepEqual(tokens(a),tokens(b));
  }
  assert.notDeepEqual(tokens('dt'),tokens('dW²'));
  assert.notDeepEqual(tokens('dW'),tokens('dW²'));
  assert.deepEqual(tokens('Can you show me an example of that?'),[]);
});

test('the packaged index matches the lesson and every result resolves',() => {
  assert.deepEqual(extractPassages(),passages);
  const sources = new Map(chapters.map(c=>[c.id,c.content()]));
  const targets = new Set(passages.map(p=>p.href));
  for (const href of targets) {
    const [id,anchor] = href.slice(1).split('/');
    assert.ok(sources.has(id));
    if (anchor) assert.ok(sources.get(id).includes(anchor.startsWith('demo-')
      ? 'data-lab="' + anchor.slice(5) + '"' : 'data-section="' + anchor + '"'), href);
  }
  for (const [id,source] of sources) {
    for (const match of source.matchAll(/data-lab="([^"]+)"/g)) assert.ok(targets.has('#' + id + '/demo-' + match[1]));
  }
  const binary = readFileSync(new URL('../src/search/generated/vectors.bin',import.meta.url));
  const vectors = new Float32Array(binary.buffer,binary.byteOffset,binary.byteLength/4);
  assert.equal(vectors.length,manifest.dimensions * passages.length);
  for (let i = 0; i < vectors.length; i += manifest.dimensions) {
    const norm = Math.hypot(...vectors.subarray(i,i+manifest.dimensions));
    assert.ok(Math.abs(norm-1) < 0.0001,'Normalized finite vector at ' + i);
  }
});

test('BM25 works alone and a context-free follow-up has no result',() => {
  const search = buildLexical(passages);
  assert.ok(['#sde/mean-reversion','#sde/demo-sde'].includes(results(passages,search('OU'))[0].href));
  assert.deepEqual(results(passages,search('xyzzyplugh')),[]);
  assert.deepEqual(results(passages,search('show me an example of that')),[]);
});

test('fusion counts each destination once per list and suppresses weak evidence',() => {
  const tiny = [{href:'#a'},{href:'#a'},{href:'#b'}];
  assert.deepEqual(results(tiny,[{i:0,score:8},{i:1,score:7.9},{i:2,score:7}], [{i:2,score:.8}]).map(p=>p.href),['#b','#a']);
  assert.deepEqual(results(tiny,[{i:0,score:1}],[{i:1,score:.2}]),[]);
  assert.deepEqual(rankVectors([1,0],[0,1,1,0]).map(h=>h.i),[1,0]);
});
