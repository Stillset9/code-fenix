// CODE FENIX — controles táctiles (stick virtual + botones), toques sobre menús, pantalla completa y orientación.
// Solo se muestran en dispositivos táctiles; teclado y mando siguen funcionando igual.
'use strict';
const touchHeld={};
const TOUCH={on:false,stick:null,btn:{},dirs:{}};
let TAPS=[]; // regiones tocables registradas al dibujar (coordenadas nativas 640x360)
const isTouchDev=()=>!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches&&navigator.maxTouchPoints>0);
function tPress(a){ if(!touchHeld[a]){ pressed[a]=true; pressed.any=true; } touchHeld[a]=true; }
function tRelease(a){ touchHeld[a]=false; }
const BTN_DEF=[ // acción, etiqueta, tamaño(vmin), right, bottom  (o top si t)
  ['jump','SALTO',15,16.5,3],['light','ATAQUE',15,32,18.5],['heavy','PESADO',15,16.5,34],['dodge','ESQUIVA',15,1,18.5],
  ['heal','CURAR',10,2,52],['spell','VERSO',10,13,52],['parry','PARADA',10,24,52],['shoot','DISPARO',10,35,52],
  ['interact','E',11,48,4],['quick','RÁPIDO',9,49,17],['cycle','CAMBIAR',9,59,5],
  ['pause','☰',10,null,null,'top:16vmin;right:2vmin'],['inventory','BOLSA',10,null,null,'top:16vmin;right:13vmin'],
  ['fs','⛶',8,null,null,'top:17vmin;right:24vmin']
];
function buildTouchUI(){
  const root=document.createElement('div'); root.id='touch';
  root.innerHTML='<div id="stickBase"><div id="stickKnob"></div></div>'+BTN_DEF.map(([a,l,s,r,b,css])=>`<div class="tbtn${s>=15?' big':''}" data-a="${a}" style="width:${s}vmin;height:${s}vmin;font-size:${s>=15?3.2:l.length>5?1.8:2.3}vmin;${css||`right:${r}vmin;bottom:${b}vmin`}">${l}</div>`).join('');
  document.body.appendChild(root);
  const rot=document.createElement('div'); rot.id='rotate'; rot.innerHTML='<div class="phone"></div><p>Girá tu dispositivo</p><small>Code Fenix se juega en horizontal</small>'; document.body.appendChild(rot);
  const base=root.querySelector('#stickBase'), knob=root.querySelector('#stickKnob');
  const R=()=>Math.min(innerWidth,innerHeight)*0.13;
  function setDirs(dx,dy){ const r=R(), m=Math.hypot(dx,dy); const k=m>r?r/m:1; knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;
    const want={left:dx<-r*0.35,right:dx>r*0.35,up:dy<-r*0.55,down:dy>r*0.55};
    for(const d in want){ if(want[d]&&!TOUCH.dirs[d]) tPress(d); if(!want[d]&&TOUCH.dirs[d]) tRelease(d); TOUCH.dirs[d]=want[d]; } }
  function btnAt(x,y){ const el=document.elementFromPoint(x,y); return el&&el.classList&&el.classList.contains('tbtn')?el:null; }
  function down(el,id){ const a=el.dataset.a; TOUCH.btn[id]=el; el.classList.add('on');
    if(a==='fs'){ goFullscreen(); return; } tPress(a); if(a==='pause') pressed.back=true; }
  function up(id){ const el=TOUCH.btn[id]; if(!el) return; el.classList.remove('on'); if(el.dataset.a!=='fs') tRelease(el.dataset.a); delete TOUCH.btn[id]; }
  const opt={passive:false};
  root.addEventListener('touchstart',e=>{ if(e.cancelable) e.preventDefault(); enableTouch(); initAudio(); pressed.any=true;
    for(const t of e.changedTouches){ const el=btnAt(t.clientX,t.clientY);
      if(el){ down(el,t.identifier); continue; }
      const stickZone=t.clientX<innerWidth*0.42&&t.clientY>innerHeight*0.3&&stickOK();
      if(stickZone&&!TOUCH.stick){ TOUCH.stick={id:t.identifier,x:t.clientX,y:t.clientY}; base.style.left=(t.clientX-base.offsetWidth/2)+'px'; base.style.top=(t.clientY-base.offsetHeight/2)+'px'; base.style.bottom='auto'; base.classList.add('on'); setDirs(0,0); continue; }
      canvasTap(t.clientX,t.clientY); } },opt);
  root.addEventListener('touchmove',e=>{ if(e.cancelable) e.preventDefault();
    for(const t of e.changedTouches){ if(TOUCH.stick&&t.identifier===TOUCH.stick.id){ setDirs(t.clientX-TOUCH.stick.x,t.clientY-TOUCH.stick.y); continue; }
      if(TOUCH.btn[t.identifier]){ const el=btnAt(t.clientX,t.clientY); if(el&&el!==TOUCH.btn[t.identifier]&&el.dataset.a!=='fs'&&el.dataset.a!=='pause'){ up(t.identifier); down(el,t.identifier); } } } },opt);
  const end=e=>{ if(e.cancelable) e.preventDefault(); for(const t of e.changedTouches){ if(TOUCH.stick&&t.identifier===TOUCH.stick.id){ TOUCH.stick=null; setDirs(0,0); knob.style.transform=''; base.classList.remove('on'); base.style.left=''; base.style.top=''; base.style.bottom=''; } else up(t.identifier); } };
  root.addEventListener('touchend',end,opt); root.addEventListener('touchcancel',end,opt);
}
function stickOK(){ return mode!=='boot'&&mode!=='cine'; }
function enableTouch(){ if(TOUCH.on) return; TOUCH.on=true; document.body.classList.add('touch'); }
// Toque o clic sobre el lienzo: regiones registradas o "avanzar" genérico.
function canvasTap(cx,cy){
  const r=cv.getBoundingClientRect(); if(!r.width) return; const x=(cx-r.left)/r.width*640, y=(cy-r.top)/r.height*360;
  for(let i=TAPS.length-1;i>=0;i--){ const t=TAPS[i]; if(x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h){ initAudio(); t.fn(x-t.x,y-t.y,t); return true; } }
  if(x<0||y<0||x>640||y>360) return false;
  if(mode==='boot'){ pressed.any=true; if(TOUCH.on) goFullscreen(); return true; }
  if(mode==='cine'||mode==='credits'||(typeof cut!=='undefined'&&cut)||(ui&&ui.type==='dialog')||(ui&&ui.type==='controls')||(mode==='title'&&titleControls)){ pressed.start=true; return true; }
  return false;
}
function addTap(x,y,w,h,fn){ TAPS.push({x,y,w,h,fn}); }
function goFullscreen(){ const el=document.documentElement; const rq=el.requestFullscreen||el.webkitRequestFullscreen; if(!rq||document.fullscreenElement) return;
  try{ const p=rq.call(el,{navigationUI:'hide'}); if(p&&p.then) p.then(()=>{ try{ screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} }).catch(()=>{}); }catch(e){} }
function toggleFullscreen(){ if(document.fullscreenElement){ document.exitFullscreen&&document.exitFullscreen().catch(()=>{}); } else goFullscreen(); }
// Estado visible según el modo (CSS oculta lo que no corresponde).
function touchFrame(){ if(!TOUCH.on) return; const m=mode==='play'&&(ui||(typeof cut!=='undefined'&&cut))?'menu':mode==='play'?'play':(mode==='cine'||mode==='boot'?'cine':'menu'); if(document.body.dataset.mode!==m) document.body.dataset.mode=m;
  if(innerHeight>innerWidth&&mode==='play'&&!ui&&!cut){ ui={type:'pause',sel:0}; } }
// Clic con mouse en el lienzo (botón de Google, menús).
cv.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'&&canvasTap(e.clientX,e.clientY)) if(e.cancelable) e.preventDefault(); });
// Sin zoom ni desplazamiento.
for(const ev of ['gesturestart','gesturechange','dblclick']) document.addEventListener(ev,e=>{ if(e.cancelable) e.preventDefault(); },{passive:false});
document.addEventListener('touchmove',e=>{ if(e.touches.length>1||!e.target.closest||!e.target.closest('#touch')) if(e.cancelable) e.preventDefault(); },{passive:false});
buildTouchUI(); if(isTouchDev()) enableTouch();
// Pantallas táctiles con mouse (notebooks): los controles aparecen recién al primer toque.
document.addEventListener('touchstart',e=>{ if(!TOUCH.on){ enableTouch(); initAudio(); canvasTap(e.touches[0].clientX,e.touches[0].clientY); if(e.cancelable) e.preventDefault(); } },{passive:false});
