import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const result=await build({stdin:{contents:`import React from 'react';import {renderToString} from 'react-dom/server';import App from './src/App';export {entities} from './src/data';export default renderToString(React.createElement(App));`,resolveDir:root,loader:'tsx'},bundle:true,loader:{'.webp':'dataurl'},platform:'node',format:'cjs',write:false,define:{'import.meta.env.BASE_URL':JSON.stringify('./')}});
const mod={exports:{}};
new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));
const html=mod.exports.default;
for(const text of ['Мой Поток','Миниплеер','Основная навигация','Главная','Каталог','Моё','Сохранить трек'])if(!html.includes(text))throw Error(`Missing initial UI: ${text}`);
if(/<audio|<video|<canvas/.test(html))throw Error('Unexpected media or shader surface');
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
for(const t of tracks)if(t.cover&&!existsSync(path.join(root,'public/assets',t.cover)))throw Error(`Missing cover: ${t.cover}`);
const icons=JSON.parse(readFileSync(path.join(root,'src/icons.json'),'utf8'));
for(const name of ['wave','Organic','Electronic','Impulsive','Queue','ic_home','ic_catalog','avatar','return','equalizer'])if(!icons[name]||!existsSync(path.join(root,'public/assets',icons[name])))throw Error(`Missing icon: ${name}`);
const themedAssets=readFileSync(path.join(root,'src/gothicAssets.ts'),'utf8');
for(const match of themedAssets.matchAll(/from '(\.\.\/textures\/[^']+)'/g))if(!existsSync(path.resolve(root,'src',match[1])))throw Error(`Missing Gothic texture: ${match[1]}`);
for(const font of ['SourceSerifPro-Regular.otf','SourceSerifPro-Semibold.otf'])if(!existsSync(path.join(root,'font',font)))throw Error(`Missing font: ${font}`);
console.log('Initial React render OK; metadata covers and UI icons exist; no audio/video/canvas.');
