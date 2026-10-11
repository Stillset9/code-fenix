// Fuente bitmap 3x5 propia (mayúsculas + acentos del español). Dibujada píxel a píxel.
'use strict';
const FONT = {
  'A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110',
  'E':'111100110100111','F':'111100110100100','G':'011100101101011','H':'101101111101101',
  'I':'111010010010111','J':'001001001101010','K':'101101110101101','L':'100100100100111',
  'M':'101111111101101','N':'110101101101101','O':'010101101101010','P':'110101110100100',
  'Q':'010101101110011','R':'110101110101101','S':'011100010001110','T':'111010010010010',
  'U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101',
  'Y':'101101010010010','Z':'111001010100111',
  '0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
  '4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010',
  '8':'111101111101111','9':'111101111001110',
  '.':'000000000000010',',':'000000000010100',':':'000010000010000','!':'010010010000010',
  '¡':'010000010010010','?':'110001010000010','¿':'010000010100011','-':'000000111000000',
  '+':'000010111010000','/':'001001010100100','(':'010100100100010',')':'010001001001010',
  "'":'010010000000000','"':'101101000000000','%':'101001010100101','>':'100010001010100',
  '<':'001010100010001','=':'000111000111000','↑':'010111010010010','↓':'010010010111010',
  '·':'000000010000000','←':'001011111011001','→':'100110111110100','[':'110100100100110',']':'011001001001011','|':'010010010010010','#':'101111101111101','&':'010101010101011','*':'000101010101000'
};
const ACC = {'Á':['A','a'],'É':['E','a'],'Í':['I','a'],'Ó':['O','a'],'Ú':['U','a'],'Ñ':['N','t'],'Ü':['U','d']};
function textWidth(str, s=1){ return Math.max(0, String(str).length*4*s - s); }
function drawText(ctx, str, x, y, color, s=1, align='left', shadow=null){
  str = String(str).toUpperCase();
  const w = textWidth(str, s);
  if (align === 'center') x -= Math.floor(w/2); else if (align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (shadow) drawText0(ctx, str, x+s, y+s, shadow, s);
  drawText0(ctx, str, x, y, color, s);
}
function drawText0(ctx, str, x, y, color, s){
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of str){
    let base = ch, acc = null;
    if (ACC[ch]){ base = ACC[ch][0]; acc = ACC[ch][1]; }
    const gl = FONT[base];
    if (gl){ for (let i=0;i<15;i++) if (gl[i]==='1') ctx.fillRect(cx+(i%3)*s, y+((i/3)|0)*s, s, s); }
    if (acc==='a'){ ctx.fillRect(cx+2*s, y-2*s, s, s); }
    else if (acc==='t'){ ctx.fillRect(cx, y-2*s, 3*s, s); }
    else if (acc==='d'){ ctx.fillRect(cx, y-2*s, s, s); ctx.fillRect(cx+2*s, y-2*s, s, s); }
    cx += 4*s;
  }
}
function wrapText(str, maxChars){
  const words = String(str).split(' '); const lines = []; let line = '';
  for (const w of words){
    if ((line + (line?' ':'') + w).length > maxChars){ if (line) lines.push(line); line = w; }
    else line += (line?' ':'') + w;
  }
  if (line) lines.push(line);
  return lines;
}
