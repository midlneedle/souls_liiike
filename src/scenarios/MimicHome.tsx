import {useContext,useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import PhotoMimic from './PhotoMimic';
import PhotoScreamer from './PhotoScreamer';
import mimicScreamer from '../../textures/generated/mimic-screamer-v1.webp';
import horrorScreamer from '../../textures/generated/mimic-screamer-horror-v2.webp';
import NativeSpeech from '../NativeSpeech';
import {MimicExperimentContext} from './mimicExperiment';
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
import SceneArtwork,{SceneEffectsContext,useSceneMotion} from './SceneEffects';
export default function MimicHome({playing,onPlayingChange,onClose}:{playing:boolean;onPlayingChange:(value:boolean)=>void;onClose:()=>void}){
 const reduced=useReducedMotion(),[phase,setPhase]=useState<MimicPhase>('idle'),[failed,setFailed]=useState(false),[size,setSize]=useState(112);
 const experiment=useContext(MimicExperimentContext),effects=useContext(SceneEffectsContext),horror=experiment.variant==='horror',screamer=experiment.variant==='screamer'||horror,takeover=experiment.variant!=='bite';
 const captured=takeover&&(failed||phase==='appearing');
 const button=useRef<HTMLButtonElement>(null),seen=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),change=useRef(onPlayingChange);change.current=onPlayingChange;
 const running=!['idle','settled'].includes(phase),taunting=failed||phase==='appearing';
 const scene=useSceneMotion<HTMLDivElement>();
 const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
 useEffect(()=>{
  clear();seen.current=false;setPhase('idle');setFailed(false);change.current(false);
  return clear;
 },[experiment.variant,experiment.replay]);
 useEffect(()=>{
  const pulses:ReturnType<typeof setTimeout>[]=[];
  if(phase==='warning'&&!screamer){
   const duration=takeover?Math.max(600,experiment.holdSeconds*1000-MIMIC_TIMING.bite):PHOTO_PARRY_WINDOW;
   for(let at=322;at<duration;at+=620)pulses.push(setTimeout(()=>haptic('chomp'),at));
  }
  if(phase==='vanishing')pulses.push(setTimeout(()=>haptic('bite'),702));
  if(phase==='parried')haptic('parry');
  if(phase==='appearing')haptic('lose');
  return()=>{pulses.forEach(clearTimeout);};
 },[phase,takeover,screamer,experiment.holdSeconds]);
 useEffect(()=>()=>stopHaptics(),[]);
 useEffect(()=>{for(const url of [horror?horrorScreamer:screamer?mimicScreamer:mimicBite,mimicTaunt]){const image=new Image();image.src=url;image.decode().catch(()=>{});}},[screamer,horror]);
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
  if(screamer){
   later(experiment.holdSeconds*1000,()=>setPhase('appearing'));
   later(experiment.holdSeconds*1000+MIMIC_TIMING.spit,()=>{setPhase('settled');setFailed(true);change.current(true);});
   return;
  }
  // Both variants share the warning chomps and the complete final bite.
  const warning=takeover?Math.max(600,experiment.holdSeconds*1000-MIMIC_TIMING.bite):PHOTO_PARRY_WINDOW;
  const bite=warning+MIMIC_TIMING.bite,end=bite+MIMIC_TIMING.spit;
  later(warning,()=>setPhase('vanishing'));later(bite,()=>setPhase('appearing'));
  later(end,()=>{setPhase('settled');setFailed(true);change.current(true);});
 };
 return <motion.section className={`mimic-home scenario-screen ${captured?'is-captured':''} ${takeover?'mimic-takeover':''}`} aria-label={`Мимик — музыкальный поток ${captured?experiment.title:experiment.initialTitle}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
  <div className="mimic-content">
   <div className="mimic-hero" ref={scene} style={{'--mimic-play-size':`${size}px`,'--mimic-poison':experiment.color} as CSSProperties}>
    <SceneEffectsContext.Provider value={captured?{...effects,magic:{...effects.magic,color:experiment.color}}:effects}>
    <SceneArtwork scene="mimic" className="mimic-illustration" original={illustration} alt="Девушка в доспехах и полупрозрачной фате" characterHidden={running||failed}/>
    </SceneEffectsContext.Provider>
    <motion.div className="mimic-poison" aria-hidden="true" initial={false} animate={{opacity:captured?1:0}} transition={{duration:reduced?.15:.9,ease:[.22,1,.36,1]}}/>
    <motion.img className="mimic-taunt" src={mimicTaunt} alt={taunting?takeover?'Фил захватил музыкальный поток':'Мимик съел Play и насмехается':''} aria-hidden={!taunting} draggable={false} initial={false} animate={{opacity:taunting?1:0,y:reduced?0:taunting?0:100,scale:taunting?1:.92}} transition={reduced?{duration:.15}:{type:"spring",stiffness:180,damping:26,opacity:{duration:.5}}}/>
    <div className="mimic-frame-layer">
    <img className="mimic-frame" src={frame} alt="" draggable={false}/>
    <OrnateClose className="mimic-frame-close" onClick={()=>{clear();setPhase('idle');setFailed(false);change.current(false);onClose();}}/>
    </div>
    <h1 ref={focusHeading} tabIndex={-1} className="mimic-lettering mimic-live-lettering">
     <span className="mimic-lettering-caption">Музыкальный поток</span>
     <NativeSpeech className="mimic-lettering-title" text={captured?experiment.title:experiment.initialTitle}/>
    </h1>
    <div className={`mimic-play-anchor photo-mimic-anchor phase-${phase}`}>
     {screamer?<PhotoScreamer phase={phase} reduced={!!reduced} lungeScale={experiment.lungeScale} rise={experiment.rise} horror={horror}/>:<PhotoMimic phase={phase} reduced={!!reduced} takeover={takeover} lungeScale={experiment.lungeScale} rise={experiment.rise}/>}
     <motion.button ref={button} className="scenario-play" data-haptic="off" aria-label={phase==='warning'?'Парировать мимика':playing?'Пауза':captured?'Включить королевский поток':'Включить музыкальный поток'} disabled={(!takeover&&failed)||(running&&phase!=='warning')} onClick={play} animate={{scale:!takeover&&(phase==='vanishing'||phase==='appearing'||failed)?0:1,opacity:!takeover&&(phase==='vanishing'||phase==='appearing'||failed)?0:1,rotate:!takeover&&phase==='vanishing'?-14:0}} transition={{duration:phase==='vanishing'?.32:.24,delay:phase==='vanishing'?.58:0,ease:[.22,1,.36,1]}}>
      <PlaybackGlyph playing={playing} size={58}/>
     </motion.button>
    </div>
   </div>
  </div>
 </motion.section>;
}
