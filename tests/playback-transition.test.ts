import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playAmount,pauseAmount,PLAY_PAUSE_SPRING} from '../src/playbackTransition.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test('Skeuo switch shrinks both icons to 10% at the midpoint',()=>{
 close(playAmount(0),1);close(pauseAmount(0),0);
 close(playAmount(.25),.55);close(pauseAmount(.25),.05);
 close(playAmount(.5),.1);close(pauseAmount(.5),.1);
 close(playAmount(.75),.05);close(pauseAmount(.75),.55);
 close(playAmount(1),0);close(pauseAmount(1),1);
});
test('reverse switching follows the same curve and spring overshoot never makes negative opacity',()=>{
 for(let p=-.2;p<=1.2;p+=.01){
  close(playAmount(p),pauseAmount(1-p));
  for(const amount of [playAmount(p),pauseAmount(p)])assert.ok(amount>=0&&amount<=1);
 }
});
test('spring preserves the native response and damping fraction',()=>{
 const frequency=Math.sqrt(PLAY_PAUSE_SPRING.stiffness/PLAY_PAUSE_SPRING.mass);
 close(2*Math.PI/frequency,.38);
 close(PLAY_PAUSE_SPRING.damping/(2*PLAY_PAUSE_SPRING.mass*frequency),.82);
});
