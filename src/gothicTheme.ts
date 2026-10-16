const accents:Record<string,string>={
 'my-flow':'#829C79',
 markul:'#AC6962',
 'ready-flow-indie':'#A08AAC',
 'billie-rilish':'#8397B4',
 'indie-louder':'#A192AE',
 'flow-electro':'#829DB5',
 favorite:'#A66B70',
 'flow-hiphop':'#B38858',
 justice:'#A49A7C',
 mimic:'#B35C54',
};
export function gothicPalette(id:string){
 const accent=accents[id]??'#B8B4AA';
 return {background:'#101112',backgroundDark:'#08090A',backgroundShade:'#0C0D0E',glowAccent:accent,surfaceAccent:'#242626',wavePlay:accent,wavePause:'#B8B4AA'};
}
