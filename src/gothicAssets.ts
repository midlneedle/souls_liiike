import background from '../textures/background.webp';
import ornament from '../textures/ornament.webp';
import flow from '../textures/Flow_icon.webp';
import pause from '../textures/pause_icon.webp';
import heart from '../textures/likee.webp';
import home from '../textures/catalog_icon.webp';
import search from '../textures/search_icon.webp';
import profile from '../textures/profile_icon.webp';
import playerFrame from '../textures/miniplayer_frame.webp';
import playRim from '../textures/play_button_rim.webp';
import play from '../textures/play_icon.webp';
import queue from '../textures/queue_icon.webp';

export const gothicAssets={background,ornament,flow,pause,heart,home,search,profile,playerFrame,playRim,play,queue};
export const texturedIcons:Record<string,string>={
 play,Play:play,pause,Pause:pause,heart,Like:heart,'heart-fill':heart,Favorite:heart,
 ic_home:home,ic_catalog:search,profile,wave:flow,Organic:flow,Electronic:flow,Impulsive:flow,
 Queue:queue,
};
