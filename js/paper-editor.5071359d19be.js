(function (root) {
  'use strict';
  const G = root.CermatGeometry;
  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(Number(value).toFixed(2));
  const format = value => number(value).toLocaleString('cs-CZ');
  const path = points => points.map((p, i) => (i ? 'L' : 'M') + number(p[0]) + ' ' + number(p[1])).join(' ');
  const point = p => number(p[0]) + ',' + number(p[1]);
  const text = (x, y, value, extra = '') => `<text x="${number(x)}" y="${number(y)}" fill="currentColor" font-family="Arial,sans-serif" font-size="19" ${extra}>${safe(value)}</text>`;
  function objectMarkup(o, interactive = true) {
    const color = /^#[a-f0-9]{6}$/i.test(o.color || '') ? o.color : '#24334a';
    const width = Math.max(.4, Math.min(80, Number(o.width) || 2.4));
    const line = (a, b, attrs = '') => `<line x1="${number(a[0])}" y1="${number(a[1])}" x2="${number(b[0])}" y2="${number(b[1])}" ${attrs}/>`;
    const dot = p => `<circle cx="${number(p[0])}" cy="${number(p[1])}" r="3" fill="currentColor" stroke="none"/>`;
    let content = '', label = '';
    if (o.type === 'pencil' || o.type === 'highlight') {
      content = o.points.length === 1 ? `<circle cx="${number(o.points[0][0])}" cy="${number(o.points[0][1])}" r="${width / 2}" fill="currentColor"/>` : `<path d="${path(o.points)}"/>`;
      label = o.type === 'highlight' ? 'Zvýraznění' : 'Ručně psaný tah';
    } else if (o.type === 'text') {
      content = o.text.split('\n').map((s, i) => text(o.x, o.y + i * o.size * 1.35, s, `style="font-size:${o.size}px" stroke="none"`)).join('');
      label = 'Text: ' + o.text;
    } else if (o.type === 'point') {
      content = dot(o.p) + line([o.p[0] - 7, o.p[1]], [o.p[0] + 7, o.p[1]]) + line([o.p[0], o.p[1] - 7], [o.p[0], o.p[1] + 7]) + text(o.p[0] + 11, o.p[1] - 11, o.label, 'stroke="none"');
      label = 'Bod ' + o.label;
    } else if (o.type === 'circle' || o.type === 'arc') {
      if (o.type === 'circle') content = `<circle cx="${number(o.c[0])}" cy="${number(o.c[1])}" r="${number(o.r)}"/>`;
      else {
        const a = G.polar(o.c, o.r, o.start), b = G.polar(o.c, o.r, o.end), delta = (o.end - o.start + G.TAU) % G.TAU;
        content = `<path d="M${point(a)} A${number(o.r)},${number(o.r)} 0 ${delta > Math.PI ? 1 : 0} 1 ${point(b)}"/>`;
      }
      content += dot(o.c);
      label = (o.type === 'circle' ? 'Kružnice' : 'Oblouk') + ', poloměr ' + format(G.mm(o.r)) + ' mm';
    } else if (o.type === 'angle') {
      const r = 95, base = G.bearing(o.v, o.a), delta = G.signedAngle(o.a, o.v, o.b), sign = delta < 0 ? -1 : 1;
      const end = G.polar(o.v, r, base + sign * Math.PI);
      content = line(o.v, o.a) + line(o.v, o.b) + `<path d="M${point(G.polar(o.v, r, base))} A${r},${r} 0 0 ${sign > 0 ? 1 : 0} ${point(end)}" stroke-opacity=".45"/>`;
      for (let degree = 0; degree <= 180; degree += 5) {
        const rad = base + sign * degree * Math.PI / 180;
        content += line(G.polar(o.v, degree % 30 ? 88 : 81, rad), G.polar(o.v, r, rad), 'stroke-width="1"');
        if (degree % 30 === 0) { const p = G.polar(o.v, 112, rad); content += text(p[0], p[1], degree, 'font-size="13" style="font-size:13px" stroke="none" text-anchor="middle"'); }
      }
      const labelPoint = G.polar(o.v, 148, base + delta / 2);
      content += text(labelPoint[0], labelPoint[1], format(G.angle(o.a, o.v, o.b)) + '°', 'stroke="none" text-anchor="middle" style="font-size:24px"');
      label = 'Úhel ' + format(G.angle(o.a, o.v, o.b)) + ' stupňů';
    } else if (o.type === 'rect') {
      content = `<rect x="${Math.min(o.a[0], o.b[0])}" y="${Math.min(o.a[1], o.b[1])}" width="${Math.abs(o.b[0] - o.a[0])}" height="${Math.abs(o.b[1] - o.a[1])}"/>`;
      label = 'Obdélník';
    } else if (o.type === 'triangle' || o.type === 'polygon') {
      content = `<polygon points="${o.points.map(point).join(' ')}"/>`; label = o.type === 'triangle' ? 'Trojúhelník' : 'Mnohoúhelník';
    } else if (o.type === 'ruler') {
      const length = G.distance(o.a, o.b), degree = G.bearing(o.a, o.b) * 180 / Math.PI;
      let ticks = '';
      for (let i = 0; i <= Math.floor(length / G.U); i++) {
        const x = i * G.U, major = i % 10 === 0;
        ticks += `<line x1="${x}" x2="${x}" y1="0" y2="${major ? -18 : i % 5 === 0 ? -12 : -7}" stroke-width="1"/>`;
        if (major) ticks += text(x, -24, i, 'stroke="none" text-anchor="middle" style="font-size:13px"');
      }
      content = `<g transform="translate(${point(o.a)}) rotate(${degree})"><rect x="0" y="-46" width="${length}" height="46" fill="currentColor" fill-opacity=".07" stroke-opacity=".4"/>${ticks}<line x1="0" y1="0" x2="${length}" y2="0"/></g>`;
      content += text((o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2 + 28, format(G.mm(length)) + ' mm', 'stroke="none" text-anchor="middle"');
      label = 'Pravítko ' + format(G.mm(length)) + ' mm';
    } else if (o.a && o.b) {
      if (o.type === 'line') {
        const t = G.bearing(o.a, o.b);
        content = line(G.polar(o.a, -5000, t), G.polar(o.a, 5000, t)); label = 'Přímka';
      } else { content = line(o.a, o.b) + dot(o.a) + dot(o.b); label = 'Úsečka ' + format(G.mm(G.distance(o.a, o.b))) + ' mm'; }
    }
    return `<g data-ink="${safe(o.id)}" ${interactive ? `role="button" tabindex="0" aria-label="${safe(label)}"` : ''} color="${color}" stroke="currentColor" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"${o.type === 'highlight' ? ' opacity=".28"' : ''}>${content}</g>`;
  }
  function emptyState(height = 1300) { return {version: 1, width: 1000, height, objects: [], undo: [], redo: [], view: {zoom: 1, x: 0, y: 0}}; }
  const instructions = {
    navigate: 'Prohlížej zadání a posouvej stránku. Pro psaní vyber Tužku.',
    pan: 'Táhni papír. Dvěma prsty můžeš papír přibližovat a posouvat.',
    pencil: 'Piš myší, prstem nebo perem. Zadání pod kresbou zůstává chráněné.',
    erase: 'Inkoust mažeš po částech, geometrické objekty celé. Zadání se nesmaže.',
    select: 'Vyber poznámku a přetáhni ji. Šipky ji posunou, Delete ji odstraní.',
    segment: 'Táhni mezi krajními body. Přesnou délku můžeš zadat v nastavení.',
    line: 'Dva body určují přímku. Přímka pokračuje přes celý pracovní papír.',
    ruler: 'Táhni od začátku ke konci pravítka. Rysky označují milimetry pracovního papíru.',
    circle: 'Přidrž střed a tažením nastav poloměr. Lze zadat také přesný poloměr.',
    arc: 'Klepni na střed, začátek a konec oblouku. Oblouk vede po směru hodinových ručiček.',
    angle: 'Klepni na vrchol, první rameno a druhé rameno. Zadaný úhel stačí umístit dvěma body.',
    point: 'Klepnutím umísti pojmenovaný bod. Jeho název můžeš upravit.',
    triangle: 'Postupně vyber tři vrcholy trojúhelníku.',
    rect: 'Tažením mezi protilehlými vrcholy vytvoř obdélník.',
    polygon: 'Postupně vyber vrcholy a stiskni Uzavřít mnohoúhelník.',
    highlight: 'Táhni přes důležitou část zadání. Zvýraznění je průsvitné.',
    text: 'Zadej text v nastavení nástroje a klepni na místo v papíru.'
  };
  class Editor {
    constructor(container, pages, options = {}) {
      this.container = container; this.pages = new Map(); this.options = {tool:'navigate', color:'#24334a', width:2.4, size:32, snap:true, ...options};
      this.selected = null; this.active = null; this.staged = []; this.pointers = new Map(); this.gesture = null; this.destroyers = [];
      this.change = options.onChange || (() => {}); this.status = options.onStatus || (() => {}); this.selection = options.onSelection || (() => {});
      for (const page of pages) {
        const svg = container.querySelector(`[data-paper="${CSS.escape(page.key)}"]`);
        if (!svg) continue;
        const state = page.state || emptyState(page.height);
        state.height = page.height || state.height; state.width = 1000; state.objects ||= []; state.undo ||= []; state.redo ||= []; state.view ||= {zoom:1,x:0,y:0};
        const entry = {...page, svg, state, layer: svg.querySelector('.ink-layer'), preview: svg.querySelector('.ink-preview'), candidates: null, rendered:new Map(), renderOrder:[]};
        this.pages.set(page.key, entry); this.draw(entry); this.applyView(entry);
        if (!options.readOnly) this.bind(entry);
      }
      if (this.pages.size) this.activate(this.pages.keys().next().value);
      this.keydown = event => this.key(event);
      if (!options.readOnly) document.addEventListener('keydown', this.keydown);
      this.setTool(this.options.tool);
    }
    bind(page) {
      const events = {pointerdown:e=>this.down(page,e),pointermove:e=>this.motion(page,e),pointerup:e=>this.up(page,e),pointercancel:e=>this.up(page,e)};
      for (const [name, fn] of Object.entries(events)) { page.svg.addEventListener(name, fn); this.destroyers.push(()=>page.svg.removeEventListener(name,fn)); }
      const focus = e => { const target=e.target.closest('[data-ink]'); if(target){this.activate(page.key);this.selected=target.dataset.ink;this.draw(page);this.selection(this.selectedObject());} };
      page.svg.addEventListener('focusin', focus); this.destroyers.push(()=>page.svg.removeEventListener('focusin',focus));
    }
    activate(key) {
      if (!this.pages.has(key)) return;
      if (this.active !== key) { this.finishGesture(); this.staged=[]; this.selected=null; this.active=key; this.selection(null); }
      this.updateStatus();
    }
    page() { return this.pages.get(this.active); }
    selectedObject() { return this.page()?.state.objects.find(o=>o.id===this.selected) || null; }
    setTool(tool) {
      this.finishGesture(); this.staged=[]; this.selected=null; this.options.tool=tool;
      for (const page of this.pages.values()) {
        page.svg.style.touchAction=tool==='navigate'?'pan-y pinch-zoom':'none';
        page.svg.dataset.tool=tool;
        if(page.preview)page.preview.innerHTML='';
        this.draw(page);
      }
      this.selection(null);
      this.updateStatus();
    }
    configure(changes) { Object.assign(this.options,changes); this.updateStatus(); }
    screenPoint(page, event) {
      const matrix=page.svg.getScreenCTM();
      if(!matrix)return [0,0];
      const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
      return [p.x,p.y,event.pointerType==='pen'?(event.pressure||.5):.5];
    }
    tolerance(page, pixels=10) { const r=page.svg.getBoundingClientRect(); return pixels*1000/(r.width*page.state.view.zoom || 1); }
    point(page,event,allowSnap=true) {
      const p=this.screenPoint(page,event);
      if(!allowSnap||!this.options.snap)return p;
      page.candidates ||= G.snapCandidates(page.state.objects.filter(o=>o.id!==this.selected));
      const candidate=G.snap(p,page.candidates,this.tolerance(page));
      this.snapped=candidate.snapped?candidate.point:null;
      return [...candidate.point,p[2]];
    }
    down(page,event) {
      if(event.button!==0&&event.pointerType!=='touch'&&event.pointerType!=='pen')return;
      this.activate(page.key);
      if(this.options.tool==='navigate')return;
      event.preventDefault();
      try{page.svg.setPointerCapture(event.pointerId);}catch(_){}
      this.pointers.set(event.pointerId,[event.clientX,event.clientY]);
      if(this.pointers.size===2){
        if(this.gesture?.before)page.state.objects=this.gesture.before;
        this.gesture=null;this.staged=[];page.preview.innerHTML='';this.draw(page);
        const [a,b]=[...this.pointers.values()],r=page.svg.getBoundingClientRect();
        const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        this.gesture={kind:'pinch',distance:G.distance(a,b)||1,view:{...page.state.view},world:this.screenPoint(page,{clientX:mid[0],clientY:mid[1]}),rect:r};return;
      }
      if(this.pointers.size>2)return;
      const p=this.point(page,event),tool=this.options.tool;
      if(tool==='pan'){this.gesture={kind:'pan',start:[event.clientX,event.clientY],view:{...page.state.view}};return;}
      const before=G.clone(page.state.objects);
      if(tool==='select'){
        const hit=[...page.state.objects].reverse().find(o=>G.hit(o,p,this.tolerance(page)));
        this.selected=hit?.id||null;page.candidates=null;this.gesture=hit?{kind:'move',start:p,original:G.clone(hit),before}:null;
        this.draw(page);this.selection(hit||null);return;
      }
      if(tool==='erase'){this.gesture={kind:'erase',before};page.state.objects=G.erase(page.state.objects,p,this.tolerance(page,12));this.draw(page);return;}
      if(tool==='pencil'||tool==='highlight'){
        const item=G.construct(tool,[p],{...this.options,color:tool==='highlight'&&this.options.color==='#24334a'?'#d8ad48':this.options.color});
        this.gesture={kind:'stroke',item,before};this.preview(page,item);return;
      }
      if(['segment','line','ruler','circle','rect'].includes(tool)) { this.gesture={kind:'shape',start:p,end:p,before,tool};return; }
      this.gesture={kind:'click',start:p,before,tool};
    }
    motion(page,event) {
      if(this.options.tool==='navigate')return;
      if(this.pointers.has(event.pointerId))this.pointers.set(event.pointerId,[event.clientX,event.clientY]);
      const gesture=this.gesture;
      if(gesture?.kind==='pinch'&&this.pointers.size>=2){
        const [a,b]=[...this.pointers.values()],r=gesture.rect,z=Math.min(5,Math.max(.5,gesture.view.zoom*G.distance(a,b)/gesture.distance));
        page.state.view={zoom:z,x:gesture.world[0]-((a[0]+b[0])/2-r.left)*1000/(r.width*z),y:gesture.world[1]-((a[1]+b[1])/2-r.top)*page.state.height/(r.height*z)};
        this.applyView(page);this.updateStatus();return;
      }
      if(gesture?.kind==='pan'){
        const r=page.svg.getBoundingClientRect();page.state.view={...gesture.view,x:gesture.view.x-(event.clientX-gesture.start[0])*1000/(r.width*gesture.view.zoom),y:gesture.view.y-(event.clientY-gesture.start[1])*page.state.height/(r.height*gesture.view.zoom)};
        this.applyView(page);return;
      }
      const p=this.point(page,event,!['pencil','highlight','erase'].includes(this.options.tool));
      if(gesture?.kind==='stroke'){
        const samples=event.getCoalescedEvents?event.getCoalescedEvents():[event];
        for(const sample of samples.length?samples:[event]){const q=this.screenPoint(page,sample),last=gesture.item.points.at(-1);if(G.distance(q,last)>.45)gesture.item.points.push(q);}
        this.preview(page,gesture.item);
      }else if(gesture?.kind==='shape'){gesture.end=p;this.preview(page,G.construct(gesture.tool,[gesture.start,p],this.options));}
      else if(gesture?.kind==='move'){
        const item=G.move(gesture.original,p[0]-gesture.start[0],p[1]-gesture.start[1]);page.state.objects=page.state.objects.map(o=>o.id===item.id?item:o);this.draw(page);
      }else if(gesture?.kind==='erase'){page.state.objects=G.erase(page.state.objects,p,this.tolerance(page,12));this.draw(page);}
      else if(this.staged.length){
        const pts=[...this.staged,p],tool=this.options.tool;
        if((tool==='angle'||tool==='arc')&&pts.length===2)this.preview(page,G.construct('segment',pts,this.options));
        else if(tool==='polygon')this.preview(page,G.construct('polygon',pts,this.options));
        else if(pts.length>=3)this.preview(page,G.construct(tool,pts,this.options));
        else this.preview(page,G.construct('segment',pts,this.options));
      }
    }
    up(page,event) {
      this.pointers.delete(event.pointerId);
      if(this.gesture?.kind==='pinch'){
        if(this.pointers.size<2){this.gesture=null;this.pointers.clear();this.change(page.key);this.updateStatus();}return;
      }
      if(this.pointers.size)return;
      if(this.gesture?.kind==='shape')this.gesture.end=this.point(page,event);
      if(this.gesture?.kind==='stroke'){
        const last=this.gesture.item.points.at(-1),p=this.screenPoint(page,event);
        if(G.distance(last,p)>.45)this.gesture.item.points.push(p);
      }
      if(this.gesture?.kind==='click'){
        const tool=this.gesture.tool,p=this.point(page,event),before=this.gesture.before;this.gesture=null;
        if(tool==='point'){
          let label=this.options.label;
          if(!label){const labels=new Set(page.state.objects.filter(o=>o.type==='point').map(o=>o.label));label='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(s=>!labels.has(s))||'P';}
          page.state.objects.push(G.construct(tool,[p],{...this.options,label}));this.commit(page,before);return;
        }
        if(tool==='text'){
          if(!String(this.options.text||'').trim()){this.status({...this.information(),message:'Nejprve napiš text v nastavení nástroje.'});return;}
          page.state.objects.push(G.construct(tool,[p],this.options));this.commit(page,before);return;
        }
        this.staged.push(p);
        const count=tool==='angle'&&Number(this.options.angle)>0?2:3;
        if(tool!=='polygon'&&this.staged.length>=count){page.state.objects.push(G.construct(tool,this.staged,this.options));this.staged=[];this.commit(page,before);}
        this.updateStatus();return;
      }
      this.finishGesture();
    }
    finishGesture() {
      const page=this.page(),gesture=this.gesture;
      if(!page||!gesture)return;
      this.gesture=null;
      if(gesture.kind==='stroke')page.state.objects.push(gesture.item);
      if(gesture.kind==='shape'&&G.distance(gesture.start,gesture.end)>.5)page.state.objects.push(G.construct(gesture.tool,[gesture.start,gesture.end],this.options));
      if(gesture.before)this.commit(page,gesture.before);else{this.change(page.key);this.updateStatus();}
      page.preview.innerHTML='';
    }
    closePolygon() {
      const page=this.page();if(!page||this.staged.length<3)return;
      const before=G.clone(page.state.objects);page.state.objects.push(G.construct('polygon',this.staged,this.options));this.staged=[];this.commit(page,before);
    }
    commit(page,before) {
      if(page.previewFrame){cancelAnimationFrame(page.previewFrame);page.previewFrame=null;}page.preview.innerHTML='';
      const command=G.diff(before,page.state.objects);
      if(command){page.state.undo.push(command);page.state.undo=page.state.undo.slice(-40);page.state.redo=[];page.candidates=null;this.change(page.key);}
      this.draw(page);this.updateStatus();
    }
    undo() {
      this.finishGesture();const page=this.page(),command=page?.state.undo.pop();if(!command)return;
      page.state.objects=G.apply(page.state.objects,command,'before');page.state.redo.push(command);page.candidates=null;this.selected=null;this.draw(page);this.change(page.key);this.selection(null);this.updateStatus();
    }
    redo() {
      const page=this.page(),command=page?.state.redo.pop();if(!command)return;
      page.state.objects=G.apply(page.state.objects,command,'after');page.state.undo.push(command);page.candidates=null;this.draw(page);this.change(page.key);this.updateStatus();
    }
    removeSelected() {
      const page=this.page();if(!page||!this.selected)return;const before=G.clone(page.state.objects);
      page.state.objects=page.state.objects.filter(o=>o.id!==this.selected);this.selected=null;this.commit(page,before);this.selection(null);
    }
    editSelected(changes,notifySelection=true) {
      const page=this.page(),selected=this.selectedObject();if(!selected)return;
      const before=G.clone(page.state.objects);page.state.objects=page.state.objects.map(o=>o.id===selected.id?G.edit(o,changes):o);this.commit(page,before);if(notifySelection)this.selection(this.selectedObject());
    }
    lineAlongRuler() {
      const page=this.page(),ruler=this.selectedObject();if(!ruler||ruler.type!=='ruler')return;
      const before=G.clone(page.state.objects);page.state.objects.push(G.construct('segment',[ruler.a,ruler.b],{...this.options,length:0}));this.commit(page,before);
    }
    clear() {const page=this.page();if(!page)return;const before=G.clone(page.state.objects);page.state.objects=[];this.selected=null;this.commit(page,before);this.selection(null);}
    applyView(page) {
      const v=page.state.view,W=1000/v.zoom,H=page.state.height/v.zoom;
      v.x=v.zoom<1?(1000-W)/2:Math.max(0,Math.min(1000-W,v.x));
      v.y=v.zoom<1?(page.state.height-H)/2:Math.max(0,Math.min(page.state.height-H,v.y));
      page.svg.setAttribute('viewBox',[v.x,v.y,W,H].join(' '));
    }
    zoom(value) {
      const page=this.page();if(!page)return;const v=page.state.view,z=Math.max(.5,Math.min(5,Number(value)));
      v.x+=500/v.zoom-500/z;v.y+=page.state.height/(2*v.zoom)-page.state.height/(2*z);v.zoom=z;this.applyView(page);this.change(page.key);this.updateStatus();
    }
    draw(page) {
      if(!page.layer)return;
      const wanted=new Set(page.state.objects.map(o=>o.id));
      for(const [key,cached]of page.rendered){if(!wanted.has(key)){cached.node.remove();page.rendered.delete(key);}}
      for(const object of page.state.objects){
        const cached=page.rendered.get(object.id);if(cached?.object===object)continue;
        const wrapper=document.createElementNS('http://www.w3.org/2000/svg','g');wrapper.innerHTML=objectMarkup(object,!this.options.readOnly);const node=wrapper.firstElementChild;
        if(cached)cached.node.replaceWith(node);else page.layer.appendChild(node);
        page.rendered.set(object.id,{object,node});
      }
      const order=page.state.objects.map(o=>o.id);
      if(order.length!==page.renderOrder.length||order.some((key,index)=>key!==page.renderOrder[index]))for(const key of order)page.layer.appendChild(page.rendered.get(key).node);
      page.renderOrder=order;
      page.layer.querySelector('.ink-selection')?.remove();
      const selected=page.state.objects.find(o=>o.id===this.selected&&this.active===page.key);
      if(selected){const b=G.bounds(selected),pad=8,box=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [key,value]of Object.entries({class:'ink-selection',x:b[0]-pad,y:b[1]-pad,width:Math.max(8,b[2]-b[0]+pad*2),height:Math.max(8,b[3]-b[1]+pad*2),fill:'none',stroke:'#3779bf','stroke-width':1.5,'stroke-dasharray':'5 4','vector-effect':'non-scaling-stroke','pointer-events':'none'}))box.setAttribute(key,value);page.layer.appendChild(box);}
    }
    preview(page,item) {
      page.pendingPreview=item;if(page.previewFrame)return;
      page.previewFrame=requestAnimationFrame(()=>{page.previewFrame=null;if(page.preview)page.preview.innerHTML=objectMarkup(page.pendingPreview,false)+(this.snapped?`<circle cx="${this.snapped[0]}" cy="${this.snapped[1]}" r="6" stroke="#3779bf" fill="none" vector-effect="non-scaling-stroke"/>`:'');});
    }
    information() {
      const page=this.page();return{page:this.active,tool:this.options.tool,message:(instructions[this.options.tool]||'')+(this.staged.length?' Vybráno bodů: '+this.staged.length+'.':''),undo:!!page?.state.undo.length,redo:!!page?.state.redo.length,zoom:page?.state.view.zoom||1,selected:this.selectedObject(),staged:this.staged.length};
    }
    updateStatus() {this.status(this.information());}
    key(event) {
      if(event.target.closest('input,textarea,select,[contenteditable]'))return;
      if(!this.container.isConnected)return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?this.redo():this.undo();return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();this.redo();return;}
      if(event.key==='Escape'){this.staged=[];this.finishGesture();for(const p of this.pages.values())p.preview.innerHTML='';this.updateStatus();return;}
      if((event.key==='Delete'||event.key==='Backspace')&&this.selected){event.preventDefault();this.removeSelected();return;}
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      if(delta&&this.selected){event.preventDefault();const page=this.page(),before=G.clone(page.state.objects),factor=event.shiftKey?10:1;page.state.objects=page.state.objects.map(o=>o.id===this.selected?G.move(o,delta[0]*factor,delta[1]*factor):o);this.commit(page,before);}
    }
    export() {this.finishGesture();return Object.fromEntries([...this.pages].map(([key,page])=>[key,G.clone(page.state)]));}
    destroy() {this.finishGesture();for(const page of this.pages.values())if(page.previewFrame)cancelAnimationFrame(page.previewFrame);for(const cleanup of this.destroyers)cleanup();document.removeEventListener('keydown',this.keydown);this.pages.clear();}
  }
  root.CermatPaper={Editor,emptyState,objectMarkup,instructions,safe,format};
})(window);
