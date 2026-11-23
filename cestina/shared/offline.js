import { button } from './ui.js';

const supported = 'serviceWorker' in navigator && window.isSecureContext;
let registration, total = 0, done = 0, busy = false, failure = '';
let archiveBytes = 0;

export async function setupOffline(data) {
  const files = data.exams.flatMap(exam=>Object.values(exam.files)).filter(file=>file.path);
  total = files.length;
  archiveBytes = files.reduce((n,file)=>n+file.bytes,0);
  addEventListener('cermat:offline-panel', refresh);
  if (!supported) return;
  try {
    registration = await navigator.serviceWorker.register(new URL('../../service-worker.js',import.meta.url), { scope:new URL('../../',import.meta.url).href, updateViaCache:'none' });
    if (!registration.active) await navigator.serviceWorker.ready;
    await refresh();
  } catch { failure = 'Offline režim se nepodařilo připravit.'; paint(); }
}
function worker() { return registration?.active; }
function send(type, onMessage) {
  const active = worker();
  if (!active) return false;
  const channel = new MessageChannel();
  channel.port1.onmessage = event => {
    onMessage(event.data);
    if (event.data.complete) channel.port1.close();
  };
  active.postMessage({type},[channel.port2]);
  return true;
}
function refresh() {
  paint();
  if (!busy) send('archive-status',data=>{done=data.done;total=data.total;paint();});
}
function paint() {
  const panel = document.getElementById('offline');
  if (!panel) return;
  const status = panel.querySelector('#offline-status');
  const progress = panel.querySelector('#offline-progress');
  const download = panel.querySelector('[data-action="cache-archive"]');
  status.textContent = failure || (!supported?'Offline režim vyžaduje stránku přes HTTPS nebo localhost.':busy?`Ukládám dokumenty · ${done} / ${total}`:total&&done===total?'Celý archiv je připravený offline.':worker()?`Aplikace je připravená. V zařízení je ${done} z ${total} dokumentů.`:'Připravuji offline režim…');
  progress.max = Math.max(1,total);
  progress.value = done;
  progress.hidden = !busy;
  download.disabled = !worker() || busy || (total>0 && done===total);
}
export function offlinePanel() {
  const size = Math.round(archiveBytes / (1024*1024));
  return `<section class="card pwa-panel" id="offline"><h2>Offline archiv</h2><p class="mut">Otevřená zadání a klíče se ukládají při načtení. Pro procvičování všech ročníků bez internetu si stáhni celý archiv${size?' (asi '+size+' MB)':''}.</p><div class="row">${button('Stáhnout celý archiv','cache-archive','','p','disabled')}<span class="mut" id="offline-status" role="status"></span></div><progress class="cz-offline-progress" id="offline-progress" aria-label="Stažené dokumenty" hidden></progress>
  <p class="mut" style="margin:14px 0 0">Na iPhonu otevři stránku v Safari a v nabídce Sdílet zvol Přidat na plochu.</p></section>`;
}
export function cacheArchive() {
  if (busy) return;
  failure = '';
  busy = true;
  paint();
  const sent = send('cache-archive',message=>{
    done=message.done;
    total=message.total;
    if(message.complete){
      busy=false;
      failure=message.failed?'Některé dokumenty se nestáhly. Zkus to znovu s připojením.':'';
    }
    paint();
  });
  if(!sent){busy=false;failure='Offline režim ještě není připravený.';paint();}
}
