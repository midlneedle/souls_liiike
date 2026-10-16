import {useEffect,useRef} from 'react';
import {MIMIC_TIMING,mimicPose} from './mimic/timing';
import type {MimicPhase} from './mimic/timing';
import type {createMimicScene} from './mimic/scene';
export default function MimicStage({sourceURL,replacementURL,round,phase,active,size,reduced,onReady}:{sourceURL:string;replacementURL:string;round:boolean;phase:MimicPhase;active:boolean;size:number;reduced:boolean;onReady:(ready:boolean)=>void}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<Awaited<ReturnType<typeof createMimicScene>>|null>(null);
 const props=useRef({phase,active,size,reduced,onReady});props.current={phase,active,size,reduced,onReady};
 const clock=useRef({phase,started:0,size});
 useEffect(()=>{
  let cancelled=false,frame=0,lastFrame=0;
  props.current.onReady(false);
  import('./mimic/scene.js').then(module=>{if(cancelled||!host.current)return;return module.createMimicScene(host.current,sourceURL,replacementURL,round);}).then(instance=>{
   if(!instance)return;if(cancelled){instance.dispose();return;}scene.current=instance;props.current.onReady(true);
   const tick=(now:number)=>{
    const p=props.current;
    if(clock.current.phase!==p.phase){clock.current={phase:p.phase,started:now,size:p.phase==='windup'?p.size:clock.current.size};}
    if(p.active&&now-lastFrame>=1000/24&&!document.hidden){
     const duration=p.phase==='windup'?MIMIC_TIMING.windup:p.phase==='warning'?MIMIC_TIMING.warning:p.phase==='vanishing'?MIMIC_TIMING.bite:p.phase==='appearing'?MIMIC_TIMING.spit:MIMIC_TIMING.retreat;
     const progress=Math.min(1,Math.max(0,(now-clock.current.started)/duration));
     const pose=mimicPose(p.phase,p.reduced?1:progress);
     if(p.reduced)pose.recoil=0;
     instance.render(pose,p.phase,p.reduced?1:progress,clock.current.size,p.reduced);lastFrame=now;
    }
    frame=requestAnimationFrame(tick);
   };frame=requestAnimationFrame(tick);
  }).catch(()=>{if(!cancelled)props.current.onReady(false);});
  return()=>{cancelled=true;cancelAnimationFrame(frame);scene.current?.dispose();scene.current=null;};
 },[sourceURL,replacementURL,round]);
 return <div ref={host} className={`mimic-canvas ${active?'visible':''}`} aria-hidden="true"/>;
}
