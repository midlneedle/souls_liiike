import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RhythmGameState,createChart,TRAVEL,HIT_WINDOW,MAX_HEALTH,noteEnd} from '../src/rhythm/game.ts';
import type {Note} from '../src/rhythm/game.ts';
import {RHYTHM_DURATION} from '../src/rhythm/beatmap.ts';
function isolated(kind:Note['kind']='hold'){
 const game=new RhythmGameState();game.notes=[{id:0,at:4,lane:1,kind,direction:'up',duration:kind==='hold'?1:undefined,status:'waiting'}];return game;
}
test('chart progresses from taps to holds, pairs and faster runs without lane conflicts',()=>{
 const chart=createChart();assert.ok(chart[0].at>TRAVEL);
 assert.equal(new Set(chart.map(n=>n.id)).size,chart.length);
 for(let i=1;i<chart.length;i++)assert.ok(chart[i].at>=chart[i-1].at);
 assert.ok(chart.every(n=>noteEnd(n)<RHYTHM_DURATION-1));
 assert.ok(chart.some(n=>n.kind==='bomb'));assert.equal(chart.filter(n=>n.kind==='hold').length,5);
 assert.equal(chart.filter((n,i)=>chart[i-1]?.at===n.at).length,5);
 assert.ok(chart.some((n,i)=>chart[i-1]&&n.at-chart[i-1].at>.25&&n.at-chart[i-1].at<.4));
 for(const note of chart){
  const next=chart.find(n=>n.lane===note.lane&&n.at>note.at);
  if(next)assert.ok(next.at>noteEnd(note)+.25);
  // At most two fingers are needed, including holds still crossing the gate.
  assert.ok(chart.filter(n=>n.at<=note.at&&noteEnd(n)>=note.at&&n.kind!=='bomb').length<=2);
 }
});
test('three missed stones end the run, with no fourth life or repeated damage',()=>{
 const game=new RhythmGameState();assert.equal(game.health,3);assert.equal(MAX_HEALTH,3);
 for(let i=0;i<3;i++){game.advance(game.notes[i].at+HIT_WINDOW+.001);assert.equal(game.health,2-i);}
 assert.equal(game.phase,'lost');game.advance(40);assert.equal(game.health,0);
});
test('a tap hits once; wrong lane and early taps cannot destroy stones',()=>{
 const game=isolated('stone'),note=game.notes[0];
 assert.equal(game.tap(note.at-.4,note.lane),null);
 assert.equal(game.tap(note.at,(note.lane+1)%3),null);
 assert.equal(game.tap(note.at,note.lane)?.status,'hit');
 assert.equal(game.tap(note.at,note.lane),null);
 assert.equal(game.combo,1);assert.equal(game.health,3);assert.equal(game.perfect,1);
});
test('a long attack is not a hit until its entire tail has been held',()=>{
 const game=isolated(),note=game.notes[0];
 game.tap(4,1);assert.equal(note.status,'holding');assert.equal(game.hits,0);
 game.advance(4.8);assert.equal(note.status,'holding');assert.equal(game.health,3);
 game.advance(5);assert.equal(note.status,'hit');assert.equal(game.hits,1);assert.equal(game.perfect,1);
 game.release(5.1,1);assert.equal(game.hits,1);assert.equal(game.health,3);
});
test('letting go early loses exactly one life; tiny release error at the tail is forgiven',()=>{
 const game=isolated();game.tap(4,1);game.release(4.5,1);
 assert.equal(game.notes[0].status,'miss');assert.equal(game.health,2);game.advance(6);assert.equal(game.health,2);
 const other=isolated();other.tap(4,1);other.release(4.95,1);assert.equal(other.hits,1);assert.equal(other.health,3);
});
test('cancelled touch breaks a hold while unrelated finger release does not',()=>{
 const game=isolated();game.tap(4,1);assert.equal(game.release(4.4,0),null);assert.equal(game.notes[0].status,'holding');
 game.release(4.95,1,true);assert.equal(game.health,2);assert.equal(game.hits,0);
});
test('a pair can be pressed at the same audio time and never requires a swipe',()=>{
 const game=new RhythmGameState(),pair=game.notes.filter(n=>n.at===game.notes.find((n,i)=>game.notes[i+1]?.at===n.at)!.at);
 game.notes=pair;assert.equal(pair.length,2);assert.notEqual(pair[0].lane,pair[1].lane);
 for(const note of pair)game.tap(note.at,note.lane);
 assert.equal(game.hits,2);assert.equal(game.combo,2);assert.equal(game.health,3);
});
test('one finger holds a blade while another cuts a stone on the neighbouring lane',()=>{
 const game=isolated();game.notes.push({id:1,at:4.5,lane:2,kind:'stone',direction:'left',status:'waiting'});
 game.tap(4,1);game.tap(4.5,2);game.release(4.6,2);assert.equal(game.notes[0].status,'holding');
 game.release(5,1);assert.equal(game.hits,2);assert.equal(game.health,3);
});
test('bombs are safe when ignored and damage on contact',()=>{
 const game=isolated('bomb');game.advance(4.23);assert.equal(game.notes[0].status,'avoided');assert.equal(game.health,3);
 const other=isolated('bomb');other.tap(4,1);assert.equal(other.health,2);other.advance(6);assert.equal(other.health,2);
});
test('a paused hold can be regrabbed; suspension alone never grants a completed attack',()=>{
 const game=isolated();game.tap(4,1);game.advance(4.3);game.suspend();
 game.advance(4.3);assert.equal(game.notes[0].status,'suspended');assert.equal(game.hits,0);
 game.tap(4.5,1);game.release(5,1);assert.equal(game.hits,1);assert.equal(game.health,3);
 const other=isolated();other.tap(4,1);other.advance(4.8);other.suspend();other.advance(5.3);assert.equal(other.hits,0);
 other.tap(5.4,1);assert.equal(other.hits,1);assert.equal(other.health,3);
 const missed=isolated();missed.tap(4,1);missed.suspend();missed.advance(4.81);assert.equal(missed.health,2);
});
test('the complete mixed chart is playable with all three lives',()=>{
 const game=new RhythmGameState();
 const actions=game.notes.flatMap(n=>n.kind==='bomb'?[]:[{at:n.at,n,press:true},...(n.kind==='hold'?[{at:noteEnd(n),n,press:false}]:[])]).sort((a,b)=>a.at-b.at);
 for(const {at,n,press} of actions){if(press)game.tap(at,n.lane);else game.release(at,n.lane);}
 game.advance(RHYTHM_DURATION);assert.equal(game.phase,'won');assert.equal(game.health,3);
 assert.equal(game.hits,game.notes.filter(n=>n.kind!=='bomb').length);
 assert.equal(game.perfect,game.hits);
});
test('a backwards or invalid clock cannot consume notes or replay an input',()=>{
 const game=isolated('stone');game.advance(4.1);
 assert.equal(game.tap(4,1),null);assert.equal(game.tap(NaN,1),null);assert.equal(game.tap(4.1,-1),null);
 game.advance(1);game.advance(NaN);assert.equal(game.time,4.1);assert.equal(game.health,3);assert.equal(game.hits,0);
});
