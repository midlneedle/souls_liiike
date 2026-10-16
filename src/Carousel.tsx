import { useEffect, useRef, useState } from 'react';
import palettes from './palettes.json';
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import type { MotionValue, MotionStyle } from 'motion/react';
import type { Entity } from './data';
import { asset } from './data';
import { Artwork, Icon } from './ui';
import { CAROUSEL_STEP, cardGeometry, snapDelta, springForDistance, nearestVirtualIndex } from './carouselGeometry';

function bottomShape(){
 const pts=['M 0 0','L 1 0','L 1 .65'];
 for(let i=1;i<=12;i++){const a=i/12*Math.PI/2;pts.push(`L ${.65+.35*Math.pow(Math.cos(a),.5)} ${.65+.35*Math.pow(Math.sin(a),.5)}`);}
 pts.push('L .35 1');
 for(let i=1;i<=12;i++){const a=Math.PI/2+i/12*Math.PI/2;pts.push(`L ${.35-.35*Math.pow(Math.abs(Math.cos(a)),.5)} ${.65+.35*Math.pow(Math.abs(Math.sin(a)),.5)}`);}
 return pts.join(' ')+' Z';
}
export default function Carousel({entities,index,active,playing,disabled,onFocus,onQueue}:{entities:Entity[];index:number;active:string|null;playing:boolean;disabled:boolean;onFocus:(index:number)=>void;onQueue:(entity:Entity)=>void}) {
 const [anchor,setAnchor]=useState(index),[focused,setFocused]=useState(index),[width,setWidth]=useState(390);
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new ResizeObserver(()=>setWidth(el.clientWidth));observer.observe(el);setWidth(el.clientWidth);return()=>observer.disconnect();},[]);
 const position=useMotionValue(index*CAROUSEL_STEP),base=useRef(index),target=useRef(index),running=useRef(false);
 const animation=useRef<ReturnType<typeof animate>|null>(null),wheelTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const callbacks=useRef({onFocus,disabled});callbacks.current={onFocus,disabled};
 const pointer=useRef<{id:number;start:number;last:number;time:number;velocity:number;dragging:boolean}|null>(null);
 const wheel=useRef({translation:0,velocity:0,time:0});
 const wrap=(n:number)=>(n%entities.length+entities.length)%entities.length;
 function snap(n:number,notify=true){
  animation.current?.stop();const distance=n-base.current;target.current=n;running.current=true;setFocused(n);
  if(notify&&wrap(n)!==wrap(index))callbacks.current.onFocus(n);
  animation.current=animate(position,n*CAROUSEL_STEP,{...springForDistance(distance),onComplete:()=>{base.current=n;setAnchor(n);running.current=false;}});
 }
 function interrupt(){
  if(!running.current)return;
  animation.current?.stop();base.current=target.current;setAnchor(base.current);position.jump(base.current*CAROUSEL_STEP);running.current=false;
 }
 useEffect(()=>{if(wrap(index)!==wrap(target.current))snap(nearestVirtualIndex(index,target.current,entities.length),false);},[index]);
 // Move the render window with the actual position, including long trackpad gestures.
 // Absolute virtual keys and initial={false} keep new cards at their proper offsets.
 useMotionValueEvent(position,'change',p=>{const centre=Math.round(p/CAROUSEL_STEP);setAnchor(previous=>previous===centre?previous:centre);});
 useEffect(()=>()=>{animation.current?.stop();if(wheelTimer.current)clearTimeout(wheelTimer.current);},[]);
 const radius=Math.max(Math.ceil(width/CAROUSEL_STEP*.5)+2+3,8);
 return <div ref={root} className="carousel" role="region" aria-label="Музыкальные подборки" tabIndex={0}
  onKeyDown={e=>{if(disabled)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();interrupt();snap(base.current+(e.key==='ArrowLeft'?-1:1));}}}
  onPointerDown={e=>{if(!e.isPrimary||disabled||pointer.current)return;pointer.current={id:e.pointerId,start:e.clientX,last:e.clientX,time:performance.now(),velocity:0,dragging:false};e.currentTarget.setPointerCapture(e.pointerId);}}
  onPointerMove={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;const dx=e.clientX-p.start,now=performance.now();if(!p.dragging&&Math.abs(dx)<8)return;if(!p.dragging){interrupt();p.dragging=true;}p.velocity=(e.clientX-p.last)/Math.max(1,now-p.time)*1000;p.last=e.clientX;p.time=now;position.set(base.current*CAROUSEL_STEP-dx*.62);}}
  onPointerUp={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;pointer.current=null;if(p.dragging){const v=performance.now()-p.time<100?p.velocity:0;snap(base.current+snapDelta(e.clientX-p.start,v*.2,entities.length));return;}const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;const focusedEntity=entities[wrap(base.current)];if(Math.abs(x)<=32&&y>=-54&&y<=10&&focusedEntity.id!=='my-flow'){onQueue(focusedEntity);return;}if(Math.abs(x)<=80)return;for(let v=base.current-2;v<=base.current+2;v++){const raw=v*CAROUSEL_STEP-position.get();if(v!==base.current&&Math.abs(raw)<CAROUSEL_STEP*1.25&&Math.abs(x-raw)<80){snap(v);break;}}}}
  onPointerCancel={()=>{pointer.current=null;snap(base.current);}}
  onWheel={e=>{if(disabled||Math.abs(e.deltaX)<Math.abs(e.deltaY))return;if(!wheelTimer.current){interrupt();wheel.current={translation:0,velocity:0,time:performance.now()};}const now=performance.now();wheel.current.translation-=e.deltaX;wheel.current.velocity=-e.deltaX/Math.max(16,now-wheel.current.time)*1000;wheel.current.time=now;position.set(base.current*CAROUSEL_STEP-wheel.current.translation*.62);if(Math.abs(wheel.current.translation*.62)>CAROUSEL_STEP*3){const shift=Math.round(position.get()/CAROUSEL_STEP)-base.current;base.current+=shift;target.current=base.current;wheel.current.translation+=shift*CAROUSEL_STEP/.62;}if(wheelTimer.current)clearTimeout(wheelTimer.current);wheelTimer.current=setTimeout(()=>{wheelTimer.current=null;snap(base.current+snapDelta(wheel.current.translation,wheel.current.velocity*.2,entities.length));},100);}}>
  <svg className="shape-definitions" aria-hidden="true"><defs><clipPath id="native-carousel-shape" clipPathUnits="objectBoundingBox"><path d={bottomShape()}/></clipPath></defs></svg>
  {Array.from({length:radius*2+1},(_,i)=>anchor+i-radius).map(v=><CarouselCard key={v} entity={entities[wrap(v)]} virtualIndex={v} position={position} focused={wrap(v)===wrap(focused)} selected={wrap(v)===wrap(index)} active={active===entities[wrap(v)].id} playing={playing} onSelect={()=>{if(!disabled){interrupt();snap(v);}}} onQueue={()=>{if(!disabled)onQueue(entities[wrap(v)]);}}/>)}
 </div>;
}
function CarouselCard({entity,virtualIndex,position,focused,selected,active,playing,onSelect,onQueue}:{entity:Entity;virtualIndex:number;position:MotionValue<number>;focused:boolean;selected:boolean;active:boolean;playing:boolean;onSelect:()=>void;onQueue:()=>void}){
 const x=useTransform(position,p=>cardGeometry(virtualIndex,p).offset),scale=useTransform(position,p=>cardGeometry(virtualIndex,p).scale),rotate=useTransform(position,p=>cardGeometry(virtualIndex,p).rotation),compensation=useTransform(position,p=>cardGeometry(virtualIndex,p).compensation);
 return <motion.div className={`entity-card ${focused?'focused':''}`} initial={false} style={{x,scale,rotate,zIndex:100-Math.abs(virtualIndex-Math.round(position.get()/154)),'--entity-accent':palettes[entity.id as keyof typeof palettes]?.glowAccent} as MotionStyle}>
  <div className="native-card-background"><span style={{maskImage:`url("${asset('ToothGlow.png')}")`,WebkitMaskImage:`url("${asset('ToothGlow.png')}")`}}/></div>
  <button className="entity-select" aria-label={`Выбрать ${entity.title}`} aria-current={focused?'true':undefined} onClick={e=>{if(e.detail===0)onSelect();}} tabIndex={focused?0:-1}>
   <motion.span className={`entity-thumbnail ${selected&&entity.id!=='my-flow'?'queue-selected':''} ${entity.kind==='artist'?'round':''}`} style={{scale:compensation}}><span className="thumbnail-art"><Artwork entity={entity} small/></span>{entity.id!=='my-flow'&&<span className={`thumbnail-action ${entity.kind==='flow'?'tuner':''}`}>{entity.kind==='flow'?<svg width="32" height="32" viewBox="0 0 32 32"><g fill="currentColor">{[6,16,26].flatMap(y=>[6,16,26].map(x=><circle key={`${x}-${y}`} cx={x} cy={y} r="1.5"/>))}</g><circle cx="16" cy="16" r="5" fill="currentColor"/></svg>:<Icon name="Queue"/>}</span>}{active&&!selected&&<span className={`equalizer ${playing?'':'paused'}`}><i/><i/><i/><i/></span>}</motion.span>
   <motion.span className="entity-title" style={{scale:compensation}}>{entity.title}</motion.span>
  </button>
  {selected&&entity.id!=='my-flow'&&<button className="queue-trigger" aria-label={`Очередь: ${entity.title}`} onClick={e=>{if(e.detail===0)onQueue();}}/>}
 </motion.div>;
}
