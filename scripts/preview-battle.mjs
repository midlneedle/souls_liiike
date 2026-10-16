// Diagnostic silhouette preview: project actual model triangles without a browser.
import * as T from 'three';
import {createBattleModel} from '../src/battle/model.js';
import {writeFileSync} from 'node:fs';
const m=createBattleModel();
m.pose({phase:'ready',attack:'thrust',elapsed:0,impactDelay:1.8,time:0,lane:1,targetLane:1,shielding:false,rolling:false},{intro:1,event:null,eventAge:10});
const camera=new T.OrthographicCamera(-190,190,220,-220,1,2000);camera.position.z=700;camera.lookAt(0,0,0);camera.updateMatrixWorld();m.root.updateMatrixWorld(true);
const triangles=[],light=new T.Vector3(-.3,.6,1).normalize();
m.root.traverse(mesh=>{if(!mesh.isMesh)return;let o=mesh;while(o){if(!o.visible)return;o=o.parent;}if(mesh.material.opacity===0)return;
 const attr=mesh.geometry.attributes.position,idx=mesh.geometry.index;
 for(let i=0;i<(idx?.count??attr.count);i+=3){const world=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(attr,idx?idx.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));const normal=new T.Vector3().subVectors(world[1],world[0]).cross(new T.Vector3().subVectors(world[2],world[0])).normalize();if(mesh.material.side!==T.DoubleSide&&normal.z<0)continue;
 const points=world.map(v=>v.clone().project(camera)).map(p=>[190+p.x*190,220-p.y*220]);const color=mesh.material.color.clone();if(!mesh.material.isMeshBasicMaterial)color.multiplyScalar(.5+Math.max(0,normal.dot(light))*.8);const c=color.getHex();triangles.push({points,z:world.reduce((s,p)=>s+p.z,0)/3,color:[(c>>16&255)/255,(c>>8&255)/255,(c&255)/255]});
 }});
triangles.sort((a,b)=>a.z-b.z);writeFileSync('/tmp/battle-preview-triangles.json',JSON.stringify(triangles));m.dispose();console.log('Projected',triangles.length,'triangles.');
