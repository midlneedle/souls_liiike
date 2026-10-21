import {resourceArc,squareResourceArc,resourceFill,RESOURCE_RIM} from './resourceRimGeometry';
import ResourceLiquid from './ResourceLiquid';

// Live fills sit underneath the metal texture; the cutouts and bridges shape them.
export default function ResourceRim({stamina=1,health=1,square=false}:{stamina?:number;health?:number;square?:boolean}){
 const width=square?10:RESOURCE_RIM.width;
 return <span className={`resource-rim${square?' resource-rim-square':''}`} aria-hidden="true"><ResourceLiquid stamina={stamina} health={health} square={square}><svg className="resource-fallback" viewBox="0 0 512 512">
  <defs>
   <linearGradient id="rim-stamina" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#293b1c"/><stop offset=".38" stopColor="#739e43"/><stop offset=".58" stopColor="#c1d58b"/><stop offset="1" stopColor="#456029"/>
   </linearGradient>
   <linearGradient id="rim-health" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#4b1615"/><stop offset=".4" stopColor="#a62b25"/><stop offset=".6" stopColor="#db6b50"/><stop offset="1" stopColor="#5c1c19"/>
   </linearGradient>
  </defs>
  {([{side:'left' as const,value:stamina,id:'rim-stamina'},{side:'right' as const,value:health,id:'rim-health'}]).map(({side,value,id})=>{
   const d=(square?squareResourceArc:resourceArc)(side),offset=-100*(1-resourceFill(value));
   return <g key={side} className={`resource-channel resource-${side}`} fill="none">
    <path d={d} stroke="#070909" strokeWidth={width+4}/>
    <path className="resource-fill" d={d} pathLength={100} stroke={`url(#${id})`} strokeWidth={width} strokeDasharray="100 100" strokeDashoffset={offset}/>
   </g>;
  })}
 </svg></ResourceLiquid></span>;
}
