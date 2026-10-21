import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import Atmosphere from './SceneAtmosphere';
import mimicBackground from '../../textures/generated/mimic-background-v1.webp';
import mimicCharacter from '../../textures/generated/mimic-character-v1.webp';
import invasionBackground from '../../textures/generated/invasion-background-v1.webp';
import invasionCharacter from '../../textures/generated/invasion-character-v1.webp';

export type SceneSettings={enabled:boolean;parallax:boolean;strength:number;motionSpeed:number;atmosphere:boolean;intensity:number;speed:number;suspended?:boolean;
 magic:{enabled:boolean;intensity:number;color:string;definition:number;particles:number;particleSpeed:number;particleSize:number;particleGlow:number};
 ash:{enabled:boolean;intensity:number;density:number;wind:number;glow:number;color:string}};
export const SceneEffectsContext=createContext<SceneSettings>({enabled:false,parallax:true,strength:7,motionSpeed:.8,atmosphere:true,intensity:1,speed:.8,
 magic:{enabled:true,intensity:1.1,color:'#4d9eff',definition:1.4,particles:16,particleSpeed:.8,particleSize:1,particleGlow:.7},ash:{enabled:true,intensity:5,density:107,wind:-.2,glow:1.7,color:'#bc7150'}});
const layers={mimic:{background:mimicBackground,character:mimicCharacter},invasion:{background:invasionBackground,character:invasionCharacter}};

/** Automatic motion belongs to the interior artwork; the surrounding frame stays fixed. */
export function useSceneMotion<T extends HTMLElement>(){
 const host=useRef<T>(null),options=useContext(SceneEffectsContext),latest=useRef(options),reduced=useReducedMotion();
 latest.current=options;
 useEffect(()=>{
  const element=host.current;if(!element)return;
  const reset=()=>{element.style.setProperty('--scene-x','0px');element.style.setProperty('--scene-y','0px');};
  reset();
  if(!options.enabled||!options.parallax||options.suspended||reduced)return;
  let frame=0,last=0,elapsed=0,x=0,y=0;
  const draw=(now:number)=>{
   const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt*latest.current.motionSpeed;
   // Independent slow curves: no pointer, touch or gyroscope is needed.
   const tx=(Math.sin(elapsed*.38)*.8+Math.sin(elapsed*.17)*.2)*latest.current.strength;
   const ty=Math.sin(elapsed*.29)*.55*latest.current.strength;
   const ease=1-Math.exp(-dt*3);x+=(tx-x)*ease;y+=(ty-y)*ease;
   element.style.setProperty('--scene-x',`${x.toFixed(3)}px`);element.style.setProperty('--scene-y',`${y.toFixed(3)}px`);
   frame=requestAnimationFrame(draw);
  };
  const visibility=()=>{cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(draw);};
  document.addEventListener('visibilitychange',visibility);if(!document.hidden)frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);reset();};
 },[options.enabled,options.parallax,options.suspended,reduced]);
 return host;
}

export default function SceneArtwork({scene,original,alt,className,characterHidden=false}:{scene:keyof typeof layers;original:string;alt:string;className:string;characterHidden?:boolean}){
 const options=useContext(SceneEffectsContext),[loaded,setLoaded]=useState(false);
 const {background,character}=layers[scene];
 useEffect(()=>{
  if(!options.enabled)return;
  let alive=true;
  const preload=(url:string)=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=url;});
  Promise.all([preload(background),preload(character)]).then(()=>{if(alive)setLoaded(true);}).catch(()=>{if(alive)setLoaded(false);});
  return()=>{alive=false;};
 },[options.enabled,background,character]);
 const active=options.enabled&&loaded;
 return <div className={`${className} scene-artwork`} data-layered={active} data-character-hidden={characterHidden} role="img" aria-label={alt}>
  <img className="scene-original" src={original} alt="" draggable={false}/>
  {active&&<div className="scene-split" aria-hidden="true">
   <img className="scene-background" src={background} alt="" draggable={false}/>
   {scene==='invasion'&&<img className="scene-character" src={character} alt="" draggable={false}/>}
   {options.atmosphere&&!options.suspended&&(scene==='mimic'?options.magic.enabled:options.ash.enabled)&&<Atmosphere theme={scene}
    intensity={options.intensity*(scene==='mimic'?options.magic.intensity:options.ash.intensity)} speed={options.speed}
    color={scene==='mimic'?options.magic.color:options.ash.color} definition={options.magic.definition}
    density={options.ash.density} wind={options.ash.wind} glow={options.ash.glow}
    particles={options.magic.particles} particleSpeed={options.magic.particleSpeed} particleSize={options.magic.particleSize} particleGlow={options.magic.particleGlow}/>}
   {scene==='mimic'&&<motion.div className="scene-character-motion" initial={false} animate={{y:characterHidden?'85%':'0%',opacity:characterHidden?0:1}} transition={{type:'spring',stiffness:200,damping:24}}><img className="scene-character" src={character} alt="" draggable={false}/></motion.div>}
  </div>}
 </div>;
}
