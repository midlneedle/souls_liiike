import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {STREAM,streamTimes,streamElapsed,streamPose,wrapSpeech} from './streamText';
import type {StreamLine} from './streamText';
type Line=StreamLine&{text:string};
type Layout={source:string;lines:Line[];times:number[];height:number};
export default function NativeSpeech({text,className=''}:{text:string;className?:string}){
 const root=useRef<HTMLDivElement>(null),group=useRef<HTMLDivElement>(null),reduced=useReducedMotion();
 const [current,setCurrent]=useState(text),[exiting,setExiting]=useState(false),[replay,setReplay]=useState(0);
 const [layout,setLayout]=useState<Layout|null>(null);
 const ready=layout?.source===current;
 const exitTarget=exiting?text:null;
 useEffect(()=>{
  if(text===current){setExiting(false);return;}
  if(reduced||!ready){setCurrent(text);setExiting(false);return;}
  setExiting(true);
  const timer=setTimeout(()=>{setCurrent(text);setExiting(false);},STREAM.exitDuration*1000);
  return()=>clearTimeout(timer);
 },[text,current,reduced,ready]);
 useEffect(()=>{
  const el=root.current;if(!el)return;let cancelled=false;
  const measureLayout=()=>{
   if(cancelled)return;const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;
   const css=getComputedStyle(el),size=parseFloat(css.fontSize),spacing=parseFloat(css.letterSpacing)||0;
   const lineHeight=parseFloat(css.lineHeight)||size;
   ctx.font=`${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
   const measure=(value:string)=>ctx.measureText(value).width+Math.max(0,Array.from(value).length-1)*spacing;
   const result=wrapSpeech(current.toLocaleUpperCase('ru'),el.clientWidth,measure);
   let first=0;
   const lines=result.map(value=>{const characters=Array.from(value),entry={text:value,width:measure(value),first,advances:characters.map((_,i)=>measure(characters.slice(0,i+1).join('')))};first+=characters.length+1;return entry;});
   setLayout({source:current,lines,times:streamTimes(result.join(' ')),height:lineHeight});
  };
  document.fonts.load('26px "Source Serif Pro"').then(()=>{if(!cancelled)measureLayout();});
  let previousWidth=el.clientWidth;
  const observer=new ResizeObserver(()=>{if(el.clientWidth!==previousWidth){previousWidth=el.clientWidth;measureLayout();}});observer.observe(el);
  return()=>{cancelled=true;observer.disconnect();};
 },[current]);
 useLayoutEffect(()=>{
  const el=group.current;if(!el||!ready||!layout)return;
  const letters=Array.from(el.querySelectorAll<HTMLElement>('.stream-letter'));
  if(reduced){el.style.transform='none';letters.forEach(letter=>letter.style.opacity='1');return;}
  let frame=0,previousVisible=-1;const started=performance.now();
  const duration=exiting?STREAM.exitDuration:(layout.times.at(-1)??0)+STREAM.lineSettle;
  const paint=(raw:number)=>{
   const pose=streamPose(streamElapsed(raw,layout.times,exiting),layout.times,layout.lines,layout.height);
   el.style.transform=`translate3d(${pose.x}px,${pose.y}px,0)`;
   if(pose.visible!==previousVisible){letters.forEach(letter=>{letter.style.opacity=Number(letter.dataset.index)<pose.visible?'1':'0';});previousVisible=pose.visible;}
  };
  paint(0);
  const tick=(now:number)=>{const raw=Math.min(duration,(now-started)/1000);paint(raw);if(raw<duration)frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[layout,ready,exiting,exitTarget,replay,reduced]);
 return <div className={`native-speech ${className}`} ref={root} aria-live="polite" aria-label={text} onClick={()=>{if(text===current&&!exiting)setReplay(value=>value+1);}}><div ref={group} className={`native-speech-lines stream-lines ${ready?'stream-ready':''}`} key={current} aria-hidden="true">{layout?.source===current&&layout.lines.map((line,i)=><div className="native-speech-line ready" key={i} style={{width:Math.ceil(line.width)}}><span>{Array.from(line.text).map((character,j)=><span className="stream-letter" data-index={line.first+j} key={j}>{character}</span>)}</span></div>)}</div></div>;
}
