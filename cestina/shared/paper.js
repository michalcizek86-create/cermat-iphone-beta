import { AnnotationLayer, objectNode } from './annotations.js?v=c1bc0cfa786d';

const vendor = new URL('../vendor/', import.meta.url);
let library;
async function getPdfLibrary() {
  if (!library) {
    library = import(new URL('pdf.min.mjs', vendor)).then(pdf => {
      pdf.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', vendor).href;
      return pdf;
    });
  }
  return library;
}

export class PaperRenderer {
  constructor() {
    this.documents = new Map();
    this.jobs = new Set();
    this.layers = new Map();
    this.closed = false;
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        this.observer.unobserve(entry.target);
        const job = this.pending.get(entry.target);
        if (job) this.draw(...job);
      }
    }, { rootMargin: '520px' });
    this.pending = new Map();
  }

  async document(path) {
    if (!this.documents.has(path)) {
      const task = (async () => {
        const pdf = await getPdfLibrary();
        const response = await fetch(new URL('../' + path, import.meta.url));
        if (!response.ok) throw new Error('Zadání není v zařízení uložené.');
        const data = new Uint8Array(await response.arrayBuffer());
        return pdf.getDocument({
          data, isEvalSupported: false, enableXfa: false, useWasm: true,
          cMapUrl: new URL('cmaps/', vendor).href, cMapPacked: true,
          wasmUrl: new URL('wasm/', vendor).href,
          standardFontDataUrl: new URL('standard_fonts/', vendor).href,
          iccUrl: new URL('iccs/', vendor).href
        }).promise;
      })();
      this.documents.set(path, task);
      task.catch(() => this.documents.delete(path));
    }
    return this.documents.get(path);
  }

  mount(element, path, pageNumber, width, height, layerKey, annotation) {
    const canvas = element.querySelector('canvas');
    const overlay = element.querySelector('svg');
    canvas.setAttribute('aria-label', 'Originální zadání, strana ' + pageNumber);
    overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if(element.hasAttribute('data-clip-top')){
      const top=Number(element.dataset.clipTop),span=Number(element.dataset.clipBottom)-top;
      element.style.overflow='hidden';
      overlay.style.top=(-100*top/span)+'%';overlay.style.height=(100*height/span)+'%';
    }
    if (annotation) {
      if (annotation.readOnly) {
        overlay.append(...annotation.state.objects.map(objectNode));
      } else {
        const layer = new AnnotationLayer(overlay, annotation.state, annotation.getTool, annotation.onChange, annotation.onText);
        this.layers.set(layerKey, layer);
        overlay.addEventListener('pointerdown', () => annotation.onSelect(layerKey), { capture: true });
      }
    }
    this.pending.set(element, [element, path, pageNumber]);
    this.observer.observe(element);
  }

  async draw(element, path, pageNumber) {
    this.pending.delete(element);
    const status = element.querySelector('.pdf-status');
    try {
      const pdf = await this.document(path);
      if (this.closed || !element.isConnected) return;
      const page = await pdf.getPage(pageNumber);
      if (this.closed || !element.isConnected) return;
      const canvas = element.querySelector('canvas');
      const scale = Math.min(2.35, Math.max(1.55, element.clientWidth / page.view[2] * 1.55));
      const viewport = page.getViewport({ scale });
      canvas.width = Math.ceil(viewport.width);
      const clipped=element.hasAttribute('data-clip-top'),top=Number(element.dataset.clipTop)||0;
      const bottom=clipped?Number(element.dataset.clipBottom):page.view[3];
      canvas.height = clipped?Math.ceil((bottom-top)*scale):Math.ceil(viewport.height);
      const job = page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, transform:clipped?[1,0,0,1,0,-top*scale]:undefined, background: '#ffffff' });
      this.jobs.add(job);
      try { await job.promise; } finally { this.jobs.delete(job); }
      if (this.closed || !element.isConnected) return;
      canvas.dataset.rendered = 'true';
      status.hidden = true;
      const text = await page.getTextContent();
      const transcript = element.closest('.exam-page')?.querySelector('.pdf-transcript-text');
      if (transcript) {
        const visible=clipped?text.items.filter(item=>{
          if(!item.transform)return false;
          const [,baseline]=viewport.convertToViewportPoint(item.transform[4],item.transform[5]);
          const middle=baseline/scale-(item.height||0)*.4;
          return middle>=top && middle<bottom;
        }):text.items;
        transcript.textContent = visible.map(item => (item.str ?? '') + (item.hasEOL ? '\n' : ' ')).join('');
      }
    } catch (error) {
      if (this.closed || !element.isConnected) return;
      status.textContent = 'Stránku se nepodařilo načíst. Připoj se k internetu nebo otevři originální PDF.';
      status.classList.add('bad');
    }
  }

  close() {
    this.closed = true;
    this.observer.disconnect();
    this.pending.clear();
    for (const job of this.jobs) job.cancel();
    for (const layer of this.layers.values()) layer.destroy();
    for (const doc of this.documents.values()) doc.then(pdf => pdf.destroy(), () => {});
  }
}
