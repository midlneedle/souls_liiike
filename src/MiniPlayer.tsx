import {useEffect,useRef} from 'react';
import type {PointerEvent} from 'react';
import {animate,motion,useMotionValue} from 'motion/react';
import type {Track} from './data';
import {Icon} from './ui';

// PreviewMiniPlayer: 56px cards, 16px side insets, 8px between cards.
// Gesture competes with button taps only after the native 18px drag threshold.
export default function MiniPlayer({tracks,currentIndex,playing,saved,showsHeart,onPlay,onSave,onSwipeAttempt}:{tracks:Track[];currentIndex:number;playing:boolean;saved:Set<string>;showsHeart:boolean;onPlay:()=>void;onSave:(track:Track)=>void;onSwipeAttempt:()=>void}){
 const x=useMotionValue(0),animation=useRef<ReturnType<typeof animate>|null>(null);
 const pointer=useRef<{id:number;startX:number;startY:number;width:number;dragging:boolean}|null>(null);
 const suppressClickUntil=useRef(0);
 const returnHome=()=>{animation.current?.stop();animation.current=animate(x,0,{type:'spring',stiffness:Math.pow(2*Math.PI/.42,2),damping:2*.86*2*Math.PI/.42,mass:1});};
 const finish=(e:PointerEvent<HTMLDivElement>,cancelled=false)=>{
  const p=pointer.current;if(!p||p.id!==e.pointerId)return;
  pointer.current=null;
  if(p.dragging){suppressClickUntil.current=performance.now()+400;returnHome();if(!cancelled&&Math.abs(e.clientX-p.startX)>=36)onSwipeAttempt();}
 };
 useEffect(()=>()=>{animation.current?.stop();},[]);
 return <div className="mini-player" role="region" aria-label="Миниплеер"
  onPointerDown={e=>{if(!e.isPrimary||pointer.current||tracks.length<2)return;pointer.current={id:e.pointerId,startX:e.clientX,startY:e.clientY,width:e.currentTarget.clientWidth,dragging:false};}}
  onPointerMove={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;const dx=e.clientX-p.startX,dy=e.clientY-p.startY;if(!p.dragging){if(Math.abs(dx)<18||Math.abs(dx)<Math.abs(dy))return;p.dragging=true;animation.current?.stop();e.currentTarget.setPointerCapture(e.pointerId);}e.preventDefault();const halfway=(p.width-32+8)*.5;x.set(Math.max(-halfway,Math.min(halfway,dx)));}}
  onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>{if(e.target===e.currentTarget)finish(e,true);}}
  onClickCapture={e=>{if(performance.now()<suppressClickUntil.current){e.preventDefault();e.stopPropagation();}}}>
  <motion.div className="mini-strip" style={{x}}>{(tracks.length>1?[-1,0,1]:[0]).map(offset=>{
   const track=tracks[((currentIndex+offset)%tracks.length+tracks.length)%tracks.length];
   const active=offset===0;
   return <div key={offset} className={`mini-card ${active?'current':''}`} style={{left:`calc(${offset*100}% + ${offset*8}px)`}} aria-hidden={!active}>
    <div className="mini-title"><strong>{track?.title??'Трек не выбран'}</strong><span>{track?.artist??'—'}</span></div>
    <button className={`save-button ${track&&saved.has(track.id)?'saved':''}`} tabIndex={active?0:-1} disabled={!active||!track} aria-label={track&&saved.has(track.id)?'Трек сохранён':'Сохранить трек'} onClick={()=>{if(track)onSave(track);}}>{active&&showsHeart?<motion.span layoutId="save-heart"><Icon name="heart"/></motion.span>:<span style={{visibility:active?'hidden':'visible'}}><Icon name="heart"/></span>}</button>
    <button className="mini-play" tabIndex={active?0:-1} disabled={!active} aria-label={active&&playing?'Пауза':'Воспроизвести'} onClick={onPlay}><Icon name={active&&playing?'pause':'play'} size={24}/></button>
   </div>;
  })}</motion.div>
 </div>;
}
