import * as T from 'three';

/** Artwork stays crisp but still respects hands/teeth in the low-resolution depth buffer. */
export function prepareSharpArtwork(root,depthTexture,resolution){
 const materials=new Set();root.traverse(o=>{if(o.isMesh&&o.layers.isEnabled(1))materials.add(o.material);});
 for(const material of materials){
  material.onBeforeCompile=shader=>{
   shader.uniforms.retroDepth={value:depthTexture};shader.uniforms.outputResolution={value:resolution};
   shader.fragmentShader='uniform sampler2D retroDepth;\nuniform vec2 outputResolution;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    float foregroundDepth=texture2D(retroDepth,gl_FragCoord.xy/outputResolution).x;
    if(gl_FragCoord.z>foregroundDepth+0.00001) discard;`);
  };
  material.customProgramCacheKey=()=> 'sharp-artwork-depth-v1';material.needsUpdate=true;
 }
}
export function createHybridRenderer(renderer,scene,camera,root){
 const target=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true});
 target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.depthTexture.minFilter=T.NearestFilter;target.depthTexture.magFilter=T.NearestFilter;
 const outputResolution=new T.Vector2();
 const copyScene=new T.Scene(),copyCamera=new T.OrthographicCamera(-1,1,1,-1,.1,10);copyCamera.position.z=1;
 const copyMaterial=new T.MeshBasicMaterial({map:target.texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const quad=new T.Mesh(new T.PlaneGeometry(2,2),copyMaterial);copyScene.add(quad);
 renderer.autoClear=false;prepareSharpArtwork(root,target.depthTexture,outputResolution);
 function resize(width,height){renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(width,height,false);renderer.getDrawingBufferSize(outputResolution);target.setSize(Math.max(1,Math.round(width/2)),Math.max(1,Math.round(height/2)));}
 return {resize,render(){
  const originalMask=camera.layers.mask;
  camera.layers.set(0);renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
  renderer.setRenderTarget(null);renderer.clear();renderer.render(copyScene,copyCamera);renderer.clearDepth();
  camera.layers.set(1);renderer.render(scene,camera);camera.layers.mask=originalMask;
 },dispose(){target.dispose();target.depthTexture.dispose();quad.geometry.dispose();copyMaterial.dispose();}};
}
