import catalog from './tracks.json';
import voice from './voice.json';
import icons from './icons.json';
import palettes from './palettes.json';
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
export const entities: Entity[] = [
    { id: 'my-flow', title: 'Мой Поток', kind: 'flow', color: '#9b9eff', icon: 'wave', trackIDs: ['flume-toro-y-moi-the-difference', 'tame-impala-let-it-happen', 'imanu-grabbitz-fire', 'imanu-hush', 'twenty-one-pilots-overcompensate'] },
    { id: 'markul', title: 'Markul', kind: 'artist', color: '#bf8d78', cover: '1c662dc779cd12974a28eadce7a01dd0.jpg', trackIDs: ['friendly-thug-markul-skyscraper', 'markul-falling-in-love', 'markul-worst-friend', 'niker-markul-grey-gothic-city'] },
    { id: 'ready-flow-indie', title: 'Поток Инди', kind: 'flow', color: '#939aff', icon: 'Organic', trackIDs: ['tame-impala-new-person', 'phantogram-celebrating-nothing', 'tame-impala-borderline', 'tame-impala-let-it-happen'] },
    { id: 'billie-rilish', title: 'Billie Eilish', kind: 'artist', color: '#91c2b8', cover: 'bill.jpeg', trackIDs: ['billie-eilish-chihiro', 'billie-eilish-nda', 'billie-eilish-lovely', 'billie-eilish-wildflower'] },
    { id: 'indie-louder', title: 'Громче: Инди', kind: 'playlist', color: '#c4a3e5', cover: '8765433567.png', trackIDs: ['arctic-monkeys-do-i-wanna-know', 'twenty-one-pilots-overcompensate'] },
    { id: 'flow-electro', title: 'Поток Электроника', kind: 'flow', color: '#b599f4', icon: 'Electronic', trackIDs: ['seekae-test-and-recognise', 'imanu-rhode-all-too-late', 'imanu-grabbitz-fire', 'timis-love-you', 'imanu-hush'] },
    { id: 'favorite', title: 'Любимое', kind: 'playlist', color: '#dc8aaf', cover: 'дщму.png', trackIDs: ['mazoulew-tourist', 'billie-eilish-lovely', 'markul-falling-in-love', 'karim-harlamov-piano-improv-8', 'inaleryy-cxrgi-lost-my-way'] },
    { id: 'flow-hiphop', title: 'Поток Хип-хоп', kind: 'flow', color: '#ff9d72', icon: 'Impulsive', trackIDs: ['Travis_Scott_-_STARGAZING', 'Travis_Scott_-_sicko_mode', 'markul-falling-in-love', 'sqwoz-bab-tokyo'] },
    { id: 'justice', title: 'Neverender', kind: 'album', color: '#b5a7f7', cover: 'neverender.jpg', trackIDs: ['justice-neverender', 'justice-one-night-all-night', 'justice-generator'] },
];
for(const entity of entities)entity.color=palettes[entity.id as keyof typeof palettes].glowAccent;
export const getTrack = (id: string) => tracks.find(t => t.id === id);
export const entityTracks = (e: Entity) => e.trackIDs.map(getTrack).filter((t): t is Track => !!t);
export const mimicTrack = getTrack('markul-worst-friend')!;
export function replacement(e: Entity): Entity { return { ...e, kind: 'playlist', title: mimicTrack.title, cover: mimicTrack.cover ?? undefined, color: palettes.mimic.glowAccent, trackIDs: [mimicTrack.id, ...e.trackIDs.filter(id => id !== mimicTrack.id)] }; }
