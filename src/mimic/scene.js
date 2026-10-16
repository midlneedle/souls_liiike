import * as T from 'three';
import {createMimicModel} from './model.js';
import {createHybridRenderer} from './hybridRenderer.js';

export function imageTexture(url,round=false){
 return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{
  const canvas=document.createElement('canvas');const size=Math.min(1024,Math.max(256,image.naturalWidth,image.naturalHeight));canvas.width=canvas.height=size;const scale=size/256;const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);ctx.beginPath();if(round)ctx.arc(128,128,128,0,Math.PI*2);else ctx.roundRect(0,0,256,256,46);ctx.clip();
  const side=Math.min(image.naturalWidth,image.naturalHeight),sx=(image.naturalWidth-side)/2,sy=(image.naturalHeight-side)/2;
  ctx.drawImage(image,sx,sy,side,side,0,0,256,256);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;resolve(texture);
 };image.onerror=()=>reject(new Error('Mimic artwork could not be loaded'));image.src=url;});
}
export function woodTexture(){const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');let seed=17;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){const grain=(x%8===0?-26:0)+Math.floor(rand()*22);ctx.fillStyle=`rgb(${112+grain},${94+grain},${68+grain})`;ctx.fillRect(x,y,1,1);}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;return texture;
}
export async function createMimicScene(host,sourceURL,replacementURL,round=false){
 const textures=await Promise.allSettled([imageTexture(sourceURL,round),imageTexture(replacementURL)]);
 if(textures.some(t=>t.status==='rejected')){textures.forEach(t=>{if(t.status==='fulfilled')t.value.dispose();});throw new Error('Mimic textures unavailable');}
 const coverMap=textures[0].value,replacementMap=textures[1].value;
 let renderer;
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});}catch(error){coverMap.dispose();replacementMap.dispose();throw error;}
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-198,198,178,-178,1,2000);camera.position.z=700;camera.lookAt(0,0,0);
 const ambient=new T.AmbientLight(0xd7c9b6,1.3);scene.add(ambient);
 const key=new T.DirectionalLight(0xf9dfad,2);key.position.set(-120,200,300);scene.add(key);
 const rim=new T.DirectionalLight(0x6385a5,1.8);rim.position.set(200,50,-60);scene.add(rim);
 const model=createMimicModel({woodMap:woodTexture(),coverMap,replacementMap,round});scene.add(model.root);
 const hybrid=createHybridRenderer(renderer,scene,camera,model.root);hybrid.resize(396,356);
 let disposed=false;
 return {
  render(pose,phase,progress,size,reduced){if(disposed)return;model.pose(pose,phase,progress,size,reduced);ambient.intensity=phase==='warning'?1.65:1.3;hybrid.render();},
  dispose(){if(disposed)return;disposed=true;hybrid.dispose();model.dispose();renderer.dispose();renderer.domElement.remove();},
 };
}
