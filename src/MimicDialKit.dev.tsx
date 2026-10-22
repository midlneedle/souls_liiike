import {useEffect,useState,type ReactNode} from 'react';
import {DialRoot,useDialKit} from 'dialkit';
import 'dialkit/styles.css';
import {MimicExperimentContext,mimicExperimentDefaults as defaults} from './scenarios/mimicExperiment';

/** Imported only by the local development entry; excluded from production builds. */
export default function MimicDialKit({children}:{children:ReactNode}){
 const [replay,setReplay]=useState(0);
 const [buttonVisible,setButtonVisible]=useState(true);
 const settings=useDialKit('Мимик — варианты',{
  variant:{type:'select',default:'takeover',options:[{value:'bite',label:'1. Кусает Play'},{value:'takeover',label:'2. Захватывает поток'},{value:'screamer',label:'3. Скример'},{value:'horror',label:'4. Скример — хоррор'}]},
  initialTitle:{type:'select',default:'Для полного рилакса',options:['Для полного рилакса','Для рилакса','Для полного релакса','Для твоего спокойствия','Ради твоего покоя']},
  title:{type:'select',default:'Для царского флекса',options:['Для царского флекса','Для его величества','Для королевского флекса','Для настоящего короля','Ради его величества']},
  color:'#85c942',
  lungeScale:[1.32,1,1.65,.01],
  rise:[80,0,360,4],
  holdSeconds:[2.84,1.6,5,.01],
  replay:{type:'action',label:'Сбросить сцену для повтора'},
  hideButton:{type:'action',label:'Скрыть кнопку DialKit · Alt+D — вернуть'},
 },{onAction:action=>{if(action==='replay')setReplay(value=>value+1);if(action==='hideButton')setButtonVisible(false);}});
 useEffect(()=>{
  const toggle=(event:KeyboardEvent)=>{if(event.altKey&&event.key.toLowerCase()==='d'){event.preventDefault();setButtonVisible(value=>!value);}};
  window.addEventListener('keydown',toggle);return()=>window.removeEventListener('keydown',toggle);
 },[]);
 return <MimicExperimentContext.Provider value={{...settings,replay}}>{children}{buttonVisible&&<DialRoot/>}</MimicExperimentContext.Provider>;
}
