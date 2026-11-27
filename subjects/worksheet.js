/* Controls shared by the two subject workspaces. Ink coordinates are always paper units. */
(() => {
  'use strict';
  const drawings = {
    hand: '<path d="M8 12V6.8a1.4 1.4 0 0 1 2.8 0v4.4-6.1a1.4 1.4 0 0 1 2.8 0v6-4.9a1.4 1.4 0 0 1 2.8 0v5.1-2.7a1.4 1.4 0 0 1 2.8 0v6.2c0 4-2.2 6.2-6 6.2-2.4 0-4-1.1-5.4-3L4 12.4a1.5 1.5 0 0 1 2.2-1.9L8 12Z"/>',
    pen: '<path d="m4 20 1.3-5.2L16.5 3.6a1.8 1.8 0 0 1 2.5 0l1.4 1.4a1.8 1.8 0 0 1 0 2.5L9.2 18.7 4 20Zm10.7-14.6 3.9 3.9M5.3 14.8l3.9 3.9"/>',
    highlight: '<path d="m7.3 14.7 7.8-10.9 5.5 4-8.1 10.6-5.2-3.7Zm.3.3-1.9 1.4-1.8 3.4 5.1-.5 2.2-1.5M3.4 21h9"/>',
    erase: '<path d="m4.4 13.5 8.7-9a1.7 1.7 0 0 1 2.4 0l4 4a1.7 1.7 0 0 1 0 2.4L11.6 19H8.2l-3.8-3.4a1.5 1.5 0 0 1 0-2.1ZM8.6 9.1l6.3 6.1M10.8 19h9.5"/>',
    text: '<path d="M4 7V4.5h16V7m-8-2.5v15m-3.4 0h6.8"/>',
    more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
    settings: '<path d="M3 7h4m5 0h9M3 17h10m5 0h3"/><circle cx="9.5" cy="7" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/>',
    undo: '<path d="m8 4-5 5 5 5M3.5 9H14a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="m16 4 5 5-5 5m4.5-5H10a6 6 0 0 0 0 12h3"/>',
    answer: '<path d="M4 4h16v16H4zM7.5 9l1.4 1.4L12 7.3M7.5 15.5h9"/>'
  };
  const icon = name => '<svg class="ws-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+drawings[name]+'</svg>';
  const quickTools = [
    ['hand','Posun','Posouvat papír','navigate','move'],
    ['pen','Pero','Psát rukou','pencil','pen'],
    ['highlight','Zvýraznit','Zvýraznit text','highlight','highlight'],
    ['erase','Guma','Mazat poznámky','erase','eraser'],
    ['text','Text','Vložit nebo upravit poznámku','text','text']
  ];
  function dragPage(svg,event,scroller) {
    if(event.button!==0)return;
    const x=event.clientX,y=event.clientY,left=scroller?.scrollLeft||0,top=window.scrollY;
    const events=new AbortController(),options={signal:events.signal};
    event.preventDefault();svg.setPointerCapture(event.pointerId);
    svg.addEventListener('pointermove',e=>{
      if(e.pointerId!==event.pointerId)return;
      if(scroller)scroller.scrollLeft=left+x-e.clientX;
      window.scrollTo({top:top+y-e.clientY,behavior:'instant'});
    },options);
    svg.addEventListener('lostpointercapture',e=>{if(e.pointerId===event.pointerId)events.abort();},options);
  }
  function mount(root) {
    const select = root.querySelector('#paper-tool, #ink-tool');
    if (!select) return; // The read-only review keeps its own navigation.
    const bar = select.closest('.workspace-tools');
    if (bar.classList.contains('worksheet-tools')) return;
    const math = select.id === 'paper-tool';
    const primary = bar.querySelector('.tool-primary'), history = bar.querySelector('.tool-actions');
    const more = select.closest('label'), settings = bar.querySelector('.instrument-options');
    const zoom = bar.querySelector('.zoom-controls'), jump = primary.querySelector('.question-picker, .jump-label');
    const tools = document.createElement('div'), utilities = document.createElement('div');
    tools.className='ws-rail'; tools.setAttribute('role','group'); tools.setAttribute('aria-label','Psaní a poznámky');
    utilities.className='ws-utilities';
    const buttons = new Map();
    for (const [symbol,label,title,mathId,czId] of quickTools) {
      const id=math?mathId:czId, button=document.createElement('button');
      button.type='button'; button.className='ws-tool'; button.dataset.wsTool=id;
      button.title=title; button.setAttribute('aria-label',title);
      button.innerHTML=icon(symbol)+'<span>'+label+'</span>';
      button.onclick=()=>{if(select.value!==id){select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));}};
      tools.append(button);buttons.set(id,button);
    }
    more.classList.add('ws-more'); more.querySelector('span').remove();
    const moreLabel=document.createElement('span');moreLabel.className='ws-more-name';
    more.insertAdjacentHTML('afterbegin',icon('more'));more.insertBefore(moreLabel,select);
    select.setAttribute('aria-label','Všechny nástroje');more.title='Všechny nástroje';
    function reflect() {
      const id=select.value, quick=buttons.has(id);
      for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===id));
      more.classList.toggle('ws-current',!quick);
      moreLabel.textContent=quick?'Další':select.selectedOptions[0].textContent;
      bar.classList.toggle('ws-instructions',!quick && id!=='navigate');
      bar.dataset.activeTool=id;
    }
    select.addEventListener('change',reflect);
    for(const [index,button] of [...history.querySelectorAll('button')].entries()){
      const label=button.getAttribute('aria-label')||button.title||button.textContent;
      button.title=label;button.setAttribute('aria-label',label);button.innerHTML=icon(index?'redo':'undo');
    }
    const summary=settings.querySelector('summary');
    summary.innerHTML=icon('settings')+'<span>Nastavení</span>';summary.title='Barva, tloušťka a nastavení nástroje';
    const panel=document.createElement('div');panel.className='ws-panel';
    while(summary.nextSibling)panel.append(summary.nextSibling);
    settings.append(panel);
    settings.addEventListener('keydown',e=>{if(e.key==='Escape' && settings.open){settings.open=false;summary.focus();}});
    bar.addEventListener('focusout',e=>{if(e.relatedTarget && !settings.contains(e.relatedTarget))settings.open=false;});
    function fitAnswer(el) {
      if(el.matches('.final-short input[type=text]')){
        el.style.setProperty('--ws-entry-width',(Math.max(14,Math.min(44,el.value.length+4)))+'ch');
      }else if(el.matches('.final-answers textarea') && !CSS.supports('field-sizing','content')){
        el.style.height='auto';el.style.height=(el.scrollHeight+3)+'px';
      }
    }
    const signal=mountSignal(root);
    root.addEventListener('input',e=>fitAnswer(e.target),{signal});
    for(const field of root.querySelectorAll('.final-short input[type=text],.final-answers textarea'))if(field.value)fitAnswer(field);
    root.addEventListener('pointerdown',e=>{if(settings.open&&!settings.contains(e.target))settings.open=false;},{capture:true,signal});
    tools.append(more,history);utilities.append(settings,zoom,jump);
    primary.replaceChildren(tools,utilities);bar.classList.add('worksheet-tools');reflect();
    const hint=bar.querySelector('.instrument-hint');
    if(hint)hint.setAttribute('aria-live','polite');
  }
  const bindings=new WeakMap();
  function mountSignal(root){
    bindings.get(root)?.abort();
    const controller=new AbortController();bindings.set(root,controller);return controller.signal;
  }
  function answerHeading(){
    return '<h3 class="ws-answer-heading">'+icon('answer')+'<span>Odpovědní list</span></h3>';
  }

  // Only new ink opts into this renderer. Older polylines and marker rectangles keep their original shapes.
  const fmt=n=>String(Math.round(n*100)/100);
  const xy=p=>fmt(p[0])+' '+fmt(p[1]);
  const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  function curve(points) {
    let d='M'+xy(points[0]);
    for(let i=1;i<points.length-1;i++)d+=' Q'+xy(points[i])+' '+xy(midpoint(points[i],points[i+1]));
    return points.length>1?d+' L'+xy(points.at(-1)):d;
  }
  function stroke(points,width,pressure) {
    const first=points[0];
    if(points.length===1) {
      const r=width*(pressure?(.24+.71*(first[2]??.5)):.5);
      return {fill:true,d:'M'+xy(first)+' m-'+fmt(r)+' 0 a'+fmt(r)+' '+fmt(r)+' 0 1 0 '+fmt(2*r)+' 0 a'+fmt(r)+' '+fmt(r)+' 0 1 0 -'+fmt(2*r)+' 0Z'};
    }
    if(!pressure)return {fill:false,d:curve(points)};
    const left=[],right=[];let radius=0;
    for(let i=0;i<points.length;i++){
      const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
      const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
      const target=width*(.24+.71*(p[2]??.5));radius=i?radius*.28+target*.72:target;
      left.push([p[0]-dy/len*radius,p[1]+dx/len*radius]);right.push([p[0]+dy/len*radius,p[1]-dx/len*radius]);
    }
    const endR=fmt(radius),startR=fmt(Math.hypot(left[0][0]-first[0],left[0][1]-first[1]));
    const outline=curve(left)+' A'+endR+' '+endR+' 0 0 0 '+xy(right.at(-1))+curve(right.reverse()).replace(/^M[^LQ]+/,'')+' A'+startR+' '+startR+' 0 0 0 '+xy(left[0])+' Z';
    return {fill:true,d:'M'+xy(first)+' '+outline};
  }
  function samples(event){
    const group=event.getCoalescedEvents?.();
    return group?.length?[...group,event]:[event];
  }
  function append(points,p) {
    const last=points.at(-1);
    if(!last||Math.hypot(p[0]-last[0],p[1]-last[1])>.32)points.push(p);
  }
  function sweep(from,to,step,visit){
    const count=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/Math.max(1,step)));
    for(let i=1;i<=count;i++)visit([from[0]+(to[0]-from[0])*i/count,from[1]+(to[1]-from[1])*i/count]);
  }

  let measure;
  function noteOrigin(point,value,size,width,height) {
    measure ||= document.createElement('canvas').getContext('2d');
    measure.font=size+'px Arial, sans-serif';
    const lines=value.split('\n'),inset=size*.2;
    let longest=0;for(const line of lines)longest=Math.max(longest,measure.measureText(line).width);
    return [Math.max(inset,Math.min(point[0],width-inset-longest)),
      Math.max(size,Math.min(point[1],height-inset-size*.25-(lines.length-1)*size*1.35))];
  }
  function note({initial='',existing=false,presets=[],limit=5000,onSave,onDelete}) {
    if(document.querySelector('dialog.ws-note[open]'))return;
    const dialog=document.createElement('dialog');dialog.className='ws-note';dialog.setAttribute('aria-labelledby','ws-note-title');
    dialog.innerHTML='<form method="dialog"><h2 id="ws-note-title">'+(existing?'Upravit poznámku':presets.length?'Označení větného členu':'Poznámka do zadání')+'</h2><label for="ink-text">Text na papíře</label><textarea id="ink-text" rows="3" autofocus></textarea><div class="ws-presets"></div><div class="ws-note-actions"><button type="button" class="ws-delete">Odstranit</button><button value="cancel" formnovalidate>Zrušit</button><button class="p" value="save">Uložit na papír</button></div></form>';
    const field=dialog.querySelector('textarea'),save=dialog.querySelector('[value=save]'),remove=dialog.querySelector('.ws-delete');
    field.maxLength=Math.max(limit,initial.length);field.value=initial;
    const enable=()=>{save.disabled=!field.value.trim();};
    field.addEventListener('input',enable);enable();
    remove.hidden=!existing;remove.onclick=()=>dialog.close('delete');
    for(const word of presets){const b=document.createElement('button');b.type='button';b.textContent=word;b.onclick=()=>{field.value=word;enable();field.focus();};dialog.querySelector('.ws-presets').append(b);}
    field.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!save.disabled){e.preventDefault();dialog.close('save');}});
    dialog.addEventListener('close',()=>{const result=dialog.returnValue;dialog.remove();if(result==='delete')onDelete?.();else if(result==='save'&&field.value.trim())onSave(field.value);},{once:true});
    document.body.append(dialog);dialog.showModal();field.focus({preventScroll:true});field.setSelectionRange(field.value.length,field.value.length);
  }

  // Subject screens live in same-origin frames. On iOS the keyboard changes the top-level visual viewport.
  let viewport=window.visualViewport,hostFrame=null;
  try{if(window.frameElement){hostFrame=window.frameElement;viewport=window.parent.visualViewport||viewport;}}catch{}
  let scheduled=0;
  function revealField() {
    cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(()=>{
      const el=document.activeElement,root=document.documentElement;
      if(!el?.matches('.final-answers input[type=text],.final-answers textarea,.ws-note textarea')){root.style.removeProperty('--ws-keyboard');return;}
      const offset=hostFrame?.getBoundingClientRect().top||0;
      const visibleBottom=viewport?Math.min(innerHeight,viewport.offsetTop+viewport.height-offset):innerHeight;
      const inset=Math.max(0,innerHeight-visibleBottom);
      root.style.setProperty('--ws-keyboard',Math.round(inset)+'px');
      const dialog=el.closest('dialog');if(dialog)return;
      const topEdge=viewport?Math.max(0,viewport.offsetTop-offset):0;
      const bars=[...document.querySelectorAll('.workspace-top,.worksheet-tools')].filter(b=>getComputedStyle(b).position==='sticky');
      const top=Math.max(topEdge,...bars.map(b=>b.getBoundingClientRect().bottom))+8;
      const accessory=document.querySelector('#mk:not([hidden])');
      const bottom=visibleBottom-(accessory?.offsetHeight||0)-12,r=el.getBoundingClientRect();
      if(r.bottom>bottom)window.scrollBy({top:Math.min(r.bottom-bottom,Math.max(0,r.top-top)||r.bottom-bottom),behavior:'instant'});
      else if(r.top<top&&r.height<bottom-top)window.scrollBy({top:r.top-top,behavior:'instant'});
    });
  }
  document.addEventListener('focusin',revealField);document.addEventListener('focusout',revealField);
  viewport?.addEventListener('resize',revealField);viewport?.addEventListener('scroll',revealField);
  window.CermatWorksheet={mount,answerHeading,stroke,samples,append,sweep,note,noteOrigin,dragPage};
})();
