import type {Duel,DuelEvent} from '../duel';
import type {SwordInput} from './gesture';
export type BattleEvent={type:DuelEvent|'start';at:number};
export function createBattleScene(host:HTMLElement,coverURL:string|null):Promise<{
 render(state:Duel,visual:{input?:SwordInput&{age:number};intro:number;event:DuelEvent|'start'|null;eventAge:number},reduced:boolean):void;
 dispose():void;
}>;
