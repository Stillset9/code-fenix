// CODE FENIX — núcleo: entrada, estado, física, jugador, combate, IA, guardado.
'use strict';
const W=320, H=180, STEP=1/60;
const GRAV=900, RUN=88, JUMP=272, DJUMP=245;
const cv=document.getElementById('game'); const ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
const SW=W*2, SH=H*2; // resolución interna real: 640x360 (el mundo lógico sigue en 320x180 a escala 2)
const dark=mkCanvas(SW,SH), dctx=dark.getContext('2d');
function resize(){ const vw=innerWidth, vh=innerHeight; const k=Math.min(vw/SW, vh/SH); const s=k>=2?Math.floor(k):k; cv.style.width=Math.floor(SW*s)+'px'; cv.style.height=Math.floor(SH*s)+'px'; }
addEventListener('resize', resize); addEventListener('orientationchange',()=>setTimeout(resize,200)); if(window.visualViewport) visualViewport.addEventListener('resize',resize); resize();
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const approach=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
const rnd=(a,b)=>a+Math.random()*(b-a);
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

// ---------------- Entrada ----------------
const keys={}, pressed={}, padHeld={}; let padPrev={};
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',
  KeyE:'interact',Space:'jump',KeyZ:'jump',KeyJ:'light',KeyX:'light',KeyK:'heavy',KeyC:'heavy',KeyL:'shoot',KeyV:'shoot',
  ShiftLeft:'dodge',ShiftRight:'dodge',KeyQ:'parry',KeyR:'heal',KeyF:'spell',KeyT:'cycle',KeyG:'quick',KeyI:'inventory',Tab:'inventory',
  Escape:'pause',KeyP:'pause',Enter:'start',NumpadEnter:'start',KeyM:'mute',Backspace:'back'};
addEventListener('keydown',e=>{ if(typeof rebindHook==='function'&&rebindHook(e)) return; const a=KEYMAP[e.code]; initAudio(); pressed.any=true; if(a){ if(!keys[a]) pressed[a]=true; keys[a]=true; e.preventDefault(); } });
addEventListener('keyup',e=>{ const a=KEYMAP[e.code]; if(a){ keys[a]=false; e.preventDefault(); } });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
const held=a=>!!(keys[a]||padHeld[a]||(typeof touchHeld!=='undefined'&&touchHeld[a]));
function pollPad(){
  const gps=navigator.getGamepads?navigator.getGamepads():[]; const gp=gps&&gps[0]; if(!gp) return;
  const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed); const ax=gp.axes[0]||0, ay=gp.axes[1]||0;
  const st={left:ax<-0.4||b(14),right:ax>0.4||b(15),up:ay<-0.6||b(12),down:ay>0.6||b(13),interact:b(12),jump:b(0),dodge:b(1),light:b(2),heavy:b(3),
    parry:b(4),shoot:b(5),heal:b(6),spell:b(7),inventory:b(8),pause:b(9),start:b(9),cycle:b(10),quick:b(11)};
  for(const k in st){ if(st[k]&&!padPrev[k]){ pressed[k]=true; pressed.any=true; initAudio(); } padHeld[k]=st[k]; }
  padPrev=st;
}
const confirmP=()=>pressed.start||pressed.jump||pressed.light||pressed.interact;
const backP=()=>pressed.pause||pressed.dodge||pressed.back;

// ---------------- Estado ----------------
let mode='boot', time=0, fade=0, shake=0, hitstop=0, endT=0;
let room=null, roomId=null, bgL=null, ui=null;
let decals=[], ents=[], projs=[], parts=[], floaters=[], pickups=[], altars=[], signs=[], decor=[], lights=[], npcs=[], props=[];
const cam={x:0,y:0};
const flags={wings:false,dash:false,key:false,door:false,boss:false};
const taken=new Set(), permKilled=new Set(); let killed={};
let checkpoint={room:'atrio',x:6*8+14,y:21*8};
let waxDrop=null, toastM=null, bannerM=null, roomTitle={text:'',t:0}, bossRef=null, litAltars=new Set(), shopStock=[];
const P={x:0,y:0,w:8,h:15,vx:0,vy:0,face:1,onGround:false,coyote:0,jumpBuf:0,canDouble:true,airDash:true,dropT:0,dropThrough:false,
  hp:100,maxHp:100,hpShown:100,st:100,maxSt:100,stDelay:0,foco:50,maxFoco:50,flasks:3,maxFlasks:3,ammo:6,maxAmmo:6,credits:0,
  look:defaultLook(),stats:{vig:10,res:10,fue:10,des:10,men:10},level:1,items:{},weapons:{},wpn:'hoz',gun:'pistola',spells:[],spellIdx:0,
  state:'normal',t:0,inv:0,combo:0,queued:false,hitSet:new Set(),healed:false,lastSafe:{x:0,y:0},prevVy:0,gunCd:0,atk:null,kind:'',erupted:false,lastMulti:0,critT:null,castDone:false};
const pcx=()=>P.x+P.w/2, pcy=()=>P.y+P.h/2;
const hasSk=id=>!!(P.skills&&P.skills.includes(id));
function recalc(){ P.maxHp=60+P.stats.vig*4; P.maxSt=60+P.stats.res*4; P.maxFoco=20+P.stats.men*3+(hasSk('brasa')?10:0); P.level=P.stats.vig+P.stats.res+P.stats.fue+P.stats.des+P.stats.men-49; }
const levelCost=()=>Math.round(60*Math.pow(1.12,P.level-1));
function weaponMult(id){ const w=WEAPONS[id], lv=P.weapons[id]||0; return (1+0.18*lv)*(1+(w.scF||0)*(P.stats.fue-10)*0.05+(w.scD||0)*(P.stats.des-10)*0.05); }
const spellMult=()=>(1+(P.stats.men-10)*0.07)*(hasSk('verso')?1.2:1);

function giveItem(id,n=1,quiet){ P.items[id]=(P.items[id]||0)+n;
  if(id==='alas') flags.wings=true; if(id==='impulso') flags.dash=true; if(id==='llave') flags.key=true;
  if(!quiet) floater(pcx(),P.y-10,'+'+ITEMS[id].name,'#ffd860'); }
function takeItem(id,n=1){ P.items[id]=(P.items[id]||0)-n; if(P.items[id]<=0) delete P.items[id]; }
function giveWeapon(id){ if(P.weapons[id]===undefined) P.weapons[id]=0; }
function learnSpell(id){ if(!P.spells.includes(id)){ P.spells.push(id); toast('Aprendiste un verso: '+SPELLS[id].name+'. Pulsá F para lanzarlo.',4); } }

// ---------------- Mundo ----------------
function tileAt(tx,ty){ if(tx<0||ty<0||tx>=room.w||ty>=room.h) return '#'; return room.g[ty][tx]; }
const isSolid=c=>c==='#'||c==='D'||c==='X';
function moveEntity(e,dt){
  e.hitWallX=false; e.hitWallY=false;
  let nx=e.x+e.vx*dt;
  if(e.vx!==0){
    const dir=Math.sign(e.vx); const edge=dir>0?nx+e.w-0.001:nx; const tx=Math.floor(edge/TILE);
    const ty0=Math.floor(e.y/TILE), ty1=Math.floor((e.y+e.h-0.001)/TILE);
    for(let ty=ty0;ty<=ty1;ty++){ if(isSolid(tileAt(tx,ty))){ nx=dir>0?tx*TILE-e.w:(tx+1)*TILE; e.vx=0; e.hitWallX=true; break; } }
  }
  e.x=nx; e.onGround=false;
  let ny=e.y+e.vy*dt;
  const tx0=Math.floor(e.x/TILE), tx1=Math.floor((e.x+e.w-0.001)/TILE);
  if(e.vy>0){
    const oldB=e.y+e.h, ty=Math.floor((ny+e.h-0.001)/TILE);
    for(let tx=tx0;tx<=tx1;tx++){ const c=tileAt(tx,ty);
      if(isSolid(c)||(c==='='&&!e.dropThrough&&oldB<=ty*TILE+0.5&&!e.fly)){ ny=ty*TILE-e.h; e.vy=0; e.onGround=true; e.hitWallY=true; break; } }
  } else if(e.vy<0){
    const ty=Math.floor(ny/TILE);
    for(let tx=tx0;tx<=tx1;tx++){ if(isSolid(tileAt(tx,ty))){ ny=(ty+1)*TILE; e.vy=0; e.hitWallY=true; break; } }
  }
  e.y=ny;
}
function groundAhead(e){ const tx=Math.floor((e.face>0?e.x+e.w+1:e.x-1)/TILE), ty=Math.floor((e.y+e.h+1)/TILE); const c=tileAt(tx,ty); return isSolid(c)||c==='='; }
function wallAhead(e){ const tx=Math.floor((e.face>0?e.x+e.w+1:e.x-1)/TILE), ty=Math.floor((e.y+e.h-2)/TILE); if(tx<=2||tx>=room.w-3) return true; return isSolid(tileAt(tx,ty)); }
function standingOnPlatform(e){ const ty=Math.floor((e.y+e.h+1)/TILE); let plat=false; for(let tx=Math.floor(e.x/TILE);tx<=Math.floor((e.x+e.w-0.001)/TILE);tx++){ const c=tileAt(tx,ty); if(isSolid(c)) return false; if(c==='=') plat=true; } return plat; }
function tilesOverlapping(b,fn){ for(let ty=Math.floor(b.y/TILE);ty<=Math.floor((b.y+b.h-0.001)/TILE);ty++) for(let tx=Math.floor(b.x/TILE);tx<=Math.floor((b.x+b.w-0.001)/TILE);tx++){ if(fn(tileAt(tx,ty),tx,ty)) return true; } return false; }

const ENEMY_T={G:{type:'ahogado',w:10,h:13,hp:32,wax:16,cdmg:10,poise:20,mat:0.15},V:{type:'polilla',w:10,h:8,hp:16,wax:10,cdmg:10,fly:true,poise:8,mat:0.1},
  C:{type:'campanero',w:12,h:19,hp:85,wax:50,cdmg:8,poise:55,mat:0.5},O:{type:'campanero',w:12,h:19,hp:190,wax:260,cdmg:10,poise:90,mat:1,named:'ordono',title:'ORDOÑO, EL CAMPANERO MAYOR'},
  J:{type:'abadesa',w:20,h:36,hp:560,wax:500,cdmg:15,poise:160,named:'abadesa',title:'LA ABADESA HUECA'}};
function makeEnemy(ch,tx,ty,idx){
  const T=ENEMY_T[ch];
  const e=Object.assign({},T,{idx,maxHp:T.hp,poiseMax:T.poise,poiseT:0,x:tx*8+4-T.w/2,y:(ty+1)*8-T.h,vx:0,vy:0,face:-1,t:0,flash:0,cd:0,
    home:{x:tx*8+4,y:ty*8+4},onGround:false,anim:Math.random()*10,dead:false,rec:0.6,ph2:false,stagT:0,engaged:false});
  e.state={ahogado:'patrol',polilla:'idle',campanero:'idle',abadesa:'dormant'}[e.type];
  if(ch==='V') e.y=ty*8;
  if(ch==='J') e.dropThrough=true;
  return e;
}
function loadRoom(id,spawn,px,py,quiet){
  const def=ROOMS[id], r=def.build();
  room={id,def,w:r.w,h:r.h,g:r.g,spawns:{}}; roomId=id;
  ents=[]; projs=[]; pickups=[]; altars=[]; npcs=[]; bossRef=null;
  parts=[]; decals=[];
  if(!killed[id]) killed[id]=new Set();
  let idx=0;
  for(let y=0;y<r.h;y++) for(let x=0;x<r.w;x++){
    const ch=r.g[y][x];
    if('GVCJO'.includes(ch)){ const i=idx++; r.g[y][x]='.'; const T=ENEMY_T[ch];
      if(T.named==='ordono'&&permKilled.has('ordono')) continue;
      if(!killed[id].has(i)){ const e=makeEnemy(ch,x,y,i); ents.push(e); } }
    else if(ch==='A'){ r.g[y][x]='.'; altars.push({x:x*8+4,y:(y+1)*8,id:id+':'+x}); }
    else if(ch>='a'&&ch<='e'){ room.spawns[ch]={x:x*8+4,y:(y+1)*8}; r.g[y][x]='.'; }
    else if(ch==='D'&&flags.door){ r.g[y][x]='.'; }
  }
  for(const it of (def.items||[])){ const key=id+':'+(it.id||it.weapon)+':'+it.x; if(!taken.has(key)) pickups.push({id:it.id,weapon:it.weapon,x:it.x*8+4,y:it.y*8+4,key}); }
  for(const n of (def.npcs||[])){ const d=NPCS[n.id]; if(d.present&&!d.present()) continue; npcs.push({id:n.id,x:n.x*8+4,y:(n.y+1)*8,face:-1}); }
  props=(def.props||[]).map(p=>({t:p.t,x:p.x*8+4,y:(p.y+1)*8}));
  signs=(def.signs||[]).filter(s=>!s.cond||s.cond()).map(s=>({x:s.x*8+4,y:(s.y+1)*8,text:typeof s.t==='function'?s.t():s.t,tt:s.tt}));
  bgL=getBg(def.bg,def.stone);
  buildTiles(); buildDecor();
  if(spawn){ const s=room.spawns[spawn]; P.x=s.x-P.w/2; P.y=s.y-P.h; }
  else if(px!==undefined){ P.x=px-P.w/2; P.y=py-P.h; }
  P.vy=0; P.lastSafe={x:pcx(),y:P.y+P.h};
  updateCamera(0,true);
  if(!quiet) roomTitle={text:def.name,t:2.6};
}
function resetEnemies(){ for(const k in killed) killed[k].clear(); }

// ---------------- Efectos ----------------
function part(x,y,vx,vy,life,color,o={}){ parts.push(Object.assign({x,y,vx,vy,life,max:life,color,g:0,size:1,glow:0},o)); }
function burst(x,y,n,colors,sp=60,o={}){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=Math.random()*sp; part(x,y,Math.cos(a)*s,Math.sin(a)*s-sp*0.3,rnd(0.3,0.8),colors[i%colors.length],Object.assign({g:200},o)); } }
function floater(x,y,text,color,o={}){ floaters.push(Object.assign({x,y,text,color,t:1.3,vx:o.dmg?rnd(-12,12):0},o)); }
function bloodSplash(x,y,dir,n){
  for(let i=0;i<n;i++){ const sp=rnd(40,170); const a=rnd(-0.9,0.5); part(x,y,Math.cos(a)*sp*dir,Math.sin(a)*sp-30,rnd(0.5,1.1),['#8a0f1a','#c0202a','#5a0a12','#e0303a'][i%4],{g:420,blood:1,size:0.5+Math.floor(Math.random()*3)*0.5}); }
  for(let i=0;i<6;i++) part(x+dir*rnd(0,8),y+rnd(-4,4),dir*rnd(10,40),rnd(-10,10),rnd(0.15,0.3),'#d02030',{g:0,size:2});
}
function toast(text,t=2.8){ toastM={text,t}; }
function banner(title,sub,t=3,color='#e9dcc4'){ bannerM={title,sub,t,max:t,color}; }

// ---------------- Partida / guardado ----------------
const SAVE_KEY='codefenix_save_v1';
function newGameState(){
  Object.assign(P,{stats:{vig:10,res:10,fue:10,des:10,men:10},items:{},weapons:{hoz:0,pistola:0},wpn:'hoz',gun:'pistola',spells:[],spellIdx:0,
    credits:0,maxFlasks:3,maxAmmo:6,state:'normal',inv:0,face:1,vx:0,vy:0,skills:[],skillPts:1,quick:null,fenixUsed:false});
  recalc(); refill();
  for(const k in flags) flags[k]=false; for(const k in q) q[k]=0;
  taken.clear(); permKilled.clear(); killed={}; waxDrop=null; litAltars=new Set(); ui=null; endT=0;
  shopStock=SHOP_BASE.map(s=>Object.assign({},s));
  checkpoint={room:'atrio',x:6*8+14,y:21*8};
}
function refill(){ P.hp=P.maxHp; P.hpShown=P.maxHp; P.st=P.maxSt; P.foco=P.maxFoco; P.flasks=P.maxFlasks; P.ammo=P.maxAmmo; }
function startGame(look){
  if(look) P.look=look; buildPlayerSprites(P.look);
  newGameState(); mode='play'; fade=1; loadRoom('atrio','a');
  banner('CODE FENIX','Velmora arde mal desde que se abrió el Ojo. Despertá, '+FAR()+'.',4.5,'#ffd860');
}
function saveGame(){
  try{ const d={v:1,P:{look:P.look,stats:P.stats,items:P.items,weapons:P.weapons,wpn:P.wpn,gun:P.gun,spells:P.spells,spellIdx:P.spellIdx,credits:P.credits,maxFlasks:P.maxFlasks,maxAmmo:P.maxAmmo,skills:P.skills,skillPts:P.skillPts,quick:P.quick},
    flags,q,taken:[...taken],perm:[...permKilled],checkpoint,waxDrop,lit:[...litAltars],stock:shopStock,time:Date.now()};
    d.savedAt=Date.now(); localStorage.setItem(SAVE_KEY,JSON.stringify(d)); if(typeof cloudAfterSave==='function') cloudAfterSave(); return true; }catch(e){ return false; }
}
function hasSave(){ try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; } }
function loadGame(){
  try{ const d=JSON.parse(localStorage.getItem(SAVE_KEY)); if(!d) return false;
    newGameState(); Object.assign(P,d.P); if(!P.look) P.look=defaultLook(); buildPlayerSprites(P.look); Object.assign(flags,d.flags); Object.assign(q,d.q);
    d.taken.forEach(k=>taken.add(k)); d.perm.forEach(k=>permKilled.add(k)); d.lit.forEach(k=>litAltars.add(k));
    checkpoint=d.checkpoint; waxDrop=d.waxDrop; shopStock=d.stock||shopStock;
    recalc(); refill(); mode='play'; fade=1; loadRoom(checkpoint.room,null,checkpoint.x,checkpoint.y);
    toast('Partida cargada. El Código te reescribe junto a la pira.'); return true;
  }catch(e){ console.error(e); return false; }
}
function respawn(){
  recalc(); refill(); Object.assign(P,{state:'normal',inv:1,vx:0,vy:0});
  resetEnemies(); fade=1; loadRoom(checkpoint.room,null,checkpoint.x,checkpoint.y);
}
function killPlayer(){
  if(hasSk('fenix')&&!P.fenixUsed){ P.fenixUsed=true; P.hp=Math.ceil(P.maxHp*0.3); P.inv=1.5; P.state='normal'; banner('ÚLTIMO ALIENTO','El Código se niega a soltarte... todavía.',2.5,'#ff9a3a'); burst(pcx(),pcy(),30,['#ffd860','#ff9a3a','#fff'],110,{g:-40,glow:1}); sfx('rest'); return; }
  P.hp=0; P.state='dead'; P.t=0; sfx('die'); shake=6;
  waxDrop = P.credits>0 ? {room:roomId,x:P.lastSafe.x,y:P.lastSafe.y,amount:P.credits} : null;
  P.credits=0; banner('TE CONSUMISTE','Tus Créditos quedaron donde caíste. El Código te reescribe...',2.8,'#e0502a');
}

// ---------------- Combate del jugador ----------------
const PARRY_BASE=0.2; const parryWin=()=>PARRY_BASE+(hasSk('contra')?0.08:0);
function hurtPlayer(dmg,srcX,src,parryable){
  if(P.state==='dead'||P.inv>0||(P.state==='roll'&&P.t<0.32)||(P.state==='dash'&&P.t<0.12)||P.state==='crit') return false;
  if(P.state==='parry'&&P.t<parryWin()&&parryable&&src){ parrySuccess(src); return false; }
  if(hasSk('piel')) dmg=Math.ceil(dmg*0.9);
  P.hp-=dmg; P.inv=0.9; P.state='hurt'; P.t=0;
  for(let i=0;i<10;i++) part(pcx(),pcy(),rnd(-60,60)+(Math.sign(pcx()-srcX)||1)*40,rnd(-110,-20),rnd(0.6,1.2),['#8a0f1a','#c0202a','#5a0a12'][i%3],{g:420,blood:1,size:0.5+Math.floor(Math.random()*2)*0.5});
  const d=Math.sign(pcx()-srcX)||-P.face; P.vx=d*130; P.vy=-150; P.onGround=false;
  shake=Math.max(shake,4); hitstop=0.06; sfx('hurt');
  burst(pcx(),pcy(),10,['#a3202e','#5c0f1a','#d84a4a'],70);
  if(P.hp<=0) killPlayer();
  return true;
}
function parrySuccess(e){
  if(hasSk('contra')) P.foco=Math.min(P.maxFoco,P.foco+10);
  sfx('parry'); hitstop=0.14; shake=4; P.state='normal'; P.inv=0.35; P.foco=Math.min(P.maxFoco,P.foco+10);
  floater(pcx(),P.y-8,'¡PARADA!','#fff0a0'); burst(pcx()+P.face*6,pcy(),14,['#fff','#ffe080'],90,{g:0,glow:1});
  if(e.type==='abadesa'){ e.poise-=80; e.poiseT=0; if(e.poise<=0) staggerEnemy(e); else { e.state='recover'; e.t=0; e.rec=0.5; e.vx=0; } }
  else staggerEnemy(e);
}
function curWeapon(){ return WEAPONS[P.wpn]; }
function startAttack(kind,combo=0,mult=1){
  const w=curWeapon(); let a=kind==='light'?w.light[combo]:kind==='heavy'?w.heavy:w.art;
  P.state='attack'; P.t=0; P.kind=kind; P.combo=combo; P.atk=a; P.atkMult=mult; P.queued=false; P.hitSet=new Set(); P.erupted=false; P.lastMulti=0;
  P.st=Math.max(0,P.st-a.st); P.stDelay=0.6;
  sfx(kind==='art'?'charge':'swing'); if(P.onGround&&a.lunge&&!a.dash) P.vx=P.face*a.lunge;
  if(kind==='art') { burst(pcx(),pcy(),12,['#ffd860','#ff9a3a'],60,{glow:1,g:-20}); floater(pcx(),P.y-10,a.name.toUpperCase(),'#ffb050'); }
}
function attackBox(a){
  if(a.spin) return {x:pcx()-a.reach,y:pcy()-a.h/2,w:a.reach*2,h:a.h};
  const reach=a.reach||18, h=a.h||16;
  return {x:P.face>0?P.x+P.w-2:P.x+2-reach,y:pcy()-h/2-1,w:reach,h};
}
function attackHits(a){
  const hb=attackBox(a);
  const skM=(P.kind==='light'&&hasSk('filo')?1.1:1)*((P.kind==='heavy'||P.kind==='art')&&hasSk('ira')?1.15:1);
  const dmg=Math.round(a.dmg*weaponMult(P.wpn)*(P.atkMult||1)*skM);
  for(const e of ents){ if(!e.dead&&!P.hitSet.has(e)&&overlap(hb,e)){ P.hitSet.add(e);
    const hit=damageEnemy(e,dmg,P.face,a.poise*(P.atkMult||1)*(hasSk('ira')&&P.kind!=='light'?1.2:1)); if(hit) P.foco=Math.min(P.maxFoco,P.foco+(P.kind==='art'?0:2)+(hasSk('chispa')?2:0)); } }
  for(const p of projs){ if(p.owner==='e'&&p.type==='orb'&&!p.dead&&overlap(hb,{x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h})){ p.dead=true; burst(p.x,p.y,8,['#c9b8ff','#fff'],60); sfx('clang'); } }
}
function findCritTarget(){ const box={x:P.face>0?P.x:P.x-22,y:P.y-6,w:P.w+22,h:P.h+12}; return ents.find(e=>!e.dead&&e.state==='stagger'&&overlap(box,e)); }
function tryCrit(){ const e=findCritTarget(); if(!e) return false; P.state='crit'; P.t=0; P.critT=e; P.vx=0; P.inv=0.7; e.face=Math.sign(pcx()-(e.x+e.w/2))||1; return true; }
function startRoll(){ const dir=(held('right')?1:0)-(held('left')?1:0); if(dir) P.face=dir; P.state='roll'; P.t=0; P.st=Math.max(0,P.st-22*(hasSk('paso')?0.7:1)); P.stDelay=0.7; sfx('roll'); }
function startDash(){ const dir=(held('right')?1:0)-(held('left')?1:0); if(dir) P.face=dir; P.state='dash'; P.t=0; P.airDash=false; P.st=Math.max(0,P.st-18*(hasSk('paso')?0.7:1)); P.stDelay=0.6; P.vy=0; sfx('dash'); }
function startParry(){ P.state='parry'; P.t=0; P.st=Math.max(0,P.st-12); P.stDelay=0.6; P.vx=0; sfx('swing'); }
function tryHeal(){ if(P.flasks>0){ P.state='heal'; P.t=0; P.healed=false; P.flasks--; } else { toast('No te quedan Lágrimas de Fénix. Descansá en una pira.'); sfx('deny'); } }
function tryShoot(){
  if(P.gunCd>0) return; const g=WEAPONS[P.gun]; if(!g) return;
  if(P.ammo<=0){ toast('Sin balas. Las piras recargan tu munición.'); sfx('deny'); P.gunCd=0.4; return; }
  P.ammo--; P.gunCd=g.cd; P.state='shoot'; P.t=0; sfx('shot'); shake=Math.max(shake,1.5);
  const dmg=Math.round(g.dmg*weaponMult(P.gun));
  for(let i=0;i<g.pellets;i++){ const a=(g.pellets>1?(i/(g.pellets-1)-0.5)*2*g.spread:0)+rnd(-0.03,0.03);
    projs.push({owner:'p',type:'bullet',x:pcx()+P.face*8,y:pcy()-1,vx:Math.cos(a)*g.speed*P.face,vy:Math.sin(a)*g.speed,w:4,h:3,dmg,poise:g.poise,life:g.life}); }
  burst(pcx()+P.face*10,pcy()-1,6,['#fff0a0','#ff9a3a'],50,{g:0,glow:1}); addLight(pcx()+P.face*10,pcy(),30,true);
}
function cycleSpell(){ if(P.spells.length>1){ P.spellIdx=(P.spellIdx+1)%P.spells.length; toast('Verso: '+SPELLS[P.spells[P.spellIdx]].name,1.5); sfx('menu'); } }
function tryCast(){
  const id=P.spells[P.spellIdx]; if(!id){ toast('Todavía no conocés ningún verso.'); sfx('deny'); return; }
  const s=SPELLS[id]; if(P.foco<s.cost){ toast('Te falta Foco. Golpeá enemigos o usá una Ampolla de Foco.'); sfx('deny'); return; }
  P.foco-=s.cost; P.state='cast'; P.t=0; P.castDone=false; P.castId=id; P.vx=0;
}
function damageEnemy(e,dmg,dir,poiseDmg,opts={}){
  if(e.state==='dying'||e.state==='dormant'||e.dead) return false;
  let d=dmg, pd=poiseDmg||0; const ecx=e.x+e.w/2;
  const guarded=!opts.crit&&guarding(e)&&Math.sign(pcx()-ecx)===e.face;
  if(guarded){ d=Math.ceil(dmg*0.2); pd*=0.5; sfx('clang'); burst(ecx+e.face*6,e.y+8,6,['#ffe9a0','#fff'],80,{g:100}); if(!opts.ranged) P.vx=-dir*90; }
  else { sfx('hit'); if(e.type==='abadesa') burst(ecx,e.y+e.h/2,7,['#c9b8ff','#5a3a9a','#fff'],70); else bloodSplash(ecx,e.y+e.h/2,dir,opts.crit?34:14); }
  e.hp-=d; e.flash=0.1; hitstop=Math.max(hitstop,opts.ranged?0.02:0.04); shake=Math.max(shake,2); e.engaged=true;
  floater(ecx+rnd(-3,3),e.y-2,String(d),guarded?'#9a9aa8':opts.crit?'#ff6a3a':'#f4ece0',{dmg:1,big:!!opts.crit});
  if(opts.ranged&&isWindup(e)&&e.state!=='stagger'){
    if(e.type==='abadesa') pd+=60; else { floater(ecx,e.y-12,'¡INTERRUMPIDO!','#ffb050'); staggerEnemy(e); pd=0; }
  }
  if(e.state!=='stagger'){
    e.poise-=pd; e.poiseT=0;
    if(e.type==='ahogado'&&!guarded){ e.vx=dir*90; e.vy=-60; e.state='hurt'; e.t=0; }
    else if(e.type==='polilla'){ e.vx=dir*100; e.vy=-40; e.state='retreat'; e.t=0; }
    if(e.poise<=0&&e.hp>0) staggerEnemy(e);
  }
  if(e.hp<=0) killEnemy(e);
  return true;
}
function isWindup(e){ return ['wind','sweepWind','chargeWind','orbWind'].includes(e.state); }
function guarding(e){ return e.type==='campanero'&&(e.state==='idle'||e.state==='walk'||e.state==='wind'); }
function staggerEnemy(e){
  if(e.state==='dying'||e.dead) return;
  e.state='stagger'; e.stagT=e.type==='abadesa'?2.4:1.9; e.t=0; e.vx=0; e.wasFly=e.fly; e.fly=false; e.poise=0;
  sfx('stagger'); floater(e.x+e.w/2,e.y-6,'¡ATURDIDO!','#ffd860'); burst(e.x+e.w/2,e.y,8,['#ffd860','#fff'],50,{g:0,glow:1});
}
function recoverStagger(e){
  e.poise=e.poiseMax; e.fly=!!e.wasFly; e.t=0;
  e.state={ahogado:'chase',polilla:'retreat',campanero:'walk',abadesa:'recover'}[e.type]; e.rec=0.3;
}
function killEnemy(e){
  const ecx=e.x+e.w/2, ecy=e.y+e.h/2;
  if(e.type==='abadesa'){ e.state='dying'; e.t=0; sfx('roar'); shake=8; return; }
  e.dead=true; killed[roomId].add(e.idx); const gain=Math.round(e.wax*(hasSk('avaricia')?1.15:1)); P.credits+=gain; sfx('kill');
  burst(ecx,ecy,16,['#1a1018','#3a2030','#d0a040'],90);
  for(let i=0;i<6;i++) part(ecx,ecy,rnd(-30,30),rnd(-80,-30),rnd(0.6,1),'#ffd860',{g:120,glow:1});
  floater(ecx,ecy-10,'+'+gain+' CRÉDITOS','#ffd860');
  if(Math.random()<(e.mat||0)){ giveItem('fragmento',1,true); floater(ecx,ecy-20,'+FRAGMENTO DE BRASA','#ff9a3a'); }
  if(e.named==='ordono'){ permKilled.add('ordono'); q.ordonoDead=1; P.skillPts=(P.skillPts||0)+1; banner('ORDOÑO DESCANSA','El bronce dejó de llorar. Galvano querrá saberlo.',4,'#d8c8a8'); }
}
function rest(a){
  recalc(); refill(); P.vx=0; P.fenixUsed=false;
  checkpoint={room:roomId,x:a.x+12,y:a.y};
  resetEnemies(); loadRoom(roomId,null,pcx(),P.y+P.h,true);
  P.state='normal'; sfx('rest');
  if(!litAltars.has(a.id)){ litAltars.add(a.id); toast('Pira encendida. Si te consumís, el Código te reescribe aquí.'); }
  burst(a.x,a.y-12,20,['#ffd860','#ff9a3a','#fff3c0'],50,{g:-40,glow:1});
  const ok=saveGame(); ui={type:'pyre',sel:0,saved:ok};
}
function nearNpc(){ return npcs.find(n=>Math.abs(n.x-pcx())<16&&Math.abs(n.y-(P.y+P.h))<14); }
function nearAltar(){ return altars.find(a=>Math.abs(a.x-pcx())<14&&Math.abs(a.y-(P.y+P.h))<12); }
function interact(){
  const n=nearNpc(); if(n&&P.onGround){ n.face=Math.sign(pcx()-n.x)||1; openDialog(n.id); return true; }
  const a=nearAltar(); if(a&&P.onGround){ rest(a); return true; }
  return false;
}

// ---------------- Jugador ----------------
function updatePlayer(dt){
  const p=P;
  if(p.state==='dead'){ p.t+=dt; p.vx*=0.9; p.vy=Math.min(380,p.vy+GRAV*dt); moveEntity(p,dt); if(p.t>3) respawn(); return; }
  p.inv=Math.max(0,p.inv-dt); p.gunCd=Math.max(0,p.gunCd-dt);
  const dir=(held('right')?1:0)-(held('left')?1:0);
  if(pressed.jump) p.jumpBuf=0.12; else p.jumpBuf=Math.max(0,p.jumpBuf-dt);
  p.coyote=Math.max(0,p.coyote-dt); p.dropT=Math.max(0,p.dropT-dt); p.dropThrough=p.dropT>0;
  if(p.stDelay>0) p.stDelay-=dt; else if(p.state==='normal'||p.state==='hurt'||p.state==='shoot') p.st=Math.min(p.maxSt,p.st+55*dt);
  p.foco=Math.min(p.maxFoco,p.foco+0.6*dt);
  p.t+=dt;
  let noGrav=false;
  switch(p.state){
    case 'normal':{
      p.vx=approach(p.vx,dir*RUN,(p.onGround?1000:650)*dt);
      if(dir) p.face=dir;
      if(p.jumpBuf>0){
        if(held('down')&&p.onGround&&standingOnPlatform(p)){ p.dropT=0.25; p.dropThrough=true; p.jumpBuf=0; p.y+=1; }
        else if(p.onGround||p.coyote>0){ p.vy=-JUMP; p.jumpBuf=0; p.coyote=0; p.onGround=false; sfx('jump'); burst(pcx(),p.y+p.h,4,['#5a5068'],30,{g:0}); }
        else if(flags.wings&&p.canDouble){ p.vy=-DJUMP; p.canDouble=false; p.jumpBuf=0; sfx('djump'); burst(pcx(),p.y+p.h,10,['#2a2238','#4a3f63','#111'],60,{g:-30}); }
      }
      if(pressed.light&&p.st>0){ if(!tryCrit()) startAttack('light',0); }
      else if(pressed.heavy&&p.st>0){ p.state='charge'; p.t=0; }
      else if(pressed.shoot) tryShoot();
      else if(pressed.dodge&&p.st>0){ if(p.onGround) startRoll(); else if(flags.dash&&p.airDash) startDash(); }
      else if(pressed.parry&&p.st>0&&p.onGround) startParry();
      else if(pressed.heal&&p.onGround) tryHeal();
      else if(pressed.spell) tryCast();
      else if(pressed.cycle) cycleSpell();
      else if(pressed.interact||pressed.up) interact();
      break;}
    case 'charge':{
      p.vx=approach(p.vx,0,800*dt);
      if(p.t>0.7&&!p.chargedFx){ p.chargedFx=true; sfx('charge'); burst(pcx(),pcy(),10,['#ffd860','#ff9a3a'],40,{g:-30,glow:1}); }
      if(Math.random()<p.t) part(pcx()+rnd(-6,6),pcy()+rnd(-6,6),0,-20,0.3,p.t>0.7?'#ffd860':'#a07040',{glow:1});
      if(!held('heavy')||p.t>1.4){ const full=p.t>=0.7; p.chargedFx=false; const art=curWeapon().art;
        if(full&&p.foco>=art.foco){ p.foco-=art.foco; startAttack('art'); } else startAttack('heavy',0,full?1.35:1); }
      else if(pressed.dodge&&p.onGround&&p.st>0){ p.chargedFx=false; startRoll(); }
      break;}
    case 'attack':{
      const a=p.atk;
      if(a.dash&&p.t>=a.hs*0.5&&p.t<=a.he) p.vx=p.face*a.lunge; else if(p.onGround) p.vx=approach(p.vx,0,600*dt); else p.vx=approach(p.vx,dir*RUN,400*dt);
      if(pressed.light&&p.t>a.dur*0.25) p.queued=true;
      if(p.t>=a.hs&&p.t<=a.he){
        if(a.multi&&p.t-p.lastMulti>=a.multi){ p.hitSet=new Set(); p.lastMulti=p.t; }
        attackHits(a);
        if(a.erupt&&!p.erupted){ p.erupted=true; shake=6; sfx('slam');
          const dmg=Math.round(a.dmg*weaponMult(p.wpn));
          for(const s of [-1,1]) projs.push({owner:'p',type:'pillar',x:pcx()+s*12,y:p.y+p.h-8,vx:s*150,vy:0,w:8,h:16,dmg,poise:20,life:0.7,hit:new Set()}); }
      }
      const w=curWeapon();
      if(p.t>=a.dur*0.65&&p.queued&&p.kind==='light'&&p.combo<w.light.length-1&&p.st>0){ startAttack('light',p.combo+1); break; }
      if(pressed.dodge&&p.t>a.he&&p.onGround&&p.st>0){ startRoll(); break; }
      if(p.t>=a.dur) p.state='normal';
      break;}
    case 'roll':{
      p.vx=p.face*175*(1-(p.t/0.4)*0.6);
      if(Math.random()<0.5) part(pcx(),p.y+p.h,rnd(-10,10),rnd(-15,0),0.3,'#4a4058');
      if(p.t>=0.4){ p.state='normal'; p.vx*=0.5; }
      break;}
    case 'dash':{
      noGrav=true; p.vy=0; p.vx=p.face*240;
      part(pcx()-p.face*4,pcy()+rnd(-5,5),-p.face*30,0,0.3,Math.random()<0.5?'#ff9a3a':'#ffd860',{glow:1});
      if(p.t>=0.18){ p.state='normal'; p.vx=p.face*RUN; }
      break;}
    case 'parry':{ p.vx=approach(p.vx,0,800*dt); if(p.t>=0.42) p.state='normal'; break; }
    case 'crit':{
      p.vx=0; const e=p.critT;
      if(e&&!e.dead&&p.t>=0.25&&!p.critDone){ p.critDone=true; const base=Math.max(...curWeapon().light.map(a=>a.dmg));
        const dmg=Math.round(base*(e.type==='abadesa'?4:5)*weaponMult(p.wpn)*(hasSk('verdugo')?1.35:1)); hitstop=0.18; shake=8; sfx('crit');
        floater(e.x+e.w/2,e.y-14,'¡CRÍTICO!','#ff5a3a'); burst(e.x+e.w/2,e.y+e.h/2,24,['#a3202e','#ffd860','#fff'],110);
        e.state='hurtcrit'; damageEnemy(e,dmg,p.face,0,{crit:true}); if(!e.dead&&e.state!=='dying'){ recoverStagger(e); e.cd=0.8; } }
      if(p.t>=0.6){ p.state='normal'; p.critDone=false; }
      break;}
    case 'cast':{
      p.vx=approach(p.vx,0,800*dt);
      if(Math.random()<0.6) part(pcx()+p.face*6,pcy()-2,rnd(-10,10),rnd(-30,-10),0.4,'#ff9a3a',{glow:1});
      if(!p.castDone&&p.t>=0.18){ p.castDone=true; const s=SPELLS[p.castId], dmg=Math.round(s.dmg*spellMult());
        if(p.castId==='llama'){ sfx('spell'); projs.push({owner:'p',type:'fire',x:pcx()+p.face*8,y:pcy()-2,vx:p.face*210,vy:0,w:7,h:6,dmg,poise:18,life:1.4}); }
        else { sfx('nova'); shake=5; for(let i=0;i<40;i++){ const a=i/40*Math.PI*2; part(pcx(),pcy(),Math.cos(a)*140,Math.sin(a)*140,0.35,i%2?'#ff9a3a':'#ffd860',{glow:1}); }
          for(const e of ents){ const d=Math.hypot(e.x+e.w/2-pcx(),e.y+e.h/2-pcy()); if(d<46) damageEnemy(e,dmg,Math.sign(e.x-p.x)||1,35,{ranged:true}); }
          for(const pr of projs) if(pr.owner==='e'&&Math.hypot(pr.x-pcx(),pr.y-pcy())<46) pr.dead=true; } }
      if(p.t>=0.45) p.state='normal';
      break;}
    case 'shoot':{ p.vx=approach(p.vx,0,500*dt); if(p.t>=0.2) p.state='normal'; break; }
    case 'heal':{
      p.vx=approach(p.vx,0,800*dt);
      if(Math.random()<0.4) part(pcx()+rnd(-6,6),p.y+p.h,0,rnd(-40,-20),0.6,'#ffd860',{glow:1});
      if(!p.healed&&p.t>=0.45){ p.healed=true; p.hp=Math.min(p.maxHp,p.hp+50); sfx('heal'); floater(pcx(),p.y-4,'+50','#9fe08a'); }
      if(p.t>=0.75) p.state='normal';
      break;}
    case 'hurt':{ p.vx=approach(p.vx,0,300*dt); if(p.t>=0.35) p.state='normal'; break; }
  }
  if(!noGrav){ let g=GRAV; if(p.vy<0&&!held('jump')&&p.state==='normal') g*=2.3; p.prevVy=p.vy; p.vy=Math.min(380,p.vy+g*dt); }
  const wasG=p.onGround; moveEntity(p,dt);
  const onSpike=tilesOverlapping({x:p.x+1,y:p.y+2,w:p.w-2,h:p.h-2},c=>c==='^');
  if(p.onGround){ p.coyote=0.1; p.canDouble=true; p.airDash=true; if(!wasG&&p.prevVy>220) burst(pcx(),p.y+p.h,5,['#5a5068'],35,{g:0}); if(!onSpike) p.lastSafe={x:pcx(),y:p.y+p.h}; }
  if(onSpike){ if(hurtPlayer(22,pcx()-p.face*4)) p.vy=-260; else if(p.onGround) p.vy=-200; }
  if(p.state==='dead') return;
  let ex=null; tilesOverlapping(p,(c)=>{ if(c>='1'&&c<='9'&&room.def.exits[c]){ ex=room.def.exits[c]; return true; } return false; });
  if(ex){ const vx=p.vx; fade=1; loadRoom(ex.to,ex.at); p.vx=vx; return; }
  for(const k of pickups){ if(!k.got&&Math.abs(k.x-pcx())<9&&Math.abs(k.y-pcy())<12){ k.got=true; taken.add(k.key); sfx('item'); collectPickup(k); burst(k.x,k.y,24,['#ffd860','#fff','#c9b8ff'],80,{glow:1}); } }
  pickups=pickups.filter(k=>!k.got);
  if(waxDrop&&waxDrop.room===roomId&&Math.abs(waxDrop.x-pcx())<10&&Math.abs(waxDrop.y-(p.y+p.h))<16){
    P.credits+=waxDrop.amount; floater(pcx(),p.y-6,'+'+waxDrop.amount+' CRÉDITOS','#ffd860'); toast('Recuperaste tus Créditos.'); sfx('wax');
    burst(waxDrop.x,waxDrop.y-4,20,['#ffd860','#ffefb0'],70,{glow:1}); waxDrop=null; }
  if(roomId==='osario'&&!flags.door&&flags.key){
    if(tilesOverlapping({x:p.x-8,y:p.y,w:p.w+16,h:p.h},c=>c==='D')){
      flags.door=true; for(let y=0;y<room.h;y++) for(let x=0;x<room.w;x++) if(room.g[y][x]==='D'){ room.g[y][x]='.'; burst(x*8+4,y*8+4,4,['#e4d6c0','#8a8070'],50); }
      sfx('door'); shake=4; toast('La Llave de Hueso gira. La reja se deshace en polvo.'); }
  }
}
function collectPickup(k){
  if(k.weapon){ giveWeapon(k.weapon); banner(WEAPONS[k.weapon].name.toUpperCase(),'Arma nueva. Equipala en el inventario (I).',4); return; }
  giveItem(k.id,1,true);
  const n=ITEMS[k.id].name.toUpperCase();
  if(k.id==='alas') banner(n,'Saltá otra vez en el aire para hacer un doble salto.',4.5);
  else if(k.id==='impulso') banner(n,'Shift en el aire: impulso aéreo.',4.5);
  else if(k.id==='llave') banner(n,'Abre la reja sellada del Osario.',4.5);
  else floater(pcx(),P.y-10,'+'+ITEMS[k.id].name,'#ffd860');
}

// ---------------- IA ----------------
function aiAhogado(e,dt){
  const dx=pcx()-(e.x+e.w/2), dy=pcy()-(e.y+e.h/2), alive=P.state!=='dead';
  switch(e.state){
    case 'patrol': e.vx=e.face*18; if(wallAhead(e)||!groundAhead(e)){ e.face*=-1; e.vx=0; } if(alive&&Math.abs(dx)<110&&Math.abs(dy)<28) e.state='chase'; break;
    case 'chase': e.face=dx>0?1:-1; e.vx=e.face*42; if(!groundAhead(e)) e.vx=0;
      if(Math.abs(dx)<34&&Math.abs(dy)<22&&e.cd<=0){ e.state='wind'; e.t=0; }
      if(!alive||Math.abs(dx)>170) e.state='patrol'; break;
    case 'wind': e.vx=0; if(e.t>0.45){ e.state='lunge'; e.t=0; e.vx=e.face*155; e.vy=-90; sfx('growl'); } break;
    case 'lunge': if(e.onGround&&e.t>0.1) e.vx=approach(e.vx,0,500*dt); if(e.t>0.45){ e.state='recover'; e.t=0; } break;
    case 'recover': e.vx=approach(e.vx,0,600*dt); if(e.t>0.55){ e.state='chase'; e.cd=0.9; } break;
    case 'hurt': e.vx=approach(e.vx,0,400*dt); if(e.t>0.25) e.state='chase'; break;
  }
  e.vy=Math.min(380,e.vy+GRAV*dt); moveEntity(e,dt);
}
function aiPolilla(e,dt){
  const cx=e.x+e.w/2, cy=e.y+e.h/2, dx=pcx()-cx, dy=pcy()-cy, dist=Math.hypot(dx,dy), alive=P.state!=='dead';
  if(e.state!=='dive') e.face=dx>0?1:-1;
  switch(e.state){
    case 'idle':{ const tx=e.home.x+Math.sin(e.anim*1.1)*18, ty=e.home.y+Math.sin(e.anim*2.3)*6; e.vx=(tx-cx)*2; e.vy=(ty-cy)*2; if(alive&&dist<120){ e.state='stalk'; e.t=0; } break; }
    case 'stalk':{ const tx=pcx()-Math.sign(dx||1)*30, ty=pcy()-38, ax=tx-cx, ay=ty-cy, d=Math.hypot(ax,ay)||1, sp=65*Math.min(1,d/20);
      e.vx=approach(e.vx,ax/d*sp,200*dt); e.vy=approach(e.vy,ay/d*sp,200*dt);
      if(e.t>1.3&&dist<100){ e.state='wind'; e.t=0; } if(!alive||dist>220) e.state='idle'; break; }
    case 'wind': e.vx*=0.9; e.vy*=0.9; if(e.t>0.5){ const d=dist||1; e.vx=dx/d*160; e.vy=dy/d*160; e.state='dive'; e.t=0; sfx('screech'); } break;
    case 'dive': if(e.t>0.65||e.hitWallX||e.hitWallY){ e.state='retreat'; e.t=0; } break;
    case 'retreat': e.vx=approach(e.vx,0,200*dt); e.vy=approach(e.vy,-50,300*dt); if(e.t>0.7){ e.state='stalk'; e.t=0; } break;
  }
  moveEntity(e,dt);
}
function aiCampanero(e,dt){
  const cx=e.x+e.w/2, dx=pcx()-cx, dy=pcy()-(e.y+e.h/2), alive=P.state!=='dead', big=e.named==='ordono';
  switch(e.state){
    case 'idle': e.vx=0; if(alive&&Math.abs(dx)<140&&Math.abs(dy)<40){ e.state='walk'; e.engaged=true; } break;
    case 'walk': e.face=dx>0?1:-1; e.vx=e.face*(big?30:22); if(!groundAhead(e)||wallAhead(e)) e.vx=0;
      if(Math.abs(dx)<32&&Math.abs(dy)<26&&e.cd<=0){ e.state='wind'; e.t=0; e.vx=0; sfx('bell'); }
      if(!alive||Math.abs(dx)>200) e.state='idle'; break;
    case 'wind': e.vx=0; if(e.t>(big?0.6:0.7)){ e.state='strike'; e.t=0; e.vx=e.face*60; shake=Math.max(shake,3); sfx('slam'); burst(cx+e.face*20,e.y+e.h,8,['#6a6070','#3a3040'],60);
        if(big) for(const s of [-1,1]) projs.push({owner:'e',type:'wave',x:cx+s*14,y:e.y+e.h-6,vx:s*120,vy:0,w:8,h:12,dmg:14,life:1.2}); } break;
    case 'strike': e.vx=approach(e.vx,0,400*dt);
      if(e.t<0.16){ const hb={x:e.face>0?e.x+e.w-2:e.x-24,y:e.y-4,w:26,h:e.h+4}; if(overlap(hb,P)) hurtPlayer(big?32:28,cx,e,true); }
      if(e.t>0.16){ e.state='recover'; e.t=0; } break;
    case 'recover': e.vx=0; if(e.t>(big?0.7:0.85)){ e.state='walk'; e.cd=big?0.3:0.5; } break;
  }
  e.vy=Math.min(380,e.vy+GRAV*dt); moveEntity(e,dt);
}
function sealArena(on){ for(let y=18;y<=20;y++) room.g[y][1]=on?'X':'.'; }
function aiAbadesa(e,dt){
  const cx=e.x+e.w/2, dx=pcx()-cx, alive=P.state!=='dead', ph2=e.hp<e.maxHp*0.5;
  if(ph2&&!e.ph2&&e.state!=='dying'){ e.ph2=true; toast('¡La Abadesa abre su rostro! Algo te mira desde adentro.'); shake=6; sfx('roar'); burst(cx,e.y+6,30,['#c9b8ff','#5a3a9a'],100,{glow:1}); }
  switch(e.state){
    case 'dormant': e.vx=0; if(P.x>13*8&&alive&&!cut&&!flags.bossSeen){ sealArena(true); startBossCut(e); break; } if(P.x>13*8&&alive&&!cut){ e.state='intro'; e.t=0; e.engaged=true; sealArena(true); sfx('roar'); shake=5; banner('LA ABADESA HUECA','Madre Aldonza, la que cantó el verso prohibido',2.6,'#d8c8ff'); } break;
    case 'intro': if(e.t>1.6){ e.state='idle'; e.t=0; } break;
    case 'idle':
      e.face=dx>0?1:-1; e.vx=Math.abs(dx)<20?0:e.face*(ph2?40:28);
      if(!alive){ e.vx=0; break; }
      if(e.t>(ph2?0.55:0.9)){
        e.t=0; e.vx=0;
        const opts=['chargeWind','leap']; if(ph2) opts.push('orbWind','orbWind');
        let s=opts[Math.floor(Math.random()*opts.length)];
        if(Math.abs(dx)<52&&Math.random()<0.65) s='sweepWind';
        if(s===e.last&&s!=='sweepWind') s=opts[(opts.indexOf(s)+1)%opts.length];
        e.state=s; e.last=s;
        if(s==='leap'){ e.vy=-360; e.vx=clamp((pcx()-cx)/0.8,-200,200); e.onGround=false; sfx('leap'); }
      } break;
    case 'sweepWind': e.vx=0; if(e.t<0.2) e.face=dx>0?1:-1; if(e.t>(ph2?0.42:0.6)){ e.state='sweep'; e.t=0; e.vx=e.face*90; sfx('swing'); } break;
    case 'sweep': e.vx=approach(e.vx,0,500*dt);
      if(e.t<0.22){ const hb={x:e.face>0?e.x+e.w-4:e.x-40,y:e.y+6,w:44,h:30}; if(overlap(hb,P)) hurtPlayer(26,cx,e,true); }
      if(e.t>0.3){ e.state='recover'; e.t=0; e.rec=ph2?0.45:0.7; } break;
    case 'chargeWind': e.vx=0; e.face=dx>0?1:-1; if(e.t>(ph2?0.5:0.7)){ e.state='charge'; e.t=0; sfx('bcharge'); } break;
    case 'charge': e.vx=e.face*(ph2?250:215); if(Math.random()<0.5) part(cx,e.y+rnd(0,e.h),0,0,0.25,'#6a5a9a');
      if(e.hitWallX||e.t>1.6){ shake=6; sfx('slam'); e.state='recover'; e.t=0; e.rec=0.9; burst(e.face>0?e.x+e.w:e.x,e.y+20,14,['#5a5068','#2a2238'],90); }
      break;
    case 'leap': if(e.onGround&&e.t>0.15){ e.state='recover'; e.t=0; e.rec=0.7; e.vx=0; shake=7; sfx('slam');
        for(const s of [-1,1]) projs.push({owner:'e',type:'wave',x:cx+s*10,y:e.y+e.h-6,vx:s*(ph2?170:140),vy:0,w:8,h:12,dmg:18,life:3});
        burst(cx,e.y+e.h,16,['#5a5068','#c9b8ff'],90); } break;
    case 'orbWind': e.vx=0; if(Math.random()<0.6) part(cx+rnd(-14,14),e.y+rnd(-6,10),0,-20,0.4,'#c9b8ff',{glow:1});
      if(e.t>0.55){ const n=ph2?5:3; for(let i=0;i<n;i++){ const a=-Math.PI/2+(i-(n-1)/2)*0.55; projs.push({owner:'e',type:'orb',x:cx+Math.cos(a)*14,y:e.y+4+Math.sin(a)*14,vx:Math.cos(a)*60,vy:Math.sin(a)*60,w:6,h:6,dmg:16,life:4.2,home:0.5+i*0.15}); }
        sfx('orb'); e.state='recover'; e.t=0; e.rec=0.6; } break;
    case 'recover': e.vx=approach(e.vx,0,300*dt); if(e.t>e.rec){ e.state='idle'; e.t=0; } break;
    case 'dying': e.vx=0; if(Math.random()<0.7) part(cx+rnd(-10,10),e.y+rnd(0,e.h),rnd(-20,20),rnd(-60,-20),rnd(0.5,1.2),Math.random()<0.5?'#c9b8ff':'#ffd860',{glow:1});
      if(e.t>2.4){ e.dead=true; flags.boss=true; sealArena(false); P.credits+=e.wax; floater(cx,e.y,'+'+e.wax+' CRÉDITOS','#ffd860');
        giveItem('brasaMayor',1,true); giveItem('cenizaAbadesa',1,true);
        burst(cx,e.y+e.h/2,50,['#c9b8ff','#ffd860','#fff'],140,{glow:1}); shake=10; sfx('victory');
        altars.push({x:24*8+4,y:21*8,id:'santuario:24'}); checkpoint={room:'santuario',x:24*8+16,y:21*8}; saveGame();
        banner('EL OJO PARPADEA','La Abadesa Hueca se consumió. El Código Fénix vuelve a escribirse.',6,'#ffd860'); endT=7; }
      break;
  }
  e.vy=Math.min(420,e.vy+GRAV*dt); moveEntity(e,dt);
}
const AI={ahogado:aiAhogado,polilla:aiPolilla,campanero:aiCampanero,abadesa:aiAbadesa};
function contactInfo(e){ if(e.type==='ahogado'&&e.state==='lunge') return [18,true]; if(e.type==='polilla'&&e.state==='dive') return [14,true]; if(e.type==='abadesa'&&e.state==='charge') return [25,true]; return [e.cdmg,false]; }
function updateEnemies(dt){
  for(const e of ents){
    if(e.dead) continue;
    e.t+=dt; e.flash=Math.max(0,e.flash-dt); e.cd=Math.max(0,e.cd-dt); e.anim+=dt;
    e.poiseT+=dt; if(e.poiseT>2.5&&e.state!=='stagger') e.poise=Math.min(e.poiseMax,e.poise+25*dt);
    if(e.state==='stagger'){ e.stagT-=dt; e.vx=approach(e.vx,0,400*dt); e.vy=Math.min(380,e.vy+GRAV*dt); moveEntity(e,dt); if(e.stagT<=0) recoverStagger(e); continue; }
    AI[e.type](e,dt);
    if(!e.dead&&e.state!=='dying'&&e.state!=='dormant'&&e.state!=='intro'&&overlap(P,e)){ const [d,par]=contactInfo(e); hurtPlayer(d,e.x+e.w/2,e,par); }
  }
  ents=ents.filter(e=>!e.dead);
  if(!bossRef||bossRef.dead) bossRef=ents.find(e=>e.named&&e.engaged&&e.state!=='dormant')||null;
}
function updateProjs(dt){
  for(const p of projs){
    p.life-=dt; if(p.life<=0) p.dead=true;
    if(p.type==='orb'){ p.home-=dt; if(p.home<=0){ const ax=pcx()-p.x, ay=pcy()-p.y, d=Math.hypot(ax,ay)||1; p.vx=approach(p.vx,ax/d*72,95*dt); p.vy=approach(p.vy,ay/d*72,95*dt); }
      if(Math.random()<0.3) part(p.x,p.y,0,0,0.3,'#7a5ac0',{glow:1}); }
    else if(p.type==='wave'){ if(Math.random()<0.6) part(p.x+rnd(-3,3),p.y+rnd(0,10),0,rnd(-50,-20),0.35,Math.random()<0.5?'#c9b8ff':'#6a4aa0',{glow:1}); }
    else if(p.type==='fire'||p.type==='pillar'){ if(Math.random()<0.8) part(p.x+rnd(-3,3),p.y+rnd(-3,3),rnd(-10,10),rnd(-40,-10),0.3,Math.random()<0.5?'#ff9a3a':'#ffd860',{glow:1}); }
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(isSolid(tileAt(Math.floor(p.x/TILE),Math.floor(p.y/TILE)))) { p.dead=true; burst(p.x,p.y,5,p.owner==='p'?['#ffd860']:['#c9b8ff'],40); }
    if(p.dead) continue;
    const box={x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h};
    if(p.owner==='e'){ if(overlap(box,P)){ if(hurtPlayer(p.dmg,p.x)&&p.type==='orb') p.dead=true; } }
    else { for(const e of ents){ if(e.dead||(p.hit&&p.hit.has(e))) continue; if(overlap(box,e)){ damageEnemy(e,p.dmg,Math.sign(p.vx)||1,p.poise,{ranged:true}); if(p.hit) p.hit.add(e); else { p.dead=true; break; } } } }
  }
  projs=projs.filter(p=>!p.dead);
}
function updateParticles(dt){
  for(const p of parts){ p.life-=dt; p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.sway) p.x+=Math.sin(time*p.sway+p.ph)*6*dt;
    if(p.blood&&room&&p.vy>0&&isSolidOrPlat(p.x,p.y)){ p.life=0; if(decals.length<260) decals.push({x:Math.round(p.x*2)/2,y:Math.floor(p.y/TILE)*TILE,c:p.color,w:p.size*(1+Math.random()*2)}); } }
  parts=parts.filter(p=>p.life>0);
  for(const f of floaters){ f.t-=dt; f.y-=(f.dmg?(f.t>1?40:8):14)*dt; f.x+=(f.vx||0)*dt; } floaters=floaters.filter(f=>f.t>0);
  if(mode==='play'&&room){
    if(room.def.bg==='exterior'){ for(let k=0;k<2;k++) if(Math.random()<0.55){ const big=Math.random()<0.25; part(cam.x+rnd(-20,W+60),cam.y-4,rnd(-22,-6),rnd(14,30)*(big?1.3:1),rnd(6,10),big?'#eef2ff':Math.random()<0.5?'#c8d0e8':'#9aa4c0',{g:0,size:big?1:0.5,sway:rnd(1,3),ph:rnd(0,6)}); }
      if(Math.random()<0.06) part(cam.x+rnd(0,W),cam.y+rnd(H*0.3,H),rnd(-10,10),rnd(-14,-4),rnd(2,4),Math.random()<0.5?'#e0402a':'#ff7a3a',{g:0,size:0.5,glow:1,sway:2,ph:rnd(0,6)}); }
    else if(Math.random()<0.3){ if(Math.random()<0.6) part(cam.x+rnd(0,W),cam.y+rnd(0,H),rnd(-4,4),rnd(-6,-1),rnd(2,4),'#4a4658',{g:0,size:0.5});
      else part(cam.x+rnd(0,W),cam.y+H+2,rnd(-6,6),rnd(-22,-8),rnd(2,5),Math.random()<0.5?'#ff8a3a':'#c04020',{g:0,size:0.5,glow:1,sway:2,ph:rnd(0,6)}); }
    for(const a of altars) if(Math.random()<0.15) part(a.x+rnd(-5,5),a.y-12,rnd(-6,6),rnd(-35,-15),rnd(0.6,1.2),Math.random()<0.5?'#ffb040':'#ff6a2a',{glow:1});
    for(const pr of props) if(pr.t==='forge'&&Math.random()<0.2) part(pr.x+rnd(-4,4),pr.y-16,rnd(-5,5),rnd(-30,-10),rnd(0.5,1),'#ff8a2a',{glow:1});
  }
}
function updateCamera(dt,snap){
  if(!room) return;
  const tx=pcx()-W/2+P.face*18, ty=pcy()-H/2-8;
  cam.x+=(tx-cam.x)*(snap?1:Math.min(1,dt*5)); cam.y+=(ty-cam.y)*(snap?1:Math.min(1,dt*6));
  cam.x=clamp(cam.x,0,Math.max(0,room.w*8-W)); cam.y=clamp(cam.y,0,Math.max(0,room.h*8-H));
}
function update(dt){
  time+=dt;
  if(pressed.mute) toggleMute();
  if(fade>0) fade=Math.max(0,fade-dt*3);
  if(mode==='boot'){ updateBoot(dt); return; }
  if(mode==='cine'){ updateCine(dt); return; }
  if(mode==='title'){ updateTitle(dt); return; }
  if(mode==='credits'){ updateCredits(dt); return; }
  if(mode==='creator'){ updateCreator(dt); return; }
  if(cut){ updateCut(dt); return; }
  if(ui){ updateUI(dt); return; }
  if(pressed.pause){ ui={type:'pause',sel:0}; sfx('menu'); return; }
  if(pressed.inventory&&P.state!=='dead'){ ui={type:'inv',tab:0,sel:0}; sfx('menu'); return; }
  if(pressed.quick&&P.state==='normal') useQuick();
  if(hitstop>0){ hitstop-=dt; return; }
  if(shake>0) shake=Math.max(0,shake-dt*20);
  if(toastM){ toastM.t-=dt; if(toastM.t<=0) toastM=null; }
  if(bannerM){ bannerM.t-=dt; if(bannerM.t<=0) bannerM=null; }
  if(roomTitle.t>0) roomTitle.t-=dt;
  updatePlayer(dt); updateEnemies(dt); updateProjs(dt); updateParticles(dt); updateCamera(dt);
  P.hpShown=approach(P.hpShown,P.hp,(P.hpShown>P.hp?40:200)*dt);
  if(endT>0){ endT-=dt; if(endT<=0) startCine('ending',()=>startCredits(true)); }
}

function isSolidOrPlat(x,y){ const t=tileAt(Math.floor(x/TILE),Math.floor(y/TILE)); return isSolid(t)||t==='='; }
function useQuick(){
  const id=P.quick; if(!id||!P.items[id]){ toast('Ranura rápida vacía. Asigná un consumible desde el inventario (I).'); sfx('deny'); return; }
  ITEMS[id].use(); takeItem(id); sfx('heal'); floater(pcx(),P.y-8,ITEMS[id].name.toUpperCase(),'#9fe08a');
  burst(pcx(),pcy(),10,['#9fe08a','#fff'],40,{g:-30,glow:1});
}
