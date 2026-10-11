// CODE FENIX — música original sintetizada en tiempo real (Web Audio). Nada de archivos externos.
// Metal sinfónico (coro, cuerdas, guitarras distorsionadas de power-chords, doble bombo) para título, prólogo y jefes.
// Techno oscuro (bombo constante, bajo oscuro, arpegios) para la exploración. Un tema por zona, con fundidos cruzados.
'use strict';
const MUS={bus:null,sfxBus:null,rev:null,dly:null,voices:[],want:null,timer:null,vol:0.7,sfxVol:0.8,dist:null};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function musicSetup(){
  const c=SFX.ctx; if(!c||MUS.bus) return;
  const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.attack.value=0.005; comp.release.value=0.2; comp.connect(c.destination);
  MUS.bus=c.createGain(); MUS.bus.gain.value=MUS.vol*0.55; MUS.bus.connect(comp);
  // reverb sintética (ruido con caída exponencial) y delay con retroalimentación
  const len=Math.floor(c.sampleRate*2.6), ir=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2); }
  MUS.rev=c.createConvolver(); MUS.rev.buffer=ir; const rg=c.createGain(); rg.gain.value=0.5; MUS.rev.connect(rg); rg.connect(MUS.bus);
  MUS.dly=c.createDelay(1.5); const fb=c.createGain(); fb.gain.value=0.38; const dlp=c.createBiquadFilter(); dlp.type='lowpass'; dlp.frequency.value=2400;
  MUS.dly.connect(dlp); dlp.connect(fb); fb.connect(MUS.dly); const dg=c.createGain(); dg.gain.value=0.45; dlp.connect(dg); dg.connect(MUS.bus);
  const curve=new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/512-1; curve[i]=Math.tanh(x*14)*0.9; } MUS.dist=curve;
  MUS.timer=setInterval(musicTick,25);
  if(MUS.want){ const w=MUS.want; MUS.want=null; playMusic(w); }
}
function setMusicVol(v){ MUS.vol=v; if(MUS.bus) MUS.bus.gain.setTargetAtTime(v*0.55,SFX.ctx.currentTime,0.05); }
function setSfxVol(v){ MUS.sfxVol=v; if(SFX.master) SFX.master.gain.value=SFX.muted?0:0.45*v; }
// Cambia de tema con fundido cruzado. name=null => silencio.
function playMusic(name,fadeT=2.2){
  if(MUS.want===name) return; MUS.want=name;
  const c=SFX.ctx; if(!c||!MUS.bus) return;
  const now=c.currentTime;
  for(const v of MUS.voices){ if(!v.dying){ v.dying=true; v.g.gain.cancelScheduledValues(now); v.g.gain.setValueAtTime(v.g.gain.value,now); v.g.gain.linearRampToValueAtTime(0.0001,now+fadeT); v.end=now+fadeT+0.1; } }
  if(!name||!TRACKS[name]) return;
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(TRACKS[name].gain||1,now+Math.min(fadeT,1.6)); g.connect(MUS.bus);
  const rs=c.createGain(); rs.gain.value=TRACKS[name].rev||0.3; g.connect(rs); rs.connect(MUS.rev);
  const ds=c.createGain(); ds.gain.value=0; ds.connect(MUS.dly);
  MUS.dly.delayTime.setValueAtTime(60/TRACKS[name].bpm*0.75,now);
  MUS.voices.push({name,g,ds,step:0,next:now+0.08,dying:false,tr:TRACKS[name]});
}
function musicTick(){
  const c=SFX.ctx; if(!c) return; const now=c.currentTime;
  MUS.voices=MUS.voices.filter(v=>{ if(v.dying&&now>v.end){ try{v.g.disconnect();}catch(e){} return false; } return true; });
  for(const v of MUS.voices){ if(v.dying) continue; const sd=60/v.tr.bpm/4;
    while(v.next<now+0.2){ try{ v.tr.play(v,v.step,v.next,sd); }catch(e){} v.step++; v.next+=sd; } }
}
// ---- instrumentos ----
function env(g,t,a,peak,dec,sus,rel,dur){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+a); g.gain.setTargetAtTime(peak*sus,t+a,dec); g.gain.setTargetAtTime(0.0001,t+dur,rel); }
function iKick(v,t,vol=1,tight=false){ const c=SFX.ctx, o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(tight?190:150,t); o.frequency.exponentialRampToValueAtTime(42,t+(tight?0.06:0.11));
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+(tight?0.16:0.38)); o.connect(g); g.connect(v.g); o.start(t); o.stop(t+0.45);
  iNoise(v,t,0.012,vol*0.35,3500,'highpass'); }
function iNoise(v,t,dur,vol,freq,type='bandpass',q=1,send=null){ const c=SFX.ctx, s=c.createBufferSource(); s.buffer=SFX.noiseBuf; const f=c.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
  const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur); s.connect(f); f.connect(g); g.connect(v.g); if(send) g.connect(send); s.start(t,Math.random()*0.4); s.stop(t+dur+0.02); }
function iSnare(v,t,vol=0.5){ iNoise(v,t,0.2,vol,1900,'bandpass',0.8); const c=SFX.ctx,o=c.createOscillator(),g=c.createGain(); o.type='triangle'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(140,t+0.08); g.gain.setValueAtTime(vol*0.7,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12); o.connect(g); g.connect(v.g); o.start(t); o.stop(t+0.15); }
function iClap(v,t,vol=0.4){ for(let i=0;i<3;i++) iNoise(v,t+i*0.011,0.06+i*0.05,vol,1300,'bandpass',1.4); }
function iHat(v,t,vol=0.12,open=false){ iNoise(v,t,open?0.22:0.035,vol,8200,'highpass',0.7); }
function iCrash(v,t,vol=0.25){ iNoise(v,t,1.6,vol,5200,'highpass',0.5); }
function iTom(v,t,m,vol=0.6){ const c=SFX.ctx,o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(mtof(m)*1.6,t); o.frequency.exponentialRampToValueAtTime(mtof(m),t+0.12); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.7); o.connect(g); g.connect(v.g); o.start(t); o.stop(t+0.75); iNoise(v,t,0.08,vol*0.3,600); }
function iBass(v,t,m,dur,cut=900,vol=0.32,res=6,type='sawtooth'){ const c=SFX.ctx, f=c.createBiquadFilter(), g=c.createGain(); f.type='lowpass'; f.Q.value=res;
  f.frequency.setValueAtTime(cut,t); f.frequency.exponentialRampToValueAtTime(Math.max(90,cut*0.18),t+dur*0.9);
  for(const [ty,mul,dt] of [[type,1,0],['square',0.5,0]]){ const o=c.createOscillator(); o.type=ty; o.frequency.value=mtof(m)*mul; o.connect(f); o.start(t); o.stop(t+dur+0.05); }
  env(g,t,0.004,vol,dur*0.5,0.6,0.02,dur); f.connect(g); g.connect(v.g); }
function iArp(v,t,m,dur,vol=0.09,type='square',cut=2600,send=0.5){ const c=SFX.ctx, o=c.createOscillator(), f=c.createBiquadFilter(), g=c.createGain(); o.type=type; o.frequency.value=mtof(m); f.type='lowpass'; f.frequency.setValueAtTime(cut,t); f.frequency.exponentialRampToValueAtTime(cut*0.3,t+dur); f.Q.value=3;
  env(g,t,0.003,vol,dur*0.4,0.3,0.03,dur); o.connect(f); f.connect(g); g.connect(v.g); if(send){ const s=c.createGain(); s.gain.value=send; g.connect(s); s.connect(MUS.dly); } o.start(t); o.stop(t+dur+0.2); }
function iBell(v,t,m,dur=2.5,vol=0.12){ const c=SFX.ctx; for(const [r,a] of [[1,1],[2.76,0.45],[5.4,0.25],[0.5,0.5]]){ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=mtof(m)*r; g.gain.setValueAtTime(vol*a,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur/r*1.2); o.connect(g); g.connect(v.g); o.start(t); o.stop(t+dur+0.1); } }
// pad / coro: sierras desafinadas por filtros de formante (vocal "a" / "o")
function iChoir(v,t,notes,dur,vol=0.06,vowel='a'){ const c=SFX.ctx; const F=vowel==='a'?[[800,0.9],[1150,0.5],[2900,0.18]]:[[450,1],[800,0.45],[2830,0.12]];
  const mix=c.createGain(); const out=c.createGain(); env(out,t,Math.min(0.9,dur*0.35),vol,dur,1,0.5,dur);
  for(const [fq,a] of F){ const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=fq; bp.Q.value=7; const ga=c.createGain(); ga.gain.value=a*2.2; mix.connect(bp); bp.connect(ga); ga.connect(out); }
  const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=5.2; lg.gain.value=4; lfo.connect(lg); lfo.start(t); lfo.stop(t+dur+2);
  for(const m of notes) for(const d of [-9,0,8]){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=mtof(m); o.detune.value=d; lg.connect(o.detune); o.connect(mix); o.start(t); o.stop(t+dur+2); }
  out.connect(v.g); }
function iStrings(v,t,notes,dur,vol=0.05,att=0.25){ const c=SFX.ctx, f=c.createBiquadFilter(), g=c.createGain(); f.type='lowpass'; f.frequency.value=2600; f.Q.value=0.6; env(g,t,att,vol,dur,1,0.35,dur);
  const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=5.6; lg.gain.value=6; lfo.connect(lg); lfo.start(t); lfo.stop(t+dur+1.5);
  for(const m of notes) for(const d of [-7,7]){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=mtof(m); o.detune.value=d; lg.connect(o.detune); o.connect(f); o.start(t); o.stop(t+dur+1.5); }
  f.connect(g); g.connect(v.g); }
// guitarra distorsionada: power-chord (tónica, quinta, octava) → saturación → "gabinete"
function iGuitar(v,t,m,dur,vol=0.07,palm=false){ const c=SFX.ctx, ws=c.createWaveShaper(); ws.curve=MUS.dist; ws.oversample='2x';
  const pre=c.createGain(); pre.gain.value=0.6; const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=90;
  const cab=c.createBiquadFilter(); cab.type='lowpass'; cab.frequency.value=palm?1300:3400; cab.Q.value=0.8; const mid=c.createBiquadFilter(); mid.type='peaking'; mid.frequency.value=800; mid.gain.value=-5;
  const g=c.createGain(); env(g,t,0.004,vol,palm?0.05:dur*0.8,palm?0.3:0.85,0.03,dur);
  for(const [iv,d] of [[0,-6],[0,6],[7,-4],[12,3]]){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=mtof(m+iv); o.detune.value=d; o.connect(pre); o.start(t); o.stop(t+dur+0.1); }
  pre.connect(hp); hp.connect(ws); ws.connect(mid); mid.connect(cab); cab.connect(g); g.connect(v.g); }
function iPad(v,t,notes,dur,vol=0.04,cut=700){ const c=SFX.ctx, f=c.createBiquadFilter(), g=c.createGain(); f.type='lowpass'; f.frequency.setValueAtTime(cut*0.5,t); f.frequency.linearRampToValueAtTime(cut,t+dur*0.5); f.frequency.linearRampToValueAtTime(cut*0.5,t+dur);
  env(g,t,dur*0.3,vol,dur,1,0.6,dur); for(const m of notes) for(const d of [-12,0,11]){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=mtof(m); o.detune.value=d; o.connect(f); o.start(t); o.stop(t+dur+2.5); }
  f.connect(g); g.connect(v.g); }
function iSub(v,t,m,dur,vol=0.25){ const c=SFX.ctx,o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.value=mtof(m); env(g,t,0.01,vol,dur,0.8,0.05,dur); o.connect(g); g.connect(v.g); o.start(t); o.stop(t+dur+0.3); }

// ---- composiciones ----
const bar=(s,n=16)=>Math.floor(s/n), pos=(s,n=16)=>s%n;
// acordes como [raíz grave, [notas del acorde]]
const TRACKS={
  // TÍTULO — "Himno de la Pira" (metal sinfónico, Re menor). Intro de coro y cuerdas, luego entra la banda.
  title:{bpm:112,gain:0.75,rev:0.35,play(v,s,t,sd){
    const prog=[[38,[62,65,69]],[34,[58,62,65]],[36,[60,64,67]],[33,[57,61,64]]]; const b=bar(s), p=pos(s), [r,ch]=prog[b%4], sec=Math.floor(b/4)%4;
    if(p===0){ iChoir(v,t,ch,sd*16,0.05,b%2?'o':'a'); iStrings(v,t,[ch[0]-12,ch[2]-12],sd*16,0.035,0.4); }
    const mel=[74,77,76,74, 70,74,72,70, 72,76,74,72, 73,76,81,79]; if(sec>=1&&p%4===0) iStrings(v,t,[mel[(b%4)*4+p/4]],sd*4,0.04,0.05);
    if(sec===0){ if(p===0) iTom(v,t,38,0.5); if(p===8&&b%2) iTom(v,t,33,0.4); return; }
    if(p===0&&b%4===0) iCrash(v,t,0.22);
    if(p%2===0) iGuitar(v,t,r+12,sd*1.8,0.05,p%8!==0); if(p===0||p===10) iGuitar(v,t,r+12,sd*6,0.06,false);
    if(sec>=2){ iKick(v,t,0.75,true); } else if(p%4===0||p===14) iKick(v,t,0.85,true);
    if(p===4||p===12) iSnare(v,t,0.45); if(p%2===0) iHat(v,t,0.06);
    iBass(v,t,r,sd*0.9,500,0.18,2);
  }},
  // PRÓLOGO / FINAL — "Responso" (coro y cuerdas, tambores rituales)
  prologue:{bpm:72,gain:1.1,rev:0.55,play(v,s,t,sd){
    const prog=[[38,[62,65,69]],[41,[60,65,69]],[34,[58,62,65]],[36,[60,64,67]]]; const b=bar(s), p=pos(s), [r,ch]=prog[b%4];
    if(p===0){ iChoir(v,t,ch,sd*16,0.055,'o'); iStrings(v,t,[r+12,r+24],sd*16,0.03,1.2); iSub(v,t,r,sd*16,0.14); }
    if(p===0||p===6||(p===12&&b%2)) iTom(v,t,r<36?33:38,0.5);
    if(b%2&&p===8) iStrings(v,t,[ch[2]+12],sd*8,0.03,0.6);
  }},
  ending:{bpm:66,gain:1.6,rev:0.6,play(v,s,t,sd){
    const prog=[[41,[65,69,72]],[36,[64,67,72]],[38,[62,65,69]],[34,[62,65,70]]]; const b=bar(s), p=pos(s), [r,ch]=prog[b%4];
    if(p===0){ iChoir(v,t,ch,sd*16,0.05,'a'); iStrings(v,t,[r+12,ch[0]-12],sd*16,0.03,1.0); }
    const mel=[77,76,74,72]; if(p===0||p===8) iStrings(v,t,[mel[b%4]+(p?-2:0)],sd*8,0.035,0.3);
    if(p%4===0) iArp(v,t,ch[(p/4)%3]+12,sd*3,0.04,'triangle',3000,0.6);
  }},
  // JEFA — "La Abadesa Hueca" (metal sinfónico rápido, Mi menor armónico, doble bombo)
  boss:{bpm:168,gain:0.5,rev:0.28,play(v,s,t,sd){
    const prog=[[40,[64,67,71]],[36,[60,64,67]],[38,[62,66,69]],[35,[63,66,71]]]; const b=bar(s), p=pos(s), [r,ch]=prog[b%4];
    iKick(v,t,0.7,true);
    if(p===4||p===12) iSnare(v,t,0.5); if(p%2===0) iHat(v,t,0.05); if(p===0&&b%2===0) iCrash(v,t,0.2);
    const gal=[1,0,1,1, 1,0,1,1, 1,0,1,1, 1,1,1,1]; if(gal[p]) iGuitar(v,t,r+12,sd*0.9,0.05,p%4!==0);
    if(p===0) iGuitar(v,t,r+12,sd*3,0.055,false);
    iBass(v,t,r,sd*0.8,400,0.16,2);
    if(p===0){ iChoir(v,t,ch,sd*16,0.05,b%4<2?'a':'o'); }
    const ost=[0,1,2,1]; if(p%2===0) iStrings(v,t,[ch[ost[(p/2)%4]]+12],sd*1.6,0.025,0.01);
    if(b%8>=4&&p%8===0) iBell(v,t,ch[0]+12,1.2,0.06);
  }},
  // ATRIO — "Nieve sobre la Orden" (techno oscuro, La menor, 124)
  atrio:{bpm:124,gain:1,rev:0.35,play(v,s,t,sd){
    const b=bar(s), p=pos(s), roots=[33,33,29,31], r=roots[b%4];
    if(p%4===0) iKick(v,t,0.9);
    if(p%4===2) iHat(v,t,0.09,true); else if(p%2===1) iHat(v,t,0.04);
    if(p%4!==0) iBass(v,t,r+(p%8===6?12:0),sd*0.9,700+Math.sin(s*0.05)*300,0.22,7);
    if(b>=4&&(p===4||p===12)) iClap(v,t,0.22);
    const arp=[57,60,64,67,64,60,62,64]; if(b>=2&&p%2===0&&(s*7)%5!==0) iArp(v,t,arp[(p/2)%8]+(b%4===2?-4:0)+12,sd*1.4,0.05,'square',2200+Math.sin(s*0.03)*1200,0.5);
    if(p===0&&b%2===0) iPad(v,t,[r+24,r+31,r+36],sd*32,0.03,800);
  }},
  // REFUGIO — "Brasa quieta" (ambient techno, lento y cálido)
  refugio:{bpm:92,gain:1.25,rev:0.5,play(v,s,t,sd){
    const b=bar(s), p=pos(s), prog=[[38,[62,65,69]],[34,[62,65,70]],[41,[60,65,69]],[36,[60,64,67]]], [r,ch]=prog[b%4];
    if(p===0||p===10) iKick(v,t,0.4); if(p%4===2) iHat(v,t,0.03);
    if(p===0) { iPad(v,t,ch,sd*16,0.035,1100); iSub(v,t,r,sd*14,0.12); }
    const a=[0,1,2,1,0,2,1,2]; if(p%2===0) iArp(v,t,ch[a[(p/2)%8]]+12,sd*1.5,0.035,'triangle',3200,0.6);
    if(p===8&&b%2) iBell(v,t,ch[2]+12,2.5,0.04);
  }},
  // NAVE DE SERETH — "Acero bajo la nave" (techno ácido, Fa# menor, 128)
  nave:{bpm:128,gain:1,rev:0.25,play(v,s,t,sd){
    const b=bar(s), p=pos(s);
    if(p%4===0) iKick(v,t,1);
    if(p===4||p===12) iClap(v,t,0.28); if(p%2===1) iHat(v,t,0.06); if(p===14) iHat(v,t,0.08,true);
    const seq=[30,30,42,30, 33,30,40,30, 30,37,30,42, 30,28,30,33]; if(p%4!==0||p===8) iBass(v,t,seq[p],sd*0.8,500+(Math.sin(s*0.04)+1)*1300,0.2,14,'sawtooth');
    if(b%8>=4&&p%8===4) iArp(v,t,66+(b%2)*3,sd*2,0.05,'sawtooth',1800,0.6);
    if(p===0&&b%4===0) iPad(v,t,[54,61,66],sd*64,0.025,600);
  }},
  // OSARIO — "Pabilos apagados" (techno roto, Mi frigio, campanitas)
  osario:{bpm:118,gain:1,rev:0.45,play(v,s,t,sd){
    const b=bar(s), p=pos(s); const kp=[1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0];
    if(kp[p]) iKick(v,t,0.9); if(p===4||p===12) iSnare(v,t,0.18); if(p%4===2) iHat(v,t,0.05); if(p===15) iNoise(v,t,0.08,0.06,4000);
    if(p===0||p===6||p===10) iSub(v,t,28+(b%4===3?1:0),sd*3,0.24);
    const bells=[64,65,71,67,65,64,76,72]; if(p%4===0) iBell(v,t,bells[(b*4+p/4)%8]+12,1.6,0.05);
    if(p===0&&b%2===0) iChoir(v,t,[52,59,64],sd*32,0.03,'o');
  }},
  // GALERÍA QUEMADA — "Ceniza en marcha" (techno conductor, Do menor, 130)
  galeria:{bpm:130,gain:1,rev:0.3,play(v,s,t,sd){
    const b=bar(s), p=pos(s), roots=[36,36,32,34], r=roots[b%4];
    if(p%4===0) iKick(v,t,1); if(p===4||p===12) iClap(v,t,0.22); iHat(v,t,p%2?0.03:0.06,p%4===2);
    iBass(v,t,r+(p%2?12:0),sd*0.7,800,0.18,8);
    const sc=[60,63,67,70,72,75,79,82]; const k=(s%32); iArp(v,t,sc[(k*3)%8]+(b%4===2?-4:0),sd*0.9,0.04,'sawtooth',1400+(k/32)*2400,0.35);
    if(p===0&&b%4===0) iPad(v,t,[r+24,r+27,r+31],sd*64,0.025,900);
  }},
  // CAMPANARIO — "Toque de difuntos" (techno oscuro con campanas, Re menor, 126)
  campanario:{bpm:126,gain:1,rev:0.45,play(v,s,t,sd){
    const b=bar(s), p=pos(s);
    if(p%4===0) iKick(v,t,0.95); if(p%4===2) iHat(v,t,0.07,true); if(p===12) iSnare(v,t,0.2);
    if(p%2===1) iBass(v,t,26+(p===7||p===15?7:0),sd*0.8,600,0.22,9);
    if(p===0) iBell(v,t,b%2?57:50,3.2,0.1); if(p===8&&b%4===3) iBell(v,t,53,2.4,0.07);
    const arp=[62,65,69,74]; if(b>=2&&p%3===0) iArp(v,t,arp[(s/3|0)%4]+12,sd*1.2,0.035,'square',2000,0.55);
    if(p===0&&b%2===0) iChoir(v,t,[50,57,62],sd*32,0.025,'a');
  }},
  // SANTUARIO (antes de la jefa) — solo coro grave y latido
  santuario:{bpm:60,gain:1.3,rev:0.6,play(v,s,t,sd){
    const b=bar(s), p=pos(s);
    if(p===0) { iChoir(v,t,b%2?[47,54,59]:[48,55,60],sd*16,0.045,'o'); iSub(v,t,b%2?35:36,sd*14,0.12); }
    if(p===0||p===3) iKick(v,t,0.35);
  }}
};
