import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MIMIC_TIMING,mimicPose} from '../src/mimic/timing.ts';
import {createMimicModel} from '../src/mimic/model.js';

test('the reveal preserves a readable 400ms parry window before the bite',()=>{
 assert.equal(MIMIC_TIMING.warning,400);
 for(const phase of ['windup','warning'] as const)for(const t of [0,.5,1]){const p=mimicPose(phase,t);assert.equal(p.fold,0);assert.equal(p.coverScale,1);assert.equal(p.replacement,0);}
});
test('the source folds away completely before the replacement is spat out',()=>{
 const bite=mimicPose('vanishing',1);assert.equal(bite.fold,1);assert.equal(bite.coverScale,0);assert.equal(bite.replacement,0);
 const spit=mimicPose('appearing',1);assert.equal(spit.replacement,1);assert.equal(spit.reveal,0);
});
test('parrying retreats without folding or replacing the chosen cover',()=>{
 for(const t of [0,.2,.5,1]){const p=mimicPose('parried',t);assert.equal(p.fold,0);assert.equal(p.coverScale,1);assert.equal(p.replacement,0);}
 assert.equal(mimicPose('parried',1).reveal,0);
});
test('articulated model retains finite geometry through all phases',()=>{
 const model=createMimicModel();
 for(const phase of ['windup','warning','vanishing','appearing','parried'] as const){for(const t of [0,.2,.5,.8,1]){
  model.pose(mimicPose(phase,t),phase,t,172);model.root.updateMatrixWorld(true);
  model.root.traverse((object:any)=>{assert.ok(object.matrixWorld.elements.every(Number.isFinite));});
 }}
 assert.equal(model.arms.length,2);model.dispose();
});
test('the bite uses folding cover halves and spit uses a separate replacement',()=>{
 const model=createMimicModel();
 model.pose(mimicPose('vanishing',.4),'vanishing',.4,172);
 assert.ok(model.cover.children[0].rotation.x<0);assert.ok(model.cover.children[1].rotation.x>0);assert.equal(model.spit.visible,false);
 model.pose(mimicPose('appearing',.5),'appearing',.5,172);assert.equal(model.cover.visible,false);assert.equal(model.spit.visible,true);
 model.dispose();
});
test('scene geometry and materials are released after the animation',()=>{
 const model=createMimicModel();let geometries=0,materials=0;const uniqueMaterials=new Set<any>();
 model.root.traverse((o:any)=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>geometries++);uniqueMaterials.add(o.material);}});
 for(const material of uniqueMaterials)material.addEventListener('dispose',()=>materials++);
 model.dispose();assert.ok(geometries>50);assert.equal(materials,uniqueMaterials.size);
});
test('biting a Play button returns it at the same size and position instead of growing to an album cover',()=>{
 const model=createMimicModel({round:true,button:true});
 for(const size of [96,112,132]){
  model.pose(mimicPose('appearing',1),'appearing',1,size);
  assert.equal(model.spit.scale.x,size);assert.equal(model.spit.position.y,0);
  model.pose(mimicPose('parried',1),'parried',1,size);
  assert.equal(model.cover.scale.x,size);assert.equal(model.cover.position.y,0);
 }
 model.dispose();
});
