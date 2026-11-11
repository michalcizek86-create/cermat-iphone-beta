/* GitHub Pages serves this worker under the repository's own scope. */
'use strict';
const RELEASE = '295806a59ab0db6f';
const FILES = ["./index.html","./manifest.webmanifest","./styles/notebook.2eadef9a9056.css","./assets/mathematical-notes.a4373d3a2a88.webp","./assets/paper-grain.60a3ea610bc1.webp","./assets/cermat-sans.3a330b1e6800.woff","./assets/stix-two-text.0c9a389199d1.woff","./js/bank.84ffdd99e458.js","./js/diagrams-01.0bfbde1ca480.js","./js/diagrams-02.f24ec2aa56eb.js","./js/diagrams-03.9ca59702945c.js","./js/diagrams-04.ce3495bfcc19.js","./js/diagrams-05.9db26e5e1ef7.js","./js/diagrams-06.673bb8017552.js","./js/diagrams-07.76c4fd0e5ecb.js","./js/diagrams-08.652ba8193b59.js","./js/diagrams-09.78219511a3dc.js","./js/diagrams-10.06044f70b3aa.js","./js/questions-01.da205587c574.js","./js/facts.bfb8fcad5e5b.js","./js/geometry.bbee47810086.js","./js/paper-editor.5071359d19be.js","./js/topic-tags.ce7798a23ce1.js","./js/topic-practice.1e39a7689a83.js","./js/study-store.63b4844caa16.js","./js/practice-ui.4227c27ccfb0.js","./js/student-state.ef307186d32b.js","./js/study-upgrade.ace7fa93e58c.js","./js/app.ebf231460563.js","./js/pwa.e34afd7bf522.js","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/icon-source.svg"];
const BASE = new URL('./', self.location.href);
const INDEX = new URL('index.html', BASE).href;
const PREFIX = 'cermat-offline:' + BASE.pathname + ':';
const CACHE = PREFIX + RELEASE;
const URLS = FILES.map(path => new URL(path, BASE).href);
const ALLOWED = new Set(URLS);
let preparing;

async function announce(data) {
  const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for (const client of clients) {
    if (client.url.startsWith(BASE.href)) client.postMessage({type:'CERMAT_OFFLINE',version:RELEASE,...data});
  }
}

async function status() {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map(request => request.url));
  const done = URLS.filter(url => keys.has(url)).length;
  return {version:RELEASE,ready:done===URLS.length,done,total:URLS.length};
}

async function valid(response, url) {
  if (!response?.ok || response.type==='opaque') return false;
  const type = response.headers.get('content-type') || '';
  if (/\.(png|svg|webp)$/.test(url)) return type.startsWith('image/');
  if (/\.js$/.test(url)) return /javascript/.test(type);
  if (/\.css$/.test(url)) return type.startsWith('text/css');
  if (url!==INDEX) return true;
  if (!type.includes('text/html')) return false;
  const html = await response.clone().text();
  return html.includes('<meta name="cermat-edition" content="student">') && html.includes('<meta name="cermat-release" content="'+RELEASE+'">');
}

async function precache() {
  const cache = await caches.open(CACHE);
  let next = 0, done = 0, failure;
  await announce({phase:'downloading',done,total:URLS.length});
  const download = async () => {
    while (!failure && next<URLS.length) {
      const url = URLS[next++];
      try {
        if (!await valid(await cache.match(url),url)) {
          const response = await fetch(url,{cache:'reload',credentials:'same-origin'});
          if (!await valid(response,url)) throw new Error('Nesouhlasí verze offline podkladů.');
          await cache.put(url,response);
        }
        done++;
        if (done%4===0 || done===URLS.length) await announce({phase:'downloading',done,total:URLS.length});
      } catch (error) {failure = error;}
    }
  };
  await Promise.all(Array.from({length:6},download));
  if (failure) throw failure;
  const result = await status();
  await announce({phase:'complete',...result});
}

function prepare() {
  if (!preparing) preparing = precache().finally(() => {preparing = null;});
  return preparing;
}

self.addEventListener('install', event => {
  // Activate a complete student shell promptly. An open exam is never reloaded.
  event.waitUntil(prepare().then(() => self.skipWaiting()).catch(async error => {
    await caches.delete(CACHE);
    await announce({phase:'error',ready:false});
    throw error;
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key!==CACHE);
    await Promise.all(old.map(key => caches.delete(key)));
    await self.clients.claim();
    await announce({phase:'active',...await status()});
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method!=='GET') return;
  const url = new URL(request.url);
  if (url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const page = request.mode==='navigate' && (url.pathname===BASE.pathname || url.pathname===new URL(INDEX).pathname);
  const key = page ? INDEX : url.origin+url.pathname;
  if (!ALLOWED.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const stored = await cache.match(key);
    if (stored) return stored;
    try {
      const response = await fetch(request);
      if (await valid(response,key)) {
        await cache.put(key,response.clone());
        return response;
      }
      if (!page) return response;
    } catch (error) {if (!page) throw error;}
    return new Response('<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Cermat testy</title><body><h1>Offline podklady zatím nejsou připravené</h1><p>Připoj se k internetu a otevři aplikaci znovu. Uložený postup zůstává v zařízení.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
  })());
});

self.addEventListener('message', event => {
  const type = event.data?.type;
  if (type==='CERMAT_STATUS') event.waitUntil(status().then(value => event.ports?.[0]?.postMessage(value)));
  if (type==='CERMAT_CACHE') event.waitUntil(prepare().catch(() => announce({phase:'error',ready:false})));
  if (type==='CERMAT_ACTIVATE') event.waitUntil(self.skipWaiting());
});
