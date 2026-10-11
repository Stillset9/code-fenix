// Sonido 100% sintetizado con WebAudio (sin archivos externos).
'use strict';
const SFX = { ctx:null, master:null, muted:false, noiseBuf:null };
function initAudio(){
  if (SFX.ctx) { if (SFX.ctx.state==='suspended') SFX.ctx.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = new AC(); SFX.ctx = c;
    SFX.master = c.createGain(); SFX.master.gain.value = SFX.muted ? 0 : 0.45*MUS.sfxVol; SFX.master.connect(c.destination);
    const len = c.sampleRate; const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    SFX.noiseBuf = b;
    musicSetup();
  } catch(e) { SFX.ctx = null; }
}
function toggleMute(){ SFX.muted = !SFX.muted; if (SFX.master) SFX.master.gain.value = SFX.muted ? 0 : 0.45*MUS.sfxVol; if (MUS.bus) MUS.bus.gain.value = SFX.muted ? 0 : MUS.vol*0.55; }
function tone(freq, dur, type='square', vol=0.15, slide=1, delay=0){
  const c = SFX.ctx; if (!c || SFX.muted) return;
  const t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq*slide), t+dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t+dur);
  o.connect(g); g.connect(SFX.master); o.start(t); o.stop(t+dur+0.05);
}
function noise(dur, vol=0.15, freq=1200, type='bandpass', delay=0, q=1){
  const c = SFX.ctx; if (!c || SFX.muted || !SFX.noiseBuf) return;
  const t = c.currentTime + delay; const s = c.createBufferSource(); s.buffer = SFX.noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t+dur);
  s.connect(f); f.connect(g); g.connect(SFX.master); s.start(t, Math.random()*0.5); s.stop(t+dur+0.05);
}
function sfx(n){
  switch(n){
    case 'jump': tone(180,0.09,'square',0.06,1.8); break;
    case 'djump': tone(300,0.14,'triangle',0.09,2); noise(0.15,0.08,2500); break;
    case 'swing': noise(0.09,0.12,3000,'bandpass',0,0.8); break;
    case 'hit': noise(0.08,0.2,700); tone(110,0.1,'square',0.1,0.5); break;
    case 'clang': tone(980,0.3,'triangle',0.12,0.98); tone(1310,0.25,'triangle',0.08,0.97); break;
    case 'hurt': tone(220,0.22,'sawtooth',0.12,0.4); noise(0.12,0.15,500); break;
    case 'roll': noise(0.16,0.09,500,'lowpass'); break;
    case 'heal': tone(440,0.4,'sine',0.1,2); tone(660,0.4,'sine',0.07,2,0.05); break;
    case 'deny': tone(120,0.12,'square',0.08,0.8); break;
    case 'kill': noise(0.25,0.15,400,'lowpass'); tone(90,0.25,'square',0.08,0.5); break;
    case 'wax': tone(880,0.08,'triangle',0.06,1.2); tone(1320,0.1,'triangle',0.05,1.1,0.06); break;
    case 'item': [523,659,784,1046].forEach((f,i)=>tone(f,0.3,'triangle',0.08,1,i*0.09)); break;
    case 'rest': [220,277,330,440].forEach((f,i)=>tone(f,1.2,'sine',0.06,1,i*0.12)); break;
    case 'die': tone(300,1.4,'sawtooth',0.12,0.15); noise(1.0,0.08,300,'lowpass'); break;
    case 'growl': tone(90,0.25,'sawtooth',0.08,0.7); break;
    case 'screech': tone(1400,0.2,'square',0.04,0.6); break;
    case 'bell': tone(330,0.7,'triangle',0.1,0.99); tone(495,0.6,'sine',0.06,0.99); break;
    case 'slam': noise(0.35,0.25,200,'lowpass'); tone(60,0.3,'square',0.12,0.5); break;
    case 'roar': tone(70,1.0,'sawtooth',0.14,0.6); tone(105,1.0,'sawtooth',0.1,0.55); noise(0.8,0.1,300,'lowpass'); break;
    case 'leap': tone(120,0.3,'triangle',0.08,2); break;
    case 'orb': tone(600,0.5,'sine',0.07,0.4); tone(300,0.5,'sine',0.05,0.5); break;
    case 'bcharge': noise(0.5,0.12,250,'lowpass'); break;
    case 'door': tone(80,0.6,'square',0.08,0.7); noise(0.5,0.1,900); break;
    case 'menu': tone(660,0.05,'square',0.04,1); break;
    case 'buy': tone(523,0.15,'triangle',0.08,1.5); break;
    case 'shot': noise(0.18,0.3,900,'lowpass'); tone(160,0.12,'square',0.1,0.4); break;
    case 'parry': tone(1500,0.35,'triangle',0.14,0.9); tone(2000,0.3,'sine',0.08,0.8); noise(0.1,0.15,4000); break;
    case 'stagger': tone(400,0.3,'square',0.07,0.5); break;
    case 'crit': noise(0.3,0.3,500,'lowpass'); tone(80,0.4,'sawtooth',0.15,0.4); tone(1200,0.2,'triangle',0.08,0.6); break;
    case 'spell': tone(500,0.3,'sawtooth',0.06,2.2); noise(0.25,0.08,2000); break;
    case 'nova': noise(0.5,0.2,600,'lowpass'); tone(200,0.5,'sawtooth',0.08,3); break;
    case 'dash': noise(0.15,0.12,1800); tone(500,0.1,'triangle',0.05,1.6); break;
    case 'charge': tone(200,0.6,'triangle',0.05,2.5); break;
    case 'talk': tone(520+Math.random()*80,0.04,'square',0.025,1); break;
    case 'victory': [262,330,392,523,659].forEach((f,i)=>tone(f,0.9,'triangle',0.07,1,i*0.15)); break;
  }
}
