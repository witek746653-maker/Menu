/* Пивной атлас: network-first navigation; never cache personal data or modify other menus. */
const atlasPagePath=new URL('beer-database.html',self.registration.scope).pathname;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.mode!=='navigate'||url.origin!==self.location.origin||url.pathname!==atlasPagePath)return;
 event.respondWith((async()=>{
  try{
   return await fetch(new Request(request,{cache:'no-store'}));
  }catch(e){
   // Fall back to the browser's normal cache rules when the network is unavailable.
   return fetch(request);
  }
 })());
});
