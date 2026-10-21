import type {RhythmGameState,Note,Slash} from './game';
export type RhythmPresentation={attack:number;recoil:number;damage:number;finish:number};
export function createRhythmScene(host:HTMLElement,notes:Note[],options?:{onPresentation?:(pose:RhythmPresentation)=>void}):{
 laneAt(x:number):number;
 render(state:RhythmGameState,cut:{at:number;direction:Slash;lane:number}|null,reduced:boolean):void;
 dispose():void;
};
