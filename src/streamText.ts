/** Port of stream from midlneedle/llmonboard at 8c749d65730cc9cba42714495d389a537609d3b3.
 * TextIntroTuning.swift + StreamTypewriterRenderer in AnimatedQuestionText.swift.
 */
export const STREAM={startDelay:.2,firstWordStep:.08,letterStep:.02,wordPause:.05,lineSettle:.4,exitDuration:.4} as const;
export type StreamLine={first:number;width:number;advances:number[]};
export function wrapSpeech(text:string,width:number,measure:(text:string)=>number){
 const lines:string[]=[];let line='';
 for(const word of text.trim().split(/\s+/).filter(Boolean)){
  const candidate=line?line+' '+word:word;
  if(line&&measure(candidate)>width){lines.push(line);line=word;}else line=candidate;
 }
 if(line)lines.push(line);
 if(lines.length<=2)return lines;
 const shown=lines.slice(0,2),words=shown[1].split(' ');
 while(words.length&&measure(words.join(' ')+'…')>width)words.pop();
 shown[1]=words.join(' ')+'…';
 return shown;
}
export function streamTimes(text:string){
 const times:number[]=[];let time:number=STREAM.startDelay,word=0;
 for(const character of text){times.push(time);time+=word===0?STREAM.firstWordStep:STREAM.letterStep;if(character===' '){time+=STREAM.wordPause;word++;}}
 return times;
}
export function smoothstep(value:number){const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);}
export function streamElapsed(raw:number,times:number[],exiting=false){
 if(!exiting)return raw;
 const end=times.at(-1)??STREAM.startDelay,first=(times[0]??STREAM.startDelay)-.001;
 return end-(end-first)*smoothstep(raw/STREAM.exitDuration);
}
export function streamPose(elapsed:number,times:number[],lines:StreamLine[],lineHeight=26){
 if(!lines.length)return {x:0,y:0,visible:0};
 let visible=0;while(visible<times.length&&times[visible]<=elapsed)visible++;
 const first=lines[0],last=first.first+first.advances.length-1;
 let x=0;
 if(elapsed<(times[last]??0)){
  if(visible===0)x=first.width/2;
  else{
   const index=Math.min(last,visible-1),next=Math.min(last,index+1);
   const p=smoothstep((elapsed-times[index])/Math.max(.000001,times[next]-times[index]));
   const head=first.advances[index]+(first.advances[next]-first.advances[index])*p;
   x=(first.width-head)/2;
  }
 }
 let bottom=lineHeight;
 for(let i=1;i<lines.length;i++){
  const weight=smoothstep((elapsed-times[lines[i].first])/STREAM.lineSettle);
  if(weight<=0)break;
  bottom+=((i+1)*lineHeight-bottom)*weight;
 }
 return {x,y:(lines.length*lineHeight-bottom)/2,visible};
}
