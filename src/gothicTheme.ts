const accents:Record<string,string>={
 'my-flow':'#829C79',
 'billie-rilish':'#8397B4',
 justice:'#A49A7C',
 mimic:'#B35C54',
};
export function gothicPalette(id:string){
 const accent=accents[id]??'#B8B4AA';
 return {background:'#101112',backgroundDark:'#08090A',backgroundShade:'#0C0D0E',glowAccent:accent,surfaceAccent:'#242626',wavePlay:accent,wavePause:'#B8B4AA'};
}
