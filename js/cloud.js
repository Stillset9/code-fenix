// CODE FENIX — inicio de sesión con Google (Firebase Authentication) y guardado en la nube (Firestore).
// Totalmente opcional: sin configuración, sin conexión o abierto como archivo local, el juego queda en modo invitado.
// Sincronización: el guardado local lleva marca de tiempo (savedAt); gana el más reciente (local o nube).
'use strict';
const CLOUD={status:'off',user:null,msg:'',busy:false,api:null,last:0};
const FB_VER='10.12.2';
function cloudConfigured(){ const c=window.FIREBASE_CONFIG; return !!(c&&c.apiKey&&c.projectId&&!/PEGAR/i.test(c.apiKey+c.projectId+c.appId)); }
async function cloudInit(){
  if(!cloudConfigured()){ CLOUD.status='off'; return; }
  if(location.protocol==='file:'){ CLOUD.status='off'; CLOUD.msg='La nube necesita el juego publicado (https)'; return; }
  CLOUD.status='loading';
  try{
    const base='https://www.gstatic.com/firebasejs/'+FB_VER+'/';
    const [A,U,F]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    const app=A.initializeApp(window.FIREBASE_CONFIG), auth=U.getAuth(app), db=F.getFirestore(app);
    CLOUD.api={U,F,auth,db};
    U.getRedirectResult(auth).catch(()=>{});
    U.onAuthStateChanged(auth,user=>{ CLOUD.user=user?{uid:user.uid,name:(user.displayName||user.email||'Jugador').split(' ')[0]}:null;
      CLOUD.msg=user?'Sesión iniciada':''; if(user) cloudSync('login'); });
    CLOUD.status='ready';
  }catch(e){ CLOUD.status='error'; CLOUD.msg='Nube no disponible: modo invitado'; }
}
async function cloudSignIn(){
  const a=CLOUD.api; if(!a){ CLOUD.msg=cloudConfigured()?'Nube no disponible: modo invitado':'Nube sin configurar (ver DEPLOY.md): modo invitado'; return; }
  const prov=new a.U.GoogleAuthProvider(); prov.setCustomParameters({prompt:'select_account'});
  try{ CLOUD.msg='Abriendo Google…'; await a.U.signInWithPopup(a.auth,prov); }
  catch(e){ const c=e&&e.code||''; if(/popup-blocked|operation-not-supported|web-storage-unsupported/.test(c)){ try{ await a.U.signInWithRedirect(a.auth,prov); }catch(e2){ CLOUD.msg='No se pudo iniciar sesión'; } }
    else CLOUD.msg=/popup-closed|cancelled/.test(c)?'Inicio de sesión cancelado':'No se pudo iniciar sesión'; }
}
async function cloudSignOut(){ const a=CLOUD.api; if(!a) return; try{ await a.U.signOut(a.auth); CLOUD.msg='Sesión cerrada: modo invitado'; }catch(e){} }
function localSave(){ try{ const s=localStorage.getItem(SAVE_KEY); if(!s) return null; const d=JSON.parse(s); return {str:s,t:d.savedAt||d.time||0}; }catch(e){ return null; } }
async function cloudPush(){
  const a=CLOUD.api, u=CLOUD.user, l=localSave(); if(!a||!u||!l) return false;
  try{ await a.F.setDoc(a.F.doc(a.db,'saves',u.uid),{data:l.str,updatedAt:l.t,name:u.name,game:'codefenix',v:1}); CLOUD.last=Date.now(); CLOUD.msg='Guardado en la nube'; return true; }
  catch(e){ CLOUD.msg='No se pudo subir la partida (se guardó en el dispositivo)'; return false; }
}
// Compara la partida local con la de la nube y se queda con la más nueva.
async function cloudSync(reason){
  const a=CLOUD.api, u=CLOUD.user; if(!a||!u) return 'guest';
  CLOUD.busy=true;
  try{ const snap=await a.F.getDoc(a.F.doc(a.db,'saves',u.uid)); const r=snap.exists()?snap.data():null, l=localSave();
    const rt=r&&r.updatedAt||0, lt=l?l.t:0;
    if(r&&r.data&&rt>lt){ localStorage.setItem(SAVE_KEY,r.data); CLOUD.msg='Partida de la nube descargada'; return 'pulled'; }
    if(l&&lt>rt){ await cloudPush(); return 'pushed'; }
    CLOUD.msg=reason==='login'?'Sesión iniciada · nube al día':'Nube al día'; return 'same';
  }catch(e){ CLOUD.msg='Sin conexión con la nube: se usa la partida local'; return 'error'; }
  finally{ CLOUD.busy=false; }
}
function cloudAfterSave(){ if(CLOUD.user) cloudPush(); }
// CONTINUAR: si hay sesión, primero sincroniza (máx. 5 s) y después carga.
function cloudThenLoad(){
  if(!CLOUD.user){ loadGame(); return; }
  CLOUD.msg='Sincronizando…'; let done=false; const go=()=>{ if(done) return; done=true; loadGame(); };
  cloudSync('load').then(go,go); setTimeout(go,5000);
}
// Botón / insignia en la pantalla de título (coordenadas nativas, arriba a la derecha).
function drawCloudBadge(){
  hiOn(); const x=438,y=10,w=194,h=34, st=CLOUD.status, act=st==='ready';
  const label=CLOUD.user?CLOUD.user.name:st==='loading'?'Conectando…':'Iniciar sesión con Google';
  ctx.fillStyle=act&&!CLOUD.user?'#f4f2ee':'rgba(20,18,28,0.9)'; ctx.fillRect(x,y,w,h); ctx.strokeStyle=act?'#c9a24a':'#3a3844'; ctx.lineWidth=1; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  ctx.globalAlpha=act||CLOUD.user?1:0.55;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x+18,y+17,11,0,7); ctx.fill(); ctx.font='bold 15px Arial,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#4285f4'; ctx.fillText('G',x+18,y+18); ctx.textAlign='left';
  stext(label,x+36,y+5,12,act&&!CLOUD.user?'#202124':'#e4dccc','left',null);
  const sub=CLOUD.user?'☁ Guardado en la nube activo':st==='off'?'Nube no configurada · modo invitado':st==='error'?'Sin conexión · modo invitado':act?'Guardá tu partida en la nube':'';
  stext(sub,x+36,y+20,10,act&&!CLOUD.user?'#5f6368':'#9a92a4','left',null); ctx.globalAlpha=1;
  if(CLOUD.msg) stext(CLOUD.msg,x+w,y+h+5,10,'#ffb050','right');
  addTap(x,y,w,h,()=>{ if(CLOUD.user) cloudSync('manual'); else cloudSignIn(); });
  hiOff();
}
cloudInit();
