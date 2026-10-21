import {disc,rim} from './assets';
import pause from '../../textures/pause_icon.webp';

export default function OrnateClose({onClick,label='Закрыть',className=''}:{onClick:()=>void;label?:string;className?:string}){
 return <button type="button" className={`ornate-close ${className}`} aria-label={label} title={label} onClick={onClick}>
  <img className="ornate-close-disc" src={disc} alt="" draggable={false}/>
  <img className="ornate-close-rim" src={rim} alt="" draggable={false}/>
  <span className="ornate-close-mark" aria-hidden="true">
   <span className="ornate-close-stroke"><img src={pause} alt="" draggable={false}/></span>
   <span className="ornate-close-stroke"><img src={pause} alt="" draggable={false}/></span>
  </span>
 </button>;
}
