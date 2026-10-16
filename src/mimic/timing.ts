export const MIMIC_TIMING = { windup: 720, warning: 400, bite: 940, spit: 800, retreat: 600 } as const;
export type MimicPhase = 'idle'|'windup'|'warning'|'vanishing'|'appearing'|'parried'|'settled';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export function mimicPose(phase:MimicPhase,progress:number){
 const t=clamp(progress);
 if(phase==='windup')return {reveal:smooth(t),open:.15+smooth(t)*.7,fold:0,coverScale:1,coverZ:30,replacement:0,recoil:0};
 if(phase==='warning')return {reveal:1,open:.85+.12*smooth(t),fold:0,coverScale:1,coverZ:30,replacement:0,recoil:0};
 if(phase==='vanishing')return {reveal:1,open:(1-smooth((t-.12)/.32))*.97+.1*Math.sin(t*18)*Math.max(0,t-.6),fold:smooth(t/.65),coverScale:1-smooth((t-.2)/.5),coverZ:30-110*smooth(t/.65),replacement:0,recoil:Math.sin(t*23)*Math.max(0,1-t*2)*5};
 if(phase==='appearing')return {reveal:1-smooth((t-.25)/.75),open:.65*(1-smooth(t)),fold:0,coverScale:1,coverZ:30,replacement:smooth(t/.6),recoil:0};
 if(phase==='parried')return {reveal:1-smooth(t),open:.9*(1-smooth(t)),fold:0,coverScale:1,coverZ:30,replacement:0,recoil:Math.sin(t*18)*(1-t)*9};
 return {reveal:0,open:0,fold:0,coverScale:1,coverZ:30,replacement:0,recoil:0};
}
