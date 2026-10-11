// Mapa de Velmora (CODE FENIX). Grilla de tiles de 8px.
// '#' piedra  '=' plataforma  '^' púas  'D' reja de hueso  1-9 salidas  a-e apariciones
// 'A' pira de renacer   'G' ahogado  'V' polilla  'C' campanero  'O' Ordoño (campanero mayor)  'J' jefa
'use strict';
const TILE = 8;
function makeRoom(w, h){
  const g = []; for (let y=0;y<h;y++) g.push(new Array(w).fill('.'));
  const r = { w, h, g,
    f(x,y,ww,hh,c){ for (let j=y;j<y+hh;j++) for (let i=x;i<x+ww;i++) if (i>=0&&j>=0&&i<w&&j<h) g[j][i]=c; return r; },
    p(x,y,c){ if (x>=0&&y>=0&&x<w&&y<h) g[y][x]=c; return r; },
    box(){ r.f(0,0,w,2,'#'); r.f(0,h-2,w,2,'#'); r.f(0,0,2,h,'#'); r.f(w-2,0,2,h,'#'); return r; }
  };
  return r;
}
const ROOMS = {
  atrio: {
    name:'Atrio de las Cenizas', bg:'exterior', stone:[46,39,58], dark:0.18,
    exits:{'1':{to:'refugio',at:'a'}},
    signs:[
      {x:3,y:20,t:'Pira de Renacer. Pulsá E (o ↑) para descansar: te cura, recarga todo y guarda la partida... pero los muertos se levantan otra vez.',tt:'Pira de Renacer. Tocá E para descansar: te cura, recarga todo y guarda la partida... pero los muertos se levantan otra vez.'},
      {x:12,y:20,t:'← → o A D para moverte. Espacio o Z para saltar: si lo mantenés apretado, saltás más alto.',tt:'Usá el stick de la izquierda para moverte. SALTO salta: si lo mantenés apretado, saltás más alto.'},
      {x:19,y:18,t:'J o X: ataque ligero en combo. K o C: ataque pesado. Si lo mantenés, cargás el Arte de tu arma (gasta Foco).',tt:'ATAQUE: ataque ligero en combo. PESADO: ataque pesado. Si lo mantenés, cargás el Arte de tu arma (gasta Foco).'},
      {x:31,y:20,t:'Shift: esquivar rodando, sin recibir daño. Q: parada justo antes del golpe. Si el enemigo queda aturdido, J lo remata con un crítico.',tt:'ESQUIVA: rodás sin recibir daño. PARADA: justo antes del golpe. Si el enemigo queda aturdido, ATAQUE lo remata con un crítico.'},
      {x:49,y:20,t:'L o V: disparo secundario. Si le pegás a un enemigo mientras carga un ataque, lo interrumpís. R: Lágrima de Fénix. I: inventario.',tt:'DISPARO: arma secundaria. Si le pegás a un enemigo mientras carga un ataque, lo interrumpís. CURAR: Lágrima de Fénix. BOLSA: inventario.'},
      {x:58,y:20,t:'Inscripción gastada: "Ystrel ardió primero, y con su ceniza escribió: lo que arde, vuelve."'}
    ],
    build(){
      const r = makeRoom(64,23).box();
      r.f(2,0,60,2,'.');
      r.f(62,18,2,3,'.').f(63,18,1,3,'1');
      r.f(16,19,6,2,'#'); r.f(26,16,6,1,'='); r.f(38,17,4,1,'='); r.f(44,15,2,6,'#');
      r.p(6,20,'A'); r.p(9,20,'a'); r.p(59,20,'b');
      r.p(27,20,'G'); r.p(54,20,'G'); r.p(36,9,'V');
      return r;
    }
  },
  refugio: {
    name:'Refugio de la Pira', bg:'interior', stone:[56,42,38], dark:0.3, safe:true,
    exits:{'1':{to:'atrio',at:'b'}, '2':{to:'nave',at:'a'}, '3':{to:'galeria',at:'a'}},
    npcs:[{id:'brom',x:13,y:20},{id:'ilvana',x:25,y:20},{id:'sabela',x:37,y:20}],
    props:[{t:'forge',x:8,y:20},{t:'stall',x:40,y:20}],
    signs:[{x:20,y:20,t:'Refugio de la Pira. Aquí arde la última llama que todavía recuerda su nombre.'},
           {x:45,y:20,t:'Arriba, por encima de las vigas, se ve el resplandor rojo de la Galería Quemada. Demasiado alto para un solo salto.'}],
    build(){
      const r = makeRoom(64,23).box();
      r.f(0,18,2,3,'.').f(0,18,1,3,'1');
      r.f(62,18,2,3,'.').f(63,18,1,3,'2');
      r.f(46,1,13,1,'.'); r.f(50,0,4,1,'3');
      r.f(47,17,7,1,'='); r.f(40,10,7,1,'='); r.f(49,3,6,1,'=');
      r.f(16,2,6,2,'#'); r.f(30,2,4,3,'#');
      r.p(30,20,'A'); r.p(3,20,'a'); r.p(60,20,'b'); r.p(51,2,'c');
      return r;
    }
  },
  nave: {
    name:'Nave de Sereth', bg:'interior', stone:[40,34,54], dark:0.46,
    exits:{'1':{to:'refugio',at:'b'}, '2':{to:'osario',at:'a'}, '3':{to:'campanario',at:'a'}},
    npcs:[{id:'galvano',x:8,y:20}],
    signs:[
      {x:49,y:20,t:'Una cornisa altísima se pierde en la oscuridad. Alguien con alas podría llegar.'},
      {x:22,y:20,t:'Relieve de una diosa con la boca llena de agua. Debajo dice: "Sereth bebió el diluvio para que nosotros no nos ahogáramos".'}
    ],
    build(){
      const r = makeRoom(96,23).box();
      r.f(0,18,2,3,'.').f(0,18,1,3,'1');
      r.f(94,18,2,3,'.').f(95,18,1,3,'2');
      r.f(50,1,13,1,'.'); r.f(55,0,4,1,'3');
      r.f(28,21,8,1,'.'); r.f(28,22,8,1,'^');
      r.f(30,17,4,1,'='); r.f(12,17,5,1,'=');
      r.f(52,17,7,1,'='); r.f(45,10,7,1,'='); r.f(54,3,6,1,'=');
      r.f(62,17,3,4,'#'); r.f(74,16,6,1,'=');
      r.f(20,2,3,2,'#'); r.f(70,2,4,3,'#'); r.f(84,2,3,2,'#');
      r.p(3,20,'a'); r.p(92,20,'b'); r.p(56,2,'c');
      r.p(18,20,'G'); r.p(40,20,'G'); r.p(68,20,'G');
      r.p(34,9,'V'); r.p(77,8,'V'); r.p(85,20,'C');
      return r;
    }
  },
  osario: {
    name:'Osario de los Pabilos', bg:'interior', stone:[50,44,40], dark:0.5,
    exits:{'1':{to:'nave',at:'b'}, '2':{to:'santuario',at:'a'}},
    items:[{id:'alas',x:53,y:12},{id:'fragmento',x:25,y:17}],
    signs:[
      {x:62,y:20,t:'Una reja de hueso tallado, sellada. Le falta su llave. Detrás se oye un coro, muy lejos.'},
      {x:8,y:20,t:()=>'Nichos con miles de pabilos apagados. Cada uno lleva el nombre de alguien de la Orden. Uno de ellos dice '+PNAME()+', y está recién encendido.'}
    ],
    build(){
      const r = makeRoom(72,23).box();
      r.f(2,2,68,2,'#');
      r.f(0,18,2,3,'.').f(0,18,1,3,'1');
      r.f(70,18,2,3,'.').f(71,18,1,3,'2');
      r.f(64,4,6,14,'#'); r.f(66,18,2,3,'D');
      r.f(24,19,4,2,'#');
      r.f(44,17,5,1,'='); r.f(50,13,6,1,'=');
      r.p(3,20,'a'); r.p(68,20,'b'); r.p(12,20,'A');
      r.p(20,20,'G'); r.p(36,20,'C'); r.p(58,20,'G'); r.p(40,9,'V');
      return r;
    }
  },
  galeria: {
    name:'Galería Quemada', bg:'interior', stone:[60,38,32], dark:0.48,
    exits:{'1':{to:'refugio',at:'c'}},
    npcs:[{id:'tadeo',x:75,y:20}],
    items:[{id:'impulso',x:31,y:12},{weapon:'mandoble',x:64,y:19},{id:'fragmento',x:71,y:12}],
    signs:[{x:14,y:20,t:'Las paredes están cubiertas de plumas pintadas con hollín. Alguien escribió encima, mil veces: "TERMINÁ EL VERSO".'},
           {x:72,y:20,t:'Un montón de ceniza tibia, con una pluma gris encima. Ya no queda nadie para hablar.',cond:()=>q.tadeo>=3}],
    build(){
      const r = makeRoom(80,23).box();
      r.f(4,21,4,2,'.'); r.f(4,22,4,1,'1');
      r.f(22,17,5,1,'='); r.f(28,13,7,1,'=');
      r.f(46,21,8,1,'.'); r.f(46,22,8,1,'^'); r.f(49,17,3,1,'=');
      r.f(62,17,5,1,'='); r.f(67,13,8,1,'=');
      r.f(20,2,6,2,'#'); r.f(50,2,5,3,'#');
      r.p(10,20,'a');
      r.p(18,20,'G'); r.p(30,8,'V'); r.p(42,20,'C'); r.p(58,20,'G'); r.p(56,9,'V');
      return r;
    }
  },
  campanario: {
    name:'Campanario Mudo', bg:'interior', stone:[36,37,56], dark:0.44,
    exits:{'1':{to:'nave',at:'c'}},
    items:[{id:'llave',x:5,y:7},{id:'brasaMayor',x:10,y:7}],
    signs:[{x:14,y:43,t:'El Campanario Mudo. Las campanas cayeron hace mucho, pero sus guardianes siguen tocando.'},
           {x:28,y:13,t:'Un hueco enorme entre las vigas. Ni con dos saltos alcanza: hace falta otro empujón en el aire.'}],
    build(){
      const r = makeRoom(48,46).box();
      r.f(22,44,4,2,'.'); r.f(22,45,4,1,'1');
      r.f(2,2,44,3,'#');
      r.f(6,38,9,1,'='); r.f(16,32,13,1,'#'); r.f(2,26,11,1,'#'); r.f(30,26,10,1,'=');
      r.f(14,20,11,1,'='); r.f(30,14,16,1,'#'); r.f(30,8,16,1,'='); r.f(2,8,17,1,'#');
      r.p(18,43,'a'); r.p(6,25,'A');
      r.p(22,31,'G'); r.p(11,34,'V'); r.p(26,18,'V'); r.p(10,16,'V'); r.p(38,13,'O');
      return r;
    }
  },
  santuario: {
    name:'Coro Sumergido', bg:'interior', stone:[44,30,48], dark:0.42,
    exits:{'1':{to:'osario',at:'b'}},
    build(){
      const r = makeRoom(48,23).box();
      r.f(0,18,2,3,'.').f(0,18,1,3,'1');
      r.f(12,16,6,1,'='); r.f(30,16,6,1,'=');
      r.p(3,20,'a');
      if (!flags.boss) r.p(36,20,'J'); else r.p(24,20,'A');
      return r;
    }
  }
};
