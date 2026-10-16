import { iconURL, asset } from './data';
import type { Entity } from './data';
export function Icon({ name, size = 24 }: {
    name: string;
    size?: number;
}) {
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
    return entity.cover ? <img draggable="false" className={`artwork ${entity.kind === 'artist' ? 'round' : ''}`} src={asset(entity.cover)} alt=""/> : <div className={`flow-art ${small ? 'small' : ''}`}><Icon name={entity.icon ?? 'wave'} size={small ? 46 : 110}/></div>;
}
export function Glowie() { return <span className="glowie" aria-hidden="true"><i /><b /></span>; }
