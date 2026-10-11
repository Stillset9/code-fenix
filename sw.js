// CODE FENIX — service worker: instala el juego y permite jugar sin conexión.
// Estrategia: precarga de todos los archivos del juego y "stale-while-revalidate" (responde desde caché y actualiza en segundo plano).
// Al publicar una versión nueva, cambiá VERSION para forzar la actualización.
const VERSION='codefenix-m4-1';
const ASSETS=["./", "index.html", "manifest.webmanifest", "firebase-config.js", "js/audio.js", "js/bg.js", "js/cine.js", "js/cloud.js", "js/core.js", "js/data.js", "js/font.js", "js/hires.js", "js/music.js", "js/render.js", "js/rig.js", "js/rooms.js", "js/sprites.js", "js/touch.js", "js/ui.js", "js/ui2.js", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  const sameOrigin=url.origin===self.location.origin;
  const firebaseSdk=url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/');
  if(!sameOrigin&&!firebaseSdk) return; // Firestore, Google y demás: siempre por red
  if(sameOrigin&&url.pathname.startsWith('/__/')) return; // rutas reservadas de Firebase Hosting (auth)
  e.respondWith(caches.open(VERSION).then(async cache=>{
    const hit=await cache.match(req,{ignoreSearch:sameOrigin});
    const net=fetch(req).then(r=>{ if(r&&(r.ok||r.type==='opaque')) cache.put(req,r.clone()); return r; }).catch(()=>null);
    if(hit){ e.waitUntil(net); return hit; }
    const r=await net; if(r) return r;
    if(req.mode==='navigate') return (await cache.match('index.html'))||Response.error();
    return Response.error();
  }));
});
