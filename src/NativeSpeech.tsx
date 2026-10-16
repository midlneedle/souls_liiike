import {useEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {Glowie} from './ui';
/** PreviewTextReveal's default companion typography and .letterReveal line cadence. */
export default function NativeSpeech({text}:{text:string}){
 const root=useRef<HTMLDivElement>(null),reduced=useReducedMotion();
 const [lines,setLines]=useState<{text:string;width:number}[]>([{text,width:0}]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{const el=root.current;if(!el)return;let cancelled=false;const layout=()=>{const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;ctx.font='700 22px SBCond';const width=el.clientWidth;const result:string[]=[];let line='';for(const word of text.split(' ')){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>width){result.push(line);line=word;}else line=candidate;}if(line)result.push(line);setLines(result.slice(0,3).map(line=>({text:line,width:ctx.measureText(line).width})));setReady(true);};document.fonts.ready.then(()=>{if(!cancelled)layout();});const observer=new ResizeObserver(layout);observer.observe(el);return()=>{cancelled=true;observer.disconnect();};},[text]);
 return <div className="native-speech" ref={root} aria-live="polite"><div className="native-speech-lines" key={text}>{lines.map((line,i)=><div className={`native-speech-line ${ready?'ready':''} ${reduced?'immediate':''}`} key={`${text}-${i}`} style={{width:line.width||'auto','--line-delay':`${.11+i*.8}s`} as React.CSSProperties}><span>{line.text}</span>{ready&&!reduced&&<span className="text-glowie"><Glowie/></span>}</div>)}</div></div>;
}
