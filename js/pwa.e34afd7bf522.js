/* Installation and offline data are separate from student answers and drawings. */
(function(root){
  'use strict';
  let registration=null,deferredPrompt=null,reloading=false,dismissed=false,storagePersistent=null,toast=null;
  const state={ready:false,done:0,total:0,phase:'starting',error:'',waiting:false};
  const watched=new WeakSet();
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const percent=()=>state.total?Math.round(state.done/state.total*100):0;
  function statusText(){
    if(state.error)return state.ready?'Offline podklady jsou uložené. Aktualizaci se nepodařilo dokončit.':state.error;
    if(state.waiting)return 'Nová verze je připravená k použití.';
    if(state.phase==='downloading')return 'Stahuji podklady pro offline použití · '+percent()+' %';
    return state.ready?'Offline připraveno':'Ověřuji offline podklady…';
  }
  function card(){return `<section class="card pwa-panel" id="pwa-settings" aria-labelledby="pwa-heading"><h2 id="pwa-heading">Aplikace na iPhonu a offline</h2><div class="pwa-status-row"><strong data-pwa-status role="status">${statusText()}</strong><span data-pwa-mode>${standalone()?'Spuštěno z plochy':'Spuštěno v prohlížeči'}</span></div><progress data-pwa-progress max="100" value="${percent()}" aria-label="Stažení offline podkladů" ${state.phase==='downloading'?'':'hidden'}></progress><p>Offline sada obsahuje otázky i obrázky. Nech první stažení dokončit a potom můžeš počítat bez připojení. Odkazy na externí PDF a zdroje zajímavostí vyžadují internet.</p><div class="row"><button onclick="CermatPWA.installHelp()" data-pwa-install>${deferredPrompt?'Nainstalovat aplikaci':'Jak přidat aplikaci na plochu'}</button><button onclick="CermatPWA.retry()" data-pwa-retry>Zkontrolovat offline podklady</button><button class="p" onclick="CermatPWA.applyUpdate()" data-pwa-update ${state.waiting?'':'hidden'}>Použít připravenou aktualizaci</button></div><details id="pwa-instructions"><summary>Postup pro iPhone</summary><ol><li>Otevři tuto publikovanou adresu v Safari.</li><li>Klepni na Sdílet a potom na Přidat na plochu.</li><li>Pokud se zobrazí volba Otevřít jako webovou aplikaci, zapni ji a klepni na Přidat.</li><li>Otevři novou ikonu na ploše ještě s internetem. V Nastavení počkej na stav Offline připraveno.</li></ol></details><p class="pwa-transfer-note">Prohlížeč a aplikace na ploše mohou ukládat postup odděleně.</p><div class="row"><button onclick="CermatUpgrade.downloadBackup()">Stáhnout zálohu postupu</button><button onclick="CermatPWA.requestPersistence()">Požádat o trvalé úložiště</button></div><p data-pwa-storage role="status">${storageText()}</p><p data-pwa-message role="status"></p></section>`;}
  function storageText(){return storagePersistent===true?'Prohlížeč povolil trvalé úložiště. Pro jistotu si pravidelně stahuj zálohu.':storagePersistent===false?'Postup se automaticky ukládá v tomto zařízení. Trvalé úložiště zatím nebylo povoleno; zachovej si také zálohu postupu.':'Postup se automaticky ukládá v tomto zařízení. Vymazání dat prohlížeče odstraní i místní postup; zálohu postupu si můžeš stáhnout v Nastavení.';}
  function paint(){
    document.querySelectorAll('[data-pwa-status]').forEach(el=>{el.textContent=statusText();el.classList.toggle('pwa-error',!!state.error&&!state.ready);});
    document.querySelectorAll('[data-pwa-progress]').forEach(el=>{el.value=percent();el.hidden=state.phase!=='downloading';});
    document.querySelectorAll('[data-pwa-update]').forEach(el=>el.hidden=!state.waiting);
    document.querySelectorAll('[data-pwa-storage]').forEach(el=>el.textContent=storageText());
    document.querySelectorAll('[data-pwa-mode]').forEach(el=>el.textContent=standalone()?'Spuštěno z plochy':'Spuštěno v prohlížeči');
    const running=typeof view!=='undefined'&&view==='run';
    if(toast){toast.hidden=dismissed||running||state.ready&&!state.waiting||state.phase==='unavailable';toast.querySelector('strong').textContent=state.waiting?'Aktualizace je připravená':state.error?'Offline podklady nejsou kompletní':'Připravuji aplikaci pro offline';toast.querySelector('p').textContent=state.waiting?'Použij ji v Nastavení, až budeš mít uloženou práci.':state.error||statusText();const progress=toast.querySelector('progress');progress.value=percent();progress.hidden=state.phase!=='downloading';}
    const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content='#f8f7f3';
    const statusBar=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(statusBar)statusBar.content='default';
  }
  function showMessage(message){const el=document.querySelector('[data-pwa-message]');if(el)el.textContent=message;}
  async function ask(worker){
    if(!worker)return null;
    return new Promise(resolve=>{const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(null);},5000);channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data);};worker.postMessage({type:'CERMAT_STATUS'},[channel.port2]);});
  }
  async function check(){
    const current=await ask(registration?.active);if(current){state.ready=current.ready;state.done=current.done;state.total=current.total;if(current.ready)state.phase='complete';}state.waiting=!!registration?.waiting;paint();
  }
  function watch(reg){
    registration=reg;state.waiting=!!reg.waiting;
    if(!watched.has(reg)){watched.add(reg);reg.addEventListener('updatefound',()=>{const worker=reg.installing;state.error='';worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){state.waiting=!!reg.waiting;check();}if(worker.state==='redundant'){state.error='Stažení se nepodařilo dokončit. Zkontroluj internet a zkus přípravu znovu.';paint();}});});if(reg.active&&navigator.onLine!==false)reg.update().catch(()=>{});}
    check();
  }
  async function register(){
    if(!('serviceWorker' in navigator)||!root.isSecureContext){state.phase='unavailable';state.error=location.protocol==='file:'?'Offline instalace vyžaduje otevření přes GitHub Pages, nikoli soubor v telefonu.':'Tento prohlížeč nepodporuje offline instalaci. Online aplikace funguje dál.';paint();return;}
    try{const reg=await navigator.serviceWorker.register(new URL('./service-worker.js',document.baseURI),{scope:new URL('./',document.baseURI).href,updateViaCache:'none'});watch(reg);navigator.serviceWorker.ready.then(watch);}
    catch(error){state.phase='error';state.error='Offline přípravu se nepodařilo spustit. Zkontroluj připojení a zkus to znovu v Nastavení.';paint();}
  }
  async function requestPersistence(){
    try{storagePersistent=navigator.storage?.persist?await navigator.storage.persist():false;}catch(_){storagePersistent=false;}paint();
  }
  async function retry(){
    state.error='';dismissed=false;state.phase='starting';paint();await register();await check();
    if(registration?.active&&!state.ready)registration.active.postMessage({type:'CERMAT_CACHE'});
    if(registration?.active&&state.ready)registration.update().catch(()=>{state.error='Aktualizaci nyní nelze ověřit. Uložená offline sada zůstává dostupná.';paint();});
  }
  async function applyUpdate(){
    if(!registration?.waiting)return;
    if(typeof view!=='undefined'&&view==='run'){showMessage('Nejdřív ulož a opusť test. Aktualizace zatím počká.');return;}
    try{root.CermatUpgrade?.capture();await root.CermatUpgrade?.store?.queue;reloading=true;registration.waiting.postMessage({type:'CERMAT_ACTIVATE'});}
    catch(_){showMessage('Nejdřív se musí podařit uložit práci. Stáhni zálohu postupu a zkus to znovu.');}
  }
  async function installHelp(){
    if(deferredPrompt){const prompt=deferredPrompt;deferredPrompt=null;await prompt.prompt();await prompt.userChoice;paint();return;}
    const instructions=document.getElementById('pwa-instructions');if(instructions){instructions.open=true;instructions.scrollIntoView({block:'nearest'});}
  }
  function capture(){try{root.CermatUpgrade?.capture();}catch(_){/* Existing save feedback reports the storage error. */}}
  root.CermatPWA={state,register,retry,requestPersistence,applyUpdate,installHelp};
  const originalSettings=setV;setV=function(){return originalSettings()+card();};
  const originalRender=render;render=function(){originalRender();paint();};
  toast=document.createElement('aside');toast.id='pwa-download-note';toast.setAttribute('aria-label','Příprava offline aplikace');toast.innerHTML='<div><strong>Připravuji aplikaci pro offline</strong><button aria-label="Skrýt stav stahování" onclick="CermatPWA.dismiss()">×</button></div><p></p><progress max="100" value="0" aria-label="Stažení offline podkladů"></progress>';document.body.append(toast);
  root.CermatPWA.dismiss=()=>{dismissed=true;paint();};
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;paint();});
  addEventListener('appinstalled',()=>{deferredPrompt=null;paint();requestPersistence();});
  addEventListener('pagehide',capture);document.addEventListener('freeze',capture);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)capture();});
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type!=='CERMAT_OFFLINE')return;const data=event.data;if(data.phase==='error'){state.error='Podklady se nepodařilo stáhnout celé. Zkontroluj připojení a pokračuj v Nastavení.';}else{state.error='';state.phase=data.phase;state.done=data.done??state.done;state.total=data.total??state.total;if(data.phase==='active')state.ready=!!data.ready;if(data.phase==='complete'&&!registration?.active)state.ready=!!data.ready;}paint();if(data.phase==='complete'||data.phase==='active')check();});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload();else check();});
  }
  new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(navigator.storage?.persisted)navigator.storage.persisted().then(value=>{storagePersistent=value;paint();}).catch(()=>{});
  paint();register();
})(window);
