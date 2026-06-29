const CACHE_NAME='budget-2026-v13-amount-mode-131';
const ASSETS=['./','./index.html','./app.css','./v9.css','./v9-login.css','./v10-dark.css','./v12-product.css','./v12-full-dark.css','./v13-amount-mode.css','./app.js','./data.js','./v9.js','./v12-product.js','./v13-amount-mode.js','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const clone=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(e.request,clone));return r}).catch(()=>caches.match('./index.html'))))});
