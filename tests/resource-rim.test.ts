import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resourceArc,resourceFill,resourcePoint,RESOURCE_RIM} from '../src/resourceRimGeometry.ts';

test('the resource channels stay within opposite halves of the same circular metal rim',()=>{
 for(let angle=RESOURCE_RIM.start;angle<=RESOURCE_RIM.end;angle++){
  const right=resourcePoint(angle),left=resourcePoint(360-angle);
  assert.ok(right.x>256&&left.x<256);
  assert.ok(Math.abs(left.x+right.x-512)<1e-8);
  assert.ok(Math.abs(left.y-right.y)<1e-8);
  assert.ok(Math.abs(Math.hypot(right.x-256,right.y-256)-176)<1e-8);
 }
 assert.match(resourceArc('left'),/ A 176 176 0 0 0 /);
 assert.match(resourceArc('right'),/ A 176 176 0 0 1 /);
});
test('empty and full resources have stable bounds, including invalid preview inputs',()=>{
 assert.equal(resourceFill(1),1);assert.equal(resourceFill(0),0);
 assert.equal(resourceFill(.5),.5);assert.equal(resourceFill(2),1);
 assert.equal(resourceFill(-1),0);assert.equal(resourceFill(NaN),0);
});
