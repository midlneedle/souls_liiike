import {effectPixelRatio} from './renderBudget';
import {useEffect, useRef} from 'react';
import {usePrototypeSettings} from './usePrototypeSettings';

const vertex = `attribute vec2 position; varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time, density, speed, wind, glow, light, enabled;
uniform float textureScale, sharpness, contrast;
uniform vec3 ember;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
// Value noise and its analytic slope: no image sampling or extra normal passes.
vec3 stoneNoise(vec2 p){
  vec2 cell=floor(p),f=fract(p);
  vec2 u=f*f*(3.-2.*f),du=6.*f*(1.-f);
  float a=hash2(cell),b=hash2(cell+vec2(1.,0.));
  float c=hash2(cell+vec2(0.,1.)),d=hash2(cell+vec2(1.,1.));
  float k=a-b-c+d;
  return vec3(a+(b-a)*u.x+(c-a)*u.y+k*u.x*u.y,
    du.x*(b-a+k*u.y),du.y*(c-a+k*u.x));
}
vec3 stoneRelief(vec2 p){
  vec3 relief=vec3(0.);
  float amplitude=.5,frequency=1.;
  for(int octave=0;octave<5;octave++){
    vec3 n=stoneNoise(p*frequency);
    relief+=vec3(n.x,n.yz*frequency)*amplitude;
    frequency*=2.07;amplitude*=.48;
  }
  return relief;
}
void main(){
  vec2 stoneUV=(uv-.5)*vec2(resolution.x/resolution.y,1.)*24./textureScale+vec2(17.,43.);
  vec3 relief=stoneRelief(stoneUV);
  vec3 normal=normalize(vec3(-relief.yz*(.28+sharpness*.65),1.));
  float diffuse=max(0.,dot(normal,normalize(vec3(-.6,.8,1.))));
  float grain=stoneNoise(stoneUV*22.).x;
  // Fade subpixel grain rather than letting it shimmer on small screens.
  float grainVisibility=1.-smoothstep(.3,.9,24.*22./(textureScale*resolution.y));
  float fissures=smoothstep(.23,.38,relief.x);
  float value=(.026+relief.x*.072)*(.38+diffuse*.85)*mix(.45,1.,fissures);
  value+=(grain-.5)*.025*grainVisibility*(.5+sharpness*.5);
  vec3 rock=clamp((vec3(value)*vec3(.97,.985,1.)-.065)*contrast+.065,0.,1.);
  float breathing=sin(uv.x*4.+uv.y*3.+time*.12)*.5+.5;
  rock*=light*(.94+.12*breathing);
  vec3 ash=vec3(0.);
  for(int i=0;i<48;i++){
    float id=float(i),seed=hash(id+3.);
    float age=fract(hash(id+17.)+time*speed*(.018+seed*.025));
    float x=fract(hash(id+81.)+wind*age*.35+sin(time*.3+id*2.+age*6.)*.024);
    vec2 delta=(uv-vec2(x,age))*resolution;
    float radius=.65+hash(id+39.)*1.3;
    float mote=exp(-dot(delta,delta)/(radius*radius));
    float halo=exp(-dot(delta,delta)/(radius*radius*14.))*.1;
    float fade=smoothstep(0.,.12,age)*(1.-smoothstep(.82,1.,age));
    float hot=step(.65,seed);
    vec3 tint=mix(vec3(.36,.34,.31),ember,hot);
    ash+=tint*(mote+halo*hot)*fade*step(id+.5,density)*glow;
  }
  float shade=1.-.32*(1.-smoothstep(0.,.5,uv.y));
  gl_FragColor=vec4(rock*shade+ash*enabled,1.);
}`;

export default function StoneBackground(){
 const p=usePrototypeSettings('Камень и пепел',{
  ash:true, density:[39,0,48,1], speed:[.8,0,2,.05], wind:[-.2,-1,1,.05],
  glow:[1.2,0,2,.05], light:[.8, .4,1.8,.05], ember:'#bc7150',
  textureScale:[1.25,.5,2,.05], sharpness:[3,0,3,.05], contrast:[1.2,.5,2,.05],
 },{persist:{key:'companion:stone-ash:v3',storage:'localStorage'}});
 const host=useRef<HTMLDivElement>(null), settings=useRef(p);
 settings.current=p;
 useEffect(()=>{
  const parent=host.current;if(!parent)return;
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
  if(!gl)return;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{
   const shader=gl.createShader(type);if(!shader)return null;
   shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   return gl.getShaderParameter(shader,gl.COMPILE_STATUS)?shader:null;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  const program=gl.createProgram();
  const cleanupShaders=()=>{shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);};
  if(!vs||!fs||!program){cleanupShaders();return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){cleanupShaders();return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
  const names=['resolution','time','density','speed','wind','glow','light','enabled','ember','textureScale','sharpness','contrast'] as const;
  const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,disposed=false,last=0,elapsed=0;
  const contextLost=()=>{canvas.style.visibility='hidden';cancelAnimationFrame(frame);};
  canvas.addEventListener('webglcontextlost',contextLost);
  const draw=(now:number)=>{
   if(disposed)return;
   frame=requestAnimationFrame(draw);
   const delta=Math.min((now-last)/1000,.1);
   if(now-last<1000/30)return;
   last=now;
   if(document.hidden||gl.isContextLost())return;
   if(!reduced.matches)elapsed+=delta;
   const v=settings.current;
   gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
   gl.uniform1f(uniforms.time,elapsed);
   gl.uniform1f(uniforms.density,v.density);gl.uniform1f(uniforms.speed,v.speed);
   gl.uniform1f(uniforms.wind,v.wind);gl.uniform1f(uniforms.glow,v.glow);
   gl.uniform1f(uniforms.light,v.light);gl.uniform1f(uniforms.enabled,v.ash?1:0);
   gl.uniform1f(uniforms.textureScale,v.textureScale);
   gl.uniform1f(uniforms.sharpness,v.sharpness);gl.uniform1f(uniforms.contrast,v.contrast);
   const color=parseInt(v.ember.slice(1),16);
   gl.uniform3f(uniforms.ember,((color>>16)&255)/255,((color>>8)&255)/255,(color&255)/255);
   gl.drawArrays(gl.TRIANGLES,0,6);
  };
  const resize=()=>{
   const bounds=parent.getBoundingClientRect(),ratio=effectPixelRatio(bounds.width,bounds.height);
   canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));
   gl.viewport(0,0,canvas.width,canvas.height);
  };
  const observer=new ResizeObserver(resize);observer.observe(parent);resize();
  parent.appendChild(canvas);frame=requestAnimationFrame(draw);
  return()=>{
   disposed=true;cancelAnimationFrame(frame);observer.disconnect();
   canvas.removeEventListener('webglcontextlost',contextLost);canvas.remove();
   gl.deleteBuffer(buffer);cleanupShaders();
   gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
 },[]);
 return <div className="ambient stone-background" ref={host} aria-hidden="true"/>;
}
