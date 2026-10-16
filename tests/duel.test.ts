import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from '../src/duel.ts';
function wait(d:Duel,seconds:number){let event;for(let t=0;t<seconds-1e-8;t+=.01)event=d.advance(Math.min(.01,seconds-t))??event;return event;}
function cue(d:Duel,remaining=.3){wait(d,Math.max(0,d.impactDelay-d.elapsed-remaining));}
function defend(d:Duel,remaining=.3){cue(d,remaining);return d.swipe(d.direction);}
function open(d:Duel){while(d.phase!=='stunned'&&!d.finished){if(d.phase==='windup')defend(d,.1);else wait(d,.25);}}
test('ready and invalid clock deltas cannot consume lives',()=>{const d=new Duel();d.advance(10);assert.equal(d.phase,'ready');d.start();for(const dt of [NaN,Infinity,-1,0])d.advance(dt);assert.equal(d.time,0);});
test('three unanswered attacks end the fight',()=>{const d=new Duel();d.start();wait(d,8);assert.equal(d.phase,'lost');assert.equal(d.lives,0);const t=d.time;d.advance(1);assert.equal(d.time,t);});
test('two normal defenses open a window for a combo',()=>{const d=new Duel();d.start();assert.equal(defend(d),'parried');assert.equal(d.phase,'recovery');assert.equal(d.guard,1);wait(d,.25);assert.equal(defend(d),'parried');assert.equal(d.phase,'stunned');assert.equal(d.lives,3);});
test('a precise parry breaks guard immediately',()=>{const d=new Duel();d.start();assert.equal(defend(d,.1),'parried');assert.equal(d.lastPerfect,true);assert.equal(d.phase,'stunned');});
test('without directional indicators any timely swipe can parry',()=>{for(const direction of ['left','right','up','down'] as const){const d=new Duel();d.start();cue(d);assert.equal(d.swipe(direction),'parried');assert.equal(d.lives,3);}});
test('early slashes cannot bank a future parry',()=>{const d=new Duel();d.start();assert.equal(d.swipe(d.direction),'glanced');assert.equal(wait(d,d.impactDelay+.01),'hurt');});
test('wide sweeps can also be defended using only a swipe',()=>{const d=new Duel();d.start();d.round=2;d.attack='sweep';d.direction='right';cue(d);assert.equal(d.swipe('left'),'parried');assert.equal(d.lives,3);});
test('an early dodge does not permanently escape the next attack',()=>{const d=new Duel();d.start();d.dodge(-1);wait(d,.5);assert.equal(d.lane,1);assert.equal(wait(d,1),'hurt');});
test('an open window accepts three strokes without waiting for a new attack',()=>{const d=new Duel();d.start();open(d);assert.equal(d.swipe('left'),'countered');assert.equal(d.phase,'stunned');wait(d,.11);d.swipe('right');wait(d,.11);d.swipe('left');assert.equal(d.combo,3);assert.equal(d.bossLives,5);assert.equal(d.phase,'recovery');});
test('alternating three-hit combo gets a bonus; repeating one stroke does not',()=>{const d=new Duel();d.start();open(d);for(let i=0;i<3;i++){d.swipe('up');wait(d,.11);}assert.equal(d.bossLives,6);});
test('same-frame duplicate movement cannot drain all boss health',()=>{const d=new Duel();d.start();open(d);d.swipe('left');for(let i=0;i<10;i++)d.swipe(i%2?'left':'right');assert.equal(d.bossLives,8);assert.equal(d.combo,1);});
test('vulnerability expires if the player does not attack',()=>{const d=new Duel();d.start();open(d);wait(d,2.62);assert.equal(d.phase,'windup');assert.equal(d.bossLives,9);});
test('complete fight awards a single win and leaves player alive',()=>{const d=new Duel();d.start();let wins=0;for(let turns=0;turns<20&&!d.finished;turns++){open(d);for(const direction of ['left','right','left'] as const){if(d.swipe(direction)==='won')wins++;wait(d,.11);}if(!d.finished)wait(d,.45);}assert.equal(d.phase,'won');assert.equal(d.bossLives,0);assert.equal(wins,1);assert.equal(d.lives,3);});
test('later attacks become faster as the boss loses health',()=>{const d=new Duel();d.start();const before=d.impactDelay;d.bossLives=4;assert.ok(d.impactDelay<before);});

test('two buttons can finish the fight, including wide sweeps, without gestures',()=>{
 const d=new Duel();d.start();let sweeps=0;
 for(let i=0;i<1500&&!d.finished;i++){
  if(d.phase==='windup'){if(d.attack==='sweep')sweeps++;d.shield(true);}
  else d.shield(false);
  if(d.phase==='stunned')d.strike();
  d.advance(.05);
 }
 assert.equal(d.phase,'won');assert.equal(d.lives,3);assert.ok(sweeps>0);
});
test('holding the shield blocks a sweep but does not count as perfect timing',()=>{
 const d=new Duel();d.start();d.attack='sweep';d.shield(true);
 d.advance(d.impactDelay);assert.equal(d.lives,3);assert.equal(d.guard,1);assert.equal(d.lastPerfect,false);
 d.shield(false);assert.equal(d.shielding,false);
});
test('sword button has a readable attack cadence and alternates its combo',()=>{
 const d=new Duel();d.start();d.phase='stunned';d.phaseStart=d.time;
 assert.equal(d.strike(),'countered');const hp=d.bossLives;assert.equal(d.strike(),undefined);assert.equal(d.bossLives,hp);
 d.advance(.31);d.strike();d.advance(.31);d.strike();assert.equal(d.bossLives,5);
});
