/** Touch-first duel: defend, break the enemy's guard, then slash a short combo. */
export type Phase='ready'|'windup'|'recovery'|'stunned'|'won'|'lost';
export type Attack='thrust'|'sweep'|'delayed';
export type Direction='left'|'right'|'up'|'down';
export type DuelEvent='parried'|'dodged'|'hurt'|'countered'|'won'|'lost'|'glanced';
const pattern:{attack:Attack;direction:Direction;delay:number}[]=[
 {attack:'thrust',direction:'up',delay:1.35},
 {attack:'delayed',direction:'left',delay:1.65},
 {attack:'sweep',direction:'right',delay:1.15},
 {attack:'thrust',direction:'down',delay:1.05},
 {attack:'thrust',direction:'right',delay:1.1},
 {attack:'delayed',direction:'up',delay:1.55},
];
export class Duel{
 phase:Phase='ready';attack:Attack='thrust';direction:Direction='up';lives=3;bossLives=9;readonly bossMaxLives=9;
 lane=1;targetLane=1;time=0;phaseStart=0;round=0;guard=0;combo=0;lastPerfect=false;
 private shieldHeld=false;
 private parryUntil=-1;private parryCooldown=-1;private dodgeUntil=-1;private dodgeCooldown=-1;private hitCooldown=-1;
 private recoveryDelay=.3;private comboDirections:Direction[]=[];
 get elapsed(){return this.time-this.phaseStart;}
 get impactDelay(){return pattern[this.round%pattern.length].delay*(this.bossLives<=4?.86:1);}
 get cue(){return this.phase==='windup'&&this.elapsed>=this.impactDelay-.42;}
 get shielding(){return this.shieldHeld||this.time<=this.parryUntil;}
 get rolling(){return this.time<=this.dodgeUntil;}
 get finished(){return this.phase==='won'||this.phase==='lost';}
 get vulnerabilityRemaining(){return this.phase==='stunned'?Math.max(0,2.6-this.elapsed):0;}
 get dodgeOnly(){return this.attack==='sweep';}
 start(lives=3){Object.assign(this,new Duel());this.lives=Math.max(1,Math.min(3,Math.ceil(lives-1e-8)));this.beginAttack();}
 private beginAttack(){const next=pattern[this.round%pattern.length];this.attack=next.attack;this.direction=next.direction;this.phase='windup';this.phaseStart=this.time;this.targetLane=this.lane;this.combo=0;this.comboDirections=[];}
 private defend(event:'parried'|'dodged',timed=true):DuelEvent{
  this.lastPerfect=timed&&this.impactDelay-this.elapsed<=.14;
  this.guard+=this.lastPerfect?2:1;
  this.phase=this.guard>=2?'stunned':'recovery';this.phaseStart=this.time;this.recoveryDelay=.24;
  if(this.phase==='stunned'){this.guard=0;this.combo=0;this.comboDirections=[];}
  return event;
 }
 parry():DuelEvent|undefined{
  if(this.phase!=='windup'||this.time<this.parryCooldown)return;
  this.parryUntil=this.time+.25;this.parryCooldown=this.time+.3;
  if(this.cue&&!this.dodgeOnly)return this.defend('parried');
 }
 shield(held:boolean):DuelEvent|undefined{this.shieldHeld=held;if(held)return this.parry();}
 strike():DuelEvent|undefined{
  if(this.phase!=='stunned')return this.phase==='windup'?'glanced':undefined;
  if(this.time<this.hitCooldown)return;
  const result=this.counter(this.combo%2===0?'right':'left');this.hitCooldown=this.time+.3;return result;
 }
 dodge(direction:number):DuelEvent|undefined{
  if(this.phase!=='windup'||this.time<this.dodgeCooldown)return;
  this.lane=direction<0?0:2;this.dodgeUntil=this.time+.38;this.dodgeCooldown=this.time+.34;
  if(this.cue&&this.elapsed>=this.impactDelay-.38)return this.defend('dodged');
 }
 swipe(direction:Direction):DuelEvent|undefined{
  if(this.phase==='stunned')return this.counter(direction);
  if(this.phase!=='windup')return;
  if(this.cue){this.parryUntil=this.time+.2;return this.defend('parried');}
  return 'glanced';
 }
 counter(direction:Direction='up'):DuelEvent|undefined{
  if(this.phase!=='stunned'||this.time<this.hitCooldown)return;
  this.hitCooldown=this.time+.1;this.combo++;this.comboDirections.push(direction);
  const chain=this.comboDirections;
  const bonus=chain.length===3&&chain[0]===chain[2]&&chain[0]!==chain[1];
  this.bossLives=Math.max(0,this.bossLives-(bonus?2:1));
  if(this.bossLives===0){this.phase='won';this.phaseStart=this.time;return 'won';}
  if(this.combo===3){this.phase='recovery';this.phaseStart=this.time;this.recoveryDelay=.42;}
  return 'countered';
 }
 advance(delta:number):DuelEvent|undefined{
  if(this.phase==='ready'||this.finished||delta<=0||!Number.isFinite(delta))return;
  this.time+=delta;
  if(!this.rolling)this.lane=1;
  if(this.phase==='windup'&&this.elapsed>=this.impactDelay){
   const impact=this.phaseStart+this.impactDelay;
   if(this.shieldHeld)return this.defend('parried',false);
   if(!this.dodgeOnly&&this.parryUntil>=impact)return this.defend('parried');
   if(this.dodgeUntil>=impact)return this.defend('dodged');
   this.lives--;this.guard=0;this.phaseStart=this.time;this.phase=this.lives===0?'lost':'recovery';this.recoveryDelay=.55;
   return this.lives===0?'lost':'hurt';
  }
  if((this.phase==='recovery'&&this.elapsed>=this.recoveryDelay)||(this.phase==='stunned'&&this.elapsed>=2.6)){this.round++;this.beginAttack();}
 }
}
