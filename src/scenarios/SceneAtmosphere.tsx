import {effectPixelRatio} from '../renderBudget';
import {useEffect,useRef} from 'react';
import {useReducedMotion} from 'motion/react';

const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time,intensity,warm,definition,density,wind,glow,particles,particleSpeed,particleSize,particleGlow;
uniform vec3 tint;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
float noise(vec2 p){
 vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float n=cell.x+cell.y*57.;
 return mix(mix(hash(n),hash(n+1.),f.x),mix(hash(n+57.),hash(n+58.),f.x),f.y);
}
float fbm(vec2 p){
 float value=0.,amplitude=.5;
 for(int i=0;i<4;i++){value+=noise(p)*amplitude;p=p*2.03+vec2(7.1,3.7);amplitude*=.5;}
 return value;
}
void main(){
 vec3 color=vec3(0.);float alpha=0.;
 if(warm>.5){
  // Incandescent angular flakes rise from the fire and cool on the way up.
  // A narrow heat fringe surrounds a crisp core; there is no defocus pass.
  for(int i=0;i<192;i++){
   if(float(i)+.5>density)continue;
   float id=float(i),seed=hash(id+3.);
   float depth=hash(id+101.);
   float age=fract(hash(id+17.)+time*(.014+depth*.034));
   float x=fract(hash(id+81.)+wind*age*.35+sin(time*.3+id*2.+age*6.)*(.012+depth*.025));
   vec2 delta=(uv-vec2(x,age))*resolution;
   float radius=(.9+depth*depth*3.8)*resolution.y/650.;
   radius=max(.75,radius);
   if(dot(delta,delta)>radius*radius*5.)continue;
   float angle=time*(.35+seed)+id*2.4;
   vec2 flake=vec2(delta.x*cos(angle)-delta.y*sin(angle),delta.x*sin(angle)+delta.y*cos(angle));
   // Thin flakes turn edge-on, then expose their broad burnt surface again.
   flake.x/=max(.22,abs(cos(time*(.6+seed)+id)));
   vec2 q=flake/radius;
   float edge=max(max(q.x-.72,-q.x-.58),max(q.y-.9,-q.y-.7));
   edge=max(edge,dot(q,vec2(.65,.75))-(.55+seed*.25));
   edge=max(edge,dot(q,vec2(-.8,.6))-.68);
   float aa=.45/radius;
   float chip=1.-smoothstep(-aa,aa,edge);
   if(edge>.35)continue;
   float fade=smoothstep(0.,.12,age)*(1.-smoothstep(.82,1.,age));
   float flutter=.86+.14*sin(time*(2.+seed)+id);
   float grain=noise(q*3.+id*7.);
   float heat=clamp((1.-age)*.72+seed*.3,0.,1.)*flutter;
   vec3 emberColor=tint/max(max(tint.r,tint.g),max(tint.b,.001));
   vec3 ashTint=mix(vec3(.65,.045,.006),emberColor,heat);
   float core=(1.-smoothstep(-.6,-.1,edge))*(.7+grain*.3);
   ashTint=mix(ashTint,vec3(1.35,.91,.30),core*heat*.8);
   ashTint*=.85+grain*.2;
   float heatFringe=(1.-smoothstep(0.,.35,edge))*(1.-chip)*.09*heat;
   float a=(chip+heatFringe)*fade*mix(.7,1.,depth)*glow;
   color+=ashTint*a;alpha+=a;
  }
 }else{
  // Domain-warped, narrow blue wisps around the silhouette instead of a flat fog wash.
  vec2 p=uv*vec2(4.,6.);
  float warp=fbm(p+vec2(time*.08,-time*.12));
  float detail=fbm(p*2.1+warp*2.+vec2(-time*.1,time*.07));
  float edge=(1.-smoothstep(.04,.15,uv.x))+smoothstep(.85,.96,uv.x);
  float envelope=smoothstep(.04,.18,uv.y)*(1.-smoothstep(.85,.99,uv.y));
  float energy=0.,bloom=0.;
  for(int i=0;i<3;i++){
   float id=float(i);
   float bend=sin(uv.y*6.5+time*.25+id*2.)*.10+(warp-.5)*.19;
   float path=mix(.19,.81,step(.5,id))+bend;
   if(i==2)path=.5+sin(uv.y*5.-time*.19)*.28;
   float d=abs(uv.x-path);
   float pulse=.45+.55*sin(uv.y*8.-time*.5+id)*sin(uv.y*8.-time*.5+id);
   energy+=exp(-pow(d/(.0055/definition+.001),2.))*pulse;
   bloom+=exp(-pow(d/.037,2.))*pulse;
  }
  float filaments=pow(clamp(1.-abs(detail*2.-1.),0.,1.),9.*definition);
  float a=(energy*.5+bloom*.19+filaments*.13*(.3+edge))*envelope;
  vec3 blue=mix(tint,vec3(.65,.87,1.),clamp(energy*.45,0.,.65));
  color=blue*a;alpha=a*.8;
  for(int i=0;i<40;i++){
   float id=float(i);if(id+.5>particles)continue;
   float age=fract(hash(id+40.)+time*particleSpeed*(.015+hash(id+5.)*.016));
   float x=fract(hash(id+80.)+sin(age*5.+id+time*.1)*.07);
   vec2 delta=(uv-vec2(x,age))*resolution;
   float r=max(.9,resolution.y/550.*particleSize);
   float spark=exp(-dot(delta,delta)/(r*r))*sin(age*3.14159)*particleGlow;
   color+=mix(tint,vec3(.7,.9,1.),.5)*spark;alpha+=spark*.7;
  }
 }
 if(warm>.5){
  float opacity=1.-exp(-alpha*intensity);
  gl_FragColor=vec4(color/max(alpha,.0001)*opacity,opacity);
 }else gl_FragColor=vec4(color*intensity,min(alpha*intensity,.85));
}`;

/** Transparent WebGL: magic behind Mimic, crisp ash in front of the invader. */
type Props={theme:'mimic'|'invasion';intensity:number;speed:number;color:string;definition:number;density:number;wind:number;glow:number;particles:number;particleSpeed:number;particleSize:number;particleGlow:number};
export default function SceneAtmosphere(props:Props){
 const {theme,intensity,speed,color,definition,density,wind,glow}=props;
 const host=useRef<HTMLDivElement>(null),settings=useRef(props),repaint=useRef<(()=>void)|null>(null),reduced=useReducedMotion();
 settings.current=props;
 useEffect(()=>{
  const parent=host.current;if(!parent)return;
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)return;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const s=gl.createShader(type);if(!s)return null;shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;};
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();
  const cleanup=()=>{shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);};
  if(!vs||!fs||!program){cleanup();return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){cleanup();return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const attr=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['resolution','time','intensity','warm','tint','definition','density','wind','glow','particles','particleSpeed','particleSize','particleGlow'].map(n=>[n,gl.getUniformLocation(program,n)]));
  let frame=0,last=0,elapsed=0,disposed=false;
  const draw=(now:number)=>{
   if(disposed||document.hidden||gl.isContextLost())return;
   if(!reduced)frame=requestAnimationFrame(draw);
   if(last&&now-last<1000/30)return;
   const dt=last?Math.min((now-last)/1000,.1):0;last=now;if(!reduced)elapsed+=dt*settings.current.speed;
   gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform1f(uniforms.time,elapsed);
   gl.uniform1f(uniforms.intensity,settings.current.intensity);gl.uniform1f(uniforms.warm,theme==='invasion'?1:0);
   const v=settings.current,c=parseInt(v.color.slice(1),16);
   gl.uniform3f(uniforms.tint,((c>>16)&255)/255,((c>>8)&255)/255,(c&255)/255);
   gl.uniform1f(uniforms.definition,v.definition);gl.uniform1f(uniforms.density,v.density);
   gl.uniform1f(uniforms.wind,v.wind);gl.uniform1f(uniforms.glow,v.glow);
   gl.uniform1f(uniforms.particles,v.particles);gl.uniform1f(uniforms.particleSpeed,v.particleSpeed);
   gl.uniform1f(uniforms.particleSize,v.particleSize);gl.uniform1f(uniforms.particleGlow,v.particleGlow);
   gl.drawArrays(gl.TRIANGLES,0,6);
  };
  repaint.current=()=>{last=0;draw(performance.now());};
  const resize=()=>{const r=parent.getBoundingClientRect(),dpr=effectPixelRatio(r.width,r.height);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);if(reduced)draw(performance.now());};
  const visibility=()=>{cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(draw);};
  const contextLost=()=>{cancelAnimationFrame(frame);canvas.style.visibility='hidden';};
  canvas.addEventListener('webglcontextlost',contextLost);document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(parent);parent.appendChild(canvas);resize();if(!document.hidden)frame=requestAnimationFrame(draw);
  return()=>{disposed=true;repaint.current=null;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);canvas.remove();gl.deleteBuffer(buffer);cleanup();gl.getExtension('WEBGL_lose_context')?.loseContext();};
 },[theme,reduced]);
 useEffect(()=>{if(reduced)repaint.current?.();},[intensity,speed,color,definition,density,wind,glow,props.particles,props.particleSpeed,props.particleSize,props.particleGlow,reduced]);
 return <div ref={host} className="scene-atmosphere" aria-hidden="true"/>;
}
