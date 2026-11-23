/* Both subject documents retain their existing question banks and storage. */
(function () {
  'use strict';
  const preference = 'cermat-selected-subject-v1';
  const frames = new Map([...document.querySelectorAll('[data-subject-frame]')].map(frame => [frame.dataset.subjectFrame, frame]));
  const ready = new Set();
  const status = document.getElementById('subject-loading');
  const preferenceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let fade=null,pending=null;
  status.style.zIndex='3';
  let selected = 'math';
  try {
    const saved = localStorage.getItem(preference);
    if (frames.has(saved)) selected = saved;
  } catch (_) {}
  const requested = new URLSearchParams(location.search).get('subject');
  if (frames.has(requested)) {
    selected = requested;
    try {localStorage.setItem(preference,selected);} catch (_) {}
  }

  function signal(subject,motion={}) {
    const frame = frames.get(subject);
    frame.contentWindow.postMessage({type:'CERMAT_SUBJECT_VISIBILITY',active:subject===selected,...motion}, location.origin);
  }

  function settle() {
    const prior=fade;fade=null;prior?.animation.cancel();
    for(const [subject,frame]of frames){
      frame.hidden=subject!==selected;
      frame.style.zIndex=subject===selected?'2':'0';
    }
  }

  function paint(motion={}) {
    const incoming=frames.get(selected),outgoing=frames.get(motion.from);
    const animate=motion.animate&&ready.has(selected)&&ready.has(motion.from)&&!preferenceMotion.matches&&!document.hidden&&!!incoming.animate;
    if(animate){
      settle();outgoing.hidden=false;incoming.hidden=false;
      outgoing.style.zIndex='1';incoming.style.zIndex='2';
      // Opacity keeps both papers in their exact original coordinate systems.
      const state={previous:motion.from,target:selected,animation:incoming.animate([{opacity:0},{opacity:1}],{duration:190,easing:'cubic-bezier(.22,1,.36,1)'})};
      fade=state;
      state.animation.finished.then(()=>{if(fade===state)settle();},()=>{});
    }
    for (const [subject, frame] of frames) {
      const active=subject===selected;
      frame.hidden=!active&&fade?.previous!==subject;
      frame.setAttribute('aria-hidden', String(!active));
      frame.inert=!active;
      frame.style.pointerEvents=active?'auto':'none';
      if(!fade)frame.style.zIndex=active?'2':'0';
      if (ready.has(subject)) signal(subject,active?{from:motion.from,animate:!!animate,keyboard:motion.keyboard}:{});
    }
    status.hidden = ready.has(selected);
    document.documentElement.dataset.subject = selected;
    document.title = 'Cermat testy · ' + (selected==='math' ? 'Matematika' : 'Čeština');
  }

  function select(subject,keyboard=false) {
    if (!frames.has(subject) || subject===selected) return;
    const from=selected;
    selected = subject;
    try {localStorage.setItem(preference, subject);} catch (_) {}
    const url=new URL(location.href);
    if(url.searchParams.has('subject')){url.searchParams.set('subject',subject);history.replaceState(null,'',url);}
    if(fade)settle();
    pending=ready.has(subject)?null:{from,keyboard};
    paint({from,keyboard,animate:true});
  }

  addEventListener('message', event => {
    if (event.origin!==location.origin) return;
    const entry = [...frames].find(([,frame]) => frame.contentWindow===event.source);
    if (!entry) return;
    if (event.data?.type==='CERMAT_SUBJECT_READY') {
      ready.add(entry[0]);
      const motion=entry[0]===selected&&pending?{...pending,animate:true}:{};
      if(entry[0]===selected)pending=null;
      paint(motion);
    }
    if (event.data?.type==='CERMAT_SELECT_SUBJECT') select(event.data.subject,!!event.data.keyboard);
    if (event.data?.type==='CERMAT_SETTLE_SUBJECT'&&entry[0]===selected)settle();
  });
  addEventListener('pagehide', () => {
    frames.get(selected)?.contentWindow.postMessage({type:'CERMAT_SUBJECT_VISIBILITY',active:false},location.origin);
  });
  addEventListener('pageshow', paint);
  preferenceMotion.addEventListener('change',()=>{if(preferenceMotion.matches)settle();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  document.getElementById('subject-retry').addEventListener('click', () => {
    const frame = frames.get(selected);
    ready.delete(selected);
    frame.src = frame.getAttribute('src');
    paint();
  });
  setTimeout(() => {
    if (ready.has(selected)) return;
    document.getElementById('subject-loading-text').textContent = 'Načítání trvá déle. Zkontroluj připojení a zkus to znovu.';
    document.getElementById('subject-retry').hidden = false;
  }, 18000);
  paint();
})();
