const CACHE="pdf-concurso-edu-unificado-v3";
const ASSETS=[
  "/","/index.html","/styles.css","/brand.css","/app.js","/manifest.webmanifest",
  "/assets/logo-pdf-concurso.png",
  "/mapas/","/mapas/index.html","/mapas/styles.css","/mapas/planner.css","/mapas/app.js","/mapas/planner.js","/mapas/cards.json"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;
  }).catch(()=>caches.match("/index.html"))));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=event.notification.data?.url||"/mapas/";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if("focus" in client){
        if("navigate" in client)client.navigate(url);
        return client.focus();
      }
    }
    return clients.openWindow?clients.openWindow(url):undefined;
  }));
});