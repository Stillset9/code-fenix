// CODE FENIX — esqueleto procedural ("paper doll") para personajes a resolución nativa.
// Cada cuadro se pinta con primitivas en un lienzo propio, se cuantiza y se le agrega contorno de 1 px.
// Convención de ángulos: 0 = hacia abajo, positivo = hacia adelante (derecha), PI = hacia arriba.
'use strict';
const TAU=Math.PI*2;
const pt=(p,a,L)=>({x:p.x+Math.sin(a)*L,y:p.y+Math.cos(a)*L});
function seg(x,a,b,w,col,hi){ x.lineCap='round'; x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke();
  if(hi){ x.strokeStyle=hi; x.lineWidth=Math.max(0.8,w*0.32); x.beginPath(); x.moveTo(a.x-w*0.22,a.y-w*0.12); x.lineTo(b.x-w*0.22,b.y-w*0.12); x.stroke(); } }
function circ(x,c,r,col){ x.fillStyle=col; x.beginPath(); x.arc(c.x,c.y,Math.max(0.5,r),0,TAU); x.fill(); }
function ell(x,cx,cy,rx,ry,col,rot=0){ x.fillStyle=col; x.beginPath(); x.ellipse(cx,cy,Math.max(0.4,rx),Math.max(0.4,ry),rot,0,TAU); x.fill(); }
function poly(x,pts,col){ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) x.lineTo(pts[i].x,pts[i].y); x.closePath(); x.fill(); }
function sh(hexc,f){ return shadeHex(hexc,f); }

// Postproceso: umbral de alfa, cuantización suave y contorno oscuro.
function finishSprite(c,outline='#08060c'){
  const x=c.getContext('2d'), w=c.width, h=c.height, im=x.getImageData(0,0,w,h), d=im.data;
  const op=new Uint8Array(w*h);
  for(let i=0,p=0;i<d.length;i+=4,p++){ if(d[i+3]>110){ op[p]=1; d[i+3]=255; for(let k=0;k<3;k++) d[i+k]=Math.round(d[i+k]/6)*6; } else d[i+3]=0; }
  const oc=[1,3,5].map(i=>parseInt(outline.slice(i,i+2),16));
  for(let y=0;y<h;y++) for(let X=0;X<w;X++){ const p=y*w+X; if(op[p]) continue;
    if((X>0&&op[p-1])||(X<w-1&&op[p+1])||(y>0&&op[p-w])||(y<h-1&&op[p+w])){ const i=p*4; d[i]=oc[0]; d[i+1]=oc[1]; d[i+2]=oc[2]; d[i+3]=255; } }
  x.putImageData(im,0,0);
  const fl=mkCanvas(w,h), fx=fl.getContext('2d'); fx.drawImage(c,0,0); fx.globalCompositeOperation='source-in'; fx.fillStyle='#fff6ee'; fx.fillRect(0,0,w,h);
  return {img:c,flash:fl,w,h};
}

// ---- dibujo del esqueleto ----
function drawRig(x,po,st){
  const S=st.scale||1, L=v=>v*S;
  const hip={x:0,y:-L(21)+(po.hip||0)*S};
  const lean=po.lean||0, sw=st.chest||8, ww=st.waist||6.5, hw=st.hips||7.5;
  const shoulder={x:hip.x+Math.sin(lean)*L(14),y:hip.y-Math.cos(lean)*L(14)};
  const headC={x:shoulder.x+Math.sin(lean+(po.head||0))*L(5.6),y:shoulder.y-Math.cos(lean+(po.head||0))*L(5.6)};
  const J={hip,shoulder,headC};
  const legs=[], arms=[];
  for(const [t,k,side] of [[po.bt||0,po.bk||0,0],[po.ft||0,po.fk||0,1]]){ const h0={x:hip.x+(side?1:-1)*L(1),y:hip.y}; const knee=pt(h0,t,L(10)); const foot=pt(knee,t-k,L(10)); legs.push({h0,knee,foot,t,k}); }
  for(const [u,l,side] of [[po.bu||0,po.bl||0,0],[po.fu||0,po.fl||0,1]]){ const s0={x:shoulder.x+(side?1:-1)*L(1.2)*Math.cos(lean),y:shoulder.y+L(1)}; const el=pt(s0,u,L(st.arm||8)); const hand=pt(el,u+l,L(st.arm||8)); arms.push({s0,el,hand,u,l}); }
  J.legs=legs; J.arms=arms;
  const cl=st.cloak, cld=cl?sh(cl,0.55):null;
  // capa (detrás)
  if(cl&&!st.noCape){ const f=po.cloak||0, hemY=hip.y+L(st.robe?21:13), back=-L(4)-f*L(9), wav=Math.sin((po.wave||0)*TAU)*L(1.5);
    poly(x,[{x:shoulder.x-L(2),y:shoulder.y},{x:shoulder.x+L(2.5),y:shoulder.y+L(1)},{x:hip.x+L(st.robe?6:2),y:hemY},{x:hip.x+back*0.5,y:hemY+wav},{x:hip.x+back,y:hemY-f*L(4)-wav}],cld);
    poly(x,[{x:shoulder.x-L(2),y:shoulder.y},{x:hip.x+back*0.85,y:hemY-f*L(4)-wav-L(1)},{x:hip.x+back*0.4,y:hemY-L(1)},{x:hip.x-L(1),y:hip.y}],sh(cl,0.75)); }
  // extremidades traseras
  const skinD=sh(st.skin,0.7), pants=st.pants||'#2a2430', boots=st.boots||'#1b1522';
  const aBack=arms[0], lBack=legs[0];
  if(!st.noBackArm){ seg(x,aBack.s0,aBack.el,L(2.6),sh(st.sleeve||cl||'#333',0.6)); seg(x,aBack.el,aBack.hand,L(2.3),sh(st.sleeve||cl||'#333',0.6)); circ(x,aBack.hand,L(1.4),skinD); }
  if(!st.robe){ seg(x,lBack.h0,lBack.knee,L(3.4),sh(pants,0.7)); seg(x,lBack.knee,lBack.foot,L(3),sh(boots,0.8)); seg(x,lBack.foot,{x:lBack.foot.x+L(3.2),y:lBack.foot.y+L(0.3)},L(2.4),sh(boots,0.8)); }
  // torso
  { const n={x:Math.cos(lean),y:Math.sin(lean)};
    const P0=(o,w2)=>({x:o.x+n.x*w2,y:o.y+n.y*w2});
    const waist={x:hip.x+Math.sin(lean)*L(6),y:hip.y-Math.cos(lean)*L(6)};
    if(st.robe){ const hemY=hip.y+L(21), fl=po.cloak||0; poly(x,[P0(shoulder,-sw*S/2),P0(shoulder,sw*S/2),{x:hip.x+L(hw*0.9)+fl*L(2),y:hemY},{x:hip.x-L(hw*0.9)-fl*L(5),y:hemY}],st.robeCol||cl);
      for(let k=-2;k<=2;k++) seg(x,{x:hip.x+k*L(1.8),y:hip.y},{x:hip.x+k*L(2.6)-fl*L(2),y:hemY-L(1)},L(0.8),sh(st.robeCol||cl,0.72)); }
    poly(x,[P0(hip,-hw*S/2),P0(hip,hw*S/2),P0(waist,ww*S/2),P0(shoulder,sw*S/2),P0(shoulder,-sw*S/2),P0(waist,-ww*S/2)],st.tunic||cld||'#2a2430');
    if(st.armor){ const mid={x:(shoulder.x*0.4+waist.x*0.6),y:(shoulder.y*0.4+waist.y*0.6)}; poly(x,[P0(shoulder,-sw*S/2),P0(shoulder,sw*S/2),P0(mid,ww*S/2+0.8),P0(mid,-ww*S/2-0.8)],st.armor);
      seg(x,P0(shoulder,sw*S/2-1),P0(waist,ww*S/2-1),L(1),sh(st.armor,1.35)); }
    if(st.belt!==false) seg(x,P0(waist,-ww*S/2),P0(waist,ww*S/2),L(1.6),st.belt||'#3a2a1a');
    J.waist=waist; }
  // pierna delantera
  const lF=legs[1];
  if(!st.robe){ seg(x,lF.h0,lF.knee,L(3.6),pants,sh(pants,1.4)); seg(x,lF.knee,lF.foot,L(3.2),boots,sh(boots,1.6)); seg(x,lF.foot,{x:lF.foot.x+L(3.4),y:lF.foot.y+L(0.3)},L(2.6),boots); }
  // farol en la cintura
  if(st.lantern){ const lp={x:J.waist.x+L(3.5),y:J.waist.y+L(2)}; x.fillStyle='#2a2430'; x.fillRect(lp.x-1.5,lp.y,3,4); x.fillStyle=st.lanternLit===false?'#5a4a30':'#ffd860'; x.fillRect(lp.x-0.8,lp.y+1,1.6,2); }
  // cabeza
  drawHead(x,J,po,st,L);
  // brazo delantero + arma
  const aF=arms[1]; const wa=po.wa!=null?po.wa:aF.u+aF.l;
  if(st.weapon&&po.wBehind) drawWeapon(x,st.weapon,aF.hand,wa,L,st);
  seg(x,aF.s0,aF.el,L(2.8),st.sleeve||cl||'#333',sh(st.sleeve||cl||'#444',1.4)); seg(x,aF.el,aF.hand,L(2.5),st.sleeve||cl||'#333');
  if(st.pauldron) ell(x,aF.s0.x,aF.s0.y-L(0.4),L(2.9),L(2.2),st.pauldron,lean);
  if(st.weapon&&!po.wBehind&&!po.noWeapon) drawWeapon(x,po.gun?'gun':st.weapon,aF.hand,po.gun?aF.u+aF.l:wa,L,st);
  circ(x,aF.hand,L(1.5),st.gloves||st.skin);
  if(st.extra) st.extra(x,J,po,L);
  return J;
}
function drawHead(x,J,po,st,L){
  const c=J.headC, r=L(st.headR||4.4), hs=st.hair, hairC=st.hairC||'#2a2020', fwd=po.look||0;
  if(hs==='bell'){ // campana de bronce como cabeza
    poly(x,[{x:c.x-L(3),y:c.y-L(5)},{x:c.x+L(3),y:c.y-L(5)},{x:c.x+L(6),y:c.y+L(4)},{x:c.x-L(6),y:c.y+L(4)}],'#7a5a2a');
    seg(x,{x:c.x-L(5.6),y:c.y+L(4)},{x:c.x+L(5.6),y:c.y+L(4)},L(1.6),'#b8893a'); seg(x,{x:c.x-L(2),y:c.y-L(4)},{x:c.x-L(4),y:c.y+L(3)},L(1),'#c89a50');
    circ(x,{x:c.x,y:c.y-L(5.5)},L(1.3),'#5a4020'); ell(x,c.x+L(1.5),c.y+L(1),L(1),L(1),st.eyes||'#ffd860'); return; }
  if(hs==='hood'||hs==='nun'){ const hc=hs==='nun'?(st.veil||'#1a1820'):(st.hoodC||st.cloak);
    poly(x,[{x:c.x-r*1.0,y:c.y-r*0.6},{x:c.x-r*2.0-(po.cloak||0)*r*0.8,y:c.y+r*0.9},{x:c.x-r*0.4,y:c.y+r*1.2}],sh(hc,0.75));
    circ(x,{x:c.x-r*0.15,y:c.y-r*0.1},r*1.22,hc); }
  if(hs==='helmet'){ circ(x,{x:c.x-r*0.1,y:c.y-r*0.15},r*1.2,st.helmC||'#6a645c'); }
  // cara
  ell(x,c.x+r*0.35,c.y+r*0.15,r*0.78,r*0.92,st.skin);
  ell(x,c.x+r*0.15,c.y+r*0.5,r*0.6,r*0.4,sh(st.skin,0.82));
  if(hs==='nun'){ seg(x,{x:c.x-r*0.2,y:c.y-r*0.85},{x:c.x+r*1.1,y:c.y-r*0.7},L(1.4),'#d8d4cc'); seg(x,{x:c.x-r*0.2,y:c.y+r*1.0},{x:c.x+r*1.0,y:c.y+r*1.1},L(1.2),'#c8c4bc'); }
  if(hs==='helmet'){ const m=st.helmC||'#6a645c'; x.fillStyle=m; x.beginPath(); x.arc(c.x,c.y-r*0.1,r*1.22,Math.PI*1.05,Math.PI*1.95); x.fill(); seg(x,{x:c.x-r*0.3,y:c.y-r*0.55},{x:c.x+r*1.25,y:c.y-r*0.55},L(1.2),sh(m,1.4));
    seg(x,{x:c.x+r*0.95,y:c.y-r*0.4},{x:c.x+r*0.95,y:c.y+r*0.9},L(1),sh(m,0.7)); if(st.plume) poly(x,[{x:c.x,y:c.y-r*1.2},{x:c.x-r*2.2,y:c.y-r*1.8},{x:c.x-r*2.6,y:c.y-r*0.4}],st.plume); }
  // ojo
  const eye=st.eyes||'#ffd860'; if(st.eyeClosed) seg(x,{x:c.x+r*0.45,y:c.y+r*0.05},{x:c.x+r*0.95,y:c.y+r*0.05},0.8,sh(st.skin,0.5));
  else { x.fillStyle=sh(st.skin,0.45); x.fillRect(Math.round(c.x+r*0.4),Math.round(c.y-r*0.32),2,1); x.fillStyle=eye; x.fillRect(Math.round(c.x+r*0.55),Math.round(c.y-r*0.08),1.4,1.4); }
  // pelo
  if(hs==='short'||hs==='long'||hs==='braid'||hs==='scarf'){
    const hc=hs==='scarf'?(st.scarfC||'#5a3438'):hairC;
    x.fillStyle=hc; x.beginPath(); x.arc(c.x-r*0.05,c.y-r*0.05,r*1.05,Math.PI*0.75,Math.PI*1.92); x.closePath(); x.fill();
    ell(x,c.x-r*0.55,c.y+r*0.1,r*0.55,r*0.8,hc); seg(x,{x:c.x+r*0.3,y:c.y-r*0.9},{x:c.x+r*0.95,y:c.y-r*0.45},L(1.2),hs==='scarf'?sh(hc,1.3):sh(hc,1.4));
    if(hs==='long'){ const sw2=(po.cloak||0)*r*0.9; poly(x,[{x:c.x-r*1.0,y:c.y-r*0.3},{x:c.x-r*0.1,y:c.y+r*0.2},{x:c.x-r*0.6-sw2*0.5,y:c.y+r*2.6},{x:c.x-r*1.6-sw2,y:c.y+r*2.3}],hc); }
    if(hs==='braid'){ for(let i=0;i<4;i++) circ(x,{x:c.x-r*1.0-i*r*0.25-(po.cloak||0)*i*r*0.25,y:c.y+r*(0.6+i*0.55)},r*0.33,i%2?sh(hc,1.3):hc); }
    if(hs==='scarf'){ circ(x,{x:c.x-r*1.2,y:c.y+r*0.2},r*0.45,sh(hc,0.8)); poly(x,[{x:c.x-r*1.2,y:c.y+r*0.3},{x:c.x-r*2.2,y:c.y+r*1.8},{x:c.x-r*1.4,y:c.y+r*1.9}],sh(hc,0.7)); }
  }
  if(st.beardC){ ell(x,c.x+r*0.55,c.y+r*0.8,r*0.62,r*0.6,st.beardC); poly(x,[{x:c.x+r*0.1,y:c.y+r*0.7},{x:c.x+r*1.1,y:c.y+r*0.75},{x:c.x+r*0.7,y:c.y+r*1.6}],st.beardC); }
  if(hs==='shaved'){ x.globalAlpha=0.35; x.fillStyle=hairC; x.beginPath(); x.arc(c.x,c.y,r*0.98,Math.PI*0.9,Math.PI*1.85); x.fill(); x.globalAlpha=1; }
  if(hs==='hood'){ x.fillStyle=st.hoodC||st.cloak; x.beginPath(); x.arc(c.x-r*0.15,c.y-r*0.1,r*1.22,Math.PI*1.08,Math.PI*1.75); x.lineTo(c.x+r*0.3,c.y-r*0.5); x.fill();
    seg(x,{x:c.x+r*0.5,y:c.y-r*0.6},{x:c.x+r*0.95,y:c.y-r*0.3},L(1),hairC); }
  if(hs==='nun'){ x.fillStyle=st.veil||'#1a1820'; x.beginPath(); x.arc(c.x-r*0.15,c.y-r*0.1,r*1.22,Math.PI*1.05,Math.PI*1.72); x.lineTo(c.x+r*0.2,c.y-r*0.6); x.fill(); }
}
function drawWeapon(x,type,h,a,L,st){
  const d={x:Math.sin(a),y:Math.cos(a)}, at=k=>({x:h.x+d.x*L(k),y:h.y+d.y*L(k)}), n={x:-d.y,y:d.x};
  if(type==='hoz'){ seg(x,at(-7),at(20),L(1.6),'#6a4528','#9a6a40'); const tip=at(20); x.strokeStyle='#c8ccd8'; x.lineWidth=L(1.8); x.beginPath(); x.moveTo(tip.x,tip.y);
      x.quadraticCurveTo(tip.x+n.x*L(9)+d.x*L(2),tip.y+n.y*L(9)+d.y*L(2),tip.x+n.x*L(11)-d.x*L(6),tip.y+n.y*L(11)-d.y*L(6)); x.stroke(); x.strokeStyle='#f4f6fa'; x.lineWidth=L(0.6); x.stroke();
      const lp=at(18); x.fillStyle='#ffd860'; x.fillRect(lp.x-n.x*L(2)-1,lp.y-n.y*L(2),2,2); }
  else if(type==='mandoble'){ seg(x,at(-4),at(0),L(1.8),'#4a2a1a'); seg(x,{x:h.x+n.x*L(4),y:h.y+n.y*L(4)},{x:h.x-n.x*L(4),y:h.y-n.y*L(4)},L(1.6),'#c9a24a'); seg(x,at(1),at(27),L(3.4),'#8c909c','#e4e6ee'); circ(x,at(-4.5),L(1.2),'#c9a24a'); }
  else if(type==='estoque'){ seg(x,at(-3),at(0),L(1.4),'#4a2a1a'); x.strokeStyle='#c9a24a'; x.lineWidth=L(0.8); x.beginPath(); x.arc(h.x+d.x*L(1),h.y+d.y*L(1),L(2.2),0,TAU); x.stroke(); seg(x,at(1),at(25),L(1.1),'#e0e4ee'); }
  else if(type==='hammer'){ seg(x,at(-2),at(13),L(1.6),'#5a3a22'); const t=at(13); poly(x,[{x:t.x+n.x*L(4),y:t.y+n.y*L(4)},{x:t.x-n.x*L(4),y:t.y-n.y*L(4)},{x:t.x-n.x*L(4)+d.x*L(4),y:t.y-n.y*L(4)+d.y*L(4)},{x:t.x+n.x*L(4)+d.x*L(4),y:t.y+n.y*L(4)+d.y*L(4)}],'#5a5a66'); }
  else if(type==='gun'){ seg(x,at(0),at(7),L(1.8),'#5a5a66'); seg(x,at(0),{x:h.x-d.x*L(0)+n.x*L(-2.5),y:h.y+n.y*L(-2.5)},L(1.6),'#5a3a20'); }
  else if(type==='candle'){ x.fillStyle='#d8d0c0'; x.fillRect(h.x-L(1),h.y-L(6),L(2),L(6)); ell(x,h.x,h.y-L(7.5),L(1),L(1.8),'#ffd070'); }
  else if(type==='feather'){ seg(x,at(-2),at(10),L(1.6),'#9a9aa8'); seg(x,at(-2),at(10),L(0.5),'#e0e0e8'); }
  else if(type==='staff'){ seg(x,at(-14),at(12),L(1.4),'#4a3420','#6a4a2a'); }
}

// ---- animaciones (fases 0..1 → pose) ----
const s_=Math.sin, c_=Math.cos;
const POSES={
  idle:{n:6,fps:6,f:p=>{ const b=s_(p*TAU); return {hip:b*0.4,bt:-0.1,ft:0.14,bk:0.06,fk:0.08,bu:-0.2+b*0.05,bl:0.3,fu:0.35+b*0.04,fl:0.7,wa:2.5,cloak:0.12+b*0.04,wave:p,lean:0.03}; }},
  run:{n:8,fps:14,f:p=>{ const a=p*TAU, s=s_(a); return {hip:-Math.abs(s_(a))*1.2+0.5,lean:0.22,bt:-s*0.85,ft:s*0.85,bk:0.25+Math.max(0,s)*1.3,fk:0.25+Math.max(0,-s)*1.3,bu:s*0.75,bl:0.6,fu:-s*0.75+0.2,fl:0.9,wa:2.0+s*0.2,cloak:0.65+s*0.1,wave:p}; }},
  jump:{n:2,fps:0,f:p=>p<0.5?{lean:0.1,bt:-0.25,bk:1.2,ft:0.7,fk:1.3,bu:-0.9,bl:0.6,fu:-1.2,fl:0.8,wa:2.3,cloak:0.2,hip:-1}:{lean:0.05,bt:-0.15,bk:0.3,ft:0.25,fk:0.4,bu:-1.6,bl:0.5,fu:-1.8,fl:0.6,wa:2.6,cloak:-0.35,hip:0}},
  dash:{n:1,fps:0,f:()=>({lean:0.65,bt:-1.1,bk:0.5,ft:0.3,fk:1.2,bu:-1.4,bl:0.2,fu:-1.1,fl:0.3,wa:1.7,cloak:1.3,hip:-1})},
  hurt:{n:2,fps:10,f:p=>({lean:-0.38,head:-0.3,bt:0.25,bk:0.3,ft:0.5,fk:0.5,bu:1.2,bl:0.4,fu:-1.3,fl:0.6,wa:2.9,cloak:0.5+p*0.2,hip:1})},
  dead:{n:6,fps:0,f:p=>{ const k=Math.min(1,p*2), r=Math.max(0,p*2-1); return {hip:4+k*4+r*6,lean:0.25+k*0.2,head:0.3,bt:-0.2,bk:1.6*k,ft:0.9*k,fk:1.7*k,bu:0.3,bl:0.2,fu:0.6+r*0.6,fl:0.3,wa:1.2,cloak:0.2,rot:r*1.45,noWeapon:r>0.6}; }},
  heal:{n:2,fps:3,f:p=>({hip:6,lean:0.05,head:-0.25,bt:-0.15,bk:1.65,ft:0.95,fk:1.65,bu:0.2,bl:0.3,fu:-2.5,fl:0.2,wa:3.1,cloak:0.1,wBehind:true,glow:1})},
  cast:{n:2,fps:6,f:p=>({lean:0.12,bt:-0.35,ft:0.45,fk:0.2,bk:0.1,bu:-1.8,bl:0.3,fu:1.5+p*0.1,fl:0.05,wa:2.8,cloak:0.35,wBehind:true})},
  shoot:{n:2,fps:0,f:p=>({lean:p<0.5?0.05:-0.08,bt:-0.3,ft:0.35,bk:0.1,fk:0.1,bu:-0.3,bl:0.4,fu:1.57-(p<0.5?0:0.25),fl:0,gun:true,cloak:0.2})},
  parry:{n:2,fps:0,f:p=>({lean:-0.08,bt:-0.35,ft:0.4,bk:0.2,fk:0.2,bu:-0.4,bl:0.5,fu:0.6,fl:-1.4,wa:Math.PI,cloak:0.3})},
  crit:{n:3,fps:0,f:p=>({lean:0.45-p*0.1,bt:-0.8,bk:0.3,ft:0.95,fk:0.6,hip:2,bu:-1.0,bl:0.4,fu:1.57,fl:0,wa:1.57,cloak:0.9})},
  charge:{n:2,fps:16,f:p=>({lean:-0.12,hip:1.5,bt:-0.4,bk:0.4,ft:0.5,fk:0.5,bu:-1.0,bl:0.6,fu:-2.7,fl:0.15,wa:3.3+(p<0.5?0.05:-0.05),cloak:0.25})},
  roll:{n:6,fps:0,f:p=>({hip:9,lean:0.9,head:0.4,bt:0.6,bk:2.3,ft:1.2,fk:2.4,bu:1.1,bl:1.4,fu:1.3,fl:1.4,wa:1.0,cloak:-0.2,rot:p*TAU,noWeapon:true})}
};
// ataques: 4 cuadros (preparación, transición, golpe, remate) por movimiento
const ATK={
  arc0:[{fu:-2.6,fl:0.2,wa:2.9,lean:-0.05},{fu:-1.4,fl:0.2,wa:1.9,lean:0.1},{fu:0.9,fl:0.1,wa:0.9,lean:0.28},{fu:0.6,fl:0.3,wa:0.4,lean:0.2}],
  arc1:[{fu:0.6,fl:0.3,wa:0.3,lean:0.15},{fu:-0.4,fl:0.2,wa:1.6,lean:0.1},{fu:-1.9,fl:0.1,wa:2.8,lean:-0.05},{fu:-1.5,fl:0.4,wa:2.6,lean:0}],
  thrust:[{fu:0.6,fl:1.2,wa:1.57,lean:-0.05},{fu:1.1,fl:0.6,wa:1.57,lean:0.15},{fu:1.57,fl:0,wa:1.57,lean:0.38},{fu:1.4,fl:0.2,wa:1.5,lean:0.25}],
  heavy:[{fu:-2.9,fl:0.15,wa:3.2,lean:-0.18,hip:1.5},{fu:-2.0,fl:0.1,wa:2.4,lean:0,hip:1},{fu:0.5,fl:0.05,wa:0.45,lean:0.42,hip:3},{fu:0.4,fl:0.1,wa:0.35,lean:0.35,hip:3}],
  spin:[{fu:1.57,fl:0,wa:1.57,lean:0.1},{fu:-1.57,fl:0,wa:-1.57+TAU,lean:0.1},{fu:3.1,fl:0,wa:3.1,lean:0.05},{fu:0.2,fl:0,wa:0.1,lean:0.1}]
};
function atkPose(name,i){ const k=ATK[name][i]; const lunge=i>=2; return Object.assign({bt:lunge?-0.6:-0.3,bk:lunge?0.3:0.2,ft:lunge?0.75:0.35,fk:lunge?0.5:0.3,bu:lunge?-0.9:0.3,bl:0.5,cloak:lunge?0.7:0.25},k); }

// ---- caché de cuadros ----
const RIG_CACHE={};
function rigFrame(key,st,pose,cw=96,chh=96){
  const k=key; if(RIG_CACHE[k]) return RIG_CACHE[k];
  const c=mkCanvas(cw,chh), x=c.getContext('2d'); x.translate(cw/2,chh-6);
  if(pose.rot){ x.translate(0,-10*(st.scale||1)); x.rotate(pose.rot); x.translate(0,10*(st.scale||1)); }
  drawRig(x,pose,st);
  const f=finishSprite(c); f.ox=cw/2; f.oy=chh-6; RIG_CACHE[k]=f; return f;
}
// estilo del jugador según la apariencia elegida en el creador
function playerStyle(look,wpn){
  const L2=look||defaultLook(), pal=lookPalette(L2);
  const hairS=['hood','short','long','braid','shaved'][L2.hair];
  const b=L2.body; return {skin:pal.f,hair:hairS,hairC:pal.h,eyes:pal.e,cloak:pal.C,hoodC:pal.O,armor:pal.M,pauldron:sh(pal.M,1.2),sleeve:sh(pal.C,0.8),tunic:sh(pal.C,0.45),pants:'#2a2430',boots:'#1b1522',
    chest:b===0?9.5:b===1?7.6:8.4, waist:b===0?7.6:b===1?5.4:6.6, hips:b===0?7.6:b===1?8.6:7.6, weapon:wpn||'hoz', lantern:true};
}
function playerFrame(anim,i){
  const st=playerStyle(P.look,P.wpn); const lk=JSON.stringify(P.look)+P.wpn;
  let pose;
  if(ATK[anim]) pose=atkPose(anim,i); else { const A=POSES[anim]; pose=A.f(A.n>1?i/A.n:0); if(anim==='jump') pose=A.f(i?0.75:0.25); }
  return rigFrame('P'+lk+anim+i,st,pose);
}
function lookFrame(look,anim,i,wpn='hoz'){ const st=playerStyle(look,wpn); const A=POSES[anim]; let pose=ATK[anim]?atkPose(anim,i):A.f(A.n>1?i/A.n:0); if(anim==='jump') pose=A.f(i?0.75:0.25); return rigFrame('L'+JSON.stringify(look)+wpn+anim+i,st,pose); }
function drawRigFrame(f,x,y,flip,flash,alpha=1){ // x,y = pies en coordenadas lógicas de pantalla
  const img=flash?f.flash:f.img; ctx.save(); ctx.globalAlpha*=alpha; ctx.translate(Math.round(x*2)/2,Math.round(y*2)/2); if(flip) ctx.scale(-1,1); ctx.drawImage(img,-f.ox/2,-f.oy/2,f.w/2,f.h/2); ctx.restore(); }

// ---- NPCs ----
const NPC_STYLE={
  ilvana:{skin:'#e8d4c0',hair:'nun',veil:'#1c1a24',robe:true,robeCol:'#26222e',cloak:'#26222e',sleeve:'#2c2834',weapon:'candle',eyes:'#8a7a6a',chest:7,waist:5.5,hips:8,belt:'#6a5a3a',eyeClosed:true},
  brom:{skin:'#c8986a',hair:'shaved',hairC:'#3a2a20',beardC:'#6a4a34',scale:1.1,chest:11,waist:10,hips:9,tunic:'#4a3a2a',armor:'#5a3a24',sleeve:'#7a5034',pants:'#3a3028',boots:'#2a2018',weapon:'hammer',eyes:'#3a2a20',gloves:'#4a3020'},
  sabela:{skin:'#d8b090',hair:'scarf',scarfC:'#7a3a2a',robe:true,robeCol:'#3a3040',cloak:'#5a4a34',sleeve:'#5a4a34',weapon:'staff',scale:0.95,chest:7.5,waist:6,hips:8.5,eyes:'#2a2020',belt:'#8a6a3a'},
  galvano:{skin:'#b8a090',hair:'helmet',helmC:'#5c5c66',armor:'#6a6a76',pauldron:'#7a7a86',sleeve:'#585862',pants:'#3a3a44',boots:'#2a2a32',cloak:'#4a2424',weapon:'mandoble',chest:10,waist:8.5,hips:8.5,eyes:'#ffd860',gloves:'#4a4a54'},
  tadeo:{skin:'#c8b8a8',hair:'hood',hoodC:'#4c4a52',cloak:'#3c3a42',sleeve:'#44424a',tunic:'#2c2a32',pants:'#2a2830',boots:'#1a181e',weapon:'feather',chest:7.5,waist:6,hips:7,eyes:'#9a9aa8'}
};
const NPC_POSE={
  ilvana:p=>({hip:Math.sin(p*TAU)*0.3,bu:0.5,bl:1.3,fu:0.45,fl:1.35,cloak:0.05,head:0.12}),
  brom:p=>({hip:Math.sin(p*TAU)*0.4,lean:0.06,bt:-0.15,ft:0.2,bu:0.3,bl:0.5,fu:0.2+Math.sin(p*TAU)*0.05,fl:0.6,wa:0.4}),
  sabela:p=>({hip:Math.sin(p*TAU)*0.3,lean:0.3,head:-0.2,bu:0.4,bl:0.6,fu:0.6,fl:0.3,wa:Math.PI-0.05,cloak:0.1}),
  galvano:p=>({hip:7,lean:-0.05+Math.sin(p*TAU)*0.02,head:0.35,bt:-0.1,bk:1.6,ft:1.0,fk:1.6,bu:0.4,bl:0.4,fu:0.75,fl:0.3,wa:0.05,cloak:0.05}),
  tadeo:p=>({hip:9+Math.sin(p*TAU)*0.2,lean:-0.18,head:0.55,bt:1.35,bk:0.2,ft:1.45,fk:0.4,bu:0.5,bl:1.0,fu:0.8,fl:1.0,wa:2.2,cloak:-0.1})
};
function npcFrame(id,i){ const st=NPC_STYLE[id]; return rigFrame('N'+id+i,st,NPC_POSE[id](i/4)); }

// ---- enemigos ----
const EN_STYLE={
  ahogado:{scale:0.82,skin:'#6e8070',hair:'long',hairC:'#1a2620',eyes:'#c8ff9a',tunic:'#26302c',cloak:'#22302a',sleeve:'#3a4a40',pants:'#28302c',boots:'#4a5a4a',belt:false,chest:8.5,waist:7,hips:7.5,arm:9.5,
    extra:(x,J,po,L)=>{ for(let i=0;i<3;i++){ const h=J.arms[i%2].hand; x.fillStyle='#8ab0a8'; x.fillRect(h.x-0.5+i,h.y+1+i*1.5,1,1.5); } }},
  campanero:{scale:1.06,hair:'bell',robe:true,robeCol:'#2a2430',cloak:'#3a2a3a',sleeve:'#3a2c3a',skin:'#8a7a70',eyes:'#ffd860',chest:10,waist:8.5,hips:10,belt:'#5a4020',gloves:'#5a4a40'},
  ordono:{scale:1.12,hair:'bell',robe:true,robeCol:'#3a1a22',cloak:'#6a1a24',sleeve:'#5a1a22',skin:'#8a7a70',eyes:'#ff7050',chest:10.5,waist:9,hips:10.5,belt:'#b88a3a',gloves:'#5a4a40',
    extra:(x,J)=>{ const c=J.headC; poly(x,[{x:c.x,y:c.y-8},{x:c.x-9,y:c.y-12},{x:c.x-10,y:c.y-6}],'#c02a3a'); }},
  abadesa:{scale:1.85,hair:'nun',veil:'#cfc6cc',robe:true,robeCol:'#b4aab8',cloak:'#9a90a4',sleeve:'#a49aae',skin:'#c8c0d0',gloves:'#d8d0e0',eyes:'#c9b8ff',chest:8,waist:5.5,hips:8.5,arm:10,belt:'#5a3a6a',
    extra:(x,J,po,L)=>{ const c=J.headC; for(let i=-2;i<=2;i++){ const bx=c.x+i*L(1.9)-L(0.6), by=c.y-L(6)-Math.abs(i)*-L(0.3)+Math.abs(i)*L(0.6);
        x.fillStyle='#e8e0d0'; x.fillRect(bx-L(0.5),by,L(1),L(2.8)); x.fillStyle=i%2?'#ffb040':'#ffd860'; x.beginPath(); x.ellipse(bx,by-L(0.9),L(0.5),L(0.9),0,0,TAU); x.fill(); }
      if(po.open){ ell(x,c.x+L(1.5),c.y+L(0.6),L(2.6),L(3.4),'#0c0614'); ell(x,c.x+L(1.8),c.y+L(0.4),L(1.1),L(1.6),'#c9b8ff'); ell(x,c.x+L(1.9),c.y+L(0.4),L(0.4),L(1.2),'#1a0a2a'); }
      else { ell(x,c.x+L(1.6),c.y+L(0.2),L(1.6),L(2.2),'#2a2030'); } }}
};
const EN_POSE={
  ahogado:{walk:p=>{ const s=Math.sin(p*TAU); return {lean:0.5,head:0.25,hip:Math.abs(s)*0.8,bt:-s*0.45,ft:s*0.45,bk:0.3,fk:0.3,bu:0.55+s*0.15,bl:0.25,fu:0.75-s*0.15,fl:0.3,cloak:0.2,wave:p}; },
    wind:p=>({lean:-0.12,head:-0.2,bt:-0.3,ft:0.35,bk:0.3,fk:0.3,bu:-2.3,bl:0.5,fu:-2.6+p*0.2,fl:0.4,cloak:0.1}),
    atk:p=>({lean:0.85,head:0.1,bt:-0.9,bk:0.4,ft:0.7,fk:0.6,bu:1.3,bl:0.1,fu:1.6,fl:0,cloak:0.8}),
    hurt:p=>({lean:-0.3,head:-0.3,bt:0.2,ft:0.4,bu:1.0,fu:-1.0,fl:0.5,cloak:0.3}),
    stagger:p=>({lean:0.95,head:0.7,hip:3,bt:-0.3,bk:0.9,ft:0.6,fk:1.0,bu:0.15,fu:0.1,cloak:0.1})},
  campanero:{walk:p=>{ const s=Math.sin(p*TAU); return {hip:Math.abs(s)*0.8,lean:0.08,bt:-s*0.3,ft:s*0.3,bu:0.3,bl:0.4,fu:0.35,fl:0.5,cloak:0.15+s*0.05}; },
    wind:p=>({lean:-0.15,bu:0.5,bl:0.5,fu:-2.5,fl:0.2,cloak:0.1}),
    atk:p=>({lean:0.3,hip:1.5,bu:-0.4,bl:0.5,fu:0.9,fl:0.1,cloak:0.4}),
    hurt:p=>({lean:-0.25,bu:0.8,fu:-0.6,cloak:0.3}),
    stagger:p=>({lean:0.6,head:0.5,hip:4,bu:0.1,fu:0.15,cloak:0.1})},
  abadesa:{dormant:p=>({hip:13,lean:0.25,head:0.7,bu:0.6,bl:1.5,fu:0.55,fl:1.5,cloak:0.05}),
    idle:p=>{ const s=Math.sin(p*TAU); return {hip:s*0.6,lean:0.05,head:0.1,bu:0.25+s*0.05,bl:0.4,fu:0.4-s*0.05,fl:0.5,cloak:0.15+s*0.05}; },
    sweepWind:p=>({lean:-0.2,bu:0.5,bl:0.4,fu:-2.7,fl:-0.4,cloak:0.1}),
    sweep:p=>({lean:0.32,hip:2,bu:-0.6,bl:0.3,fu:1.35,fl:0.1,cloak:0.6}),
    chargeWind:p=>({lean:0.5,hip:4,head:-0.2,bu:-1.2,bl:0.4,fu:-1.0,fl:0.4,cloak:0.4}),
    charge:p=>({lean:0.7,hip:3,bu:-1.5,bl:0.3,fu:-1.3,fl:0.3,cloak:1.3}),
    leap:p=>({lean:0.1,hip:-2,bu:-2.0,bl:0.5,fu:-2.2,fl:0.5,cloak:-0.5}),
    orbWind:p=>({lean:-0.12,head:-0.35,bu:-2.8,bl:0.3,fu:-2.9,fl:0.2,cloak:0.2}),
    stagger:p=>({hip:10,lean:0.6,head:0.6,bu:0.2,fu:0.3,cloak:0.1}),
    dying:p=>({hip:12,lean:0.4,head:0.8,bu:0.3,bl:1.2,fu:0.2,fl:1.2,cloak:0})}
};
function enemyFrame(type,anim,i,n,styleId,open){ const st=EN_STYLE[styleId||type]; const big=type==='abadesa'; const f=EN_POSE[type][anim]||EN_POSE[type].walk||EN_POSE[type].idle; const pose=f(n>1?i/n:0); if(open) pose.open=true;
  return rigFrame('E'+(styleId||type)+anim+i+(open?'o':''),st,pose,big?168:96,big?160:96); }
// polilla: pintada aparte (alas en batida)
function mothFrame(i,dive){ const k='M'+i+(dive?'d':''); if(RIG_CACHE[k]) return RIG_CACHE[k];
  const c=mkCanvas(48,40), x=c.getContext('2d'); x.translate(24,22); const fl=[1,0.55,-0.1,0.55][i], tilt=dive?0.6:0;
  x.rotate(tilt);
  for(const [sy,col,col2] of [[-1,'#5a5068','#8a7a9a'],[1,'#3a3448','#6a5a7a']]){
    x.save(); x.scale(1,sy*fl||0.08);
    poly(x,[{x:-2,y:0},{x:-18,y:-15},{x:-6,y:-18},{x:6,y:-13},{x:4,y:-2}],col); poly(x,[{x:-3,y:-1},{x:-14,y:-12},{x:-6,y:-14},{x:3,y:-9}],col2);
    ell(x,-8,-10,2.6,2.6,'#1a1424'); ell(x,-8,-10,1.4,1.4,sy<0?'#d8b0ff':'#ffd860'); x.restore(); }
  ell(x,0,0,6,3.2,'#2a2230',0.1); ell(x,-1,-0.6,4.8,2,'#4a3e52',0.1); for(let j=-3;j<=2;j++) seg(x,{x:j*1.6,y:-3},{x:j*1.6,y:3},0.6,'#1a1420');
  circ(x,{x:6.5,y:-0.5},2.6,'#2a2230'); x.fillStyle='#ff5040'; x.fillRect(7,-1.5,1.5,1.5); seg(x,{x:7,y:-2},{x:11,y:-7},0.7,'#6a5a7a'); seg(x,{x:7.5,y:-2},{x:13,y:-5},0.7,'#6a5a7a');
  const f=finishSprite(c); f.ox=24; f.oy=22; RIG_CACHE[k]=f; return f; }
