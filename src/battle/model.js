import * as T from 'three';
import {createMimicModel} from '../mimic/model.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
const vector=(x,y,z)=>new T.Vector3(x,y,z);
export function createBattleModel({coverMap=null,woodMap=null}={}){
 const root=new T.Group();root.name='first-person-duel';
 const boss=new T.Group();boss.name='cover-headed-boss';root.add(boss);
 const flesh=new T.MeshLambertMaterial({color:0x696e59,flatShading:true});
 const dark=new T.MeshLambertMaterial({color:0x333b32,flatShading:true});
 const bone=new T.MeshLambertMaterial({color:0xb6b18c,flatShading:true});
 const cloth=new T.MeshLambertMaterial({color:0x38332f,flatShading:true,side:T.DoubleSide});
 const silver=new T.MeshLambertMaterial({color:0xc8d8da,flatShading:true});
 const heartMaterial=new T.MeshLambertMaterial({color:0xb8b0a3,flatShading:true});
 const gold=new T.MeshLambertMaterial({color:0xad9762,flatShading:true});
 const head=createMimicModel({coverMap,woodMap});head.root.name='track-head';head.root.position.set(0,74,10);head.root.scale.setScalar(.55);boss.add(head.root);
 head.arms.forEach(a=>{a.upperArm.parent.visible=false;});
 function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
 function box(parent,w,h,d,x,y,z,mat){return mesh(parent,new T.BoxGeometry(w,h,d),mat,x,y,z);}
 function ball(parent,r,x,y,z,mat){return mesh(parent,new T.IcosahedronGeometry(r,0),mat,x,y,z);}
 function segment(parent,r,mat=flesh){return mesh(parent,new T.CylinderGeometry(r*.75,r,1,5),mat);}
 const up=vector(0,1,0);
 function join(part,a,b){const length=new T.Vector3().subVectors(b,a);part.position.copy(a).add(b).multiplyScalar(.5);part.quaternion.setFromUnitVectors(up,length.clone().normalize());part.scale.set(1,length.length(),1);}
 const body=new T.Group();body.name='unfolding-body';boss.add(body);
 const torso=mesh(body,new T.CylinderGeometry(35,17,77,5,1),flesh,0,-8,-12);
 const pelvis=mesh(body,new T.IcosahedronGeometry(23,0),dark,0,-56,-10);pelvis.scale.set(1,.65,.65);
 box(body,8,35,10,0,42,-12,bone);
 for(let i=0;i<5;i++){for(const s of [-1,1]){const rib=box(body,26-i*2,4,7,s*(14-i),15-i*11,10,bone);rib.rotation.z=s*(.25+i*.06);}}
 const skirt=mesh(body,new T.ConeGeometry(33,54,5,1,true),cloth,0,-62,-15);skirt.rotation.z=Math.PI;
 const arms=[];
 for(const side of [-1,1]){
  const arm={side,upper:segment(body,6),fore:segment(body,4.5),elbow:ball(body,7,0,0,0,dark),hand:new T.Group()};body.add(arm.hand);
  const palm=ball(arm.hand,9,0,0,0,flesh);palm.scale.set(.8,1.25,.6);
  for(let i=0;i<4;i++){const finger=segment(arm.hand,2,bone);join(finger,vector((i-1.5)*5,-5,0),vector((i-1.5)*6,-29-(i%2)*5,5));const claw=mesh(arm.hand,new T.ConeGeometry(2,9,3),bone,(i-1.5)*6,-32-(i%2)*5,7);claw.rotation.z=Math.PI;}
  arms.push(arm);
 }
 const legs=[];
 for(const side of [-1,1]){legs.push({side,thigh:segment(body,6,dark),shin:segment(body,4,flesh),knee:ball(body,6,0,0,0,bone),foot:box(body,15,8,33,side*27,-145,4,dark)});}
 const sword=new T.Group();sword.name='heart-hilt-sword';root.add(sword);
 const shieldModel=new T.Group();shieldModel.name='player-shield';root.add(shieldModel);
 const shieldFace=mesh(shieldModel,new T.CylinderGeometry(29,29,7,6),dark);shieldFace.rotation.x=Math.PI/2;
 const shieldRim=mesh(shieldModel,new T.TorusGeometry(27,2,3,6),gold,0,0,5);
 box(shieldModel,4,34,3,0,0,7,bone);box(shieldModel,25,4,3,0,3,7,bone);
 const damageMaterial=new T.MeshLambertMaterial({color:0x341c22,flatShading:true,side:T.DoubleSide});
 const damageMarks=[];
 for(let i=0;i<7;i++){const mark=mesh(boss,new T.PlaneGeometry(3+i%2,23+i*2),damageMaterial,(i%3-1)*18,82-Math.floor(i/3)*40,94-Math.floor(i/3)*32);mark.rotation.z=-.5+(i%3)*.22;damageMarks.push(mark);}
 const heartShape=new T.Shape();heartShape.moveTo(0,5);heartShape.bezierCurveTo(-5,18,-22,17,-22,2);heartShape.bezierCurveTo(-22,-9,-8,-17,0,-24);heartShape.bezierCurveTo(8,-17,22,-9,22,2);heartShape.bezierCurveTo(22,17,5,18,0,5);
 const hilt=mesh(sword,new T.ExtrudeGeometry(heartShape,{depth:9,bevelEnabled:false,curveSegments:2,steps:1}),heartMaterial,0,0,-4.5);hilt.name='heart-hilt';
 const grip=segment(sword,3.5,dark);join(grip,vector(0,-21,0),vector(0,-39,0));ball(sword,5,0,-41,0,gold);
 const blade=new T.Group();blade.name='extending-blade';blade.position.y=5;sword.add(blade);
 const vertices=[];
 const left=vector(-7,0,0),right=vector(7,0,0),ridge=vector(0,0,5),upperLeft=vector(-5,112,0),upperRight=vector(5,112,0),upperRidge=vector(0,112,5),tip=vector(0,142,0);
 function tri(a,b,c){for(const v of [a,b,c])vertices.push(v.x,v.y,v.z);}
 tri(left,upperLeft,ridge);tri(upperLeft,upperRidge,ridge);tri(ridge,upperRidge,right);tri(upperRidge,upperRight,right);tri(upperLeft,tip,upperRidge);tri(upperRidge,tip,upperRight);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const bladeMaterial=silver;bladeMaterial.side=T.DoubleSide;mesh(blade,geometry,bladeMaterial);
 const particles=new T.Group();particles.name='parry-sparks';root.add(particles);
 const sparkMaterial=new T.MeshBasicMaterial({color:0xffe1a1,transparent:true,opacity:0});
 for(let i=0;i<10;i++)mesh(particles,new T.PlaneGeometry(3+(i%2)*2,2),sparkMaterial);
 const ownedMaterials=new Set();root.traverse(o=>{if(o.isMesh&&!(head.root.getObjectById(o.id))){ownedMaterials.add(o.material);o.frustumCulled=false;}});
 for(const material of ownedMaterials){material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec2 pixelGrid=vec2(200.0,220.0);
   gl_Position.xy=floor(gl_Position.xy/gl_Position.w*pixelGrid+0.5)/pixelGrid*gl_Position.w;`);};material.customProgramCacheKey=()=> 'ps1-battle-v1';}
 let previousTime=0;
 function pose(state,visual={intro:1,event:null,eventAge:10},reduced=false){
  const intro=ease(visual.intro),phase=state.phase,won=phase==='won',lost=phase==='lost';
  const age=visual.eventAge,event=visual.event;
  const counter=(event==='countered'||event==='won')?Math.sin(clamp(age/.45)*Math.PI):0;
  const impact=clamp((state.elapsed-state.impactDelay+.42)/.42),windup=phase==='windup';
  const charge=windup?ease(state.elapsed/(state.impactDelay-.42)):0;
  const stunned=phase==='stunned';
  const death=won?ease(age/1.1):0;
  const damage=state.bossLives<=3?2:state.bossLives<=6?1:0;
  const breath=Math.sin(state.time*(2.4+damage*.5));
  const hit=event==='countered'||event==='won'?Math.sin(clamp(age/.45)*Math.PI):0;
  const recoil=event==='parried'?Math.sin(clamp(age/.5)*Math.PI):0;
  const dt=Math.min(.05,Math.max(0,state.time-previousTime));previousTime=state.time;
  const smoothing=reduced?1:1-Math.exp(-dt*18);
  damageMarks.forEach((mark,i)=>{mark.visible=damage>0&&i<(damage===1?3:7);});
  flesh.color.setHex(damage===2?0x4f5144:damage===1?0x60634e:0x696e59);
  cloth.color.setHex(damage===2?0x25221e:0x38332f);
  boss.position.set(reduced?0:-(state.lane-1)*36,-8*death,0);boss.rotation.set(0,reduced?0:Math.sin(state.time*1.4)*.03,stunned?.12:death*.65);boss.scale.setScalar(1-death*.45-counter*.045);boss.visible=death<.99;
  body.scale.y=intro;body.position.y=(1-intro)*40;
  body.position.y-=damage*5+hit*9;
  body.rotation.set(damage*.09+charge*.06-hit*.16,Math.sin(state.time*1.1)*.025,damage*.045+breath*.012-recoil*.12);
  body.scale.x=1+breath*.018;body.scale.z=1+breath*.025;
  skirt.scale.set(1,1-damage*.16,1);skirt.rotation.z=Math.PI+Math.sin(state.time*1.7)*.035;
  head.pose({reveal:1,open:stunned?.7:windup?.15+.18*charge:.15,fold:0,coverScale:1,coverZ:30,replacement:0,recoil:0},'windup',state.time%1,172,true);
  head.root.position.y=74+(1-intro)*-20-damage*6+breath*(1.5+damage)-hit*6;
  head.root.rotation.z=(stunned?-.22:counter*.2)+damage*.07+breath*.018;
  head.root.rotation.x=damage*.06-charge*.07+hit*.15;
  torso.rotation.z=stunned?.12:0;
  for(const a of arms){
   const s=a.side,shoulder=vector(s*31,27,-10);
   let elbow=vector(s*78,-15,0),wrist=vector(s*54,-69,30);
   const attackSide=state.direction==='right'?-1:1;
   if(windup&&s===attackSide){
    if(state.attack==='sweep'){elbow=vector(s*(89-110*impact),35-40*impact,15+80*impact);wrist=vector(s*(115-245*impact),30-65*impact,35+100*impact);}
    else if(state.direction==='left'||state.direction==='right'){elbow=vector(s*90,25+35*charge-50*impact,20+45*impact);wrist=vector(s*(65+55*charge-230*impact),15+30*charge-65*impact,30+130*impact);}
    else{elbow=vector(s*70,10+95*charge-105*impact,10+35*impact);wrist=vector(s*(60+(state.targetLane-1)*45*impact),-55+185*charge-190*impact,30+130*impact);}
   }
   if(stunned){elbow=vector(s*86,-30,0);wrist=vector(s*95,-85,10);}
   elbow.y+=breath*2-damage*(s===-1?7:3);wrist.y+=breath*3-damage*(s===-1?13:4);
   elbow.z-=recoil*20+hit*16;wrist.z-=recoil*45+hit*28;
   if(!a.smoothElbow||reduced){a.smoothElbow=elbow.clone();a.smoothWrist=wrist.clone();}
   else{a.smoothElbow.lerp(elbow,smoothing);a.smoothWrist.lerp(wrist,smoothing);}
   join(a.upper,shoulder,a.smoothElbow);join(a.fore,a.smoothElbow,a.smoothWrist);a.elbow.position.copy(a.smoothElbow);a.hand.position.copy(a.smoothWrist);a.hand.rotation.z=s*.25+(s===1?charge*.8:0)+breath*.04;
  }
  for(const leg of legs){const s=leg.side,weight=Math.sin(state.time*1.2)*2,hip=vector(s*14,-53,-13),knee=vector(s*31+weight,-97+damage*(s===-1?6:2),8+damage*3),ankle=vector(s*27,-141,0);join(leg.thigh,hip,knee);join(leg.shin,knee,ankle);leg.knee.position.copy(knee);}
  const extension=won?1-ease(age/.65):ease((visual.intro-.12)/.7);
  blade.scale.y=Math.max(.001,extension);blade.visible=extension>.005;
  const shield=state.shielding?1:0,roll=state.rolling?1:0;
  shieldModel.visible=visual.intro>0&&!won&&!lost;
  shieldModel.position.set(-76+shield*30,-135+shield*102,190);shieldModel.rotation.set(.15-shield*.15,.25-shield*.2,.16-shield*.2);shieldModel.scale.setScalar(.7+.3*shield);
  sword.position.set(-shield*35-counter*25+(reduced?0:(state.lane-1)*16),-112+shield*38+counter*100-roll*20,170+counter*25);
  sword.rotation.set(0,-.15,-.19-shield*1.1-counter*.4+(reduced?0:roll*.5));
  if(visual.input&&!won&&!lost){
   const input=visual.input,slash=Math.sin(clamp(input.age/.22)*Math.PI);
   const horizontal=input.direction==='left'?-1:input.direction==='right'?1:0;
   sword.position.x+=input.active?input.x*52:horizontal*slash*40;
   sword.position.y+=input.active?-input.y*40:slash*45;
   sword.rotation.z+=input.active?-input.x*.8:-horizontal*slash*.95;
  }
  if(won){sword.position.set(0,-112,170);sword.rotation.z=0;heartMaterial.color.setHex(0x7fe3a2);}
  else{heartMaterial.color.setHex(lost?0x66515e:0xb8b0a3);}
  sword.visible=visual.intro>0&&(won?age<.85:!lost||age<.7);
  const spark=event==='parried'||event==='countered'||event==='won';sparkMaterial.opacity=spark?Math.max(0,1-age/.35):0;
  particles.children.forEach((p,i)=>{const angle=i/10*Math.PI*2;p.position.set(Math.cos(angle)*age*190,-15+Math.sin(angle)*age*130,190);p.rotation.z=angle;});
  return {extension,death};
 }
 function dispose(){head.dispose();const geometries=new Set();root.traverse(o=>{if(o.isMesh&&!head.root.getObjectById(o.id))geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());}
 return {root,boss,body,head,sword,blade,hilt,pose,dispose};
}
