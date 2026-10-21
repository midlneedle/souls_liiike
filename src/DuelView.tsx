import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {motion,useIsPresent,useReducedMotion} from 'motion/react';
import {Duel} from './duel';
import type {Direction,DuelEvent} from './duel';
import {SlashGesture} from './battle/gesture';
import type {SwordInput} from './battle/gesture';
import type {BattleEvent} from './battle/scene';
import {asset} from './data';
import type {Track} from './data';
import {Icon} from './ui';
import BattleStage from './BattleStage';
export default function DuelView({track,onSaved,onClose,initialHealth=1,onHealthChange,goal='save'}:{track:Track;onSaved:()=>void;onClose:()=>void;initialHealth?:number;onHealthChange?:(health:number)=>void;goal?:'save'|'dislike'}){
 const startingHealth=useRef(initialHealth),healthRef=useRef(onHealthChange);healthRef.current=onHealthChange;
 const duel=useRef(new Duel()),arena=useRef<HTMLDivElement>(null),present=useRef(true),isPresent=useIsPresent();present.current=isPresent;
 const [graphics,setGraphics]=useState(false),[forming,setForming]=useState(false),[event,setEvent]=useState<BattleEvent|null>(null),[heartReturning,setHeartReturning]=useState(false),[heartTop,setHeartTop]=useState('68%');
 const [,render]=useState(0),saved=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),reduced=useReducedMotion();
 const closeRef=useRef(onClose),saveRef=useRef(onSaved);closeRef.current=onClose;saveRef.current=onSaved;
 const input=useRef<SwordInput>({active:false,x:0,y:0,direction:'up',at:0});
 const respond=(result:DuelEvent|undefined)=>{
  if(!result)return;setEvent({type:result,at:performance.now()});render(n=>n+1);
  if(result==='hurt'||result==='lost')healthRef.current?.(duel.current.lives/3);
  if(result==='won'&&!saved.current){saved.current=true;saveRef.current();timers.current.push(setTimeout(()=>{if(present.current)setHeartReturning(true);},850));timers.current.push(setTimeout(()=>{if(present.current)closeRef.current();},1500));}
  if(result==='lost')timers.current.push(setTimeout(()=>{if(present.current)closeRef.current();},1200));
 };
 const respondRef=useRef(respond);respondRef.current=respond;
 const pointer=useRef<{id:number;x:number;y:number;gesture:SlashGesture}|null>(null);
 const slash=(direction:Direction)=>{input.current.direction=direction;input.current.at=performance.now();respondRef.current(duel.current.swipe(direction));render(n=>n+1);};
 const actions=useRef({slash});actions.current={slash};
 useLayoutEffect(()=>{const el=arena.current;if(!el)return;const update=()=>{const h=el.clientHeight,scale=Math.min(1,Math.max(.5,(h-100)/300));setHeartTop(`${h/2-36+112*scale}px`);};update();const observer=new ResizeObserver(update);observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const arrival=setTimeout(()=>setForming(true),650);return()=>clearTimeout(arrival);},[]);
 useEffect(()=>{if(!forming)return;const start=setTimeout(()=>{duel.current.start(startingHealth.current*3);setEvent({type:'start',at:performance.now()});render(n=>n+1);},1000);return()=>clearTimeout(start);},[forming]);
 useEffect(()=>{let frame=0,last=performance.now();const tick=(now:number)=>{const delta=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!document.hidden){respondRef.current(duel.current.advance(delta));if(duel.current.phase!=='ready'&&!duel.current.finished)render(n=>n+1);}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);const release=()=>{pointer.current=null;input.current.active=false;};window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);return()=>{cancelAnimationFrame(frame);timers.current.forEach(clearTimeout);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};},[]);
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(e.repeat)return;const direction=({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'} as const)[e.key as 'ArrowLeft'];if(direction){e.preventDefault();actions.current.slash(direction);}};window.addEventListener('keydown',down);return()=>window.removeEventListener('keydown',down);},[]);
 const d=duel.current;
 return <motion.section className={`duel touch-duel swipe-duel ${graphics?'has-3d':''} ${heartReturning?'heart-returning':''} ${d.phase} ${event?.type==='hurt'?'took-hit':''}`} role="region" aria-label={goal==='dislike'?'Бой за право поставить дизлайк':'Бой за сохранение трека'} initial={false} animate={{opacity:1}} exit={{opacity:0}}>
  <div ref={arena} className="duel-arena" tabIndex={0}
   onPointerDown={e=>{if(!e.isPrimary||pointer.current||d.phase==='ready'||d.finished)return;e.preventDefault();pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY,gesture:new SlashGesture(e.clientX,e.clientY)};input.current={...input.current,active:true,x:0,y:0};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerMove={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;e.preventDefault();input.current.x=Math.max(-1,Math.min(1,(e.clientX-p.x)/100));input.current.y=Math.max(-1,Math.min(1,(e.clientY-p.y)/100));const direction=p.gesture.move(e.clientX,e.clientY);if(direction)slash(direction);}}
   onPointerUp={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;const direction=p.gesture.move(e.clientX,e.clientY);if(direction)slash(direction);pointer.current=null;input.current.active=false;}}
   onPointerCancel={()=>{pointer.current=null;input.current.active=false;}}
   onLostPointerCapture={()=>{pointer.current=null;input.current.active=false;}}>

   <BattleStage duel={d} event={event} input={input} forming={forming} coverURL={track.cover?asset(track.cover):null} reduced={!!reduced} onReady={setGraphics}/>
   {!graphics&&<div className={`battle-fallback-cover damage-${d.bossLives<=3?2:d.bossLives<=6?1:0}`}>{track.cover&&<img src={asset(track.cover)} alt=""/>}</div>}
   <motion.div className="player-heart" layoutId="save-heart" style={{left:'50%',top:heartTop}} animate={{opacity:graphics&&forming&&!heartReturning?0:1}} transition={{layout:{duration:.6,ease:[.22,1,.36,1]},opacity:{duration:.18}}}><Icon name="heart-fill" size={32}/></motion.div>

  </div>
 </motion.section>;
}
