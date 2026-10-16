// PreviewEntityCarousel.swift: itemSize 160, spacing -6, sensitivity .62.
export const CAROUSEL_STEP = 154;
export function cardGeometry(virtualIndex:number, position:number) {
 const offset=virtualIndex*CAROUSEL_STEP-position;
 const progress=Math.max(-1,Math.min(1,offset/CAROUSEL_STEP));
 const scale=1-.125*Math.abs(progress);
 return {offset,scale,rotation:-progress*4,compensation:Math.min(1/scale,1.16)};
}
export function snapDelta(translation:number,predictedExtra:number,count:number) {
 const raw=-(translation*.62+predictedExtra*.28)/CAROUSEL_STEP;
 const rounded=Math.sign(raw)*Math.round(Math.abs(raw));
 const maxJump=Math.max(1,Math.min(count-1,3));
 return Math.abs(raw)<.34?0:Math.max(-maxJump,Math.min(maxJump,rounded));
}
export function springForDistance(distance:number) {
 const response=.46+Math.min(Math.abs(distance),3)*.06;
 const frequency=2*Math.PI/response;
 return {type:'spring' as const,stiffness:frequency*frequency,damping:2*.86*frequency,mass:1};
}

// Choose the adjacent occurrence of an entity, never rewind to the first loop.
export function nearestVirtualIndex(index:number,around:number,count:number){
 const normalized=(index%count+count)%count;
 return normalized+Math.round((around-normalized)/count)*count;
}
