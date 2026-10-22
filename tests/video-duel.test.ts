import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VideoDuel,VIDEO_DUEL as T} from '../src/battle/videoDuel.ts';

test('the first swipe waits for intent and recognises a broad diagonal cone',()=>{
 const fight=new VideoDuel();fight.advance(0);assert.equal(fight.outcome,'ready');
 assert.equal(fight.swipe(0,-10,10),null);assert.equal(fight.outcome,'ready');
 assert.equal(fight.swipe(0,-45,60),'slash');assert.equal(fight.outcome,'fighting');
});
test('the complete movie-clock sequence requires both defences and counterattack before victory',()=>{
 const fight=new VideoDuel();fight.swipe(0,-50,50);
 assert.equal(fight.cue(3),null);assert.equal(fight.cue(T.parryReveal),'parry');
 assert.equal(fight.tap(T.parryIdeal),'parry');assert.equal(fight.perfect,true);
 fight.advance(6);assert.equal(fight.outcome,'fighting');
 assert.equal(fight.cue(T.counterReveal),'counter');assert.equal(fight.swipe(8,3,-55),'counter');
 fight.advance(9);assert.equal(fight.outcome,'fighting');fight.advance(T.finish);assert.equal(fight.outcome,'won');
});
test('an early parry spends the attempt and fails at impact; spamming cannot rescue it',()=>{
 const fight=new VideoDuel();fight.swipe(0,-50,50);
 assert.equal(fight.tap(4.5),'early');assert.equal(fight.outcome,'fighting');
 assert.equal(fight.tap(T.parryIdeal),null);assert.equal(fight.cue(T.parryIdeal),null);
 fight.advance(T.parryDeadline+.01);assert.equal(fight.outcome,'lost');
});
test('a media stall does not consume the parry window, but missing the impact does',()=>{
 const fight=new VideoDuel();fight.swipe(0,-50,50);
 for(let frame=0;frame<600;frame++)fight.advance(4.9);
 assert.equal(fight.outcome,'fighting');assert.equal(fight.tap(5.15),'parry');
 const missed=new VideoDuel();missed.swipe(0,-50,50);missed.advance(5.6);assert.equal(missed.outcome,'lost');
});
test('counterattack accepts a responsive upward swipe and rejects a wrong direction or omission',()=>{
 const fight=new VideoDuel();fight.swipe(0,-50,50);fight.tap(T.parryIdeal);
 assert.equal(fight.swipe(T.counterReveal,0,-60),'counter');
 const wrong=new VideoDuel();wrong.swipe(0,-50,50);wrong.tap(T.parryIdeal);
 assert.equal(wrong.swipe(8,0,60),'wrong');assert.equal(wrong.outcome,'lost');
 const missed=new VideoDuel();missed.swipe(0,-50,50);missed.tap(T.parryIdeal);missed.advance(T.counterDeadline+.01);assert.equal(missed.outcome,'lost');
});
test('late input cannot bypass a deadline or recover a finished fight',()=>{
 const fight=new VideoDuel();fight.swipe(0,-50,50);
 assert.equal(fight.tap(6),null);assert.equal(fight.outcome,'lost');
 assert.equal(fight.swipe(8,0,-60),null);fight.advance(10);assert.equal(fight.outcome,'lost');
});
