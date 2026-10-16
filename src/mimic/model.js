import * as T from 'three';

// Articulated low-poly chest mimic. All geometry is local; no downloaded model.
export function createMimicModel({woodMap=null,coverMap=null,replacementMap=null,round=false}={}) {
 const root=new T.Group();root.name='mimic';
 const trackedTextures=new Set([woodMap,coverMap,replacementMap].filter(Boolean));
 const material=(color,map=null)=>new T.MeshLambertMaterial({color,map,flatShading:true});
 const wood=material(0x756047,woodMap),edge=material(0x343932),iron=material(0x575d53),bone=material(0xd5c398),skin=material(0x77765b),jointMat=material(0x454c3d),pink=material(0x8f4547),dark=new T.MeshBasicMaterial({color:0x100c0c});
 const monster=new T.Group();monster.name='chest-monster';root.add(monster);
 function box(parent,w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
 function sphere(parent,r,x,y,z,mat){const m=new T.Mesh(new T.IcosahedronGeometry(r,0),mat);m.position.set(x,y,z);parent.add(m);return m;}
 const cavity=box(monster,166,118,62,0,-6,-56,dark);
 const back=box(monster,182,144,25,0,-4,-100,wood);
 for(const x of [-70,70])box(monster,10,140,28,x,-4,-84,iron);
 const upper=new T.Group(),lower=new T.Group();upper.name='upper-jaw';lower.name='lower-jaw';monster.add(upper,lower);
 for(const [jaw,height,depth] of [[upper,26,94],[lower,28,102]]){
  box(jaw,190,height,depth,0,0,0,wood);
  box(jaw,194,7,depth+4,0,-height/2+3,0,edge);
  for(const x of [-72,72]){
   box(jaw,11,height+3,depth+6,x,0,0,iron);
   for(const z of [-32,32])sphere(jaw,3,x,height/2+2,z,bone);
  }
  // Irregular, finger-like teeth rather than a uniform zipper.
  for(let i=0;i<11;i++){
   const length=18+(i%3)*7,up=jaw===lower;
   const tooth=new T.Mesh(new T.ConeGeometry(4.5+(i%2),length,4),bone);
   tooth.position.set(-79+i*15.8,(up?1:-1)*(height/2+length/2-3),48+(i%2)*2);
   tooth.rotation.z=(up?0:Math.PI)+(i%2===0?-.13:.12);jaw.add(tooth);
  }
 }
 // Separate gum strips make the open silhouette read as a mouth.
 box(upper,170,8,15,0,-15,44,pink);box(lower,170,8,15,0,16,48,pink);
 const tongueRoot=new T.Group();monster.add(tongueRoot);tongueRoot.name='tongue';
 const tongue=[];let tongueParent=tongueRoot;
 for(let i=0;i<7;i++){const pivot=new T.Group();tongueParent.add(pivot);box(pivot,25-i*2,23,7,0,-11,0,pink);tongue.push(pivot);tongueParent=pivot;pivot.position.y=i? -21:0;}
 const arms=[];
 const yAxis=new T.Vector3(0,1,0);
 function limb(radius,length=1){return new T.Mesh(new T.CylinderGeometry(radius*.75,radius,length,5,1),skin);}
 function connect(mesh,a,b){const d=new T.Vector3().subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(yAxis,d.clone().normalize());mesh.scale.set(1,d.length(),1);}
 for(const side of [-1,1]){
  const arm=new T.Group();arm.name=side<0?'left-arm':'right-arm';monster.add(arm);
  const upperArm=limb(7),forearm=limb(5),elbow=sphere(arm,8,0,0,0,jointMat),hand=new T.Group();
  arm.add(upperArm,forearm,hand);sphere(hand,10,0,0,0,skin).scale.set(.7,1.25,.6);
  for(let i=0;i<4;i++){
   const finger=new T.Group();finger.position.set(-side*(i-1.5)*3,(i-1.5)*9,1);hand.add(finger);
   const a=new T.Vector3(0,0,0),b=new T.Vector3(-side*(17+(i%2)*4),-5,7),c=new T.Vector3(-side*(22+(i%2)*4),-16,13);
   const first=limb(2.5),second=limb(1.8);finger.add(first,second);connect(first,a,b);connect(second,b,c);sphere(finger,2.7,b.x,b.y,b.z,bone);
   const claw=new T.Mesh(new T.ConeGeometry(2,8,3),bone);claw.position.copy(c);claw.rotation.z=side*1.3;finger.add(claw);
  }
  const thumb=limb(3);hand.add(thumb);connect(thumb,new T.Vector3(side*4,8,0),new T.Vector3(-side*18,20,10));
  arms.push({side,upperArm,forearm,elbow,hand});
 }
 const cover=new T.Group();cover.name='source-cover';root.add(cover);
 function textureHalf(texture,top){if(!texture)return null;const t=texture.clone();t.repeat.set(1,.5);t.offset.set(0,top ? .5 : 0);t.needsUpdate=true;trackedTextures.add(t);return t;}
 const topPivot=new T.Group(),bottomPivot=new T.Group();cover.add(topPivot,bottomPivot);
 const coverMaterial=map=>new T.MeshBasicMaterial({map,color:map?0xffffff:0x547382,side:T.DoubleSide,transparent:true,alphaTest:.2});
 const topCard=new T.Mesh(new T.PlaneGeometry(1,.5),coverMaterial(textureHalf(coverMap,true)));topCard.position.y=.25;topPivot.add(topCard);
 const bottomCard=new T.Mesh(new T.PlaneGeometry(1,.5),coverMaterial(textureHalf(coverMap,false)));bottomCard.position.y=-.25;bottomPivot.add(bottomCard);
 const spit=new T.Mesh(new T.PlaneGeometry(1,1),coverMaterial(replacementMap));spit.name='replacement-cover';root.add(spit);spit.visible=false;
 const emberMat=new T.MeshBasicMaterial({color:0xe7c96d,transparent:true,opacity:0});
 const sparks=[];for(let i=0;i<8;i++){const mesh=new T.Mesh(new T.PlaneGeometry(3,3),emberMat);root.add(mesh);sparks.push(mesh);}
 // Quantise projected vertices to a low resolution grid, as on early consoles.
 for(const card of [topCard,bottomCard,spit])card.layers.set(1);
 const sharpMaterials=new Set([topCard.material,bottomCard.material,spit.material]);
 const materials=new Set();root.traverse(object=>{if(object.isMesh){materials.add(object.material);object.frustumCulled=false;}});
 for(const m of materials){if(sharpMaterials.has(m))continue;m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
  vec2 pixelGrid = vec2(198.0, 178.0);
  gl_Position.xy = floor((gl_Position.xy / gl_Position.w) * pixelGrid + 0.5) / pixelGrid * gl_Position.w;`);};m.customProgramCacheKey=()=> 'ps1-mimic-v1';}
 function pose(p,phase,progress,size=172,reduced=false){
  const r=p.reveal;monster.visible=r>.002;monster.scale.setScalar(.78+.22*r);monster.position.set(reduced?0:p.recoil, -8*(1-r),-65*(1-r));
  upper.position.set(0,60+p.open*58,-35);upper.rotation.set(-p.open*.48,0,p.recoil*.006);
  lower.position.set(0,-64-p.open*24,-35);lower.rotation.x=p.open*.14;
  cavity.scale.y=1+p.open*.35;back.scale.y=1+p.open*.1;
  tongueRoot.position.set(0,-30,92);tongueRoot.scale.setScalar(Math.max(.01,p.open));
  tongue.forEach((pivot,i)=>{pivot.rotation.x=.35+Math.sin(progress*7+i*.6)*.17;pivot.rotation.z=Math.sin(i*.7+progress*5)*.09;});
  for(const a of arms){const s=a.side;const shoulder=new T.Vector3(s*78,20,-65),elbow=new T.Vector3(s*(88+r*59),20-r*35,-50+r*10),wrist=new T.Vector3(s*(76+r*24),-20+r*12,15+r*33);connect(a.upperArm,shoulder,elbow);connect(a.forearm,elbow,wrist);a.elbow.position.copy(elbow);a.hand.position.copy(wrist);a.hand.rotation.z=s*(.28+.2*(1-r));}
  cover.visible=phase!=='appearing';cover.position.set(0,0,p.coverZ);cover.scale.setScalar((phase==='parried'?size+(200-size)*progress:size)*Math.max(0,p.coverScale));if(phase==='parried')cover.position.y=8*progress;
  topPivot.rotation.x=-p.fold*1.45;bottomPivot.rotation.x=p.fold*1.45;cover.rotation.z=p.fold*.16;
  spit.visible=phase==='appearing';const bounce=Math.sin(Math.min(1,p.replacement)*Math.PI)*.1;
  spit.scale.setScalar(200*Math.max(.001,p.replacement)*(1+bounce));spit.position.set(0,8*p.replacement,22+55*Math.sin(p.replacement*Math.PI));spit.rotation.z=(1-p.replacement)*-.35;
  emberMat.opacity=phase==='parried'?Math.max(0,1-progress*2):0;
  sparks.forEach((spark,i)=>{const a=i/8*Math.PI*2;spark.position.set(Math.cos(a)*progress*150,Math.sin(a)*progress*110,75);spark.rotation.z=a;});
 }
 function dispose(){const geometries=new Set();root.traverse(o=>{if(o.isMesh)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());trackedTextures.forEach(t=>t.dispose());}
 return {root,pose,dispose,upper,lower,cover,spit,arms};
}
