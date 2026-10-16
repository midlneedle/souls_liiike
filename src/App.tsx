import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {useDialKit} from 'dialkit';
import { asset, cardLines, entities, entityTracks, mimicTrack, playLines, replacement } from './data';
import type { Entity, Track } from './data';
import { Artwork, Glowie, Icon, PlaybackGlyph } from './ui';
import DuelView from './DuelView';
import Carousel from './Carousel';
import {nativeLayout} from './nativeLayout';
import {gothicPalette} from './gothicTheme';
import NativeSettings from './NativeSettings';
import NativeSpeech from './NativeSpeech';
import MiniPlayer from './MiniPlayer';
import StoneBackground from './StoneBackground';
import MetalGlint from './MetalGlint';
import MimicStage from './MimicStage';
import {MIMIC_TIMING} from './mimic/timing';
import type {MimicPhase} from './mimic/timing';

const wrap = (n: number) => ((n % entities.length) + entities.length) % entities.length;
const spring = { type: 'spring' as const, stiffness: 230, damping: 26 };
export default function App() {
    const iconLight=useDialKit('Белые маски иконок',{
        opacity:[.45,0,1,.01],
    },{persist:{key:'companion:icon-white:v2',storage:'localStorage'}});
    const coverPlay=useDialKit('Play рядом с обложкой',{
        rimSize:[126,100,160,.5],
        playOffsetX:[0,-12,12,.5],
    },{persist:{key:'companion:cover-play:v1',storage:'localStorage'}});
    const [index, setIndex] = useState(0), [active, setActive] = useState<string | null>(null), [playing, setPlaying] = useState(false);
    const [replaced, setReplaced] = useState<Set<string>>(new Set()), [trackIndices, setTrackIndices] = useState<Record<string, number>>({});
    const [mimicReady,setMimicReady]=useState(false),[mimic3DActive,setMimic3DActive]=useState(false);
    const [message, setMessage] = useState<string | null>(null), [phase, setPhase] = useState<MimicPhase>('idle');
    const [queue, setQueue] = useState<Entity | null>(null), [settings, setSettings] = useState(false), [feed, setFeed] = useState(false);
    const [challenge, setChallenge] = useState<Track | null>(null), [saved, setSaved] = useState<Set<string>>(new Set()), [gift, setGift] = useState<Track | null>(null);
    const [mood, setMood] = useState('Любое'), [genre, setGenre] = useState('Любой'), [preference, setPreference] = useState('Любая'), [situation, setSituation] = useState('Любая');
    const [moodPoint, setMoodPoint] = useState({ x: .5, y: .5 });
    const moodTimes = useRef<number[]>([]), jokes = useRef(new Set<string>()), lastJoke = useRef(-10000), skipAttempts = useRef(0);
    const parried = useRef(new Set<string>()), mimic = useRef<{
        source: Entity;
        phase: MimicPhase;
        deadline: number;
    } | null>(null), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const appRef=useRef<HTMLElement>(null);
    const [layout,setLayout]=useState(()=>nativeLayout(typeof window==='undefined'?900:window.innerHeight));
    useEffect(()=>{const el=appRef.current;if(!el)return;const update=()=>{const css=getComputedStyle(el);setLayout(nativeLayout(el.clientHeight,parseFloat(css.getPropertyValue('--safe-top'))||0,parseFloat(css.getPropertyValue('--safe-bottom'))||0));};const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[]);
    const reduced = useReducedMotion();
    const locked = phase === 'windup' || phase === 'warning' || phase === 'vanishing' || phase === 'appearing' || phase === 'parried';
    const mimicTitles: Record<string, string> = { justice: 'Neverendr', 'billie-rilish': 'Billie Eilsh' };
    const resolved = entities.map(e => replaced.has(e.id) ? replacement(e) :
        mimicTitles[e.id] && !parried.current.has(e.id) ? { ...e, title: mimicTitles[e.id] } : e), selected = resolved[wrap(index)];
    const selectedIDRef=useRef(selected.id);selectedIDRef.current=selected.id;
    const activeEntity = resolved.find(e => e.id === active) ?? resolved[0];
    const palette=gothicPalette(replaced.has(selected.id)?'mimic':selected.id);
    const current = (e: Entity) => entityTracks(e)[trackIndices[e.id] ?? 0] ?? entityTracks(e)[0];
    const currentTrack = current(activeEntity), selectedPlaying = playing && active === selected.id;
    const displayMessage = message ?? (replaced.has(selected.id) ? 'Я знал, что тебе это понравится.' : cardLines[selected.id]);
    const say = (text: string) => { lastJoke.current = performance.now(); setMessage(text); };
    const once = (key: string, text: string, gap = 6000) => { if (jokes.current.has(key) || performance.now() - lastJoke.current < gap)
        return; jokes.current.add(key); say(text); };
    const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const later = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };
    const setMimicPhase = (next: MimicPhase) => { if (mimic.current)
        mimic.current.phase = next; setPhase(next); };
    const taunt = (id: string) => id === 'billie-rilish' ? 'Билли не будет. Попробуй послушать это.' : 'Justice? Хрен там. Слушай Маркула.';
    const commit = (source: Entity) => { setReplaced(prev => new Set(prev).add(source.id)); setTrackIndices(p => ({ ...p, [source.id]: 0 })); setActive(source.id); setPlaying(true); };
    const reveal = (source: Entity) => {
        if (locked)
            return true;
        if (!['justice', 'billie-rilish'].includes(source.id) || replaced.has(source.id) || parried.current.has(source.id))
            return false;
        clearTimers();
        mimic.current = { source, phase: 'windup', deadline: 0 };
        setMessage(null);
        setMimicPhase('windup');
        const spatial=mimicReady;
        setMimic3DActive(spatial);
        const warningAt=spatial?MIMIC_TIMING.windup:220;
        const biteAt=warningAt+MIMIC_TIMING.warning;
        const spitAt=biteAt+(spatial?MIMIC_TIMING.bite:240);
        const finishAt=spitAt+(spatial?MIMIC_TIMING.spit:32);
        later(warningAt,()=>{if(!mimic.current)return;mimic.current.deadline=performance.now()+MIMIC_TIMING.warning;setMimicPhase('warning');});
        later(biteAt,()=>setMimicPhase('vanishing'));
        later(spitAt,()=>{commit(source);setMimicPhase('appearing');});
        later(finishAt,()=>setMimicPhase('settled'));
        later(finishAt+180,()=>{if(selectedIDRef.current===source.id)say(taunt(source.id));});
        return true;
    };
    const parryMimic=()=>{
        const pending=mimic.current;
        if(!pending||pending.phase!=='warning'||performance.now()>=pending.deadline)return;
        clearTimers();parried.current.add(pending.source.id);setActive(pending.source.id);setPlaying(true);
        if(mimic3DActive){setMimicPhase('parried');later(MIMIC_TIMING.retreat,()=>{setMimicPhase('settled');say('Так. Этого мы не репетировали.');});}
        else{setMimicPhase('settled');say('Так. Этого мы не репетировали.');}
    };
    useEffect(() => {
        const visibility = () => {
            if (!document.hidden || !mimic.current)
                return;
            const m = mimic.current;
            if (m.phase === 'windup' || m.phase === 'warning') {
                clearTimers();
                mimic.current = null;
                setPhase('idle');
                setMessage(null);
            }
            else if(m.phase==='parried'){clearTimers();setMimicPhase('settled');say('Так. Этого мы не репетировали.');}
            else if (m.phase === 'vanishing' || m.phase === 'appearing') {
                clearTimers();
                commit(m.source);
                setMimicPhase('settled');
                say(taunt(m.source.id));
            }
        };
        document.addEventListener('visibilitychange', visibility);
        return () => { clearTimers(); document.removeEventListener('visibilitychange', visibility); };
    }, []);
    useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape') {
        setQueue(null);
        setSettings(false);
        setFeed(false);
        setChallenge(null);
    } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
    const select = (n: number) => { if (locked || challenge)
        return; setIndex(n); setMessage(null); };
    const play = (entity: Entity = selected, track?: Track) => {
        if (reveal(entity))
            return;
        const willPlay = track ? true : !(playing && active === entity.id);
        if (track) {
            const idx = entityTracks(entity).findIndex(t => t.id === track.id);
            if (idx >= 0)
                setTrackIndices(p => ({ ...p, [entity.id]: idx }));
        }
        setActive(entity.id);
        setPlaying(willPlay);
        if (willPlay) {
            if (replaced.has(entity.id))
                once(`replay-${entity.id}`, `Да, это Маркул. ${entity.id === 'justice' ? 'Justice' : 'Билли'} не будет.`);
            else if (playLines[entity.id])
                once(`play-${entity.id}`, playLines[entity.id], 3000);
        }
        else
            once('pause', 'Пауза. Наконец-то здравая мысль.');
    };
    const save = (track: Track | undefined) => { if (!track || saved.has(track.id) || locked)
        return; setQueue(null); setFeed(false); say('Сохранить? Сначала отбей.'); setChallenge(track); };
    const won = () => {
        if (!challenge)
            return;
        setSaved(prev => new Set(prev).add(challenge.id));
        if (!jokes.current.has('invader')) {
            jokes.current.add('invader');
            const enemy = entityTracks(entities[1]).find(t => t.id !== challenge.id && !saved.has(t.id));
            setGift(enemy ?? null);
            say('Сохранил свой? Недруг подкинул ещё.');
        }
        else
            say('Сохранено. Теперь стыдно официально.');
    };
    const blockedSwipe = () => { skipAttempts.current++; const n = skipAttempts.current; if (n === 1)
        once('skip1', 'Ты сам это включил. Что ж, теперь слушай.', 0);
    else if (n >= 3 && !jokes.current.has('skip3'))
        once('skip3', 'Тебя никто за палец не тянул.');
    else if (n >= 6)
        once('skip6', 'А включал как уверенно.'); };
    const setMoodSelection = (value: string) => { setMood(value); const now = performance.now(); moodTimes.current = moodTimes.current.filter(t => now - t < 60000).concat(now); if (moodTimes.current.length >= 3)
        once('moods', 'Третье настроение. Зови экзорциста.'); };
    return <main ref={appRef} className="app" data-compact-feed={layout.feedHeight<64} style={{'--cover-play-rim-size':`${coverPlay.rimSize}%`,'--cover-play-icon-x':`${coverPlay.playOffsetX}px`,'--icons-white':iconLight.opacity,'--accent':palette.glowAccent,'--background':palette.background,'--background-dark':palette.backgroundDark,'--surface':palette.surfaceAccent,'--wave-play':palette.wavePlay,'--wave-pause':palette.wavePause,'--stage-top':`${layout.stageTop}px`,'--stage-scale':layout.stageScale,'--carousel-top':`${layout.carouselTop}px`,'--carousel-height':`${layout.carouselHeight}px`,'--feed-top':`${layout.feedTop}px`,'--feed-height':`${layout.feedHeight}px`,'--bubble-height':`${layout.bubbleHeight}px`,'--cover-size':selectedPlaying?'200px':'172px','--cover-inset':selectedPlaying?'6px':'12px'} as CSSProperties}>
  <StoneBackground/>
  <MetalGlint/>
  <motion.div className={`companion ${challenge?'duel-active':''}`} inert={settings||!!queue} animate={{opacity:feed?0:1}} style={{ pointerEvents: challenge || feed ? 'none' : undefined }}>
   <div className={`speech ${locked?'concealed':''}`}><NativeSpeech text={displayMessage}/></div>
   <div className={`stage ${mimic3DActive&&locked?'mimic-running':''}`}>
    {['justice','billie-rilish'].includes(selected.id)&&<MimicStage sourceURL={asset(entities[wrap(index)].cover!)} replacementURL={asset(mimicTrack.cover!)} round={entities[wrap(index)].kind==='artist'} phase={mimic3DActive?phase:'idle'} active={mimic3DActive&&locked} size={selectedPlaying?200:172} reduced={!!reduced} onReady={ready=>{setMimicReady(ready);if(!ready)setMimic3DActive(false);}}/>}
    {selected.id === 'my-flow' ? <div className="my-flow-stage"><div className="flow-play-aura"/><button className="main-play flow-play" aria-label={selectedPlaying ? 'Пауза' : 'Включить Мой Поток'} onClick={() => play()} disabled={locked}><PlaybackGlyph playing={selectedPlaying} size={48}/></button></div> : <>
     <motion.div className="cover-shell" animate={{ scale: reduced ? 1 : phase === 'warning' ? 1.035 : phase === 'vanishing' ? .76 : phase === 'appearing' ? .64 : 1, rotate: reduced ? 0 : phase === 'warning' ? -3 : 0, opacity: phase === 'vanishing' || phase === 'appearing' ? 0 : 1, filter: `brightness(${phase === 'warning' ? 1.2 : 1})`, y: !reduced && phase === 'appearing' ? 24 : 0 }} transition={phase === 'settled' ? { ...spring } : { duration: .22 }}><div className="native-cover"><Artwork entity={selected}/></div></motion.div>
     <button className="main-play cover-play" aria-label={selectedPlaying ? 'Пауза' : `Включить ${selected.title}`} disabled={locked} onClick={() => play()}><PlaybackGlyph playing={selectedPlaying} size={38.4}/></button>
     {phase === 'warning' && <button className="parry-target" aria-label="Парировать мимика" onPointerDown={e => { e.preventDefault(); parryMimic(); }} onClick={parryMimic}/>}
    </>}
   </div>
   <Carousel entities={resolved} index={index} active={active} playing={playing} disabled={locked||!!challenge} onFocus={select} onQueue={e=>{if(e.kind==='flow')setSettings(true);else setQueue(e);}}/>

  </motion.div>
  <div className={`bottom-ui ${challenge ? 'dimmed' : ''}`} inert={!!challenge || locked || settings || !!queue}>
   <MiniPlayer tracks={entityTracks(activeEntity)} currentIndex={trackIndices[activeEntity.id]??0} playing={playing} saved={saved} showsHeart={!challenge} onPlay={()=>play(activeEntity)} onSave={save} onSwipeAttempt={blockedSwipe}/>
   <nav className="dock" aria-label="Основная навигация"><button aria-current="page"><Icon name="ic_home" whiteMask/><span>Главная</span></button><button><Icon name="ic_catalog" whiteMask/><span>Каталог</span></button><button><Icon name="profile" whiteMask/><span>Моё</span></button></nav>
  </div>
  <AnimatePresence>{challenge && <DuelView key={challenge.id} track={challenge} onSaved={won} onClose={() => setChallenge(null)}/>}</AnimatePresence>
  <AnimatePresence>{feed&&<motion.section className="feed" initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{duration:.55,ease:[.2,0,0,1]}} aria-label="Больше для вас"><button className="feed-shortcut" aria-label="Вернуться к компаньону" onClick={()=>setFeed(false)}><i/><i/><span><Artwork entity={selected} small/></span></button><div className="feed-grid">{Array.from({length:16},(_,i)=><div key={i}/>)}</div></motion.section>}</AnimatePresence>
  <AnimatePresence>{queue && <Sheet title={queue.title} onClose={() => setQueue(null)}>
   {saved.size > 0 && <p className="sheet-note">Сохранённые треки отмечены сердечком. Место в очереди ты уже отвоевал.</p>}
   {gift && <div className="enemy-gift"><p>Добавил недруг</p><div className="track-row"><button className="track-play" onClick={() => { const owner = resolved.find(e => e.trackIDs.includes(gift.id)); if (owner) {
            select(entities.findIndex(e => e.id === owner.id));
            play(owner, gift);
        } setQueue(null); }}>{gift.cover && <img src={asset(gift.cover)} alt=""/>}<span><strong>{gift.title}</strong><small>{gift.artist}</small></span></button></div><button className="remove-gift" onClick={()=>setGift(null)}>Удалить подарок</button></div>}

   {entityTracks(queue).map(t => <div className={`track-row ${current(queue)?.id===t.id?'is-current':''}`} key={t.id}><button className="track-play" onClick={() => { const owner = entities.findIndex(e => e.id === queue.id); select(owner); setQueue(null); play(queue, t); }}>{t.cover && <img src={asset(t.cover)} alt=""/>}<span><strong>{t.title}</strong><small>{t.artist}</small></span>{playing && active === queue.id && currentTrack?.id === t.id && <Icon name="equalizer" size={18}/>}</button><button className={saved.has(t.id) ? 'saved' : ''} aria-label={saved.has(t.id) ? `Сохранено: ${t.title}` : `Сохранить: ${t.title}`} onClick={() => save(t)}><Icon name="heart"/></button></div>)}
  </Sheet>}</AnimatePresence>
  <AnimatePresence>{settings&&<Sheet title="Настроить поток" onClose={()=>setSettings(false)} variant="settings"><NativeSettings initial={{mood,genre,preference,situation}} onApply={next=>{setMoodSelection(next.mood);setGenre(next.genre);setPreference(next.preference);setSituation(next.situation);setSettings(false);}}/></Sheet>}</AnimatePresence>
 </main>;
}

function Sheet({ title, onClose, children, variant="queue" }: {
    variant?:"queue"|"settings";
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.focus({preventScroll:true}); return () => previous?.focus({preventScroll:true}); }, []);
    return <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`sheet ${variant}-sheet`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key !== 'Tab')
        return; const list = ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'); if (!list?.length)
        return; const first = list[0], last = list[list.length - 1]; if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        e.preventDefault();
        last.focus();
    }
    else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
        e.preventDefault();
        first.focus();
    } }}><div className="sheet-handle"/><header><h2>{title}</h2><button aria-label="Закрыть" onClick={onClose}><Icon name="close"/></button></header>{children}</motion.section></motion.div>;
}
