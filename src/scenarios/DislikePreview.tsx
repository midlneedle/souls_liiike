import {useEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {Duel} from '../duel';
import BattleStage from '../BattleStage';
import {asset} from '../data';
import type {Track} from '../data';
import type {SwordInput} from '../battle/gesture';
export default function DislikePreview({track}:{track:Track}){
 const duel=useRef(new Duel()),input=useRef<SwordInput>({active:false,x:0,y:0,direction:'up',at:0}),reduced=useReducedMotion();
 const [ready,setReady]=useState(false);
 useEffect(()=>{let frame=0,last=performance.now();const tick=(now:number)=>{if(!document.hidden)duel.current.time+=Math.min(.05,(now-last)/1000);last=now;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[]);
 return <div className="dislike-character" aria-hidden="true">
  <BattleStage duel={duel.current} event={null} input={input} forming coverURL={track.cover?asset(track.cover):null} reduced={!!reduced} onReady={setReady}/>
  {!ready&&track.cover&&<img className="dislike-loading-cover" src={asset(track.cover)} alt=""/>}
 </div>;
}
