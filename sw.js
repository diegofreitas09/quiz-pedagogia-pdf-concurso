const CACHE="pdf-concurso-edu-unificado-v8";
const ASSETS=[
  "/","/index.html","/styles.css","/brand.css","/app.js","/manifest.webmanifest",
  "/assets/logo-pdf-concurso.png","/banks/theory.js","/banks/catalog.js","/banks/portugues.js","/banks/rlm.js","/banks/pedagogia.js",
  "/mapas/","/mapas/index.html","/mapas/styles.css","/mapas/planner.css","/mapas/app.js","/mapas/planner.js","/mapas/cards.json"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      if(client.url.includes("/mapas/") && "navigate" in client){
        try{await client.navigate(client.url)}catch{}
      }
    }
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response && response.ok)cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request,{ignoreSearch:true})) || (request.mode==="navigate" ? await cache.match("/mapas/") : undefined);
  }
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const freshType=event.request.mode==="navigate" || /\.(?:js|css|json|webmanifest)$/.test(url.pathname);
  if(freshType){
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||fetch(event.request).then(response=>{
    if(response && response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }
    return response;
  })));
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