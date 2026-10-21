import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const result=await build({stdin:{contents:`import React from 'react';import {renderToString} from 'react-dom/server';import App from './src/App';export {entities,mimicTrack,flowTrapTrack} from './src/data';export {texturedIcons} from './src/gothicAssets';export const screens=Object.fromEntries(['mimic','dislike','invasion','video'].map(initialScreen=>[initialScreen,renderToString(React.createElement(App,{initialScreen}))]));export const cat=screens.video;export default renderToString(React.createElement(App));`,resolveDir:root,loader:'tsx'},bundle:true,loader:{'.webp':'dataurl','.mp4':'dataurl','.svg':'dataurl'},platform:'node',format:'cjs',write:false,define:{'import.meta.env.BASE_URL':JSON.stringify('./')}});
const mod={exports:{}};
new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));
const html=mod.exports.default;
for(const text of ['Выбор сценария','Мимик','Дизлайк','Вторжение','Закрыть'])if(!html.includes(text))throw Error(`Missing initial UI: ${text}`);
if(/<audio|<video|<canvas/.test(html))throw Error('Unexpected media or shader surface');
const {screens,cat}=mod.exports;
for(const text of ['ДЛЯ РИЛАКСА','МУЗЫКАЛЬНЫЙ ПОТОК','scenario-play','mimic-frame-close','Миниплеер','Основная навигация','Главная','Каталог','Моё'])if(!screens.mimic.includes(text))throw Error(`Missing mimic UI: ${text}`);
if(screens.mimic.includes('entity-card')||screens.mimic.includes('carousel'))throw Error('Old carousel remains on mimic screen');
for(const text of ['Дизлайк нужно заслужить.','Вызвать на бой','Пусть играет'])if(!screens.dislike.includes(text))throw Error(`Missing dislike UI: ${text}`);
for(const text of ['В ваш мир вторгся','The Last','Bachelor','of Lothric','Принять вызов','Отказаться'])if(!screens.invasion.includes(text))throw Error(`Missing invasion UI: ${text}`);
if(!cat.includes('<video')||!cat.includes('playsInline')||!cat.includes('cat-dialog'))throw Error('Cat video must play inline on its page');
for(const text of ['cat-page','cat-video-window','cat-frame','cat-frame-close','Закрыть видео'])if(!cat.includes(text))throw Error(`Missing framed cat video UI: ${text}`);
for(const match of html.matchAll(/(?:src="|url\(&quot;)(\.\/assets\/[^"&]+)/g)){
 const filename=decodeURIComponent(match[1].replace('./assets/',''));
 if(!existsSync(path.join(root,'public/assets',filename)))throw Error(`Missing asset: ${filename}`);
}
for(const entity of mod.exports.entities){
 if(entity.cover&&!existsSync(path.join(root,'public/assets',entity.cover)))throw Error(`Missing collection cover: ${entity.cover}`);
 if(entity.kind==='flow'&&entity.id!=='my-flow'&&!entity.cover)throw Error(`Missing genre artwork: ${entity.id}`);
}
if(html.includes('settings-pill'))throw Error('Removed settings button is still present');
const tracks=JSON.parse(readFileSync(path.join(root,'src/tracks.json'),'utf8'));
if(mod.exports.entities.map(e=>e.id).join(',')!=='my-flow,billie-rilish,justice')throw Error('Unexpected carousel sections');
const trackIDs=new Set(tracks.map(t=>t.id));
for(const entity of mod.exports.entities)for(const id of entity.trackIDs)if(!trackIDs.has(id))throw Error(`Missing queue track: ${id}`);
if(!mod.exports.mimicTrack||!trackIDs.has(mod.exports.mimicTrack.id))throw Error('Missing mimic replacement track');
const flowIDs=mod.exports.entities.find(e=>e.id==='my-flow').trackIDs;
if(!mod.exports.flowTrapTrack||!flowIDs.includes(mod.exports.flowTrapTrack.id))throw Error('Missing calm-music trap track');
if(html.includes('Burzum')||html.includes('Dunkelheit'))throw Error('Flow trap is revealed before playback');
for(const t of tracks)if(t.cover&&!existsSync(path.join(root,'public/assets',t.cover)))throw Error(`Missing cover: ${t.cover}`);
const icons=JSON.parse(readFileSync(path.join(root,'src/icons.json'),'utf8'));
for(const name of ['Popular','Unfamiliar'])if(!icons[name]||!existsSync(path.join(root,'public/assets',icons[name])))throw Error(`Missing settings icon: ${name}`);
for(const name of ['wave','Queue','ic_home','ic_catalog','profile','Favorite','play','pause','heart'])if(!mod.exports.texturedIcons[name])throw Error(`Missing textured icon: ${name}`);
for(const [name,file] of Object.entries(icons))if(!existsSync(path.join(root,'public/assets',file)))throw Error(`Missing icon asset: ${name} -> ${file}`);
for(const file of readdirSync(path.join(root,'src'))){
 if(!/\.(?:tsx?|js|css)$/.test(file))continue;
 const source=readFileSync(path.join(root,'src',file),'utf8');
 const references=[...source.matchAll(/asset\(['"]([^'"]+)['"]\)/g),...source.matchAll(/public\/assets\/([^'")]+)/g)];
 for(const match of references)if(!existsSync(path.join(root,'public/assets',match[1])))throw Error(`Missing static asset in ${file}: ${match[1]}`);
}
const themedAssets=readFileSync(path.join(root,'src/gothicAssets.ts'),'utf8');
for(const match of themedAssets.matchAll(/from '(\.\.\/textures\/[^']+)'/g))if(!existsSync(path.resolve(root,'src',match[1])))throw Error(`Missing Gothic texture: ${match[1]}`);
for(const font of ['SourceSerifPro-Regular.otf','SourceSerifPro-Semibold.otf'])if(!existsSync(path.join(root,'font',font)))throw Error(`Missing font: ${font}`);
if(!existsSync(path.join(root,'public/music/bellkeeper.mp3')))throw Error('Missing rhythm audio excerpt');
if(cat.includes('scenario-menu-options')||cat.includes('aria-modal'))throw Error('Video must be a separate page, not an overlay on the menu');
console.log('Menu, scenarios and separate video page render; video plays inline; assets exist.');
