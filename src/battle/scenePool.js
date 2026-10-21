/** Retain a released preview briefly so starting combat can reuse its compiled renderer. */
export function createScenePool(create,lifetime=2500){
 const idle=new Map();
 return async function acquire(host,key){
  let entry=idle.get(key);
  if(entry){idle.delete(key);clearTimeout(entry.timer);entry.scene.attach(host);}
  else entry={scene:await create(host,key),timer:null};
  let released=false;
  return {
   render(...args){if(!released)entry.scene.render(...args);},
   dispose(){
    if(released)return;released=true;entry.scene.detach();
    const previous=idle.get(key);if(previous){clearTimeout(previous.timer);previous.scene.dispose();}
    idle.set(key,entry);
    entry.timer=setTimeout(()=>{if(idle.get(key)===entry)idle.delete(key);entry.scene.dispose();},lifetime);
   },
  };
 };
}
