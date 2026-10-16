// SwiftUI component sizes, fitted to the browser's visible viewport.
// The native scene's 112px top navigation reserve is absent on this page.
export function nativeLayout(height:number,safeTop=0,safeBottom=0,bubbleHeight=87){
 const playHeight=196,topLimit=safeTop+16;
 const compactHeight=bubbleHeight+playHeight+160;
 const miniPlayerTop=height-safeBottom-20-80-64;
 // Safari's browser bars reduce the viewport. Use the prompt's spare space
 // before changing any of the central components' sizes.
 const feedHeight=Math.max(32,Math.min(80,miniPlayerTop-topLimit-compactHeight));
 const contentBottom=miniPlayerTop-feedHeight;
 const available=Math.max(0,contentBottom-topLimit);
 let extra=Math.max(0,available-compactHeight);
 const bottomGap=Math.min(extra,40);extra-=bottomGap;
 const gap=Math.min(extra,24);extra-=gap;
 const growth=Math.min(extra,60);extra-=growth;
 const carouselHeight=160+growth;
 const contentHeight=bubbleHeight+playHeight+gap+carouselHeight;
 const anchored=contentBottom-bottomGap-contentHeight;
 const contentTop=extra>0?Math.max(topLimit,topLimit+Math.max(0,available-40-contentHeight)*.5):Math.max(topLimit,anchored);
 return {stageTop:contentTop+bubbleHeight,carouselTop:contentTop+bubbleHeight+playHeight+gap,carouselHeight,feedTop:contentBottom,feedHeight,bubbleHeight};
}
