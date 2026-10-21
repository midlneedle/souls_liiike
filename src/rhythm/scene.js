import * as T from 'three';
import {MAX_HEALTH,TRAVEL} from './game.ts';
import {createHoldBlade} from './blade.js';
const metal=new T.MeshStandardMaterial({color:0x494a42,metalness:.75,roughness:.57,flatShading:true});
const dark=new T.MeshStandardMaterial({color:0x161b1d,roughness:1,flatShading:true});
const stone=new T.MeshStandardMaterial({color:0x55534b,roughness:.9,flatShading:true});
const ember=new T.MeshBasicMaterial({color:0xffb46b});
const LANE_COLORS=[0x4c88bd,0xc29748,0xb44c5f];
const LANE_HIGHLIGHTS=[0xa9d8ff,0xffdf9d,0xffafbd];
function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
function segment(parent,a,b,r,material){const delta=new T.Vector3().subVectors(b,a);const m=mesh(parent,new T.CylinderGeometry(r*.7,r,delta.length(),5),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
export function createBellkeeper(){
 const root=new T.Group(),body=new T.Group();root.add(body);
 mesh(body,new T.ConeGeometry(1.1,2.8,7),dark,0,1.4,0);
 const bell=mesh(body,new T.CylinderGeometry(.42,.95,1.5,10,1,true),metal,0,2.65,.2);
 const lip=mesh(bell,new T.TorusGeometry(.94,.075,4,12),metal,0,-.75,0);lip.rotation.x=Math.PI/2;
 const core=mesh(bell,new T.IcosahedronGeometry(.34,1),ember,0,-.25,.1);
 const head=new T.Group();head.position.set(0,4,.05);body.add(head);
 mesh(head,new T.IcosahedronGeometry(.47,0),metal);
 mesh(head,new T.BoxGeometry(.56,.035,.04),ember,0,.06,.41);
 for(const side of [-1,1]){const horn=mesh(head,new T.ConeGeometry(.12,.7,4),metal,side*.35,.48,0);horn.rotation.z=-side*.4;}
 const arms=[];
 for(const side of [-1,1]){
  const shoulder=new T.Group();shoulder.position.set(side*.85,3.3,0);body.add(shoulder);
  segment(shoulder,new T.Vector3(),new T.Vector3(side*.35,-.8,.1),.18,metal);
  const elbow=new T.Group();elbow.position.set(side*.35,-.8,.1);shoulder.add(elbow);
  segment(elbow,new T.Vector3(),new T.Vector3(-side*.3,-.85,.25),.12,dark);
  const hand=mesh(elbow,new T.IcosahedronGeometry(.27,0),metal,-side*.3,-.85,.25);
  for(let i=0;i<3;i++)mesh(hand,new T.ConeGeometry(.045,.4,4),metal,(i-1)*.12,-.22,.08).rotation.z=Math.PI;
  arms.push({shoulder,elbow});
 }
 const armour=[];
 for(let i=0;i<6;i++){const plate=mesh(body,new T.BoxGeometry(.48,.7,.13),metal,Math.sin(i*Math.PI/3)*.77,2.65+Math.cos(i*Math.PI/3)*.45,.87);plate.rotation.z=i*Math.PI/3;armour.push(plate);}
 return {root,pose(time,launch,progress,finished,reduced=false){
  body.rotation.z=reduced?0:Math.sin(time*.7)*.025;
  body.position.y=reduced?0:Math.sin(time*1.1)*.04;
  head.rotation.y=Math.sin(time*.47)*.12;
  bell.rotation.x=Math.sin(launch*Math.PI)*.16;core.scale.setScalar(1+launch*.5);
  arms.forEach(({shoulder,elbow},i)=>{const wave=Math.sin(launch*Math.PI);shoulder.rotation.x=-wave*1.65;shoulder.rotation.z=(i?1:-1)*(.12+wave*.3);elbow.rotation.x=-wave*.9;});
  armour.forEach((plate,i)=>{const broken=progress>(i+1)/7;plate.visible=!broken;});
  root.rotation.x=finished>0?-Math.min(1,finished)*1.45:0;
  root.position.y=-Math.min(1,finished)*1.5;
 }};
}
function rock(note,laneMaterials,laneRunes){
 if(note.kind==='hold')return createHoldBlade(note,LANE_COLORS[note.lane],LANE_HIGHLIGHTS[note.lane]);
 const root=new T.Group();
 const body=mesh(root,new T.DodecahedronGeometry(note.kind==='bomb'?.36:.42,0),note.kind==='bomb'?dark:laneMaterials[note.lane]);
 if(note.kind==='bomb'){
  for(let i=0;i<8;i++){const v=new T.Vector3(Math.sin(i*2.4),Math.cos(i*2.4),i%2?.5:-.5).normalize();const spike=mesh(root,new T.ConeGeometry(.11,.43,4),metal,...v.clone().multiplyScalar(.44).toArray());spike.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v);}
  mesh(root,new T.IcosahedronGeometry(.13,0),new T.MeshBasicMaterial({color:0xae5576}),0,0,.34);
 }else{
  const horizontal=note.direction==='left'||note.direction==='right';
  const rune=new T.Group();rune.position.z=.37;root.add(rune);
  if(!horizontal)rune.rotation.z=Math.PI/2;
  const points=[new T.Vector3(-.3,-.035,0),new T.Vector3(-.1,.035,0),new T.Vector3(.04,-.025,0),new T.Vector3(.3,.04,0)];
  const runeMaterial=laneRunes[note.lane];
  for(let i=0;i<3;i++)segment(rune,points[i],points[i+1],.025,runeMaterial);
 }
 return {root,body,sparkAt:-10};
}
export function createRhythmScene(host,notes){
 const renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
 host.appendChild(renderer.domElement);
 const scene=new T.Scene();scene.fog=new T.FogExp2(0x101112,.028);
 const laneMaterials=LANE_COLORS.map(color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.18,roughness:.82,flatShading:true}));
 const laneRunes=LANE_HIGHLIGHTS.map(color=>new T.MeshBasicMaterial({color}));
 const camera=new T.PerspectiveCamera(55,1,.1,80);camera.position.set(0,3.1,7.8);camera.lookAt(0,1.3,-8);
 scene.add(new T.AmbientLight(0x8c9aa7,1.1));
 const key=new T.DirectionalLight(0xd8c8b4,2.5);key.position.set(-4,8,5);scene.add(key);
 const glow=new T.PointLight(0xffa45b,55,35,2);glow.position.set(0,6,-18);scene.add(glow);
 mesh(scene,new T.BoxGeometry(7,.25,42),dark,0,-.3,-17);
 const tiles=new T.InstancedMesh(new T.BoxGeometry(1.32,.07,2.1),stone,87),tilePose=new T.Object3D();scene.add(tiles);let tileIndex=0;
 for(let row=0;row<18;row++)for(let col=0;col<5;col++){
  // Replace the three central end tiles with targets aligned to the playable lanes.
  if(row===0&&col>=1&&col<=3)continue;
  tilePose.position.set((col-2)*1.38,-.12,-row*2.2);tilePose.rotation.y=Math.sin(row*8+col)*.025;tilePose.updateMatrix();tiles.setMatrixAt(tileIndex++,tilePose.matrix);
 }
 const railMat=new T.MeshBasicMaterial({color:0x76684c});
 for(const x of [-1.8,-.6,.6,1.8])mesh(scene,new T.BoxGeometry(.025,.02,32),railMat,x,-.05,-14);
 for(let i=0;i<6;i++)for(const side of [-1,1]){
  const z=-i*5-4;mesh(scene,new T.CylinderGeometry(.22,.4,6,6),metal,side*3.2,2.7,z);
  mesh(scene,new T.IcosahedronGeometry(.13,0),ember,side*3,2.8,z+.3);
 }
 const boss=createBellkeeper();boss.root.position.z=-25;boss.root.scale.setScalar(1.7);scene.add(boss.root);
 const targets=[],targetLights=[],cuts=[];
 for(let lane=0;lane<3;lane++){
  const color=LANE_COLORS[lane],x=(lane-1)*1.2;
  const target=mesh(scene,new T.BoxGeometry(1.13,.09,2.1),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.16,roughness:.8,metalness:.15,flatShading:true}),x,-.1,0);targets.push(target);
  const light=mesh(scene,new T.BoxGeometry(1.04,.018,.075),new T.MeshBasicMaterial({color:LANE_HIGHLIGHTS[lane],transparent:true,opacity:.55,depthWrite:false}),x,-.045,0);targetLights.push(light);
  const cut=mesh(scene,new T.BoxGeometry(1.05,.035,.025),new T.MeshBasicMaterial({color:LANE_HIGHLIGHTS[lane],transparent:true,opacity:0,depthWrite:false}),x,1,.48);cuts.push(cut);
 }
 const objects=notes.map(note=>{const object=rock(note,laneMaterials,laneRunes);scene.add(object.root);return object;});
 const particles=[];
 for(let i=0;i<48;i++){const m=mesh(scene,new T.TetrahedronGeometry(.08,0),stone);m.visible=false;particles.push({mesh:m,at:-100,velocity:new T.Vector3(),origin:new T.Vector3()});}
 let particleIndex=0,lastResolved=new Set();
 const life=[];for(let i=0;i<MAX_HEALTH;i++){const m=mesh(scene,new T.IcosahedronGeometry(.12,0),ember,(i-(MAX_HEALTH-1)/2)*.3,2.07,0);life.push(m);}
 const sword=new T.Group();scene.add(sword);sword.position.set(.9,.1,3.1);
 mesh(sword,new T.BoxGeometry(.07,1.45,.025),new T.MeshStandardMaterial({color:0xc9cfce,metalness:.85,roughness:.25}),0,.8,0);
 mesh(sword,new T.BoxGeometry(.43,.055,.08),metal,0,.1,0);
 const hilt=mesh(sword,new T.IcosahedronGeometry(.13,0),new T.MeshStandardMaterial({color:0x672d31,metalness:.5,roughness:.5}),0,-.08,0);hilt.scale.set(1.3,1,1);
 let disposed=false,endingAt=null;
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 return {
  laneAt(x){const points=[-.6,.6].map(x=>new T.Vector3(x,1,0).project(camera).x*.5+.5);return x<points[0]?0:x<points[1]?1:2;},
  render(state,cut,reduced=false){
   if(disposed)return;
   const time=state.time;
   // Begin at the bell's mouth, then reveal the monster and the whole causeway.
   const entry=reduced?1:Math.min(1,time/1.4),reveal=1-Math.pow(1-entry,3);
   camera.position.set(0,5.2+(3.1-5.2)*reveal,-17+24.8*reveal);
   camera.lookAt(0,4.5+(1.3-4.5)*reveal,-25+17*reveal);
   const next=notes.find(note=>note.at-TRAVEL<=time&&time<=note.at-TRAVEL+.55);
   const launch=next?Math.max(0,1-(time-(next.at-TRAVEL))/.55):0;
   if(state.phase==='won'&&endingAt===null)endingAt=performance.now();
   const finish=endingAt===null?0:Math.min(1,(performance.now()-endingAt)/1400);
   boss.pose(time,launch,state.hits/notes.filter(n=>n.kind!=='bomb').length,finish,reduced);
   notes.forEach((note,i)=>{
    const object=objects[i],remaining=note.at-time;
    const held=note.status==='holding'||note.status==='suspended';
    const aftermath=note.kind==='hold'&&(note.status==='hit'||note.status==='miss')&&time-(note.resolvedAt??-10)<(note.status==='hit'?.55:.32);
    object.root.visible=aftermath||((note.status==='waiting'||held)&&remaining<=TRAVEL&&(held||remaining>-.3));
    if(object.root.visible){
     object.root.position.set((note.lane-1)*1.2,note.kind==='hold' ? .22 : 1,-(aftermath?0:held||note.kind==='hold'?Math.max(0,remaining):remaining)/TRAVEL*25);
     if(object.pose)object.pose(time,note.status,note.resolvedAt,reduced);
     else object.body.rotation.set(reduced?0:Math.sin(time+i)*.07,reduced?0:Math.cos(time*.7+i)*.09,0);
     if(note.status==='holding'&&!reduced&&time-object.sparkAt>.09){
      object.sparkAt=time;const p=particles[particleIndex++%particles.length];p.mesh.material=object.sparkMaterial??laneMaterials[note.lane];p.at=time;p.origin.copy(object.root.position);p.velocity.set(Math.sin(time*29)*1.7,1.2,-3);
     }
    }
    if(note.status==='hit'&&!lastResolved.has(note.id)){
     lastResolved.add(note.id);
     for(let j=0;j<(reduced?3:8);j++){const p=particles[particleIndex++%particles.length];p.mesh.material=object.shardMaterial??laneMaterials[note.lane];p.at=time;p.origin.set((note.lane-1)*1.2,note.kind==='hold' ? .22 : 1,0);p.velocity.set((Math.sin(j*2.4+i))*(1+j*.15),1+j*.18,-5-j);}
    }
   });
   for(const p of particles){const age=time-p.at;p.mesh.visible=age>=0&&age<1.1;if(p.mesh.visible){p.mesh.position.copy(p.origin).addScaledVector(p.velocity,age);p.mesh.position.y-=age*age*2;p.mesh.rotation.set(age*4,age*7,age*3);p.mesh.scale.setScalar(1-age/1.1);}}
   const hit=state.lastEvent,age=hit?time-hit.at:10;
   const heldNotes=notes.filter(n=>n.status==='holding');
   const recent=notes.filter(n=>n.resolvedAt!==undefined&&time-n.resolvedAt<.25&&n.status!=='avoided');
   targets.forEach((target,i)=>{
    const held=heldNotes.some(n=>n.lane===i),event=recent.find(n=>n.lane===i),eventAge=event?time-event.resolvedAt:1,flash=Math.max(0,1-eventAge/.2);
    target.position.y=-.1-(reduced?0:flash*.025);
    target.material.emissiveIntensity=.16+(held ? .4+(reduced?0:Math.sin(time*12)*.06) : flash*.65);
    target.material.emissive.setHex(event?.status==='miss'?0xc74a43:LANE_COLORS[i]);
    targetLights[i].position.y=target.position.y+.055;
    targetLights[i].material.opacity=held?1:.55+flash*.45;
    targetLights[i].material.color.setHex(event?.status==='miss'?0xff7468:LANE_HIGHLIGHTS[i]);
    cuts[i].visible=event?.status==='hit'&&eventAge<.18;
    if(cuts[i].visible){cuts[i].rotation.z=event.direction==='up'||event.direction==='down'?Math.PI/2:0;cuts[i].scale.x=1+eventAge*2;cuts[i].material.opacity=1-eventAge/.18;}
   });
   life.forEach((m,i)=>{m.visible=i<state.health;});
   const slashAge=cut?time-cut.at:10,swing=slashAge<.3?Math.sin(slashAge/.3*Math.PI):0;
   sword.rotation.z=-.35+(cut?.direction==='left'?swing*1.8:cut?.direction==='right'?-swing*1.8:0);
   sword.rotation.x=cut?.direction==='up' ? -.4*swing : cut?.direction==='down' ? .4*swing : 0;
   sword.position.set(slashAge<.3?(cut.lane-1)*.7:.9,.1,3.1);
   if(heldNotes.length){
    const blend=reduced?1:1-Math.pow(1-Math.max(0,Math.min(1,(slashAge-.09)/.18)),3);
    sword.position.x+=((heldNotes[0].lane-1)*1.2-.75-sword.position.x)*blend;
    sword.position.y+=(.28-sword.position.y)*blend;sword.position.z+=(.025-sword.position.z)*blend;
    sword.rotation.x+=(-.12-sword.rotation.x)*blend;
    sword.rotation.z+=(-Math.PI/2+(reduced?0:Math.sin(time*27)*.025)-sword.rotation.z)*blend;
   }
   if(!reduced&&hit?.kind==='hurt'&&age<.25)camera.position.x=Math.sin(age*80)*(.25-age)*.2;else camera.position.x=0;
   glow.intensity=55+launch*25;
   renderer.render(scene,camera);
  },
  dispose(){if(disposed)return;disposed=true;observer.disconnect();const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();},
 };
}
