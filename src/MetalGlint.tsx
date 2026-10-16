import {useEffect, useRef} from 'react';
import player from '../textures/plas.webp';

const vertex=`attribute vec2 position;varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 uv;
uniform sampler2D material;
uniform float time;
void main(){
  vec4 surface=texture2D(material,uv);
  float metal=dot(surface.rgb,vec3(.2126,.7152,.0722));
  // The supplied player's bright metal is the mask; its dark stone stays untouched.
  float mask=surface.a*smoothstep(.12,.42,metal);
  float sweep=fract(time/9.)*1.8-.4;
  float beamDistance=uv.x+uv.y*.12-sweep;
  float reflection=exp(-pow(beamDistance/.035,2.))*.8+exp(-pow(beamDistance/.11,2.))*.2;
  float alpha=mask*reflection*.32;
  gl_FragColor=vec4(vec3(.84,.91,1.)*alpha,alpha);
}`;

// A single small transparent surface follows the current card, including its return spring.
export default function MetalGlint(){
 const host=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const parent=host.current;if(!parent)return;
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
  const buffer=gl.createBuffer(),texture=gl.createTexture();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program,'material'),0);
  const time=gl.getUniformLocation(program,'time'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,disposed=false,loaded=false,last=0,elapsed=0;
  const tick=(now:number)=>{
   frame=0;
   if(disposed||!loaded||document.hidden||reduced.matches||gl.isContextLost())return;
   frame=requestAnimationFrame(tick);
   if(now-last<1000/30)return;
   elapsed+=Math.min((now-last)/1000,.1);last=now;
   gl.uniform1f(time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);
  };
  const resume=()=>{
   cancelAnimationFrame(frame);frame=0;last=performance.now();
   canvas.style.visibility=reduced.matches?'hidden':'visible';
   if(!disposed&&loaded&&!document.hidden&&!reduced.matches&&!gl.isContextLost())frame=requestAnimationFrame(tick);
  };
  const lost=()=>{cancelAnimationFrame(frame);canvas.style.visibility='hidden';};
  const resize=()=>{
   const bounds=parent.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
   canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));
   gl.viewport(0,0,canvas.width,canvas.height);
  };
  const observer=new ResizeObserver(resize);observer.observe(parent);resize();
  canvas.addEventListener('webglcontextlost',lost);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  const image=new Image();
  image.onload=()=>{
   if(disposed)return;
   gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
   loaded=true;parent.appendChild(canvas);resume();
  };
  image.src=player;
  return()=>{
   disposed=true;cancelAnimationFrame(frame);observer.disconnect();image.onload=null;
   document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);
   canvas.removeEventListener('webglcontextlost',lost);canvas.remove();
   gl.deleteTexture(texture);gl.deleteBuffer(buffer);release();gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
 },[]);
 return <span ref={host} className="mini-metal-glint" aria-hidden="true"/>;
}
