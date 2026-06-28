const CACHE_NAME='budget-2026-v10-dark-formulas';
const ASSETS=['./','./index.html','./app.css','./v9.css','./v9-login.css','./v10-dark.css','./app.js','./data.js','./v9.js','./v10-formulas.js','./manifest.webmanifest'];
const enhance=html=>{
  let out=html;
  if(!out.includes('v9-login.css')) out=out.replace('</head>','<link rel="stylesheet" href="./v9-login.css?v=4"></head>');
  if(!out.includes('v10-dark.css')) out=out.replace('</head>','<link rel="stylesheet" href="./v10-dark.css?v=1"></head>');
  if(!out.includes('v10-formulas.js')) out=out.replace('</body>','<script src="./v10-formulas.js?v=1"></script></body>');
  return out;
};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.pathname.endsWith('/')||u.pathname.endsWith('/index.html')){e.respondWith(fetch(e.request).then(r=>r.text()).then(t=>new Response(enhance(t),{headers:{'Content-Type':'text/html; charset=utf-8'}})).catch(()=>caches.match('./index.html').then(r=>r?r.text():'').then(t=>new Response(enhance(t),{headers:{'Content-Type':'text/html; charset=utf-8'}}))));return}e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const clone=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(e.request,clone));return r}).catch(()=>caches.match('./index.html'))))});
