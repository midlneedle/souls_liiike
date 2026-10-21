import {useContext} from 'react';
import {SceneEffectsContext} from '../scenarios/SceneEffects';
import SceneAtmosphere from '../scenarios/SceneAtmosphere';
import cathedral from '../../textures/generated/invasion-background-v1.webp';
import angryBoss from '../../textures/generated/invasion-boss-angry-v1.webp';

export function preloadInvasionArt(){
 return Promise.all([cathedral,angryBoss].map(src=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error('Invasion artwork unavailable'));image.src=src;
 })));
}

export default function InvasionBackdrop({paused}:{paused:boolean}){
 const settings=useContext(SceneEffectsContext),{ash,magic}=settings;
 return <div className="rhythm-invasion-backdrop" aria-hidden="true">
  <img className="rhythm-cathedral" src={cathedral} alt="" draggable={false}/>
  <div className="rhythm-boss-window"><div className="rhythm-boss-reaction">
   <img className="rhythm-boss-photo" src={angryBoss} alt="" draggable={false}/>
  </div></div>
  <div className="rhythm-firelight"/>
  {settings.atmosphere&&ash.enabled&&!paused&&<SceneAtmosphere theme="invasion"
   intensity={settings.intensity*ash.intensity} speed={settings.speed} color={ash.color}
   definition={magic.definition} density={ash.density} wind={ash.wind} glow={ash.glow}
   particles={0} particleSpeed={0} particleSize={1} particleGlow={0}/>}
  <div className="rhythm-ground-shade"/>
 </div>;
}
