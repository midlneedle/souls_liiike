import catalog from './tracks.json';
import voice from './voice.json';
import icons from './icons.json';
import {gothicPalette} from './gothicTheme';
export type Track = {
    id: string;
    title: string;
    artist: string;
    cover: string | null;
};
export type Entity = {
    id: string;
    title: string;
    kind: 'flow' | 'artist' | 'album' | 'playlist';
    color: string;
    cover?: string;
    icon?: string;
    trackIDs: string[];
};
export const tracks: Track[] = catalog;
export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${encodeURIComponent(name)}`;
export const iconURL = (name: string) => asset((icons as Record<string, string>)[name] ?? `${name}.svg`);
export const cardLines: Record<string, string> = voice.card;
export const playLines: Record<string, string> = voice.play;
export const defeatLines = voice.defeat;
export const flowTrapReturnLine = voice.flowTrapReturn;
export const entities: Entity[] = [
    { id: 'my-flow', title: 'Мой Поток', kind: 'flow', color: '#9b9eff', icon: 'wave', trackIDs: ['flume-toro-y-moi-the-difference', 'tame-impala-let-it-happen', 'burzum-dunkelheit', 'imanu-grabbitz-fire', 'imanu-hush', 'twenty-one-pilots-overcompensate'] },
    { id: 'billie-rilish', title: 'Billie Eilish', kind: 'artist', color: '#91c2b8', cover: 'bill.webp', trackIDs: ['billie-eilish-chihiro', 'billie-eilish-nda', 'billie-eilish-lovely', 'billie-eilish-wildflower'] },
    { id: 'justice', title: 'Neverender', kind: 'album', color: '#b5a7f7', cover: 'neverender.webp', trackIDs: ['justice-neverender', 'justice-one-night-all-night', 'justice-generator'] },
];
for(const entity of entities)entity.color=gothicPalette(entity.id).glowAccent;
export const getTrack = (id: string) => tracks.find(t => t.id === id);
export const entityTracks = (e: Entity) => e.trackIDs.map(getTrack).filter((t): t is Track => !!t);
export const mimicTrack = getTrack('velin-posle-nas')!;
export const flowTrapTrack = getTrack('burzum-dunkelheit')!;
export function replacement(e: Entity): Entity { return { ...e, kind: 'playlist', title: mimicTrack.title, cover: mimicTrack.cover ?? undefined, color: gothicPalette('mimic').glowAccent, trackIDs: [mimicTrack.id, ...e.trackIDs.filter(id => id !== mimicTrack.id)] }; }
