import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import {AnimatePresence,motion,useMotionValue,useReducedMotion,useTransform} from 'motion/react';
import type {MotionValue} from 'motion/react';
import {VideoDuel as Fight,VIDEO_DUEL} from './battle/videoDuel';
import type {VideoCue,VideoOutcome,VideoResponse} from './battle/videoDuel';
import {movie,ready,defeated} from './battle/videoAssets';
import NativeSpeech from './NativeSpeech';
import OrnateClose from './scenarios/OrnateClose';
import SceneAtmosphere from './scenarios/SceneAtmosphere';
import {haptic,stopHaptics} from './haptics';
import './videoDuel.css';

type Props={onSaved:()=>void;onLost?:()=>void;onClose:()=>void};
type View=VideoOutcome|'loading'|'error';
export default function VideoDuel({onSaved,onLost,onClose}:Props){
 const video=useRef<HTMLVideoElement>(null),arena=useRef<HTMLDivElement>(null),fight=useRef(new Fight());
 const [view,setView]=useState<View>('loading'),[cue,setCue]=useState<VideoCue>('slash'),[windowOpen,setWindowOpen]=useState(false);
 const [suspended,setSuspended]=useState(false),[buffering,setBuffering]=useState(false),[feedback,setFeedback]=useState<{id:number;type:string}|null>(null);
 const [trail,setTrail]=useState<{id:number;x:number;y:number;angle:number;length:number}|null>(null);
 const progress=useMotionValue(0),reduced=useReducedMotion(),loaded=useRef(false),alive=useRef(true),finished=useRef(false),serial=useRef(0);
 const pointer=useRef<{id:number;x:number;y:number;at:number;used:boolean}|null>(null),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null);
 const impacts=useRef(new Set<string>());
 const callbacks=useRef({onSaved,onLost});callbacks.current={onSaved,onLost};
 const stopWatchdog=()=>{if(watchdog.current)clearTimeout(watchdog.current);watchdog.current=null;};
 const mediaError=()=>{if(!alive.current||finished.current)return;video.current?.pause();pointer.current=null;setBuffering(false);setView('error');stopWatchdog();};
 const armWatchdog=()=>{stopWatchdog();watchdog.current=setTimeout(mediaError,20000);};
 const conclude=()=>{
  const result=fight.current.outcome;if(finished.current||result!=='won'&&result!=='lost')return;
  finished.current=true;video.current?.pause();pointer.current=null;stopWatchdog();setCue(null);setBuffering(false);setView(result);
  haptic(result==='won'?'win':'lose');
  if(result==='won')callbacks.current.onSaved();else callbacks.current.onLost?.();
 };
 const refresh=()=>{
  const time=video.current?.currentTime??0;fight.current.advance(time);conclude();
  if(fight.current.outcome==='fighting'){
   for(const [name,at,step] of [['slash',.5,1],['parry',5.5,2],['counter',8.65,3]] as const){
    if(time>=at&&fight.current.step>=step&&!impacts.current.has(name)){impacts.current.add(name);haptic(name==='parry'?'parry':'counter');}
   }
  }
  const next=fight.current.cue(time);setCue(previous=>previous===next?previous:next);
  progress.set(next==='parry'?(time-VIDEO_DUEL.parryReveal)/(VIDEO_DUEL.parryIdeal-VIDEO_DUEL.parryReveal):next==='counter'?(time-VIDEO_DUEL.counterReveal)/(VIDEO_DUEL.counterIdeal-VIDEO_DUEL.counterReveal):0);
  const open=next==='parry'&&time>=VIDEO_DUEL.parryEarly||next==='counter'&&time>=VIDEO_DUEL.counterEarly;
  setWindowOpen(previous=>previous===open?previous:open);
 };
 const resume=()=>{
  if(!video.current||finished.current)return;
  setSuspended(false);setBuffering(true);armWatchdog();
  void video.current.play().then(()=>{if(!alive.current)return;setBuffering(false);stopWatchdog();}).catch(()=>{if(!alive.current)return;stopWatchdog();setBuffering(false);setSuspended(true);});
 };
 const respond=(response:VideoResponse)=>{
  if(!response){conclude();return;}
  if(response==='wrong'){conclude();return;}
  setFeedback({id:++serial.current,type:response});
  haptic(response==='early'?'blocked':response==='parry'?'parry':response==='counter'?'counter':'swing');
  if(response==='slash'){setView('fighting');resume();}
  refresh();
 };
 const actions=useRef({refresh,respond,mediaError});actions.current={refresh,respond,mediaError};
 useEffect(()=>{
  alive.current=true;arena.current?.focus({preventScroll:true});if(!loaded.current)armWatchdog();
  const player=video.current;let frame=0;
  const tick=()=>{if(!document.hidden)actions.current.refresh();frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
  const pause=()=>{pointer.current=null;if(fight.current.outcome==='fighting'&&!finished.current){player?.pause();setSuspended(true);setBuffering(false);stopWatchdog();stopHaptics();}};
  const visibility=()=>{if(document.hidden)pause();};
  const key=(event:KeyboardEvent)=>{
   if(event.repeat||!loaded.current||player?.paused&&fight.current.outcome==='fighting')return;
   const time=player?.currentTime??0;
   if(event.code==='Space'){event.preventDefault();actions.current.respond(fight.current.tap(time));}
   if(event.key==='ArrowDown'||event.key==='ArrowLeft'){event.preventDefault();actions.current.respond(fight.current.swipe(time,-50,50));}
   if(event.key==='ArrowUp'){event.preventDefault();actions.current.respond(fight.current.swipe(time,0,-60));}
  };
  document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',pause);window.addEventListener('keydown',key);
  return()=>{alive.current=false;cancelAnimationFrame(frame);stopWatchdog();player?.pause();pointer.current=null;stopHaptics();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',pause);window.removeEventListener('keydown',key);};
 },[]);
 const mediaReady=()=>{loaded.current=true;setView(previous=>previous==='loading'?'ready':previous);setBuffering(false);stopWatchdog();};
 const retry=()=>{
  const player=video.current;if(!player)return;player.pause();fight.current=new Fight();finished.current=false;pointer.current=null;impacts.current.clear();
  setFeedback(null);setTrail(null);setSuspended(false);setBuffering(false);setCue('slash');progress.set(0);setWindowOpen(false);
  player.currentTime=0;
  if(view==='error'){loaded.current=false;setView('loading');player.load();armWatchdog();}else setView(loaded.current?'ready':'loading');
  arena.current?.focus({preventScroll:true});
 };
 const down=(event:PointerEvent<HTMLDivElement>)=>{
  if(!event.isPrimary||pointer.current||!loaded.current||suspended||buffering||finished.current||view==='error')return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
  const time=video.current?.currentTime??0,parrying=fight.current.cue(time)==='parry';
  pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now(),used:parrying};
  if(parrying)respond(fight.current.tap(time));
 };
 const move=(event:PointerEvent<HTMLDivElement>)=>{
  const start=pointer.current;if(!start||start.id!==event.pointerId||start.used)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.hypot(dx,dy)<32)return;
  start.used=true;if(performance.now()-start.at>850)return;
  const result=fight.current.swipe(video.current?.currentTime??0,dx,dy);
  if(result&&result!=='wrong'){
   const bounds=event.currentTarget.getBoundingClientRect();
   setTrail({id:++serial.current,x:start.x-bounds.left,y:start.y-bounds.top,angle:Math.atan2(dy,dx)*180/Math.PI,length:Math.max(80,Math.hypot(dx,dy))});
  }
  respond(result);
 };
 const result=view==='won'||view==='lost'||view==='error';
 return <motion.section className={`video-duel ${view}`} role="region" aria-label="Бой за право поставить дизлайк" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
  <div ref={arena} className="video-duel-arena" tabIndex={0} data-haptic="off" onPointerDown={down} onPointerMove={move} onPointerUp={event=>{move(event);if(pointer.current?.id===event.pointerId)pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onLostPointerCapture={()=>{pointer.current=null;}}>
   <motion.div className="video-duel-camera" animate={reduced?{}:view==='lost'?{x:[0,-10,7,-3,0],y:[0,5,-3,0],rotate:[0,-1,.5,0]}:feedback?.type==='parry'?{x:[0,-3,2,0],y:[0,4,-2,0]}:{x:0,y:0,rotate:0}} transition={{duration:.3}}>
    <video ref={video} src={movie} poster={ready} preload="auto" playsInline disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback" onLoadedData={mediaReady} onCanPlay={mediaReady} onError={mediaError} onWaiting={()=>{if(fight.current.outcome==='fighting'&&!finished.current){setBuffering(true);armWatchdog();}}} onPlaying={()=>{setBuffering(false);stopWatchdog();}} onEnded={()=>{fight.current.advance(video.current?.duration??10);conclude();}}/>
   </motion.div>
   <motion.img className="video-duel-victory" src={defeated} alt={view==='won'?'Поверженный страж на одном колене':''} initial={false} animate={{opacity:view==='won'?1:0,scale:reduced?1:view==='won'?1:1.035}} transition={{duration:.8,ease:[.22,1,.36,1]}}/>
   {view==='won'&&<SceneAtmosphere theme="invasion" intensity={.6} speed={.5} color="#bc8b61" definition={1.4} density={28} wind={-.12} glow={.8} particles={0} particleSpeed={0} particleSize={1} particleGlow={0}/>}
   <div className="video-duel-vignette"/>
   <AnimatePresence>{feedback&&<motion.div key={feedback.id} className={`video-duel-flash ${feedback.type}`} aria-hidden="true" initial={{opacity:feedback.type==='parry'?.55:.25}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:.4}}/>}</AnimatePresence>
   <AnimatePresence>{trail&&<motion.i key={trail.id} className="video-duel-slash" aria-hidden="true" style={{left:trail.x,top:trail.y,width:trail.length,rotate:trail.angle}} initial={{opacity:1,scaleX:.4}} animate={{opacity:0,scaleX:1.6}} transition={{duration:.32,ease:[.22,1,.36,1]}}/>}</AnimatePresence>
   <AnimatePresence>{!result&&!suspended&&!buffering&&loaded.current&&cue&&<QtePrompt key={cue} cue={cue} progress={progress} open={windowOpen} reduced={!!reduced}/>}</AnimatePresence>
   {feedback&&(feedback.type==='slash'||feedback.type==='parry'||feedback.type==='counter')&&<QteAccepted key={feedback.id} cue={feedback.type} reduced={!!reduced}/>}
   {suspended&&!result&&<div className="video-duel-pause" onPointerDown={event=>event.stopPropagation()}><button className="scenario-menu-button" onClick={resume}><span>Продолжить бой</span></button></div>}
   <div className="sr-only" aria-live="polite">{cue==='slash'?'Проведи влево вниз для атаки. С клавиатуры — стрелка вниз.':cue==='parry'?'Нажми в момент совпадения колец для парирования. С клавиатуры — пробел.':cue==='counter'?'Проведи вверх для контрудара. С клавиатуры — стрелка вверх.':''}</div>
  </div>
  <AnimatePresence>{result&&<motion.div className="video-duel-result" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{delay:view==='won'?.45:.25,duration:.4}}>
   <h1 className="scenario-description"><NativeSpeech className="scenario-result-description" text={view==='won'?'Дизлайк заслужен.':view==='lost'?'Трек ещё не закончил с тобой.':'Бой не загрузился. Попробуем ещё раз?'}/></h1>
   <div className="scenario-actions"><button className="scenario-action scenario-action-primary" onClick={view==='won'?onClose:retry}>{view==='won'?'Забрать дизлайк':'Ещё раз'}</button><button className="scenario-action" onClick={onClose}>{view==='won'?'Вернуться':'Пусть играет'}</button></div>
  </motion.div>}</AnimatePresence>
  <OrnateClose className="video-duel-close" label="Вернуться из боя" onClick={onClose}/>
 </motion.section>;
}

function QtePrompt({cue,progress,open,reduced}:{cue:Exclude<VideoCue,null>;progress:MotionValue<number>;open:boolean;reduced:boolean}){
 const scale=useTransform(progress,value=>Math.max(.87,1.75-value*.75));
 return <motion.div className={`qte-prompt qte-${cue} ${open?'window-open':''}`} aria-hidden="true" initial={reduced?false:{opacity:0,scale:.86}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:1.12}} transition={{duration:.18}}>
  <QteFace cue={cue}/>
  {cue==='parry'&&<motion.div className="qte-timing" style={{scale}}/>}
 </motion.div>;
}

function QteFace({cue,accepted=false}:{cue:Exclude<VideoCue,null>;accepted?:boolean}){
 return cue==='parry'?<><div className="qte-disc"/><div className="qte-shield"/></>:<div className="qte-swipe"><div className="qte-track-frame"/><span className="qte-swipe-origin"/><i/><b/>{!accepted&&<em/>}{accepted&&<span className="qte-track-confirm"/>}</div>;
}

function QteAccepted({cue,reduced}:{cue:Exclude<VideoCue,null>;reduced:boolean}){
 return <motion.div className={`qte-prompt qte-${cue} qte-accepted`} aria-hidden="true"
  initial={{opacity:1,scale:1}} animate={reduced?{opacity:[1,1,0]}:{opacity:[1,1,1,0],scale:[1,.95,1.07,1.03]}}
  transition={{duration:reduced?.3:.68,times:reduced?[0,.4,1]:[0,.12,.45,1],ease:[.22,1,.36,1]}}>
  <QteFace cue={cue} accepted/>
  {cue==='parry'&&!reduced&&<motion.div className="qte-success-ring" initial={{scale:1,opacity:.9}} animate={{scale:1.6,opacity:0}} transition={{duration:.55,ease:[.22,1,.36,1]}}/>}
  {!reduced&&<svg className="qte-success-sparks" viewBox="0 0 200 200">{Array.from({length:8},(_,i)=>{
   const a=i*Math.PI/4,r=cue==='parry'?64:38,cx=100,cy=100;
   return <motion.line key={i} x1={cx+Math.cos(a)*r} y1={cy+Math.sin(a)*r} x2={cx+Math.cos(a)*(r+9)} y2={cy+Math.sin(a)*(r+9)} initial={{opacity:1}} animate={{opacity:0,x:Math.cos(a)*20,y:Math.sin(a)*20}} transition={{duration:.42,delay:.04}}/>;
  })}</svg>}
 </motion.div>;
}
