import movie from '../../textures/vid/gemini_generated_video_9f966eb3_compressed.mp4';
import ready from '../../textures/generated/dislike-boss-ready.webp';
import defeated from '../../textures/generated/dislike-boss-defeated-v1.webp';
import {loadImage} from '../loading';
export {movie,ready,defeated};
export function preloadVideoDuel(){
 const video=document.createElement('video');video.preload='auto';video.muted=true;video.playsInline=true;video.src=movie;video.load();
 void Promise.all([loadImage(ready),loadImage(defeated)]).catch(()=>{});
 return()=>{video.removeAttribute('src');video.load();};
}
