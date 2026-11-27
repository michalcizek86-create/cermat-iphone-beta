/* Shared exam furniture. Each subject supplies its own answers and paper anchors. */
(() => {
  const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;};
  const pending=new WeakMap();
  window.CermatFolio={mount(root,model){
    const top=root.querySelector('.workspace-top'),bar=root.querySelector('.worksheet-tools');
    if(!bar||!model.items.length)return;
    pending.get(root)?.abort();
    const controller=new AbortController();pending.set(root,controller);
    const listen=(el,name,fn,options={})=>el.addEventListener(name,fn,{...options,signal:controller.signal});
    const back=top.querySelector('button'),title=top.querySelector('.workspace-title'),finish=top.querySelector('button.p');
    back.textContent='←  Zpět na testy';back.title='Uložit rozepsaný test a vrátit se na testy';
    finish.textContent='Odevzdat test';
    const save=title.querySelector('[role=status], [aria-live]');top.insertBefore(save,top.querySelector('#timer'));
    save.classList.add('folio-save');
    const intro=root.querySelector('.workspace-introduction');
    title.append(node('small','folio-subtitle',model.subtitle));
    const brand=node('div','study-brand folio-brand');brand.append(node('span','folio-monogram',model.math?'M':'Č'),node('b','','Cermat testy'));
    top.append(brand);
    const nav=node('nav','folio-links');nav.setAttribute('aria-label','Navigace testu');
    for(const [id,label] of [['sect-tests','Testy'],['sect-topics','Témata'],['ov','Můj pokrok'],['history','Historie']]){
      const b=node('button','',label);b.onclick=()=>model.exit(id);nav.append(b);
    }
    top.append(nav);
    const desk=node('div','folio-desk'),columns=node('div','folio-columns');
    top.after(columns);columns.append(desk);
    for(const el of [...root.children])if(el!==top&&el!==columns&&el.tagName!=='DIALOG')desk.append(el);
    const rail=bar.querySelector('.ws-rail'),util=bar.querySelector('.ws-utilities');
    rail.prepend(rail.querySelector('.tool-actions'));
    for(const [selector,cls,title] of [['input[type=color]','folio-color','Barva inkoustu'],['#paper-width,#ink-width','folio-width','Tloušťka tahu']]){
      const control=bar.querySelector(selector),label=control.closest('label');
      label.classList.add(cls);label.title=title;control.setAttribute('aria-label',title);util.prepend(label);
    }
    // Keep page navigation and every construction option in the secondary menu.
    const settings=util.querySelector('details'),panel=settings.querySelector('.ws-panel'),jump=util.querySelector('.jump-label,.question-picker');
    if(jump)panel.prepend(jump);
    if(intro)panel.append(intro);
    const oldIndex=desk.querySelector('.question-index');if(oldIndex)panel.append(oldIndex);
    for(const heading of desk.querySelectorAll('.exam-page-heading h2')){
      const number=node('small','folio-page-label',heading.textContent);
      heading.textContent='Pracovní list';heading.append(number);
    }
    const aside=node('aside','folio-overview'),details=node('details'),summary=node('summary','','Přehled úloh');
    aside.setAttribute('aria-label','Přehled úloh');details.append(summary);aside.append(details);columns.append(aside);
    const size=new ResizeObserver(()=>{
      columns.style.setProperty('--folio-offset',(top.offsetHeight+12)+'px');
      columns.style.setProperty('--folio-header',top.offsetHeight+'px');
      columns.style.setProperty('--folio-strip',summary.offsetHeight+17+'px');
    });
    size.observe(top);size.observe(summary);
    const gone=new MutationObserver(()=>{if(!columns.isConnected){controller.abort();}});
    gone.observe(root,{childList:true});
    controller.signal.addEventListener('abort',()=>{size.disconnect();gone.disconnect();});
    const compact=matchMedia('(max-width: 960px)');details.open=!compact.matches;
    listen(compact,'change',()=>{details.open=!compact.matches;});
    const count=node('span','folio-count'),progress=node('progress'),grid=node('div','folio-numbers'),legend=node('p','folio-legend','✓ Vyplněno　 ⚑ K návratu'),mark=node('button','folio-mark');
    summary.append(count);progress.max=model.items.length;progress.setAttribute('aria-label','Vyplněné úlohy');
    details.append(progress,grid,legend,mark);const record=model.record;
    let current=model.initial||model.items[0].id;
    const ids=new Set(model.items.map(item=>item.id));if(!ids.has(current))current=model.items[0].id;
    const flags=new Set(Array.isArray(record.returnMarks)?record.returnMarks:[]);
    function select(id){if(!ids.has(id))return;current=id;record.overviewQuestion=id;refresh();}
    const buttons=model.items.map((item,i)=>{
      const b=node('button','',item.label);b.dataset.questionId=item.id;b.onclick=()=>{
        select(item.id);if(compact.matches)details.open=false;model.jump(item,i);model.save();
      };grid.append(b);return b;
    });
    function refresh(){
      let n=0;model.items.forEach((item,i)=>{
        const b=buttons[i],done=model.answered(item),flag=flags.has(item.id),active=current===item.id;
        if(done)n++;b.classList.toggle('done',done);b.classList.toggle('marked',flag);b.setAttribute('aria-current',active?'step':'false');
        const label='Úloha '+item.label+(done?', vyplněno':'')+(flag?', označeno k návratu':'');b.setAttribute('aria-label',label);b.title=label;
      });
      count.textContent=n+' z '+model.items.length+' vyplněno';progress.value=n;
      mark.setAttribute('aria-pressed',String(flags.has(current)));
      mark.textContent=(flags.has(current)?'⚑  Zrušit označení':'⚐  Označit k návratu')+' · '+model.items.find(it=>it.id===current).label;
    }
    listen(root,'folio:answers',refresh);
    mark.onclick=()=>{if(flags.has(current))flags.delete(current);else flags.add(current);record.returnMarks=[...flags];model.save();refresh();};
    const anchors=model.items.map(item=>({item,target:model.target(item)}));
    let frame=0;
    function followScroll(){
      if(frame||!columns.isConnected||root.querySelector('dialog[open]'))return;
      frame=requestAnimationFrame(()=>{frame=0;if(!columns.isConnected)return;
        const line=bar.getBoundingClientRect().bottom+32;
        const positions=anchors.filter(a=>a.target?.isConnected).map(a=>({id:a.item.id,y:model.position(a.item,a.target)}));
        const above=positions.filter(a=>a.y<=line).sort((a,b)=>b.y-a.y);
        const nearest=above[0]||positions[0];
        if(nearest&&!above.some(a=>a.id===current&&Math.abs(a.y-nearest.y)<2))select(nearest.id);
      });
    }
    // Programmatic question jumps choose the precise subquestion even on shared source pages.
    let tracking=false;
    listen(grid,'pointerdown',()=>tracking=false);
    listen(grid,'keydown',()=>tracking=false);
    listen(window,'wheel',()=>tracking=true,{passive:true});listen(desk,'touchmove',()=>tracking=true,{passive:true});
    listen(window,'keydown',e=>{if(['PageUp','PageDown','Home','End','ArrowDown','ArrowUp'].includes(e.key)&&!e.target.closest('input,select,textarea'))tracking=true;});
    listen(window,'scroll',()=>{if(tracking)followScroll();},{passive:true});
    const onAnswer=e=>{
      const control=e.target.closest('[data-answer],[data-id],.cz-answer,.folio-construction');if(!control)return;
      const id=control.dataset.answer||control.dataset.id||control.dataset.question||control.closest('[data-question]')?.dataset.question;
      if(ids.has(id)){tracking=false;select(id);}queueMicrotask(refresh);
    };
    for(const ev of ['input','change','click','focusin'])listen(desk,ev,onAnswer);
    refresh();
  }};
})();
