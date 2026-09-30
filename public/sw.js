const CACHE='reino-static-v2';const SHELL=['/offline.html','/offline.js','/offline.css','/app-icon-192.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('reino-static-')&&key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;if(url.pathname.startsWith('/api/')||url.pathname.includes('chatgpt')||url.pathname==='/callback')return;
 if(req.mode==='navigate'&&url.pathname==='/'){event.respondWith(fetch(req).catch(()=>caches.match('/offline.html')));return}
 if(SHELL.includes(url.pathname)||url.pathname.startsWith('/_next/static/'))event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{if(response.ok){const copy=response.clone();void caches.open(CACHE).then(cache=>cache.put(req,copy))}return response})))
});
