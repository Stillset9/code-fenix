// CODE FENIX — interfaz en alta resolución: HUD ornamentado, diálogo con retratos, inventario, equipo,
// estado, árbol de habilidades, pira, tienda y forja. Todo se dibuja en coordenadas nativas 640x360.
'use strict';
const GOLD='#ffd860', TXT='#e4dccc', DIM='#8a8494', SIL='#9a9aa8';
const scaleL=v=>v>=1?'A':v>=0.7?'B':v>=0.4?'C':v>0?'D':'—';
function iconFor(id){ if(WEAPONS[id]||SPELLS[id]) return icon(id); return icon(ITEM_ICON[id]||id||'empty'); }
function drawIco(id,x,y,s=32){ ctx.drawImage(typeof id==='string'?iconFor(id):id,x,y,s,s); }
function keyCap(x,y,k){ ctx.fillStyle='#07060b'; ctx.beginPath(); ctx.arc(x,y,8,0,7); ctx.fill(); ctx.strokeStyle='#b8b8c8'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.stroke(); stext(k,x,y-6,11,'#e8e8f0','center',null,'bold'); }

// ---------------- HUD ----------------
function hbar(x,y,w,h,frac,ghost,cols,bg){
  ctx.fillStyle='#07060b'; ctx.fillRect(x-2,y-2,w+4,h+4); ctx.fillStyle=bg; ctx.fillRect(x,y,w,h);
  if(ghost!=null&&ghost>frac){ ctx.fillStyle='#e8c070'; ctx.fillRect(x,y,Math.round(w*clamp(ghost,0,1)),h); }
  const fw=Math.round(w*clamp(frac,0,1)); ctx.fillStyle=cols[1]; ctx.fillRect(x,y,fw,h); ctx.fillStyle=cols[2]; ctx.fillRect(x,y,fw,Math.max(1,Math.floor(h/3))); ctx.fillStyle=cols[0]; ctx.fillRect(x,y+h-1,fw,1);
  ctx.fillStyle='#5a5a68'; ctx.fillRect(x-1,y-2,w+2,1); ctx.fillRect(x-1,y+h+1,w+2,1);
  ornDiamond(x+w+5,y+h/2,Math.max(3,h/2+1),'#8a8a98','#1a1820'); ctx.fillStyle='#8a8a98'; ctx.fillRect(x+w+9,y+h/2-0.5,5,1);
}
function medallion(cx,cy,id){
  ctx.fillStyle='#07060b'; ctx.beginPath(); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2-Math.PI/2, r=i%2?23:(i%4===0?33:28); ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } ctx.fill();
  ctx.fillStyle='#6a6a78'; ctx.beginPath(); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2-Math.PI/2, r=i%2?21:(i%4===0?30:25.5); ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } ctx.fill();
  ctx.strokeStyle='#07060b'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,21,0,7); ctx.stroke(); ctx.strokeStyle='#a8a8b8'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,20,0,7); ctx.stroke();
  const g=ctx.createRadialGradient(cx-4,cy-4,2,cx,cy,19); g.addColorStop(0,'#2a2632'); g.addColorStop(1,'#07060b'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,18.5,0,7); ctx.fill();
  drawIco(id,cx-16,cy-16,32); ornDiamond(cx,cy+24,4,'#a02030','#5a0a12');
}
function drawHUD(){
  hiOn();
  const mx=38, my=34;
  ornLine(58,24,64,'#6a6a78');
  hbar(66,14,Math.min(430,Math.round(P.maxHp*2.3)),9,Math.max(0,P.hp)/P.maxHp,P.hpShown/P.maxHp,['#5a0a12','#a3202e','#e0505a'],'#1a070b');
  hbar(66,30,Math.min(330,Math.round(P.maxFoco*2.6)),6,P.foco/P.maxFoco,null,['#142a6a','#2f5ed0','#8ab0ff'],'#080c1c');
  hbar(66,42,Math.min(360,Math.round(P.maxSt*2.0)),2,P.st/P.maxSt,null,['#9a9eaa',P.st<15?'#c8a040':'#e0e4ee','#ffffff'],'#121218');
  medallion(mx,my,P.wpn);
  drawIco('lagrima',10,58,28); stext(String(P.flasks),38,70,15,P.flasks?'#f4ece0':'#8a6a6a','left','rgba(0,0,0,0.9)','bold');
  // créditos
  { const t=String(P.credits), x1=632, x0=x1-Math.max(150,swidth(t,16)+70), y=8;
    ctx.fillStyle='#07060b'; ctx.beginPath(); ctx.moveTo(x0-10,y+12); ctx.lineTo(x0,y); ctx.lineTo(x1,y); ctx.lineTo(x1,y+24); ctx.lineTo(x0,y+24); ctx.fill();
    const g=ctx.createLinearGradient(x0,0,x1,0); g.addColorStop(0,'rgba(30,28,38,0.95)'); g.addColorStop(1,'rgba(12,10,16,0.95)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x0-7,y+12); ctx.lineTo(x0+1,y+2); ctx.lineTo(x1-2,y+2); ctx.lineTo(x1-2,y+22); ctx.lineTo(x0+1,y+22); ctx.fill();
    ctx.fillStyle='#5a5a68'; ctx.fillRect(x0+1,y+2,x1-x0-3,1); ctx.fillRect(x0+1,y+21,x1-x0-3,1);
    drawIco('sigil',x0-2,y-4,32); stext(t,x1-10,y+4,16,'#ece4d4','right',null); }
  let ix=626; for(const [f,id] of [[flags.key,'llave'],[flags.wings,'alas'],[flags.dash,'impulso']]) if(f){ ix-=24; ctx.globalAlpha=0.85; drawIco(id,ix,36,22); ctx.globalAlpha=1; }
  // ranuras rápidas
  const sy=314, w=WEAPONS[P.wpn], g=WEAPONS[P.gun], qi=P.quick&&P.items[P.quick]?P.quick:null, sp=P.spells[P.spellIdx];
  slotBox(10,sy,40,false); drawIco(P.wpn,14,sy+4,32); stext('+'+(P.weapons[P.wpn]||0),46,sy+27,11,'#d8d0c0','right');
  slotBox(56,sy,40,false); if(qi){ drawIco(qi,60,sy+4,32); stext(String(P.items[qi]),92,sy+25,13,'#f4ece0','right',null,'bold'); } else { ctx.globalAlpha=0.3; drawIco('unguento',60,sy+4,32); ctx.globalAlpha=1; } stext('G',60,sy+1,10,DIM,'left',null);
  slotBox(102,sy,40,false); if(g){ drawIco(P.gun,106,sy+4,32); stext(P.ammo+'/'+P.maxAmmo,138,sy+27,11,P.ammo?'#d8d0c0':'#e05050','right'); }
  if(sp){ slotBox(148,sy+10,30,false); drawIco(sp,150,sy+12,26); stext(SPELLS[sp].cost+'',176,sy+30,10,'#8ab0ff','right'); }
  // jefe
  if(bossRef&&!bossRef.dead&&bossRef.state!=='dormant'){ const bw=400, x=390-bw/2, y=346; stext(bossRef.title,390,y-18,14,'#e0d4f0','center');
    hbar(x,y,bw,7,Math.max(0,bossRef.hp)/bossRef.maxHp,null,['#3a0a4a','#8a2a9a','#d07ae0'],'#12061a'); ctx.fillStyle=GOLD; ctx.fillRect(x,y+9,Math.round(bw*Math.max(0,bossRef.poise)/bossRef.poiseMax),1); }
  // carteles, títulos, avisos
  const s=signs.find(s=>Math.abs(s.x-pcx())<14&&Math.abs(s.y-(P.y+P.h))<18);
  if(s&&!ui&&P.state!=='dead'){ const lines=swrap((TOUCH.on&&s.tt)||s.text,460,13), h=lines.length*17+20, y=300-h; hpanel(80,y,480,h); lines.forEach((l,i)=>stext(l,320,y+10+i*17,13,TXT,'center')); }
  if(roomTitle.t>0&&!bossRef){ ctx.globalAlpha=clamp(roomTitle.t,0,1); const tw=swidth(roomTitle.text,22); stext(roomTitle.text,320,60,22,'#e0d8e8','center'); ornLine(320-tw/2-20,88,320+tw/2+20,'#6a6a78'); ornDiamond(320,88,4); ctx.globalAlpha=1; }
  if(toastM&&!(ui&&ui.type==='dialog')) drawToast(100);
  if(bannerM){ const k=bannerM.t, a=clamp(Math.min(k,bannerM.max-k)*2,0,1); ctx.globalAlpha=a; const g2=ctx.createLinearGradient(0,130,0,220); g2.addColorStop(0,'rgba(0,0,0,0)'); g2.addColorStop(0.3,'rgba(0,0,0,0.75)'); g2.addColorStop(0.7,'rgba(0,0,0,0.75)'); g2.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g2; ctx.fillRect(0,130,640,90);
    stext(bannerM.title,320,148,30,bannerM.color,'center'); swrap(bannerM.sub,480,13).forEach((l,i)=>stext(l,320,186+i*16,13,'#c8beb4','center')); ctx.globalAlpha=1; }
  hiOff();
}

function drawToast(y){ ctx.globalAlpha=clamp(toastM.t*2,0,1); swrap(toastM.text,440,13).forEach((l,i)=>stext(l,320,y+i*17,13,'#f0e6d0','center')); ctx.globalAlpha=1; }
// ---------------- Entradas de equipo ----------------
function equipSlots(){
  const melee=Object.keys(P.weapons).filter(id=>WEAPONS[id].kind==='melee'), guns=Object.keys(P.weapons).filter(id=>WEAPONS[id].kind==='gun'), cons=Object.keys(P.items).filter(id=>ITEMS[id].type==='cons');
  return [
    {label:'ARMA PRINCIPAL',id:P.wpn,opts:melee,set:id=>{ P.wpn=id; }},
    {label:'ARMA SECUNDARIA',id:P.gun,opts:guns,set:id=>{ P.gun=id; }},
    {label:'VERSO',id:P.spells[P.spellIdx],opts:P.spells.slice(),set:id=>{ P.spellIdx=P.spells.indexOf(id); }},
    {label:'RANURA RÁPIDA (G)',id:P.quick&&P.items[P.quick]?P.quick:null,opts:cons,set:id=>{ P.quick=id; }}];
}
function nameOf(id){ return id?(WEAPONS[id]||SPELLS[id]||ITEMS[id]).name:'— vacío —'; }
function detailOf(id){
  if(!id) return {title:'Vacío',lines:[],desc:'Nada equipado en esta ranura.'};
  if(WEAPONS[id]){ const w=WEAPONS[id], lv=P.weapons[id]||0; const lines=['Mejora: +'+lv+' / +3','Multiplicador de daño: x'+weaponMult(id).toFixed(2),'Escala con Fuerza: '+scaleL(w.scF||0)+'   ·   Destreza: '+scaleL(w.scD||0)];
    if(w.kind==='melee') lines.push('Golpe ligero: '+Math.round(w.light[0].dmg*weaponMult(id))+'   ·   Pesado: '+Math.round(w.heavy.dmg*weaponMult(id))); else lines.push('Daño por proyectil: '+Math.round(w.dmg*weaponMult(id))+(w.pellets>1?' x'+w.pellets:''));
    if(w.art) lines.push('Arte: '+w.art.name+' ('+(w.art.foco||'')+(w.art.foco?' Foco':'mantener pesado')+')');
    return {title:w.name+' +'+lv,lines,desc:w.desc}; }
  if(SPELLS[id]){ const s=SPELLS[id]; return {title:s.name,lines:['Costo: '+s.cost+' de Foco','Daño: '+Math.round(s.dmg*spellMult())],desc:s.desc}; }
  const it=ITEMS[id]; return {title:it.name,lines:['Tenés: '+(P.items[id]||0)],desc:it.desc};
}
const TYPE_N={cons:'CONSUMIBLE',mat:'MATERIAL DE FORJA',key:'OBJETO CLAVE',special:'RELIQUIA'};
function itemList(){ const order={cons:0,mat:1,special:2,key:3}; return Object.keys(P.items).sort((a,b)=>order[ITEMS[a].type]-order[ITEMS[b].type]); }

// ---------------- Árbol de habilidades ----------------
const SK_IDS=Object.keys(SKILLS);
const skPos=id=>({x:58+SKILLS[id].x*58,y:80+SKILLS[id].y*46});
function skState(id){ if(hasSk(id)) return 'own'; return SKILLS[id].req.every(r=>hasSk(r))?'open':'lock'; }
function skNav(cur,dx,dy){ const a=skPos(cur); let best=null,bd=1e9; for(const id of SK_IDS){ if(id===cur) continue; const b=skPos(id), vx=b.x-a.x, vy=b.y-a.y; const along=vx*dx+vy*dy; if(along<=0) continue; const perp=Math.abs(vx*dy-vy*dx); const d=along+perp*2.2; if(d<bd){ bd=d; best=id; } } return best||cur; }
function unlockSkill(id,withCredits){
  const s=SKILLS[id], st=skState(id);
  if(st==='own'){ sfx('deny'); toast('Ya despertaste esa rama.'); return false; }
  if(st==='lock'){ sfx('deny'); toast('Primero tenés que despertar: '+s.req.map(r=>SKILLS[r].n).join(' y ')+'.'); return false; }
  if(withCredits){ if(P.credits<s.cr){ sfx('deny'); toast('No te alcanzan los Créditos.'); return false; } P.credits-=s.cr; }
  else { if((P.skillPts||0)<s.pts){ sfx('deny'); toast('Te faltan Plumas de Ystrel. Subí de nivel o pagá con Créditos (K).'); return false; } P.skillPts-=s.pts; }
  P.skills.push(id); if(id==='lagrima'){ P.maxFlasks++; P.flasks++; } recalc(); P.foco=Math.min(P.foco,P.maxFoco);
  sfx('item'); toast('Despertaste: '+s.n+'.',2); return true;
}
function updateSkills(u){
  u.node=u.node||'brasa';
  if(pressed.left) { u.node=skNav(u.node,-1,0); sfx('menu'); } if(pressed.right){ u.node=skNav(u.node,1,0); sfx('menu'); }
  if(pressed.up)   { u.node=skNav(u.node,0,-1); sfx('menu'); } if(pressed.down) { u.node=skNav(u.node,0,1); sfx('menu'); }
  if(pressed.start||pressed.interact||pressed.light||pressed.jump) unlockSkill(u.node,false);
  else if(pressed.heavy) unlockSkill(u.node,true);
}
function drawSkillTree(x0,y0,u){
  const node=u.node||'brasa';
  stext('ÁRBOL DE YSTREL',x0+222,y0+4,18,'#e8dcc4','center');
  stext('Plumas de Ystrel: '+(P.skillPts||0)+'      Créditos: '+P.credits,x0+222,y0+28,12,GOLD,'center');
  for(const id of SK_IDS){ const b=skPos(id); for(const r of SKILLS[id].req){ const a=skPos(r); const lit=hasSk(id), avail=hasSk(r);
    ctx.strokeStyle='#07060b'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x0+a.x,y0+a.y); ctx.lineTo(x0+a.x,y0+(a.y+b.y)/2); ctx.lineTo(x0+b.x,y0+(a.y+b.y)/2); ctx.lineTo(x0+b.x,y0+b.y); ctx.stroke();
    ctx.strokeStyle=lit?'#ffb040':avail?'#7a7a8a':'#2e2c36'; ctx.lineWidth=lit?2:1.5; ctx.stroke();
    if(lit){ ctx.strokeStyle='rgba(255,170,60,0.25)'; ctx.lineWidth=5; ctx.stroke(); } } }
  for(const id of SK_IDS){ const b=skPos(id), st=skState(id), sel=id===node, cx=x0+b.x, cy=y0+b.y;
    if(st==='own'){ const g=ctx.createRadialGradient(cx,cy,0,cx,cy,26); g.addColorStop(0,'rgba(255,150,50,0.45)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(cx-26,cy-26,52,52); }
    ctx.fillStyle='#07060b'; ctx.beginPath(); ctx.moveTo(cx,cy-21); ctx.lineTo(cx+21,cy); ctx.lineTo(cx,cy+21); ctx.lineTo(cx-21,cy); ctx.fill();
    ctx.fillStyle=st==='own'?'#c9a24a':st==='open'?'#8a8a9a':'#3a3844'; ctx.beginPath(); ctx.moveTo(cx,cy-19); ctx.lineTo(cx+19,cy); ctx.lineTo(cx,cy+19); ctx.lineTo(cx-19,cy); ctx.fill();
    ctx.fillStyle=st==='own'?'#2a1a10':'#12101a'; ctx.beginPath(); ctx.moveTo(cx,cy-16); ctx.lineTo(cx+16,cy); ctx.lineTo(cx,cy+16); ctx.lineTo(cx-16,cy); ctx.fill();
    ctx.globalAlpha=st==='lock'?0.3:1; drawIco(icon(SKILL_ICON[id]),cx-12,cy-12,24); ctx.globalAlpha=1;
    if(sel){ ctx.strokeStyle=GOLD; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx,cy-25); ctx.lineTo(cx+25,cy); ctx.lineTo(cx,cy+25); ctx.lineTo(cx-25,cy); ctx.closePath(); ctx.stroke(); } }
  const s=SKILLS[node], st=skState(node), px0=x0+418;
  ornLine(px0-6,y0+52,px0-5,'#3a3844'); ctx.fillStyle='rgba(20,18,28,0.9)'; ctx.fillRect(px0,y0+50,170,232); ctx.strokeStyle='#4a4a58'; ctx.strokeRect(px0+0.5,y0+50.5,169,231);
  drawIco(icon(SKILL_ICON[node]),px0+69,y0+60,32);
  swrap(s.n,150,15).forEach((l,i)=>stext(l,px0+85,y0+98+i*18,15,st==='own'?GOLD:TXT,'center'));
  stext(st==='own'?'DESPERTADA':st==='open'?'DISPONIBLE':'BLOQUEADA',px0+85,y0+140,11,st==='own'?'#ffb040':st==='open'?'#9fe08a':'#a05050','center');
  swrap(s.d,154,12).slice(0,6).forEach((l,i)=>stext(l,px0+8,y0+160+i*15,12,'#c8beb4'));
  if(st!=='own'){ stext(s.pts+(s.pts>1?' plumas':' pluma')+'  o  '+s.cr+' C',px0+85,y0+252,12,GOLD,'center'); if(s.req.length) stext('Requiere: '+s.req.map(r=>SKILLS[r].n).join(', '),px0+85,y0+268,9,DIM,'center'); }
}

// ---------------- actualización ----------------
function tabSwitch(u,n,allowArrows){ let d=0; if(pressed.parry) d=-1; if(pressed.cycle) d=1; if(allowArrows){ if(pressed.left) d=-1; if(pressed.right) d=1; } if(d){ u.tab=(u.tab+d+n)%n; u.sel=0; u.pick=false; u.act=null; sfx('menu'); return true; } return false; }
function updateUI(dt){
  const u=ui;
  switch(u.type){
    case 'options': updateOptions(); break;
    case 'pause':{ nav(6); if(backP()){ closeUI(); return; }
      if(confirmP()){ sfx('menu'); if(u.sel===0) closeUI(); else if(u.sel===1) ui={type:'controls',back:'pause'}; else if(u.sel===2) ui={type:'inv',tab:0,sel:0}; else if(u.sel===3) ui={type:'inv',tab:2,sel:0}; else if(u.sel===4) openOptions('pause'); else { ui=null; mode='title'; titleSel=0; } } break; }
    case 'controls': if(backP()||confirmP()){ ui=u.back==='pause'?{type:'pause',sel:1}:null; } break;
    case 'inv':{
      if(u.act!=null){ // menú de acción de objeto
        const id=itemList()[u.sel]; if(!id){ u.act=null; break; } if(pressed.up||pressed.down){ u.act=(u.act+(pressed.up?2:1))%3; sfx('menu'); }
        if(backP()){ u.act=null; break; }
        if(confirmP()){ if(u.act===0){ ITEMS[id].use(); takeItem(id); sfx('heal'); } else if(u.act===1){ P.quick=id; sfx('buy'); toast(ITEMS[id].name+' asignado a la ranura rápida (G).',2); } u.act=null; }
        break; }
      if(u.pick){ const sl=equipSlots()[u.sel], o=sl.opts; if(o.length) nav0(u,'pi',o.length); if(backP()){ u.pick=false; break; }
        if(confirmP()&&o.length){ sl.set(o[u.pi]); sfx('buy'); u.pick=false; } break; }
      if(backP()||pressed.inventory){ ui=u.from==='pyre'?{type:'pyre',sel:2,saved:true}:null; return; }
      if(tabSwitch(u,4,u.tab===0||u.tab===3)) break;
      if(u.tab===0){ nav(4); if(confirmP()){ const sl=equipSlots()[u.sel]; if(sl.opts.length){ u.pick=true; u.pi=Math.max(0,sl.opts.indexOf(sl.id)); sfx('menu'); } else { sfx('deny'); toast('No tenés nada para esa ranura.'); } } }
      else if(u.tab===1){ const L2=itemList(); if(!L2.length) break; const n=L2.length; let s=u.sel;
        if(pressed.left) s=Math.max(0,s-1); if(pressed.right) s=Math.min(n-1,s+1); if(pressed.up) s=Math.max(0,s-6); if(pressed.down) s=Math.min(n-1,s+6); if(s!==u.sel){ u.sel=s; sfx('menu'); }
        if(u.sel>=n) u.sel=n-1;
        const id=L2[u.sel]; if(confirmP()&&ITEMS[id].type==='cons'){ u.act=0; sfx('menu'); } if(pressed.quick&&ITEMS[id].type==='cons'){ P.quick=id; sfx('buy'); toast(ITEMS[id].name+' asignado a la ranura rápida (G).',2); } }
      else if(u.tab===2) updateSkills(u);
      break; }
    case 'skills':{ if(backP()){ ui=u.from==='pyre'?{type:'pyre',sel:1,saved:true}:null; return; } updateSkills(u); break; }
    case 'pyre':{ nav(4); if(backP()){ closeUI(); return; }
      if(confirmP()){ sfx('menu'); if(u.sel===0) ui={type:'level',sel:0}; else if(u.sel===1) ui={type:'skills',from:'pyre'}; else if(u.sel===2) ui={type:'inv',tab:0,sel:0,from:'pyre'}; else closeUI(); } break; }
    case 'level':{ nav(6); if(backP()){ ui={type:'pyre',sel:0,saved:true}; return; }
      if(confirmP()){ if(u.sel===5){ ui={type:'pyre',sel:0,saved:true}; return; }
        const cost=levelCost(); if(P.credits<cost){ sfx('deny'); toast('No te alcanzan los Créditos.'); }
        else { P.credits-=cost; P.stats[STATS[u.sel].k]++; P.skillPts=(P.skillPts||0)+1; recalc(); refill(); sfx('buy'); saveGame(); burst(pcx(),pcy(),14,['#ffd860','#ff9a3a'],60,{glow:1,g:-30}); toast('+1 Pluma de Ystrel para el árbol de habilidades.',2); } } break; }
    case 'dialog':{
      const node=u.node, line=node.lines[u.line]||'';
      if(u.chars<line.length){ u.chars+=dt*70; if(Math.floor(u.chars)%3===0) sfx('talk'); if(confirmP()) u.chars=line.length; break; }
      const last=u.line>=node.lines.length-1;
      if(!last){ if(confirmP()){ u.line++; u.chars=0; } break; }
      const ch=node.choices||[];
      if(ch.length){ nav(ch.length); if(backP()){ closeUI(); return; }
        if(confirmP()){ const c=ch[u.sel]; const before=ui; const next=c.f?c.f():null; if(ui!==before) return;
          if(next){ u.node=next; u.line=0; u.sel=0; u.chars=0; } else closeUI(); } }
      else if(confirmP()||backP()) closeUI();
      break; }
    case 'shop':{ if(pressed.left||pressed.right){ u.tab=1-u.tab; u.sel=0; sfx('menu'); } if(backP()){ closeUI(); return; }
      const e=shopEntries(u.tab); if(e.length){ nav(e.length); if(confirmP()&&e[u.sel]) e[u.sel].act(); } break; }
    case 'forge':{ if(backP()){ closeUI(); return; } const e=forgeEntries(); if(e.length){ nav(e.length); if(confirmP()&&e[u.sel]&&e[u.sel].act) e[u.sel].act(); } break; }
  }
}
function nav0(u,k,n){ if(pressed.up){ u[k]=(u[k]+n-1)%n; sfx('menu'); } if(pressed.down){ u[k]=(u[k]+1)%n; sfx('menu'); } if(u[k]>=n) u[k]=n-1; }

// ---------------- dibujo ----------------
function hlist(x,y,w,entries,sel,rowH=20,maxRows=9,size=14){
  const start=clamp(sel-maxRows+1,0,Math.max(0,entries.length-maxRows));
  for(let i=start;i<Math.min(entries.length,start+maxRows);i++){ const e=entries[i], yy=y+(i-start)*rowH, s=i===sel;
    if(s){ const g=ctx.createLinearGradient(x,0,x+w,0); g.addColorStop(0,'rgba(120,60,40,0.5)'); g.addColorStop(1,'rgba(120,60,40,0)'); ctx.fillStyle=g; ctx.fillRect(x,yy-2,w,rowH-2); ornDiamond(x-6,yy+rowH/2-3,4,GOLD,'#3a2010'); }
    let tx=x+6; if(e.icon){ drawIco(e.icon,x+4,yy+rowH/2-1-12,24); tx=x+34; }
    stext(e.label,tx,yy+(rowH-size)/2-1,size,s?GOLD:(e.color||TXT)); if(e.right) stext(e.right,x+w-6,yy+(rowH-size)/2,size-2,s?'#ffb050':DIM,'right'); }
  if(entries.length>maxRows) stext((sel+1)+' / '+entries.length,x+w-6,y+maxRows*rowH+2,10,DIM,'right');
}
function hdesc(x,y,w,text,size=12,max=7,col='#c8beb4'){ swrap(text,w,size).slice(0,max).forEach((l,i)=>stext(l,x,y+i*(size+4),size,col)); }
function hints(t){ stext(t,320,334,11,DIM,'center'); }
function drawTabs(names,cur){ const tw=130, x0=320-names.length*tw/2; names.forEach((n,i)=>{ const x=x0+i*tw, sel=i===cur; ctx.fillStyle=sel?'rgba(60,40,30,0.9)':'rgba(16,14,22,0.9)'; ctx.fillRect(x+6,24,tw-12,24);
  ctx.strokeStyle=sel?'#c9a24a':'#3a3844'; ctx.strokeRect(x+6.5,24.5,tw-13,23); stext(n,x+tw/2,29,13,sel?GOLD:DIM,'center'); if(sel) ornDiamond(x+tw/2,48,4,GOLD,'#3a2010'); }); }
function drawControlsHi(y0){ stext('ACCIÓN',70,y0,12,DIM); stext('TECLADO',330,y0,12,DIM); stext('MANDO',480,y0,12,DIM); ornLine(60,y0+18,580,'#3a3844');
  CONTROLS_TABLE.concat([['RANURA RÁPIDA (CONSUMIBLE)','G','R3']]).forEach((r,i)=>{ const y=y0+26+i*19; stext(r[0],70,y,13,TXT); stext(ctrlKeys(i,r[1]),330,y,13,GOLD); stext(r[2],480,y,13,'#b8a8c8'); }); }
function drawUI(){
  const u=ui; if(!u) return;
  hiOn();
  ctx.fillStyle=u.type==='dialog'?'rgba(4,2,10,0.3)':'rgba(4,2,10,0.62)'; ctx.fillRect(0,0,640,360);
  switch(u.type){
    case 'options': drawOptions(); break;
    case 'pause': hpanel(220,80,200,214,'PAUSA'); hlist(250,108,150,['CONTINUAR','CONTROLES','INVENTARIO Y EQUIPO','HABILIDADES','OPCIONES','VOLVER AL TÍTULO'].map(l=>({label:l})),u.sel,26,6,15); for(let i=0;i<6;i++) addTap(240,106+i*26,170,24,()=>{ ui.sel=i; pressed.start=true; });
      hints('La partida se guarda al descansar en una pira'); break;
    case 'controls': hpanel(40,24,560,320,'CONTROLES'); drawControlsHi(44); stext('Parada justa: aturde  ·  Disparo durante una carga: interrumpe  ·  Ligero sobre aturdido: crítico',320,326,11,'#c8a8b8','center'); break;
    case 'inv':{ hpanel(12,14,616,342); drawTabs(['EQUIPO','OBJETOS','HABILIDADES','ESTADO'],u.tab);
      if(u.tab===0){ const S=equipSlots();
        S.forEach((sl,i)=>{ const y=64+i*62, sel=i===u.sel&&!u.pick; slotBox(34,y,48,sel); if(sl.id) drawIco(sl.id,42,y+8,32); stext(sl.label,94,y+6,11,DIM); stext(nameOf(sl.id),94,y+22,15,sel?GOLD:TXT);
          if(sl.id&&WEAPONS[sl.id]) stext('+'+(P.weapons[sl.id]||0),78,y+34,11,'#d8d0c0','right'); if(i===3&&sl.id) stext('x'+P.items[sl.id],78,y+34,11,'#d8d0c0','right'); });
        const sl=S[u.sel]; ctx.fillStyle='rgba(20,18,28,0.85)'; ctx.fillRect(330,60,282,262); ctx.strokeStyle='#3a3844'; ctx.strokeRect(330.5,60.5,281,261);
        if(u.pick){ stext('ELEGÍ: '+sl.label,471,68,13,GOLD,'center'); hlist(346,92,256,sl.opts.map(id=>({label:nameOf(id)+(WEAPONS[id]?' +'+P.weapons[id]:'')+(ITEMS[id]?' x'+P.items[id]:''),icon:iconFor(id),color:id===sl.id?'#9fe08a':null})),u.pi,30,7,14);
          const d=detailOf(sl.opts[u.pi]); hdesc(346,306-0,256,'',12); }
        else { const d=detailOf(sl.id); if(sl.id) drawIco(sl.id,438,68,64); stext(d.title,471,136,16,GOLD,'center'); d.lines.forEach((l,i)=>stext(l,346,160+i*16,12,TXT)); hdesc(346,168+d.lines.length*16,256,d.desc,12,7); }
        hints(u.pick?'↑↓ elegir  ·  E/ENTER equipar  ·  ESC volver':'↑↓ ranura  ·  E/ENTER cambiar  ·  ← → / Q T pestaña  ·  ESC salir'); }
      else if(u.tab===1){ const L2=itemList(); if(!L2.length) stext('Todavía no llevás nada.',170,150,14,DIM,'center');
        L2.forEach((id,i)=>{ const cx=34+(i%6)*48, cy=64+Math.floor(i/6)*48, sel=i===u.sel; slotBox(cx,cy,42,sel); drawIco(id,cx+5,cy+5,32); if(ITEMS[id].type!=='key') stext(String(P.items[id]),cx+39,cy+27,11,'#f0e8d8','right',null,'bold'); if(P.quick===id) stext('G',cx+5,cy+2,9,GOLD); });
        const id=L2[u.sel]; ctx.fillStyle='rgba(20,18,28,0.85)'; ctx.fillRect(330,60,282,262); ctx.strokeStyle='#3a3844'; ctx.strokeRect(330.5,60.5,281,261);
        if(id){ const it=ITEMS[id]; drawIco(id,438,68,64); stext(it.name,471,136,16,GOLD,'center'); stext(TYPE_N[it.type]+(it.type!=='key'?'   ·   x'+P.items[id]:''),471,156,11,'#b8a8c8','center'); ornLine(350,176,592,'#3a3844'); hdesc(346,186,256,it.desc,12,8);
          if(u.act!=null){ hpanel(360,248,222,66); ['USAR','ASIGNAR A RANURA RÁPIDA','CANCELAR'].forEach((t,i)=>stext((i===u.act?'◆ ':'   ')+t,374,256+i*18,13,i===u.act?GOLD:TXT)); } }
        hints('Flechas: mover  ·  E/ENTER: usar o asignar  ·  G: ranura rápida  ·  Q T: pestaña  ·  ESC salir'); }
      else if(u.tab===2){ drawSkillTree(14,50,u); hints('Flechas: recorrer  ·  E/ENTER: despertar con Plumas  ·  K: pagar con Créditos  ·  Q T: pestaña'); }
      else { ctx.drawImage(portrait('player'),0,0,240,256,26,58,240,256); ctx.strokeStyle='#3a3844'; ctx.strokeRect(26.5,58.5,239,255); stext(PNAME(),146,292,18,GOLD,'center');
        const s=P.stats, A=[['Nivel',P.level],['Créditos',P.credits],['Plumas de Ystrel',P.skillPts||0],['Vigor',s.vig],['Resistencia',s.res],['Fuerza',s.fue],['Destreza',s.des],['Mente',s.men]];
        A.forEach((r,i)=>{ stext(r[0],290,64+i*19,13,TXT); stext(String(r[1]),440,64+i*19,13,GOLD,'right'); });
        const B=[['Vida',Math.ceil(P.hp)+'/'+P.maxHp],['Aguante',P.maxSt],['Foco',Math.floor(P.foco)+'/'+P.maxFoco],['Lágrimas',P.flasks+'/'+P.maxFlasks],['Balas',P.ammo+'/'+P.maxAmmo],['Daño de arma','x'+weaponMult(P.wpn).toFixed(2)],['Daño de verso','x'+spellMult().toFixed(2)],['Habilidades',P.skills.length+'/'+SK_IDS.length]];
        B.forEach((r,i)=>{ stext(r[0],464,64+i*19,13,TXT); stext(String(r[1]),606,64+i*19,13,GOLD,'right'); });
        ornLine(290,224,606,'#3a3844'); hdesc(290,234,316,PNAME()+', '+G('el último farolero','la última farolera','la última luz')+' de la Orden del Pabilo. Murió en la Quema y el Código Fénix volvió a escribirle. Cada renacer le quema un recuerdo... y le deja otro que no es suyo.',12,5);
        hints('← → / Q T: pestaña  ·  ESC salir'); }
      break; }
    case 'skills': hpanel(12,14,616,342); drawSkillTree(14,26,u); hints('Flechas: recorrer  ·  E/ENTER: despertar con Plumas  ·  K: pagar con Créditos  ·  ESC volver'); break;
    case 'pyre': hpanel(220,92,200,186,'PIRA DE RENACER'); stext(u.saved?'Partida guardada':'No se pudo guardar',320,112,12,u.saved?'#9fe08a':'#e05050','center');
      hlist(244,136,160,[{label:'Subir de nivel',right:levelCost()+' C'},{label:'Árbol de Ystrel',right:(P.skillPts||0)+' ✦'},{label:'Inventario y equipo'},{label:'Levantarse'}],u.sel,30,4,15); break;
    case 'level':{ hpanel(12,14,616,342,'OFRENDA A LA PIRA'); stext('Nivel '+P.level+'   ·   Créditos: '+P.credits+'   ·   Costo del siguiente nivel: '+levelCost(),320,36,13,'#d8ccbc','center');
      const ent=STATS.map(s=>({label:s.n,right:String(P.stats[s.k])})).concat([{label:'Volver'}]); hlist(52,70,240,ent,u.sel,30,6,15);
      const R=[['Vida',P.maxHp],['Aguante',P.maxSt],['Foco',P.maxFoco],['Daño de arma','x'+weaponMult(P.wpn).toFixed(2)],['Daño de verso','x'+spellMult().toFixed(2)],['Plumas de Ystrel',P.skillPts||0]];
      ctx.fillStyle='rgba(20,18,28,0.85)'; ctx.fillRect(340,64,262,190); R.forEach((r,i)=>{ stext(r[0],356,76+i*28,14,TXT); stext(String(r[1]),588,76+i*28,14,GOLD,'right'); });
      ornLine(40,270,600,'#3a3844'); hdesc(52,280,536,u.sel<5?STATS[u.sel].d+' Cada nivel también te da una Pluma de Ystrel para el árbol.':'Volver a la pira.',13,3); break; }
    case 'dialog':{ const node=u.node, line=node.lines[u.line]||''; const shown=line.slice(0,Math.floor(u.chars));
      const ch=(u.line>=node.lines.length-1&&u.chars>=line.length)?(node.choices||[]):[];
      ctx.globalAlpha=0.55; ctx.drawImage(portrait('player'),14,30,240,300); ctx.globalAlpha=1;
      ctx.drawImage(portrait(u.npc),380,6,240,300);
      const y0=262, g=ctx.createLinearGradient(0,y0,0,360); g.addColorStop(0,'rgba(6,5,10,0.92)'); g.addColorStop(1,'rgba(3,2,6,0.98)'); ctx.fillStyle=g; ctx.fillRect(0,y0,640,98);
      ornLine(16,y0,624,'#7a7a88'); ornDiamond(16,y0,4); ornDiamond(624,y0,4); ornDiamond(320,y0,6,'#a8a8b8'); ornCurl(306,y0,-1,'#7a7a88'); ornCurl(334,y0,1,'#7a7a88');
      ornDiamond(560,y0,5,'#a8a8b8'); stext(u.name,600,y0-26,18,'#ece4d4','right');
      swrap(shown,470,14).slice(0,4).forEach((l,i)=>stext(l,86,y0+14+i*19,14,'#dcd4c8','left',null));
      if(ch.length){ const h=ch.length*22+18, cy=y0-h-8; hpanel(200,cy,240,h); hlist(222,cy+10,206,ch.map(c=>({label:c.t})),u.sel,22,ch.length,14); }
      if(toastM){ ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(160,56,320,swrap(toastM.text,440,13).length*17+8); drawToast(60); }
      if(u.chars>=line.length){ keyCap(548,340,'E'); stext(ch.length?'ELEGIR':(u.line>=node.lines.length-1?'CERRAR':'SIGUIENTE'),562,334,11,'#d8d8e0'); }
      break; }
    case 'shop':{ hpanel(12,14,616,342,'SABELA LA TUERTA'); drawTabs(['COMPRAR','VENDER'],u.tab); stext('Créditos: '+P.credits,604,30,13,GOLD,'right');
      const e=shopEntries(u.tab); if(!e.length) stext('Nada para mostrar.',170,150,14,DIM,'center'); hlist(40,64,280,e,u.sel,28,9,14);
      ctx.fillStyle='rgba(20,18,28,0.85)'; ctx.fillRect(338,60,274,262); ctx.drawImage(portrait('sabela'),28,48,184,200,350,64,80,87);
      if(e[u.sel]){ if(e[u.sel].icon) drawIco(e[u.sel].icon,452,70,48); stext(e[u.sel].label,475,142,15,GOLD,'center'); ornLine(354,162,596,'#3a3844'); hdesc(354,172,244,e[u.sel].desc,12,9); }
      hints('↑↓ elegir  ·  ← → comprar / vender  ·  E/ENTER confirmar  ·  ESC salir'); break; }
    case 'forge':{ hpanel(12,14,616,342,'YUNQUE DE BROM'); stext('Créditos: '+P.credits+'   ·   Fragmentos: '+(P.items.fragmento||0)+'   ·   Brasas Mayores: '+(P.items.brasaMayor||0),320,30,12,'#d8ccbc','center');
      const e=forgeEntries(); hlist(40,64,280,e,u.sel,28,9,13); ctx.fillStyle='rgba(20,18,28,0.85)'; ctx.fillRect(338,60,274,262); ctx.drawImage(portrait('brom'),20,28,200,200,350,64,80,80);
      if(e[u.sel]){ if(e[u.sel].icon) drawIco(e[u.sel].icon,452,70,48); stext(e[u.sel].label,475,142,14,GOLD,'center'); ornLine(354,162,596,'#3a3844'); hdesc(354,172,244,e[u.sel].desc,12,9); }
      hints('↑↓ elegir  ·  E/ENTER mejorar  ·  ESC salir'); break; }
  }
  hiOff();
}

// Teclas actuales de cada fila de la tabla de controles (respeta la reasignación del menú OPCIONES).
const CTRL_ACTS=[['left','right'],['jump'],['light'],['heavy'],['shoot'],['dodge'],['parry'],['heal'],['spell','cycle'],['interact','up'],['inventory'],['pause','mute'],['quick']];
function ctrlKeys(i,def){ const a=CTRL_ACTS[i]; if(!a||typeof keysOf!=='function') return def; return a.map(keysOf).join(' · '); }
