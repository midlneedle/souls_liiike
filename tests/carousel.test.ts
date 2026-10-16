import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cardGeometry,snapDelta,nearestVirtualIndex} from '../src/carouselGeometry.ts';
import {nativeLayout} from '../src/nativeLayout.ts';
test('left and right cards tilt towards the centre; focused card is upright',()=>{assert.equal(cardGeometry(-1,0).rotation,4);assert.equal(Math.abs(cardGeometry(0,0).rotation),0);assert.equal(cardGeometry(1,0).rotation,-4);});
test('tilt changes at the visual centre during drag, rather than after selection',()=>{assert.equal(Math.abs(cardGeometry(1,154).rotation),0);assert.equal(cardGeometry(0,154).rotation,4);assert.ok(cardGeometry(1,100).rotation<0);assert.ok(cardGeometry(1,200).rotation>0);});
test('every rendered neighbour starts at its proper position',()=>{for(let anchor=-12;anchor<12;anchor++){for(let v=anchor-8;v<=anchor+8;v++){const g=cardGeometry(v,anchor*154);assert.equal(g.offset,(v-anchor)*154);assert.ok(g.scale>=.875&&g.scale<=1);assert.ok(Math.abs(g.scale*g.compensation-1)<1e-10);}}});
test('small gestures return to same card; long flicks cap at three cards',()=>{assert.equal(snapDelta(30,0,9),0);assert.equal(snapDelta(-154/.62,0,9),1);assert.equal(snapDelta(-1000,-1000,9),3);assert.equal(snapDelta(1000,1000,9),-3);});
test('central group stays above the prompt and miniplayer in a short Safari viewport',()=>{for(const h of [656,667,700,744,844,900]){const l=nativeLayout(h);assert.ok(l.stageTop-l.bubbleHeight>=16);assert.ok(l.carouselTop+l.carouselHeight<=l.feedTop+.001);assert.equal(l.feedTop+l.feedHeight,Math.max(h,646)-194);assert.ok(l.carouselHeight>=160);}});
test('larger viewports keep full-size artwork and space for the serif headline',()=>{const l=nativeLayout(900);assert.ok(l.feedHeight>=24);assert.equal(l.bubbleHeight,80);assert.ok(l.carouselHeight>=160&&l.carouselHeight<=180);assert.equal(l.stageScale,1);});

test('loop boundaries use neighbouring copies in both directions',()=>{assert.equal(nearestVirtualIndex(0,8,9),9);assert.equal(nearestVirtualIndex(8,0,9),-1);assert.equal(nearestVirtualIndex(0,899,9),900);assert.equal(nearestVirtualIndex(8,-900,9),-901);});
test('visible window keeps covering long scrolling in either direction',()=>{for(const position of [-154000,-1500,0,1500,154000]){const anchor=Math.round(position/154);const offsets=Array.from({length:17},(_,i)=>cardGeometry(anchor+i-8,position).offset);assert.ok(offsets[0]<-390);assert.ok(offsets.at(-1)!>390);assert.ok(offsets.some(x=>Math.abs(x)<=77));}});

test('artwork never shrinks and the fixed two-line speech area fits above it',()=>{
 for(const height of [640,656,700,844,900]){
  const l=nativeLayout(height);
  assert.equal(l.stageScale,1);assert.equal(l.bubbleHeight,80);
  assert.ok(l.stageTop>=96);
  assert.ok(l.stageTop+196<=l.carouselTop+.001);
  assert.ok(l.carouselTop+l.carouselHeight<=Math.max(height,646)-194+.001);
 }
 for(const height of [780,844,900]){
  const l=nativeLayout(height,44,34);
  assert.equal(l.stageScale,1);
  assert.ok(l.stageTop-l.bubbleHeight>=60);
  assert.ok(l.carouselTop+l.carouselHeight<=height-34-194+.001);
 }
});
