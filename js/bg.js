// Fondos parallax generados proceduralmente (ciudad gótica, Luna Abierta, interiores de catedral).
'use strict';
function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function hash2(x,y,s=0){ let h=(x*374761393 + y*668265263 + s*982451653)|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function seeded(seed){ let s=seed%2147483647; if(s<=0) s+=2147483646; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];

function bgExteriorFar(){
  const w=320,h=180,c=mkCanvas(w,h),x=c.getContext('2d'),img=x.createImageData(w,h),d=img.data;
  const R=seeded(77);
  const stops=[[0,[7,4,14]],[0.55,[24,11,34]],[1,[58,24,50]]];
  const col=(t)=>{ for(let i=0;i<stops.length-1;i++){ const [a,ca]=stops[i],[b,cb]=stops[i+1]; if(t<=b){ const k=(t-a)/(b-a); return ca.map((v,j)=>v+(cb[j]-v)*k); } } return stops[2][1]; };
  for(let y=0;y<h;y++) for(let X=0;X<w;X++){
    const cc=col(y/(h-1)); const dth=(BAYER[(y&3)*4+(X&3)]/16-0.5)*7; const i=(y*w+X)*4;
    d[i]=Math.max(0,Math.round((cc[0]+dth)/3)*3); d[i+1]=Math.max(0,Math.round((cc[1]+dth)/3)*3); d[i+2]=Math.max(0,Math.round((cc[2]+dth)/3)*3); d[i+3]=255;
  }
  const set=(X,Y,r,g,b,a=1)=>{ if(X<0||Y<0||X>=w||Y>=h) return; const i=(Y*w+X)*4; d[i]=d[i]*(1-a)+r*a; d[i+1]=d[i+1]*(1-a)+g*a; d[i+2]=d[i+2]*(1-a)+b*a; };
  for(let i=0;i<110;i++){ const X=Math.floor(R()*w), Y=Math.floor(R()*120), b=120+R()*135; const p=R()<0.2; set(X,Y,p?b:b,p?b*0.6:b*0.95,p?b:b,1); }
  // La Luna Abierta: una luna con una pupila vertical
  const cx=238, cy=50, Rr=25;
  for(let dy=-Rr-9;dy<=Rr+9;dy++) for(let dx=-Rr-9;dx<=Rr+9;dx++){
    const dist=Math.hypot(dx,dy), X=cx+dx, Y=cy+dy;
    if(dist<=Rr){
      const nx=dx/Rr, ny=dy/Rr; let sh=0.78+0.22*(-(nx+ny)/1.4);
      if(hash2(Math.floor(X/3),Math.floor(Y/3),3)<0.12) sh*=0.86;
      let r=214*sh,g=202*sh,b=226*sh;
      const slit=(1-ny*ny)*0.16;
      if(Math.abs(nx)<slit){ r=24;g=4;b=16; }
      else if(Math.abs(nx)<slit+0.13 && Math.abs(ny)<0.88){ r=128;g=28;b=58; }
      else if(Math.abs(nx)<slit+0.17 && Math.abs(ny)<0.9){ r=170;g=70;b=90; }
      set(X,Y,r,g,b,1);
    } else if(dist<Rr+9){
      const a=(1-(dist-Rr)/9)*0.5; if(BAYER[(Y&3)*4+(X&3)]/16 < a) set(X,Y,150,110,170,0.55);
    }
  }
  // Nubes de ceniza cruzando
  for(let band=0;band<5;band++){
    const by=30+band*14+Math.floor(R()*6), len=80+R()*140, bx=R()*w;
    for(let X=0;X<len;X++) for(let t=0;t<3;t++){
      if(hash2(X,band,t+9)<0.75) set(Math.floor(bx+X)%w, by+t+Math.floor(Math.sin(X*0.05+band)*2), 18,9,26,0.85);
    }
  }
  x.putImageData(img,0,0); return c;
}

function bgSpires(w,h,color,win,seed,minH,maxH){
  const c=mkCanvas(w,h), x=c.getContext('2d'), R=seeded(seed);
  const rect=(a,b,cw,ch)=>{ x.fillRect(a,b,cw,ch); x.fillRect(a-w,b,cw,ch); x.fillRect(a+w,b,cw,ch); };
  let px=0;
  while(px<w){
    const bw=Math.floor(18+R()*36), bh=Math.floor(minH+R()*(maxH-minH)), top=h-bh;
    x.fillStyle=color; rect(px,top,bw,bh);
    const rh=Math.floor(8+R()*16);
    for(let i=0;i<rh;i++){ const ww=Math.max(1,Math.floor(bw*(1-i/rh))); rect(px+Math.floor((bw-ww)/2), top-i-1, ww, 1); }
    if(R()<0.65){ const sx=px+Math.floor(bw/2)-1, sh=Math.floor(12+R()*28); rect(sx, top-rh-sh, 2, sh); rect(sx-1, top-rh-sh+3, 4, 1); }
    if(R()<0.5){ const th=bh+Math.floor(R()*24), tx=px-3; rect(tx, h-th, 6, th); for(let i=0;i<8;i++){ const ww=Math.max(1,6-Math.floor(i*0.75)); rect(tx+Math.floor((6-ww)/2), h-th-i-1, ww, 1); } }
    x.fillStyle=win;
    const rows=Math.floor(bh/14);
    for(let ry=0;ry<rows;ry++) for(let rx=3;rx<bw-3;rx+=5){ if(R()<0.22){ rect(px+rx, top+6+ry*14, 2, 4); rect(px+rx, top+5+ry*14+0, 1, 1); } }
    if(R()<0.4){ const wy=top+8; x.fillStyle=win; rect(px+Math.floor(bw/2)-2, wy, 4, 7); rect(px+Math.floor(bw/2)-1, wy-1, 2, 1); }
    px+=bw+Math.floor(R()*8)-2;
  }
  return c;
}

function pline(x, x0,y0,x1,y1, t=1){
  const dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), n=Math.max(dx,dy,1);
  for(let i=0;i<=n;i++){ const X=Math.round(x0+(x1-x0)*i/n), Y=Math.round(y0+(y1-y0)*i/n); x.fillRect(X-Math.floor(t/2),Y-Math.floor(t/2),t,t); }
}
function bgNear(w,h,color,seed){
  const c=mkCanvas(w,h), x=c.getContext('2d'), R=seeded(seed); x.fillStyle=color;
  for(let X=0;X<w;X++){ const gh=12+Math.round(Math.sin(X*0.045)*3+Math.sin(X*0.13)*1.5); x.fillRect(X,h-gh,1,gh); }
  // reja de cementerio
  for(let X=0;X<w;X+=5){ x.fillRect(X,h-26,1,14); x.fillRect(X,h-28,1,1); }
  x.fillRect(0,h-24,w,1); x.fillRect(0,h-17,w,1);
  // árboles muertos
  const branch=(x0,y0,ang,len,dep)=>{ const x1=x0+Math.cos(ang)*len, y1=y0+Math.sin(ang)*len; pline(x,x0,y0,x1,y1,dep>3?2:1); if(dep<=0) return; branch(x1,y1,ang-0.3-R()*0.5,len*0.72,dep-1); if(R()<0.8) branch(x1,y1,ang+0.3+R()*0.5,len*0.68,dep-1); };
  for(let i=0;i<4;i++){ const tx=30+i*(w/4)+R()*40; branch(tx,h-12,-Math.PI/2+(R()-0.5)*0.3,22+R()*14,5); }
  // cruces y lápidas
  for(let i=0;i<14;i++){ const gx=Math.floor(R()*w), gh=5+Math.floor(R()*5); x.fillRect(gx,h-14-gh,2,gh); if(R()<0.6) x.fillRect(gx-1,h-14-gh+2,4,1); else x.fillRect(gx-1,h-14-gh,4,gh); }
  return c;
}

function bgInteriorFar(stone){
  const w=320,h=180,c=mkCanvas(w,h),x=c.getContext('2d'),img=x.createImageData(w,h),d=img.data;
  const [sr,sg,sb]=stone.map(v=>v*0.42);
  for(let y=0;y<h;y++) for(let X=0;X<w;X++){
    const row=y>>3, bx=X+((row&1)?8:0), mort=(y&7)===7||(bx&15)===15;
    const v=mort?0.6:0.85+hash2(bx>>4,row,4)*0.25; const i=(y*w+X)*4;
    d[i]=sr*v; d[i+1]=sg*v; d[i+2]=sb*v; d[i+3]=255;
  }
  const set=(X,Y,r,g,b)=>{ if(X<0||Y<0||X>=w||Y>=h) return; const i=(Y*w+X)*4; d[i]=r;d[i+1]=g;d[i+2]=b; };
  const glass=[[70,22,52],[34,28,84],[84,52,22],[26,60,58],[96,30,40]];
  const windowAt=(wx,wy,ww,wh)=>{
    for(let y=0;y<wh;y++) for(let X=0;X<ww;X++){
      const half=ww/2, ax=Math.abs(X-half+0.5)/half; const archH=ww*0.9;
      if(y<archH){ const yy=1-y/archH; if(ax>Math.sqrt(1-yy*yy)*1.0 || ax>1-yy*0.9) continue; }
      let col=glass[Math.floor(hash2(Math.floor(X/4),Math.floor(y/5),wx)*glass.length)];
      if(X%7===3 || (y%10===0 && y>archH)) col=[12,8,16];
      const f=0.55+0.45*(y/wh); set(wx+X,wy+y,col[0]*f,col[1]*f,col[2]*f);
    }
  };
  windowAt(36,46,24,84); windowAt(196,46,24,84);
  // rosetón
  const rx=128, ry=60, rr=20;
  for(let dy=-rr;dy<=rr;dy++) for(let dx=-rr;dx<=rr;dx++){
    const dist=Math.hypot(dx,dy); if(dist>rr) continue; const a=Math.atan2(dy,dx);
    let col=glass[(Math.floor((a+Math.PI)/(Math.PI/6))+ (dist>rr*0.55?2:0))%glass.length];
    if(dist>rr-2 || dist<4 || Math.abs(Math.sin(a*6))<0.12 || Math.abs(dist-rr*0.55)<1) col=[12,8,16];
    set(rx+dx,ry+dy,col[0]*0.8,col[1]*0.8,col[2]*0.8);
  }
  x.putImageData(img,0,0);
  // haces de luz
  x.globalAlpha=0.05; x.fillStyle='#b9a6d8';
  for(const sx of [48,208,128]){ x.beginPath(); x.moveTo(sx-8,50); x.moveTo(sx+8,50); x.lineTo(sx+60,180); x.lineTo(sx+20,180); x.lineTo(sx-8,50); x.fill(); }
  x.globalAlpha=1;
  return c;
}
function bgColumns(w,h,color,light,spacing,seed){
  const c=mkCanvas(w,h), x=c.getContext('2d');
  for(let cx=0; cx<w; cx+=spacing){
    x.fillStyle=color;
    x.fillRect(cx, 26, 12, h-26); x.fillRect(cx-3, 24, 18, 4); x.fillRect(cx-3, h-10, 18, 10);
    x.fillStyle=light; x.fillRect(cx+2, 28, 1, h-38);
    x.fillStyle=color;
    const a0=cx+12, a1=cx+spacing, mid=(a0+a1)/2, half=(a1-a0)/2;
    for(let X=a0; X<a1; X++){
      const u=Math.abs(X+0.5-mid)/half; const ay=Math.round(26 - (1-u)*0 - Math.sqrt(Math.max(0,1-Math.pow(u,1.6)))*20);
      x.fillRect(X%w, 0, 1, Math.max(0,ay));
      x.fillRect(X%w, ay, 1, 3);
    }
  }
  return c;
}
const BG_CACHE = {};
function getBg(type, stone){
  const key = type+':'+stone.join(',');
  if (BG_CACHE[key]) return BG_CACHE[key];
  let L;
  if (type==='exterior'){
    L = { sky:'#07040e', layers:[
      {img:bgExteriorFar(), p:0.03, py:0.02},
      {img:bgSpires(640,180,'#1c1228','#5a2a36',11,50,110), p:0.15, py:0.08},
      {img:bgSpires(640,180,'#140c1c','#7a3a2a',23,30,80), p:0.3, py:0.15},
      {img:bgNear(640,180,'#0b0710',5), p:0.55, py:0.3}
    ]};
  } else {
    const dk = stone.map(v=>Math.floor(v*0.28)), lt = stone.map(v=>Math.floor(v*0.45));
    L = { sky:'#05030a', layers:[
      {img:bgInteriorFar(stone), p:0.12, py:0.08},
      {img:bgColumns(320,180,`rgb(${dk})`,`rgb(${lt})`,80,3), p:0.4, py:0.2}
    ]};
  }
  BG_CACHE[key]=L; return L;
}
