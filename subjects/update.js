(() => {
  const workers = navigator.serviceWorker;
  if (!workers) return;

  const release = document.querySelector('meta[name="cermat-release"]').content;
  const button = document.getElementById('cermat-update');
  const frames = [...document.querySelectorAll('[data-subject-frame]')];
  let registration;
  let canUpdate = false;
  let lastCheck = 0;

  function paint() {
    const busy = frames.some(frame => {
      const app = frame.contentDocument?.getElementById('app');
      return app?.matches('.paperview') || app?.querySelector('.workspace-top');
    });
    button.hidden = !canUpdate || !!busy;
  }

  function observe(frame) {
    const app = frame.contentDocument?.getElementById('app');
    if (app) new MutationObserver(paint).observe(app, {childList: true, attributes: true, attributeFilter: ['class']});
    paint();
  }

  async function check(force = false) {
    if (!registration?.active || document.hidden || !navigator.onLine || (!force && Date.now() - lastCheck < 30000)) return;
    lastCheck = Date.now();
    try {
      await registration.update();
    } catch (_) { /* A failed check leaves the current version active. */ }
  }

  function report(status) {
    canUpdate = !!status?.ready && status.version !== release;
    paint();
  }

  function readStatus() {
    const worker = workers.controller;
    if (!worker) return;
    const channel = new MessageChannel();
    const stop = setTimeout(() => channel.port1.close(), 4000);
    channel.port1.onmessage = event => {
      clearTimeout(stop);
      channel.port1.close();
      if (workers.controller === worker) report(event.data);
    };
    worker.postMessage({type: 'CERMAT_STATUS'}, [channel.port2]);
  }

  function activate(worker = registration?.waiting) {
    if (worker?.state === 'installed') worker.postMessage({type: 'CERMAT_ACTIVATE'});
  }

  function watchInstall(worker) {
    if (!worker) return;
    const checkState = () => {
      if (worker.state === 'installing') return;
      worker.removeEventListener('statechange', checkState);
      activate(worker);
    };
    worker.addEventListener('statechange', checkState);
    checkState();
  }

  button.onclick = () => {
    paint();
    if (!button.hidden) location.reload();
  };
  for (const frame of frames) {
    frame.addEventListener('load', () => observe(frame));
    observe(frame);
  }
  workers.addEventListener('controllerchange', readStatus);
  addEventListener('pageshow', () => {activate(); readStatus(); check();});
  addEventListener('online', () => check(true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { activate(); readStatus(); check(); }
  });
  setInterval(() => { if (!document.hidden) activate(); check(); }, 60000);
  workers.register('./service-worker.js', {scope: './', updateViaCache: 'none'}).then(reg => {
    registration = reg;
    registration.addEventListener('updatefound', () => watchInstall(registration.installing));
    watchInstall(registration.installing);
    activate();
    readStatus();
    check();
  }).catch(() => {});
})();
