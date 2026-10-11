// Sprites originales en pixel art, definidos como matrices de caracteres -> canvas.
'use strict';
const PAL = {
  k:'#07060b', h:'#2a2238', H:'#4a3f63', f:'#e4d6c0', e:'#ffd860', c:'#4a1426', C:'#7f2440',
  g:'#d0a040', b:'#1b1522',
  p:'#4f5f4a', P:'#879a78', r:'#ff5a3a', d:'#26322a',
  W:'#a99cc6', w:'#6a5e8a', E:'#ff3d6a', m:'#2a2238',
  o:'#7a5a2a', O:'#b8893a', a:'#454a5a', A:'#6c7286', s:'#30343f',
  n:'#4a4558', N:'#7a7590', v:'#d8d0c8', y:'#ff9a3a', u:'#b08a6a', z:'#5a4a40', l:'#4a3020', L:'#7a5232',
  q:'#4a3a2a', Q:'#6e5a42', j:'#33251a', x:'#b0b4c4'
};
function makeSprite(rows){
  const h = rows.length, w = rows[0].length;
  for (let i=0;i<h;i++) if (rows[i].length !== w) console.warn('sprite row width mismatch', i, rows[i]);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let j=0;j<h;j++) for (let i=0;i<w;i++){
    const ch = rows[j][i];
    if (ch !== '.' && PAL[ch]){ x.fillStyle = PAL[ch]; x.fillRect(i,j,1,1); }
  }
  const fl = document.createElement('canvas'); fl.width = w; fl.height = h;
  const fx = fl.getContext('2d'); fx.drawImage(c,0,0); fx.globalCompositeOperation='source-in';
  fx.fillStyle = '#fff6ee'; fx.fillRect(0,0,w,h);
  return { img:c, flash:fl, w, h };
}
function drawSprite(ctx, spr, x, y, flip, flash, sy=1){
  const im = flash ? spr.flash : spr.img;
  x = Math.round(x); y = Math.round(y);
  const hh = Math.max(1, Math.round(spr.h*sy)); const oy = spr.h - hh;
  if (flip){ ctx.save(); ctx.translate(x+spr.w, y+oy); ctx.scale(-1,1); ctx.drawImage(im,0,0,spr.w,hh); ctx.restore(); }
  else ctx.drawImage(im, x, y+oy, spr.w, hh);
}

// --- Odra, la farolera ---
const BODY = [
  "....kkkk....",
  "...kHhhhk...",
  "..kHhhhhhk..",
  "..khhhkffk..",
  "..khhkffek..",
  "..khhhkffk..",
  "...kcckkk...",
  "..kcCCCcck..",
  ".kcCCCCCCgk.",
  ".kcCCgCCCck.",
  ".kccCCCCcck.",
  "..kcccccck.."
];
const LEGS = {
  idle:["..kbbkkbbk..","..kbk..kbk..","..kbk..kbk..",".kkbk.kkbk.."],
  run1:["..kbbkkbbk..",".kbk....kbk.","kbk......kbk","kk........kk"],
  run2:["...kbbbbk...","...kbkkbk...","...kbk.kbk..","..kkk..kkk.."],
  jump:["..kbbkkbbk..","..kbk.kbk...","...kbkkbk...","....kk.kk..."],
  kneel:["..kbbbbbbk..",".kbbk.kbk...",".kkk..kkk...","............"]
};
const SPR = {};
function buildSprites(){
  SPR.roll = makeSprite([
    "...kkkk...",
    "..kHhhck..",
    ".kHhhcCCk.",
    "kHhffcCCCk",
    "khffecCCCk",
    "kccccCCCCk",
    "kcCCCCCCck",
    ".kcCCCCck.",
    "..kcccck..",
    "...kkkk..."
  ]);
  SPR.dead = makeSprite([
    "........kkk...",
    "..kkkkkkHhhk..",
    ".kcCCCCCcfhk..",
    "kcCCCgCCCcck..",
    "kkkkkkkkkkkk.."
  ]);
  const ahoTop = [
    "....kkkk....",
    "...kPPPPk...",
    "..kPrPPrPk..",
    "..kPPPPPPk..",
    "...kpPPpk...",
    "..kpPPPPpkk.",
    ".kpPPpppPPpk",
    ".kpkpppppkpk",
    "...kppppppk.",
    "...kpppppk.."
  ];
  SPR.aho1 = makeSprite(ahoTop.concat(["...kdk.kdk..","..kdk...kdk.","..kk.....kk."]));
  SPR.aho2 = makeSprite(ahoTop.concat(["....kdkkdk..","....kdkdk...","...kk..kk..."]));
  SPR.moth = makeSprite([
    "kk........kk",
    "kWkk....kkWk",
    "kWWWk..kWWWk",
    "kWEWWkkWWEWk",
    "kWWWWmmWWWWk",
    ".kwWkmmkWwk.",
    "..kk.mm.kk..",
    ".....kk....."
  ]);
  SPR.bell = makeSprite([
    ".....kkkk.....",
    "....kOOOok....",
    "...kOOOOook...",
    "...kOOoOook...",
    "..kOOkkkOOok..",
    "..kkkkkkkkkk..",
    "....kaAAak....",
    "...kaAAAAak...",
    "..kaaAAAAassk.",
    "..kaAAAAAAssk.",
    "..kaAAAAAAssk.",
    "..kaaAAAAassk.",
    "...kaaaaassk..",
    "...kaAaaassk..",
    "...kaaaaaak...",
    "...kakkkkak...",
    "...kak..kak...",
    "...kak..kak...",
    "..kaak..kaak..",
    "..kkkk..kkkk.."
  ]);
  SPR.ilvana = makeSprite([
    "....kkkk....","...kvvvvk...","..kvvnnvvk..","..kvnffnvk..","..kvfkfkvk..","..kvnffnvk..",
    "...knnnnk...","..knNNNNnk..",".knNNyyNNnk.",".knNNyyNNnk.",".knnNNNNnnk.",".knNNNNNNnk.",
    ".knnNNNNnnk.","..knNNNNnk..","..knnnnnnk..","..kkkkkkkk.."]);
  SPR.brom = makeSprite([
    "....kkkkk.....","...kuuuuuk....","...kukuuku....","...kuuuuuk....","...kzzzzzk....","..kzzzzzzzk...",
    ".kuullllluuk..","kuuulLLLluuuk.","kuk.lLLLl.kuk.","kuk.lLLLl.kAk.","kk..lLLLl..AA.","....lLLLl.....",
    "....lllll.....","....kbkbk.....","....kbkbk.....","...kkk.kkk...."]);
  SPR.sabela = makeSprite([
    "............","......kkkk..",".kkk.kqqqqk.","kjjjkqfffqk.","kjjjkqfkgqk.","kjjjkqfffqk.",
    "kjjjjkqqqk..","kjjjjqQQQqk.","kjjjqQQQQQqk",".kkjqQQgQQqk","...kqQQQQqk.","...kqQQQQqk.",
    "...kqqqqqqk.","....kbkkbk..","....kbk.kb..","...kkk.kkk.."]);
  SPR.galvano = makeSprite([
    "......CC......",".....CCCk.....","....kAAAAk....","....kAkkAk..x.","....kAAAAk.xxx","...kaaAAaak.x.",
    "..kaAAAAAAakx.","..kaAsAAsAakx.","..kaaAAAAaakx.","...kaaaaaak.x.","..kaaaaaaaakx.",".kaak....kaakx",
    ".kaak....kaak.","kkkk....kkkk.."]);
  SPR.tadeo = makeSprite([
    "..........kkk...",".kkkkkkkkkqffk..","kqqQQQqqqQqfkk..","kqQQgQQQqqqqk...","kkkkkkkkkkkkk...","................"]);
  SPR.key = makeSprite([
    ".kkk....",
    "kfffk...",
    "kfkfkkkk",
    "kfffffff",
    ".kkk.kfk",
    ".....kk."
  ]);
  SPR.wing = makeSprite([
    "......kk",
    "....kkhk",
    "..kkhhHk",
    ".khhHHk.",
    "khhHHk..",
    "khHHk...",
    ".kHk.k..",
    "..k.k..."
  ]);
}

// ---------------- Creador de personaje: sprites según apariencia ----------------
const LOOK_OPTS = {
  names:['ODRA','AREN','VESNA','KAEL','NURI','ILO','SAREN','MAREK','LIA','ISOLDA','BRUNO','ALEX'],
  body:['MASCULINO','FEMENINO','NEUTRO'],
  skin:[['PORCELANA','#f0dcc8'],['TRIGO','#e4c4a0'],['CANELA','#c8986a'],['BRONCE','#9a6a44'],['ÉBANO','#6a442a'],['CENIZA','#b8b0c8']],
  hair:['CAPUCHA','CORTO','LARGO','TRENZA','RAPADO'],
  hairC:[['AZABACHE','#1e1820'],['CASTAÑO','#4a2a1a'],['COBRE','#8a4a22'],['RUBIO','#c8a050'],['CANO','#d8d0c8'],['BRASA','#a0281e'],['NOCHE','#3a3a72']],
  eyes:[['ASCUA','#ffd860'],['HIELO','#7ad0ff'],['MUSGO','#9fe08a'],['SANGRE','#ff4040'],['VACÍO','#c8a8ff'],['PERLA','#f4f4f4']],
  cloak:[['CARMESÍ','#7f2440'],['AÑIL','#2a4a7a'],['MUSGO','#3a5a3a'],['CIRUELA','#5a3a6a'],['OCRE','#7a5a2a'],['HOLLÍN','#2a2a32'],['ÁMBAR','#a05a20']],
  armor:[['ACERO','#6c7286'],['BRONCE','#8a6a3a'],['NEGRO','#34343e'],['PLATA','#a8a8b8'],['CUERO','#6a3a2a']]
};
function defaultLook(){ return {name:'ODRA',body:1,skin:0,hair:0,hairC:0,eyes:0,cloak:0,armor:0}; }
function shadeHex(hex,f){ const n=parseInt(hex.slice(1),16); const c=[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*f)))); return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''); }
const HEADS = {
  0:["....kkkk....","...kOOOOk...","..kOooooOk..","..koookhfk..","..kookffek..","..koookffk.."],
  1:["....kkkk....","...khHHhk...","..khHHHHhk..","..khhffffk..","..khfffefk..","...kfffFk..."],
  2:["...kkkkk....","..khHHHhk...",".khHHHHHhk..",".khhhffffk..",".khhfffefk..",".khhkfffFk.."],
  3:["....kkkk....","...khHHhk...","..khHHHHhk..","..khhffffk..","..khfffefk..","..hkfffFk..."],
  4:["....kkkk....","...kFFFFk...","..kFffffFk..","..kfffffFk..","..kffffefk..","...kfffFk..."]
};
const BODIES = {
  0:["..kkcmmkkk..",".kMMcMMMcMMk",".kmCmMMmCmgk",".kcCmMgmCcck",".kccCmmCccck","..kccccccck."],
  1:["...kcmmkk...","...kMMMMk...","..kcmMMmgk..","..kCmggmCk..",".kcCCmmCCck.","kcccccccccck"],
  2:["...kcmmkk...","..kcMMMMck..",".kcCmMMmCgk.",".kcCmMgmCck.",".kccCmmCcck.","..kcccccck.."]
};
const HAIR_OVER = { 2:[[1,6],[1,7],[2,8],[1,8]], 3:[[2,6],[1,7],[2,8],[1,9],[2,10]] };
function lookPalette(look){
  const skin=LOOK_OPTS.skin[look.skin][1], hair=LOOK_OPTS.hairC[look.hairC][1], cloak=LOOK_OPTS.cloak[look.cloak][1], armor=LOOK_OPTS.armor[look.armor][1];
  return { k:'#07060b', f:skin, F:shadeHex(skin,0.78), e:LOOK_OPTS.eyes[look.eyes][1], h:hair, H:shadeHex(hair,1.45),
    O:shadeHex(cloak,0.75), o:shadeHex(cloak,0.5), c:shadeHex(cloak,0.62), C:cloak, m:shadeHex(armor,0.7), M:armor, g:'#d0a040', b:'#1b1522' };
}
function makeSpritePal(rows,pal){
  const h=rows.length, w=rows[0].length;
  for(let i=0;i<h;i++) if(rows[i].length!==w) console.warn('sprite row width mismatch',i,rows[i]);
  const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const ch=rows[j][i]; if(ch!=='.'&&pal[ch]){ x.fillStyle=pal[ch]; x.fillRect(i,j,1,1); } }
  const fl=document.createElement('canvas'); fl.width=w; fl.height=h; const fx=fl.getContext('2d'); fx.drawImage(c,0,0); fx.globalCompositeOperation='source-in'; fx.fillStyle='#fff6ee'; fx.fillRect(0,0,w,h);
  return {img:c,flash:fl,w,h};
}
function playerRows(look,legs){
  const rows=HEADS[look.hair].concat(BODIES[look.body],LEGS[legs]).map(r=>r.split(''));
  for(const [x,y] of (HAIR_OVER[look.hair]||[])) if(rows[y][x]==='.'||rows[y][x]==='k') rows[y][x]=(y%2?'H':'h');
  return rows.map(r=>r.join(''));
}
function buildPlayerSprites(look){
  look=look||defaultLook(); const pal=lookPalette(look);
  for(const k in LEGS) SPR['p_'+k]=makeSpritePal(playerRows(look,k),pal);
  const hoodC=look.hair===0, rp=Object.assign({},pal); if(!hoodC){ rp.O=pal.H; rp.o=pal.h; } if(look.hair===4){ rp.O=pal.f; rp.o=pal.F; }
  SPR.roll=makeSpritePal(["...kkkk...","..kOoock..",".kOoocCCk.","kOoffcCCCk","koffecCCCk","kccccCCCCk","kcCCCCCCck",".kcCCCCck.","..kcccck..","...kkkk..."],rp);
  SPR.dead=makeSpritePal(["........kkk...","..kkkkkkOook..",".kcCCmmCcfok..","kcCCCgCCCcck..","kkkkkkkkkkkk.."],rp);
}
