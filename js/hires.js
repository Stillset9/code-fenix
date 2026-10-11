// CODE FENIX — arte en alta resolución (640x360 nativos): fondos parallax, tiles, luz, texto, íconos y retratos.
// El mundo lógico sigue en 320x180 (escala 2), pero todo lo que se dibuja con imágenes a mitad de tamaño
// aprovecha cada píxel nativo. Todo es procedural: no hay archivos de arte externos.
'use strict';
const SERIF="Georgia,'Palatino Linotype','Book Antiqua','Times New Roman',serif";
function hiOn(){ ctx.setTransform(1,0,0,1,0,0); }
function hiOff(){ ctx.setTransform(2,0,0,2,0,0); }
function stext(t,x,y,size,color,align='left',outline='rgba(0,0,0,0.9)',style=''){
  t=String(t); ctx.font=(style?style+' ':'')+size+'px '+SERIF; ctx.textAlign=align; ctx.textBaseline='top';
  if(outline){ ctx.fillStyle=outline; ctx.fillText(t,x+1,y+1); ctx.fillText(t,x-1,y); ctx.fillText(t,x+1,y); ctx.fillText(t,x,y-1); ctx.fillText(t,x,y+2); }
  ctx.fillStyle=color; ctx.fillText(t,x,y); ctx.textAlign='left';
}
function swidth(t,size,style=''){ ctx.font=(style?style+' ':'')+size+'px '+SERIF; return ctx.measureText(String(t)).width; }
function swrap(t,maxW,size){ const out=[]; for(const para of String(t).split('\n')){ let line=''; for(const w of para.split(' ')){ const tt=line?line+' '+w:w; if(swidth(tt,size)>maxW&&line){ out.push(line); line=w; } else line=tt; } out.push(line); } return out; }

// ---- ruido periódico ----
function vnoiseP(x,y,s,per){ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi; const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const m=k=>per?((k%per)+per)%per:k; const a=hash2(m(xi),yi,s), b=hash2(m(xi+1),yi,s), c=hash2(m(xi),yi+1,s), d=hash2(m(xi+1),yi+1,s);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbmP(x,y,s,per,o=4){ let t=0,a=0.5,f=1,n=0; for(let i=0;i<o;i++){ t+=vnoiseP(x*f,y*f,s+i*17,per?per*f:0)*a; n+=a; a*=0.5; f*=2; } return t/n; }
// Cuantiza con tramado Bayer: le da el acabado de pixel art a lo pintado con primitivas.
function pixelize(c,step=10,dith=1){ const x=c.getContext('2d'); const im=x.getImageData(0,0,c.width,c.height), d=im.data, w=c.width;
  for(let i=0,p=0;i<d.length;i+=4,p++){ if(d[i+3]===0) continue; const X=p%w, Y=(p/w)|0; const t=(BAYER[(Y&3)*4+(X&3)]/16-0.5)*step*dith;
    for(let k=0;k<3;k++) d[i+k]=Math.max(0,Math.min(255,Math.round((d[i+k]+t)/step)*step)); d[i+3]=d[i+3]>100?255:0; }
  x.putImageData(im,0,0); return c; }
const hex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// ---- árboles muertos escarchados ----
function frostTree(x,x0,y0,ang,len,wid,dep,R,col,snow,ice){
  const x1=x0+Math.cos(ang)*len, y1=y0+Math.sin(ang)*len, mx=(x0+x1)/2+(R()-0.5)*len*0.35, my=(y0+y1)/2+(R()-0.5)*len*0.25;
  x.strokeStyle=col; x.lineWidth=Math.max(1,wid); x.lineCap='round'; x.beginPath(); x.moveTo(x0,y0); x.quadraticCurveTo(mx,my,x1,y1); x.stroke();
  if(snow&&wid>1.4&&Math.abs(Math.sin(ang))<0.8){ x.strokeStyle=snow; x.lineWidth=Math.max(1,wid*0.4); x.beginPath(); x.moveTo(x0,y0-wid*0.45); x.quadraticCurveTo(mx,my-wid*0.45,x1,y1-wid*0.45); x.stroke(); }
  if(ice&&Math.abs(Math.sin(ang))<0.85&&R()<0.75){ x.fillStyle=ice; const n=1+Math.floor(R()*3); for(let i=0;i<n;i++){ const t=R(), ix=x0+(x1-x0)*t, iy=y0+(y1-y0)*t+wid*0.3, il=3+R()*10*Math.min(1,wid/3+0.4); x.beginPath(); x.moveTo(ix-1.2,iy); x.lineTo(ix+1.2,iy); x.lineTo(ix,iy+il); x.fill(); } }
  if(dep<=0||len<3) return;
  const n=R()<0.35?3:2;
  for(let i=0;i<n;i++){ const na=ang+(i-(n-1)/2)*(0.55+R()*0.55)+(R()-0.5)*0.35; frostTree(x,x1,y1,na,len*(0.6+R()*0.2),wid*0.64,dep-1,R,col,snow,ice); }
}
function snowGround(x,w,y0,amp,col,seed,per=3){ x.fillStyle=col; for(let X=0;X<w;X++){ const y=y0+Math.sin(X/w*Math.PI*2*per+seed)*amp+Math.sin(X/w*Math.PI*2*(per*3+1)+seed*2)*amp*0.35; x.fillRect(X,y,1,400); } }

// ---- exterior nevado bajo un cielo en llamas ----
function hiSky(){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h),d=im.data;
  for(let Y=0;Y<h;Y++) for(let X=0;X<w;X++){ const t=Y/h, i=(Y*w+X)*4;
    let r=34+t*70, g=28+t*36, b=34+t*14;
    const n=fbmP(X/150,Y/26,5,1280/150|0,5), n2=fbmP(X/60,Y/14,9,1280/60|0,3);
    const band=Math.max(0,n-0.5)*3.6*(0.35+0.65*Math.sin(Math.min(1,t*1.5)*Math.PI));
    const glow=Math.min(1,band*(0.7+n2*0.6));
    r+=glow*175; g+=glow*72; b+=glow*10;
    const cl=Math.max(0,0.47-n)*1.8; r-=cl*28; g-=cl*22; b-=cl*16;
    const haze=Math.max(0,1-Math.abs(t-0.62)*4); r+=haze*26; g+=haze*16; b+=haze*12;
    d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255; }
  x.putImageData(im,0,0); return pixelize(c,9); }
function hiMountain(){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h),d=im.data;
  const ridge=X=>{ const dx=Math.min(Math.abs(X-470),w-Math.abs(X-470)), dx2=Math.min(Math.abs(X-230),w-Math.abs(X-230));
    return 300-205*Math.exp(-Math.pow(dx/190,1.6))-70*Math.exp(-Math.pow(dx2/150,1.6))-fbmP(X/40,0,3,32)*22; };
  for(let X=0;X<w;X++){ const ry=ridge(X), sl=ridge(X+1)-ry;
    for(let Y=Math.max(0,Math.floor(ry));Y<h;Y++){ const i=(Y*w+X)*4, dep=(Y-ry)/140;
      const streak=fbmP((X+Y*0.6*(sl<0?1:-1))/18,Y/22,7,0,3); let v=0.95-dep*0.35+(sl<0?0.14:-0.1);
      let r=82*v,g=72*v,b=78*v;
      const snowy=streak>0.6-Math.max(0,0.35-dep)*0.7; if(snowy){ const s=sl<0?1:0.78; r=150*s; g=146*s; b=160*s; }
      const glow=Math.max(0,0.5-dep)*0.25; r+=glow*60; g+=glow*24;
      d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255; } }
  x.putImageData(im,0,0); return pixelize(c,10); }
function hiFarTrees(){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),R=seeded(31);
  snowGround(x,w,292,8,'#4c5468',1.2,2);
  for(const tx of [90,300,520,700,930,1120]){ frostTree(x,tx,300,-Math.PI/2+(R()-0.5)*0.2,46+R()*18,7,6,R,'#596279','#9aa4bc','#b8c2d8'); }
  snowGround(x,w,312,6,'#5c6680',2.4,3); return pixelize(c,10); }
function hiBalustrade(){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d');
  snowGround(x,w,322,3,'#6c768c',0.3,4);
  x.fillStyle='#545a6c'; x.fillRect(0,312,w,12); x.fillStyle='#6a7186'; x.fillRect(0,312,w,2);
  for(let X=4;X<w;X+=15){ x.fillStyle='#4a5062'; x.beginPath(); x.ellipse(X+4,300,4,7,0,0,7); x.fill(); x.fillRect(X+2,288,4,24); x.beginPath(); x.ellipse(X+4,292,3,3,0,0,7); x.fill();
    x.fillStyle='#6c7388'; x.fillRect(X+1,294,2,10); }
  x.fillStyle='#5a6074'; x.fillRect(0,280,w,8); x.fillStyle='#727a90'; x.fillRect(0,280,w,2);
  x.fillStyle='#c8d0e2'; for(let X=0;X<w;X++){ const s=2+Math.round(hash2(X>>2,1,4)*2); x.fillRect(X,278-s+2,1,s); }
  for(let X=0;X<w;X+=213){ x.fillStyle='#4e5466'; x.fillRect(X,262,22,62); x.fillStyle='#646b80'; x.fillRect(X,262,4,62); x.fillStyle='#5a6176'; x.fillRect(X-3,258,28,6);
    x.fillStyle='#d4dae8'; x.fillRect(X-3,253,28,5); x.beginPath(); x.ellipse(X+11,248,6,6,0,0,7); x.fillStyle='#565c70'; x.fill(); x.fillStyle='#d4dae8'; x.fillRect(X+6,242,10,3); }
  return pixelize(c,10); }
function hiNearTrees(){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),R=seeded(57);
  for(const tx of [150,610,1010]){ frostTree(x,tx,360,-Math.PI/2+(R()-0.5)*0.3,70+R()*20,14,6,R,'#262a36','#7a84a0','#9aa6c0'); }
  return pixelize(c,10); }
function hiForeground(){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),R=seeded(91);
  frostTree(x,90,380,-Math.PI/2+0.35,80,18,5,R,'#0b0b12','#3a4058','#4a5270');
  frostTree(x,860,390,-Math.PI/2-0.4,70,16,5,R,'#0b0b12','#3a4058','#4a5270');
  x.fillStyle='#10121a'; for(const [cx,cy,r] of [[40,372,60],[880,380,50],[1240,376,40]]){ x.beginPath(); x.ellipse(cx,cy,r,r*0.45,0,0,7); x.fill(); }
  x.fillStyle='#3a4258'; for(const [cx,cy,r] of [[40,372,60],[880,380,50],[1240,376,40]]){ x.beginPath(); x.ellipse(cx,cy-2,r*0.8,r*0.3,0,Math.PI,0); x.fill(); }
  return pixelize(c,10); }

// ---- interior de castillo ----
function stoneCol(stone,f=1){ const g=[44,46,56]; return mix(stone,g,0.55).map(v=>v*f); }
function hiCastleFar(stone){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h),d=im.data, base=stoneCol(stone,0.62);
  for(let Y=0;Y<h;Y++) for(let X=0;X<w;X++){ const row=Y>>4, bx=X+((row&1)?16:0), mort=(Y&15)===15||(bx&31)===31, i=(Y*w+X)*4;
    let v=mort?0.62:0.85+hash2((bx>>5)%40,row,4)*0.22; v*=0.8+fbmP(X/90,Y/90,11,1280/90|0,3)*0.4; if((Y&15)===0) v*=1.1;
    d[i]=base[0]*v; d[i+1]=base[1]*v; d[i+2]=base[2]*v; d[i+3]=255; }
  x.putImageData(im,0,0);
  const dk=hex(...stoneCol(stone,0.4)), md=hex(...stoneCol(stone,0.75)), lt=hex(...stoneCol(stone,1.05));
  for(const wx of [180,820]){ // ventanales
    const g=x.createLinearGradient(0,50,0,230); g.addColorStop(0,'#3c4458'); g.addColorStop(1,'#232634'); x.fillStyle=g;
    x.beginPath(); x.moveTo(wx,230); x.lineTo(wx,90); x.quadraticCurveTo(wx+26,40,wx+52,90); x.lineTo(wx+52,230); x.fill();
    x.fillStyle=dk; x.fillRect(wx+24,60,4,170); for(let yy=100;yy<230;yy+=30) x.fillRect(wx,yy,52,3);
    x.globalAlpha=0.06; x.fillStyle='#b8c4e0'; x.beginPath(); x.moveTo(wx,90); x.lineTo(wx+52,90); x.lineTo(wx+170,360); x.lineTo(wx+60,360); x.fill(); x.globalAlpha=1; }
  // galería superior con balaustrada
  x.fillStyle=md; x.fillRect(0,112,w,10); x.fillStyle=lt; x.fillRect(0,112,w,2); x.fillStyle=dk; x.fillRect(0,122,w,4);
  for(let X=0;X<w;X+=12){ x.fillStyle=dk; x.fillRect(X+3,96,5,16); x.fillStyle=md; x.fillRect(X+4,98,2,12); } x.fillStyle=md; x.fillRect(0,92,w,5);
  // escaleras de fondo en zigzag
  const stair=(x0,y0,dir,n)=>{ for(let i=0;i<n;i++){ const sx=x0+dir*i*9, sy=y0-i*7; x.fillStyle=md; x.fillRect(Math.min(sx,sx+dir*9),sy,9,7); x.fillStyle=lt; x.fillRect(Math.min(sx,sx+dir*9),sy,9,1); x.fillStyle=dk; x.fillRect(Math.min(sx,sx+dir*9),sy+7,9,400); }
    x.strokeStyle=lt; x.lineWidth=2; x.beginPath(); x.moveTo(x0,y0-18); x.lineTo(x0+dir*n*9,y0-n*7-18); x.stroke();
    for(let i=0;i<n;i+=2){ x.fillStyle=md; x.fillRect(x0+dir*i*9+2,y0-i*7-17,2,16); } };
  stair(420,330,1,30); stair(1100,330,-1,30); stair(1140,122,1,10);
  return pixelize(c,8); }
function hiCastleMid(stone){ const w=1280,h=360,c=mkCanvas(w,h),x=c.getContext('2d'),R=seeded(stone[0]*7+stone[2]);
  const dk=hex(...stoneCol(stone,0.5)), md=hex(...stoneCol(stone,0.85)), lt=hex(...stoneCol(stone,1.25));
  const cur=[[74,40,50],[96,56,64],[52,28,36]].map(cc=>hex(...mix(cc,[60,60,70],0.3)));
  const drawPillar=px0=>{ x.fillStyle=dk; x.fillRect(px0,0,40,h); x.fillStyle=md; x.fillRect(px0+4,0,32,h); for(let k=0;k<4;k++){ x.fillStyle=lt; x.fillRect(px0+7+k*8,30,2,h-80); x.fillStyle=dk; x.fillRect(px0+9+k*8,30,2,h-80); }
    x.fillStyle=lt; x.fillRect(px0-6,18,52,10); x.fillStyle=dk; x.fillRect(px0-6,28,52,4); x.fillStyle=md; x.fillRect(px0-8,h-44,56,44); x.fillStyle=lt; x.fillRect(px0-8,h-44,56,3); };
  const pillars=[0,427,853];
  for(let i=0;i<pillars.length;i++){ const a=pillars[i]+40, b=(pillars[i+1]||1280);
    // cortinado en guirnalda
    for(let k=0;k<3;k++){ x.fillStyle=cur[k===1?1:k===2?2:0]; x.beginPath(); x.moveTo(a,0); x.quadraticCurveTo((a+b)/2,96-k*14,b,0); x.lineTo(b,0); x.fill(); }
    for(let f=a+18;f<b-10;f+=26){ x.strokeStyle=cur[2]; x.lineWidth=2; x.beginPath(); x.moveTo(f,0); x.quadraticCurveTo(f+4,40,f+2,70-Math.abs(f-(a+b)/2)*0.2); x.stroke(); }
    // cortinas laterales
    for(const [sx,dir] of [[a,1],[b,-1]]){ x.fillStyle=cur[0]; x.beginPath(); x.moveTo(sx,0); x.lineTo(sx+dir*34,0); x.quadraticCurveTo(sx+dir*14,150,sx+dir*30,262); x.lineTo(sx,262); x.fill();
      x.fillStyle=cur[1]; for(let k=0;k<3;k++){ x.fillRect(sx+dir*(6+k*8)-(dir<0?2:0),10,2,240); } x.fillStyle='#8a7448'; x.fillRect(sx+(dir<0?-22:4),150,18,4); }
    const mid=(a+b)/2;
    if(i===0){ // cuadro
      x.fillStyle='#5e5038'; x.fillRect(mid-34,108,68,86); x.fillStyle='#8a7650'; x.fillRect(mid-34,108,68,2); x.fillStyle='#1c1a22'; x.fillRect(mid-28,114,56,74);
      x.fillStyle='#38343e'; x.beginPath(); x.ellipse(mid,140,11,14,0,0,7); x.fill(); x.fillRect(mid-18,158,36,30); x.fillStyle='#4a4652'; x.beginPath(); x.ellipse(mid-3,137,5,7,0,0,7); x.fill(); }
    if(i===1){ // estatua encapuchada
      x.fillStyle=dk; x.fillRect(mid-30,282,60,44); x.fillStyle=md; x.fillRect(mid-34,278,68,6);
      x.fillStyle='#565a66'; x.beginPath(); x.moveTo(mid-26,278); x.quadraticCurveTo(mid-30,180,mid-14,150); x.quadraticCurveTo(mid,128,mid+14,150); x.quadraticCurveTo(mid+30,180,mid+26,278); x.fill();
      x.fillStyle='#727684'; x.beginPath(); x.moveTo(mid-20,276); x.quadraticCurveTo(mid-22,190,mid-10,156); x.quadraticCurveTo(mid-2,146,mid,150); x.lineTo(mid-6,276); x.fill();
      x.fillStyle='#1c1c24'; x.beginPath(); x.ellipse(mid+2,160,8,11,0,0,7); x.fill();
      x.strokeStyle='#40434e'; x.lineWidth=2; for(let k=0;k<4;k++){ x.beginPath(); x.moveTo(mid-14+k*9,200); x.lineTo(mid-16+k*10,276); x.stroke(); }
      x.fillStyle='#868a98'; x.fillRect(mid-8,214,16,8); }
    // candelabros
    for(const cx of [a+70,b-70]){ x.fillStyle='#2e2a32'; x.fillRect(cx-2,214,4,112); x.fillRect(cx-12,322,24,4); x.fillRect(cx-22,212,44,3);
      for(const ox of [-22,-11,0,11,22]){ x.fillStyle='#2e2a32'; x.fillRect(cx+ox-2,206,4,6); const ch=6+((ox+30)%7); x.fillStyle='#cfc6b4'; x.fillRect(cx+ox-1,206-ch,3,ch);
        const g=x.createRadialGradient(cx+ox,200-ch,0,cx+ox,200-ch,9); g.addColorStop(0,'rgba(255,190,90,0.55)'); g.addColorStop(1,'rgba(255,120,40,0)'); x.fillStyle=g; x.fillRect(cx+ox-9,191-ch,18,18);
        x.fillStyle='#ffd070'; x.fillRect(cx+ox,201-ch,1,4); } }
  }
  for(const p0 of pillars) drawPillar(p0===0?-20:p0); drawPillar(1260);
  return pixelize(c,8); }

const HBG_CACHE={};
function getBg(type,stone){
  const key=type+':'+stone.join(','); if(HBG_CACHE[key]) return HBG_CACHE[key];
  let L;
  if(type==='exterior') L={sky:'#1c1418',layers:[{img:hiSky(),p:0.02,py:0.01},{img:hiMountain(),p:0.06,py:0.03},{img:hiFarTrees(),p:0.16,py:0.08},{img:hiBalustrade(),p:0.4,py:0.2},{img:hiNearTrees(),p:0.6,py:0.3}],
    fg:{img:hiForeground(),p:1.25,py:0.5}};
  else L={sky:'#0a0a10',layers:[{img:hiCastleFar(stone),p:0.12,py:0.08},{img:hiCastleMid(stone),p:0.32,py:0.2}]};
  HBG_CACHE[key]=L; return L;
}
function drawLayers(L,camX,camY,maxCamY){
  ctx.fillStyle=L.sky; ctx.fillRect(0,0,W,H);
  for(const l of L.layers) drawLayer(l,camX,camY,maxCamY);
}
function drawLayer(l,camX,camY,maxCamY){
  const iw=l.img.width/2, ih=l.img.height/2; let ox=-(camX*l.p)%iw; if(ox>0) ox-=iw; ox=Math.round(ox*2)/2;
  const oy=Math.round((maxCamY-camY)*l.py*2)/2+(H-ih);
  for(let X=ox;X<W;X+=iw) ctx.drawImage(l.img,X,oy,iw,ih);
}

// ---- tiles en alta resolución (16 px nativos por tile lógico de 8) ----
function buildTiles(){
  const S=16, w=room.w*S, h=room.h*S, c=mkCanvas(w,h), x=c.getContext('2d'), img=x.createImageData(w,h), d=img.data;
  const ext=room.def.bg==='exterior'; const base=ext?[74,78,94]:stoneCol(room.def.stone,1.25);
  const sol=(tx,ty)=>tileAt(tx,ty)==='#';
  const put=(X,Y,r,g,b)=>{ const i=(Y*w+X)*4; d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255; };
  const shadeT=[1,1,0.72,0.5,0.34];
  for(let ty=0;ty<room.h;ty++) for(let tx=0;tx<room.w;tx++){
    const t=room.g[ty][tx];
    if(t==='#'){
      let dist=4; outer: for(let k=1;k<=3;k++){ for(let dy=-k;dy<=k;dy++) for(let dx=-k;dx<=k;dx++){ if(!sol(tx+dx,ty+dy)){ dist=k; break outer; } } }
      const sh=shadeT[dist], aU=!sol(tx,ty-1), aD=!sol(tx,ty+1), aL=!sol(tx-1,ty), aR=!sol(tx+1,ty);
      for(let j=0;j<S;j++) for(let i=0;i<S;i++){
        const gx=tx*S+i, gy=ty*S+j, row=gy>>3, bx=gx+((row&1)?8:0), mort=(gy&7)===7||(bx&15)===15;
        let f=mort?0.5:(0.8+hash2(bx>>4,row,1)*0.26+(hash2(gx,gy,2)-0.5)*0.1); if(!mort&&(gy&7)===0) f*=1.12; if(!mort&&(bx&15)===0) f*=1.06;
        if(hash2(gx>>1,gy>>1,13)<0.015) f*=0.6;
        f*=sh;
        let r=base[0]*f,g=base[1]*f,b=base[2]*f;
        if(aU){ if(j<2){ r=base[0]*1.55; g=base[1]*1.55; b=base[2]*1.6; } else if(j<4){ r*=1.15; g*=1.15; b*=1.15; }
          if(ext){ const st=3+Math.floor(hash2(gx>>1,ty,4)*3), drip=hash2(gx,ty,5)<0.12?3:0; if(j<st+drip){ const k=j===0?1:j<st?0.86:0.7; r=228*k; g=234*k; b=248*k; } } }
        if(aD&&j>=S-2){ r*=0.45; g*=0.45; b*=0.5; } if(aL&&i<2){ r*=0.72; g*=0.72; b*=0.75; } if(aR&&i>=S-2){ r*=0.72; g*=0.72; b*=0.75; }
        put(gx,gy,r,g,b);
      }
    } else if(t==='='){
      for(let i=0;i<S;i++){ const gx=tx*S+i, gy=ty*S, n=hash2(gx>>2,gy,3)*12;
        const col=[[base[0]*1.6+n,base[1]*1.6+n,base[2]*1.6+n],[base[0]*1.15+n,base[1]*1.15+n,base[2]*1.15+n],[base[0]*1.0,base[1],base[2]],[base[0]*0.85,base[1]*0.85,base[2]*0.85],[base[0]*0.5,base[1]*0.5,base[2]*0.55],[base[0]*0.3,base[1]*0.3,base[2]*0.35]];
        for(let j=0;j<6;j++){ let cc=col[j]; if(ext&&j<2) cc=j?[200,206,222]:[232,238,250]; put(gx,gy+j,...cc); } }
      for(const [sx,cond] of [[2,tileAt(tx-1,ty)!=='='],[11,tileAt(tx+1,ty)!=='=']]) if(cond) for(let j=6;j<11;j++) for(let i=0;i<3;i++) if(i<11-j+1) put(tx*S+sx+i,ty*S+j,base[0]*0.6,base[1]*0.6,base[2]*0.65);
    } else if(t==='^'){
      for(let i=0;i<S;i++){ const k=i%5, hh=[4,10,14,10,4][k]; for(let j=S-hh;j<S;j++){ const top=j<S-hh+2; put(tx*S+i,ty*S+j, top?190:k<2?130:80, top?188:k<2?130:78, top?200:k<2?146:92); } }
    }
  }
  x.putImageData(img,0,0); room.tileCanvas=c;
}

// ---- luz: máscara de oscuridad a resolución nativa + gradación desaturada ----
function drawLighting(){
  dctx.setTransform(1,0,0,1,0,0); dctx.globalCompositeOperation='source-over'; dctx.clearRect(0,0,SW,SH); dctx.setTransform(2,0,0,2,0,0);
  dctx.fillStyle=`rgba(4,3,10,${room.def.dark})`; dctx.fillRect(0,0,W,H);
  dctx.globalCompositeOperation='destination-out';
  for(const l of lights){ const x=l.x-CX, y=l.y-CY; if(x<-l.r||x>W+l.r||y<-l.r||y>H+l.r) continue;
    const g=dctx.createRadialGradient(x,y,0,x,y,l.r); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(0.5,'rgba(0,0,0,0.6)'); g.addColorStop(1,'rgba(0,0,0,0)');
    dctx.fillStyle=g; dctx.fillRect(x-l.r,y-l.r,l.r*2,l.r*2); }
  dctx.globalCompositeOperation='source-over';
  ctx.drawImage(dark,0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  for(const l of lights){ const x=l.x-CX, y=l.y-CY, r=l.r*0.6; if(x<-r||x>W+r||y<-r||y>H+r) continue;
    const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,l.warm?'rgba(90,50,10,0.2)':'rgba(60,40,110,0.2)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2); }
  ctx.globalCompositeOperation='saturation'; ctx.fillStyle='rgba(128,128,128,0.28)'; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';
  const v=ctx.createRadialGradient(W/2,H/2,H*0.45,W/2,H/2,H); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.6)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
}
function drawDecals(){ for(const d of decals){ const x=d.x-CX, y=d.y-CY; if(x<-4||x>W+4||y<-4||y>H+4) continue; ctx.fillStyle=d.c; ctx.fillRect(x,y,d.w,0.5); if(d.w>1) ctx.fillRect(x+0.5,y+0.5,d.w*0.5,0.5); } }
function drawParticles(){
  for(const p of parts){ const a=clamp(p.life/p.max,0,1); ctx.globalAlpha=p.glow?a:Math.min(1,a*1.5); ctx.fillStyle=p.color; ctx.fillRect(Math.round((p.x-CX)*2)/2,Math.round((p.y-CY)*2)/2,p.size,p.size); }
  ctx.globalAlpha=1;
}
// números de daño flotantes (nativos, con "pop")
function drawFloaters(){
  hiOn();
  for(const f of floaters){ const a=clamp(f.t,0,1); ctx.globalAlpha=a; const x=(f.x-CX)*2, y=(f.y-CY)*2;
    if(f.dmg){ const age=1.3-f.t, pop=age<0.12?1+(0.12-age)*5:1; const sz=Math.round((f.big?22:15)*pop); stext(f.text,x,y-sz/2,sz,f.color,'center','rgba(20,0,4,0.95)','bold'); }
    else stext(f.text,x,y,12,f.color,'center'); }
  ctx.globalAlpha=1; hiOff();
}

// ---- íconos 32x32 (pintados con primitivas y cuantizados) ----
const ICON_CACHE={};
function icon(id){
  if(ICON_CACHE[id]) return ICON_CACHE[id];
  const c=mkCanvas(32,32), x=c.getContext('2d'); x.lineCap='round'; x.lineJoin='round';
  const L=(a,b,c2,d,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a,b); x.lineTo(c2,d); x.stroke(); };
  const E=(cx,cy,rx,ry,col)=>{ x.fillStyle=col; x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,7); x.fill(); };
  const Pz=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) x.lineTo(pts[i],pts[i+1]); x.closePath(); x.fill(); };
  const glow=(cx,cy,r,col)=>{ const g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(cx-r,cy-r,r*2,r*2); };
  switch(id){
    case 'hoz': L(8,28,22,6,'#2a1a10',5); L(8,28,22,6,'#7a5232',3); x.strokeStyle='#1a1a22'; x.lineWidth=5; x.beginPath(); x.arc(14,10,11,-1.1,0.5); x.stroke(); x.strokeStyle='#c8ccd8'; x.lineWidth=3; x.beginPath(); x.arc(14,10,11,-1.1,0.5); x.stroke(); L(17,1,25,6,'#f0f2f8',1); glow(9,24,7,'rgba(255,190,80,0.9)'); E(9,24,2,3,'#ffd860'); break;
    case 'mandoble': L(6,26,26,4,'#141418',7); L(6,26,26,4,'#9ca0ae',5); L(7,25,25,5,'#e4e6ee',1.5); L(5,19,13,27,'#3a2a14',4); L(5,19,13,27,'#c9a24a',2.5); L(3,30,7,26,'#5a3a22',4); E(3,30,2,2,'#c9a24a'); break;
    case 'estoque': L(6,26,28,4,'#141418',3.5); L(6,26,28,4,'#d8dce8',2); x.strokeStyle='#c9a24a'; x.lineWidth=2; x.beginPath(); x.arc(9,23,5,0,Math.PI*1.6); x.stroke(); L(3,29,8,24,'#4a2a1a',3.5); break;
    case 'pistola': Pz([4,14,24,12,27,13,27,17,12,18],'#1a1a20'); Pz([5,15,25,13,26,16,12,17],'#7a7a88'); Pz([8,17,14,17,12,27,6,28,5,25],'#1a1210'); Pz([9,18,13,18,11,26,7,26],'#6a4528'); L(14,12,16,9,'#c9a24a',2); break;
    case 'trabuco': Pz([3,15,22,12,29,8,30,19,22,18,10,20],'#1a1a20'); Pz([4,16,22,13,28,10,28,17,22,16,10,18],'#8a6a3a'); Pz([8,18,14,18,11,28,4,28],'#1a1210'); Pz([9,19,13,19,10,26,6,26],'#5a3a20'); break;
    case 'unguento': E(16,22,10,7,'#1a1012'); E(16,21,9,6,'#5a4030'); x.fillStyle='#3a2a20'; x.fillRect(7,12,18,9); E(16,12,9,4,'#e08a3a'); E(15,11,5,2,'#ffd090'); glow(16,12,10,'rgba(255,140,40,0.35)'); break;
    case 'ampolla': x.fillStyle='#1a1a24'; x.fillRect(13,3,6,7); x.fillStyle='#8a6a40'; x.fillRect(13,3,6,3); E(16,20,9,10,'#141420'); E(16,20,8,9,'#2a4aa0'); E(16,23,7,6,'#4a8ae0'); E(13,17,2,3,'#c8e0ff'); glow(16,21,12,'rgba(80,140,255,0.3)'); break;
    case 'lagrima': x.fillStyle='#1a1a24'; x.fillRect(13,2,6,6); x.fillStyle='#c9a24a'; x.fillRect(12,6,8,2); Pz([16,8,25,20,22,28,10,28,7,20],'#141018'); Pz([16,10,23,20,21,26,11,26,9,20],'#c0401e'); Pz([16,14,21,21,19,25,13,25,11,21],'#ff9a3a'); E(13,19,1.5,2.5,'#fff0b0'); glow(16,21,13,'rgba(255,120,40,0.35)'); break;
    case 'fragmento': glow(16,17,14,'rgba(255,120,40,0.5)'); Pz([16,3,24,14,19,29,10,25,8,12],'#3a1408'); Pz([16,5,22,14,18,27,11,24,10,13],'#e0602a'); Pz([16,7,19,14,15,22,12,14],'#ffd090'); break;
    case 'brasaMayor': glow(16,17,15,'rgba(255,60,30,0.6)'); E(16,18,10,10,'#3a0806'); E(16,18,8,8,'#c0201a'); E(14,16,5,5,'#ff7a3a'); E(13,14,2,2,'#fff0b0'); break;
    case 'polvora': x.strokeStyle='#2a1a10'; x.lineWidth=8; x.beginPath(); x.arc(20,28,18,-2.6,-1.4); x.stroke(); x.strokeStyle='#b8a078'; x.lineWidth=6; x.beginPath(); x.arc(20,28,18,-2.6,-1.4); x.stroke(); x.fillStyle='#5a4a30'; x.fillRect(19,8,5,7); L(5,18,4,8,'#3a2a1a',2); break;
    case 'llave': L(9,26,24,8,'#3a3428',6); L(9,26,24,8,'#d8ccb0',3.5); E(9,26,5,5,'#3a3428'); E(9,26,3.5,3.5,'#d8ccb0'); E(9,26,1.5,1.5,'#3a3428'); L(22,10,26,14,'#d8ccb0',3); L(19,13,22,16,'#d8ccb0',3); break;
    case 'alas': for(let i=0;i<6;i++){ Pz([6,26,10+i*4,5+i*2,13+i*4,8+i*2,10,27],i%2?'#1a1622':'#2e2838'); } L(6,26,26,14,'#4a4258',1); break;
    case 'impulso': glow(16,16,14,'rgba(255,150,60,0.6)'); Pz([6,24,16,4,14,14,26,8,16,28,18,17],'#e0502a'); Pz([9,22,15,9,14,16,22,11,16,24,17,17],'#ffd860'); break;
    case 'medallon': E(16,17,10,10,'#2a1608'); E(16,17,9,9,'#b8693a'); E(16,17,6,6,'#8a4a22'); E(14,15,2,2,'#f0b080'); L(16,3,16,8,'#6a6a6a',1.5); break;
    case 'cenizaAbadesa': E(16,24,12,5,'#3a3640'); E(16,22,9,5,'#6a6670'); E(14,20,4,2,'#8a8690'); Pz([18,6,27,9,25,19,16,16],'#d8d0b8'); L(19,10,24,11,'#5a5040',1); L(19,13,23,14,'#5a5040',1); break;
    case 'llama': glow(16,18,14,'rgba(255,120,40,0.6)'); Pz([16,3,24,18,20,28,12,28,8,18],'#c0301e'); Pz([16,9,21,19,18,26,14,26,11,19],'#ff9a3a'); Pz([16,15,18,21,16,25,14,21],'#fff0b0'); break;
    case 'nova': glow(16,16,15,'rgba(200,120,255,0.4)'); x.strokeStyle='#9a6ad0'; x.lineWidth=3; x.beginPath(); x.arc(16,16,10,0,7); x.stroke(); x.strokeStyle='#ffb050'; x.lineWidth=1.5; x.beginPath(); x.arc(16,16,6,0,7); x.stroke(); E(16,16,2.5,2.5,'#fff0d0'); break;
    case 'shield': Pz([16,3,27,7,25,20,16,29,7,20,5,7],'#14141a'); Pz([16,5,25,8,23,19,16,26,9,19,7,8],'#5a5e6e'); Pz([16,5,16,26,9,19,7,8],'#7a7e8e'); L(16,9,16,22,'#c9a24a',2); L(11,13,21,13,'#c9a24a',2); break;
    case 'skull': E(16,14,10,10,'#14141a'); E(16,14,9,9,'#d8d0c0'); x.fillStyle='#d8d0c0'; x.fillRect(11,19,10,8); E(12,14,3,3,'#1a1018'); E(20,14,3,3,'#1a1018'); x.fillStyle='#1a1018'; for(let i=0;i<4;i++) x.fillRect(12+i*2.5,24,1,3); E(12,14,1,1,'#ff4030'); E(20,14,1,1,'#ff4030'); break;
    case 'feather': x.fillStyle='#6a6a78'; x.beginPath(); x.moveTo(6,28); x.quadraticCurveTo(4,10,26,3); x.quadraticCurveTo(22,20,6,28); x.fill(); L(6,28,24,5,'#d8d8e0',1.2); for(let i=0;i<5;i++) L(10+i*3,22-i*3.5,13+i*3,26-i*4.4,'#3a3a48',1); break;
    case 'sigil': for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; L(16,16,16+Math.cos(a)*(i%2?9:14),16+Math.sin(a)*(i%2?9:14),'#d8d8e0',i%2?1.5:2.2); } E(16,16,4,4,'#14141a'); E(16,16,2.5,2.5,'#ffd860'); break;
    case 'phoenix': glow(16,16,15,'rgba(255,140,40,0.55)'); for(const sd of [-1,1]) Pz([16,14,16+sd*14,6,16+sd*11,14,16+sd*13,17,16+sd*6,19],'#e0602a'); Pz([14,10,18,10,18,26,16,30,14,26],'#ffb040'); E(16,9,2.5,2.5,'#fff0b0'); break;
    case 'spark': glow(16,16,14,'rgba(140,200,255,0.6)'); Pz([16,2,19,13,30,16,19,19,16,30,13,19,2,16,13,13],'#9ac8ff'); E(16,16,3,3,'#ffffff'); break;
    case 'blade2': L(5,27,27,5,'#141418',4); L(5,27,27,5,'#d8dce8',2); L(27,27,5,5,'#141418',4); L(27,27,5,5,'#b8bcc8',2); E(16,16,3,3,'#c9a24a'); break;
    case 'empty': break;
    default: E(16,16,6,6,'#5a5468');
  }
  pixelize(c,6,0.6); ICON_CACHE[id]=c; return c;
}
const ITEM_ICON={unguento:'unguento',ampolla:'ampolla',fragmento:'fragmento',brasaMayor:'brasaMayor',polvora:'polvora',llave:'llave',alas:'alas',impulso:'impulso',medallon:'medallon',cenizaAbadesa:'cenizaAbadesa',lagrima:'lagrima'};
const SKILL_ICON={brasa:'fragmento',filo:'estoque',piel:'shield',chispa:'spark',ira:'mandoble',verdugo:'skull',paso:'feather',lagrima:'lagrima',verso:'llama',contra:'blade2',avaricia:'sigil',fenix:'phoenix'};

// ---- marcos ornamentados ----
function ornLine(x0,y,x1,col='#8a8a98'){ ctx.fillStyle='#07060b'; ctx.fillRect(x0,y-1,x1-x0,3); ctx.fillStyle=col; ctx.fillRect(x0,y,x1-x0,1); }
function ornDiamond(cx,cy,r,col='#a8a8b8',fill='#14121a'){ ctx.fillStyle='#07060b'; ctx.beginPath(); ctx.moveTo(cx,cy-r-1); ctx.lineTo(cx+r+1,cy); ctx.lineTo(cx,cy+r+1); ctx.lineTo(cx-r-1,cy); ctx.fill();
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r,cy); ctx.lineTo(cx,cy+r); ctx.lineTo(cx-r,cy); ctx.fill(); ctx.fillStyle=fill; ctx.beginPath(); ctx.moveTo(cx,cy-r+2); ctx.lineTo(cx+r-2,cy); ctx.lineTo(cx,cy+r-2); ctx.lineTo(cx-r+2,cy); ctx.fill(); }
function ornCurl(cx,cy,dir,col='#8a8a98'){ ctx.strokeStyle=col; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx+dir*4,cy,4,dir>0?Math.PI:0,dir>0?Math.PI*2.6:-Math.PI*1.6,dir<0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-dir*10,cy); ctx.stroke(); }
// panel ornamentado nativo
function hpanel(x,y,w,h,title){
  const g=ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'rgba(14,12,20,0.96)'); g.addColorStop(1,'rgba(6,5,10,0.97)'); ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#07060b'; ctx.lineWidth=3; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1); ctx.strokeStyle='#5a5a68'; ctx.lineWidth=1; ctx.strokeRect(x+3.5,y+3.5,w-7,h-7); ctx.strokeStyle='#2a2832'; ctx.strokeRect(x+5.5,y+5.5,w-11,h-11);
  for(const [cx,cy] of [[x+4,y+4],[x+w-4,y+4],[x+4,y+h-4],[x+w-4,y+h-4]]) ornDiamond(cx,cy,4);
  if(title){ const tw=swidth(title,16)+40; ctx.fillStyle='#0c0a12'; ctx.fillRect(x+w/2-tw/2,y-10,tw,22); ctx.strokeStyle='#6a6a78'; ctx.strokeRect(x+w/2-tw/2+0.5,y-9.5,tw-1,21);
    ornDiamond(x+w/2-tw/2,y+1,5); ornDiamond(x+w/2+tw/2,y+1,5); stext(title,x+w/2,y-7,16,'#e8dcc4','center'); }
}
function slotBox(x,y,s,sel,col){ ctx.fillStyle='rgba(8,7,12,0.88)'; ctx.fillRect(x,y,s,s); ctx.strokeStyle='#07060b'; ctx.lineWidth=3; ctx.strokeRect(x+0.5,y+0.5,s-1,s-1);
  ctx.strokeStyle=sel?'#ffd860':(col||'#6a6a78'); ctx.lineWidth=1; ctx.strokeRect(x+1.5,y+1.5,s-3,s-3); if(sel){ ctx.strokeStyle='rgba(255,216,96,0.35)'; ctx.strokeRect(x-1.5,y-1.5,s+3,s+3); }
  ornDiamond(x+s/2,y+1,3,sel?'#ffd860':'#8a8a98'); }

// ---- retratos de diálogo (120x150 pintados, se muestran a x2) ----
const PORTRAIT_CACHE={};
function pE(x,cx,cy,rx,ry,col,rot=0){ x.fillStyle=col; x.beginPath(); x.ellipse(cx,cy,Math.max(0.5,rx),Math.max(0.5,ry),rot,0,7); x.fill(); }
function pP(x,pts,col){ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) x.lineTo(pts[i],pts[i+1]); x.closePath(); x.fill(); }
function pL(x,a,b,c,d,col,w=1){ x.strokeStyle=col; x.lineWidth=w; x.lineCap='round'; x.beginPath(); x.moveTo(a,b); x.lineTo(c,d); x.stroke(); }
function pGlow(x,cx,cy,r,col){ const g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(cx-r,cy-r,r*2,r*2); }
function paintFace(x,o){
  const sk=o.skin, hi=hex(...sk.map(v=>v*1.12+14)), mid=hex(...sk), sh=hex(...sk.map(v=>v*0.62)), dk=hex(...sk.map(v=>v*0.36));
  const {cx,cy,rx,ry}=o, jaw=o.jaw||0.45;
  x.fillStyle=sh; x.fillRect(cx-rx*0.42,cy+ry*0.5,rx*0.84,ry*0.9); x.fillStyle=dk; x.fillRect(cx-rx*0.42,cy+ry*0.75,rx*0.84,3);
  x.beginPath(); x.moveTo(cx-rx,cy-ry*0.1); x.bezierCurveTo(cx-rx,cy-ry*1.12,cx+rx,cy-ry*1.12,cx+rx,cy-ry*0.1);
  x.bezierCurveTo(cx+rx,cy+ry*0.55,cx+rx*jaw,cy+ry,cx,cy+ry); x.bezierCurveTo(cx-rx*jaw,cy+ry,cx-rx,cy+ry*0.55,cx-rx,cy-ry*0.1); x.closePath();
  const g=x.createRadialGradient(cx-rx*0.3,cy-ry*0.3,1,cx,cy,rx*1.4); g.addColorStop(0,hi); g.addColorStop(0.5,mid); g.addColorStop(1,dk); x.fillStyle=g; x.fill();
  x.save(); x.clip(); const lg=x.createLinearGradient(cx-rx,0,cx+rx,0); lg.addColorStop(0,'rgba(255,250,240,0.06)'); lg.addColorStop(0.45,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(10,4,8,0.55)'); x.fillStyle=lg; x.fillRect(cx-rx,cy-ry*1.2,rx*2,ry*2.4);
  const jg=x.createLinearGradient(0,cy+ry*0.3,0,cy+ry); jg.addColorStop(0,'rgba(0,0,0,0)'); jg.addColorStop(1,'rgba(10,4,8,0.45)'); x.fillStyle=jg; x.fillRect(cx-rx,cy,rx*2,ry);
  pE(x,cx-rx*0.55,cy+ry*0.22,rx*0.22,ry*0.12,'rgba(160,60,60,0.12)'); pE(x,cx+rx*0.62,cy+ry*0.2,rx*0.25,ry*0.3,'rgba(10,4,8,0.25)'); x.restore();
  if(o.hollow){ pE(x,cx-rx*0.62,cy+ry*0.35,rx*0.22,ry*0.25,'rgba(20,10,10,0.35)'); pE(x,cx+rx*0.62,cy+ry*0.35,rx*0.22,ry*0.25,'rgba(20,10,10,0.35)'); }
  for(const sd of [-1,1]){ const ex=cx+sd*rx*0.42, ey=cy-ry*0.04;
    pE(x,ex,ey,rx*0.3,ry*0.14,'rgba(15,8,10,0.5)');
    if(o.closed){ x.strokeStyle=dk; x.lineWidth=1.2; x.beginPath(); x.arc(ex,ey-1,rx*0.18,0.25,Math.PI-0.25); x.stroke(); }
    else { const wax=o.wax&&sd>0; pE(x,ex,ey,rx*0.18,ry*0.065,wax?'#e8dc98':'#cdc6ba'); pE(x,ex+sd*0.3,ey,rx*0.085,ry*0.07,wax?'#fff4c0':(o.eye||'#3a2a20'));
      if(o.glowEye||wax) pGlow(x,ex,ey,rx*0.45,wax?'rgba(255,230,140,0.55)':o.glowEye); x.strokeStyle='rgba(10,4,6,0.55)'; x.lineWidth=0.5; x.beginPath(); x.arc(ex+sd*0.3,ey,rx*0.085,0,7); x.stroke(); pE(x,ex+sd*0.3,ey,rx*0.035,ry*0.035,'#050304'); pE(x,ex-0.8,ey-0.9,0.55,0.55,'#ffffff'); pE(x,ex+0.9,ey+0.6,0.3,0.3,'rgba(255,255,255,0.6)');
      x.strokeStyle=dk; x.lineWidth=0.9; x.beginPath(); x.ellipse(ex,ey+0.4,rx*0.2,ry*0.085,0,Math.PI*1.08,Math.PI*1.92); x.stroke(); x.strokeStyle='rgba(10,4,6,0.35)'; x.lineWidth=0.5; x.beginPath(); x.ellipse(ex,ey-0.6,rx*0.22,ry*0.11,0,Math.PI*1.1,Math.PI*1.9); x.stroke(); }
    pL(x,ex-sd*rx*0.28,ey-ry*(0.2+(o.browUp||0)),ex+sd*rx*0.24,ey-ry*0.27,o.browCol||dk,o.brow||1.6); }
  x.strokeStyle=sh; x.lineWidth=1.5; x.beginPath(); x.moveTo(cx+1,cy-ry*0.02); x.lineTo(cx+rx*0.16,cy+ry*0.34); x.lineTo(cx-rx*0.08,cy+ry*0.4); x.stroke();
  pL(x,cx-1,cy+ry*0.02,cx-1,cy+ry*0.28,hi,1);
  pE(x,cx+rx*0.06,cy+ry*0.42,rx*0.08,ry*0.03,dk);
  pE(x,cx-rx*0.5,cy+ry*0.12,rx*0.2,ry*0.07,'rgba(255,240,220,0.13)'); pE(x,cx+rx*0.52,cy+ry*0.12,rx*0.16,ry*0.06,'rgba(255,200,160,0.08)');
  x.fillStyle='rgba(20,8,8,0.55)'; x.fillRect(cx-rx*0.1,cy+ry*0.4,0.8,0.6); x.fillRect(cx+rx*0.18,cy+ry*0.4,0.8,0.6);
  if(!o.noMouth){ const my=cy+ry*0.62; pE(x,cx+0.5,my+1.2,rx*0.24,ry*0.05,o.lip||'rgba(150,60,60,0.28)'); x.strokeStyle=dk; x.lineWidth=1.4; x.beginPath(); x.moveTo(cx-rx*0.28,my+(o.smile?-1:0)); x.quadraticCurveTo(cx,my+(o.frown?-2:1.5),cx+rx*0.3,my+(o.smile?-3:0)); x.stroke(); pL(x,cx-rx*0.15,my+2.5,cx+rx*0.15,my+2.5,hi,1); }
  if(o.wrinkles){ x.globalAlpha=0.45; for(let i=0;i<3;i++) pL(x,cx-rx*0.4,cy-ry*(0.48+i*0.09),cx+rx*0.4,cy-ry*(0.48+i*0.09),sh,1); pL(x,cx-rx*0.25,cy+ry*0.35,cx-rx*0.4,cy+ry*0.65,sh,1); pL(x,cx+rx*0.25,cy+ry*0.35,cx+rx*0.42,cy+ry*0.65,sh,1); x.globalAlpha=1; }
  if(o.stubble){ x.fillStyle='rgba(30,24,22,0.5)'; for(let i=0;i<120;i++){ const a=Math.random()*Math.PI, r=Math.random(); const px2=cx+Math.cos(a)*rx*0.8*r, py2=cy+ry*0.4+Math.sin(a)*ry*0.55*r; x.fillRect(px2,py2,1,1); } }
}
function rimGrade(x,w,h,warm='rgba(255,140,60,0.28)',cool='rgba(70,90,150,0.2)'){
  x.globalCompositeOperation='source-atop'; const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,cool); g.addColorStop(0.5,'rgba(0,0,0,0)'); g.addColorStop(1,warm); x.fillStyle=g; x.fillRect(0,0,w,h);
  const v=x.createLinearGradient(0,0,0,h); v.addColorStop(0,'rgba(0,0,0,0.25)'); v.addColorStop(0.4,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.45)'); x.fillStyle=v; x.fillRect(0,0,w,h); x.globalCompositeOperation='source-over'; }
const PAINT={
  ilvana(x,w,h){ pP(x,[6,150,16,112,40,98,80,98,104,112,114,150],'#24222c'); pP(x,[22,62,98,62,108,150,12,150],'#1e1c24'); pE(x,60,60,33,42,'#1a1820');
    paintFace(x,{cx:60,cy:64,rx:16,ry:21,skin:[204,184,168],closed:1,jaw:0.4,brow:1.2});
    x.strokeStyle='#c8c4bc'; x.lineWidth=6; x.beginPath(); x.arc(60,64,20,Math.PI*1.12,Math.PI*1.88); x.stroke(); x.strokeStyle='#a8a49c'; x.lineWidth=3; x.beginPath(); x.arc(60,66,19.5,0.15,Math.PI-0.15); x.stroke();
    pP(x,[38,92,82,92,74,104,46,104],'#b8b4ac'); pL(x,60,104,60,118,'#8a7a5a',1); pE(x,60,120,3,4,'#8a7a5a');
    x.fillStyle='#d8d0c0'; x.fillRect(56,116,7,24); pE(x,59.5,111,3,5.5,'#ffd070'); pE(x,59.5,112,1.5,3,'#fff4d0'); pE(x,53,132,6,4,'#c0a890'); pE(x,66,132,6,4,'#c0a890');
    pGlow(x,60,110,44,'rgba(255,170,80,0.32)'); rimGrade(x,w,h,'rgba(255,150,70,0.2)'); },
  brom(x,w,h){ pP(x,[0,150,4,110,30,94,90,94,116,110,120,150],'#3a2c22'); pP(x,[42,96,78,96,74,150,46,150],'#4a4440'); pL(x,40,98,32,150,'#20160e',4); pL(x,80,98,88,150,'#20160e',4); pE(x,34,128,3,3,'#8a6a3a'); pE(x,86,128,3,3,'#8a6a3a');
    pE(x,37,58,3.5,7,'#8a6a52'); pE(x,83,58,3.5,7,'#8a6a52');
    paintFace(x,{cx:60,cy:55,rx:22,ry:25,skin:[184,146,118],jaw:0.72,brow:3.2,browUp:-0.02,noMouth:1,eye:'#2a2018'});
    pE(x,52,34,9,4,'rgba(255,240,220,0.25)');
    pP(x,[38,62,82,62,86,82,74,108,60,116,46,108,34,82],'#36302c'); for(let i=0;i<9;i++) pL(x,42+i*4.5,70,40+i*5,104-Math.abs(i-4)*3,'#5a524c',1); pE(x,60,74,11,3.5,'#2a2420'); pE(x,60,73,8,1.5,'#4a423c');
    pE(x,47,46,5,2,'rgba(20,14,12,0.35)'); pE(x,73,62,4,3,'rgba(20,14,12,0.3)'); pL(x,44,58,48,68,'#d0a090',1.5);
    pGlow(x,118,80,60,'rgba(255,120,40,0.28)'); rimGrade(x,w,h,'rgba(255,120,40,0.38)'); },
  sabela(x,w,h){ pP(x,[4,150,14,112,40,100,80,100,106,112,116,150],'#3e3436'); for(let i=0;i<12;i++) pP(x,[10+i*9,140,14+i*9,150,6+i*9,150],'#2a2224');
    x.fillStyle='#c9a24a'; for(let i=0;i<9;i++){ const a=0.35+i*0.3; pE(x,60+Math.cos(a)*22,96+Math.sin(a)*12,2,2,'#c9a24a'); }
    paintFace(x,{cx:60,cy:63,rx:18,ry:23,skin:[196,164,138],jaw:0.5,wax:1,wrinkles:1,smile:1,eye:'#4a3020'});
    x.strokeStyle='#d4c0a0'; x.lineWidth=1; for(const [a,b,c,d] of [[64,55,72,52],[66,70,73,73],[75,58,79,66]]) pL(x,a,b,c,d,'rgba(120,80,60,0.6)',1);
    x.fillStyle='#5a3438'; x.beginPath(); x.moveTo(38,70); x.bezierCurveTo(34,26,86,26,84,70); x.lineTo(80,52); x.bezierCurveTo(74,40,46,40,40,52); x.closePath(); x.fill();
    x.fillStyle='#7a4a4e'; for(let i=0;i<7;i++) pE(x,44+i*5.5,44-Math.sin(i/6*Math.PI)*6,1.5,1.5,'#9a6a50');
    pE(x,88,58,7,5,'#5a3438'); pP(x,[88,60,98,84,90,86],'#4a2a2e'); x.strokeStyle='#c9a24a'; x.lineWidth=1.5; x.beginPath(); x.arc(41,79,4,0,7); x.stroke();
    rimGrade(x,w,h,'rgba(255,200,90,0.24)'); },
  galvano(x,w,h){ pE(x,24,122,26,17,'#4a443e'); pE(x,96,122,26,17,'#4a443e'); pE(x,22,118,22,12,'#6a625a'); pE(x,98,118,22,12,'#6a625a'); pE(x,18,114,10,4,'#a89a80'); pE(x,94,114,10,4,'#a89a80');
    pP(x,[40,96,80,96,86,150,34,150],'#3e3832'); for(let i=0;i<3;i++){ x.fillStyle=i%2?'#5a524a':'#6a6258'; x.fillRect(42,94+i*7,36,6); }
    for(const [a,b,c,d] of [[12,124,24,130],[24,130,30,124],[100,126,108,121],[90,130,100,126]]){ pL(x,a,b,c,d,'#ff8a3a',1.4); } pGlow(x,22,126,14,'rgba(255,120,40,0.5)'); pGlow(x,100,124,12,'rgba(255,120,40,0.45)');
    paintFace(x,{cx:60,cy:66,rx:15,ry:20,skin:[176,150,132],jaw:0.55,stubble:1,hollow:1,brow:2,frown:1,eye:'#3a3028'});
    const g=x.createLinearGradient(30,0,90,0); g.addColorStop(0,'#3a3632'); g.addColorStop(0.35,'#8a8276'); g.addColorStop(1,'#2e2a26'); x.fillStyle=g;
    x.beginPath(); x.moveTo(38,92); x.lineTo(38,60); x.bezierCurveTo(38,22,82,22,82,60); x.lineTo(82,92); x.lineTo(76,92); x.lineTo(76,60); x.bezierCurveTo(74,44,46,44,44,60); x.lineTo(44,92); x.closePath(); x.fill();
    pP(x,[42,30,78,30,82,44,38,44],'#5a544c'); for(let i=0;i<4;i++) x.fillStyle='#14121a', x.fillRect(46+i*8,36,5,2);
    x.fillStyle='#7a3a3a'; x.beginPath(); x.moveTo(60,26); x.bezierCurveTo(76,6,100,12,108,26); x.bezierCurveTo(96,18,80,20,64,30); x.fill();
    rimGrade(x,w,h,'rgba(255,140,60,0.3)'); },
  tadeo(x,w,h){ pP(x,[2,150,12,110,38,96,82,96,108,110,118,150],'#3a3a40'); for(let i=0;i<10;i++) pP(x,[4+i*12,142,10+i*12,152,0+i*12,152],'#0a0a10');
    pE(x,60,62,30,40,'#4a4a52'); pP(x,[30,64,90,64,100,120,20,120],'#44444c'); pE(x,60,64,22,30,'#16161c');
    paintFace(x,{cx:60,cy:68,rx:15,ry:20,skin:[150,146,140],jaw:0.45,hollow:1,glowEye:'rgba(255,130,50,0.6)',eye:'#ff8a3a',brow:1.2,frown:1});
    pE(x,52,78,4,2,'rgba(40,40,44,0.45)'); pE(x,69,58,3,2,'rgba(40,40,44,0.4)');
    x.fillStyle='#8a8a96'; x.beginPath(); x.moveTo(70,146); x.quadraticCurveTo(66,110,96,90); x.quadraticCurveTo(92,122,70,146); x.fill(); pL(x,70,146,94,92,'#d8d8e0',1); for(let i=0;i<6;i++) pL(x,76+i*3,128-i*6,72+i*3.2,122-i*6.5,'#4a4a56',1);
    pE(x,68,138,6,5,'#9a968e'); rimGrade(x,w,h,'rgba(255,130,60,0.18)','rgba(120,130,170,0.25)'); },
  player(x,w,h,look){
    const L2=look||defaultLook(), sk=LOOK_OPTS.skin[L2.skin][1], skin=[1,3,5].map(i=>parseInt(sk.slice(i,i+2),16)), hair=LOOK_OPTS.hairC[L2.hairC][1], cloak=LOOK_OPTS.cloak[L2.cloak][1], armor=LOOK_OPTS.armor[L2.armor][1], eye=LOOK_OPTS.eyes[L2.eyes][1];
    const wide=L2.body===0?1.12:L2.body===1?0.9:1;
    pP(x,[2,150,60-50*wide,108,40,96,80,96,60+50*wide,108,118,150],shadeHex(cloak,0.55));
    pE(x,60-36*wide,116,18*wide,12,shadeHex(armor,0.7)); pE(x,60+36*wide,116,18*wide,12,shadeHex(armor,0.7)); pE(x,60-37*wide,113,14*wide,7,armor); pE(x,60+35*wide,113,14*wide,7,armor);
    pP(x,[44,98,76,98,80,150,40,150],shadeHex(armor,0.5)); pL(x,60,100,60,150,'#d0a040',1.5);
    if(L2.hair===0){ pE(x,60,60,31,40,shadeHex(cloak,0.6)); pP(x,[28,62,92,62,104,124,16,124],shadeHex(cloak,0.5)); pE(x,60,64,22,29,'#120e14'); }
    if(L2.hair===2){ pP(x,[38,50,82,50,88,112,32,112],shadeHex(hair,0.8)); }
    paintFace(x,{cx:60,cy:66,rx:16,ry:21,skin,jaw:L2.body===0?0.66:L2.body===1?0.4:0.52,eye,glowEye:'rgba('+[1,3,5].map(i=>parseInt(eye.slice(i,i+2),16)).join(',')+',0.5)',brow:L2.body===0?2.2:1.4,stubble:L2.body===0});
    if(L2.hair===0){ x.fillStyle=hair; x.beginPath(); x.moveTo(46,50); x.quadraticCurveTo(60,40,74,50); x.lineTo(70,56); x.quadraticCurveTo(60,48,52,58); x.closePath(); x.fill(); }
    else if(L2.hair===1||L2.hair===2||L2.hair===3){ x.fillStyle=hair; x.beginPath(); x.moveTo(42,64); x.bezierCurveTo(36,30,84,30,78,64); x.lineTo(76,52); x.quadraticCurveTo(62,44,50,54); x.lineTo(44,58); x.closePath(); x.fill();
      x.strokeStyle=shadeHex(hair,1.5); x.lineWidth=1; for(let i=0;i<5;i++){ x.beginPath(); x.moveTo(48+i*6,38); x.quadraticCurveTo(52+i*6,44,48+i*5,52); x.stroke(); }
      if(L2.hair===2){ pP(x,[42,60,46,60,44,104,36,100],hair); pP(x,[74,60,78,60,84,100,76,104],hair); }
      if(L2.hair===3){ for(let i=0;i<6;i++) pE(x,80+i*1.5,70+i*7,4,4.5,i%2?hair:shadeHex(hair,1.3)); } }
    else if(L2.hair===4){ x.globalAlpha=0.35; pE(x,60,46,17,9,shadeHex(hair,0.8)); x.globalAlpha=1; }
    pGlow(x,104,138,26,'rgba(255,190,80,0.45)'); x.fillStyle='#3a3040'; x.fillRect(100,130,8,12); pE(x,104,136,2.5,3.5,'#ffd860');
    rimGrade(x,w,h,'rgba(255,160,70,0.22)'); }
};
// Retrato: pintado a 2x (240x300), luz de contorno cálida/fría, textura de óleo, posterizado con tramado y contorno.
function enhancePortrait(c){
  const w=c.width,h=c.height,x=c.getContext('2d'),im=x.getImageData(0,0,w,h),d=im.data, A=new Uint8Array(w*h);
  for(let p=0;p<w*h;p++) A[p]=d[p*4+3]>100?1:0;
  const op=(X,Y)=>X>=0&&X<w&&Y>=0&&Y<h&&A[Y*w+X];
  for(let Y=0;Y<h;Y++) for(let X=0;X<w;X++){ const p=Y*w+X; if(!A[p]) continue; const i=p*4;
    let rw=0,rc=0; for(let k=1;k<=5;k++){ if(!rw&&!op(X+k,Y-(k>>1))) rw=(6-k)/5; if(!rc&&k<=3&&!op(X-k,Y)) rc=(4-k)/3; }
    const n=(hash2(X>>1,Y>>1,77)-0.5)*14+(hash2(X>>3,Y>>2,91)-0.5)*10;
    const L=(d[i]+d[i+1]+d[i+2])/3, wf=rw*0.42*Math.min(1,0.35+L/120), cf=rc*0.22;
    d[i]=d[i]*(1-wf-cf)+255*wf+120*cf+n; d[i+1]=d[i+1]*(1-wf-cf)+150*wf+140*cf+n; d[i+2]=d[i+2]*(1-wf-cf)+80*wf+210*cf+n; }
  x.putImageData(im,0,0);
}
function outlinePortrait(c){ const w=c.width,h=c.height,x=c.getContext('2d'),im=x.getImageData(0,0,w,h),d=im.data; const A=new Uint8Array(w*h); for(let p=0;p<w*h;p++) A[p]=d[p*4+3]>0?1:0;
  for(let Y=0;Y<h;Y++) for(let X=0;X<w;X++){ const p=Y*w+X; if(A[p]) continue; if((X>0&&A[p-1])||(X<w-1&&A[p+1])||(Y>0&&A[p-w])||(Y<h-1&&A[p+w])){ const i=p*4; d[i]=7; d[i+1]=6; d[i+2]=11; d[i+3]=255; } }
  x.putImageData(im,0,0); }
function portrait(id,look){
  const key=id==='player'?'player:'+JSON.stringify(look||P.look):id; if(PORTRAIT_CACHE[key]) return PORTRAIT_CACHE[key];
  const w=120,h=150,c=mkCanvas(w*2,h*2),x=c.getContext('2d'); x.scale(2,2); PAINT[id](x,w,h,look||P.look); x.setTransform(1,0,0,1,0,0);
  enhancePortrait(c); pixelize(c,9,1); outlinePortrait(c); PORTRAIT_CACHE[key]=c; return c;
}

