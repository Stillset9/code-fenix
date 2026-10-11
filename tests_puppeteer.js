const puppeteer=require('puppeteer-core');
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const out=__dirname+'/screenshots/';
(async()=>{
  const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage(); await p.setViewport({width:1280,height:720});
  const errs=[]; p.on('console',m=>{ if(['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text()); }); p.on('pageerror',e=>errs.push('pageerror: '+e.message+' '+e.stack));
  const res={}; const ok=(k,v)=>{ res[k]=v; console.log((v?'PASS ':'FAIL ')+k); };
  await p.goto('file://'+__dirname+'/index.html'); await p.evaluate(()=>localStorage.clear()); await p.reload(); await sl(900);
  const ev=(f,...a)=>p.evaluate(f,...a); const key=async(k,ms=60)=>{ await p.keyboard.press(k); await sl(ms); };
  const toChoices=async()=>{ for(let i=0;i<30;i++){ const r=await ev(()=>!ui||ui.type!=='dialog'||(ui.line>=ui.node.lines.length-1&&ui.chars>=ui.node.lines[ui.line].length)); if(r) return; await key('Enter',110); } };
  const pick=async(t)=>{ await toChoices(); const ch=await ev(()=>ui&&ui.type==='dialog'?(ui.node.choices||[]).map(c=>c.t):[]); const i=ch.indexOf(t); for(let k=0;k<i;k++) await key('ArrowDown',50); await key('Enter',200); return i; };
  ok('boot_screen', await ev(()=>mode==='boot'));
  await key('KeyX',1600); ok('splash_cine', await ev(()=>mode==='cine'&&CINE.id==='splash'));
  await p.screenshot({path:out+'00_splash_prometheon.png'});
  await key('Escape',1500); ok('splash_to_title', await ev(()=>mode==='title'));
  ok('audio_running', await ev(()=>!!SFX.ctx&&SFX.ctx.state==='running'&&!!MUS.bus));
  ok('music_title', await ev(()=>MUS.voices.some(v=>!v.dying&&v.name==='title')));
  await p.screenshot({path:out+'01_titulo.png'});
  ok('title_options', JSON.stringify(await ev(()=>titleOptions()))==='["NUEVA PARTIDA","OPCIONES","CONTROLES","CRÉDITOS"]');
  // OPCIONES: volúmenes y reasignación de teclas
  await key('ArrowDown'); await key('Enter',200); ok('options_open', await ev(()=>ui&&ui.type==='options'));
  await key('ArrowRight'); await key('ArrowDown'); await key('ArrowLeft'); await key('ArrowLeft');
  ok('options_volumes', await ev(()=>Math.abs(MUS.vol-0.8)<1e-6&&Math.abs(MUS.sfxVol-0.6)<1e-6&&JSON.parse(localStorage.getItem('codefenix_opts')).music===0.8));
  await sl(200); await p.screenshot({path:out+'14_opciones.png'});
  await key('ArrowDown'); await key('Enter',150); ok('options_keys', await ev(()=>ui.sub==='keys'));
  for(let i=0;i<5;i++) await key('ArrowDown',40); await key('Enter',120); ok('rebind_wait', await ev(()=>ui.wait===true));
  await key('KeyH',150); ok('rebind_applied', await ev(()=>KEYMAP.KeyH==='light'&&!KEYMAP.KeyJ&&!KEYMAP.KeyX&&!ui.wait));
  await p.screenshot({path:out+'15_opciones_teclas.png'});
  ok('controls_table_dynamic', await ev(()=>ctrlKeys(2,'')==='H'));
  await key('Escape',100); await key('ArrowDown',50); await key('Enter',150);
  ok('rebind_reset', await ev(()=>KEYMAP.KeyJ==='light'&&!KEYMAP.KeyH));
  await key('Escape',150); ok('options_close', await ev(()=>ui===null&&mode==='title'));
  await key('ArrowDown'); await key('ArrowDown'); await key('Enter',2500);
  ok('credits_mode', await ev(()=>mode==='credits'));
  await p.screenshot({path:out+'02_creditos.png'});
  await key('Escape',200); ok('credits_back', await ev(()=>mode==='title'));
  await key('Enter',400);
  ok('creator_mode', await ev(()=>mode==='creator'));
  await key('ArrowDown',60); await key('ArrowRight',60); // CUERPO -> NEUTRO
  await key('ArrowDown',60); await key('ArrowRight',60); await key('ArrowRight',60); // PIEL -> CANELA
  await key('ArrowDown',60); await key('ArrowRight',60); await key('ArrowRight',60); // PEINADO -> LARGO
  await key('ArrowDown',60); await key('ArrowRight',60); await key('ArrowRight',60); await key('ArrowRight',60); // PELO -> RUBIO
  await key('ArrowDown',60); await key('ArrowRight',60); // OJOS -> HIELO
  await key('ArrowDown',60); await key('ArrowRight',60); // CAPA -> AÑIL
  await sl(700); await p.screenshot({path:out+'02b_creador_personaje.png'});
  ok('creator_values', await ev(()=>{ const l=CN.cre.look; return l.body===2&&l.skin===2&&l.hair===2&&l.hairC===3&&l.eyes===1&&l.cloak===1; }));
  await key('ArrowUp',60); await key('ArrowUp',60); await key('ArrowUp',60); await key('ArrowUp',60); await key('ArrowUp',60); await key('ArrowUp',60); await key('ArrowUp',60); // -> COMENZAR
  await key('Enter',800);
  ok('prologue_cine', await ev(()=>mode==='cine'&&CINE.id==='prologue'));
  ok('music_prologue', await ev(()=>MUS.voices.some(v=>!v.dying&&v.name==='prologue')));
  const shotAt=async(i,t,name)=>{ await ev((i,t)=>{ CINE.i=i; CINE.t=t; CINE.chars=999; },i,t); await sl(400); await p.screenshot({path:out+name}); };
  await sl(1500); await p.screenshot({path:out+'16_cinematica_prologo_1.png'});
  await key('Enter',150); await key('Enter',150); ok('cine_advance', await ev(()=>CINE.i===1));
  await shotAt(2,3.6,'17_cinematica_prologo_ojo.png'); await shotAt(3,2.5,'18_cinematica_prologo_quema.png'); await shotAt(4,4.5,'19_cinematica_prologo_pira.png');
  await key('Escape',300);
  ok('creator_applied', await ev(()=>P.look.hair===2&&P.look.body===2&&FAR()==='chispa'));
  ok('sprite_reflects_look', await ev(()=>{ const f=playerFrame('idle',0); const d=f.img.getContext('2d').getImageData(0,0,f.w,f.h).data; let hit=0; for(let i=0;i<d.length;i+=4){ if(Math.abs(d[i]-0x22)<8&&Math.abs(d[i+1]-0x3b)<8&&Math.abs(d[i+2]-0x62)<8) hit++; } return hit>20; }));
  ok('rig_frames', await ev(()=>{ const a=['idle','run','jump','roll','hurt','dead','arc0','arc1','heavy','thrust']; return a.every(n=>{ const f=playerFrame(n,1); return f&&f.w===96; }); }));
  ok('music_zone_atrio', await ev(()=>{ musicDirector(); return MUS.voices.some(v=>!v.dying&&v.name==='atrio'); }));
  ok('music_crossfade', await ev(()=>{ const r0=roomId, x0=P.x, y0=P.y; loadRoom('nave','a'); musicDirector(); const ok1=MUS.voices.some(v=>v.dying&&v.name==='atrio')&&MUS.voices.some(v=>!v.dying&&v.name==='nave');
    loadRoom(r0,null,x0,y0); musicDirector(); return ok1&&MUS.voices.some(v=>!v.dying&&v.name==='atrio'); }));
  ok('canvas_640x360', await ev(()=>{ const c=document.getElementById('game'); return c.width===640&&c.height===360; }));
  ok('newgame', await ev(()=>mode==='play'&&roomId==='atrio'&&P.weapons.hoz===0));
  // combat light combo against ahogado
  await sl(300); await ev(()=>{ bannerM=null; roomTitle.t=0; const e=ents.find(e=>e.type==='ahogado'); P.x=e.x-14; P.y=e.y+e.h-P.h; P.face=1; P.state='normal'; P.inv=2; P.vx=0; e.state='patrol'; e.face=-1; e.vx=0; }); await sl(60);
  void('DBG0',await ev(()=>{ const e=ents.find(e=>e.type==='ahogado'); return JSON.stringify({mode,ui:ui&&ui.type,P:[P.x|0,P.y|0,P.state,P.onGround,P.hp],e:[e.x|0,e.y|0,e.hp,e.state],hs:hitstop}); }));
  await key('KeyJ',120); await key('KeyJ',120); await sl(60);
  void('DBG1',await ev(()=>{ const e=ents.find(e=>e.type==='ahogado'); return JSON.stringify({mode,ui:ui&&ui.type,P:[P.x|0,P.y|0,P.state,P.onGround,P.hp],e:[e.x|0,e.y|0,e.hp,e.state]}); }));
  await p.screenshot({path:out+'06_combate_hud_nieve.png'});
  await key('KeyJ',400);
  ok('blood_and_damage_numbers', await ev(()=>parts.some(p=>p.blood)||decals.length>0) );
  for(let t=0;t<3&&!(await ev(()=>{ const e=ents.find(e=>e.type==='ahogado'); return !e||e.hp<32; }));t++){ // reintento: la prueba depende del tiempo real
    await ev(()=>{ const e=ents.find(e=>e.type==='ahogado'); P.x=e.x-14; P.y=e.y+e.h-P.h; P.face=1; P.state='normal'; P.inv=2; P.vx=0; e.vx=0; }); await sl(60); await key('KeyJ',150); await key('KeyJ',300); }
  ok('combo_damage', await ev(()=>{ const e=ents.find(e=>e.type==='ahogado'); return !e || e.hp<32; }));
  // shoot interrupt
  const intr=await ev(()=>{ const e=ents.find(e=>e.type==='ahogado'&&!e.dead); if(!e) return 'noenemy'; e.x=320; e.y=168-e.h; e.vx=0; P.x=262; P.y=168-P.h; P.vx=0; P.face=1; P.state='normal'; e.state='wind'; e.t=0; e.hp=100; e.poise=20; P.gunCd=0; tryShoot(); return 'ok'; });
  await sl(300); ok('shoot_interrupt', intr==='ok' && await ev(()=>ents.some(e=>e.state==='stagger')));
  // crit
  await ev(()=>{ const e=ents.find(e=>e.state==='stagger'); P.x=e.x-10; P.y=e.y+e.h-P.h; P.face=1; P.state='normal'; P.st=100; e.stagT=2; });
  const hpBefore=await ev(()=>ents.find(e=>e.state==='stagger').hp);
  await key('KeyJ',700);
  ok('crit_finisher', await ev((hb)=>{ const e=ents.find(e=>e.type==='ahogado'&&e.idx!==undefined&&e.hp<hb); return !!e || ents.filter(e=>e.type==='ahogado').length<2; },hpBefore));
  // parry vs campanero
  await ev(()=>{ loadRoom('osario','a'); const e=ents.find(e=>e.type==='campanero'); P.x=e.x-20; P.y=e.y+e.h-P.h; P.face=1; e.state='wind'; e.t=0; e.face=-1; P.state='normal'; P.inv=0; P.hp=P.maxHp; P.st=100; startParry(); hurtPlayer(28,e.x,e,true); });
  ok('parry_stagger', await ev(()=>ents.find(e=>e.type==='campanero').state==='stagger'&&P.hp===P.maxHp));
  // spells & dash
  await ev(()=>{ P.state='normal'; learnSpell('llama'); P.foco=50; tryCast(); }); await sl(300);
  ok('spell_fire', await ev(()=>P.foco<50));
  await ev(()=>{ giveItem('impulso',1,true); P.state='normal'; P.onGround=false; P.y-=30; P.airDash=true; });
  await p.keyboard.down('ShiftLeft'); await sl(40); await p.keyboard.up('ShiftLeft'); await sl(20);
  ok('air_dash', await ev(()=>P.state==='dash'||!P.airDash));
  // hub & NPC dialogue
  await ev(()=>{ loadRoom('refugio','a'); const n=npcs.find(n=>n.id==='ilvana'); P.x=n.x+8; P.y=n.y-P.h; P.vx=0; P.vy=0; P.state='normal'; P.inv=0; roomTitle.t=0; toastM=null; });
  await sl(200);
  await key('KeyE',700);
  ok('dialog_open', await ev(()=>ui&&ui.type==='dialog'&&ui.npc==='ilvana'));
  await sl(1500); await p.screenshot({path:out+'03_dialogo_npc.png'});
  await toChoices();
  ok('dialog_choices', await ev(()=>ui&&ui.type==='dialog'&&ui.node.choices&&ui.node.choices.length>=3));
  // choose "¿Necesitás algo?" (index 2)
  await pick('¿Necesitás algo?');
  ok('quest_started', await ev(()=>q.tadeo===1));
  await key('Escape',100);
  // merchant
  await ev(()=>{ closeUI(); P.credits=3000; const n=npcs.find(n=>n.id==='sabela'); P.x=n.x+8; P.y=n.y-P.h; P.vx=0; }); await sl(100);
  await key('KeyE',300); await pick('Comprar'); await sl(100);
  ok('merchant_menu_opened', await ev(()=>ui&&ui.type==='shop'));
  await key('Enter',100); // buy unguento
  ok('merchant_buy', await ev(()=>P.items.unguento===1&&P.credits===2940));
  for(let i=0;i<5;i++) await key('ArrowDown',50); await key('Enter',100); // estoque
  await p.screenshot({path:out+'04_mercader.png'});
  ok('buy_weapon', await ev(()=>P.weapons.estoque===0));
  await key('ArrowRight',100); await key('Enter',100);
  ok('merchant_sell', await ev(()=>!P.items.unguento && P.credits>2940-650));
  await key('Escape',100);
  // forge
  await ev(()=>{ closeUI(); giveItem('fragmento',3,true); openForge(); }); await sl(100); await key('Enter',200);
  ok('forge_upgrade', await ev(()=>P.weapons.hoz===1&&P.items.fragmento===2));
  await key('Escape',100);
  // level up gives a skill feather
  // pyre rest + level up + save
  await ev(()=>{ closeUI(); const a=altars[0]; P.x=a.x-4; P.y=a.y-P.h; P.state='normal'; }); await sl(100); await key('KeyE',300);
  ok('pyre_saved', await ev(()=>ui&&ui.type==='pyre'&&!!localStorage.getItem('codefenix_save_v1')));
  await key('Enter',200); const lv0=await ev(()=>P.level); await key('Enter',150);
  ok('level_up', await ev((l)=>P.level===l+1&&P.stats.vig===11&&P.maxHp===104&&P.skillPts===2,lv0));
  await key('ArrowDown',50); await key('ArrowDown',50); await key('Enter',150); await sl(200);
  await p.screenshot({path:out+'05_nivel_estadisticas.png'});
  await key('Escape',100); await key('ArrowDown',50); await key('ArrowDown',50); await key('Enter',200);
  ok('inventory_from_pyre', await ev(()=>ui&&ui.type==='inv'&&ui.tab===0));
  await p.screenshot({path:out+'07_inventario_equipo.png'});
  await key('Enter',100); await key('ArrowDown',60); await key('Enter',150);
  ok('equip_weapon', await ev(()=>P.wpn==='estoque'));
  await key('KeyT',100); ok('tab_objects', await ev(()=>ui.tab===1));
  await ev(()=>{ giveItem('unguento',2,true); P.hp=40; ui.sel=Object.keys(P.items).length?itemList().indexOf('unguento'):0; }); await sl(60);
  await p.screenshot({path:out+'07b_inventario_objetos.png'});
  await key('Enter',100); await key('Enter',150); ok('use_item_menu', await ev(()=>P.hp>40&&P.items.unguento===1));
  await key('KeyG',100); ok('assign_quick', await ev(()=>P.quick==='unguento'));
  await key('KeyT',100); ok('tab_skills', await ev(()=>ui.tab===2));
  const pts0=await ev(()=>P.skillPts), foc0=await ev(()=>P.maxFoco);
  await key('Enter',150); ok('skill_unlock_points', await ev((a,b)=>hasSk('brasa')&&P.skillPts===a-1&&P.maxFoco===b+10,pts0,foc0));
  await ev(()=>{ P.credits+=600; }); const cr0=await ev(()=>P.credits);
  await key('ArrowDown',100); ok('skill_nav', await ev(()=>ui.node==='piel'));
  await key('KeyK',150); ok('skill_unlock_credits', await ev((c)=>hasSk('piel')&&P.credits===c-500,cr0));
  await ev(()=>{ ui.node='fenix'; }); await key('Enter',100); ok('skill_prereq_lock', await ev(()=>!hasSk('fenix')));
  await ev(()=>{ ui.node='chispa'; }); await sl(100); await p.screenshot({path:out+'11_arbol_habilidades.png'});
  await key('KeyT',100); await sl(100); await p.screenshot({path:out+'12_estado.png'}); ok('tab_status', await ev(()=>ui.tab===3));
  await key('Escape',100); await key('Escape',100);
  // quick slot in play
  await ev(()=>{ closeUI(); P.hp=30; P.state='normal'; }); await key('KeyG',150);
  ok('quick_slot_use', await ev(()=>P.hp>30&&!P.items.unguento));
  // Questline: Tadeo -> Ilvana
  await ev(()=>{ closeUI(); giveItem('alas',1,true); loadRoom('galeria','a'); const n=npcs.find(n=>n.id==='tadeo'); P.x=n.x-12; P.y=n.y-P.h; P.vx=0; P.state='normal'; ents=[]; }); await sl(150);
  await key('KeyE',200); for(let i=0;i<6;i++){ await key('Enter',80); await key('Enter',150); }
  ok('tadeo_medallon', await ev(()=>q.tadeo===2&&!!P.items.medallon));
  await ev(()=>{ closeUI(); loadRoom('refugio','a'); const n=npcs.find(n=>n.id==='ilvana'); P.x=n.x+8; P.y=n.y-P.h; P.vx=0; P.state='normal'; }); await sl(100);
  await key('KeyE',300); await pick('Encontré a Tadeo.');
  ok('quest_complete', await ev(()=>q.tadeo===3&&P.maxFlasks===4&&P.spells.includes('nova')));
  await ev(()=>closeUI());
  // Galvano quest
  await ev(()=>{ loadRoom('nave','a'); const n=npcs.find(n=>n.id==='galvano'); P.x=n.x+10; P.y=n.y-P.h; P.vx=0; P.state='normal'; ents=[]; }); await sl(100);
  await key('KeyE',300); await pick('¿Qué te pasó?');
  ok('galvano_quest', await ev(()=>q.galvano===1));
  await ev(()=>{ closeUI(); loadRoom('campanario','a'); const o=ents.find(e=>e.named==='ordono'); o.hp=1; damageEnemy(o,5,1,0); });
  ok('ordono_killed', await ev(()=>q.ordonoDead===1));
  await ev(()=>{ bannerM=null; loadRoom('nave','a'); const n=npcs.find(n=>n.id==='galvano'); P.x=n.x+10; P.y=n.y-P.h; P.vx=0; P.state='normal'; ents=[]; }); await sl(100);
  await key('KeyE',300); await pick('Ordoño descansa.');
  ok('galvano_reward', await ev(()=>P.weapons.trabuco===0&&q.galvano===3));
  await ev(()=>closeUI());
  // mandoble art (charged heavy)
  await ev(()=>{ giveWeapon('mandoble'); P.wpn='mandoble'; P.foco=50; P.st=200; P.state='normal'; loadRoom('galeria','a'); });
  await p.keyboard.down('KeyK'); await sl(900); await p.keyboard.up('KeyK'); await sl(500);
  ok('weapon_art_erupt', await ev(()=>P.foco<=50-18+5));
  // gating checks: nave shaft, campanario dash gap exist
  ok('gating_tiles', await ev(()=>{ loadRoom('campanario','a'); return room.g[8][19]==='.'&&room.g[8][29]==='.'&&room.g[8][18]==='#'&&room.g[8][30]==='='; }));
  // death drop of credits
  await ev(()=>{ P.credits=123; P.inv=0; P.state='normal'; hurtPlayer(9999,0); });
  ok('death_drop', await ev(()=>waxDrop&&waxDrop.amount===123&&P.credits===0));
  await sl(3500); ok('respawn_at_pyre', await ev(()=>P.state!=='dead'&&roomId==='refugio'));
  // save/load across reload
  await ev(()=>{ saveGame(); });
  await p.reload(); await sl(800); await key('KeyX',300); await key('Escape',400);
  ok('continue_option', JSON.stringify(await ev(()=>titleOptions())).includes('CONTINUAR'));
  await key('ArrowDown'); await key('Enter',500);
  ok('load_game', await ev(()=>mode==='play'&&q.tadeo===3&&P.weapons.trabuco===0&&P.maxFlasks===4&&P.skills.includes('piel')&&P.look&&P.look.hair===2&&P.look.cloak===1&&P.weapons.hoz===1&&waxDrop&&waxDrop.amount===123));
  await ev(()=>{ loadRoom('nave','a'); bannerM=null; toastM=null; roomTitle.t=0; const e=ents.find(e=>e.type==='campanero'&&!e.named); P.x=e.x-30; P.y=e.y+e.h-P.h; P.vx=0; P.face=1; P.state='normal'; P.inv=3; P.maxHp=P.hp=9999; e.state='walk'; }); await sl(1100);
  await key('KeyJ',140); await p.screenshot({path:out+'25_sprites_combate_campanero.png'});
  // boss + ending credits
  await ev(()=>{ loadRoom('santuario','a'); P.maxHp=P.hp=9999; P.x=22*8; P.inv=0; bannerM=null; toastM=null; }); await sl(400);
  ok('boss_cut', await ev(()=>!!cut));
  await sl(3400); await p.screenshot({path:out+'20_jefa_intro_dialogo.png'});
  await ev(()=>{ cut.t=10.6; }); await sl(300); await p.screenshot({path:out+'21_jefa_intro_titulo.png'});
  ok('music_boss', await ev(()=>MUS.voices.some(v=>!v.dying&&v.name==='boss')));
  await key('Escape',200); ok('boss_cut_end', await ev(()=>!cut&&flags.bossSeen===1)); await sl(2200);
  for(let i=0;i<60;i++){ const s=await ev(()=>bossRef?bossRef.state:''); if(s==='sweepWind'||s==='leap'||s==='chargeWind') break; await sl(60); }
  await p.screenshot({path:out+'08_jefa.png'});
  await ev(()=>{ const bb=ents.find(e=>e.type==='abadesa'); bb.hp=1; damageEnemy(bb,10,1,0); }); await sl(3000);
  ok('boss_dead', await ev(()=>flags.boss&&endT>0));
  await sl(7500); ok('ending_cine', await ev(()=>mode==='cine'&&CINE.id==='ending'));
  await shotAt(0,2.4,'22_cinematica_final_ojo.png'); await shotAt(1,2.5,'23_cinematica_final_refugio.png'); await shotAt(2,3,'24_cinematica_final_alba.png');
  await key('Escape',300); ok('ending_credits', await ev(()=>mode==='credits'&&credEnding));
  await sl(2500); await p.screenshot({path:out+'09_creditos_final.png'});
  // pause menu with controls
  await key('Escape',200); ok('credits_to_title', await ev(()=>mode==='title'));
  await ev(()=>{ loadGame(); }); await sl(300);
  await key('Escape',100); await key('ArrowDown',50); await key('Enter',200);
  ok('pause_controls', await ev(()=>ui&&ui.type==='controls'));
  await p.screenshot({path:out+'10_pausa_controles.png'});
  await key('Escape',100); await ev(()=>{ closeUI(); loadRoom('atrio','a'); P.x=33*8; P.y=20*8-P.h; ents=[]; bannerM=null; roomTitle.t=0; toastM=null; P.face=1; }); await sl(2500);
  await p.screenshot({path:out+'13_exterior_nevado.png'});
  ok('snow_particles', await ev(()=>parts.filter(p=>p.sway).length>20));
    // música: cada tema se renderiza fuera de línea, sin errores y con señal
  const mr=await p.evaluate(async()=>{ const out={}; const real={ctx:SFX.ctx,noise:SFX.noiseBuf,bus:MUS.bus,dly:MUS.dly,rev:MUS.rev};
  for(const name of Object.keys(TRACKS)){ const sr=22050, dur=3, off=new OfflineAudioContext(2,sr*dur,sr);
   const nb=off.createBuffer(1,sr,sr); const d=nb.getChannelData(0); for(let i=0;i<sr;i++) d[i]=Math.random()*2-1;
   SFX.ctx=off; SFX.noiseBuf=nb; MUS.bus=off.createGain(); MUS.bus.connect(off.destination); MUS.dly=off.createDelay(1.5); MUS.dly.connect(MUS.bus); MUS.rev=off.createGain();
   const v={g:off.createGain(),tr:TRACKS[name]}; v.g.connect(off.destination); const tr=TRACKS[name], sd=60/tr.bpm/4; let err=null;
   // salteá la intro del título para medir la sección con banda completa
   const s0=name==='title'?64:0;
   try{ for(let s=0,t=0.05;t<dur-0.5;s++,t+=sd) tr.play(v,s+s0,t,sd); }catch(e){ err=e.message; }
   const buf=await off.startRendering(); const ch=buf.getChannelData(0); let sum=0,pk=0; for(let i=0;i<ch.length;i++){ sum+=ch[i]*ch[i]; pk=Math.max(pk,Math.abs(ch[i])); }
   out[name]={rms:+Math.sqrt(sum/ch.length).toFixed(3),peak:+pk.toFixed(2),err}; }
  SFX.ctx=real.ctx; SFX.noiseBuf=real.noise; MUS.bus=real.bus; MUS.dly=real.dly; MUS.rev=real.rev; return out; });
   ok('music_tracks_render', Object.keys(mr).length===11&&Object.values(mr).every(t=>!t.err&&t.rms>0.02));
  console.log('MUSIC '+JSON.stringify(mr));
  console.log('ERRORS:',JSON.stringify(errs));
  console.log('SUMMARY', Object.values(res).filter(v=>v).length+'/'+Object.keys(res).length);
  await b.close();
})();
