import {copyFile, mkdir, rm} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist = dirname(fileURLToPath(import.meta.resolve('@huggingface/transformers')));
const dest = new URL('../public/search-runtime/', import.meta.url);
await mkdir(dest,{recursive:true});
await copyFile(join(dist,'transformers.min.js'),new URL('transformers.min.js',dest));
// Older builds copied these generated files into public. Vite copies everything there.
for (const name of ['ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm']) {
  await rm(new URL(name,dest),{force:true});
}
