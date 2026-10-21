import {useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import MimicStage from '../MimicStage';
import {PlaybackGlyph} from '../ui';
import {MIMIC_TIMING} from '../mimic/timing';
import type {MimicPhase} from '../mimic/timing';
import {frame,illustration,rim,buttonLayers} from './assets';
import {focusHeading} from './focus';
import OrnateClose from './OrnateClose';
import SceneArtwork,{useSceneMotion} from './SceneEffects';
export default function MimicHome({playing,onPlayingChange,onClose}:{playing:boolean;onPlayingChange:(value:boolean)=>void;onClose:()=>void}){
 const reduced=useReducedMotion(),[phase,setPhase]=useState<MimicPhase>('idle'),[ready,setReady]=useState(false),[spatial,setSpatial]=useState(false),[size,setSize]=useState(112);
 const button=useRef<HTMLButtonElement>(null),seen=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),change=useRef(onPlayingChange);change.current=onPlayingChange;
 const running=!['idle','settled'].includes(phase);
 const scene=useSceneMotion<HTMLDivElement>();
 const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
 useEffect(()=>{
  const element=button.current;if(!element)return;
  const observer=new ResizeObserver(()=>setSize(element.offsetWidth));observer.observe(element);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const visibility=()=>{if(document.hidden){clear();setPhase('idle');setSpatial(false);}};
  document.addEventListener('visibilitychange',visibility);return()=>{clear();document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const later=(at:number,callback:()=>void)=>{timers.current.push(setTimeout(callback,at));};
 const play=()=>{
  if(running){if(phase==='warning'){clear();seen.current=true;setPhase('parried');change.current(true);later(MIMIC_TIMING.retreat,()=>setPhase('settled'));}return;}
  if(seen.current){change.current(!playing);return;}
  seen.current=true;setSpatial(ready&&!reduced);setPhase('windup');
  const windup=reduced?100:MIMIC_TIMING.windup,warning=windup+MIMIC_TIMING.warning,bite=warning+MIMIC_TIMING.bite,end=bite+MIMIC_TIMING.spit;
  later(windup,()=>setPhase('warning'));later(warning,()=>setPhase('vanishing'));later(bite,()=>setPhase('appearing'));
  later(end,()=>{setPhase('settled');change.current(true);});
 };
 return <motion.section className="mimic-home scenario-screen" aria-label="Мимик — музыкальный поток для рилакса" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
  <div className="mimic-content">
   <div className="mimic-hero" ref={scene} style={{'--mimic-play-size':`${size}px`} as CSSProperties}>
    <SceneArtwork scene="mimic" className="mimic-illustration" original={illustration} alt="Девушка в доспехах и полупрозрачной фате"/>
    <div className="mimic-frame-layer">
    <img className="mimic-frame" src={frame} alt="" draggable={false}/>
    <OrnateClose className="mimic-frame-close" onClick={()=>{clear();setPhase('idle');setSpatial(false);change.current(false);onClose();}}/>
    </div>
    <h1 ref={focusHeading} tabIndex={-1} className="mimic-lettering"><span>МУЗЫКАЛЬНЫЙ ПОТОК</span><strong>ДЛЯ РИЛАКСА</strong></h1>
    <div className={`mimic-play-anchor ${spatial&&running?'biting':''} phase-${phase}`}>
     <MimicStage sourceURL={rim} replacementURL={rim} buttonLayers={buttonLayers} round phase={spatial?phase:'idle'} active={spatial&&running} size={size} reduced={!!reduced} onReady={setReady}/>
     <motion.button ref={button} className="scenario-play" aria-label={phase==='warning'?'Парировать мимика':playing?'Пауза':'Включить музыкальный поток'} disabled={running&&phase!=='warning'} onClick={play} animate={spatial||reduced?{scale:1,rotate:0}:phase==='vanishing'?{scale:.7,rotate:-8}:phase==='warning'?{scale:1.04,rotate:-3}:{scale:1,rotate:0}} transition={{duration:.24,ease:[.22,1,.36,1]}}>
      <PlaybackGlyph playing={playing} size={58}/>
     </motion.button>
    </div>
   </div>
  </div>
 </motion.section>;
}
