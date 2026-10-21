import type {RhythmGameState,Note,Slash} from './game';
export function createRhythmScene(host:HTMLElement,notes:Note[]):{
 laneAt(x:number):number;
 render(state:RhythmGameState,cut:{at:number;direction:Slash;lane:number}|null,reduced:boolean):void;
 dispose():void;
};
