// CODE FENIX — pruebas en modo celular (emulación táctil, horizontal) + PWA + modo invitado.
// Uso: NODE_PATH=<puppeteer-core> node tests_mobile.js   (levanta un servidor http local en el puerto 8765)
const puppeteer=require('puppeteer-core'); const http=require('http'), fs=require('fs'), path=require('path');
const sl=ms=>new Promise(r=>setTimeout(r,ms)); const out=__dirname+'/screenshots/';
const MIME={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
const srv=http.createServer((q,r)=>{ let f=decodeURIComponent(q.url.split('?')[0]); if(f==='/') f='/index.html'; const fp=path.join(__dirname,f);
  fs.readFile(fp,(e,d)=>{ if(e){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'}); r.end(d); }); }).listen(8765);
(async()=>{
  const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage();
  await p.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36');
  await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,isLandscape:true,deviceScaleFactor:2});
  const errs=[]; p.on('console',m=>{ if(['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text()); }); p.on('pageerror',e=>errs.push('pageerror: '+e.message));
  p.on('requestfailed',r=>{ if(!r.url().includes('favicon')) errs.push('requestfailed: '+r.url()); });
  const res={}; const ok=(k,v)=>{ res[k]=!!v; console.log((v?'PASS ':'FAIL ')+k); };
  const ev=(f,...a)=>p.evaluate(f,...a);
  const cdp=await p.target().createCDPSession(); const act=new Map();
  const tsend=async type=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...act.entries()].map(([id,[x,y]])=>({x,y,id}))});
  const tdown=async(id,x,y)=>{ await ev((x,y)=>{ document.elementFromPoint(x,y); },x,y); act.set(id,[x,y]); await tsend('touchStart'); };
  const tmove=async(id,x,y)=>{ act.set(id,[x,y]); await tsend('touchMove'); };
  const tup=async id=>{ act.delete(id); await tsend('touchEnd'); };
  const tap=async(x,y,ms=120)=>{ await tdown(9,x,y); await sl(50); await tup(9); await sl(ms); };
  const btn=a=>ev(a=>{ const r=document.querySelector(`.tbtn[data-a="${a}"]`).getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; },a);
  const tapBtn=async(a,ms=150)=>{ const [x,y]=await btn(a); await tap(x,y,ms); };
  const canvasPt=(x,y)=>ev((x,y)=>{ const r=cv.getBoundingClientRect(); return [r.left+x/640*r.width,r.top+y/360*r.height]; },x,y);
  const flick=async(dx,dy,ms=90)=>{ await tdown(1,90,300); await sl(30); await tmove(1,90+dx,300+dy); await sl(60); await tup(1); await sl(ms); };

  await p.goto('http://localhost:8765/index.html'); await ev(()=>localStorage.clear()); await p.reload(); await sl(1000);
  ok('touch_detected', await ev(()=>TOUCH.on&&document.body.classList.contains('touch')));
  ok('touch_overlay_visible', await ev(()=>getComputedStyle(document.getElementById('touch')).display==='block'&&document.querySelectorAll('.tbtn').length===14));
  ok('required_buttons', await ev(()=>['jump','light','heavy','dodge','heal','spell','interact','pause','shoot','parry','inventory'].every(a=>document.querySelector(`.tbtn[data-a="${a}"]`))));
  ok('canvas_fits_screen', await ev(()=>{ const r=cv.getBoundingClientRect(); return r.width<=innerWidth+1&&r.height<=innerHeight+1&&(Math.abs(r.width-innerWidth)<2||Math.abs(r.height-innerHeight)<2); }));
  ok('no_page_scroll', await ev(()=>document.scrollingElement.scrollHeight<=innerHeight+1&&getComputedStyle(document.body).touchAction==='none'));
  ok('viewport_no_zoom', await ev(()=>/user-scalable=no/.test(document.querySelector('meta[name=viewport]').content)));
  ok('boot_touch_prompt', await ev(()=>mode==='boot'));
  await p.screenshot({path:out+'m0_movil_arranque.png'});
  // Tocar la pantalla arranca (y habilita el audio)
  let [cx,cy]=await canvasPt(320,200); await tap(cx,cy,1600);
  ok('tap_starts_splash', await ev(()=>mode==='cine'&&CINE.id==='splash'));
  ok('cine_only_pause_btn', await ev(()=>document.body.dataset.mode==='cine'&&getComputedStyle(document.querySelector('.tbtn[data-a=jump]')).display==='none'&&getComputedStyle(document.querySelector('.tbtn[data-a=pause]')).display!=='none'));
  await tapBtn('pause',1500); ok('pause_btn_skips_to_title', await ev(()=>mode==='title'));
  ok('guest_mode', await ev(()=>CLOUD.status==='off'&&!CLOUD.user&&!titleOptions().some(o=>/SESIÓN/.test(o))));
  await sl(300); await p.screenshot({path:out+'m1_movil_titulo_google.png'});
  // Insignia de Google tocable (sin configuración informa modo invitado)
  [cx,cy]=await canvasPt(535,27); await tap(cx,cy,200);
  ok('google_badge_tap_guest', await ev(()=>/DEPLOY|invitado/.test(CLOUD.msg)));
  // Menú con el stick: abajo mueve la selección; tocar una opción la elige
  await flick(0,70); ok('stick_menu_nav', await ev(()=>titleSel===1));
  await flick(0,-70); ok('stick_menu_nav_up', await ev(()=>titleSel===0));
  [cx,cy]=await canvasPt(320,(94+0*11)*2+10); await tap(cx,cy,400);
  ok('tap_menu_item_opens_creator', await ev(()=>mode==='creator'));
  await flick(70,0); ok('creator_stick_changes', await ev(()=>JSON.stringify(cre.look)!==JSON.stringify(defaultLook())));
  await flick(0,-70,120); ok('creator_stick_to_start', await ev(()=>/COMENZAR/.test(CRE_ROWS[cre.sel][0])));
  await p.screenshot({path:out+'m2_movil_creador.png'});
  await tapBtn('jump',900); ok('creator_confirm_A', await ev(()=>mode==='cine'&&CINE.id==='prologue'));
  [cx,cy]=await canvasPt(320,180); await tap(cx,cy,200); await tap(cx,cy,200); ok('tap_advances_cine', await ev(()=>CINE&&CINE.i>=1));
  await tapBtn('pause',800); ok('prologue_skipped', await ev(()=>mode==='play'&&!ui));
  ok('mode_play_class', await ev(()=>document.body.dataset.mode==='play'));
  await ev(()=>{ bannerM=null; roomTitle.t=0; P.inv=99; });
  // Stick a la derecha: camina
  const x0=await ev(()=>P.x); await tdown(1,90,300); await sl(30); await tmove(1,160,300); await sl(700);
  ok('stick_moves_right', await ev(x0=>P.x>x0+10&&P.face===1,x0));
  // Multi-toque: salto mientras se mantiene el stick
  const [jx,jy]=await btn('jump'); await tdown(2,jx,jy); await sl(90);
  ok('multitouch_jump_while_moving', await ev(()=>!P.onGround&&touchHeld.right&&touchHeld.jump));
  await tup(2); await sl(600); await tup(1); await sl(300);
  ok('stick_release', await ev(()=>!touchHeld.right&&!touchHeld.left));
  // Ataque, esquiva, curación, verso
  await ev(()=>{ P.state='normal'; P.vx=0; P.st=P.maxSt||100; }); await sl(100);
  const [ax,ay]=await btn('light'); await tdown(3,ax,ay); await sl(70);
  ok('attack_button', await ev(()=>P.state==='attack'));
  await tup(3); await sl(700);
  await ev(()=>{ P.state='normal'; P.stam=999; }); await tapBtn('dodge',60); ok('dodge_button', await ev(()=>P.state==='roll'));
  await sl(800);
  await ev(()=>{ P.state='normal'; P.hp=Math.max(10,P.hp-40); }); const f0=await ev(()=>P.flasks); await tapBtn('heal',1600); ok('heal_button', await ev(f0=>P.flasks===f0-1||P.state==='heal',f0));
  // Deslizar el dedo de un botón a otro cambia la acción
  const [hx,hy]=await btn('heavy'); const [dx2,dy2]=await btn('dodge'); await tdown(4,hx,hy); await sl(40); ok('heavy_held', await ev(()=>touchHeld.heavy));
  await tmove(4,dx2,dy2); await sl(40); ok('slide_between_buttons', await ev(()=>!touchHeld.heavy&&touchHeld.dodge)); await tup(4); await sl(900);
  // Captura con enemigos
  ok('touch_tutorial_text', await ev(()=>signs.some(s=>s.tt&&/SALTO/.test(s.tt))));
  await ev(()=>{ P.state='normal'; const e=ents.find(e=>e.type==='ahogado'&&!e.dead); if(e){ P.x=e.x-34; P.y=e.y+e.h-P.h; P.face=1; e.state='patrol'; } P.inv=0; }); await sl(500);
  await p.screenshot({path:out+'m3_movil_controles_tactiles.png'});
  // Pausa táctil y menú tocable
  await tapBtn('pause',300); ok('pause_button_opens_menu', await ev(()=>ui&&ui.type==='pause'&&document.body.dataset.mode==='menu'));
  await p.screenshot({path:out+'m4_movil_pausa.png'});
  [cx,cy]=await canvasPt(320,108+4*26+8); await tap(cx,cy,300); ok('tap_pause_item_options', await ev(()=>ui&&ui.type==='options'));
  await p.screenshot({path:out+'m5_movil_opciones.png'});
  [cx,cy]=await canvasPt(156+134+3*17+8,86); await tap(cx,cy,200); ok('tap_volume_slider', await ev(()=>Math.abs(MUS.vol-0.4)<0.11));
  await tapBtn('pause',300); await tapBtn('pause',300); ok('pause_closes', await ev(()=>!ui));
  await tapBtn('inventory',300); ok('inventory_button', await ev(()=>ui&&ui.type!=='pause')); await tapBtn('pause',300);
  // Rotar a vertical: aviso y pausa automática
  await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true,isLandscape:false,deviceScaleFactor:2}); await sl(500);
  ok('rotate_prompt_portrait', await ev(()=>getComputedStyle(document.getElementById('rotate')).display==='flex'));
  ok('auto_pause_portrait', await ev(()=>ui&&ui.type==='pause'));
  await p.screenshot({path:out+'m6_movil_girar_dispositivo.png'});
  await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,isLandscape:true,deviceScaleFactor:2}); await sl(400);
  ok('rotate_prompt_hidden_landscape', await ev(()=>getComputedStyle(document.getElementById('rotate')).display==='none'));
  // Guardado con marca de tiempo + sincronización (Firestore simulado: gana el más nuevo)
  await ev(()=>{ ui=null; saveGame(); });
  ok('save_has_timestamp', await ev(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).savedAt>0));
  ok('sync_logic_lww', await ev(async()=>{ const store={}; const F={doc:(db,c,id)=>c+'/'+id,getDoc:async k=>({exists:()=>!!store[k],data:()=>store[k]}),setDoc:async(k,v)=>{ store[k]=v; }};
    CLOUD.api={F,db:{}}; CLOUD.user={uid:'u1',name:'Test'};
    const r1=await cloudSync('t'); const pushed=r1==='pushed'&&store['saves/u1'].updatedAt===JSON.parse(localStorage.getItem(SAVE_KEY)).savedAt;
    const newer=JSON.parse(store['saves/u1'].data); newer.credits_marker=777; newer.savedAt=Date.now()+60000; store['saves/u1']={data:JSON.stringify(newer),updatedAt:newer.savedAt};
    const r2=await cloudSync('t'); const pulled=r2==='pulled'&&JSON.parse(localStorage.getItem(SAVE_KEY)).credits_marker===777;
    const r3=await cloudSync('t'); CLOUD.api=null; CLOUD.user=null; return pushed&&pulled&&r3==='same'; }));
  // PWA: manifiesto, íconos y service worker
  ok('manifest_ok', await ev(async()=>{ const m=await (await fetch('manifest.webmanifest')).json(); const ic=await Promise.all(m.icons.map(i=>fetch(i.src).then(r=>r.ok))); return m.display==='fullscreen'&&m.orientation==='landscape'&&ic.every(Boolean); }));
  ok('sw_active', await ev(async()=>{ const r=await Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),8000))]); return !!(r&&r.active); }));
  await sl(1500);
  ok('sw_precached', await ev(async()=>{ const ks=await caches.keys(); const c=await caches.open(ks[0]); return (await c.keys()).length>=20; }));
  // Sin conexión: recarga y sigue funcionando
  await p.setOfflineMode(true); await p.reload(); await sl(1500);
  ok('offline_reload_works', await ev(()=>typeof mode!=='undefined'&&mode==='boot'&&TOUCH.on));
  [cx,cy]=await canvasPt(320,200); await tap(cx,cy,1200); await tapBtn('pause',1200);
  ok('offline_title_continue', await ev(()=>mode==='title'&&titleOptions().includes('CONTINUAR')));
  await p.setOfflineMode(false);
  // Captura del botón de Google tal como se ve con Firebase configurado (estado simulado solo para la captura)
  await ev(()=>{ CLOUD.status='ready'; CLOUD.msg=''; }); await sl(300); await p.screenshot({path:out+'m7_movil_titulo_google_activo.png'});
  await ev(()=>{ CLOUD.status='off'; });
  const bad=errs.filter(e=>!/offline|ERR_INTERNET_DISCONNECTED/i.test(e));
  ok('no_console_errors', bad.length===0);
  console.log('ERRORS:',JSON.stringify(errs));
  const n=Object.keys(res).length, pass=Object.values(res).filter(Boolean).length; console.log(`SUMMARY ${pass}/${n}`);
  await b.close(); srv.close();
})().catch(e=>{ console.error(e); process.exit(1); });
