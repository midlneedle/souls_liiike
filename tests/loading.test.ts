import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withDeadline,loadImage} from '../src/loading.ts';
import {effectPixelRatio} from '../src/renderBudget.ts';

test('a stalled load rejects so the interface can offer another attempt',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const stalled=withDeadline(new Promise(()=>{}),20000),result=assert.rejects(stalled,/timed out/);
 t.mock.timers.tick(20000);await result;
});
test('a successful load clears its deadline and preserves the result',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 assert.equal(await withDeadline(Promise.resolve('ready'),20000),'ready');t.mock.timers.tick(20000);
});
test('image preload is shared and a failed image may be retried',async t=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'Image'),created:any[]=[];
 class ImageMock{onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';constructor(){created.push(this);}async decode(){}}
 Object.defineProperty(globalThis,'Image',{value:ImageMock,configurable:true});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'Image',original);else delete (globalThis as any).Image;});
 const a=loadImage('/shared-test.webp');assert.equal(loadImage('/shared-test.webp'),a);created[0].onload();await a;assert.equal(created.length,1);
 const failed=loadImage('/retry-test.webp'),rejection=assert.rejects(failed,/unavailable/);created[1].onerror();await rejection;
 const retry=loadImage('/retry-test.webp');created[2].onload();await retry;assert.equal(created.length,3);
});
test('decorative effects stay within their pixel budget on Retina screens',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'devicePixelRatio');Object.defineProperty(globalThis,'devicePixelRatio',{value:3,configurable:true});
 t.after(()=>{if(old)Object.defineProperty(globalThis,'devicePixelRatio',old);else delete (globalThis as any).devicePixelRatio;});
 const ratio=effectPixelRatio(500,900);assert.ok(500*900*ratio*ratio<=600001);assert.ok(ratio>=.5);assert.ok(ratio<2);
});
