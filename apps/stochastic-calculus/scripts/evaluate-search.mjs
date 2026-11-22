import {readFile} from 'node:fs/promises';
import * as library from '@huggingface/transformers';
import queries from '../tests/fixtures/search-queries.json' with {type:'json'};
import passages from '../src/search/generated/passages.json' with {type:'json'};
import {createEncoder} from '../src/search/encoder.js';
import {buildLexical,tokens} from '../src/search/lexical.js';
import {rankVectors,results} from '../src/search/retrieve.js';

const encode = await createEncoder(library,'cpu');
const bytes = await readFile(new URL('../src/search/generated/vectors.bin',import.meta.url));
const matrix = new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
const lexical = buildLexical(passages);
const scores = Object.fromEntries(['keyword','semantic','hybrid'].map(mode => [mode,{first:0,top3:0,abstained:0}]));
for (const {query,expected} of queries) {
  const words = lexical(query);
  const meanings = tokens(query).length ? rankVectors(await encode(query),matrix) : [];
  for (const [mode,list] of Object.entries({keyword:results(passages,words),semantic:results(passages,[],meanings),hybrid:results(passages,words,meanings)})) {
    const rank = list.findIndex(p => expected.includes(p.href));
    if (rank === 0) scores[mode].first++;
    if (rank >= 0) scores[mode].top3++;
    if (!expected.length && !list.length) scores[mode].abstained++;
    if (mode === 'hybrid' && process.argv.includes('--verbose')) console.log(query, list.map(p=>p.href).join(' '));
  }
}
console.log(queries.filter(q=>q.expected.length).length + ' answerable questions; ' + queries.filter(q=>!q.expected.length).length + ' off-topic or incomplete.');
console.table(scores);
