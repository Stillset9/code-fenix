// CODE FENIX — datos: objetos, armas, hechizos, NPCs y diálogos (lore original).
'use strict';
// Texto según el cuerpo elegido: 0 masculino, 1 femenino, 2 neutro.
const G=(m,f,n)=>{ const b=(typeof P!=='undefined'&&P.look)?P.look.body:1; return b===0?m:b===1?f:n; };
const FAR=()=>G('farolero','farolera','chispa');
const PNAME=()=>(typeof P!=='undefined'&&P.look&&P.look.name)||'ODRA';
const ITEMS = {
  unguento:{name:'Ungüento de Brasa',type:'cons',price:60,desc:'Grasa de pira mezclada con resina. Cura 35 de vida. Los peregrinos lo untaban en las heridas que el fuego no quiso cerrar.',use(){ P.hp=Math.min(P.maxHp,P.hp+35); floater(pcx(),P.y-4,'+35','#9fe08a'); }},
  ampolla:{name:'Ampolla de Foco',type:'cons',price:70,desc:'Lágrimas del Coro guardadas en vidrio. Restaura 30 de Foco. Si la acercás al oído, todavía se escucha un canto.',use(){ P.foco=Math.min(P.maxFoco,P.foco+30); floater(pcx(),P.y-4,'+30 FOCO','#8ab8ff'); }},
  fragmento:{name:'Fragmento de Brasa',type:'mat',price:80,desc:'Esquirla de un dios que ardió. Brom la usa para templar tus armas. Al tocarla se te calientan los dedos y te viene un recuerdo que no es tuyo.'},
  brasaMayor:{name:'Brasa Mayor',type:'mat',price:900,desc:'Una brasa que nunca se enfría y late como un corazón. Hace falta para llevar un arma a +3. Hay quien dice que es un pedazo del pecho de Ystrel.'},
  polvora:{name:'Cuerno de Pólvora',type:'special',price:300,desc:'Pólvora negra de los arsenales del Badajo. Aumenta en 2 tus balas máximas.'},
  llave:{name:'Llave de Hueso',type:'key',desc:'Tallada en el fémur de un campanero. Abre la reja del Osario que da al Coro Sumergido. Tiene grabado: "Que nadie suba a cantar".'},
  alas:{name:'Alas de Hollín',type:'key',desc:'Plumas negras de Ystrel, el Ave Primera. Permiten un segundo salto en el aire. Todavía huelen a humo, como si el ave hubiera ardido ayer.'},
  impulso:{name:'Impulso de Brasa',type:'key',desc:'Una chispa viva que te empuja hacia adelante. Shift en el aire: impulso aéreo. Los fieles de Ystrel la llamaban "el último aleteo".'},
  medallon:{name:'Medallón de Tadeo',type:'key',desc:'Medallón de cobre con dos nombres grabados: Tadeo e Ilvana. Está tibio, como si alguien acabara de soltarlo.'},
  cenizaAbadesa:{name:'Ceniza de la Abadesa',type:'key',desc:'Lo que quedó de la madre Aldonza. Entre la ceniza hay una nota con el último verso: "...y el Ojo no sabrá leer lo que arde."'},
  lagrima:{name:'Lágrima de Fénix',type:'special',desc:'Aumenta en uno tus frascos de curación.'}
};
const WEAPONS = {
  hoz:{name:'Hoz-farol',kind:'melee',price:200,scF:0.4,scD:0.8,style:'arc',
    desc:'Herramienta de las faroleras de la Orden del Pabilo: corta la mecha y alumbra el camino. Rápida y confiable. Escala con Destreza.',
    light:[{dur:0.3,hs:0.06,he:0.16,dmg:11,st:12,poise:8,reach:18,h:16,lunge:40,arc:[-1.9,1.0],r:[9,15]},
           {dur:0.3,hs:0.06,he:0.16,dmg:11,st:12,poise:8,reach:18,h:16,lunge:40,arc:[1.4,-1.4],r:[8,14]},
           {dur:0.38,hs:0.08,he:0.2,dmg:16,st:14,poise:14,reach:20,h:18,lunge:70,arc:[-0.6,0.6],r:[6,19]}],
    heavy:{dur:0.5,hs:0.2,he:0.32,dmg:24,st:24,poise:26,reach:22,h:22,lunge:50,arc:[-2.4,0.9],r:[8,18]},
    art:{name:'Giro del Farol',dur:0.55,hs:0.1,he:0.42,dmg:22,st:18,foco:14,poise:20,spin:true,multi:0.16,reach:26,h:24}},
  mandoble:{name:'Mandoble de Pira',kind:'melee',price:500,scF:1.1,scD:0.2,style:'heavy',
    desc:'Espada de verdugo forjada en la pira mayor. Lenta y brutal: rompe guardias y aturde. Escala con Fuerza. Su arte, Erupción, levanta columnas de fuego del suelo.',
    light:[{dur:0.5,hs:0.2,he:0.32,dmg:24,st:20,poise:24,reach:26,h:24,lunge:30,arc:[-2.2,1.0],r:[10,22]},
           {dur:0.55,hs:0.22,he:0.34,dmg:28,st:22,poise:28,reach:26,h:24,lunge:30,arc:[1.6,-1.2],r:[10,22]}],
    heavy:{dur:0.75,hs:0.38,he:0.5,dmg:42,st:32,poise:50,reach:28,h:28,lunge:20,arc:[-2.8,1.2],r:[10,24]},
    art:{name:'Erupción de Pira',dur:0.8,hs:0.4,he:0.5,dmg:30,st:26,foco:18,poise:40,erupt:true,reach:28,h:28,arc:[-2.8,1.2],r:[10,24]}},
  estoque:{name:'Estoque Cenizo',kind:'melee',price:650,scF:0.2,scD:1.2,style:'thrust',
    desc:'Hoja fina de los duelistas del Coro. Estocadas rapidísimas y largas. Escala mucho con Destreza. Su arte, Mil Agujas, es una ráfaga de estocadas.',
    light:[{dur:0.22,hs:0.04,he:0.12,dmg:8,st:8,poise:5,reach:26,h:8,lunge:50},{dur:0.22,hs:0.04,he:0.12,dmg:8,st:8,poise:5,reach:26,h:8,lunge:50},
           {dur:0.22,hs:0.04,he:0.12,dmg:9,st:8,poise:6,reach:26,h:8,lunge:50},{dur:0.32,hs:0.06,he:0.16,dmg:13,st:10,poise:10,reach:30,h:10,lunge:90}],
    heavy:{dur:0.45,hs:0.12,he:0.3,dmg:20,st:20,poise:18,reach:28,h:10,lunge:230,dash:true},
    art:{name:'Mil Agujas',dur:0.7,hs:0.05,he:0.65,dmg:7,st:18,foco:14,poise:6,multi:0.09,reach:30,h:14}},
  pistola:{name:'Pistola de Pedernal',kind:'gun',price:150,dmg:14,poise:40,pellets:1,spread:0,speed:320,life:0.6,cd:0.55,scD:0.6,
    desc:'Arma de los cazadores de mal nacidos. Un disparo largo y preciso. Si lo acertás mientras el enemigo carga un ataque, lo interrumpís.'},
  trabuco:{name:'Trabuco de Ceniza',kind:'gun',price:400,dmg:9,poise:18,pellets:4,spread:0.22,speed:280,life:0.26,cd:0.9,scD:0.5,
    desc:'El arma de Sir Galvano en la Guardia del Badajo. Escupe metralla a corta distancia. "Para cuando ya no te queda tiempo de rezar".'}
};
const SPELLS = {
  llama:{name:'Llama Viva',cost:12,dmg:20,desc:'Primer verso del Coro: una llama que vuela recto y quema. Escala con Mente.'},
  nova:{name:'Nova de Ceniza',cost:25,dmg:30,desc:'Verso de Tadeo el peregrino. Estalla en un anillo de ceniza ardiente a tu alrededor. Escala con Mente.'}
};
const STATS = [
  {k:'vig',n:'VIGOR',d:'Vida máxima (+4 por punto).'},
  {k:'res',n:'RESISTENCIA',d:'Aguante máximo (+4 por punto).'},
  {k:'fue',n:'FUERZA',d:'Daño de armas pesadas (escala con Fuerza).'},
  {k:'des',n:'DESTREZA',d:'Daño de armas rápidas y de fuego (escala con Destreza).'},
  {k:'men',n:'MENTE',d:'Foco máximo (+3) y daño de hechizos.'}
];
const SHOP_BASE = [
  {id:'unguento',price:60,stock:99},{id:'ampolla',price:70,stock:99},{id:'fragmento',price:80,stock:99},
  {id:'brasaMayor',price:900,stock:1},{id:'polvora',price:300,stock:2},{weapon:'estoque',price:650,stock:1},{weapon:'mandoble',price:1400,stock:1}
];
const q = { ilvanaMet:0, tadeo:0, galvano:0, ordonoDead:0, bromMet:0, sabelaMet:0 };

// ---------------- NPCs ----------------
const bye = {t:'Adiós', f:null};
function L(lines, choices){ return {lines, choices}; }
const NPCS = {
  ilvana:{ name:'Hermana Ilvana', spr:'ilvana',
    choices(){
      const c=[{t:'¿Qué es el Código Fénix?',f:()=>L([
        'Antes de los reyes, Ystrel, el Ave Primera, ardió y escribió con su propia ceniza una ley: el Código.',
        'Todo lo que arde, vuelve. Los dioses del Ascua juraron cumplirla, y por eso el mundo moría y renacía, una y otra vez, como un fuego que se aviva.',
        'Pero se abrió la luna. Lo llamamos el Ojo de Nhul. Desde entonces el Código renace mal: los muertos vuelven ahogados, de bronce o huecos.',
        `Vos también volvés, ${FAR()}. Pero el Código te reescribe con letra prolija... como si todavía te necesitara.`],this.choices())},
        {t:'¿Quién sos vos?',f:()=>L([
        'Fui novicia del Coro Sumergido. Cantaba la tercera voz, la más baja, la que nadie escucha.',
        'La noche que la madre Aldonza subió a cantar el verso prohibido, yo me escapé. Dejé atrás a todas... y a mi hermano.',
        'Desde entonces cuido esta pira. Es poco, pero es lo que una cobarde puede hacer.'],this.choices())}];
      if(q.tadeo===0) c.push({t:'¿Necesitás algo?',f:()=>{ q.tadeo=1; return L([
        'Mi hermano, Tadeo, subió a la Galería Quemada buscando una pluma de Ystrel. Decía que con ella podía arreglar el Código.',
        'No volvió. La galería está arriba de este refugio, y solo se llega saltando dos veces en el aire.',
        'Si lo encontrás... vivo o como sea... traeme algo suyo. Lo que sea.'],this.choices()); }});
      if(q.tadeo===2&&P.items.medallon) c.push({t:'Encontré a Tadeo.',f:()=>{ q.tadeo=3; takeItem('medallon');
        P.maxFlasks++; P.flasks=P.maxFlasks; learnSpell('nova'); sfx('item');
        banner('LÁGRIMA DE FÉNIX','+1 frasco de curación. Aprendiste el verso Nova de Ceniza.',4.5);
        return L(['...Su medallón. Está tibio.',
        'Él siempre decía que el fuego no se apaga: se muda. Quiero creerle.',
        'Tomá esta lágrima: la guardé para el día en que él volviera. Y su verso: Nova de Ceniza. Él la cantaba mejor que yo.',
        `Gracias, ${FAR()}. Ahora puedo volver a cantar. Bajito, pero puedo.`],this.choices()); }});
      c.push(bye); return c;
    },
    talk(){
      if(!q.ilvanaMet){ q.ilvanaMet=1; learnSpell('llama');
        return L([`Otra chispa que vuelve... Despacio, ${FAR()}. La pira te devolvió con todo, o casi.`,
          'Soy Ilvana. Cuido esta llama desde que el Coro se quedó mudo.',
          'Si te apagás, el Código Fénix te va a reescribir en la última pira donde descansaste. Pero cada renacer te quema un recuerdo. No te olvides de eso... si podés.',
          'Tomá un verso de fuego del Coro: Llama Viva. Con F lo lanzás; gasta Foco, que se recarga cuando golpeás.'],this.choices()); }
      if(flags.boss) return L(['La Abadesa ya no canta. Escuchá: el silencio es distinto. Es un silencio que espera.',`El Ojo sigue abierto, ${FAR()}. Pero por primera vez en siglos... parpadeó.`],this.choices());
      if(q.tadeo===3) return L(['A veces, cuando la pira cruje, me parece que es Tadeo que se ríe.'],this.choices());
      if(q.tadeo===1) return L(['¿Alguna noticia de Tadeo? La Galería Quemada está arriba, por encima del refugio.'],this.choices());
      return L([`Que la llama te reconozca, ${FAR()}.`],this.choices());
    }},
  brom:{ name:'Brom el Fundidor', spr:'brom',
    choices(){ return [{t:'Mejorar armas',f:()=>{ openForge(); return null; }},
      {t:'Hablar',f:()=>L(P.weapons.mandoble!==undefined?[
        '¡Eso que llevás es un Mandoble de Pira! Lo forjó mi maestro con hierro de la pira mayor. Pesa como un pecado, pero rompe hasta el bronce.',
        'Si me traés Brasas, lo hago cantar.']:[
        'Antes fundía campanas para Moraun, el dios del bronce. Cada campana tenía nombre y voz.',
        'Cuando el Ojo se abrió, las campanas empezaron a tocar solas. Los campaneros se fundieron con ellas. Yo perdí la mano metiéndola en el molde para sacar a mi aprendiz.',
        'No lo saqué. Desde entonces solo forjo armas. Traeme Fragmentos de Brasa y Créditos, y tus armas van a morder más.'],this.choices())}, bye]; },
    talk(){ if(!q.bromMet){ q.bromMet=1; return L([G('¿Un farolero? Creí que se habían apagado todos.','¿Una farolera? Creí que se habían apagado todas.','¿Alguien de la Orden del Pabilo? Creí que ya no quedaba nadie.'),'Brom. Fundidor. Me falta una mano y me sobra fuego. Si querés que tu acero corte más, ya sabés dónde estoy.'],this.choices()); }
      return L([flags.boss?'Escuché caer a la Abadesa. Hasta el yunque sonó distinto.':'¿Qué traés para el yunque?'],this.choices()); }},
  sabela:{ name:'Sabela la Tuerta', spr:'sabela',
    choices(){ return [{t:'Comprar',f:()=>{ openShop(0); return null; }},{t:'Vender',f:()=>{ openShop(1); return null; }},
      {t:'Hablar',f:()=>L(flags.key?[
        '¿Tenés la Llave de Hueso? Entonces vas a bajar al Coro. Yo no bajaría ni por mil Créditos... bueno, por mil quizás sí.',
        'La Abadesa era buena clienta, ¿sabés? Me compraba velas negras. Muchísimas velas negras.']:[
        G('Los Créditos, querido, son','Los Créditos, querida, son','Los Créditos, mi cielo, son')+' la contabilidad del Código. Cada vida que apagás se anota a tu favor. Yo solo aprendí a cobrarlas.',
        'El ojo que me falta lo cambié por uno de cera. Ve cosas que el otro no: deudas, sobre todo.',
        'Si te morís con Créditos encima, quedan tirados donde caíste. Andá a buscarlos antes de morirte otra vez, que si no se los lleva el Código.'],this.choices())}, bye]; },
    talk(){ if(!q.sabelaMet){ q.sabelaMet=1; return L([G('¡Cliente! Pasá, pasá.','¡Clienta! Pasá, pasá.','¡Cliente a la vista! Pasá, pasá.')+' Sabela, mercader de todo lo que todavía sirve.','Acepto Créditos. Nada de rezos, nada de promesas.'],this.choices()); }
      return L([`¿Qué se te ofrece, ${FAR()}?`],this.choices()); }},
  galvano:{ name:'Sir Galvano de Brasa', spr:'galvano',
    choices(){ const c=[];
      if(q.galvano===0) c.push({t:'¿Qué te pasó?',f:()=>{ q.galvano=1; return L([
        'Ordoño y yo juramos sobre el mismo badajo: proteger el campanario de Moraun hasta que se apagara la última campana.',
        'Cuando el Ojo se abrió, él se quedó arriba tocando. La campana se le metió en la cabeza. Ahora es el Campanero Mayor.',
        'Yo no puedo levantar el arma contra él. Vos sí. Subí al Campanario Mudo, por la cornisa alta de esta nave, y dale descanso.',
        'Hacelo y te doy mi trabuco. Ya no lo necesito para nada.'],c2()); }});
      if(q.galvano===1&&q.ordonoDead) c.push({t:'Ordoño descansa.',f:()=>{ q.galvano=3; giveWeapon('trabuco'); P.credits+=200; sfx('item');
        banner('TRABUCO DE CENIZA','Arma secundaria: metralla de corto alcance. Equipala en el inventario (I).',4.5);
        return L(['...Entonces el campanario por fin está mudo de verdad.','Tomá mi trabuco y estos Créditos. Que la metralla te abra camino donde la fe no alcanza.','Voy a quedarme acá un rato más. Alguien tiene que velarlo.'],c2()); }});
      c.push({t:'Hablar de Velmora',f:()=>L(['Velmora fue la ciudad de los Siete del Ascua. Cada dios tenía su catedral. Cuando cayeron, sus cuerpos se volvieron piedra y nosotros vivimos adentro.','Esta nave era el pecho de Sereth, la diosa de las aguas. Por eso los ahogados vuelven acá: la buscan.'],c2())});
      c.push(bye); const c2=()=>this.choices(); return c; },
    talk(){
      if(flags.boss) return L(['Dicen que la Abadesa cayó. Si existe un después del Código, que Ordoño lo encuentre.'],this.choices());
      if(q.galvano===3) return L([`Gracias, ${FAR()}. El bronce ya no llora.`],this.choices());
      if(q.galvano===1&&!q.ordonoDead) return L(['El Campanario está arriba, por la cornisa alta de esta nave. Ordoño espera en la cima.'],this.choices());
      return L(['...¿Sos de verdad, o sos otra campanada en mi cabeza?','Soy Galvano, de la Guardia del Badajo. O lo que quedó de ella.'],this.choices()); }},
  tadeo:{ name:'Tadeo el Peregrino', spr:'tadeo', present:()=>q.tadeo<3,
    choices(){ return [bye]; },
    talk(){
      if(q.tadeo<2){ q.tadeo=2; giveItem('medallon',1,true);
        return L(['...¿Ilvana? No... tenés olor a pira, pero no sos ella.',
          'Encontré la pluma, ¿sabés? Pero estaba fría. Ystrel no está muerto: está esperando que alguien termine su verso.',
          'Ya no me queda fuego para bajar. Llevale esto a mi hermana. Decile que no tuvo la culpa.',
          'Y si la ves a la Abadesa... no la mires a los ojos. Ella ya no mira con los suyos.'],this.choices()); }
      return L(['Llevale... el medallón... a Ilvana...'],this.choices()); }}
};
const CONTROLS_TABLE = [
  ['MOVERSE','← → / A D','STICK / CRUCETA'],
  ['SALTAR / DOBLE SALTO','ESPACIO / Z','A'],
  ['ATAQUE LIGERO / CRÍTICO','J / X','X'],
  ['PESADO (MANTENER: ARTE)','K / C','Y'],
  ['DISPARO SECUNDARIO','L / V','RB'],
  ['ESQUIVAR / IMPULSO AÉREO','SHIFT','B'],
  ['PARADA (PARRY)','Q','LB'],
  ['CURAR (LÁGRIMA)','R','LT'],
  ['HECHIZO / CAMBIAR','F / T','RT / L3'],
  ['HABLAR / DESCANSAR','E / ↑','CRUCETA ↑'],
  ['INVENTARIO Y EQUIPO','I / TAB','SELECT'],
  ['PAUSA / SONIDO','ESC / P · M','START']
];
const CREDITS_LINES = [
  ['CODE FENIX',4,'#ffd860'],['',1],['LO QUE ARDE, VUELVE.',1,'#c8a8b8'],['',1],['',1],
  ['UN JUEGO DE',1,'#8a7a8a'],['PROMETHEON STUDIO',2,'#ff9a3a'],['',1],['',1],
  ['FUNDADOR Y CREADOR',1,'#8a7a8a'],['SANTIAGO PÍRIZ',2,'#eadcc4'],['',1],['',1],
  ['COLABORADOR DE IDEAS',1,'#8a7a8a'],['HÉCTOR JUANI',1,'#eadcc4'],['',1],
  ['ARTE PIXEL, SONIDO Y CÓDIGO',1,'#8a7a8a'],['PROMETHEON STUDIO',1,'#eadcc4'],['TODO GENERADO POR CÓDIGO, SIN RECURSOS DE TERCEROS',1,'#6a5a70'],['',1],['',1],
  ['PERSONAJES',1,'#8a7a8a'],['LA ÚLTIMA LUZ DE LA ORDEN DEL PABILO',1,'#eadcc4'],['HERMANA ILVANA',1,'#eadcc4'],['BROM EL FUNDIDOR',1,'#eadcc4'],
  ['SABELA LA TUERTA',1,'#eadcc4'],['SIR GALVANO DE BRASA',1,'#eadcc4'],['TADEO EL PEREGRINO',1,'#eadcc4'],['ORDOÑO, EL CAMPANERO MAYOR',1,'#eadcc4'],['LA ABADESA HUECA',1,'#d8c8ff'],['',1],['',1],
  ['(C) 2026 PROMETHEON STUDIO',1,'#8a7a8a'],['',1],['',1],['GRACIAS POR JUGAR',2,'#ffd860']
];

// ---------------- Árbol de habilidades: "El Árbol de Ystrel" ----------------
// x,y: posición en la grilla del árbol. req: nodos previos (todos necesarios). pts: Plumas; cr: costo alternativo en Créditos.
const SKILLS = {
  brasa:   {n:'Brasa Interior',     x:3,y:0,req:[],                pts:1,cr:300,  d:'+10 de Foco máximo. La primera chispa que Ystrel deja en quien renace.'},
  filo:    {n:'Filo Templado',      x:1,y:1,req:['brasa'],         pts:1,cr:500,  d:'Tus ataques ligeros hacen +10% de daño.'},
  piel:    {n:'Piel de Hollín',     x:3,y:1,req:['brasa'],         pts:1,cr:500,  d:'Recibís 10% menos de daño. El hollín de la Quema nunca se te fue de la piel.'},
  chispa:  {n:'Chispa Fértil',      x:5,y:1,req:['brasa'],         pts:1,cr:500,  d:'Cada golpe cuerpo a cuerpo te devuelve +2 de Foco extra.'},
  ira:     {n:'Ira de Ceniza',      x:0,y:2,req:['filo'],          pts:2,cr:900,  d:'Ataques pesados y Artes: +15% de daño y +20% de aturdimiento.'},
  verdugo: {n:'Verdugo del Código', x:2,y:2,req:['filo'],          pts:2,cr:900,  d:'Los golpes críticos hacen +35% de daño.'},
  paso:    {n:'Paso de Humo',       x:3,y:2,req:['piel'],          pts:2,cr:900,  d:'Rodar y el impulso aéreo cuestan 30% menos de aguante.'},
  lagrima: {n:'Lágrima Guardada',   x:4,y:2,req:['piel','chispa'], pts:2,cr:1200, d:'+1 Lágrima de Fénix. Requiere Piel de Hollín y Chispa Fértil.'},
  verso:   {n:'Verso Encendido',    x:6,y:2,req:['chispa'],        pts:2,cr:900,  d:'Tus versos hacen +20% de daño.'},
  contra:  {n:'Contracanto',        x:2,y:3,req:['verdugo','paso'],pts:2,cr:1500, d:'La ventana de parada es más amplia y cada parada exitosa te devuelve 10 de Foco.'},
  avaricia:{n:'Avaricia del Código',x:5,y:3,req:['lagrima'],       pts:2,cr:1500, d:'Los enemigos sueltan 15% más de Créditos. Sabela aprobaría.'},
  fenix:   {n:'Último Aliento',     x:3,y:4,req:['contra','avaricia'],pts:3,cr:2500,d:'Una vez por descanso, al consumirte renacés en el acto con 30% de vida. Lo que arde, vuelve.'}
};
