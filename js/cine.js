// CODE FENIX — cinemáticas (splash de Prometheon Studio, prólogo, presentación de la jefa, final),
// menú de OPCIONES (volúmenes, reasignación de teclas) y director musical.
'use strict';
// ================= OPCIONES =================
const OPT_KEY='codefenix_opts';
const DEFAULT_KEYMAP=Object.assign({},KEYMAP);
function loadOptions(){ try{ const o=JSON.parse(localStorage.getItem(OPT_KEY)||'null'); if(!o) return;
  if(typeof o.music==='number') MUS.vol=clamp(o.music,0,1); if(typeof o.sfx==='number') MUS.sfxVol=clamp(o.sfx,0,1);
  if(o.keymap&&typeof o.keymap==='object'){ for(const k in KEYMAP) delete KEYMAP[k]; Object.assign(KEYMAP,o.keymap); } }catch(e){} }
function saveOptions(){ try{ localStorage.setItem(OPT_KEY,JSON.stringify({music:MUS.vol,sfx:MUS.sfxVol,keymap:KEYMAP})); }catch(e){} }
loadOptions();
const REMAP=[['left','Izquierda'],['right','Derecha'],['up','Arriba / hablar'],['down','Abajo'],['jump','Saltar'],['light','Ataque ligero / crítico'],['heavy','Ataque pesado / arte'],['shoot','Disparo secundario'],
  ['dodge','Esquivar / impulso'],['parry','Parada'],['heal','Curar'],['spell','Hechizo'],['cycle','Cambiar hechizo'],['quick','Ranura rápida'],['interact','Interactuar'],['inventory','Inventario']];
const KEYN={ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Space:'ESPACIO',ShiftLeft:'SHIFT',ShiftRight:'SHIFT DER.',ControlLeft:'CTRL',ControlRight:'CTRL DER.',AltLeft:'ALT',AltRight:'ALT DER.',Escape:'ESC',Enter:'ENTER',NumpadEnter:'ENTER',Tab:'TAB',Backspace:'RETROCESO',
  CapsLock:'BLOQ MAYÚS',Comma:',',Period:'.',Slash:'/',Semicolon:'Ñ',Quote:'´',BracketLeft:'[',BracketRight:']',Minus:'-',Equal:'=',Backquote:'º',IntlBackslash:'<'};
function keyName(c){ if(KEYN[c]) return KEYN[c]; if(/^Key/.test(c)) return c.slice(3); if(/^Digit/.test(c)) return c.slice(5); if(/^Numpad/.test(c)) return 'NUM '+c.slice(6); return c.toUpperCase(); }
function keysOf(act){ const ks=Object.keys(KEYMAP).filter(k=>KEYMAP[k]===act).map(keyName); return [...new Set(ks)].join(' / ')||'—'; }
const actLabel=a=>{ const r=REMAP.find(r=>r[0]===a); return r?r[1]:a; };
// Captura de tecla para reasignar (se llama antes del manejo normal del teclado).
function rebindHook(e){
  if(!(ui&&ui.type==='options'&&ui.wait)) return false;
  e.preventDefault();
  if(e.code==='Escape'){ ui.wait=false; ui.msg='Reasignación cancelada.'; return true; }
  if(e.code==='Enter'||e.code==='NumpadEnter'){ ui.msg='ENTER está reservada para confirmar.'; return true; }
  const act=REMAP[ui.ksel][0];
  for(const k of Object.keys(KEYMAP)) if(KEYMAP[k]===act) delete KEYMAP[k];
  const prev=KEYMAP[e.code]; KEYMAP[e.code]=act;
  ui.msg=prev&&prev!==act?keyName(e.code)+' ya no se usa para «'+actLabel(prev)+'».':'«'+actLabel(act)+'» ahora es '+keyName(e.code)+'.';
  if(prev&&prev!==act&&!Object.values(KEYMAP).includes(prev)) ui.msg+=' ¡«'+actLabel(prev)+'» quedó sin tecla!';
  ui.wait=false; saveOptions(); sfx('menu'); return true;
}
const OPT_ROWS=['MÚSICA','EFECTOS','REASIGNAR TECLAS','RESTABLECER TECLAS','PANTALLA COMPLETA','VOLVER'];
function openOptions(back){ ui={type:'options',sel:0,back,sub:null,ksel:0,wait:false,msg:''}; }
function closeOptions(){ saveOptions(); ui=ui.back==='pause'?{type:'pause',sel:4}:null; }
function updateOptions(){
  const u=ui; if(u.wait) return;
  if(u.sub==='keys'){ const n=REMAP.length+1;
    if(pressed.up){ u.ksel=(u.ksel+n-1)%n; sfx('menu'); } if(pressed.down){ u.ksel=(u.ksel+1)%n; sfx('menu'); }
    if(backP()){ u.sub=null; u.msg=''; return; }
    if(confirmP()){ if(u.ksel===REMAP.length){ u.sub=null; u.msg=''; } else { u.wait=true; u.msg=''; } sfx('menu'); }
    return; }
  const n=OPT_ROWS.length; if(pressed.up){ u.sel=(u.sel+n-1)%n; sfx('menu'); } if(pressed.down){ u.sel=(u.sel+1)%n; sfx('menu'); }
  if(backP()){ closeOptions(); sfx('menu'); return; }
  const d=(pressed.right?1:0)-(pressed.left?1:0);
  if(d&&u.sel===0){ setMusicVol(clamp(Math.round((MUS.vol+d*0.1)*10)/10,0,1)); saveOptions(); }
  if(d&&u.sel===1){ setSfxVol(clamp(Math.round((MUS.sfxVol+d*0.1)*10)/10,0,1)); saveOptions(); sfx('hit'); }
  if(confirmP()){ sfx('menu');
    if(u.sel===2){ u.sub='keys'; u.ksel=0; u.msg=''; }
    else if(u.sel===3){ for(const k in KEYMAP) delete KEYMAP[k]; Object.assign(KEYMAP,DEFAULT_KEYMAP); saveOptions(); u.msg='Controles restablecidos.'; }
    else if(u.sel===4) toggleFullscreen();
    else if(u.sel===5) closeOptions(); }
}
function volBar(x,y,v,sel){ for(let i=0;i<10;i++){ const on=i<Math.round(v*10); ctx.fillStyle='#07060b'; ctx.fillRect(x+i*17-1,y-1,15,14); ctx.fillStyle=on?(sel?'#ffb050':'#c9a24a'):'#24202c'; ctx.fillRect(x+i*17,y,13,12); }
  stext(Math.round(v*100)+'%',x+180,y-1,13,sel?GOLD:TXT); }
function drawOptions(){
  const u=ui;
  if(u.sub==='keys'){ hpanel(70,14,500,334,'REASIGNAR TECLAS');
    stext('ACCIÓN',110,36,12,DIM); stext('TECLA',370,36,12,DIM); ornLine(100,52,540,'#3a3844');
    REMAP.concat([['','VOLVER']]).forEach(([a,l],i)=>{ const y=58+i*16.2, s=i===u.ksel;
      addTap(100,y-1,440,15,()=>{ u.ksel=i; pressed.start=true; });
      if(s){ ctx.fillStyle='rgba(120,60,40,0.45)'; ctx.fillRect(100,y-1,440,15); ornDiamond(96,y+6,3,GOLD,'#3a2010'); }
      stext(l,110,y,12.5,s?GOLD:TXT); if(a){ const w=u.wait&&s; stext(w?'PULSÁ UNA TECLA…':keysOf(a),370,y,12.5,w?(Math.floor(time*4)%2?'#ffb050':'#fff'):s?'#ffd0a0':'#c8beb4'); } });
    stext(u.msg||(u.wait?'Pulsá la tecla nueva · ESC cancela':'ENTER: reasignar · ESC: volver · ESC y ENTER están reservadas'),320,334,11,u.msg?'#ffb050':DIM,'center');
    return; }
  hpanel(140,56,360,262,'OPCIONES');
  OPT_ROWS.forEach((l,i)=>{ const y=86+i*36, s=i===u.sel;
    addTap(156,y-8,328,32,(tx)=>{ u.sel=i; if(i<2&&tx>=134){ const v=clamp(Math.round((tx-134)/17+0.4)/10,0,1); if(i===0) setMusicVol(v); else { setSfxVol(v); sfx('hit'); } saveOptions(); } else if(i>=2) pressed.start=true; });
    if(s){ const g=ctx.createLinearGradient(160,0,480,0); g.addColorStop(0,'rgba(120,60,40,0.55)'); g.addColorStop(1,'rgba(120,60,40,0)'); ctx.fillStyle=g; ctx.fillRect(160,y-6,320,28); ornDiamond(158,y+8,4,GOLD,'#3a2010'); }
    stext(l,172,y,15,s?GOLD:TXT);
    if(i===0) volBar(290,y+2,MUS.vol,s); if(i===1) volBar(290,y+2,MUS.sfxVol,s); });
  stext(document.fullscreenElement?'Activada':'Desactivada',320+150,86+4*36,13,DIM,'right');
  stext(u.msg||(TOUCH.on?'Tocá una opción · tocá la barra para ajustar el volumen · ☰ volver':'↑↓ elegir · ←→ ajustar volumen · ENTER confirmar · ESC volver'),320,326,11,u.msg?'#ffb050':DIM,'center');
}

// ================= DIRECTOR MUSICAL =================
function musicDirector(){
  let m=null;
  if(mode==='cine') m=CINE?CINE.music:null;
  else if(mode==='title'||mode==='creator') m='title';
  else if(mode==='credits') m='ending';
  else if(mode==='play'){
    if(cut) m=cut.t>2.2?'boss':'santuario';
    else if(endT>0) m=null;
    else if(bossRef&&!bossRef.dead&&bossRef.engaged&&bossRef.state!=='dying') m='boss';
    else if(bossRef&&bossRef.state==='dying') m=null;
    else if(roomId==='santuario'&&flags.boss) m='refugio';
    else m=TRACKS[roomId]?roomId:'atrio';
  }
  playMusic(m);
}
function stinger(){ if(!SFX.ctx||!MUS.bus) return; const v={g:MUS.bus}, t=SFX.ctx.currentTime+0.05; iTom(v,t,33,0.7); iSub(v,t,26,3,0.2); iChoir(v,t+0.1,[50,57,62,65],3.6,0.06,'a'); iStrings(v,t+0.1,[38,45],3.6,0.04,0.5); iCrash(v,t,0.1); }

// ================= ARRANQUE =================
function updateBoot(dt){ if(pressed.any){ initAudio(); startCine('splash',()=>{ mode='title'; titleSel=0; }); } }
function renderBoot(){ hiOn(); ctx.fillStyle='#000'; ctx.fillRect(0,0,640,360);
  stext('CODE FENIX',320,140,30,'#5a4a50','center',null); const a=0.5+0.5*Math.sin(time*3); ctx.globalAlpha=0.35+a*0.65;
  stext(TOUCH.on?'TOCÁ LA PANTALLA PARA COMENZAR':'PULSÁ CUALQUIER TECLA PARA COMENZAR',320,196,14,'#e0d0c0','center'); ctx.globalAlpha=1;
  stext('Recomendado: auriculares. La música se genera en tiempo real.',320,322,11,'#4a4050','center',null); hiOff(); }

// ================= CINEMÁTICAS =================
let CINE=null;
const cparts=[];
function cpart(x,y,vx,vy,life,col,size=2){ if(cparts.length<500) cparts.push({x,y,vx,vy,life,max:life,col,size}); }
function stepCparts(dt){ for(const p of cparts){ p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx+=Math.sin(time*2+p.y*0.03)*6*dt; } for(let i=cparts.length-1;i>=0;i--) if(cparts[i].life<=0) cparts.splice(i,1); }
function drawCparts(){ for(const p of cparts){ ctx.globalAlpha=clamp(p.life/p.max,0,1); ctx.fillStyle=p.col; ctx.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size); } ctx.globalAlpha=1; }
function startCine(id,onEnd){ const d=CINEMAS[id](); CINE={id,shots:d.shots,music:d.music,i:0,t:0,chars:0,onEnd}; mode='cine'; cparts.length=0; if(d.onStart) d.onStart(); }
function shotDur(s){ return s.dur||Math.max(4.5,(s.text||'').length/34+3.2); }
function nextShot(){ const c=CINE; c.i++; c.t=0; c.chars=0; cparts.length=0; if(c.i>=c.shots.length) endCine(); }
function endCine(){ const c=CINE; CINE=null; cparts.length=0; if(c&&c.onEnd) c.onEnd(); }
function updateCine(dt){
  const c=CINE; if(!c) return; const s=c.shots[c.i]; c.t+=dt; const txt=s.text||''; c.chars=Math.min(txt.length,c.chars+dt*34);
  if(pressed.pause||pressed.back){ endCine(); return; }
  if((pressed.start||pressed.jump||pressed.light||pressed.interact)&&c.t>0.35){ if(c.chars<txt.length) c.chars=txt.length; else { nextShot(); return; } }
  stepCparts(dt); if(s.tick) s.tick(dt,c.t);
  if(c.t>shotDur(s)) nextShot();
}
function renderCine(){
  hiOn(); const c=CINE; ctx.fillStyle='#000'; ctx.fillRect(0,0,640,360); if(!c){ hiOff(); return; }
  const s=c.shots[c.i], d=shotDur(s);
  ctx.save(); s.draw(c.t,d); ctx.restore(); drawCparts();
  if(s.text){ const g=ctx.createLinearGradient(0,262,0,360); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.35,'rgba(0,0,0,0.78)'); g.addColorStop(1,'rgba(0,0,0,0.92)'); ctx.fillStyle=g; ctx.fillRect(0,262,640,98);
    const lines=swrap(s.text,560,15); let left=Math.floor(c.chars);
    lines.forEach((l,i)=>{ const show=l.slice(0,Math.max(0,left)); left-=l.length+1; stext(show,40,290+i*21,15,'#ece2d0','left'); }); }
  const a=Math.min(1,c.t/0.7,(d-c.t)/0.7); if(a<1){ ctx.fillStyle=`rgba(0,0,0,${1-clamp(a,0,1)})`; ctx.fillRect(0,0,640,360); }
  if(c.id!=='splash') stext(TOUCH.on?'TOCÁ: SIGUIENTE   ·   ☰: SALTAR':'ENTER: SIGUIENTE   ·   ESC: SALTAR',630,344,10,'#6a6070','right',null);
  hiOff();
}
// --- pintura de paneles (una vez, en caché, posterizada) ---
const PANEL={};
function panelImg(id,fn){ if(PANEL[id]) return PANEL[id]; const c=mkCanvas(640,360), x=c.getContext('2d'); fn(x); pixelize(c,8,1); PANEL[id]=c; return c; }
function rngS(seed){ let s=seed>>>0||1; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); }
function grad(x,y0,y1,stops){ const g=x.createLinearGradient(0,y0,0,y1); stops.forEach(([o,c])=>g.addColorStop(o,c)); return g; }
function stars(x,n,seed,h=260){ const R=rngS(seed); for(let i=0;i<n;i++){ x.fillStyle=`rgba(255,240,230,${0.2+R()*0.7})`; x.fillRect(R()*640|0,R()*h|0,R()<0.1?2:1,R()<0.1?2:1); } }
function spireSkyline(x,y0,col,seed,lit){ const R=rngS(seed); x.fillStyle=col; let X=0; while(X<640){ const w=20+R()*46, h=30+R()*90; x.fillRect(X,y0-h,w,h+100);
    x.beginPath(); x.moveTo(X+w*0.2,y0-h); x.lineTo(X+w/2,y0-h-20-R()*50); x.lineTo(X+w*0.8,y0-h); x.fill();
    if(lit) for(let k=0;k<3;k++) if(R()<0.6){ x.fillStyle='#e8a050'; x.fillRect(X+4+R()*(w-8)|0,y0-h+10+R()*h*0.7|0,2,4); x.fillStyle=col; }
    X+=w+R()*6; } }
function robed(x,cx,base,h,col){ x.fillStyle=col; x.beginPath(); x.moveTo(cx-h*0.12,base-h*0.78); x.lineTo(cx+h*0.12,base-h*0.78); x.lineTo(cx+h*0.22,base); x.lineTo(cx-h*0.22,base); x.fill(); x.beginPath(); x.arc(cx,base-h*0.84,h*0.1,0,TAU); x.fill(); }
function bigSprite(f,cx,foot,sc,flip=false,alpha=1){ ctx.save(); ctx.globalAlpha=alpha; ctx.translate(Math.round(cx),Math.round(foot)); if(flip) ctx.scale(-1,1); ctx.drawImage(f.img,-f.ox*sc,-f.oy*sc,f.w*sc,f.h*sc); ctx.restore(); }
function glow(cx,cy,r,col){ const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(cx-r,cy-r,r*2,r*2); }
const PAN=(t,d,px)=>Math.round(-px*t/d);
// Paneles
const P_YSTREL=()=>panelImg('ystrel',x=>{ const g=x.createRadialGradient(320,160,10,320,170,380); g.addColorStop(0,'#6a2410'); g.addColorStop(0.35,'#2a0c10'); g.addColorStop(1,'#030106'); x.fillStyle=g; x.fillRect(0,0,640,360); stars(x,260,7);
  for(const side of [-1,1]) for(let i=0;i<46;i++){ const k=i/46, bx=320+side*(10+k*230), by=150-Math.sin(k*Math.PI*0.9)*90+k*40;
    const len=40+(1-k)*60+Math.sin(i*1.7)*12; const gr=x.createLinearGradient(bx,by,bx+side*len*0.3,by+len); gr.addColorStop(0,'#fff0b0'); gr.addColorStop(0.35,'#ffa040'); gr.addColorStop(1,'rgba(150,20,10,0)');
    x.strokeStyle=gr; x.lineWidth=5-k*2.5; x.beginPath(); x.moveTo(bx,by); x.quadraticCurveTo(bx+side*len*0.4,by+len*0.5,bx+side*len*0.25,by+len); x.stroke(); }
  x.fillStyle='#ffe0a0'; x.beginPath(); x.ellipse(320,175,14,48,0,0,TAU); x.fill(); x.fillStyle='#fff8e0'; x.beginPath(); x.ellipse(320,120,10,13,0,0,TAU); x.fill();
  x.fillStyle='#ffb040'; x.beginPath(); x.moveTo(318,112); x.lineTo(332,118); x.lineTo(318,124); x.fill();
  for(let i=0;i<9;i++){ const a=(i-4)*0.13; const gr=x.createLinearGradient(320,210,320+Math.sin(a)*120,330); gr.addColorStop(0,'#ffb040'); gr.addColorStop(1,'rgba(120,10,10,0)'); x.strokeStyle=gr; x.lineWidth=4; x.beginPath(); x.moveTo(320,210); x.quadraticCurveTo(320+Math.sin(a)*40,270,320+Math.sin(a)*130,340); x.stroke(); } });
const P_SIETE=()=>panelImg('siete',x=>{ x.fillStyle=grad(x,0,260,[[0,'#0e0818'],[0.6,'#3a1a30'],[1,'#a04a22']]); x.fillRect(0,0,640,360); stars(x,120,11,150);
  x.fillStyle='#120a12'; x.beginPath(); x.moveTo(0,262); for(let X=0;X<=640;X+=20) x.lineTo(X,256+Math.sin(X*0.02)*6); x.lineTo(640,360); x.lineTo(0,360); x.fill();
  [[100,130],[170,150],[240,140],[320,170],[400,140],[470,150],[540,130]].forEach(([cx,h])=>robed(x,cx,258,h,'#0a0608'));
  x.strokeStyle='rgba(255,200,120,0.5)'; x.lineWidth=2; x.beginPath(); x.arc(320,70,40,0,TAU); x.stroke(); });
const P_OJO=()=>panelImg('ojo',x=>{ x.fillStyle=grad(x,0,360,[[0,'#06040e'],[0.7,'#1a1430'],[1,'#2a1a30']]); x.fillRect(0,0,640,360); stars(x,220,3,240);
  const g=x.createRadialGradient(320,120,60,320,120,140); g.addColorStop(0,'rgba(200,180,255,0.25)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,640,300);
  x.fillStyle='#d8d0e0'; x.beginPath(); x.arc(320,120,78,0,TAU); x.fill(); const R=rngS(5); for(let i=0;i<14;i++){ x.fillStyle='rgba(120,110,140,0.35)'; x.beginPath(); x.arc(320+(R()-0.5)*120,120+(R()-0.5)*120,4+R()*12,0,TAU); x.fill(); }
  x.globalCompositeOperation='destination-over'; x.globalCompositeOperation='source-over';
  spireSkyline(x,330,'#0c0812',21,true); spireSkyline(x,360,'#050308',33,false); });
function drawEye(open){ ctx.save(); ctx.beginPath(); ctx.arc(320,120,78,0,TAU); ctx.clip(); const h=open*52;
  if(h>1){ ctx.fillStyle='#1a0a2a'; ctx.beginPath(); ctx.moveTo(250,120); ctx.quadraticCurveTo(320,120-h*1.25,390,120); ctx.quadraticCurveTo(320,120+h*1.25,250,120); ctx.fill();
    ctx.fillStyle='#8a5ac0'; ctx.beginPath(); ctx.ellipse(320,120,Math.min(26,h*0.8),Math.min(26,h*0.8),0,0,TAU); ctx.fill(); ctx.fillStyle='#d8b8ff'; ctx.beginPath(); ctx.ellipse(320,120,Math.min(14,h*0.45),Math.min(14,h*0.45),0,0,TAU); ctx.fill();
    ctx.fillStyle='#050208'; ctx.fillRect(317,120-Math.min(22,h*0.7),6,Math.min(44,h*1.4)); }
  else { ctx.strokeStyle='#4a3a60'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(252,120); ctx.quadraticCurveTo(320,128,388,120); ctx.stroke(); }
  ctx.restore(); if(open>0.2) glow(320,120,140*open,'rgba(160,110,255,0.25)'); }
const P_QUEMA=()=>panelImg('quema',x=>{ x.fillStyle=grad(x,0,360,[[0,'#120404'],[0.55,'#5a1a08'],[0.85,'#c0501a'],[1,'#ff9a3a']]); x.fillRect(0,0,640,360);
  x.fillStyle='#070304'; x.fillRect(120,140,400,220); x.beginPath(); x.moveTo(120,140); x.lineTo(320,60); x.lineTo(520,140); x.fill();
  for(const [tx,h] of [[150,170],[490,170]]){ x.fillRect(tx-22,330-h-60,44,h+60); x.beginPath(); x.moveTo(tx-26,330-h-60); x.lineTo(tx,330-h-150); x.lineTo(tx+26,330-h-60); x.fill(); }
  x.fillStyle='#ff9a3a'; x.beginPath(); x.arc(320,170,34,Math.PI,0); x.fillRect(286,170,68,60); x.fill(); x.fillStyle='#070304'; for(let i=0;i<5;i++) x.fillRect(290+i*14,140,3,90); x.fillRect(286,195,68,3);
  for(let i=0;i<22;i++) robed(x,40+i*27+(i%2)*6,360,46+(i%3)*6,'#0a0405'); });
const P_PIRA=()=>panelImg('pira',x=>{ x.fillStyle=grad(x,0,360,[[0,'#050308'],[1,'#1a0c0a']]); x.fillRect(0,0,640,360);
  x.fillStyle='#181014'; for(let i=0;i<8;i++){ x.fillRect(30+i*80,40,14,320); } x.fillStyle='#0a0608'; x.fillRect(0,300,640,60);
  x.fillStyle='#2a1a12'; for(let i=0;i<7;i++){ x.save(); x.translate(320,304); x.rotate((i-3)*0.18); x.fillRect(-90,-6-i*2,180,8); x.restore(); }
  x.fillStyle='#4a4048'; x.beginPath(); x.ellipse(320,296,110,14,0,0,TAU); x.fill(); });
const P_REFUGIO=()=>panelImg('refugio',x=>{ x.fillStyle=grad(x,0,360,[[0,'#08060c'],[1,'#24140e']]); x.fillRect(0,0,640,360);
  x.fillStyle='#120c10'; x.beginPath(); x.moveTo(80,360); x.lineTo(80,90); x.quadraticCurveTo(320,-40,560,90); x.lineTo(560,360); x.fill(); x.fillStyle='#1c1218'; x.fillRect(80,290,480,70);
  for(let i=0;i<5;i++){ x.fillStyle='#2a1c18'; x.fillRect(120+i*100,110,10,180); } });
const P_ALBA=()=>panelImg('alba',x=>{ x.fillStyle=grad(x,0,300,[[0,'#2a2046'],[0.45,'#8a4a5a'],[0.8,'#e08a50'],[1,'#ffd0a0']]); x.fillRect(0,0,640,360);
  const g=x.createRadialGradient(470,250,5,470,250,160); g.addColorStop(0,'rgba(255,240,200,0.9)'); g.addColorStop(1,'rgba(255,200,120,0)'); x.fillStyle=g; x.fillRect(0,0,640,360); });
function ridge(y,amp,seed,col,off,per=640){ const R=rngS(seed); const pts=[]; for(let i=0;i<=16;i++) pts.push(R()); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,360);
  for(let X=0;X<=640;X+=8){ const u=(((X+off)%per)+per)%per/per*16, i=Math.floor(u), f=u-i; const h=pts[i]*(1-f)+pts[(i+1)%16]*f; ctx.lineTo(X,y-h*amp); } ctx.lineTo(640,360); ctx.fill(); }
function embers(n,x0,x1,y0,cols){ for(let i=0;i<n;i++) if(Math.random()<0.5) cpart(rnd(x0,x1),y0+rnd(-8,8),rnd(-10,10),rnd(-60,-20),rnd(1,2.4),cols[i%cols.length],Math.random()<0.3?3:2); }
const CINEMAS={
  splash:()=>({music:null,onStart:stinger,shots:[{dur:4.6,draw:(t)=>{
    const a=clamp(Math.min(t/0.9,(4.6-t)/0.9),0,1); ctx.globalAlpha=a; glow(320,150,120,'rgba(255,130,40,0.22)');
    ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(320,140,62,0,TAU); ctx.stroke(); ctx.strokeStyle='#3a2a1a'; ctx.beginPath(); ctx.arc(320,140,68,0,TAU); ctx.stroke();
    ctx.fillStyle='#c9a24a'; ctx.beginPath(); ctx.moveTo(310,150); ctx.lineTo(330,150); ctx.lineTo(324,196); ctx.lineTo(316,196); ctx.fill(); ctx.fillStyle='#7a5a2a'; ctx.fillRect(306,146,28,8);
    for(let k=0;k<3;k++){ const f=Math.sin(time*9+k*2)*3; ctx.fillStyle=['#c0301e','#ff9a3a','#fff0b0'][k]; const s=1-k*0.28; ctx.beginPath(); ctx.moveTo(320-18*s,146); ctx.quadraticCurveTo(320-22*s+f,112,320+f*0.5,84+k*12); ctx.quadraticCurveTo(320+22*s-f,112,320+18*s,146); ctx.fill(); }
    if(Math.random()<0.5) cpart(320+rnd(-10,10),100,rnd(-15,15),rnd(-50,-20),1.2,Math.random()<0.5?'#ffb040':'#ffd860');
    ctx.font='34px '+SERIF; const word='P R O M E T H E O N'; stext(word,320,222,30,'#e8d8b8','center',null); stext('S T U D I O',320,262,13,'#a08a6a','center',null);
    if(t>2.2){ ctx.globalAlpha=a*clamp((t-2.2)/0.8,0,1); stext('presenta',320,292,12,'#8a7a70','center',null,'italic'); } ctx.globalAlpha=1; }}]}),
  prologue:()=>({music:'prologue',shots:[
    {text:'Antes de los reyes y de los nombres, Ystrel, el Ave Primera, ardió hasta consumirse. No murió: se escribió.',
      draw:(t,d)=>{ ctx.drawImage(P_YSTREL(),PAN(t,d,0),0); glow(320,170,200+Math.sin(time*2)*20,'rgba(255,140,40,0.18)'); embers(3,200,440,240,['#ffd860','#ff9a3a','#c0301e']); }},
    {text:'Con su ceniza nació el Código Fénix: todo lo que arde, vuelve. Siete custodios del Ascua juraron que el ciclo jamás se rompería.',
      draw:(t)=>{ ctx.drawImage(P_SIETE(),0,0); ctx.save(); ctx.translate(320,70); ctx.rotate(time*0.3); ctx.strokeStyle='rgba(255,210,140,0.8)'; ctx.lineWidth=1.5;
        for(let i=0;i<14;i++){ ctx.rotate(TAU/14); ctx.beginPath(); ctx.moveTo(0,-34); ctx.lineTo(i%2?4:-3,-46); ctx.lineTo(0,-50); ctx.stroke(); } ctx.restore(); glow(320,70,70,'rgba(255,180,80,0.3)');
        [[100,130],[170,150],[240,140],[320,170],[400,140],[470,150],[540,130]].forEach(([cx,h],i)=>{ for(let k=-1;k<=1;k++){ ctx.fillStyle=(Math.sin(time*5+i+k)>0)?'#ffd860':'#ff9a3a'; ctx.fillRect(cx+k*5-1,258-h*0.95-Math.abs(k)*-2,3,3); } }); }},
    {text:'Hasta la noche en que la luna se abrió. El Ojo de Nhul miró a Velmora, y el Código empezó a renacer torcido.',
      draw:(t,d)=>{ ctx.drawImage(P_OJO(),0,0); drawEye(clamp((t-0.8)/2.6,0,1)); }},
    {text:'Durante la Quema, la madre Aldonza cantó el verso prohibido para que el Ojo los amara. La Orden del Pabilo ardió entera, coro y altar.',
      draw:(t)=>{ ctx.drawImage(P_QUEMA(),0,0); for(let i=0;i<26;i++){ const fx=120+i*15.5, fh=20+Math.abs(Math.sin(time*7+i*1.3))*36; ctx.fillStyle=i%2?'#ff9a3a':'#e0501e'; ctx.beginPath(); ctx.moveTo(fx-9,142-(Math.abs(fx-320)<200?(200-Math.abs(fx-320))*0.4:0)); ctx.lineTo(fx,142-fh-(Math.abs(fx-320)<200?(200-Math.abs(fx-320))*0.4:0)); ctx.lineTo(fx+9,142-(Math.abs(fx-320)<200?(200-Math.abs(fx-320))*0.4:0)); ctx.fill(); }
        embers(4,120,520,120,['#ffd860','#ff9a3a','#5a3a3a']); bigSprite(enemyFrame('abadesa','orbWind',0,4,null,false),320,276,1.25); glow(320,200,80,'rgba(200,170,255,0.2)'); }},
        {text:'Pero el Código todavía guarda un nombre: '+PNAME()+'. '+G('Farolero','Farolera','Chispa')+' de la Orden, levantate. La vigilia no terminó.',
      draw:(t)=>{ ctx.drawImage(P_PIRA(),0,0); const k=clamp((t-1.5)/2,0,1); glow(320,280,140+Math.sin(time*3)*10,'rgba(255,140,40,0.35)');
        bigSprite(k<1?lookFrame(P.look,'heal',0,P.wpn):lookFrame(P.look,'idle',Math.floor(time*6)%6,P.wpn),320,292,3); embers(4,230,410,296,['#ffd860','#ff9a3a','#c0301e']); }}
  ]}),
  ending:()=>({music:'ending',shots:[
    {text:'La Abadesa Hueca se deshizo en ceniza tibia, y por primera vez en siglos, el Ojo de Nhul parpadeó.',
      draw:(t)=>{ ctx.drawImage(P_OJO(),0,0); drawEye(clamp(1-t/3.5,0,1)); embers(3,260,380,330,['#c9b8ff','#ffd860']); }},
    {text:'En el Refugio, Ilvana volvió a cantar. No el verso prohibido: el otro, el que habla de volver.',
      draw:(t)=>{ ctx.drawImage(P_REFUGIO(),0,0); glow(320,240,150+Math.sin(time*3)*12,'rgba(255,140,40,0.35)'); embers(3,290,350,256,['#ffd860','#ff9a3a']);
        ctx.fillStyle='#ffb040'; for(let i=0;i<5;i++){ const h=18+Math.abs(Math.sin(time*8+i))*16; ctx.beginPath(); ctx.moveTo(300+i*10,260); ctx.lineTo(305+i*10,260-h); ctx.lineTo(310+i*10,260); ctx.fill(); }
        [['ilvana',190,1],['brom',250,1],['sabela',400,-1],['galvano',460,-1],['tadeo',530,-1]].forEach(([id,x0,f])=>bigSprite(npcFrame(id,Math.floor(time*2)%4),x0,262,2,f<0)); bigSprite(lookFrame(P.look,'idle',Math.floor(time*6)%6,P.wpn),130,262,2); }},
    {text:'El Código sigue escrito con tu nombre. Y mientras haya algo que arda, '+PNAME()+', siempre vas a volver.',
      tick:(dt)=>{ if(Math.random()<0.9) cpart(rnd(0,660),-4,rnd(-20,-6),rnd(20,45),8,'#f4f0ff',Math.random()<0.3?2:1); },
      draw:(t)=>{ ctx.drawImage(P_ALBA(),0,0); ridge(215,90,4,'#6a4a5a',t*8); ridge(250,60,9,'#3a2a3a',t*20); ridge(282,22,12,'#d8d0e0',t*60);
        bigSprite(lookFrame(P.look,'run',Math.floor(time*9)%8,P.wpn),300,276,2); }}
  ]})
};

// ================= PRESENTACIÓN DE LA JEFA (en el motor) =================
let cut=null;
function startBossCut(e){ cut={t:0,e,cam0:cam.x,risen:false,lines:[
    ['MADRE ALDONZA','Otra mecha que el Código se niega a apagar…'],
    ['MADRE ALDONZA','Canté para que el Ojo nos amara, y nos miró. Ahora vas a cantar conmigo, '+FAR()+'.']]}; P.vx=0; P.state='normal'; }
const CUT_END=12.4;
function finishCut(){ const e=cut.e; if(!cut.risen) sfx('roar'); e.state='intro'; e.t=0.6; e.engaged=true; shake=4; flags.bossSeen=1; cut=null; }
function updateCut(dt){
  const c=cut, e=c.e; c.t+=dt; if(shake>0) shake=Math.max(0,shake-dt*20); updateParticles(dt); P.vx=0;
  if(c.t>0.6&&(pressed.pause||pressed.start||pressed.jump||pressed.light||pressed.interact)){ finishCut(); return; }
  const tx=clamp(e.x+e.w/2-W/2,0,Math.max(0,room.w*8-W)), sm=k=>k*k*(3-2*k);
  const k=c.t<CUT_END-1.2?sm(clamp((c.t-0.3)/1.6,0,1)):sm(clamp((CUT_END-c.t)/1.2,0,1));
  const px0=clamp(pcx()-W/2,0,Math.max(0,room.w*8-W)); cam.x=px0+(tx-px0)*k;
  if(c.t>2.2&&!c.risen){ c.risen=true; e.state='intro'; e.t=0; sfx('roar'); shake=6; burst(e.x+e.w/2,e.y+e.h,24,['#c9b8ff','#5a3a9a','#fff'],110,{glow:1}); }
  if(c.risen) e.t=Math.min(e.t+dt,1.3);
  if(Math.random()<0.3) part(e.x+rnd(0,e.w),e.y+rnd(0,e.h),rnd(-8,8),rnd(-30,-10),1,'#c9b8ff',{glow:1});
  if(c.t>=CUT_END) finishCut();
}
function drawCut(){
  const c=cut; hiOn(); const k=clamp(Math.min(c.t/0.6,(CUT_END-c.t)/0.6),0,1), bh=Math.round(46*k);
  ctx.fillStyle='#000'; ctx.fillRect(0,0,640,bh); ctx.fillRect(0,360-bh,640,bh);
  const L=[[2.6,6.3],[6.3,9.8]];
  L.forEach(([a,b],i)=>{ if(c.t>=a&&c.t<b){ const [who,tx]=c.lines[i]; const n=Math.floor((c.t-a)*36); stext(who,40,360-bh+6,12,'#c9b8ff'); stext(tx.slice(0,n),40,360-bh+22,14,'#ece2d0'); } });
  if(c.t>9.8&&c.t<CUT_END-0.3){ const a=clamp(Math.min((c.t-9.8)/0.5,(CUT_END-0.3-c.t)/0.5),0,1); ctx.globalAlpha=a; ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,130,640,90);
    const tw=swidth('LA ABADESA HUECA',34); stext('LA ABADESA HUECA',320,140,34,'#efe6ff','center'); ornLine(320-tw/2-30,186,320+tw/2+30,'#8a7aa8'); ornDiamond(320,186,5,'#c9b8ff');
    stext('Madre Aldonza, la que cantó el verso prohibido',320,196,14,'#b8a8d0','center',null,'italic'); ctx.globalAlpha=1; }
  if(c.t>0.6) stext(TOUCH.on?'TOCÁ / ☰: SALTAR':'ENTER / ESC: SALTAR',630,bh>12?bh-16:4,10,'#6a6070','right',null);
  hiOff();
}
