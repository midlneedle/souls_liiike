// Preserve the native 160px carousel cards while fitting the Gothic composition.
export function nativeLayout(height:number,safeTop=0,safeBottom=0,dockVisible=true){
 const viewportHeight=Math.max(height,646+safeTop+safeBottom);
 const bubbleHeight=80;
 const topLimit=safeTop+16;
 const miniPlayerTop=viewportHeight-safeBottom-20-(dockVisible?64:0)-110;
 const available=Math.max(0,miniPlayerTop-topLimit);
 const playHeight=196;
 const compactHeight=bubbleHeight+playHeight+160;
 const extra=Math.max(0,available-compactHeight);
 // At full height the headline sits lower, like the reference. Safari's bars
 // consume this breathing room before any artwork needs to become smaller.
 const topSpace=Math.min(96,extra*.5);
 const gap=Math.min(24,(extra-topSpace)*.35);
 const growth=Math.min(20,Math.max(0,extra-topSpace-gap)*.15);
 const carouselHeight=160+growth;
 const contentTop=topLimit+topSpace;
 const stageTop=contentTop+bubbleHeight;
 const carouselTop=stageTop+playHeight+gap;
 const feedTop=carouselTop+carouselHeight;
 const feedHeight=Math.max(0,miniPlayerTop-feedTop);
 return {stageTop,stageScale:1,carouselTop,carouselHeight,feedTop,feedHeight,bubbleHeight};
}
