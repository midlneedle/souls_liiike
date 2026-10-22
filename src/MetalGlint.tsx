import {effectPixelRatio} from './renderBudget';
import {useEffect, useRef} from 'react';
import {usePrototypeSettings} from './usePrototypeSettings';
import player from '../textures/plas.webp';
import rim from '../textures/play_button_rim.webp';
import resourceRim from '../textures/play_button_resource_rim.webp';
import coverResourceRim from '../textures/cover_resource_rim.webp';
import ornament from '../textures/ornament.webp';
import mimicFrame from '../textures/optimized/frame-mimic.webp';

const vertex=`attribute vec2 position,texcoord;varying vec2 uv,screenUV;
void main(){uv=texcoord;screenUV=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 uv,screenUV;
uniform sampler2D material;
uniform float sweep,beamWidth,tilt,strength,occluder;
uniform vec2 imageFit;
uniform vec3 tint;
void main(){
  vec2 imageUV=(uv-.5)/imageFit+.5;
  if(any(lessThan(imageUV,vec2(0.)))||any(greaterThan(imageUV,vec2(1.))))discard;
  vec4 surface=texture2D(material,imageUV);
  if(occluder>.5){gl_FragColor=vec4(0.,0.,0.,surface.a*strength);return;}
  float metal=dot(surface.rgb,vec3(.2126,.7152,.0722));
  float mask=surface.a*smoothstep(.12,.42,metal);
  // Screen coordinates give every object the same physical sweep of light.
  float d=screenUV.x+screenUV.y*tilt-sweep;
  float reflection=exp(-pow(d/beamWidth,2.))*.8+exp(-pow(d/(beamWidth*3.),2.))*.2;
  float alpha=mask*reflection*strength;
  gl_FragColor=vec4(tint*alpha,alpha);
}`;
type Surface={el:HTMLElement;src:string;pseudo?:'rim'|'ornament'|'player';occluder?:boolean};
type Texture={texture:WebGLTexture;image:HTMLImageElement;ready:boolean};

// One context and one clock for all metal; DOM geometry follows carousel rotations and swipes.
export default function MetalGlint(){
 const p=usePrototypeSettings('Металлический блик',{
  enabled:true,intensity:[.32,0,1,.01],duration:[9,3,24,.5],width:[.035,.01,.18,.005],
  tilt:[.12,-.5,.5,.01],color:'#d6e8ff',
  miniPlayer:true,playRim:true,ornaments:true,icons:true,frame:true,
 },{persist:{key:'companion:metal-light:v1',storage:'localStorage'}});
 const host=useRef<HTMLSpanElement>(null),settings=useRef(p);settings.current=p;
 useEffect(()=>{
  const parent=host.current,root=parent?.parentElement;if(!parent||!root)return;
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:true,powerPreference:'low-power'});
  if(!gl)return;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{
   const shader=gl.createShader(type);if(!shader)return null;
   shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   return gl.getShaderParameter(shader,gl.COMPILE_STATUS)?shader:null;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();
  const release=()=>{shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);};
  if(!vs||!fs||!program){release();return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){release();return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const position=gl.getAttribLocation(program,'position'),texcoord=gl.getAttribLocation(program,'texcoord');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,16,0);
  gl.enableVertexAttribArray(texcoord);gl.vertexAttribPointer(texcoord,2,gl.FLOAT,false,16,8);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform1i(gl.getUniformLocation(program,'material'),0);
  const uniforms=Object.fromEntries(['sweep','beamWidth','tilt','strength','imageFit','tint','occluder'].map(n=>[n,gl.getUniformLocation(program,n)]));
  const textures=new Map<string,Texture>();
  const textureFor=(src:string)=>{
   const cached=textures.get(src);if(cached)return cached;
   const texture=gl.createTexture();if(!texture)return null;
   const image=new Image(),entry={texture,image,ready:false};textures.set(src,entry);
   image.onload=()=>{
    if(disposed)return;
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);entry.ready=true;
   };
   image.src=src;return entry;
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,disposed=false,last=0,elapsed=0;
  const draw=()=>{
   gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   const v=settings.current;if(!v.enabled||v.intensity===0)return;
   const bounds=root.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
   const margin=Math.abs(v.tilt)+v.width*3;
   gl.uniform1f(uniforms.sweep,(elapsed/v.duration%1)*(1+margin*2)-margin);
   gl.uniform1f(uniforms.beamWidth,v.width);gl.uniform1f(uniforms.tilt,v.tilt);
   const color=parseInt(v.color.slice(1),16);
   gl.uniform3f(uniforms.tint,((color>>16)&255)/255,((color>>8)&255)/255,(color&255)/255);
   const surfaces:Surface[]=[];
   if(v.miniPlayer)root.querySelectorAll<HTMLElement>('.mini-card').forEach(el=>surfaces.push({el,src:player,pseudo:'player'}));
   if(v.playRim)root.querySelectorAll<HTMLElement>('.main-play').forEach(el=>surfaces.push({el,src:el.classList.contains('flow-play')?resourceRim:rim,pseudo:'rim'}));
   if(v.playRim)root.querySelectorAll<HTMLElement>('.scenario-play').forEach(el=>surfaces.push({el,src:rim,pseudo:'rim'}));
   if(v.playRim)root.querySelectorAll<HTMLElement>('.cover-resources').forEach(el=>surfaces.push({el,src:coverResourceRim,pseudo:'rim'}));
   if(v.ornaments)root.querySelectorAll<HTMLElement>('.entity-card').forEach(el=>surfaces.push({el,src:ornament,pseudo:'ornament'}));
   if(v.frame)root.querySelectorAll<HTMLElement>('.mimic-frame').forEach(el=>surfaces.push({el,src:mimicFrame}));
   if(v.icons)root.querySelectorAll<HTMLElement>('.companion .texture-icon,.mimic-home .texture-icon,.bottom-ui .texture-icon').forEach(el=>{
    const image=el instanceof HTMLImageElement?el:el.querySelector('img');
    if(image)surfaces.push({el,src:image.currentSrc||image.src});
   });
   // Erase only the reflection behind the intact portrait, using its real alpha silhouette.
   // The screen, dock and player keep their normal DOM stacking and playback state.
   root.querySelectorAll<HTMLImageElement>('.photo-screamer img').forEach(el=>{
    const src=el.currentSrc||el.src;textureFor(src);
    surfaces.push({el,src,occluder:true});
   });
   const styleCache=new Map<HTMLElement,CSSStyleDeclaration>();
   const styleFor=(el:HTMLElement)=>{let s=styleCache.get(el);if(!s){s=getComputedStyle(el);styleCache.set(el,s);}return s;};
   gl.enable(gl.SCISSOR_TEST);
   for(const surface of surfaces){
    const {el,src,pseudo}=surface,rect=el.getBoundingClientRect();
    if(!rect.width||!rect.height||rect.right<bounds.left-24||rect.left>bounds.right+24||rect.bottom<bounds.top-24||rect.top>bounds.bottom+24)continue;
    let opacity=1,matrix=new DOMMatrixReadOnly();
    let left=bounds.left,top=bounds.top,right=bounds.right,bottom=bounds.bottom;
    for(let ancestor:HTMLElement|null=el;ancestor&&ancestor!==root;ancestor=ancestor.parentElement){
     const s=styleFor(ancestor);
     if(s.visibility==='hidden'||s.display==='none'){opacity=0;break;}
     opacity*=Number(s.opacity);
     if(s.transform!=='none')matrix=new DOMMatrixReadOnly(s.transform).multiply(matrix);
     if(ancestor!==el&&['hidden','clip','scroll','auto'].includes(s.overflow)){
      const clip=ancestor.getBoundingClientRect();left=Math.max(left,clip.left);top=Math.max(top,clip.top);right=Math.min(right,clip.right);bottom=Math.min(bottom,clip.bottom);
     }
    }
    if(opacity<.01||right<=left||bottom<=top)continue;
    let width=el.offsetWidth,height=el.offsetHeight,dy=0;
    if(pseudo){
     const s=getComputedStyle(el,pseudo==='player'?'::before':'::after');opacity*=Number(s.opacity);
     if(pseudo==='player'){width+=20;height+=32;}
     else{width=parseFloat(s.width);height=parseFloat(s.height);if(pseudo==='ornament')dy=el.offsetHeight/2-parseFloat(s.bottom)-height/2;}
    }
    if(!Number.isFinite(width)||!Number.isFinite(height)||!width||!height)continue;
    const tex=textureFor(src);if(!tex?.ready)continue;
    const cx=(rect.left+rect.right)/2-bounds.left+matrix.c*dy,cy=(rect.top+rect.bottom)/2-bounds.top+matrix.d*dy;
    const vertices:number[]=[];
    for(const [x,y] of [[-.5,-.5],[.5,-.5],[-.5,.5],[-.5,.5],[.5,-.5],[.5,.5]]){
     const px=cx+matrix.a*x*width+matrix.c*y*height,py=cy+matrix.b*x*width+matrix.d*y*height;
     vertices.push(px/bounds.width*2-1,1-py/bounds.height*2,x+.5,.5-y);
    }
    const ratio=canvas.width/bounds.width;
    gl.scissor(Math.floor((left-bounds.left)*ratio),Math.floor((bounds.bottom-bottom)*canvas.height/bounds.height),Math.ceil((right-left)*ratio),Math.ceil((bottom-top)*canvas.height/bounds.height));
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);
    gl.blendFunc(surface.occluder?gl.ZERO:gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uniforms.occluder,surface.occluder?1:0);
    gl.bindTexture(gl.TEXTURE_2D,tex.texture);gl.uniform1f(uniforms.strength,(surface.occluder?1:v.intensity)*opacity);
    const aspect=width/height,imageAspect=tex.image.naturalWidth/tex.image.naturalHeight;
    gl.uniform2f(uniforms.imageFit,pseudo==='player'?1:Math.min(1,imageAspect/aspect),pseudo==='player'?1:Math.min(1,aspect/imageAspect));
    gl.drawArrays(gl.TRIANGLES,0,6);
   }
  };
  const tick=(now:number)=>{
   frame=0;if(disposed||document.hidden||reduced.matches||gl.isContextLost())return;
   frame=requestAnimationFrame(tick);if(now-last<1000/30)return;
   elapsed+=Math.min((now-last)/1000,.1);last=now;draw();
  };
  const resume=()=>{
   cancelAnimationFrame(frame);last=performance.now();canvas.style.visibility=reduced.matches?'hidden':'visible';
   if(!disposed&&!document.hidden&&!reduced.matches&&!gl.isContextLost())frame=requestAnimationFrame(tick);
  };
  const lost=()=>{cancelAnimationFrame(frame);canvas.style.visibility='hidden';};
  const resize=()=>{
   const bounds=parent.getBoundingClientRect(),ratio=effectPixelRatio(bounds.width,bounds.height);
   canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));gl.viewport(0,0,canvas.width,canvas.height);
  };
  const observer=new ResizeObserver(resize);observer.observe(parent);resize();
  canvas.addEventListener('webglcontextlost',lost);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  parent.appendChild(canvas);resume();
  return()=>{
   disposed=true;cancelAnimationFrame(frame);observer.disconnect();
   document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);
   canvas.removeEventListener('webglcontextlost',lost);canvas.remove();
   textures.forEach(t=>{t.image.onload=null;gl.deleteTexture(t.texture);});
   gl.deleteBuffer(buffer);release();gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
 },[]);
 return <span ref={host} className="metal-light-layer" aria-hidden="true"/>;
}
