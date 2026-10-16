import { iconURL, asset } from './data';
import type { Entity } from './data';
import {texturedIcons} from './gothicAssets';
import type {CSSProperties} from 'react';
import {useEffect} from 'react';
import {animate,motion,useMotionValue,useReducedMotion,useTransform} from 'motion/react';
import {PLAY_PAUSE_SPRING,playAmount,pauseAmount} from './playbackTransition';
export function PlaybackGlyph({playing,size=24,whiteMask=false}:{playing:boolean;size?:number;whiteMask?:boolean}){
    const progress=useMotionValue(playing?1:0),reduced=useReducedMotion();
    const play=useTransform(progress,playAmount),pause=useTransform(progress,pauseAmount);
    useEffect(()=>{
        if(reduced){progress.jump(playing?1:0);return;}
        const animation=animate(progress,playing?1:0,PLAY_PAUSE_SPRING);
        return()=>animation.stop();
    },[playing,reduced,progress]);
    return <span className="playback-glyph" style={{width:size,height:size}} aria-hidden="true"><motion.span style={{scale:play,opacity:play}}><Icon name="play" size={size} whiteMask={whiteMask}/></motion.span><motion.span style={{scale:pause,opacity:pause}}><Icon name="pause" size={size} whiteMask={whiteMask}/></motion.span></span>;
}
export function Icon({ name, size = 24, whiteMask = false }: {
    name: string;
    size?: number;
    whiteMask?: boolean;
}) {
    if(texturedIcons[name]&&whiteMask)return <span className={`texture-icon texture-${name} masked-texture-icon`} style={{'--icon-size':`${size}px`,'--icon-mask':`url("${texturedIcons[name]}")`} as CSSProperties} aria-hidden="true"><img src={texturedIcons[name]} alt="" draggable={false}/><i className="icon-white-overlay"/></span>;
    if(texturedIcons[name])return <img className={`texture-icon texture-${name}`} src={texturedIcons[name]} width={size} height={size} alt="" aria-hidden="true" draggable={false}/>;
    if(name==='play')return <Icon name="Play" size={size}/>;
    if(name==='pause')return <Icon name="Pause" size={size}/>;
    if(name==='heart')return <Icon name="Like" size={size}/>;
    if (name === 'heart-fill')
        return <svg width={size} height={size} viewBox="0 0 24 24" fill={name === 'heart-fill' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.2a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
    if (name === 'close')
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m6 6 12 12M6 18 18 6"/></svg>;
    if (name === 'back')
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m14 5-7 7 7 7"/></svg>;
    return <span aria-hidden="true" className="asset-icon" style={{ width: size, height: size, maskImage: `url("${iconURL(name)}")`, WebkitMaskImage: `url("${iconURL(name)}")` }}/>;
}
export function Artwork({ entity, small = false }: {
    entity: Entity;
    small?: boolean;
}) {
    return entity.cover ? <img draggable="false" className={`artwork ${entity.kind === 'artist' ? 'round' : ''}`} src={asset(entity.cover)} alt=""/> : <div className={`flow-art ${small ? 'small' : ''}`}><Icon name={entity.icon ?? 'wave'} size={small ? 46 : 110} whiteMask={small&&entity.id==='my-flow'}/></div>;
}
export function Glowie() { return <span className="glowie" aria-hidden="true"><i /><b /></span>; }
