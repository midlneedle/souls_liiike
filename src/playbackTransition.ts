// Port of PlayPauseIconView in midlneedle/Skeuo, ContentView.swift.
// Source: https://github.com/midlneedle/Skeuo/blob/b5b3d11494a1b3726f53ddae74b24c585a98e129/skeouu2/ContentView.swift
const frequency=2*Math.PI/.38;
export const PLAY_PAUSE_SPRING={type:'spring' as const,stiffness:frequency**2,damping:2*.82*frequency,mass:1};

export function playAmount(progress:number){
 const p=Math.max(0,Math.min(1,progress));
 return p<=.5?1-(p/.5)*.9:.1-((p-.5)/.5)*.1;
}
export function pauseAmount(progress:number){
 const p=Math.max(0,Math.min(1,progress));
 return p<=.5?(p/.5)*.1:.1+((p-.5)/.5)*.9;
}
