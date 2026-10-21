import {useState} from 'react';

type Value=boolean|string|number|number[];
type Resolved<T>={[K in keyof T]:T[K] extends number[]?number:T[K]};
/** Read the existing prototype defaults/preferences without shipping the editor UI. */
export function usePrototypeSettings<T extends Record<string,Value>>(_name:string,schema:T,options?:{persist?:{key:string;storage?:'localStorage'|'sessionStorage'}}):Resolved<T>{
 const [values]=useState(()=>{
  let saved:Record<string,unknown>={};
  try{
   const config=options?.persist;
   if(config&&typeof window!=='undefined'){
    const raw=window[config.storage??'localStorage'].getItem(config.key);
    const parsed=raw?JSON.parse(raw):null;
    if(parsed?.version===1&&parsed.values&&typeof parsed.values==='object')saved=parsed.values;
   }
  }catch{/* Storage may be disabled in the host browser. */}
  return Object.fromEntries(Object.entries(schema).map(([key,definition])=>{
   const fallback=Array.isArray(definition)?definition[0]:definition,candidate=saved[key];
   let value=typeof candidate===typeof fallback?candidate:fallback;
   if(typeof fallback==='number'){
    const number=typeof value==='number'&&Number.isFinite(value)?value:fallback;
    value=Array.isArray(definition)?Math.max(definition[1],Math.min(definition[2],number)):number;
   }
   return [key,value];
  })) as Resolved<T>;
 });
 return values;
}
