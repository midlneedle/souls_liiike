import {beatTimes,RHYTHM_DURATION} from './beatmap.ts';
export type Slash='left'|'right'|'up'|'down';
export type Note={id:number;at:number;lane:number;kind:'stone'|'hold'|'bomb';direction:Slash;status:'waiting'|'holding'|'suspended'|'hit'|'miss'|'avoided';duration?:number;resolvedAt?:number;startPerfect?:boolean;resumeBy?:number};
export const TRAVEL=2.6;
export const HIT_WINDOW=.22;
export const MAX_HEALTH=3;
const RELEASE_GRACE=.075;
export const noteEnd=(note:Note)=>note.at+(note.duration??0);
export function createChart():Note[]{
 const notes:Note[]=[];
 const holds=new Set([12,24,36,48,58]),doubles=new Set([20,32,44,56,62]),bursts=new Set([30,38,46,54,60]);
 const place=(at:number,lane:number,kind:Note['kind'],direction:Slash,duration?:number)=>{
  // A pinned blade never asks the same finger to hit another note before its hilt clears.
  const available=[lane,(lane+1)%3,(lane+2)%3].find(candidate=>!notes.some(n=>n.lane===candidate&&noteEnd(n)+.26>at));
  if(available!==undefined)notes.push({id:notes.length,at,lane:available,kind,direction,duration,status:'waiting'});
 };
 for(let beat=4;beat<64;beat++){
  if(beat<12&&beat%2)continue;
  const lane=[1,0,2,1,2,0,1,0][beat%8];
  const kind=holds.has(beat)?'hold':beat>18&&[3,11].includes(beat%16)?'bomb':'stone';
  place(beatTimes[beat],lane,kind,beat%3===0?'up':beat%2?'left':'right',kind==='hold'?(beatTimes[beat+1]-beatTimes[beat])*1.5:undefined);
  if(doubles.has(beat))place(beatTimes[beat],(lane+2)%3,'stone','left');
  if(bursts.has(beat))place((beatTimes[beat]+beatTimes[beat+1])/2,(lane+1)%3,'stone','down');
 }
 return notes.sort((a,b)=>a.at-b.at||a.lane-b.lane).map((note,id)=>({...note,id}));
}
export class RhythmGameState{
 notes=createChart();health=MAX_HEALTH;combo=0;hits=0;perfect=0;time=0;phase:'playing'|'won'|'lost'='playing';
 lastEvent:{kind:'hit'|'hold'|'hurt'|'avoid';at:number;lane:number}|null=null;
 advance(time:number){
  if(this.phase!=='playing'||!Number.isFinite(time)||time<this.time)return;
  this.time=time;
  for(const note of this.notes){
   if(note.status==='holding'&&time>=noteEnd(note)){this.hit(note,!!note.startPerfect);continue;}
   if(note.status==='suspended'){
    if(time>(note.resumeBy??time))this.miss(note);
   }else if(note.status==='waiting'&&time>note.at+HIT_WINDOW){
    if(note.kind==='bomb'){note.status='avoided';note.resolvedAt=time;this.lastEvent={kind:'avoid',at:time,lane:note.lane};}
    else this.miss(note);
   }
   if(!this.health)return;
  }
  if(time>=RHYTHM_DURATION)this.phase='won';
 }
 tap(time:number,lane:number):Note|null{
  if(!Number.isFinite(time)||time<this.time||!Number.isInteger(lane)||lane<0||lane>2)return null;
  this.advance(time);if(this.phase!=='playing')return null;
  const suspended=this.notes.find(n=>n.status==='suspended'&&n.lane===lane);
  if(suspended){if(time>=noteEnd(suspended))this.hit(suspended,!!suspended.startPerfect);else suspended.status='holding';return suspended;}
  const note=this.notes.filter(n=>n.status==='waiting'&&n.lane===lane&&Math.abs(n.at-time)<=HIT_WINDOW).sort((a,b)=>Math.abs(a.at-time)-Math.abs(b.at-time))[0];
  if(!note)return null;
  if(note.kind==='bomb')this.miss(note);
  else if(note.kind==='hold'){note.status='holding';note.startPerfect=Math.abs(note.at-time)<.085;this.lastEvent={kind:'hold',at:time,lane};}
  else this.hit(note,Math.abs(note.at-time)<.085);
  return note;
 }
 release(time:number,lane:number,cancelled=false):Note|null{
  if(!Number.isFinite(time)||time<this.time)return null;
  this.advance(time);if(this.phase!=='playing')return null;
  const note=this.notes.find(n=>n.lane===lane&&n.status==='holding');
  if(!note)return null;
  if(!cancelled&&time>=noteEnd(note)-RELEASE_GRACE)this.hit(note,!!note.startPerfect);
  else this.miss(note);
  return note;
 }
 suspend(){for(const note of this.notes)if(note.status==='holding'){note.status='suspended';note.resumeBy=this.time+.8;}}
 private hit(note:Note,perfect:boolean){note.status='hit';note.resolvedAt=this.time;this.hits++;this.combo++;if(perfect)this.perfect++;this.lastEvent={kind:'hit',at:this.time,lane:note.lane};}
 private miss(note:Note){note.status='miss';note.resolvedAt=this.time;this.health=Math.max(0,this.health-1);this.combo=0;this.lastEvent={kind:'hurt',at:this.time,lane:note.lane};if(!this.health)this.phase='lost';}
}
