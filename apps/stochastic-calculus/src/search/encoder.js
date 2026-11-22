import {topic} from './topics.js';

export const revision = '751bff37182d3f1213fa05d7196b954e230abad9';
export const modelId = 'Xenova/all-MiniLM-L6-v2';
export const dimensions = 384;

export function passageInput(p) {
  return [topic(p), p.title, p.context, p.text].filter(Boolean).join('. ');
}

export async function createEncoder(library, device) {
  const pipeline = await library.pipeline('feature-extraction', modelId, {
    device, dtype:'int8', revision,
    session_options: device === 'cpu' ? {intraOpNumThreads:2, interOpNumThreads:1} : {}
  });
  return async texts => (await pipeline(texts, {
    pooling:'mean', normalize:true, truncation:true, max_length:256
  })).data;
}
