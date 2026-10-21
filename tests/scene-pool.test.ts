import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScenePool} from '../src/battle/scenePool.js';

function factory(){
 const scenes:any[]=[];
 return {scenes,create:async(host:unknown,key:string)=>{const scene={host,key,disposed:0,detached:0,renders:0,attach(next:unknown){this.host=next;},detach(){this.detached++;},render(){this.renders++;},dispose(){this.disposed++;}};scenes.push(scene);return scene;}};
}
test('combat reuses the released preview renderer and cancels its disposal timer',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=factory(),acquire=createScenePool(f.create);
 const preview=await acquire('preview','cover');preview.render();preview.dispose();preview.dispose();
 const combat=await acquire('arena','cover');t.mock.timers.tick(3000);combat.render();preview.render();
 assert.equal(f.scenes.length,1);assert.equal(f.scenes[0].host,'arena');assert.equal(f.scenes[0].disposed,0);assert.equal(f.scenes[0].detached,1);assert.equal(f.scenes[0].renders,2);
 combat.dispose();t.mock.timers.tick(2500);assert.equal(f.scenes[0].disposed,1);
});
test('unused scenes release GPU resources after the retention window',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=factory(),acquire=createScenePool(f.create);
 const preview=await acquire('preview','cover');preview.dispose();t.mock.timers.tick(2500);
 assert.equal(f.scenes[0].disposed,1);const next=await acquire('arena','cover');assert.equal(f.scenes.length,2);next.dispose();t.mock.timers.tick(2500);
});
test('different artwork and concurrent players never share an active scene',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=factory(),acquire=createScenePool(f.create);
 const a=await acquire('first','cover'),b=await acquire('second','cover'),c=await acquire('third','other');
 assert.equal(f.scenes.length,3);a.dispose();b.dispose();c.dispose();t.mock.timers.tick(2500);assert.ok(f.scenes.every(s=>s.disposed===1));
});
