import {useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import {Icon} from './ui';
import options from './settings-options.json';
type Selection={mood:string;genre:string;preference:string;situation:string};
export default function NativeSettings({initial,onApply}:{initial:Selection;onApply:(selection:Selection)=>void}){
 const [draft,setDraft]=useState(initial),[tab,setTab]=useState<'genres'|'situations'>('genres'),[expanded,setExpanded]=useState(false),[point,setPoint]=useState(initial.mood==='Энергично'?{column:0,row:0}:initial.mood==='Весело'?{column:4,row:0}:initial.mood==='Грустно'?{column:0,row:4}:initial.mood==='Спокойно'?{column:4,row:4}:{column:2,row:2});
 const [dragging,setDragging]=useState(false),plane=useRef<HTMLDivElement>(null);
 function update(e:PointerEvent<HTMLDivElement>){const r=e.currentTarget.getBoundingClientRect();const column=Math.max(0,Math.min(4,Math.round((e.clientX-r.left-28)/(r.width-56)*4))),row=Math.max(0,Math.min(4,Math.round((e.clientY-r.top-51)/(r.height-102)*4)));setPoint({column,row});setDraft(d=>({...d,mood:column===2&&row===2?'Любое':row<=2?(column<=2?'Энергично':'Весело'):(column<=2?'Грустно':'Спокойно')}));}
 const all=options[tab],visible=expanded?all:all.slice(0,7);
 return <div className="native-settings"><div className="native-settings-scroll">
  <div ref={plane} className={`native-mood-plane ${dragging?'dragging':''}`} onPointerDown={e=>{if(!e.isPrimary)return;e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);update(e);}} onPointerMove={e=>{if(dragging)update(e);}} onPointerUp={()=>setDragging(false)} onPointerCancel={()=>setDragging(false)}>
   <div className="tuner-glow"/>
   <div className="mood-grid">{Array.from({length:25},(_,i)=><i key={i} style={{left:`${i%5*25}%`,top:`${Math.floor(i/5)*25}%`}}/>)}<b className="mood-pointer" style={{left:`${point.column*25}%`,top:`${point.row*25}%`}}/></div>
   <button className="mood-label top-left" onClick={()=>{setPoint({column:0,row:0});setDraft({...draft,mood:'Энергично'});}}>ЭНЕРГИЧНЫЙ</button><button className="mood-label top-right" onClick={()=>{setPoint({column:4,row:0});setDraft({...draft,mood:'Весело'});}}>ВЕСЁЛЫЙ</button><button className="mood-label bottom-left" onClick={()=>{setPoint({column:0,row:4});setDraft({...draft,mood:'Грустно'});}}>ГРУСТНЫЙ</button><button className="mood-label bottom-right" onClick={()=>{setPoint({column:4,row:4});setDraft({...draft,mood:'Спокойно'});}}>СПОКОЙНЫЙ</button>
  </div>
  <section className="preference-section"><h3>Предпочтения</h3><div className="preference-toggles">{[{title:'Любимое',icon:'Favorite'},{title:'Популярное',icon:'Popular'},{title:'Незнакомое',icon:'Unfamiliar'}].map(p=><button key={p.title} className={draft.preference===p.title?'selected':''} onClick={()=>setDraft({...draft,preference:draft.preference===p.title?'Любая':p.title})}><span><Icon name={p.icon} size={48}/></span>{p.title}</button>)}</div></section>
  <section className="source-section"><div className="source-tabs"><button className={tab==='genres'?'selected':''} onClick={()=>{setTab('genres');setExpanded(false);}}>Жанры</button><button className={tab==='situations'?'selected':''} onClick={()=>{setTab('situations');setExpanded(false);}}>Ситуации</button></div><div className="chips">{visible.map(title=><button key={title} className={(tab==='genres'?draft.genre:draft.situation)===title?'chosen':''} onClick={()=>setDraft({...draft,[tab==='genres'?'genre':'situation']:(tab==='genres'?draft.genre:draft.situation)===title?(tab==='genres'?'Любой':'Любая'):title})}>{title}</button>)}{!expanded&&<button onClick={()=>setExpanded(true)}>Ещё⌄</button>}</div></section>
  </div><div className="native-settings-footer"><button onClick={()=>{setDraft({mood:'Любое',genre:'Любой',preference:'Любая',situation:'Любая'});setPoint({column:2,row:2});}}>Сбросить</button><button onClick={()=>onApply(draft)}>Применить</button></div>
 </div>;
}
