/* CERMAT offline package. Update this release when publishing a new package. */
'use strict';
const RELEASE='1ff8e29c7f596564';
const FILES=["./index.html","./manifest.webmanifest","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/icon-source.svg"];
const BASE=new URL('./',self.location.href);
const INDEX=new URL('index.html',BASE).href;
const PREFIX='cermat-offline:'+BASE.pathname+':';
const CACHE=PREFIX+RELEASE;
const URLS=FILES.map(path=>new URL(path,BASE).href);
const ALLOWED=new Set(URLS);
let preparing=null;

async function announce(data){
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){const url=new URL(client.url);if(url.origin===BASE.origin&&url.pathname.startsWith(BASE.pathname))client.postMessage({type:'CERMAT_OFFLINE',version:RELEASE,...data});}
}
async function status(){
  const cache=await caches.open(CACHE),keys=new Set((await cache.keys()).map(r=>r.url));
  const done=URLS.filter(url=>keys.has(url)).length;
  return{version:RELEASE,ready:done===URLS.length,done,total:URLS.length};
}
function validResponse(response,url){
  if(!response||!response.ok||response.type==='opaque')return false;
  const type=response.headers.get('content-type')||'';
  if(/\.(png|jpg|svg)$/.test(new URL(url).pathname)&&!type.startsWith('image/'))return false;
  if(url===INDEX&&!type.includes('text/html'))return false;
  return true;
}
async function precache(){
  const cache=await caches.open(CACHE);let position=0,done=0,failure=null;
  await announce({phase:'downloading',done,total:URLS.length});
  const download=async()=>{
    while(!failure&&position<URLS.length){
      const url=URLS[position++];
      try{
        let response=await cache.match(url);
        if(!validResponse(response,url)){
          response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));
          if(!validResponse(response,url))throw new Error('Offline podklad nelze stáhnout.');
          await cache.put(url,response);
        }
        done++;if(done%12===0||done===URLS.length)await announce({phase:'downloading',done,total:URLS.length});
      }catch(error){failure=error;}
    }
  };
  await Promise.all(Array.from({length:6},download));
  if(failure)throw failure;
  const result=await status();if(!result.ready)throw new Error('Offline sada není úplná.');
  await announce({phase:'complete',...result});return result;
}
function prepare(){if(!preparing)preparing=precache().finally(()=>{preparing=null;});return preparing;}
self.addEventListener('install',event=>{
  event.waitUntil(prepare().catch(async error=>{await caches.delete(CACHE);await announce({phase:'error',ready:false});throw error;}));
  // A newer release waits. An unfinished exam is never reloaded automatically.
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const old=(await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE);
    // Keep one previous release for a second window still showing its paper.
    await Promise.all(old.slice(0,-1).map(key=>caches.delete(key)));
    await self.clients.claim();await announce({phase:'active',...await status()});
  })());
});
async function cached(url){
  const current=await caches.open(CACHE),hit=await current.match(url);if(hit)return hit;
  if(/\/assets\/[a-f0-9]{24}\.png$/.test(new URL(url).pathname)){
    for(const key of (await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE).reverse()){const older=await(await caches.open(key)).match(url);if(older)return older;}
  }
  return null;
}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  const page=request.mode==='navigate'&&(url.pathname===BASE.pathname||url.pathname===new URL(INDEX).pathname);
  const key=page?INDEX:url.origin+url.pathname;
  if(!page&&!ALLOWED.has(key)&&!/\/assets\/[a-f0-9]{24}\.png$/.test(url.pathname))return;
  event.respondWith((async()=>{
    const hit=await cached(key);if(hit)return hit;
    try{
      const response=await fetch(request);
      if(ALLOWED.has(key)&&validResponse(response,key))await(await caches.open(CACHE)).put(key,response.clone());
      return response;
    }catch(error){
      if(!page)throw error;
      return new Response('<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Cermat testy</title><body><h1>Offline podklady zatím nejsou připravené</h1><p>Připoj se k internetu a otevři aplikaci znovu. Uložené odpovědi a poznámky zůstávají v zařízení.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
  })());
});
self.addEventListener('message',event=>{
  const action=event.data?.type;
  if(action==='CERMAT_STATUS')event.waitUntil(status().then(value=>event.ports?.[0]?.postMessage(value)));
  if(action==='CERMAT_CACHE')event.waitUntil(prepare().catch(()=>announce({phase:'error',ready:false})));
  if(action==='CERMAT_ACTIVATE')event.waitUntil(self.skipWaiting());
});
