/** A stalled request must settle so the player can retry instead of waiting forever. */
export function withDeadline<T>(promise:Promise<T>,milliseconds=20000):Promise<T>{
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Loading timed out')),milliseconds);
  promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
 });
}
const images=new Map<string,Promise<HTMLImageElement>>();
export function loadImage(url:string){
 const cached=images.get(url);if(cached)return cached;
 const image=new Image();
 const promise=withDeadline(new Promise<HTMLImageElement>((resolve,reject)=>{
  image.onload=()=>{void (image.decode?.()??Promise.resolve()).then(()=>resolve(image),()=>resolve(image));};
  image.onerror=()=>reject(new Error('Image unavailable'));image.src=url;
 }),15000).catch(error=>{images.delete(url);throw error;});
 images.set(url,promise);return promise;
}
