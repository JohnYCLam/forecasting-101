import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createEncoder, dimensions, passageInput, revision} from '../src/search/encoder.js';
import {extractPassages} from './search-passages.mjs';

const dir = new URL('../src/search/generated/', import.meta.url);
const passages = extractPassages();
const json = JSON.stringify(passages);
const digest = data => createHash('sha256').update(data).digest('hex');
const metadata = {revision, dimensions, count:passages.length, passagesHash:digest(json),
  inputsHash:digest(JSON.stringify(passages.map(passageInput)))};
if (process.argv.includes('--check')) {
  const manifest = JSON.parse(await readFile(new URL('manifest.json',dir),'utf8'));
  const stored = await readFile(new URL('passages.json',dir),'utf8');
  const vectors = await readFile(new URL('vectors.bin',dir));
  if (Object.entries(metadata).some(([key,value]) => manifest[key] !== value) ||
      stored !== json || vectors.length !== dimensions * passages.length * 4 || digest(vectors) !== manifest.vectorsHash) {
    throw new Error('Course search index is stale. Run npm run search:index.');
  }
} else {
  const encode = await createEncoder(await import('@huggingface/transformers'), 'cpu');
  const vectors = new Float32Array(passages.length * dimensions);
  for (let i = 0; i < passages.length; i += 8) {
    vectors.set(await encode(passages.slice(i,i+8).map(passageInput)),i * dimensions);
  }
  const binary = new Uint8Array(vectors.buffer);
  await mkdir(dir,{recursive:true});
  await writeFile(new URL('passages.json',dir),json);
  await writeFile(new URL('vectors.bin',dir),binary);
  await writeFile(new URL('manifest.json',dir),JSON.stringify({...metadata,vectorsHash:digest(binary)},null,2) + '\n');
}
console.log('Course search index: ' + passages.length + ' passages.');
