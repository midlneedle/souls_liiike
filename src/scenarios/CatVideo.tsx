import {useEffect,useRef} from 'react';
import {motion} from 'motion/react';
import {cat,frame} from './assets';
import OrnateClose from './OrnateClose';
export default function CatVideo({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const clip=video.current;dialog.current?.focus({preventScroll:true});if(clip){clip.src=cat;void clip.play().catch(()=>{});}
  return()=>{clip?.pause();clip?.removeAttribute('src');clip?.load();previous?.focus({preventScroll:true});};
 },[]);
 return <motion.section className="cat-page scenario-screen" aria-label="Страница с видео" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
  <motion.div ref={dialog} className="cat-dialog" tabIndex={-1} role="region" aria-label="Видео с котом" initial={{scale:.94}} animate={{scale:1}} exit={{scale:.94}} transition={{duration:.22,ease:[.22,1,.36,1]}} onClick={e=>e.stopPropagation()}>
   <div className="cat-framed-content">
    <div className="cat-video-window"><video ref={video} src={cat} autoPlay playsInline controls preload="metadata" onEnded={onClose}/></div>
    <img className="cat-frame" src={frame} alt="" draggable={false}/>
    <OrnateClose className="cat-frame-close" label="Закрыть видео" onClick={onClose}/>
   </div>
  </motion.div>
 </motion.section>;
}
