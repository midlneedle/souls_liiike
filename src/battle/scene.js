import * as T from 'three';
import {createScenePool} from './scenePool.js';
import {imageTexture,woodTexture} from '../mimic/scene.js';
import {createBattleModel} from './model.js';
import {createHybridRenderer} from '../mimic/hybridRenderer.js';
async function buildBattleScene(host,coverURL){
 const coverMap=coverURL?await imageTexture(coverURL):null;
 let renderer;
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});}catch(error){coverMap?.dispose();throw error;}
 renderer.setClearColor(0,0);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;host.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-190,190,220,-220,1,2000);camera.position.z=700;
 scene.add(new T.AmbientLight(0xc8c7bd,1.2));const key=new T.DirectionalLight(0xe8d8b1,2.1);key.position.set(-100,180,300);scene.add(key);const rim=new T.DirectionalLight(0x698bba,1.7);rim.position.set(180,30,-120);scene.add(rim);
 const model=createBattleModel({coverMap,woodMap:woodTexture()});scene.add(model.root);
 const hybrid=createHybridRenderer(renderer,scene,camera,model.root);
 let disposed=false,currentHost=host;
 const resize=()=>{const w=currentHost.clientWidth,h=currentHost.clientHeight;if(w<1||h<1)return;hybrid.resize(w,h);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();model.root.scale.setScalar(Math.min(1,Math.max(.5,(h-100)/300)));model.root.position.y=36;};resize();const observer=new ResizeObserver(resize);observer.observe(host);
 return {attach(nextHost){observer.disconnect();currentHost=nextHost;nextHost.appendChild(renderer.domElement);observer.observe(nextHost);resize();},detach(){observer.disconnect();renderer.domElement.remove();},render(state,visual,reduced){if(disposed)return;model.pose(state,visual,reduced);hybrid.render();},dispose(){if(disposed)return;disposed=true;observer.disconnect();hybrid.dispose();model.dispose();renderer.dispose();renderer.domElement.remove();}};
}

export const createBattleScene=createScenePool(buildBattleScene);
