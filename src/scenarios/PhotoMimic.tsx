import {motion} from 'motion/react';
import type {MimicPhase} from '../mimic/timing';
import portrait from '../../textures/generated/mimic_evil_eat_play.webp';

/** Paper-cut mouth: trim the open mouth's centre, then hinge the cranium at the left cheek. */
export default function PhotoMimic({phase,reduced,takeover=false,lungeScale=1.32,rise=0}:{phase:MimicPhase;reduced:boolean;takeover?:boolean;lungeScale?:number;rise?:number}){
 const visible=phase==='windup'||phase==='warning'||phase==='vanishing';
 const biting=phase==='vanishing',warning=phase==='warning',parried=phase==='parried';
 const spring={type:'spring' as const,stiffness:180,damping:24,mass:1};
 // Anticipate slowly, snap shut, recoil, then reopen. The torso doesn't breathe with the jaw.
 const chomp={type:'keyframes' as const,duration:.62,repeat:Infinity,times:[0,.3,.52,.64,1],ease:[.22,1,.36,1] as [number,number,number,number]};
 const jawTransition=reduced?{duration:.1}:warning?chomp:biting?{type:'keyframes' as const,duration:.9,times:[0,.2,.38,.62,.78,1],ease:[.22,1,.36,1] as [number,number,number,number]}:spring;
 return <motion.div className="photo-mimic" aria-hidden="true" initial={{y:'110vh',scale:takeover?lungeScale:1,rotate:0}}
  animate={{y:visible?-rise:'110vh',scale:reduced?1:takeover?lungeScale:1,rotate:reduced?0:parried?16:0}}
  transition={reduced?{duration:0}:spring}>
  <motion.div className="photo-mimic-motion" animate={{y:!reduced&&warning?[0,-2,4,1,0]:0,rotate:!reduced&&warning?[0,-.5,1,.2,0]:0}} transition={reduced?{duration:.1}:warning?chomp:spring}>
  <motion.img className="photo-mimic-lower" src={portrait} alt="" draggable={false}
   animate={{y:reduced?'-9%':biting?['-9%','-10%','-8%','-9%','-8%','-9%']:warning?['-9%','-9.5%','-8.5%','-8%','-9%']:'-9%',rotate:0}} transition={jawTransition}/>
  <motion.img className="photo-mimic-upper" src={portrait} alt="" draggable={false}
   animate={{y:reduced?'0%':biting?['-15%','-20%','-1%','-12%','0%','0%']:warning?['-15%','-17%','-1%','-3%','-15%']:'-15%',rotate:reduced?0:biting?[-7,-12,1,-5,0,0]:warning?[-7,-10,1,-2,-7]:-7}} transition={jawTransition}/>
  </motion.div>
 </motion.div>;
}
