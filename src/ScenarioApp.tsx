import {useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {DialRoot,useDialKit} from 'dialkit';
import {flowTrapTrack} from './data';
import type {Track} from './data';
import {Icon} from './ui';
import MiniPlayer from './MiniPlayer';
import MetalGlint from './MetalGlint';
import StoneBackground from './StoneBackground';
import DuelView from './DuelView';
import RhythmGame from './RhythmGame';
import {RhythmAudio} from './rhythm/audio';
import MimicHome from './scenarios/MimicHome';
import DislikePreview from './scenarios/DislikePreview';
import CatVideo from './scenarios/CatVideo';
import {invader,invasionLettering} from './scenarios/assets';
import {focusHeading} from './scenarios/focus';
import SceneArtwork,{SceneEffectsContext,useSceneMotion} from './scenarios/SceneEffects';

type Screen='menu'|'mimic'|'dislike'|'invasion'|'video';
const flowTracks:Track[]=[{id:'relax-mimic',title:'Killing in the Name',artist:'Rage Against the Machine',cover:flowTrapTrack.cover},flowTrapTrack];
const emptySaved=new Set<string>();
export default function ScenarioApp({initialScreen='menu'}:{initialScreen?:Screen}={}){
 const interfaceOptions=useDialKit('Интерфейс',{dock:true},{persist:{key:'companion:interface:v1',storage:'localStorage'}});
 const iconLight=useDialKit('Белые маски иконок',{opacity:[.45,0,1,.01]},{persist:{key:'companion:icon-white:v2',storage:'localStorage'}});
 const flowPlay=useDialKit('Play Моего потока',{playOffsetX:[0,-16,16,.5]},{persist:{key:'companion:flow-play:v1',storage:'localStorage'}});
 const sceneEffects=useDialKit('Слои и параллакс',{enabled:true,parallax:true,strength:[7,0,12,.5],motionSpeed:[.8,.1,2,.05],atmosphere:true,intensity:[1,0,2,.05],speed:[.8,0,2,.05]},{persist:{key:'companion:scene-layers:v2',storage:'localStorage'}});
 const magic=useDialKit('Магия Мимика',{enabled:true,intensity:[1.1,0,3,.05],color:'#4d9eff',definition:[1.4,.5,3,.1]},{persist:{key:'companion:scene-magic:v1',storage:'localStorage'}});
 const ash=useDialKit('Пепел Вторжения',{enabled:true,intensity:[2.8,0,5,.05],density:[160,0,192,1],wind:[-.2,-1,1,.05],glow:[2.2,0,4,.05],color:'#ff6a24'},{persist:{key:'companion:scene-ash:v4',storage:'localStorage'}});
 const [screen,setScreen]=useState<Screen>(initialScreen),[playing,setPlaying]=useState(false),[fighting,setFighting]=useState(false),[rhythm,setRhythm]=useState<RhythmAudio|null>(null),[notice,setNotice]=useState('');
 const [height,setHeight]=useState(900),[width,setWidth]=useState(390);
 const main=useRef<HTMLElement>(null),rhythmRef=useRef<RhythmAudio|null>(null);
 const modal=fighting||!!rhythm;
 const [battleTrack,setBattleTrack]=useState(flowTrapTrack);
 useEffect(()=>{const element=main.current;if(!element)return;const update=()=>{setHeight(element.clientHeight);setWidth(element.clientWidth);};update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>rhythmRef.current?.dispose(),[]);
 const choose=(value:Screen)=>{setNotice('');setPlaying(false);setScreen(value);};
 const closeRhythm=(result?:{won:boolean;health:number;hits:number})=>{rhythmRef.current?.dispose();rhythmRef.current=null;setRhythm(null);if(result)setNotice(result.won?'Вторжение отражено.':'Артист оказался настойчивее.');};
 const enterRhythm=()=>{
  try{const audio=new RhythmAudio();rhythmRef.current=audio;setNotice('');setRhythm(audio);}catch{setNotice('Не удалось запустить бой. Попробуй ещё раз.');}
 };
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;if(rhythm)return;if(fighting){setFighting(false);return;}setScreen('menu');};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[fighting,rhythm]);
 const startDuel=(track:Track)=>{setBattleTrack(track);setNotice('');setFighting(true);};
 const playerHeight=(width-16)/3;
 return <main ref={main} className="app scenario-app" data-screen={screen} data-fighting={fighting} data-rhythm-active={!!rhythm} style={{'--app-height':`${height}px`,'--icons-white':iconLight.opacity,'--flow-play-icon-x':`${flowPlay.playOffsetX}px`,'--mini-player-height':`${playerHeight}px`,'--bottom-space':`${playerHeight+(interfaceOptions.dock?84:20)}px`,'--accent':'#d0cbc3','--background':'#000','--background-dark':'#000','--stage-top':'80px'} as CSSProperties}>
  {screen==='mimic'&&<MetalGlint/>}
  <SceneEffectsContext.Provider value={{...sceneEffects,magic,ash,suspended:modal}}>
  <div className="scenario-content" inert={modal}>
   <AnimatePresence mode="wait" initial={false}>
    {screen==='menu'&&<motion.section key="menu" className="scenario-menu scenario-screen" aria-label="Выбор сценария" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}}>
     <StoneBackground controls={false}/>
     <h1 ref={focusHeading} tabIndex={-1} className="sr-only">Выбор сценария</h1>
     <div className="scenario-menu-options">
      <button className="scenario-menu-button" onClick={()=>choose('mimic')}><span>Мимик</span></button>
      <button className="scenario-menu-button" onClick={()=>choose('dislike')}><span>Дизлайк</span></button>
      <button className="scenario-menu-button" onClick={()=>choose('invasion')}><span>Вторжение</span></button>
     </div>
     <button className="scenario-menu-button scenario-menu-close" onClick={()=>choose('video')}><span>Закрыть</span></button>
    </motion.section>}
    {screen==='mimic'&&<MimicHome key="mimic" playing={playing} onPlayingChange={setPlaying} onClose={()=>choose('menu')}/>}
    {screen==='video'&&<CatVideo key="video" onClose={()=>choose('menu')}/>}
    {screen==='dislike'&&<motion.section key="dislike" className="scenario-prompt dislike-prompt scenario-screen" aria-label="Дизлайк" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
     {!fighting&&<DislikePreview track={battleTrack}/>}
     <div className="scenario-prompt-bottom"><h1 ref={focusHeading} tabIndex={-1} className="scenario-description">Дизлайк нужно заслужить.<br/>Победи в сражении с треком.</h1>
      <div className="scenario-actions"><button className="scenario-action scenario-action-primary" onClick={()=>startDuel(flowTrapTrack)}>Вызвать на бой</button><button className="scenario-action" onClick={()=>choose('menu')}>Пусть играет</button></div>
     </div>
    </motion.section>}
    {screen==='invasion'&&<InvasionScreen key="invasion" onChallenge={enterRhythm} onClose={()=>choose('menu')}/>}
   </AnimatePresence>
   {screen==='mimic'&&<div className={`bottom-ui ${fighting?'dimmed':''}`} inert={modal}>
    <MiniPlayer tracks={flowTracks} currentIndex={0} playing={playing} saved={emptySaved} showsHeart={!fighting} onPlay={()=>setPlaying(value=>!value)} onSave={()=>{choose('dislike');setBattleTrack(flowTrapTrack);}} onSwipeAttempt={()=>setNotice('А включал как уверенно.')}/>
    {interfaceOptions.dock&&<nav className="dock" aria-label="Основная навигация"><button aria-current="page" onClick={()=>choose('menu')}><Icon name="ic_home" whiteMask/><span>Главная</span></button><button><Icon name="ic_catalog" whiteMask/><span>Каталог</span></button><button><Icon name="profile" whiteMask/><span>Моё</span></button></nav>}
   </div>}
   {notice&&<div className="scenario-notice" role="status">{notice}</div>}
  </div>
  </SceneEffectsContext.Provider>
  <AnimatePresence>{fighting&&<DuelView key={battleTrack.id} track={battleTrack} goal="dislike" initialHealth={1} onSaved={()=>setNotice('Дизлайк заслужен.')} onClose={()=>setFighting(false)}/>}</AnimatePresence>
  <AnimatePresence>{rhythm&&<RhythmGame audio={rhythm} onClose={closeRhythm}/>}</AnimatePresence>
  {fighting&&<button className="scenario-battle-back" aria-label="Вернуться из боя" onClick={()=>setFighting(false)}><Icon name="back" size={28}/></button>}
  <DialRoot position="top-right" defaultOpen={false} productionEnabled/>
 </main>;
}

function InvasionScreen({onChallenge,onClose}:{onChallenge:()=>void;onClose:()=>void}){
 const scene=useSceneMotion<HTMLElement>();
 return <motion.section ref={scene} className="scenario-prompt invasion-prompt scenario-screen" aria-label="Вторжение артиста" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
     <SceneArtwork scene="invasion" className="invasion-illustration" original={invader} alt="Артист в красных церемониальных доспехах"/>
     <h1 ref={focusHeading} tabIndex={-1} className="scenario-description invasion-description">В ваш мир вторгся<br/>артист у которого сегодня<br/>релиз</h1>
     <div className="scenario-prompt-bottom"><img className="invasion-title" src={invasionLettering} alt="The Last Bachelor of Lothric" width={282} height={187} draggable={false}/>
      <div className="scenario-actions"><button className="scenario-action scenario-action-primary" onClick={onChallenge}>Принять вызов</button><button className="scenario-action" onClick={onClose}>Отказаться</button></div>
     </div>
   </motion.section>;
}
