/* Both subject documents retain their existing question banks and storage. */
(function () {
  'use strict';
  const preference = 'cermat-selected-subject-v1';
  const frames = new Map([...document.querySelectorAll('[data-subject-frame]')].map(frame => [frame.dataset.subjectFrame, frame]));
  const ready = new Set();
  const status = document.getElementById('subject-loading');
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

  function signal(subject) {
    const frame = frames.get(subject);
    frame.contentWindow.postMessage({type:'CERMAT_SUBJECT_VISIBILITY', active:subject===selected}, location.origin);
  }

  function paint() {
    for (const [subject, frame] of frames) {
      frame.hidden = subject!==selected;
      frame.setAttribute('aria-hidden', String(frame.hidden));
      if (ready.has(subject)) signal(subject);
    }
    status.hidden = ready.has(selected);
    document.documentElement.dataset.subject = selected;
    document.title = 'Cermat testy · ' + (selected==='math' ? 'Matematika' : 'Čeština');
  }

  function select(subject) {
    if (!frames.has(subject) || subject===selected) return;
    selected = subject;
    try {localStorage.setItem(preference, subject);} catch (_) {}
    paint();
  }

  addEventListener('message', event => {
    if (event.origin!==location.origin) return;
    const entry = [...frames].find(([,frame]) => frame.contentWindow===event.source);
    if (!entry) return;
    if (event.data?.type==='CERMAT_SUBJECT_READY') {
      ready.add(entry[0]);
      paint();
    }
    if (event.data?.type==='CERMAT_SELECT_SUBJECT') select(event.data.subject);
  });
  addEventListener('pagehide', () => {
    frames.get(selected)?.contentWindow.postMessage({type:'CERMAT_SUBJECT_VISIBILITY',active:false},location.origin);
  });
  addEventListener('pageshow', paint);
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
