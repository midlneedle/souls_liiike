import {useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import PhotoMimic from './PhotoMimic';
import mimicLettering from '../../textures/lettering_mimic.webp';
import {haptic,stopHaptics} from '../haptics';
import mimicTaunt from '../../textures/generated/mimic_evil.webp';
import mimicBite from '../../textures/generated/mimic_evil_eat_play.webp';
import {PlaybackGlyph} from '../ui';
import {MIMIC_TIMING} from '../mimic/timing';
import type {MimicPhase} from '../mimic/timing';
// Three warning chomps leave time to react before the final bite.
const PHOTO_PARRY_WINDOW=1900;
import {frame,illustration} from './assets';
import {focusHeading} from './focus';
import OrnateClose from './OrnateClose';
import SceneArtwork,{useSceneMotion} from './SceneEffects';
export default function MimicHome({playing,onPlayingChange,onClose}:{playing:boolean;onPlayingChange:(value:boolean)=>void;onClose:()=>void}){
 const reduced=useReducedMotion(),[phase,setPhase]=useState<MimicPhase>('idle'),[failed,setFailed]=useState(false),[size,setSize]=useState(112);
 const button=useRef<HTMLButtonElement>(null),seen=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),change=useRef(onPlayingChange);change.current=onPlayingChange;
 const running=!['idle','settled'].includes(phase),taunting=failed||phase==='appearing';
 const scene=useSceneMotion<HTMLDivElement>();
 const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
 useEffect(()=>{
  const pulses:ReturnType<typeof setTimeout>[]=[];
  if(phase==='warning')for(let bite=0;bite<3;bite++)pulses.push(setTimeout(()=>haptic('chomp'),322+bite*620));
  if(phase==='vanishing')pulses.push(setTimeout(()=>haptic('bite'),702));
  if(phase==='parried')haptic('parry');
  if(phase==='appearing')haptic('lose');
  return()=>{pulses.forEach(clearTimeout);};
 },[phase]);
 useEffect(()=>()=>stopHaptics(),[]);
 useEffect(()=>{for(const url of [mimicBite,mimicTaunt]){const image=new Image();image.src=url;image.decode().catch(()=>{});}},[]);
 useEffect(()=>{
  const element=button.current;if(!element)return;
  const observer=new ResizeObserver(()=>setSize(element.offsetWidth));observer.observe(element);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const visibility=()=>{if(document.hidden){clear();setPhase('idle');setFailed(false);}};
  document.addEventListener('visibilitychange',visibility);return()=>{clear();document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const later=(at:number,callback:()=>void)=>{timers.current.push(setTimeout(callback,at));};
 const play=()=>{
  if(running){if(phase==='warning'){clear();seen.current=true;setPhase('parried');change.current(true);later(MIMIC_TIMING.retreat,()=>setPhase('settled'));}return;}
  if(seen.current){haptic('tap');change.current(!playing);return;}
  seen.current=true;haptic('reveal');setPhase('warning');
  const warning=PHOTO_PARRY_WINDOW,bite=warning+MIMIC_TIMING.bite,end=bite+MIMIC_TIMING.spit;
  later(warning,()=>setPhase('vanishing'));later(bite,()=>setPhase('appearing'));
  later(end,()=>{setPhase('settled');setFailed(true);change.current(true);});
 };
 return <motion.section className="mimic-home scenario-screen" aria-label="Мимик — музыкальный поток для рилакса" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
  <div className="mimic-content">
   <div className="mimic-hero" ref={scene} style={{'--mimic-play-size':`${size}px`} as CSSProperties}>
    <SceneArtwork scene="mimic" className="mimic-illustration" original={illustration} alt="Девушка в доспехах и полупрозрачной фате" characterHidden={running||failed}/>
    <motion.img className="mimic-taunt" src={mimicTaunt} alt={taunting?"Мимик съел Play и насмехается":""} aria-hidden={!taunting} draggable={false} initial={false} animate={{opacity:taunting?1:0,y:reduced?0:taunting?0:100,scale:taunting?1:.92}} transition={reduced?{duration:.15}:{type:"spring",stiffness:240,damping:22}}/>
    <div className="mimic-frame-layer">
    <img className="mimic-frame" src={frame} alt="" draggable={false}/>
    <OrnateClose className="mimic-frame-close" onClick={()=>{clear();setPhase('idle');setFailed(false);change.current(false);onClose();}}/>
    </div>
    <h1 ref={focusHeading} tabIndex={-1} className="mimic-lettering"><img src={mimicLettering} alt="МУЗЫКАЛЬНЫЙ ПОТОК ДЛЯ РИЛАКСА" width={1584} height={436} draggable={false}/></h1>
    <div className={`mimic-play-anchor photo-mimic-anchor phase-${phase}`}>
     <PhotoMimic phase={phase} reduced={!!reduced}/>
     <motion.button ref={button} className="scenario-play" data-haptic="off" aria-label={phase==='warning'?'Парировать мимика':playing?'Пауза':'Включить музыкальный поток'} disabled={failed||(running&&phase!=='warning')} onClick={play} animate={{scale:phase==='vanishing'||phase==='appearing'||failed?0:1,opacity:phase==='vanishing'||phase==='appearing'||failed?0:1,rotate:phase==='vanishing'?-14:0}} transition={{duration:phase==='vanishing'?.32:.24,delay:phase==='vanishing'?.58:0,ease:[.22,1,.36,1]}}>
      <PlaybackGlyph playing={playing} size={58}/>
     </motion.button>
    </div>
   </div>
  </div>
 </motion.section>;
}
