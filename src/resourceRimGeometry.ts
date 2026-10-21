// Matches the inspected transparent channels in play_button_resource_rim.webp.
export const RESOURCE_RIM={center:256,radius:176,width:18,start:18,end:162};
export function resourceFill(value:number){return Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;}
export function resourcePoint(angle:number){
 const radians=angle*Math.PI/180;
 return {x:RESOURCE_RIM.center+RESOURCE_RIM.radius*Math.sin(radians),y:RESOURCE_RIM.center-RESOURCE_RIM.radius*Math.cos(radians)};
}
export function resourceArc(side:'left'|'right'){
 const left=side==='left';
 const start=resourcePoint(left?360-RESOURCE_RIM.start:RESOURCE_RIM.start);
 const end=resourcePoint(left?360-RESOURCE_RIM.end:RESOURCE_RIM.end);
 return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${RESOURCE_RIM.radius} ${RESOURCE_RIM.radius} 0 0 ${left?0:1} ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

// The square frame follows the same top-to-bottom resource direction.
export function squareResourceArc(side:'left'|'right'){
 return side==='left'
  ? 'M 208 51 H 123 A 76 76 0 0 0 47 127 V 392 A 76 76 0 0 0 123 468 H 208'
  : 'M 304 51 H 389 A 76 76 0 0 1 465 127 V 392 A 76 76 0 0 1 389 468 H 304';
}
