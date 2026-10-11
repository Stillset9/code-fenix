// CODE FENIX — interfaz: HUD, menús, diálogos, tienda, forja, título, créditos y bucle principal.
'use strict';
let titleSel=0, credY=0, credEnding=false;
const C_GOLD='#ffd860', C_TXT='#e4d6c0', C_DIM='#8a7a8a';
function openDialog(id){ const n=NPCS[id]; const node=n.talk(); if(node) ui={type:'dialog',npc:id,name:n.name,node,line:0,sel:0,chars:0}; }
function openShop(tab){ ui={type:'shop',tab,sel:0}; }
function openForge(){ ui={type:'forge',sel:0}; }
function closeUI(){ ui=null; }
function nav(n){ if(pressed.up){ ui.sel=(ui.sel+n-1)%n; sfx('menu'); } if(pressed.down){ ui.sel=(ui.sel+1)%n; sfx('menu'); } if(ui.sel>=n) ui.sel=Math.max(0,n-1); }
const sellPrice=(price)=>Math.floor(price*0.4);
const upCost=(lv)=>({cr:150*(lv+1),frag:lv+1,mayor:lv===2?1:0});

// ---- listas dinámicas ----
function invEntries(tab){
  const out=[];
  if(tab===0){
    for(const id in P.weapons){ const w=WEAPONS[id]; if(w.kind!=='melee') continue; out.push({label:(P.wpn===id?'> ':'  ')+w.name+' +'+P.weapons[id],right:'CUERPO A CUERPO',desc:w.desc+(w.art?' Arte: '+w.art.name+'.':''),act:()=>{ P.wpn=id; sfx('buy'); }}); }
    for(const id in P.weapons){ const w=WEAPONS[id]; if(w.kind!=='gun') continue; out.push({label:(P.gun===id?'> ':'  ')+w.name+' +'+P.weapons[id],right:'SECUNDARIA',desc:w.desc,act:()=>{ P.gun=id; sfx('buy'); }}); }
    P.spells.forEach((id,i)=>{ const s=SPELLS[id]; out.push({label:(P.spellIdx===i?'> ':'  ')+s.name,right:'VERSO '+s.cost+' FOCO',desc:s.desc,act:()=>{ P.spellIdx=i; sfx('buy'); }}); });
  } else if(tab===1){
    const order={cons:0,mat:1,key:2,special:3};
    Object.keys(P.items).sort((a,b)=>order[ITEMS[a].type]-order[ITEMS[b].type]).forEach(id=>{ const it=ITEMS[id];
      out.push({label:it.name,right:it.type==='key'?'CLAVE':'X'+P.items[id],desc:it.desc,act:it.type==='cons'?()=>{ it.use(); takeItem(id); sfx('heal'); }:null}); });
  }
  return out;
}
function shopEntries(tab){
  const out=[];
  if(tab===0){ for(const s of shopStock){ if(s.stock<=0) continue;
      if(s.weapon){ if(P.weapons[s.weapon]!==undefined) continue; const w=WEAPONS[s.weapon]; out.push({label:w.name,right:s.price+' C',desc:w.desc,act:()=>buy(s),icon:s.weapon}); }
      else { const it=ITEMS[s.id]; out.push({label:it.name+(s.stock<50?' ('+s.stock+')':''),right:s.price+' C',desc:it.desc,act:()=>buy(s),icon:s.id}); } } }
  else { for(const id in P.items){ const it=ITEMS[id]; if(!it.price||it.type==='key'||it.type==='special') continue; out.push({label:it.name+' X'+P.items[id],right:sellPrice(it.price)+' C',desc:it.desc,act:()=>{ takeItem(id); P.credits+=sellPrice(it.price); sfx('wax'); },icon:id}); }
    for(const id in P.weapons){ if(id===P.wpn||id===P.gun) continue; const w=WEAPONS[id]; out.push({label:w.name+' +'+P.weapons[id],right:sellPrice(w.price)+' C',desc:'No está equipada. '+w.desc,act:()=>{ delete P.weapons[id]; P.credits+=sellPrice(w.price); sfx('wax'); },icon:id}); } }
  return out;
}
function buy(s){
  if(P.credits<s.price){ sfx('deny'); toast('No te alcanzan los Créditos.'); return; }
  P.credits-=s.price; s.stock--; sfx('buy');
  if(s.weapon){ giveWeapon(s.weapon); toast('Compraste '+WEAPONS[s.weapon].name+'. Equipala desde el inventario.'); }
  else if(s.id==='polvora'){ P.maxAmmo+=2; P.ammo=P.maxAmmo; toast('Balas máximas: '+P.maxAmmo+'.'); }
  else { giveItem(s.id,1,true); toast('Compraste '+ITEMS[s.id].name+'.',1.5); }
}
function forgeEntries(){
  const out=[];
  for(const id in P.weapons){ const w=WEAPONS[id], lv=P.weapons[id];
    if(lv>=3){ out.push({label:w.name+' +3',right:'MÁXIMO',desc:'Este arma ya alcanzó todo su potencial.',act:null,icon:id}); continue; }
    const c=upCost(lv); const req=c.cr+' C · '+c.frag+' FRAG'+(c.mayor?' · 1 BRASA MAYOR':'');
    out.push({label:w.name+' +'+lv+' → +'+(lv+1),right:req,desc:'Daño x'+weaponMult(id).toFixed(2)+'. Mejorar sube el daño base un 18%. Tenés '+(P.items.fragmento||0)+' fragmentos y '+(P.items.brasaMayor||0)+' Brasas Mayores.',icon:id,
      act:()=>{ if(P.credits<c.cr||(P.items.fragmento||0)<c.frag||(P.items.brasaMayor||0)<c.mayor){ sfx('deny'); toast('Te faltan Créditos o materiales.'); return; }
        P.credits-=c.cr; takeItem('fragmento',c.frag); if(c.mayor) takeItem('brasaMayor',1); P.weapons[id]++; sfx('slam'); shake=3; toast(w.name+' ahora es +'+P.weapons[id]+'. Brom sonríe por primera vez en años.'); }}); }
  return out;
}

// ---- actualización de UI ----
// ---- dibujo de UI ----
function drawControlsTable(y0){
  drawText(ctx,'ACCIÓN',14,y0,C_DIM); drawText(ctx,'TECLADO',150,y0,C_DIM); drawText(ctx,'MANDO',244,y0,C_DIM);
  CONTROLS_TABLE.forEach((r,i)=>{ const y=y0+10+i*9; drawText(ctx,r[0],14,y,C_TXT); drawText(ctx,ctrlKeys(i,r[1]).replace(/ · /g,' / '),150,y,C_GOLD); drawText(ctx,r[2],244,y,'#b8a8c8'); });
}
// ---- Título y créditos ----
function titleOptions(){ const o=['NUEVA PARTIDA']; if(hasSave()) o.push('CONTINUAR'); if(typeof CLOUD!=='undefined'&&CLOUD.status==='ready') o.push(CLOUD.user?'CERRAR SESIÓN':'INICIAR SESIÓN CON GOOGLE'); o.push('OPCIONES','CONTROLES','CRÉDITOS'); return o; }
let titleControls=false;
function updateTitle(dt){
  updateParticles(dt);
  if(Math.random()<0.6) part(rnd(100,220),rnd(70,110),rnd(-20,20),rnd(-40,-15),rnd(0.8,1.6),Math.random()<0.5?'#ff9a3a':'#ffd860',{glow:1});
  if(ui){ updateUI(dt); return; }
  if(titleControls){ if(backP()||confirmP()) titleControls=false; return; }
  const o=titleOptions(); if(titleSel>=o.length) titleSel=0;
  if(pressed.up){ titleSel=(titleSel+o.length-1)%o.length; sfx('menu'); } if(pressed.down){ titleSel=(titleSel+1)%o.length; sfx('menu'); }
  if(confirmP()){ initAudio(); const c=o[titleSel]; sfx('menu');
    if(c==='NUEVA PARTIDA') openCreator(); else if(c==='CONTINUAR') cloudThenLoad(); else if(c==='OPCIONES') openOptions('title'); else if(c==='INICIAR SESIÓN CON GOOGLE') cloudSignIn(); else if(c==='CERRAR SESIÓN') cloudSignOut(); else if(c==='CONTROLES') titleControls=true; else startCredits(false); }
}
function drawPhoenix(cx,cy,s){
  const flap=Math.sin(time*2)*0.25;
  for(const side of [-1,1]) for(let i=0;i<46;i++){ const t=i/46; const wx=cx+side*i*s, wy=cy-Math.sin(t*Math.PI*(0.9+flap))*22*s+t*8*s-(flap*20*t);
    const len=Math.round((6+Math.sin(i*0.9)*3+(1-t)*10)*s);
    for(let j=0;j<len;j++){ const k=j/len; ctx.globalAlpha=(1-k)*0.85; px(wx+side*j*0.3,wy+j,k<0.25?'#fff0b0':k<0.6?'#ffb040':'#c0301e'); } }
  ctx.globalAlpha=1;
  for(let j=0;j<16;j++){ px(cx-1,cy-10+j,j<4?'#fff0b0':'#ff9a3a',3,1); } px(cx-2,cy-13,'#ffd860',5,3);
  for(let j=0;j<20;j++){ ctx.globalAlpha=1-j/20; px(cx-1+Math.round(Math.sin(time*3+j*0.4)*j*0.3),cy+6+j,'#e0502a',3,1); } ctx.globalAlpha=1;
}
function renderTitle(){
  const L=getBg('exterior',ROOMS.atrio.stone); drawLayers(L,time*14,0,0);
  ctx.fillStyle='rgba(4,2,10,0.45)'; ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(160,70,0,160,70,90); g.addColorStop(0,'rgba(255,140,40,0.22)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  drawPhoenix(160,58,1.2);
  CX=0; CY=0; drawParticles();
  drawText(ctx,'PROMETHEON STUDIO PRESENTA',W/2,8,'#c8a8b8',1,'center','#000');
  drawText(ctx,'CODE FENIX',W/2+2,30,'#3a0f1e',4,'center'); drawText(ctx,'CODE FENIX',W/2,28,'#ffe8c0',4,'center');
  drawText(ctx,'LO QUE ARDE, VUELVE.',W/2,54,'#ff9a3a',1,'center','#000');
  if(titleControls){ ctx.fillStyle='rgba(4,2,10,0.9)'; ctx.fillRect(4,4,W-8,H-8); drawText(ctx,'CONTROLES',W/2,10,C_GOLD,1,'center'); drawControlsTable(22); drawText(ctx,'ESC / ENTER: VOLVER',W/2,H-12,C_DIM,1,'center'); return; }
  const o=titleOptions(); ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(110,92,100,o.length*11+6);
  o.forEach((t,i)=>{ drawText(ctx,(i===titleSel?'> ':'')+t+(i===titleSel?' <':''),W/2,96+i*11,i===titleSel?C_GOLD:C_TXT,1,'center','#000'); if(!ui) addTap(220,(94+i*11)*2,200,22,()=>{ titleSel=i; pressed.start=true; }); });
  if(!ui&&typeof drawCloudBadge==='function') drawCloudBadge();
  drawText(ctx,'CREADO POR SANTIAGO PÍRIZ · IDEAS: HÉCTOR JUANI',W/2,H-18,'#d8c8b8',1,'center','#000');
  drawText(ctx,'(C) 2026 PROMETHEON STUDIO · HITO 4',W/2,H-9,'#6a5a70',1,'center');
}
function startCredits(ending){ mode='credits'; credY=H+6; credEnding=ending; ui=null; parts=[]; }
function creditsHeight(){ return CREDITS_LINES.reduce((s,l)=>s+(l[1]===4?36:l[1]===2?18:10),0); }
function updateCredits(dt){
  updateParticles(dt); if(Math.random()<0.5) part(rnd(0,W),H+2,rnd(-6,6),rnd(-30,-10),rnd(3,6),Math.random()<0.5?'#ff9a3a':'#7a3a2a',{glow:1});
  credY-=(held('start')||held('jump')?60:16)*dt;
  if(backP()||credY<-creditsHeight()-30){ mode='title'; titleSel=0; parts=[]; if(credEnding) toast('',0.1); }
}
function renderCredits(){
  ctx.fillStyle='#05030a'; ctx.fillRect(0,0,W,H); CX=0; CY=0; drawParticles();
  let y=credY; for(const [t,s,c] of CREDITS_LINES){ const h=s===4?36:s===2?18:10; if(y>-40&&y<H+10) drawText(ctx,t,W/2,y,c||C_TXT,s,'center','#000'); y+=h; }
  if(credEnding&&credY>H-60) drawText(ctx,'EL OJO PARPADEA. LA VIGILIA CONTINÚA.',W/2,20,'#c8a8b8',1,'center');
  drawText(ctx,'ESC: SALIR · MANTENER ENTER: ACELERAR',W-4,H-8,'#4a3a50',1,'right');
}
function render(){
  ctx.setTransform(2,0,0,2,0,0); ctx.globalAlpha=1; ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  if(mode==='boot'){ renderBoot(); return; }
  if(mode==='cine'){ renderCine(); return; }
  if(mode==='title'){ renderTitle(); if(ui) drawUI(); return; }
  if(mode==='credits'){ renderCredits(); return; }
  if(mode==='creator'){ renderCreator(); return; }
  if(!room) return;
  renderWorld(); if(cut) drawCut(); else drawHUD();
  if(fade>0){ ctx.fillStyle=`rgba(0,0,0,${fade})`; ctx.fillRect(0,0,W,H); }
  if(P.state==='dead'&&P.t>2){ ctx.fillStyle=`rgba(0,0,0,${clamp((P.t-2),0,1)})`; ctx.fillRect(0,0,W,H); }
  if(endT>0&&endT<1.5){ ctx.fillStyle=`rgba(0,0,0,${clamp(1-endT/1.5,0,1)})`; ctx.fillRect(0,0,W,H); }
  drawUI();
}

// ---- Bucle ----
buildSprites(); buildPlayerSprites(defaultLook());
let last=performance.now(), acc=0;
function frame(now){
  const dt=Math.min(0.1,(now-last)/1000); last=now; acc+=dt; pollPad();
  let steps=0; while(acc>=STEP&&steps<6){ update(STEP); acc-=STEP; steps++; for(const k in pressed) delete pressed[k]; }
  if(steps>=6) acc=0;
  musicDirector(); TAPS=[]; render(); if(typeof touchFrame==='function') touchFrame(); requestAnimationFrame(frame);
}
// El bucle arranca cuando todos los scripts terminaron de cargar (por red pueden llegar en varios cuadros).
if(document.readyState==='loading') addEventListener('DOMContentLoaded',()=>requestAnimationFrame(frame)); else requestAnimationFrame(frame);
window.CN={ start:startGame, warp:(r,s)=>loadRoom(r,s), give:()=>{ giveItem('alas',1,true); giveItem('impulso',1,true); giveItem('llave',1,true); }, P, flags, q,
  get mode(){return mode;}, get room(){return roomId;}, get ents(){return ents;}, get ui(){return ui;}, get cre(){return cre;} };

// ---- Creador de personaje ----
let cre=null;
const CRE_ROWS=[['NOMBRE','names'],['CUERPO','body'],['PIEL','skin'],['PEINADO','hair'],['COLOR DE PELO','hairC'],['OJOS','eyes'],['CAPA','cloak'],['ARMADURA','armor'],['ALEATORIO',null],['COMENZAR',null]];
function openCreator(){ mode='creator'; cre={look:defaultLook(),sel:0,t:0}; buildPlayerSprites(cre.look); }
function creValue(key){ const L2=cre.look; if(key==='names') return L2.name; const o=LOOK_OPTS[key][L2[key]]; return Array.isArray(o)?o[0]:o; }
function creChange(key,d){
  const L2=cre.look;
  if(key==='names'){ const arr=LOOK_OPTS.names; const i=Math.max(0,arr.indexOf(L2.name)); L2.name=arr[(i+d+arr.length)%arr.length]; }
  else { const n=LOOK_OPTS[key].length; L2[key]=(L2[key]+d+n)%n; }
  buildPlayerSprites(L2); sfx('menu');
}
function creRandom(){ const L2=cre.look; for(const [,k] of CRE_ROWS){ if(!k) continue; if(k==='names') L2.name=LOOK_OPTS.names[Math.floor(Math.random()*LOOK_OPTS.names.length)]; else L2[k]=Math.floor(Math.random()*LOOK_OPTS[k].length); } buildPlayerSprites(L2); sfx('buy'); }
function updateCreator(dt){
  cre.t+=dt; updateParticles(dt);
  if(Math.random()<0.4) part(rnd(30,110),rnd(120,150),rnd(-8,8),rnd(-30,-10),rnd(0.6,1.2),Math.random()<0.5?'#ff9a3a':'#ffd860',{glow:1});
  const n=CRE_ROWS.length;
  if(pressed.up){ cre.sel=(cre.sel+n-1)%n; sfx('menu'); } if(pressed.down){ cre.sel=(cre.sel+1)%n; sfx('menu'); }
  const key=CRE_ROWS[cre.sel][1];
  if(key&&pressed.left) creChange(key,-1); if(key&&pressed.right) creChange(key,1);
  if(pressed.pause||pressed.back){ mode='title'; buildPlayerSprites(P.look); return; }
  if(pressed.start||pressed.interact||pressed.light||pressed.jump){
    if(CRE_ROWS[cre.sel][0]==='ALEATORIO') creRandom();
    else if(CRE_ROWS[cre.sel][0]==='COMENZAR'){ sfx('rest'); startGame(Object.assign({},cre.look)); startCine('prologue',()=>{ mode='play'; }); }
    else if(key) creChange(key,1);
  }
}
function renderCreator(){
  const L=getBg('interior',ROOMS.refugio.stone); drawLayers(L,40,0,0);
  ctx.fillStyle='rgba(4,2,10,0.6)'; ctx.fillRect(0,0,W,H);
  drawText(ctx,'DALE FORMA A QUIEN RENACE',W/2,6,C_GOLD,1,'center','#000');
  drawText(ctx,'EL CÓDIGO FÉNIX TE ESCRIBE DE NUEVO. ¿CÓMO TE RECUERDA?',W/2,15,'#c8a8b8',1,'center','#000');
  panel(10,26,124,128);
  const g=ctx.createRadialGradient(72,104,0,72,104,60); g.addColorStop(0,'rgba(255,150,50,0.28)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(12,28,120,124);
  CX=0; CY=0; drawParticles();
  const SEQ=[['idle',6,6],['run',8,14],['arc0',4,8],['arc1',4,8],['thrust',4,8],['jump',2,3],['heal',2,3],['idle',6,6]];
  const tt=cre.t%16, si=Math.floor(tt/2), [an,nf,fps]=SEQ[si], fi=Math.floor((tt-si*2)*fps)%nf;
  const fr=lookFrame(cre.look,an,fi,an==='thrust'?'estoque':an==='arc1'?'mandoble':'hoz'); const flip=Math.floor(cre.t/16)%2===1;
  ctx.save(); ctx.beginPath(); ctx.rect(12,28,120,124); ctx.clip();
  ctx.translate(72,124); if(flip) ctx.scale(-1,1); ctx.drawImage(fr.img,-fr.ox*2,-fr.oy*2,fr.w*2,fr.h*2); ctx.restore();
  px(20,124,'#2a2230',104,1);
  drawRigFrame(lookFrame(cre.look,'idle',Math.floor(cre.t*6)%6),120,150,false,false); drawText(ctx,'TAMAÑO REAL',104,144,C_DIM,1,'right');
  drawText(ctx,cre.look.name,40,32,'#eadcc4',1,'center');
  panel(142,26,170,128);
  CRE_ROWS.forEach(([lab,key],i)=>{ const y=32+i*12, sel=i===cre.sel; if(sel) px(146,y-2,'#3a1a2a',162,11);
    drawText(ctx,lab,150,y,sel?C_GOLD:C_TXT);
    if(key){ const v=creValue(key); drawText(ctx,(sel?'< ':'')+v+(sel?' >':''),304,y,sel?'#ffb050':'#c8b8b0',1,'right');
      const o=LOOK_OPTS[key][cre.look[key]]; if(Array.isArray(o)){ const sw=304-textWidth((sel?'< ':'')+v+(sel?' >':''))-9; px(sw,y-1,'#07060b',7,7); px(sw+1,y,o[1],5,5); } } });
  const tip={NOMBRE:'Tu nombre en el Código. Lo vas a encontrar grabado en Velmora.',CUERPO:'Define tu silueta y cómo te nombran: farolero, farolera o chispa.',PIEL:'El tono de tu piel.',PEINADO:'Capucha, corto, largo, trenza o rapado.','COLOR DE PELO':'El color de tu pelo (y del flequillo bajo la capucha).',OJOS:'El color de la llama en tus ojos.',CAPA:'El color de tu capa y tu capucha.',ARMADURA:'El metal de tu peto y tus hombreras.',ALEATORIO:'Que el Código decida por vos.',COMENZAR:'Renacer en Velmora con este aspecto.'}[CRE_ROWS[cre.sel][0]];
  drawText(ctx,tip,W/2,H-20,'#c8b8b0',1,'center','#000');
  drawText(ctx,'↑↓ ELEGIR · ← → CAMBIAR · ENTER CONFIRMAR · ESC VOLVER',W/2,H-10,C_DIM,1,'center');
}
