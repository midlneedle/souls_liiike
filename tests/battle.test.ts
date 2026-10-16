import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from '../src/duel.ts';
import {createBattleModel} from '../src/battle/model.js';

test('heart arrives before the weapon appears and keeps its place through transformation',()=>{
 const m=createBattleModel(),d=new Duel();
 m.pose(d,{intro:0,event:null,eventAge:10});assert.equal(m.sword.visible,false);
 m.pose(d,{intro:.05,event:null,eventAge:10});assert.equal(m.sword.visible,true);assert.equal(m.blade.visible,false);
 const origin=m.sword.position.clone();assert.equal(origin.x,0);
 m.pose(d,{intro:1,event:null,eventAge:10});assert.ok(m.sword.position.equals(origin));assert.equal(m.blade.visible,true);
 d.phase='won';m.pose(d,{intro:1,event:'won',eventAge:.8});assert.ok(m.sword.position.equals(origin));m.dispose();
});

test('heart hilt stays intact while the blade extends and retracts',()=>{
 const m=createBattleModel(),d=new Duel();
 m.pose(d,{intro:0,event:null,eventAge:10});assert.equal(m.blade.visible,false);assert.ok(m.hilt.visible);
 m.pose(d,{intro:1,event:null,eventAge:10});assert.equal(m.blade.visible,true);assert.equal(m.blade.scale.y,1);
 d.phase='won';m.pose(d,{intro:1,event:'won',eventAge:.7});assert.equal(m.blade.visible,false);assert.equal(m.hilt.material.color.getHex(),0x7fe3a2);
 m.dispose();
});
test('parry physically raises the sword across the incoming hand',()=>{
 const m=createBattleModel(),d=new Duel();d.start();m.pose(d,{intro:1,event:null,eventAge:10});const resting=m.sword.position.y;d.parry();m.pose(d,{intro:1,event:null,eventAge:10});assert.ok(m.sword.position.y>resting);assert.ok(m.sword.rotation.z< -1);m.dispose();
});
test('all attack types keep articulated geometry finite at every cue stage',()=>{
 const m=createBattleModel();for(const attack of ['thrust','sweep','delayed'] as const)for(const progress of [0,.3,.7,.9,1]){const d=new Duel();d.start();d.attack=attack;d.time=d.impactDelay*progress;m.pose(d,{intro:1,event:null,eventAge:10});m.root.updateMatrixWorld(true);m.root.traverse((o:any)=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}m.dispose();
});
test('victory ends the boss and hands the heart back after sheathing',()=>{
 const m=createBattleModel(),d=new Duel();d.phase='won';m.pose(d,{intro:1,event:'won',eventAge:.9});assert.equal(m.sword.visible,false);m.pose(d,{intro:1,event:'won',eventAge:1.2});assert.equal(m.boss.visible,false);m.dispose();
});
test('boss body unfolds below an intact track head',()=>{
 const m=createBattleModel(),d=new Duel();m.pose(d,{intro:0,event:null,eventAge:10});assert.equal(m.body.scale.y,0);m.pose(d,{intro:1,event:null,eventAge:10});assert.equal(m.body.scale.y,1);assert.equal(m.head.cover.visible,true);assert.ok(m.head.root.position.y>m.body.position.y);m.dispose();
});

test('three health states progressively expose wounds and collapse the posture',()=>{
 const m=createBattleModel(),d=new Duel();const heights:number[]=[],marks:number[]=[];
 for(const hp of [9,6,3]){d.bossLives=hp;m.pose(d,{intro:1,event:null,eventAge:10});heights.push(m.head.root.position.y);let count=0;m.boss.traverse((o:any)=>{if(o.isMesh&&o.material.color?.getHex()===0x341c22&&o.visible)count++;});marks.push(count);}
 assert.deepEqual(marks,[0,3,7]);assert.ok(heights[0]>heights[1]&&heights[1]>heights[2]);m.dispose();
});
