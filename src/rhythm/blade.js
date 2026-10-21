import * as T from 'three';
import {TRAVEL} from './game.ts';

// Leading point at z=0, pommel at -length: the whole weapon crosses the hit line
// in exactly the note's duration. Sections are consumed at the contact plane.
export function createHoldBlade(note,color,highlight){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const speed=25/TRAVEL,length=note.duration*speed,bladeLength=length-.9,tipLength=.48;
 const bladeMaterial=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.38,metalness:.82,roughness:.32,flatShading:true});
 const hot=new T.MeshBasicMaterial({color:highlight});
 const iron=new T.MeshStandardMaterial({color:0x45423a,metalness:.8,roughness:.46,flatShading:true});
 const leather=new T.MeshStandardMaterial({color:0x261b19,roughness:.95,flatShading:true});
 const add=(geometry,material)=>{const object=new T.Mesh(geometry,material);body.add(object);return object;};
 const sections=[];
 const tip=add(new T.ConeGeometry(.24,tipLength,4),bladeMaterial);tip.rotation.x=Math.PI/2;tip.scale.z=.22;
 sections.push({object:tip,start:0,end:tipLength,length:tipLength,edges:[]});
 const count=1,step=bladeLength-tipLength;
 const geometry=new T.CylinderGeometry(.24,.24,step,4),edgeGeometry=new T.BoxGeometry(.027,.024,step);
 for(let i=0;i<count;i++){
  const object=add(geometry,bladeMaterial);object.rotation.x=Math.PI/2;object.scale.z=.22;
  const edges=[-1,1].map(side=>{const edge=add(edgeGeometry,hot);edge.position.x=side*.205;edge.position.y=.025;return edge;});
  sections.push({object,start:tipLength+i*step,end:tipLength+(i+1)*step,length:step,edges});
 }
 const hilt=[];
 const piece=(geometry,material,x,z,side)=>{const object=add(geometry,material);hilt.push({object,x,z,side,rotationX:0});return object;};
 for(const side of [-1,1]){
  const guard=piece(new T.BoxGeometry(.46,.13,.17),iron,side*.23,-bladeLength,side);
  guard.rotation.z=side*.18;
  piece(new T.ConeGeometry(.11,.33,4),iron,side*.48,-bladeLength-.03,side).rotation.z=-side*Math.PI/2;
 }
 const grip=piece(new T.CylinderGeometry(.085,.11,.58,6),leather,0,-bladeLength-.4,1);grip.rotation.x=Math.PI/2;hilt[hilt.length-1].rotationX=Math.PI/2;
 piece(new T.IcosahedronGeometry(.15,0),iron,0,-length+.15,-1);
 const poses=hilt.map(part=>({...part,rotationZ:part.object.rotation.z}));
 return {root,body,sparkMaterial:hot,shardMaterial:bladeMaterial,sparkAt:-10,pose(time,status,resolvedAt,reduced=false){
  const broken=status==='hit',missed=status==='miss',age=Math.max(0,time-(resolvedAt??time));
  const consumed=Math.max(0,Math.min(length,((missed?resolvedAt:time)-note.at)*speed));
  const surge=missed?age*speed*1.8:0;
  bladeMaterial.emissiveIntensity=status==='holding' ? .65+(reduced?0:Math.sin(time*22)*.07) : .38;
  body.rotation.z=missed&&!reduced?age*.7:0;
  for(const section of sections){
   const front=Math.min(0,consumed-section.start),back=consumed-section.end,remaining=Math.max(0,front-back);
   section.object.visible=!broken&&remaining>0;
   section.object.scale.y=remaining/section.length;section.object.position.z=(front+back)/2+surge;
   for(const edge of section.edges){edge.visible=section.object.visible;edge.scale.z=remaining/section.length;edge.position.z=section.object.position.z;}
  }
  for(const part of poses){
   const object=part.object;
   object.visible=broken?age<.55:consumed+part.z<.16;
   if(broken){
    object.position.set(part.x+part.side*age*1.4,.5*age-3*age*age,(length+part.z)*.18-age*.7);
    object.rotation.x=part.rotationX+(reduced?0:age*part.side*4);object.rotation.z=part.rotationZ+(reduced?0:age*part.side*5);
   }else{
    object.position.set(part.x,0,consumed+part.z+surge);object.rotation.x=part.rotationX;object.rotation.z=part.rotationZ;
   }
  }
 }};
}
