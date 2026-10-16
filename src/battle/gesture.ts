import type {Direction} from '../duel';
/** Emits on movement, once per stroke direction. Reversing can begin the next slash. */
export class SlashGesture{
 private x:number;private y:number;private direction:Direction|null=null;
 distance=0;slashes=0;
 constructor(x:number,y:number){this.x=x;this.y=y;}
 move(x:number,y:number):Direction|undefined{
  const dx=x-this.x,dy=y-this.y;this.distance=Math.max(this.distance,Math.hypot(dx,dy));
  if(Math.hypot(dx,dy)<24)return;
  const direction:Direction=Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
  this.x=x;this.y=y;
  if(this.direction===direction)return;
  this.direction=direction;this.slashes++;return direction;
 }
}
export type SwordInput={active:boolean;x:number;y:number;direction:Direction;at:number};
