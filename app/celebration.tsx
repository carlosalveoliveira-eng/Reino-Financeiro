'use client';
import {useEffect} from 'react';
import {Sparkles,X} from 'lucide-react';
import {Companion} from './companion';
export type Celebration={title:string;xp:number;levelUp:boolean;index:number};
export function playChime(){try{const ctx=new AudioContext(),gain=ctx.createGain();gain.gain.setValueAtTime(.04,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.5);gain.connect(ctx.destination);[523.25,659.25,783.99].forEach((freq,i)=>{const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=freq;osc.connect(gain);osc.start(ctx.currentTime+i*.08);osc.stop(ctx.currentTime+.5)});setTimeout(()=>void ctx.close(),700)}catch{}}
export default function CelebrationToast({event,onClose}:{event:Celebration|null;onClose:()=>void}){useEffect(()=>{if(!event)return;const id=setTimeout(onClose,5500);return()=>clearTimeout(id)},[event,onClose]);if(!event)return null;return <div className="celebration-toast" role="status"><span className="celebration-sparkle" aria-hidden="true"><Sparkles/></span><Companion index={event.index} mood="happy" small/><div><small>{event.levelUp?'NOVO NÍVEL ALCANÇADO':'MAIS UM PASSO REAL'}</small><strong>{event.title}</strong><span>+{event.xp} XP · Seu progresso ficou registrado.</span></div><button className="icon-button" aria-label="Fechar celebração" onClick={onClose}><X size={16}/></button></div>}
