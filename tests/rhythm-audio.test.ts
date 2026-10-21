import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
const bundled=buildSync({entryPoints:['src/rhythm/audio.ts'],bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env.BASE_URL':'"/"'}}).outputFiles[0].text;
test('audio only starts explicitly, pauses its clock, and cannot start after cancellation',async()=>{
 const previousAudio=(globalThis as any).AudioContext,previousFetch=globalThis.fetch;
 let starts=0,stops=0,closed=0,requests=0;
 class Context{
  state='suspended';currentTime=10;destination={};
  async resume(){this.state='running';}async suspend(){this.state='suspended';}
  async close(){closed++;this.state='closed';}
  async decodeAudioData(){return {};}
  createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}
  createBufferSource(){return {buffer:null,connect(){},start(){starts++;},stop(){stops++;}};}
 }
 (globalThis as any).AudioContext=Context;
 globalThis.fetch=async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)} as Response;};
 try{
  const module={exports:{} as any};new Function('module','exports','require',bundled)(module,module.exports,createRequire(import.meta.url));
  const Audio=module.exports.RhythmAudio;
  const cancelled=new Audio();cancelled.dispose();await cancelled.ready;
  assert.equal(await cancelled.start(),false);assert.equal(starts,0);assert.equal(requests,0,'a cancelled hold must not download music');
  const audio=new Audio();await audio.ready;assert.equal(starts,0);
  audio.pause();assert.equal(await audio.start(),false,'loading must not start playback after backgrounding');
  assert.equal(await audio.resume(),true);assert.equal(starts,1);
  audio.pause();assert.equal(audio.context.state,'suspended');
  await audio.resume();assert.equal(starts,1,'resume must not recreate the source or restart the track');
  audio.context.currentTime=15.12;assert.ok(Math.abs(audio.time-5)<.001);
  audio.dispose();audio.dispose();assert.equal(stops,1);assert.equal(closed,2);
 }finally{(globalThis as any).AudioContext=previousAudio;globalThis.fetch=previousFetch;}
});
