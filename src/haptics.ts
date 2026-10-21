/** Native Telegram feedback. Browsers and unsupported clients quietly do nothing. */
type Impact='light'|'medium'|'heavy'|'rigid'|'soft';
type Notice='success'|'error'|'warning';
type Feedback={impactOccurred:(style:Impact)=>unknown;notificationOccurred:(type:Notice)=>unknown};
type TelegramApp={platform?:string;isVersionAtLeast:(version:string)=>boolean;HapticFeedback?:Feedback;ready?:()=>void};
type Channel='interface'|'combat'|'rhythm'|'beat';
export type HapticSettings={enabled:boolean;interface:boolean;combat:boolean;rhythm:boolean;beat:boolean};
type Pulse={at:number;impact?:Impact;notice?:Notice};
const impact=(style:Impact,at=0):Pulse=>({at,impact:style});
const notice=(type:Notice,at=0):Pulse=>({at,notice:type});
const cues={
 tap:{channel:'interface',pulses:[impact('light')]},
 blocked:{channel:'interface',pulses:[notice('warning')]},
 reveal:{channel:'combat',pulses:[impact('medium')]},
 chomp:{channel:'combat',pulses:[impact('rigid')]},
 bite:{channel:'combat',pulses:[impact('heavy')]},
 swing:{channel:'combat',pulses:[impact('soft')]},
 parry:{channel:'combat',pulses:[impact('rigid'),impact('light',85)]},
 dodge:{channel:'combat',pulses:[impact('soft')]},
 counter:{channel:'combat',pulses:[impact('heavy')]},
 hurt:{channel:'combat',pulses:[impact('heavy'),notice('warning',120)]},
 rhythmHit:{channel:'rhythm',pulses:[impact('rigid')]},
 rhythmPerfect:{channel:'rhythm',pulses:[impact('medium')]},
 hold:{channel:'rhythm',pulses:[impact('soft')]},
 holdEnd:{channel:'rhythm',pulses:[impact('rigid'),impact('light',75)]},
 rhythmHurt:{channel:'rhythm',pulses:[impact('heavy'),notice('warning',120)]},
 beat:{channel:'beat',pulses:[impact('soft')]},
 downbeat:{channel:'beat',pulses:[impact('light')]},
 win:{channel:'combat',pulses:[impact('light'),impact('medium',110),notice('success',260)]},
 lose:{channel:'combat',pulses:[impact('heavy'),notice('error',180)]},
 rhythmWin:{channel:'rhythm',pulses:[impact('light'),impact('medium',110),notice('success',260)]},
 rhythmLose:{channel:'rhythm',pulses:[impact('heavy'),notice('error',180)]},
} satisfies Record<string,{channel:Channel;pulses:Pulse[]}>;
export type HapticCue=keyof typeof cues;
let settings:HapticSettings={enabled:true,interface:true,combat:true,rhythm:true,beat:true};
const timers=new Set<ReturnType<typeof setTimeout>>();
let lastPulse=-Infinity,quietUntil=0,patternUntil=0;
function telegram(){
 if(typeof window==='undefined')return null;
 const app=(window as Window&{Telegram?:{WebApp?:TelegramApp}}).Telegram?.WebApp;
 try{return app?.platform&&app.platform!=='unknown'&&app.isVersionAtLeast('6.1')?app:null;}catch{return null;}
}
export function stopHaptics(){for(const timer of timers)clearTimeout(timer);timers.clear();lastPulse=-Infinity;quietUntil=patternUntil=0;}
export function configureHaptics(next:HapticSettings){settings={...next};stopHaptics();}
function later(callback:()=>void,delay:number){const timer=setTimeout(()=>{timers.delete(timer);callback();},delay);timers.add(timer);}
export function haptic(name:HapticCue){
 const cue=cues[name],isBeat=cue.channel==='beat';
 if(!settings.enabled||!settings[cue.channel]||typeof document==='undefined'||document.hidden||!telegram()?.HapticFeedback)return;
 const now=performance.now(),outcome=name==='win'||name==='lose'||name==='rhythmWin'||name==='rhythmLose';
 if(outcome){stopHaptics();patternUntil=now+650;}
 else if(now<patternUntil)return;
 if(isBeat&&now<quietUntil)return;
 if(!isBeat)quietUntil=now+180;
 for(const pulse of cue.pulses){
  const fire=()=>{
   if(!settings.enabled||!settings[cue.channel]||document.hidden)return;
   const time=performance.now();
   if((isBeat&&time<quietUntil)||time-lastPulse<45)return;
   const feedback=telegram()?.HapticFeedback;if(!feedback)return;
   try{if(pulse.impact)feedback.impactOccurred(pulse.impact);else if(pulse.notice)feedback.notificationOccurred(pulse.notice);lastPulse=time;}catch{/* Feedback must never interrupt a game. */}
  };
  // Give a simultaneous stone hit precedence over the quieter musical pulse.
  if(isBeat||pulse.at)later(fire,pulse.at+(isBeat?35:0));else fire();
 }
}
export function initializeHaptics(){
 if(typeof document==='undefined')return;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHaptics();});
 window.addEventListener('pagehide',stopHaptics);
 if((window as Window&{Telegram?:unknown}).Telegram)return;
 const script=document.createElement('script');script.src='https://telegram.org/js/telegram-web-app.js';script.async=true;
 script.onload=()=>{try{telegram()?.ready?.();}catch{/* Older clients may not expose ready. */}};
 document.head.appendChild(script);
}
