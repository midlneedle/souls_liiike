import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STREAM,streamTimes,streamElapsed,streamPose,wrapSpeech} from '../src/streamText.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const times=streamTimes('ABC DEF GHI');
const lines=[{first:0,width:30,advances:[10,20,30]},{first:4,width:30,advances:[10,20,30]},{first:8,width:30,advances:[10,20,30]}];

test('stream copies the slow first word, fast later letters and word pauses',()=>{
 close(times[0],.2);close(times[1]-times[0],.08);close(times[2]-times[1],.08);
 close(times[4]-times[3],.08+.05);close(times[5]-times[4],.02);close(times[8]-times[7],.02+.05);
});
test('first line starts at the centre and eases to its final horizontal position',()=>{
 close(streamPose(0,times,lines).x,15);
 const early=streamPose(times[0]+.02,times,lines).x;
 const late=streamPose(times[0]+.06,times,lines).x;
 assert.ok(early>late&&late>0);
 for(let t=times[2];t<2;t+=.01)close(streamPose(t,times,lines).x,0);
});
test('new lines recenter vertically over their own smooth ramp',()=>{
 close(streamPose(0,times,lines).y,26);
 const a=streamPose(times[4],times,lines).y,b=streamPose(times[4]+.05,times,lines).y;
 assert.ok(a>=b&&b>0);
 close(streamPose(times.at(-1)!+STREAM.lineSettle,times,lines).y,0);
});
test('exit untypes end to start and returns through the same centre-follow path',()=>{
 let previous=Infinity;
 for(let raw=0;raw<=STREAM.exitDuration+.001;raw+=.005){const pose=streamPose(streamElapsed(raw,times,true),times,lines);assert.ok(pose.visible<=previous);previous=pose.visible;assert.ok(Number.isFinite(pose.x)&&Number.isFinite(pose.y));}
 const end=streamPose(streamElapsed(STREAM.exitDuration,times,true),times,lines);
 assert.equal(end.visible,0);close(end.x,15);close(end.y,26);
});
test('single-line and empty messages finish cleanly without drift',()=>{
 const short=streamTimes('A');const line=[{first:0,width:10,advances:[10]}];
 assert.deepEqual(streamPose(2,short,line),{x:0,y:0,visible:1});
 assert.deepEqual(streamPose(1,[],[]),{x:0,y:0,visible:0});
});

test('speech never exceeds two lines and trims overflow at a word boundary',()=>{
 const measure=(text:string)=>Array.from(text).length*10;
 assert.deepEqual(wrapSpeech('ONE TWO THREE FOUR FIVE',80,measure),['ONE TWO','THREE…']);
 assert.deepEqual(wrapSpeech('ONE TWO THREE',80,measure),['ONE TWO','THREE']);
 assert.deepEqual(wrapSpeech('',80,measure),[]);
});
