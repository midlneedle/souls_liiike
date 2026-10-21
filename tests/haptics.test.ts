import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configureHaptics,haptic,stopHaptics} from '../src/haptics.ts';

const defaults={enabled:true,interface:true,combat:true,rhythm:true,beat:true};
function setup(t:any){
 let now=1000;
 const calls:string[]=[];
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const page={hidden:false};
 const app={platform:'ios',isVersionAtLeast:(version:string)=>version==='6.1',HapticFeedback:{impactOccurred:(style:string)=>calls.push(style),notificationOccurred:(type:string)=>calls.push(type)}};
 Object.defineProperty(globalThis,'window',{value:{Telegram:{WebApp:app}},configurable:true});
 Object.defineProperty(globalThis,'document',{value:page,configurable:true});
 t.mock.method(performance,'now',()=>now);
 t.mock.timers.enable({apis:['setTimeout']});
 configureHaptics(defaults);
 t.after(()=>{stopHaptics();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete (globalThis as any).document;});
 return {calls,page,app,step:(ms:number)=>{now+=ms;t.mock.timers.tick(ms);}};
}
test('native haptics are silent outside Telegram and on unsupported clients',t=>{
 const s=setup(t);s.app.platform='unknown';haptic('tap');s.app.platform='ios';s.app.isVersionAtLeast=()=>false;haptic('win');s.step(1000);assert.deepEqual(s.calls,[]);
});
test('a stone hit takes precedence over the simultaneous delayed music pulse',t=>{
 const s=setup(t);haptic('beat');haptic('rhythmHit');s.step(35);assert.deepEqual(s.calls,['rigid']);
});
test('victory has an ascending pattern and blocks incidental hits until it finishes',t=>{
 const s=setup(t);haptic('win');s.step(110);haptic('beat');haptic('hurt');s.step(150);assert.deepEqual(s.calls,['light','medium','success']);
});
test('pause or unmount cancels the remaining outcome pulses',t=>{
 const s=setup(t);haptic('lose');stopHaptics();s.step(500);assert.deepEqual(s.calls,['heavy']);
});
test('channel settings and hidden pages suppress native calls',t=>{
 const s=setup(t);configureHaptics({...defaults,beat:false});haptic('downbeat');s.step(200);haptic('tap');s.step(200);s.page.hidden=true;haptic('rhythmHit');assert.deepEqual(s.calls,['light']);
});
test('turning haptics off cancels a queued pattern immediately',t=>{
 const s=setup(t);haptic('win');configureHaptics({...defaults,enabled:false});s.step(500);assert.deepEqual(s.calls,['light']);
});
