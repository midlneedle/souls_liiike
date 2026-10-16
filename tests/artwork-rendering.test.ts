import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createMimicModel} from '../src/mimic/model.js';
import {prepareSharpArtwork} from '../src/mimic/hybridRenderer.js';
test('only artwork uses the high-resolution pass; creature stays retro',()=>{
 const model=createMimicModel();const cards:any[]=[];model.cover.traverse((o:any)=>{if(o.isMesh)cards.push(o);});cards.push(model.spit);
 assert.equal(cards.length,3);assert.ok(cards.every(o=>o.layers.isEnabled(1)&&!o.layers.isEnabled(0)));
 model.upper.traverse((o:any)=>{if(o.isMesh)assert.ok(o.layers.isEnabled(0)&&!o.layers.isEnabled(1));});
 model.dispose();
});
test('sharp cover shaders preserve vertices and test occlusion against teeth and fingers',()=>{
 const model=createMimicModel();const depth=new T.DepthTexture(198,178),resolution=new T.Vector2(792,712);
 prepareSharpArtwork(model.root,depth,resolution);
 const shader:any={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <clipping_planes_fragment>'};
 model.spit.material.onBeforeCompile(shader);
 assert.equal(shader.vertexShader,'#include <project_vertex>');assert.ok(shader.fragmentShader.includes('foregroundDepth'));assert.ok(shader.fragmentShader.includes('discard'));
 assert.equal(shader.uniforms.retroDepth.value,depth);assert.equal(shader.uniforms.outputResolution.value,resolution);
 model.dispose();depth.dispose();
});
