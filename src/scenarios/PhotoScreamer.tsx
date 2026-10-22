import {motion} from 'motion/react';
import type {MimicPhase} from '../mimic/timing';
import portrait from '../../textures/generated/mimic-screamer-v1.webp';
import horrorPortrait from '../../textures/generated/mimic-screamer-horror-v2.webp';

/** One intact portrait: a quick lunge, living hold, then a physical retreat. */
export default function PhotoScreamer({phase,reduced,lungeScale,rise,horror=false}:{phase:MimicPhase;reduced:boolean;lungeScale:number;rise:number;horror?:boolean}){
 const visible=phase==='warning',parried=phase==='parried';
 return <motion.div className="photo-mimic photo-screamer" aria-hidden="true"
  initial={{y:'110vh',scale:.9,rotate:0}}
  animate={{y:visible?-rise:'110vh',scale:reduced?1:visible?lungeScale:.9,rotate:!reduced&&parried?-12:0}}
  transition={reduced?{duration:0}:visible?{type:'spring',stiffness:310,damping:23,mass:.85}:{type:'spring',stiffness:160,damping:25}}>
  <motion.img src={horror?horrorPortrait:portrait} alt="" draggable={false}
   animate={{y:!reduced&&visible?[0,-5,0]:0,rotate:!reduced&&visible?[0,-1,1,0]:0}}
   transition={reduced?{duration:0}:{duration:1.2,repeat:Infinity,ease:'easeInOut'}}/>
 </motion.div>;
}
