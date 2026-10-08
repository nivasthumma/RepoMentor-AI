import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pulseboardData as data} from '../src/data/pulseboard.js';

test('investigation patterns resolve to available answers',()=>{
  assert.ok(Object.keys(data.investigationRouting).length>0);
  for(const [pattern,key] of Object.entries(data.investigationRouting)){
    assert.doesNotThrow(()=>new RegExp(pattern,'i'));
    assert.ok(data.investigationData[key],`Missing investigation answer: ${key}`);
  }
});
test('architecture relationships connect existing layers',()=>{
  const ids=new Set(data.architecture.layers.map(layer=>layer.id));
  assert.equal(ids.size,data.architecture.layers.length);
  for(const relationship of data.architecture.relationships){
    assert.ok(ids.has(relationship.from),`Unknown source layer: ${relationship.from}`);
    assert.ok(ids.has(relationship.to),`Unknown target layer: ${relationship.to}`);
  }
});
test('important file paths are unique and have descriptions',()=>{
  const paths=data.importantFiles.map(file=>file.path);
  assert.equal(new Set(paths).size,paths.length);
  for(const file of data.importantFiles){
    assert.ok(file.path.startsWith('src/'));
    assert.ok(file.explanation?.trim());
  }
});
test('trace paths contain navigable steps',()=>{
  assert.ok(data.traceCodePaths.length>0);
  for(const path of data.traceCodePaths){
    assert.ok(path.steps.length>0);
    for(const step of path.steps)assert.ok(step.file?.trim(),'Trace step needs a file target');
  }
});
