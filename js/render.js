// CODE FENIX — render del mundo (fondos, tiles, entidades, luz).
'use strict';
let CX=0, CY=0;
function px(x,y,c,w=1,h=1){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
function addLight(x,y,r,warm){ lights.push({x,y,r,warm}); }
function buildTiles(){
  const w=room.w*8,h=room.h*8,c=mkCanvas(w,h),x=c.getContext('2d'),img=x.createImageData(w,h),d=img.data;
  const [br,bgc,bb]=room.def.stone;
  const sol=(tx,ty)=>tileAt(tx,ty)==='#';
  const px=(X,Y,r,g,b)=>{ const i=(Y*w+X)*4; d[i]=clamp(r,0,255); d[i+1]=clamp(g,0,255); d[i+2]=clamp(b,0,255); d[i+3]=255; };
  const shadeT=[1,1,0.7,0.48,0.32];
  for(let ty=0;ty<room.h;ty++) for(let tx=0;tx<room.w;tx++){
    const t=room.g[ty][tx];
    if(t==='#'){
      let dist=4;
      outer: for(let k=1;k<=3;k++){ for(let dy=-k;dy<=k;dy++) for(let dx=-k;dx<=k;dx++){ if(!sol(tx+dx,ty+dy)){ dist=k; break outer; } } }
      const sh=shadeT[dist];
      const aU=!sol(tx,ty-1), aD=!sol(tx,ty+1), aL=!sol(tx-1,ty), aR=!sol(tx+1,ty);
      for(let j=0;j<8;j++) for(let i=0;i<8;i++){
        const gx=tx*8+i, gy=ty*8+j, row=gy>>2, bx=gx+((row&1)?4:0);
        const mort=(gy&3)===3||(bx&7)===7;
        let f=mort?0.55:(0.82+hash2(bx>>3,row,1)*0.3+(hash2(gx,gy,2)-0.5)*0.12);
        f*=sh;
        if(aU){ if(j===0) f=mort?0.95:1.5; else if(j===1) f*=1.2; }
        if(aD&&j===7) f*=0.45; if(aL&&i===0) f*=0.7; if(aR&&i===7) f*=0.7;
        let r=br*f,g=bgc*f,b=bb*f;
        if(aU&&j===0&&hash2(gx,gy,5)<0.22){ r=46;g=62;b=44; }
        if(aD&&j===7&&hash2(gx,gy,6)<0.1){ r=70;g=60;b=40; }
        px(gx,gy,r,g,b);
      }
    } else if(t==='='){
      for(let i=0;i<8;i++){ const gx=tx*8+i, gy=ty*8, n=hash2(gx,gy,3)*14;
        px(gx,gy,124+n,90+n,60); px(gx,gy+1,88+n,60,40); px(gx,gy+2,48,32,26);
        if(i===1||i===6) px(gx,gy+1,150,146,160);
      }
      if(tileAt(tx-1,ty)!=='=') for(let j=3;j<6;j++) px(tx*8+1,ty*8+j,40,34,46);
      if(tileAt(tx+1,ty)!=='=') for(let j=3;j<6;j++) px(tx*8+6,ty*8+j,40,34,46);
    } else if(t==='^'){
      const hs=[2,5,7,3];
      for(let i=0;i<8;i++){ const hh=hs[i%4]; for(let j=8-hh;j<8;j++){ const top=j===8-hh; const lft=(i%4)<2; px(tx*8+i,ty*8+j, top?200:lft?150:92, top?196:lft?150:90, top?210:lft?168:106); } }
    }
  }
  x.putImageData(img,0,0); room.tileCanvas=c;
}

function emptyT(tx,ty){ const t=tileAt(tx,ty); return !isSolid(t)&&t!=='='&&t!=='^'; }

function buildDecor(){
  decor=[];
  const near=(x)=>altars.some(a=>Math.abs(a.x-x)<20)||signs.some(s=>Math.abs(s.x-x)<10)||npcs.some(n=>Math.abs(n.x-x)<14)||props.some(p=>Math.abs(p.x-x)<26);
  for(let ty=1;ty<room.h;ty++) for(let tx=0;tx<room.w;tx++){
    if(room.g[ty][tx]!=='#') continue;
    if(emptyT(tx,ty-1)&&emptyT(tx,ty-2)&&!near(tx*8+4)){
      const r=hash2(tx,ty,7);
      if(r<0.07) decor.push({t:'candle',x:tx*8+3,y:ty*8,n:1+Math.floor(hash2(tx,ty,8)*3)});
      else if(r<0.11) decor.push({t:'bones',x:tx*8+1,y:ty*8});
      else if(r<0.15&&room.def.bg==='exterior') decor.push({t:'grave',x:tx*8+2,y:ty*8});
    }
    if(ty<room.h-2&&emptyT(tx,ty+1)&&emptyT(tx,ty+2)&&room.def.bg==='interior'&&hash2(tx,ty,9)<0.08)
      decor.push({t:'chain',x:tx*8+4,y:(ty+1)*8,len:14+Math.floor(hash2(tx,ty,10)*40)});
  }
}

function drawLayers(L,camX,camY,maxCamY){
  ctx.fillStyle=L.sky; ctx.fillRect(0,0,W,H);
  for(const l of L.layers){
    const iw=l.img.width; let ox=-Math.floor(camX*l.p)%iw; if(ox>0) ox-=iw;
    const oy=Math.round((maxCamY-camY)*l.py);
    for(let x=ox;x<W;x+=iw) ctx.drawImage(l.img,x,oy);
  }
}

function drawDecor(){
  for(const d of decor){
    const x=Math.round(d.x-CX), y=Math.round(d.y-CY);
    if(x<-60||x>W+20||y<-80||y>H+20) continue;
    if(d.t==='candle'){
      for(let k=0;k<d.n;k++){ const cx=x+k*3-2, hh=3+((k*7+d.x)%3); px(cx,y-hh,'#d8cbb0',2,hh); px(cx,y-hh,'#f0e6d0',1,1);
        const fl=Math.sin(time*13+d.x+k*2)>0; px(cx+(fl?0:1),y-hh-2,'#ffcf5a',1,2); px(cx,y-hh-1,'#ff8a2a',1,1);
        if(k===0) addLight(d.x+1,d.y-hh-2,18+Math.sin(time*9+d.x)*2,true); }
    } else if(d.t==='bones'){
      px(x,y-3,'#b8ad98',3,2); px(x,y-3,'#0a0810',1,1); px(x+2,y-3,'#0a0810',1,1); px(x+3,y-1,'#9a9080',4,1); px(x+3,y-2,'#9a9080',1,1); px(x+6,y-2,'#9a9080',1,1);
    } else if(d.t==='grave'){
      px(x+1,y-7,'#2c2636',2,7); px(x-1,y-5,'#2c2636',6,2); px(x+1,y-7,'#3c3446',1,5);
    } else if(d.t==='chain'){
      for(let k=0;k<d.len;k+=2){ const sw=Math.round(Math.sin(time*1.3+d.x*0.1)*(k/d.len)*2); px(x+sw,y+k,k%4===0?'#4a4658':'#2e2b3a',1,2); }
      const sw=Math.round(Math.sin(time*1.3+d.x*0.1)*2); px(x+sw-1,y+d.len,'#5a5668',3,1); px(x+sw-1,y+d.len+1,'#5a5668',1,2);
    }
  }
}

function enemyAnim(e){
  const st=e.state;
  if(e.type==='abadesa'){ const m={dormant:'dormant',intro:'dormant',sweepWind:'sweepWind',sweep:'sweep',chargeWind:'chargeWind',charge:'charge',leap:'leap',orbWind:'orbWind',stagger:'stagger',dying:'dying'}; return [m[st]||'idle',4]; }
  if(st==='stagger') return ['stagger',1];
  if(st==='wind') return ['wind',2];
  if(st==='lunge'||st==='strike') return ['atk',1];
  if(e.flash>0.05&&st!=='recover') return ['hurt',1];
  return ['walk',6];
}
function drawEnemy(e){
  const x=Math.round(e.x-CX), y=Math.round(e.y-CY), fl=e.flash>0, flip=e.face<0;
  if(x<-80||x>W+80||y<-100||y>H+60) return;
  const windFl=e.state==='wind'&&Math.floor(time*20)%2===0;
  if(e.type==='polilla'){ const fr=Math.floor(e.anim*(e.state==='dive'?20:10))%4; drawRigFrame(mothFrame(fr,e.state==='dive'),e.x+e.w/2-CX,e.y+e.h/2-CY,flip,fl||windFl); addLight(e.x+e.w/2,e.y+4,12,false); return; }
  const [an,n]=enemyAnim(e); const moving=Math.abs(e.vx)>5;
  const i=an==='walk'?(moving?Math.floor(e.anim*(e.type==='ahogado'?7:5))%6:0):an==='wind'?Math.floor(e.t*8)%2:an==='idle'?Math.floor(time*3)%4:0;
  const fx=e.x+e.w/2-CX, fy=e.y+e.h-CY+1;
  if(e.type==='ahogado'){ const shk=e.state==='wind'?(Math.random()<0.5?-0.5:0.5):0; drawRigFrame(enemyFrame('ahogado',an,i,n),fx+shk,fy,flip,fl||windFl);
    if(Math.random()<0.03) part(e.x+rnd(0,e.w),e.y+rnd(2,8),0,10,0.6,'#6a9a90',{g:200}); return; }
  if(e.type==='campanero'){
    const big=e.named==='ordono'; const sx=x-1;
    const hx=fx+(flip?-5:5), hy=fy-17; let mx,my;
    if(e.state==='wind'){ const k=Math.min(1,e.t/0.4); mx=hx-(flip?-1:1)*4*k; my=hy-12-8*k; }
    else if(e.state==='strike'||e.state==='recover'){ mx=hx+(flip?-1:1)*16; my=y+e.h-3; }
    else { mx=hx+(flip?-1:1)*3; my=hy+7+Math.sin(e.anim*3); }
    drawRigFrame(enemyFrame('campanero',an,i,n,big?'ordono':null),fx,fy,flip,fl||windFl);
    hiOn(); const H2=(v)=>v*2; ctx.fillStyle='#2e2a24'; const nn=16; for(let k=0;k<=nn;k++) ctx.fillRect(Math.round(H2(hx+(mx-hx)*k/nn)),Math.round(H2(hy+(my-hy)*k/nn)),1,1);
    const cx2=H2(mx), cy2=H2(my); ctx.fillStyle='#07060b'; ctx.fillRect(cx2-5,cy2-5,11,11); ctx.fillStyle=fl?'#fff':'#8a6a30'; ctx.fillRect(cx2-4,cy2-4,9,9); ctx.fillStyle=fl?'#fff':'#c89a44'; ctx.fillRect(cx2-3,cy2-3,4,3);
    ctx.fillStyle='#3a2a14'; ctx.fillRect(cx2-4,cy2+3,9,2); if(e.state!=='idle'){ ctx.fillStyle='#ffb040'; ctx.fillRect(cx2-1,cy2,2,2); } hiOff();
    if(e.state!=='idle') addLight(mx,my,12,true); return; }
  if(e.type==='abadesa'){ const open=e.ph2; let a=1; if(e.state==='dying') a=Math.max(0,1-e.t/2.4);
    const fr=enemyFrame('abadesa',an,an==='idle'?Math.floor(time*3)%4:0,4,null,open);
    const fly=e.state==='intro'?Math.min(1,e.t/1.2):1; const f2=e.state==='intro'&&fly<1?enemyFrame('abadesa','dormant',0,4,null,open):fr;
    drawRigFrame(f2,fx,fy,flip,fl,a); addLight(fx+CX,e.y+4,40,false); return; }
}
function drawAbadesa(e,x,y,fl){
  const f=e.face, W2=e.w;
  const robe=fl?'#ffffff':'#cfc6b8', fold=fl?'#ffffff':'#958c80', dk='#07060b';
  let bob=Math.round(Math.sin(e.anim*2)*1);
  if(e.state==='dying'){ ctx.globalAlpha=Math.max(0,1-e.t/2.4); x+=Math.round(rnd(-1,1)); }
  if(e.state==='dormant') bob=0;
  // halo
  if(e.ph2||e.state==='orbWind'){ const hx=x+W2/2, hy=y+4; for(let a=0;a<Math.PI*2;a+=0.12){ px(hx+Math.cos(a+time)*13,hy+Math.sin(a+time)*13,'#7a5ac0'); } }
  // túnica
  for(let r=0;r<26;r++){ const ww=12+Math.floor(r*0.6), rx=x+Math.floor(W2/2-ww/2), ry=y+10+r+bob;
    px(rx-1,ry,dk,ww+2,1); px(rx,ry,robe,ww,1); for(let k=2;k<ww;k+=4) px(rx+k,ry,fold,1,1); }
  px(x-6,y+36,dk,W2+12,1);
  // brazos
  const sh={x:x+W2/2+f*5,y:y+13+bob}; let hand;
  if(e.state==='sweepWind'||e.state==='orbWind') hand={x:sh.x-f*4,y:sh.y-14};
  else if(e.state==='sweep') hand={x:sh.x+f*22,y:sh.y+6};
  else if(e.state==='chargeWind'||e.state==='charge') hand={x:sh.x+f*14,y:sh.y-2};
  else hand={x:sh.x+f*3,y:sh.y+14};
  ctx.fillStyle=fl?'#fff':'#b0a898'; const n=14; for(let i=0;i<=n;i++){ ctx.fillRect(Math.round(sh.x+(hand.x-sh.x)*i/n),Math.round(sh.y+(hand.y-sh.y)*i/n),2,1); }
  px(hand.x-1,hand.y,'#e8e0d0',1,3); px(hand.x+1,hand.y,'#e8e0d0',1,3); px(hand.x+f*2,hand.y+1,'#e8e0d0',1,3);
  const sh2={x:x+W2/2-f*5,y:y+13+bob}; ctx.fillStyle=fl?'#fff':'#8a8278'; for(let i=0;i<=10;i++) ctx.fillRect(Math.round(sh2.x-f*i*0.3),Math.round(sh2.y+i),2,1);
  // cabeza
  const hx=x+W2/2-5, hy=y+bob;
  px(hx-1,hy,dk,12,12); px(hx,hy+1,robe,10,10); px(hx+1,hy,robe,8,1);
  if(!e.ph2){ px(hx+2,hy+3,'#05030a',6,7); px(hx+3,hy+2,'#05030a',4,1); px(hx+3,hy+5,'#c02040',1,1); px(hx+6,hy+5,'#c02040',1,1); }
  else { px(hx+2,hy+2,'#1a0626',6,8); px(hx+3,hy+4,'#9a2a5a',4,4); px(hx+4,hy+3,'#9a2a5a',2,6); px(hx+4,hy+5,'#ffd860',2,2); px(hx+4,hy+5,'#05030a',1,2); }
  // corona de velas
  for(let i=0;i<5;i++){ const cxx=hx-1+i*2.5|0, ch=2+(i%2)*2; px(cxx,hy-ch,'#e8dcc0',1,ch); const ff=Math.sin(time*12+i)>0; px(cxx,hy-ch-2,ff?'#ffe080':'#ff9a3a',1,2); }
  addLight(x+W2/2,y-2,e.ph2?50:40,!e.ph2);
  ctx.globalAlpha=1;
  if(e.state==='sweepWind'||e.state==='chargeWind'){ if(Math.floor(time*16)%2===0) px(hx+4,hy-8,'#fff',2,2); }
}

function drawLighting(){
  dctx.globalCompositeOperation='source-over'; dctx.clearRect(0,0,W,H);
  dctx.fillStyle=`rgba(4,2,10,${room.def.dark})`; dctx.fillRect(0,0,W,H);
  dctx.globalCompositeOperation='destination-out';
  for(const l of lights){ const x=l.x-CX, y=l.y-CY; if(x<-l.r||x>W+l.r||y<-l.r||y>H+l.r) continue;
    const g=dctx.createRadialGradient(x,y,0,x,y,l.r); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(0.5,'rgba(0,0,0,0.6)'); g.addColorStop(1,'rgba(0,0,0,0)');
    dctx.fillStyle=g; dctx.fillRect(x-l.r,y-l.r,l.r*2,l.r*2); }
  ctx.drawImage(dark,0,0);
  ctx.globalCompositeOperation='lighter';
  for(const l of lights){ const x=l.x-CX, y=l.y-CY, r=l.r*0.6; if(x<-r||x>W+r||y<-r||y>H+r) continue;
    const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,l.warm?'rgba(90,50,10,0.22)':'rgba(60,40,110,0.22)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2); }
  ctx.globalCompositeOperation='source-over';
  // viñeta
  const v=ctx.createRadialGradient(W/2,H/2,H*0.45,W/2,H/2,H); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.55)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
}

function panel(x,y,w,h){ px(x,y,'#07060b',w,h); ctx.fillStyle='rgba(20,12,28,0.92)'; ctx.fillRect(x+1,y+1,w-2,h-2); px(x+1,y+1,'#5a3a4a',w-2,1); px(x+1,y+h-2,'#2a1a2a',w-2,1); px(x,y,'#8a6a40',2,2); px(x+w-2,y,'#8a6a40',2,2); px(x,y+h-2,'#8a6a40',2,2); px(x+w-2,y+h-2,'#8a6a40',2,2); }

function drawPyre(a){
  const x=Math.round(a.x-CX), y=Math.round(a.y-CY); const lit=litAltars.has(a.id);
  px(x-9,y-3,'#2e2836',18,3); px(x-7,y-5,'#3c3446',14,2); px(x-9,y-3,'#4a4258',18,1);
  px(x-6,y-9,'#1a1418',12,4); px(x-7,y-10,'#4a3a30',14,1); px(x-5,y-6,'#2a2024',10,1);
  const n=lit?11:6;
  for(let i=0;i<n;i++){ const fx=x-5+i, ph=Math.sin(time*9+i*1.7)+Math.sin(time*5.3+i);
    const hh=Math.max(1,Math.round((lit?9:4)*(1-Math.abs(i-(n-1)/2)/(n/1.6))+ph*1.5));
    for(let j=0;j<hh;j++){ const k=j/hh; px(fx,y-11-j,k<0.35?'#fff0b0':k<0.7?'#ffb040':'#e0502a'); } }
  if(lit){ const wf=Math.sin(time*3)*2; for(let i=0;i<6;i++){ px(x-6-i,y-16-Math.round(i*0.7+wf*(i/6)),'#ff8a2a'); px(x+5+i,y-16-Math.round(i*0.7+wf*(i/6)),'#ff8a2a'); } }
  addLight(a.x,a.y-14,lit?64+Math.sin(time*7)*4:34,true);
  if(P.state==='normal'&&nearAltar()===a) drawText(ctx,'E: DESCANSAR',x,y-32,'#ffd860',1,'center','#000');
}
function drawProp(pr){
  const x=Math.round(pr.x-CX), y=Math.round(pr.y-CY);
  if(pr.t==='forge'){
    px(x-10,y-18,'#2a2228',16,18); px(x-10,y-18,'#3a3038',16,1); px(x-7,y-10,'#140808',10,7);
    const f=Math.sin(time*8)>0; px(x-6,y-8,f?'#ff8a2a':'#e0502a',8,4); px(x-5,y-7,'#ffd860',6,2);
    px(x-8,y-24,'#2a2228',4,6);
    px(x+8,y-6,'#3a3a46',10,2); px(x+10,y-4,'#2a2a34',6,4); px(x+7,y-7,'#6a6a7a',12,1);
    addLight(pr.x-2,pr.y-8,46+Math.sin(time*6)*4,true);
  } else if(pr.t==='stall'){
    px(x-2,y-14,'#3a2a1a',1,14); px(x+16,y-14,'#3a2a1a',1,14); px(x-3,y-16,'#6a2a3a',21,3); for(let i=0;i<21;i+=3) px(x-3+i,y-13,'#4a1a2a',2,1);
    px(x,y-6,'#4a3420',16,6); px(x,y-6,'#6a4a2a',16,1); px(x+2,y-8,'#8a6a40',3,2); px(x+7,y-9,'#5a7a5a',2,3); px(x+11,y-8,'#7a5ac0',3,2);
    const f=Math.sin(time*10)>0; px(x+8,y-21,'#3a3040',2,1); px(x+8,y-20,f?'#ffd860':'#ffb040',2,2); addLight(pr.x+9,pr.y-19,30,true);
  }
}
function drawNpc(n){
  const d=NPCS[n.id]; const f=npcFrame(n.id,Math.floor(time*2.2+n.x)%4); const face=P.x>n.x?1:-1;
  drawRigFrame(f,n.x-CX,n.y-CY+1,face<0,false); const x=Math.round(n.x-CX), y=Math.round(n.y-CY-24);
  if(n.id==='ilvana') addLight(n.x,n.y-8,24,true);
  if(n.id==='tadeo') addLight(n.x,n.y-4,18,true);
  const near=nearNpc()===n;
  const hasNew=(n.id==='ilvana'&&q.tadeo===2)||(n.id==='galvano'&&q.galvano===1&&q.ordonoDead)||(!q[n.id+'Met']&&n.id!=='galvano'&&n.id!=='tadeo'&&n.id!=='ilvana')||(n.id==='ilvana'&&!q.ilvanaMet);
  if(hasNew&&!near&&!ui&&Math.floor(time*2)%2===0) drawText(ctx,'!',n.x-CX,y-8,'#ffd860',1,'center','#000');
  if(near&&P.state==='normal'&&!ui){ drawText(ctx,d.name,n.x-CX,y-16,'#d8c8b8',1,'center','#000'); drawText(ctx,keysOf('interact')+': HABLAR',n.x-CX,y-8,'#ffd860',1,'center','#000'); }
}
function drawPickup(k){
  const x=Math.round(k.x-CX), y=Math.round(k.y-CY+Math.sin(time*3)*2);
  addLight(k.x,k.y,26,!!k.weapon);
  if(Math.random()<0.15) part(k.x+rnd(-5,5),k.y+rnd(-5,5),0,-15,0.6,k.weapon?'#ffd860':'#c9b8ff',{glow:1});
  const fl=Math.sin(time*6)>0.8;
  if(k.id==='llave') drawSprite(ctx,SPR.key,x-4,y-3,false,fl);
  else if(k.id==='alas') drawSprite(ctx,SPR.wing,x-4,y-4,false,fl);
  else if(k.weapon){ for(let i=0;i<12;i++) px(x-6+i,y+3-Math.round(i*0.6),fl?'#fff':i<3?'#6a4a2a':'#d8d8e8'); px(x-4,y,'#c9a24a',3,3); }
  else { const c=k.id==='impulso'?'#ff9a3a':k.id==='brasaMayor'?'#ff5a2a':'#e08a3a'; px(x-2,y-3,'#2a1a10',5,7); px(x-3,y-2,'#2a1a10',7,5); px(x-2,y-2,c,5,5); px(x-1,y-3,c,3,7); px(x-1,y-1,'#fff0b0',2,2); }
}
function drawWaxDrop(){
  if(!waxDrop||waxDrop.room!==roomId) return;
  const x=Math.round(waxDrop.x-CX), y=Math.round(waxDrop.y-CY), pl=Math.sin(time*4);
  px(x-3,y-3,'#a07020',6,3); px(x-2,y-5,'#d8a040',4,2); px(x-1,y-7-(pl>0?1:0),'#ffe080',2,2); px(x-1,y-4,'#fff0b0',1,1);
  addLight(waxDrop.x,waxDrop.y-4,22+pl*3,true);
  if(Math.random()<0.1) part(waxDrop.x+rnd(-3,3),waxDrop.y-4,0,-20,0.8,'#ffd860',{glow:1});
}
function drawSlash(){
  const p=P, a=p.atk, w=curWeapon(); const prog=clamp((p.t-a.hs*0.5)/(a.he-a.hs*0.5),0,1);
  const cx=pcx()-CX+p.face*4, cy=pcy()-CY-1;
  if(a.spin){ const ang=p.t*22; for(let i=0;i<24;i++){ const t=ang-i*0.12; const r=a.reach-2; px(pcx()-CX+Math.cos(t)*r,cy+Math.sin(t)*r*0.6,i<4?'#fff4e0':i<12?'#ffb050':'#7a4a2a'); } addLight(pcx(),pcy(),40,true); return; }
  if(w.style==='thrust'||a.dash){ if(p.t<a.hs||p.t>a.he+0.04) return; const L2=a.reach; const x0=p.face>0?P.x+P.w-CX:P.x-CX; for(let i=0;i<L2;i++){ px(x0+p.face*i,cy+(i%7===0?0:0),i>L2-4?'#ffffff':'#c8c0e0'); }
    px(x0+p.face*(L2-1),cy-1,'#fff',1,3); addLight(pcx()+p.face*16,pcy(),20,true); return; }
  if(p.t>a.he+0.05) return;
  const heavy=w.style==='heavy'||p.kind==='heavy';
  const [a0,a1]=a.arc||[-1.9,1.0], [r0,r1]=a.r||[9,15];
  const aEnd=a0+(a1-a0)*prog, aStart=a0+(a1-a0)*Math.max(0,prog-0.55);
  const n=22;
  for(let i=0;i<=n;i++){ const ang=aStart+(aEnd-aStart)*i/n; for(let r=r0;r<=r1;r++){
    const edge=r>=r1-1; if(!edge&&i<n*0.3) continue;
    const col=edge?(heavy?'#ffe0b0':'#fff4e0'):(r>r0+2?(heavy?'#e0602a':'#d0b070'):(heavy?'#7a2a1a':'#7a5a2a'));
    px(cx+Math.cos(ang)*r*p.face, cy+Math.sin(ang)*r, col); } }
  addLight(pcx()+p.face*12,pcy(),heavy?34:24,true);
}
function playerAnim(){
  const p=P, w=curWeapon?curWeapon():null;
  switch(p.state){
    case 'roll': return ['roll',Math.min(5,Math.floor(p.t/0.055))%6];
    case 'dead': return ['dead',Math.min(5,Math.floor(p.t/0.16))];
    case 'heal': return ['heal',Math.floor(time*3)%2];
    case 'cast': return ['cast',p.t<0.15?0:1];
    case 'dash': return ['dash',0];
    case 'hurt': return ['hurt',p.t<0.1?0:1];
    case 'shoot': return ['shoot',p.t<0.08?1:0];
    case 'parry': return ['parry',0];
    case 'crit': return ['crit',Math.min(2,Math.floor(p.t/0.15))];
    case 'charge': return ['charge',Math.floor(time*16)%2];
    case 'attack': { const a=p.atk; const i=p.t<a.hs?(p.t<a.hs*0.5?0:1):p.t<a.he?2:3;
      let m=a.spin?'spin':(w&&w.style==='thrust')||a.dash?'thrust':(p.kind==='heavy'||p.kind==='art'||(w&&w.style==='heavy'))?'heavy':(p.combo%2?'arc1':'arc0');
      if(m==='spin') return ['spin',Math.floor(p.t*14)%4]; return [m,i]; }
  }
  if(!p.onGround) return ['jump',p.vy<0?0:1];
  if(Math.abs(p.vx)>12) return ['run',Math.floor(time*14)%8];
  return ['idle',Math.floor(time*6)%6];
}
function drawPlayer(){
  const p=P; const flip=p.face<0;
  addLight(pcx()+p.face*5,pcy()+2,p.state==='dead'?20:62,true);
  const blink=p.inv>0&&p.state!=='hurt'&&p.state!=='dead'&&p.state!=='crit'&&Math.floor(time*16)%2===0;
  let alpha=blink?0.35:1; if(p.state==='dead') alpha=Math.max(0,1-(p.t-1.5)/1.5);
  const [an,i]=playerAnim(); const f=playerFrame(an,i);
  const flash=(p.state==='charge'&&p.t>0.7&&Math.floor(time*20)%2===0)||(p.state==='hurt'&&p.t<0.08);
  drawRigFrame(f,pcx()-CX,p.y+p.h-CY+1,flip,flash,alpha);
  if(p.state==='heal'){ addLight(pcx(),p.y,40,true); if(Math.random()<0.4) part(pcx()+rnd(-4,4),p.y-6,0,-25,0.6,'#ffd860',{glow:1}); }
  if(p.state==='shoot'&&p.t<0.06){ hiOn(); ctx.fillStyle='#fff0a0'; ctx.fillRect(Math.round((pcx()-CX+p.face*13)*2)-3,Math.round((pcy()-CY-1)*2)-3,6,6); hiOff(); addLight(pcx()+p.face*12,pcy(),20,true); }
  if(p.state==='parry'){ const on=p.t<parryWin(); if(on){ hiOn(); ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc((pcx()-CX+p.face*6)*2,(pcy()-CY)*2,14,p.face>0?-1.2:Math.PI-1.2+0.4,p.face>0?1.2:Math.PI+1.2+0.4); ctx.stroke(); hiOff(); addLight(pcx()+p.face*7,pcy(),20,false); } }
  if(p.state==='attack') drawSlash();
  if(p.state==='crit'){ const e=p.critT; if(e&&p.t>0.15&&p.t<0.35){ for(let k=0;k<18;k++) px(pcx()-CX+p.face*(k+2),pcy()-CY-6+k,'#ff5a3a'); } }
}
function drawEnemyFull(e){
  if(e.state==='stagger'){
    const x=Math.round(e.x-CX), y=Math.round(e.y-CY);
    drawEnemy(e); if(Math.floor(time*6)%2===0){ px(x+e.w/2-1,y-6,'#ffd860',3,1); px(x+e.w/2,y-7,'#ffd860',1,3); }
    const box={x:P.face>0?P.x:P.x-22,y:P.y-6,w:P.w+22,h:P.h+12};
    if(overlap(box,e)&&P.state==='normal') drawText(ctx,'J: CRÍTICO',x+e.w/2,y-16,'#ff7a5a',1,'center','#000');
    return;
  }
  drawEnemy(e);
}
function drawProjs(){
  for(const p of projs){
    const x=Math.round(p.x-CX), y=Math.round(p.y-CY);
    if(p.type==='orb'){ px(x-3,y-2,'#2a1a4a',6,4); px(x-2,y-3,'#2a1a4a',4,6); px(x-2,y-2,'#7a5ac0',4,4); px(x-1,y-1,'#e0d0ff',2,2); addLight(p.x,p.y,16,false); }
    else if(p.type==='wave'){ const h=p.h+Math.round(Math.sin(time*30)*2); px(x-2,y-h/2,'#6a4aa0',4,h); px(x-1,y-h/2+2,'#e0d0ff',2,h-2); addLight(p.x,p.y,18,false); }
    else if(p.type==='bullet'){ px(x-2,y-1,'#ffb040',4,2); px(x,y-1,'#fff4c0',2,2); addLight(p.x,p.y,10,true); }
    else if(p.type==='fire'){ px(x-3,y-2,'#e0502a',6,5); px(x-2,y-3,'#ffb040',4,6); px(x-1,y-1,'#fff0b0',2,2); addLight(p.x,p.y,24,true); }
    else if(p.type==='pillar'){ const h=16+Math.round(Math.sin(time*40)*3); px(x-3,y+8-h,'#e0502a',6,h); px(x-2,y+10-h,'#ffb040',4,h-4); px(x-1,y+12-h,'#fff0b0',2,h-8); addLight(p.x,p.y,26,true); }
  }
}
function drawParticles(){
  for(const p of parts){ const a=clamp(p.life/p.max,0,1); ctx.globalAlpha=p.glow?a:Math.min(1,a*1.5); px(p.x-CX,p.y-CY,p.color,p.size,p.size); }
  ctx.globalAlpha=1;
}
function renderWorld(){
  lights=[];
  const sx=shake>0?Math.round(rnd(-1,1)*shake):0, sy=shake>0?Math.round(rnd(-1,1)*shake):0;
  CX=Math.round(cam.x)+sx; CY=Math.round(cam.y)+sy;
  drawLayers(bgL,CX,CY,Math.max(0,room.h*8-H));
  drawDecor();
  ctx.drawImage(room.tileCanvas,-CX,-CY,room.w*8,room.h*8);
  drawDecals();
  for(let ty=Math.max(0,Math.floor(CY/8));ty<=Math.min(room.h-1,Math.floor((CY+H)/8));ty++) for(let tx=Math.max(0,Math.floor(CX/8));tx<=Math.min(room.w-1,Math.floor((CX+W)/8));tx++){
    const t=room.g[ty][tx]; const x=tx*8-CX, y=ty*8-CY;
    if(t==='D'){ px(x,y,'#2a2420',8,8); px(x+1,y,'#d8ccb0',2,8); px(x+5,y,'#d8ccb0',2,8); px(x,y+3,'#a89c80',8,1); if(tileAt(tx,ty-1)!=='D'){ px(x+3,y+1,'#ffd860',2,2); } }
    else if(t==='X'){ px(x,y,'#140a20',8,8); px(x+1,y,'#7a5ac0',1,8); px(x+4,y,'#7a5ac0',1,8); px(x+6,y,'#5a3a9a',1,8); addLight(x+CX+4,y+CY+4,10,false); }
  }
  for(const pr of props) drawProp(pr);
  for(const a of altars) drawPyre(a);
  for(const s of signs) drawSign(s);
  for(const k of pickups) drawPickup(k);
  for(const n of npcs) drawNpc(n);
  drawWaxDrop();
  for(const e of ents) drawEnemyFull(e);
  drawPlayer();
  drawProjs();
  drawParticles();
  if(bgL.fg) drawLayer(bgL.fg,CX,CY,Math.max(0,room.h*8-H));
  drawLighting();
  drawFloaters();
}
function drawSign(s){ const x=Math.round(s.x-CX), y=Math.round(s.y-CY); px(x-3,y-7,'#3a3446',7,7); px(x-3,y-7,'#55506a',7,1); px(x-2,y-5,'#1a1622',5,1); px(x-2,y-3,'#1a1622',4,1); }
