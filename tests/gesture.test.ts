import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SlashGesture} from '../src/battle/gesture.ts';
test('a slash is recognized before finger release',()=>{const g=new SlashGesture(0,0);assert.equal(g.move(12,0),undefined);assert.equal(g.move(25,0),'right');assert.equal(g.slashes,1);});
test('one long stroke cannot produce a string of duplicate hits',()=>{const g=new SlashGesture(0,0);assert.equal(g.move(30,0),'right');for(const x of [60,90,120,150])assert.equal(g.move(x,0),undefined);assert.equal(g.slashes,1);});
test('reversing the finger makes a responsive alternating combo',()=>{const g=new SlashGesture(0,0);assert.equal(g.move(30,0),'right');g.move(60,0);assert.equal(g.move(34,0),'left');g.move(4,0);assert.equal(g.move(30,0),'right');assert.equal(g.slashes,3);});
test('diagonal movement uses its dominant axis',()=>{const g=new SlashGesture(10,10);assert.equal(g.move(15,-25),'up');assert.equal(g.move(17,15),'down');});
