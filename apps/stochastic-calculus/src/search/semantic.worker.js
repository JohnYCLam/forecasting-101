import {createEncoder, dimensions} from './encoder.js';
import {rankVectors} from './retrieve.js';

let encode, matrix, queue = Promise.resolve();
async function handle({type,base,vectors,count,id,query}) {
  if (type === 'init') {
    const runtime = new URL('search-runtime/',base).href;
    const library = await import(/* @vite-ignore */ runtime + 'transformers.min.js');
    library.env.allowLocalModels = false;
    library.env.backends.onnx.wasm.numThreads = 1;
    const response = await fetch(vectors);
    if (!response.ok) throw new Error('Could not load the passage vectors');
    matrix = new Float32Array(await response.arrayBuffer());
    if (matrix.length !== count * dimensions) throw new Error('Passage index mismatch');
    encode = await createEncoder(library,'wasm');
    self.postMessage({type:'ready'});
  } else {
    const vector = await encode(query);
    self.postMessage({type:'results',id,hits:rankVectors(vector,matrix)});
  }
}

self.onmessage = ({data}) => {
  queue = queue.then(() => handle(data)).catch(error => {
    console.warn('Course semantic search unavailable:', error.message);
    self.postMessage({type:'unavailable'});
  });
};
