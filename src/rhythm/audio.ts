import {withDeadline} from '../loading';
let clip:Promise<ArrayBuffer>|null=null;
const loadClip=()=>clip??=(async()=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const response=await fetch(`${import.meta.env.BASE_URL}music/bellkeeper.m4a`,{signal:controller.signal});if(!response.ok)throw Error('Audio unavailable');return await response.arrayBuffer();}
 catch(error){clip=null;throw error;}finally{clearTimeout(timer);}
})();
let decodedClip:Promise<AudioBuffer>|null=null;
const decodeClip=(context:BaseAudioContext)=>decodedClip??=withDeadline(loadClip().then(bytes=>context.decodeAudioData(bytes.slice(0))),20000).catch(error=>{decodedClip=null;throw error;});
export const preloadRhythmAudio=()=>decodedClip?decodedClip.then(()=>{}):typeof OfflineAudioContext==='undefined'?loadClip().then(()=>{}):decodeClip(new OfflineAudioContext(2,1,44100)).then(()=>{});
// Construct on pointer/keyboard down: resume runs inside the trusted user gesture.
export class RhythmAudio{
 readonly context:AudioContext;
 private decoded:Promise<AudioBuffer|null>|null=null;
 private unlocked:Promise<void>;
 private paused=false;
 error=false;started=false;disposed=false;
 private source:AudioBufferSourceNode|null=null;
 private gain:GainNode;
 private origin=0;
 constructor(){
  this.context=new AudioContext();this.gain=this.context.createGain();this.gain.connect(this.context.destination);
  this.unlocked=this.context.resume().catch(()=>{});
 }
 get ready(){
  if(this.disposed)return Promise.resolve(null);
  return this.decoded??=Promise.all([this.unlocked,decodeClip(this.context)]).then(([,buffer])=>buffer).catch(()=>{this.error=true;return null;});
 }
 get time(){return this.started?Math.max(0,this.context.currentTime-this.origin):0;}
 async start(){
  const buffer=await this.ready;if(!buffer||this.disposed)return false;if(this.started)return true;
  if(this.paused||this.context.state!=='running')return false;
  this.source=this.context.createBufferSource();this.source.buffer=buffer;this.source.connect(this.gain);
  this.origin=this.context.currentTime+.12;this.gain.gain.setValueAtTime(0,this.origin);this.gain.gain.linearRampToValueAtTime(.7,this.origin+.2);
  this.source.start(this.origin);this.started=true;return true;
 }
 pause(){this.paused=true;if(!this.disposed)void this.context.suspend().catch(()=>{});}
 async resume(){if(this.disposed)return false;this.paused=false;await this.context.resume();return this.start();}
 dispose(){if(this.disposed)return;this.disposed=true;this.source?.stop();void this.context.close();}
}
