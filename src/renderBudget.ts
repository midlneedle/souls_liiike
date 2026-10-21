/** Limit decorative shader work by pixel count, independently of the screen's Retina scale. */
export function effectPixelRatio(width:number,height:number,maxRatio=1.5){
 const hardware=typeof navigator!=='undefined'?navigator as Navigator&{deviceMemory?:number}:null;
 const constrained=!!hardware&&((hardware.deviceMemory!==undefined&&hardware.deviceMemory<=4)||(hardware.hardwareConcurrency>0&&hardware.hardwareConcurrency<=4));
 const budget=constrained?300000:600000;
 const deviceRatio=typeof devicePixelRatio==='number'?devicePixelRatio:1;
 return Math.max(.5,Math.min(deviceRatio,maxRatio,Math.sqrt(budget/Math.max(1,width*height))));
}
