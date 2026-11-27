/* Both subject documents retain their existing question banks and storage. */
(function () {
  'use strict';
  const preference = 'cermat-selected-subject-v1';
  const frames = new Map([...document.querySelectorAll('[data-subject-frame]')].map(frame => [frame.dataset.subjectFrame, frame]));
  const ready = new Set();
  const status = document.getElementById('subject-loading');
  const preferenceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const motionStyle = getComputedStyle(document.documentElement);
  const fadeTiming = {
    duration: parseFloat(motionStyle.getPropertyValue('--motion-subject')) || 0,
    easing: motionStyle.getPropertyValue('--motion-blend').trim() || 'ease-out'
  };
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
    frame.contentWindow.postMessage({type:'CERMAT_SUBJECT_VISIBILITY',active:subject===selected,choice:selected,...motion}, location.origin);
  }

  function settle() {
    const prior=fade;fade=null;prior?.animation.cancel();
    for (const detail of prior?.content || []) detail.cancel();
    for(const [subject,frame]of frames){
      frame.hidden=subject!==selected;
      frame.style.zIndex=subject===selected?'2':'0';
    }
  }

  function blendFrom(from) {
    if (fade) {
      // The same two documents are still stacked. Retrace the current blend.
      fade.animation.reverse();
      for (const detail of fade.content) detail.reverse();
      return;
    }
    const incoming = frames.get(selected), outgoing = frames.get(from);
    outgoing.hidden = incoming.hidden = false;
    outgoing.style.zIndex = '1'; incoming.style.zIndex = '2';
    const animation = incoming.animate([
      {opacity:0}, {opacity:0,offset:.16}, {opacity:1,offset:.58}, {opacity:1}
    ], fadeTiming);
    animation.id = 'cermat-subject-blend';
    const content = [];
    const direction = selected === 'cz' ? 1 : -1;
    // Headers and paper coordinates stay fixed. Only visible pieces of editorial content travel.
    for (const frame of [outgoing, incoming]) {
      const entering = frame === incoming;
      const frames = entering ? [
        {opacity:.16, transform:'translateX(' + direction*32 + 'px)'},
        {opacity:.35, transform:'translateX(' + direction*23 + 'px)', offset:.36},
        {opacity:1, transform:'translateX(0px)'}
      ] : [
        {opacity:1, transform:'translateX(0px)'},
        {opacity:.12, transform:'translateX(' + -direction*7 + 'px)', offset:.36},
        {opacity:.04, transform:'translateX(' + -direction*12 + 'px)'}
      ];
      for (const el of frame.contentWindow.CermatMotion?.subjectContent?.() || []) {
        const detail = el.animate(frames, {...fadeTiming, fill:'both'});
        detail.id = entering ? 'cermat-subject-enter' : 'cermat-subject-leave';
        content.push(detail);
      }
    }
    fade = {animation,content};
    animation.finished.then(() => { if (fade?.animation === animation) settle(); }, () => {});
  }

  function paint(motion={}) {
    const animate = motion.animate && ready.has(selected) && ready.has(motion.from) &&
      !preferenceMotion.matches && !document.hidden && fadeTiming.duration && !!frames.get(selected).animate;
    if (animate) blendFrom(motion.from);
    const waitingOnSubject = !ready.has(selected) && ready.has(pending?.from);
    for (const [subject, frame] of frames) {
      const active=subject===selected;
      frame.hidden = !fade && (waitingOnSubject ? subject !== pending.from : !active);
      frame.setAttribute('aria-hidden', String(!active));
      frame.inert=!active;
      frame.style.pointerEvents=active?'auto':'none';
      if(!fade)frame.style.zIndex=active?'2':'0';
      if (ready.has(subject)) signal(subject,{from:motion.from,position:motion.position,animate:!!animate,keyboard:active && motion.keyboard});
    }
    status.hidden = ready.has(selected) || waitingOnSubject;
    document.documentElement.dataset.subject = selected;
    document.title = 'Cermat testy · ' + (selected==='math' ? 'Matematika' : 'Čeština');
  }

  function select(subject,keyboard=false,position) {
    if (!frames.has(subject) || subject===selected) return;
    const from=selected;
    selected = subject;
    try {localStorage.setItem(preference, subject);} catch (_) {}
    const url=new URL(location.href);
    if(url.searchParams.has('subject')){url.searchParams.set('subject',subject);history.replaceState(null,'',url);}
    pending=ready.has(subject)?null:{from,keyboard,position};
    paint({from,keyboard,position,animate:true});
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
    if (event.data?.type==='CERMAT_SELECT_SUBJECT') select(event.data.subject,!!event.data.keyboard,event.data.position);
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
    status.hidden = false;
    document.getElementById('subject-loading-text').textContent = 'Načítání trvá déle. Zkontroluj připojení a zkus to znovu.';
    document.getElementById('subject-retry').hidden = false;
  }, 18000);
  paint();
})();
