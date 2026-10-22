import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {usePrototypeSettings} from './usePrototypeSettings';
import {flowTrapTrack} from './data';
import type {Track} from './data';
import {Icon} from './ui';
import MiniPlayer from './MiniPlayer';
import MetalGlint from './MetalGlint';
import StoneBackground from './StoneBackground';
const loadDuel=()=>import('./VideoDuel');
const DuelView=lazy(loadDuel);
const loadRhythm=()=>import('./RhythmGame');
const RhythmGame=lazy(loadRhythm);
import {RhythmAudio,preloadRhythmAudio} from './rhythm/audio';
import MimicHome from './scenarios/MimicHome';
import DislikePreview from './scenarios/DislikePreview';
import {preloadVideoDuel} from './battle/videoAssets';
import CatVideo from './scenarios/CatVideo';
import {invader,invasionLettering} from './scenarios/assets';
import {focusHeading} from './scenarios/focus';
import SceneArtwork,{SceneEffectsContext,useSceneMotion} from './scenarios/SceneEffects';
import NativeSpeech from './NativeSpeech';
import {configureHaptics,haptic,stopHaptics} from './haptics';
import {withDeadline} from './loading';

type Screen='menu'|'mimic'|'dislike'|'invasion'|'video';
const flowTracks:Track[]=[{id:'relax-mimic',title:'Killing in the Name',artist:'Rage Against the Machine',cover:flowTrapTrack.cover},flowTrapTrack];
const emptySaved=new Set<string>();
export default function ScenarioApp({initialScreen='menu'}:{initialScreen?:Screen}={}){
 const haptics=usePrototypeSettings('Хаптики',{enabled:true,interface:true,combat:true,rhythm:true,beat:true},{persist:{key:'companion:haptics:v1',storage:'localStorage'}});
 useEffect(()=>{configureHaptics(haptics);},[haptics.enabled,haptics.interface,haptics.combat,haptics.rhythm,haptics.beat]);
 useEffect(()=>()=>stopHaptics(),[]);
 const interfaceOptions=usePrototypeSettings('Интерфейс',{dock:true},{persist:{key:'companion:interface:v1',storage:'localStorage'}});
 const iconLight=usePrototypeSettings('Белые маски иконок',{opacity:[.45,0,1,.01]},{persist:{key:'companion:icon-white:v2',storage:'localStorage'}});
 const flowPlay=usePrototypeSettings('Play Моего потока',{playOffsetX:[0,-16,16,.5]},{persist:{key:'companion:flow-play:v1',storage:'localStorage'}});
 const mimicPlay=usePrototypeSettings('Play Мимика',{lift:[12,0,64,1]},{persist:{key:'companion:mimic-play:v2',storage:'localStorage'}});
 const mimicLettering=usePrototypeSettings('Отступ леттеринга Мимика',{gap:[24,0,48,1]},{persist:{key:'companion:mimic-lettering-spacing:v2',storage:'localStorage'}});
 const mimicShadow=usePrototypeSettings('Тень леттеринга Мимика',{x:[0,-12,12,1],y:[0,-12,12,1],blur:[9,0,32,1],color:'#000000'},{persist:{key:'companion:mimic-shadow:v2',storage:'localStorage'}});
 const sceneEffects=usePrototypeSettings('Слои и параллакс',{enabled:true,parallax:true,strength:[7,0,12,.5],motionSpeed:[.8,.1,2,.05],atmosphere:true,intensity:[1,0,2,.05],speed:[.8,0,2,.05]},{persist:{key:'companion:scene-layers:v2',storage:'localStorage'}});
 const magic=usePrototypeSettings('Магия Мимика',{enabled:true,intensity:[1.1,0,3,.05],color:'#4d9eff',definition:[1.4,.5,3,.1],particles:[16,0,40,1],particleSpeed:[.8,0,3,.05],particleSize:[1,0,3,.05],particleGlow:[.7,0,2,.05]},{persist:{key:'companion:scene-magic:v2',storage:'localStorage'}});
 const ash=usePrototypeSettings('Пепел Вторжения',{enabled:true,intensity:[5,0,5,.05],density:[107,0,192,1],wind:[-.2,-1,1,.05],glow:[1.7,0,4,.05],color:'#bc7150'},{persist:{key:'companion:scene-ash:v5',storage:'localStorage'}});
 const [pending,setPending]=useState(false);
 const [screen,setScreen]=useState<Screen>(initialScreen),[playing,setPlaying]=useState(false),[fighting,setFighting]=useState(false),[rhythm,setRhythm]=useState<RhythmAudio|null>(null),[notice,setNotice]=useState('');
 const [height,setHeight]=useState(900),[width,setWidth]=useState(390);
 const launch=useRef(0),main=useRef<HTMLElement>(null),rhythmRef=useRef<RhythmAudio|null>(null);
 const modal=fighting||!!rhythm;
 const [battleTrack,setBattleTrack]=useState(flowTrapTrack);
 useEffect(()=>{const element=main.current;if(!element)return;const update=()=>{setHeight(element.clientHeight);setWidth(element.clientWidth);};update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>{launch.current++;rhythmRef.current?.dispose();},[]);
 const choose=(value:Screen)=>{launch.current++;setPending(false);rhythmRef.current?.dispose();rhythmRef.current=null;setRhythm(null);setNotice('');setPlaying(false);setScreen(value);};
 const closeRhythm=(result?:{won:boolean;health:number;hits:number})=>{rhythmRef.current?.dispose();rhythmRef.current=null;setRhythm(null);if(result)setNotice(result.won?'Вторжение отражено.':'Артист оказался настойчивее.');};
 const enterRhythm=()=>{
  if(pending)return;const ticket=++launch.current;setPending(true);
  try{
   rhythmRef.current?.dispose();const audio=new RhythmAudio();void audio.ready;rhythmRef.current=audio;setNotice('');
   void withDeadline(loadRhythm()).then(()=>{if(ticket===launch.current){setPending(false);setRhythm(audio);}}).catch(()=>{audio.dispose();if(ticket===launch.current){setPending(false);rhythmRef.current=null;setNotice('Не удалось запустить бой. Попробуй ещё раз.');}});
  }catch{setPending(false);setNotice('Не удалось запустить бой. Попробуй ещё раз.');}
 };
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;if(rhythm)return;if(fighting){setFighting(false);return;}choose('menu');};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[fighting,rhythm]);
 useEffect(()=>{
  // Fetch game code/resources while the player is reading the challenge screen.
  if(screen==='dislike'){void loadDuel().catch(()=>{});return preloadVideoDuel();}
  if(screen==='invasion')void Promise.all([loadRhythm(),import('./rhythm/scene.js'),preloadRhythmAudio(),import('./rhythm/InvasionBackdrop').then(module=>module.preloadInvasionArt())]).catch(()=>{});
 },[screen]);
 const startDuel=(track:Track)=>{if(pending)return;const ticket=++launch.current;setPending(true);void withDeadline(loadDuel()).then(()=>{if(ticket!==launch.current)return;setPending(false);setBattleTrack(track);setNotice('');setFighting(true);}).catch(()=>{if(ticket===launch.current){setPending(false);setNotice('Не удалось запустить бой. Попробуй ещё раз.');}});};
 const playerHeight=(width-16)/3;
 return <main ref={main} onClick={event=>{const target=event.target;if(!(target instanceof Element)||event.defaultPrevented)return;const button=target.closest('button');if(button&&!button.disabled&&!button.closest('[data-haptic="off"]'))haptic('tap');}} className="app scenario-app" data-screen={screen} data-fighting={fighting} data-rhythm-active={!!rhythm} style={{'--app-height':`${height}px`,'--app-width':`${width}px`,'--icons-white':iconLight.opacity,'--flow-play-icon-x':`${flowPlay.playOffsetX}px`,'--mimic-play-lift':`${mimicPlay.lift}px`,'--mimic-lettering-gap':`${mimicLettering.gap}px`,'--mimic-shadow-x':`${mimicShadow.x}px`,'--mimic-shadow-y':`${mimicShadow.y}px`,'--mimic-shadow-blur':`${mimicShadow.blur}px`,'--mimic-shadow-color':mimicShadow.color,'--mini-player-height':`${playerHeight}px`,'--bottom-space':`${playerHeight+(interfaceOptions.dock?84:20)}px`,'--accent':'#d0cbc3','--background':'#000','--background-dark':'#000','--stage-top':'80px'} as CSSProperties}>
  {screen==='mimic'&&<MetalGlint/>}
  <SceneEffectsContext.Provider value={{...sceneEffects,magic,ash,suspended:modal}}>
  <div className="scenario-content" inert={modal}>
   <AnimatePresence mode="wait" initial={false}>
    {screen==='menu'&&<motion.section key="menu" className="scenario-menu scenario-screen" aria-label="Выбор сценария" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}}>
     <StoneBackground/>
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
     {!fighting&&<DislikePreview won={notice==='Дизлайк заслужен.'}/>}
     <div className="scenario-prompt-bottom"><h1 ref={focusHeading} tabIndex={-1} className="scenario-description">{notice&&screen==='dislike'?<NativeSpeech text={notice} className="scenario-result-description"/>:<>Дизлайк нужно заслужить.<br/>Победи в сражении с боссом.</>}</h1>
      <div className="scenario-actions"><button className="scenario-action scenario-action-primary" disabled={pending} aria-busy={pending} onClick={()=>startDuel(flowTrapTrack)}>Вызвать на бой</button><button className="scenario-action" onClick={()=>choose('menu')}>Пусть играет</button></div>
     </div>
    </motion.section>}
    {screen==='invasion'&&<InvasionScreen key="invasion" onChallenge={enterRhythm} pending={pending} onClose={()=>choose('menu')} message={notice}/>}
   </AnimatePresence>
   {screen==='mimic'&&<div className={`bottom-ui ${fighting?'dimmed':''}`} inert={modal}>
    <MiniPlayer tracks={flowTracks} currentIndex={0} playing={playing} saved={emptySaved} showsHeart={!fighting} onPlay={()=>setPlaying(value=>!value)} onSave={()=>{choose('dislike');setBattleTrack(flowTrapTrack);}} onSwipeAttempt={()=>{haptic('blocked');setNotice('А включал как уверенно.');}}/>
    {interfaceOptions.dock&&<nav className="dock" aria-label="Основная навигация"><button aria-current="page" onClick={()=>choose('menu')}><Icon name="ic_home" whiteMask/><span>Главная</span></button><button><Icon name="ic_catalog" whiteMask/><span>Каталог</span></button><button><Icon name="profile" whiteMask/><span>Моё</span></button></nav>}
   </div>}
   {notice&&screen!=='dislike'&&screen!=='invasion'&&<div className="scenario-notice" role="status">{notice}</div>}
  </div>
  </SceneEffectsContext.Provider>
  <Suspense fallback={null}><AnimatePresence>{fighting&&<DuelView key={battleTrack.id} onSaved={()=>setNotice('Дизлайк заслужен.')} onLost={()=>setNotice('На этот раз — без дизлайка.')} onClose={()=>setFighting(false)}/>}</AnimatePresence></Suspense>
  <SceneEffectsContext.Provider value={{...sceneEffects,magic,ash,suspended:false}}>
   <Suspense fallback={null}><AnimatePresence>{rhythm&&<RhythmGame audio={rhythm} onClose={closeRhythm}/>}</AnimatePresence></Suspense>
  </SceneEffectsContext.Provider>

 </main>;
}

function InvasionScreen({onChallenge,onClose,message,pending}:{onChallenge:()=>void;onClose:()=>void;message:string;pending:boolean}){
 const scene=useSceneMotion<HTMLElement>();
 return <motion.section ref={scene} className="scenario-prompt invasion-prompt scenario-screen" aria-label="Вторжение артиста" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}}>
     <SceneArtwork scene="invasion" className="invasion-illustration" original={invader} alt="Артист в красных церемониальных доспехах"/>
     <h1 ref={focusHeading} tabIndex={-1} className="scenario-description invasion-description">{message?<NativeSpeech text={message} className="scenario-result-description"/>:<>В ваш мир вторгся<br/>артист у которого сегодня<br/>релиз</>}</h1>
     <div className="scenario-prompt-bottom"><img className="invasion-title" src={invasionLettering} alt="The Last Bachelor of Lothric" width={564} height={373} draggable={false}/>
      <div className="scenario-actions"><button className="scenario-action scenario-action-primary" disabled={pending} aria-busy={pending} onClick={onChallenge}>{pending?'Готовим бой…':'Принять вызов'}</button><button className="scenario-action" onClick={onClose}>Отказаться</button></div>
     </div>
   </motion.section>;
}
