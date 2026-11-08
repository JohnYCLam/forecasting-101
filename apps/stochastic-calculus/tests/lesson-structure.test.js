import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../src/chapters.js';
const htmls=Object.fromEntries(chapters.map(ch=>[ch.id,ch.html()]));

test('every internal lesson link resolves after the chapter split',()=>{
  for(const [chapter,html] of Object.entries(htmls)){
    assert.ok(!html.includes('undefined'),chapter);
    for(const [,target,section] of html.matchAll(/href="#([^"/]+)(?:\/([^"]+))?"/g)){
      assert.ok(htmls[target],`${chapter}: unknown chapter ${target}`);
      if(section)assert.ok(htmls[target].includes(`data-section="${section}"`)||
        (section.startsWith('demo-')&&htmls[target].includes(`data-lab="${section.slice(5)}"`)),
        `${chapter}: missing destination ${target}/${section}`);
    }
  }
});

test('experiments have one home and follow their required explanations',()=>{
  const seen=new Set();
  for(const html of Object.values(htmls))for(const [,lab]of html.matchAll(/data-lab="([^"]+)"/g)){
    assert.ok(!seen.has(lab),`Duplicate experiment ${lab}`);seen.add(lab);
  }
  assert.equal(seen.size,10);
  assert.ok(htmls.sde.indexOf('data-section="general-ito"')<htmls.sde.indexOf('data-section="mean-reversion"'));
  assert.ok(htmls.sde.indexOf('data-section="numerics"')<htmls.sde.indexOf('data-lab="euler"'));
  assert.ok(!htmls.sde.includes('data-section="biology"'));
  assert.ok(!htmls.sde.includes('data-section="fokker-planck"'));
  assert.ok(!htmls.sde.includes('data-section="finance"'));
});
