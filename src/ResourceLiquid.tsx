import {useEffect,useRef} from 'react';
import type {ReactNode} from 'react';
import {resourceArc,squareResourceArc,resourceFill,RESOURCE_RIM} from './resourceRimGeometry';
import {liquidVertex,liquidFragment} from './resourceLiquidShader';

// One small GPU surface for both channels; metal remains a separate layer above it.
export default function ResourceLiquid({stamina,health,square,children}:{stamina:number;health:number;square:boolean;children:ReactNode}){
 const host=useRef<HTMLSpanElement>(null),values=useRef({stamina,health});values.current={stamina,health};
 useEffect(()=>{
  const parent=host.current;if(!parent)return;
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:false,powerPreference:'low-power'});
  if(!gl)return;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type);if(!shader)return null;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(gl.getShaderParameter(shader,gl.COMPILE_STATUS))return shader;console.warn('Resource liquid shader:',gl.getShaderInfoLog(shader));return null;};
  const vs=compile(gl.VERTEX_SHADER,liquidVertex),fs=compile(gl.FRAGMENT_SHADER,liquidFragment),program=gl.createProgram();
  const cleanup=()=>{shaders.forEach(shader=>gl.deleteShader(shader));if(program)gl.deleteProgram(program);};
  if(!vs||!fs||!program){cleanup();return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){cleanup();return;}
  const map=document.createElement('canvas');map.width=map.height=1024;
  const ctx=map.getContext('2d');if(!ctx){cleanup();return;}
  ctx.scale(2,2);ctx.lineWidth=square?10:RESOURCE_RIM.width;ctx.lineCap='round';ctx.strokeStyle='#fff';
  // Only coverage is rasterized. Motion uses continuous analytic coordinates in GLSL.
  for(const side of ['left','right'] as const){
   ctx.stroke(new Path2D((square?squareResourceArc:resourceArc)(side)));
  }
  const texture=gl.createTexture(),buffer=gl.createBuffer();
  if(!texture||!buffer){if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);cleanup();return;}
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,map);
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const names=['channels','levels','time','square','agitation','pixel'] as const;
  const uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program,name)]));
  gl.uniform1i(uniforms.channels,0);gl.uniform1f(uniforms.square,square?1:0);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const current={stamina:resourceFill(values.current.stamina),health:resourceFill(values.current.health)};
  let frame=0,last=0,time=0,agitation=0,visible=true;
  const lost=(event:Event)=>{event.preventDefault();canvas.style.visibility='hidden';parent.classList.remove('liquid-ready');cancelAnimationFrame(frame);};
  canvas.addEventListener('webglcontextlost',lost);
  const resize=()=>{const bounds=parent.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.pixel,512/canvas.width);};
  const observer=new ResizeObserver(resize);observer.observe(parent);resize();
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;});intersection.observe(parent);
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw);
   const delta=Math.min(.1,(now-last)/1000);last=now;
   if(document.hidden||!visible||gl.isContextLost())return;
   if(!reduced.matches)time+=delta;
   const smoothing=reduced.matches?1:1-Math.exp(-delta*11);
   let change=0;
   for(const key of ['stamina','health'] as const){const target=resourceFill(values.current[key]);change+=Math.abs(target-current[key]);current[key]+=(target-current[key])*smoothing;}
   agitation=reduced.matches?0:Math.min(1,agitation*Math.exp(-delta*3)+change*.6);
   gl.uniform2f(uniforms.levels,current.stamina,current.health);gl.uniform1f(uniforms.time,time);
   gl.uniform1f(uniforms.agitation,agitation);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);
   parent.classList.add('liquid-ready');
  };
  parent.appendChild(canvas);frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.remove();parent.classList.remove('liquid-ready');gl.deleteTexture(texture);gl.deleteBuffer(buffer);cleanup();gl.getExtension('WEBGL_lose_context')?.loseContext();};
 },[square]);
 return <span ref={host} className="resource-liquid" aria-hidden="true">{children}</span>;
}
