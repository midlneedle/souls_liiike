import {useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {Icon} from './ui';
import {MAX_HEALTH,RhythmGameState} from './rhythm/game';
import type {Slash} from './rhythm/game';
import type {RhythmAudio} from './rhythm/audio';
import type {createRhythmScene} from './rhythm/scene';

const KEY_LANES:Record<string,number>={KeyA:0,KeyS:1,KeyD:2,Digit1:0,Digit2:1,Digit3:2,ArrowLeft:0,ArrowDown:1,ArrowRight:2,Space:1};

export default function RhythmGame({audio,onClose}:{audio:RhythmAudio;onClose:(result?:{won:boolean;health:number;hits:number})=>void}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<ReturnType<typeof createRhythmScene>|null>(null),game=useRef(new RhythmGameState());
 const close=useRef(onClose);close.current=onClose;
 const reduced=useReducedMotion(),reducedRef=useRef(!!reduced);reducedRef.current=!!reduced;
 const [status,setStatus]=useState<'loading'|'playing'|'paused'|'error'>('loading'),statusRef=useRef(status);statusRef.current=status;
 const cut=useRef<{at:number;direction:Slash;lane:number}|null>(null);
 const inputs=useRef(new Map<string,number>());
 const press=(lane:number,id:string)=>{
  if(statusRef.current!=='playing'||game.current.phase!=='playing'||inputs.current.has(id))return;
  const alreadyHeld=[...inputs.current.values()].includes(lane);inputs.current.set(id,lane);if(alreadyHeld)return;
  const time=audio.time,note=game.current.tap(time,lane);if(note&&note.kind!=='bomb')cut.current={at:time,direction:note.direction,lane};
 };
 const release=(id:string,cancelled=false)=>{
  const lane=inputs.current.get(id);if(lane===undefined)return;inputs.current.delete(id);
  if(statusRef.current==='playing'&&![...inputs.current.values()].includes(lane))game.current.release(audio.time,lane,cancelled);
 };
 const input=useRef({press,release});input.current={press,release};
 useEffect(()=>{
  let cancelled=false,frame=0,finishTimer:ReturnType<typeof setTimeout>|null=null;
  import('./rhythm/scene.js').then(async module=>{
   if(cancelled||!host.current)return;
   scene.current=module.createRhythmScene(host.current,game.current.notes);
   if(document.hidden)audio.pause();
   const started=await audio.start();if(cancelled)return;
   setStatus(started?'playing':audio.error?'error':'paused');
   const tick=()=>{
    if(cancelled)return;
    if(!document.hidden){
     if(audio.started&&audio.context.state==='running')game.current.advance(audio.time);
     scene.current?.render(game.current,cut.current,reducedRef.current);
     if(game.current.phase!=='playing'&&!finishTimer){
      audio.pause();finishTimer=setTimeout(()=>close.current({won:game.current.phase==='won',health:game.current.health/MAX_HEALTH,hits:game.current.hits}),1800);
     }
    }
    frame=requestAnimationFrame(tick);
   };frame=requestAnimationFrame(tick);
  }).catch(()=>{if(!cancelled){audio.pause();setStatus('error');}});
  const pause=()=>{if(game.current.phase==='playing'&&statusRef.current==='playing'){audio.pause();game.current.suspend();inputs.current.clear();statusRef.current='paused';setStatus('paused');}};
  const visibility=()=>{if(document.hidden)pause();};
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close.current();return;}
   if(event.repeat)return;
   const lane=KEY_LANES[event.code];
   if(lane!==undefined){event.preventDefault();input.current.press(lane,`key:${event.code}`);}
  };
  const keyUp=(event:KeyboardEvent)=>{if(KEY_LANES[event.code]!==undefined){event.preventDefault();input.current.release(`key:${event.code}`);}};
  window.addEventListener('keydown',key);window.addEventListener('keyup',keyUp);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelled=true;cancelAnimationFrame(frame);if(finishTimer)clearTimeout(finishTimer);inputs.current.clear();scene.current?.dispose();scene.current=null;window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',visibility);};
 },[audio]);
 return <motion.section className={`rhythm-game rhythm-${status}`} role="region" aria-label="Звонарь. Три жизни. Слева синяя дорожка, в центре золотая, справа красная. Нажимай, когда камень окажется над полоской своей цветной плитки. Длинные клинки удерживай от острия до рукояти. Парные камни нажимай двумя пальцами. Колючие ловушки пропускай. Клавиши A S D или 1 2 3 можно нажимать и удерживать одновременно." initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.45}}>
  <div ref={host} className="rhythm-scene" onPointerDown={e=>{
   if(e.button!==0||status!=='playing'||game.current.phase!=='playing')return;
   e.preventDefault();const bounds=e.currentTarget.getBoundingClientRect();
   e.currentTarget.setPointerCapture(e.pointerId);
   input.current.press(scene.current?.laneAt((e.clientX-bounds.left)/bounds.width)??1,`pointer:${e.pointerId}`);
  }} onPointerUp={e=>{e.preventDefault();input.current.release(`pointer:${e.pointerId}`);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
  onPointerCancel={e=>input.current.release(`pointer:${e.pointerId}`,true)} onLostPointerCapture={e=>input.current.release(`pointer:${e.pointerId}`,true)} onContextMenu={e=>e.preventDefault()}/>
  <button className="rhythm-back" aria-label="Выйти из ритм-игры" onClick={()=>close.current()}><Icon name="back" size={28}/></button>
  {status==='loading'&&<div className="rhythm-message" role="status"><span className="rhythm-loading"/>Пробуждаем звонаря…</div>}
  {status==='paused'&&<button className="rhythm-message rhythm-resume" onClick={()=>{void audio.resume().then(ok=>setStatus(ok?'playing':'error')).catch(()=>setStatus('error'));}}>Продолжить</button>}
  {status==='error'&&<div className="rhythm-message" role="alert">Не удалось запустить игру.<button onClick={()=>close.current()}>Вернуться</button></div>}
 </motion.section>;
}
