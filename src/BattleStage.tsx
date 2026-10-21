import {useEffect,useRef} from 'react';
import type {RefObject} from 'react';
import type {SwordInput} from './battle/gesture';
import type {Duel} from './duel';
import type {BattleEvent,createBattleScene} from './battle/scene';
export default function BattleStage({duel,event,input,forming,coverURL,reduced,onReady}:{duel:Duel;event:BattleEvent|null;input:RefObject<SwordInput>;forming:boolean;coverURL:string|null;reduced:boolean;onReady:(ready:boolean)=>void}){
 const host=useRef<HTMLDivElement>(null),props=useRef({duel,event,input,forming,reduced,onReady});props.current={duel,event,input,forming,reduced,onReady};
 useEffect(()=>{
  let cancelled=false,frame=0,last=0,started=0;let scene:Awaited<ReturnType<typeof createBattleScene>>|null=null;
  import('./battle/scene.js').then(module=>{if(!host.current||cancelled)return;return module.createBattleScene(host.current,coverURL);}).then(instance=>{
   if(!instance)return;if(cancelled){instance.dispose();return;}scene=instance;let ready=false;
   const tick=(now:number)=>{if(!document.hidden&&now-last>=1000/60-1){const p=props.current;if(p.forming&&!started)started=now;const sword=p.input.current;scene?.render(p.duel,{input:{...sword,age:(now-sword.at)/1000},intro:!p.forming?0:p.reduced?1:Math.min(1,(now-started)/750),event:p.event?.type??null,eventAge:p.event?Math.max(0,(now-p.event.at)/1000):10},p.reduced);if(!ready){ready=true;p.onReady(true);}last=now;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
  }).catch(()=>{if(!cancelled)props.current.onReady(false);});
  return()=>{cancelled=true;cancelAnimationFrame(frame);scene?.dispose();};
 },[coverURL]);
 return <div ref={host} className="battle-stage" aria-hidden="true"/>;
}
