import {useContext,useEffect,useState} from 'react';
import type {CSSProperties} from 'react';
import {ready,defeated} from '../battle/videoAssets';
import {loadImage} from '../loading';
import {SceneEffectsContext} from './SceneEffects';
import SceneAtmosphere from './SceneAtmosphere';
import background from '../../textures/generated/dislike-boss-background-v1.webp';
import character from '../../textures/generated/dislike-boss-character-v1.webp';
import './dislikePreview.css';

export default function DislikePreview({won=false}:{won?:boolean}){
 const options=useContext(SceneEffectsContext),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  if(won||!options.enabled)return;
  let alive=true;
  void Promise.all([loadImage(background),loadImage(character)]).then(()=>{if(alive)setLoaded(true);}).catch(()=>{});
  return()=>{alive=false;};
 },[won,options.enabled]);
 const layered=!won&&options.enabled&&loaded;
 return <div className="dislike-video-preview" data-layered={layered} data-moving={layered&&options.parallax&&!options.suspended} aria-hidden="true" style={{'--boss-sway':`${options.strength*.6}px`,'--boss-lift':`${options.strength*1.15}px`,'--boss-motion-time':`${4.5/Math.max(.1,options.motionSpeed)}s`} as CSSProperties}>
  <img className="dislike-preview-original" src={won?defeated:ready} alt="" draggable={false}/>
  {layered&&<div className="dislike-preview-layers">
   <img className="dislike-preview-background" src={background} alt="" draggable={false}/>
   <div className="dislike-preview-boss"><img src={character} alt="" draggable={false}/></div>
  </div>}
  {!won&&options.enabled&&options.atmosphere&&options.ash.enabled&&!options.suspended&&<SceneAtmosphere theme="boss"
   intensity={options.intensity*options.ash.intensity} speed={options.speed} color={options.ash.color}
   definition={1.4} density={options.ash.density} wind={options.ash.wind} glow={options.ash.glow}
   particles={0} particleSpeed={1} particleSize={1} particleGlow={1}/>}
 </div>;
}
