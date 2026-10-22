/** All deadlines use the movie's media clock, never elapsed wall time. */
export const VIDEO_DUEL={parryReveal:4.05,parryEarly:5.02,parryIdeal:5.38,parryDeadline:5.55,counterReveal:7.25,counterEarly:7.25,counterIdeal:8.3,counterDeadline:8.72,finish:9.7} as const;
export type VideoCue='slash'|'parry'|'counter'|null;
export type VideoOutcome='ready'|'fighting'|'won'|'lost';
export type VideoResponse='slash'|'parry'|'counter'|'early'|'wrong'|null;
export class VideoDuel{
 outcome:VideoOutcome='ready';step=0;perfect=false;parrySpent=false;
 cue(time:number):VideoCue{
  if(this.outcome==='ready')return 'slash';
  if(this.outcome!=='fighting')return null;
  if(this.step===1&&!this.parrySpent&&time>=VIDEO_DUEL.parryReveal&&time<=VIDEO_DUEL.parryDeadline)return 'parry';
  if(this.step===2&&time>=VIDEO_DUEL.counterReveal&&time<=VIDEO_DUEL.counterDeadline)return 'counter';
  return null;
 }
 advance(time:number){
  if(this.outcome!=='fighting')return;
  if((this.step===1&&time>VIDEO_DUEL.parryDeadline)||(this.step===2&&time>VIDEO_DUEL.counterDeadline))this.outcome='lost';
  else if(this.step===3&&time>=VIDEO_DUEL.finish)this.outcome='won';
 }
 swipe(time:number,dx:number,dy:number):VideoResponse{
  this.advance(time);const cue=this.cue(time),length=Math.hypot(dx,dy);
  if(length<30||cue!=='slash'&&cue!=='counter')return null;
  const alignment=cue==='slash'?(-dx+dy)/(Math.SQRT2*length):-dy/length;
  if(alignment<.57)return this.fail();
  if(cue==='slash'){this.outcome='fighting';this.step=1;return 'slash';}
  if(time<VIDEO_DUEL.counterEarly)return this.fail();
  this.step=3;return 'counter';
 }
 tap(time:number):VideoResponse{
  this.advance(time);if(this.cue(time)!=='parry')return null;
  if(time<VIDEO_DUEL.parryEarly){this.parrySpent=true;return 'early';}
  this.perfect=Math.abs(time-VIDEO_DUEL.parryIdeal)<.12;this.step=2;return 'parry';
 }
 private fail():VideoResponse{this.outcome='lost';return 'wrong';}
}
