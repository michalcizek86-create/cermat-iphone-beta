/* A bounded, event-driven motion layer. It never observes the annotation subtree. */
(function () {
  'use strict';
  const app=document.getElementById('app');
  if(!app)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const ease='cubic-bezier(.22,1,.36,1)';
  const animations=new Set(),disclosures=new Map(),menus=new Map(),segments=new WeakMap();
  const barValues=new Map(),metricValues=new Map(),segmentGroups=new Set();
  let rootNode=null,screen='',frame=0,statusObserver=null,held=new Set();
  let menuIntent=null,dialogObserver=null;

  const allowed=()=>!preference.matches&&!document.hidden&&window.CermatSubjectBridge?.active!==false&&!held.size;
  function animate(element,keys,duration=220,options={}) {
    if(!allowed()||!element?.animate||!element.isConnected)return null;
    const animation=element.animate(keys,{duration,easing:ease,...options});
    animations.add(animation);
    animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
    return animation;
  }
  function cancelTransient() {
    for(const animation of animations)animation.cancel();
    animations.clear();
  }

  function segment(group,choice,{from,animated=false}={}) {
    if(!group?.isConnected)return;
    let state=segments.get(group);
    if(!state){
      const indicator=document.createElement('span');
      indicator.className='subject-indicator';indicator.setAttribute('aria-hidden','true');
      group.prepend(indicator);state={indicator,animation:null,choice};segments.set(group,state);
      segmentGroups.add(group);
      segmentResize.observe(group);
    }
    const buttons=[...group.querySelectorAll('[data-subject-choice]')];
    const target=buttons.find(button=>button.dataset.subjectChoice===choice);
    if(!target)return;
    const geometry=button=>({x:button.offsetLeft,width:button.offsetWidth});
    const current={transform:getComputedStyle(state.indicator).transform,width:getComputedStyle(state.indicator).width};
    const to=geometry(target),previous=buttons.find(button=>button.dataset.subjectChoice===from);
    if(!animated&&state.choice===choice&&state.x===to.x&&state.width===to.width&&state.animation?.playState==='running')return;
    state.animation?.cancel();
    const start=previous?{transform:'translateX('+geometry(previous).x+'px)',width:geometry(previous).width+'px'}:current;
    state.indicator.style.transform='translateX('+to.x+'px)';state.indicator.style.width=to.width+'px';
    state.choice=choice;
    state.x=to.x;state.width=to.width;
    for(const button of buttons)button.setAttribute('aria-pressed',String(button===target));
    group.dataset.motionReady='';
    if(animated&&allowed())state.animation=animate(state.indicator,[start,{transform:state.indicator.style.transform,width:to.width+'px'}],260,{easing:'cubic-bezier(.2,.85,.25,1)'});
  }
  const segmentResize=new ResizeObserver(entries=>{
    for(const entry of entries){const state=segments.get(entry.target);if(state)segment(entry.target,state.choice);}
  });

  function settleDisclosure(details) {
    const state=disclosures.get(details);if(!state)return;
    disclosures.delete(details);
    details.open=state.target;
    state.animation?.cancel();
    details.style.overflow=state.overflow;details.style.boxSizing=state.boxSizing;details.style.overflowAnchor=state.anchor;
    for(const [content,inert]of state.contents)content.inert=inert;
    details.removeAttribute('data-motion-expanded');
    details.querySelector(':scope > summary')?.setAttribute('aria-expanded',String(details.open));
  }
  function toggleDisclosure(details) {
    const summary=details.querySelector(':scope > summary'),contents=[...details.children].filter(child=>child!==summary);
    if(!summary||!contents.length)return false;
    const prior=disclosures.get(details),target=prior?!prior.target:!details.open;
    const start=details.getBoundingClientRect().height;
    if(prior)settleDisclosure(details);
    if(!allowed()){
      details.open=target;summary.setAttribute('aria-expanded',String(target));return true;
    }
    const state={target,overflow:details.style.overflow,boxSizing:details.style.boxSizing,anchor:details.style.overflowAnchor,contents:contents.map(content=>[content,content.inert])};
    details.open=true;
    details.dataset.motionExpanded=String(target);summary.setAttribute('aria-expanded',String(target));
    let end=details.getBoundingClientRect().height;
    // The Czech cards have different collapsed and expanded header arrangements.
    if(!target){details.open=false;end=details.getBoundingClientRect().height;details.open=true;}
    details.style.overflow='hidden';details.style.boxSizing='border-box';details.style.overflowAnchor='none';
    if(!target)for(const content of contents)content.inert=true;
    disclosures.set(details,state);
    state.animation=animate(details,[{height:start+'px'},{height:end+'px'}],250,{fill:'both'});
    if(!state.animation){settleDisclosure(details);return true;}
    state.animation.finished.then(()=>{if(disclosures.get(details)===state)settleDisclosure(details);},()=>{});
    return true;
  }

  function settleMenu(header) {
    const state=menus.get(header);if(!state)return;
    menus.delete(header);state.animation?.cancel();
    state.nav.style.overflow=state.overflow;state.nav.inert=state.inert;
    header.removeAttribute('data-motion-menu-closing');
  }
  function finishMenu(intent) {
    const {header,nav,height,interrupted}=intent;
    if(!header.isConnected)return;
    const open=header.classList.contains('menu-open');
    const state={nav,overflow:nav.style.overflow,inert:nav.inert};
    menus.set(header,state);
    if(!open){header.dataset.motionMenuClosing='';nav.inert=true;}
    nav.style.overflow='hidden';
    const padding=getComputedStyle(nav);
    state.animation=animate(nav,open?
      [{height:(interrupted?height:0)+'px',opacity:interrupted?.7:0,paddingTop:'0px',paddingBottom:'0px',transform:'translateY(-3px)'},{height:nav.getBoundingClientRect().height+'px',opacity:1,paddingTop:padding.paddingTop,paddingBottom:padding.paddingBottom,transform:'none'}]:
      [{height:height+'px',opacity:1,paddingTop:padding.paddingTop,paddingBottom:padding.paddingBottom,transform:'none'},{height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px',transform:'translateY(-3px)'}],190,{fill:'both'});
    if(!state.animation){settleMenu(header);return;}
    state.animation.finished.then(()=>{if(menus.get(header)===state)settleMenu(header);},()=>{});
  }

  function barsAndMetrics() {
    const bars=app.querySelectorAll('.goal > i,.tp .bar > i');
    bars.forEach((bar,index)=>{
      const key=bar.parentElement.getAttribute('aria-label')||bar.closest('.tp')?.querySelector('span')?.textContent||String(index);
      const value=parseFloat(bar.style.width)||0,old=barValues.get(key);barValues.set(key,value);
      if(value&&old!==value)animate(bar,[{transform:'scaleX('+(old===undefined?0:old/value)+')'},{transform:'scaleX(1)'}],300);
    });
    app.querySelectorAll('.ovrow b,.practice-metrics strong,.result-score .big,.result-score > strong').forEach((metric,index)=>{
      const key=screen+':'+index,value=metric.textContent,old=metricValues.get(key);metricValues.set(key,value);
      if(old!==undefined&&old!==value)animate(metric,[{opacity:.5,transform:'translateY(2px)'},{opacity:1,transform:'none'}],180);
    });
  }

  function bindStatus() {
    statusObserver?.disconnect();
    const element=document.querySelector('#save-status,#study-save-status');if(!element)return;
    let before=element.textContent;
    statusObserver=new MutationObserver(()=>{
      const text=element.textContent;
      if(text!==before&&/^Uloženo/.test(text))animate(element,[{opacity:.5},{opacity:1}],170);
      before=text;
    });
    statusObserver.observe(element,{childList:true,characterData:true,subtree:true});
  }
  function screenKey() {
    if(app.classList.contains('paperview'))return 'paper';
    if(app.classList.contains('homev'))return 'home';
    return app.className+':'+(app.querySelector('h1')?.textContent||'');
  }
  function refresh() {
    frame=0;
    const current=app.firstElementChild;if(current===rootNode)return;
    rootNode=current;
    for(const group of segmentGroups){if(!group.isConnected){segmentResize.unobserve(group);segments.get(group)?.animation?.cancel();segmentGroups.delete(group);}}
    const previous=screen;screen=screenKey();
    for(const details of [...disclosures.keys()])settleDisclosure(details);
    for(const header of [...menus.keys()])settleMenu(header);
    bindStatus();
    dialogObserver?.disconnect();
    document.querySelectorAll('dialog').forEach(dialog=>dialogObserver?.observe(dialog,{attributes:true,attributeFilter:['open']}));
    if(screen==='paper')return;
    barsAndMetrics();
    if(screen===previous||!allowed())return;
    const elements=app.querySelectorAll('.notebook-hero,.study-intro,.practice-heading,.sethd,.result-heading,.result-score,.practice-config,.topic-progress,.fact-editorial');
    let count=0;
    for(const element of elements){
      const rect=element.getBoundingClientRect();
      if(rect.bottom<=0||rect.top>=innerHeight||count>=4)continue;
      animate(element,[{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'none'}],240,{delay:count++*25});
    }
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(refresh);}

  document.addEventListener('click',event=>{
    const summary=event.target.closest('summary');
    if(summary?.parentElement.matches('.year-card,.topic-filter')&&!event.target.closest('a,button,input,select')){
      if(toggleDisclosure(summary.parentElement))event.preventDefault();
    }
    const toggle=event.target.closest('.mobile-nav-toggle');
    if(toggle&&allowed()){
      const header=toggle.closest('.topnav'),nav=header.querySelector('.nav');
      const height=nav.getBoundingClientRect().height,interrupted=menus.has(header);
      settleMenu(header);
      menuIntent={header,nav,height,interrupted};
      if(header.classList.contains('menu-open'))header.dataset.motionMenuClosing='';
    }
    const anchor=event.target.closest('.notebook-links a[href^="#"]');
    if(anchor){
      const target=document.getElementById(anchor.hash.slice(1));
      if(target){event.preventDefault();target.scrollIntoView({behavior:preference.matches?'instant':'smooth'});}
    }
  },true);
  document.addEventListener('click',()=>{if(menuIntent){const intent=menuIntent;menuIntent=null;finishMenu(intent);}});
  document.addEventListener('toggle',event=>{
    const details=event.target;
    if(details.matches?.('.year-card,.topic-filter')&&!disclosures.has(details))details.querySelector(':scope > summary')?.setAttribute('aria-expanded',String(details.open));
  },true);
  document.addEventListener('change',event=>{
    if(event.target.matches('#paper-tool,#ink-tool'))animate(app.querySelector('#paper-tool-hint,.instrument-hint'),[{opacity:.6},{opacity:1}],140);
  });
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.study-paper-svg,.paper-surface'))return;
    held.add(event.pointerId);cancelTransient();
    dispatchEvent(new Event('cermat:motion-settle'));
  },{capture:true,passive:true});
  const release=event=>held.delete(event.pointerId);
  addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});

  function settleAll() {
    cancelTransient();
    for(const details of [...disclosures.keys()])settleDisclosure(details);
    for(const header of [...menus.keys()])settleMenu(header);
  }
  preference.addEventListener('change',()=>{if(preference.matches)settleAll();});
  addEventListener('resize',()=>{
    for(const details of [...disclosures.keys()])settleDisclosure(details);
    for(const header of [...menus.keys()])settleMenu(header);
  },{passive:true});
  addEventListener('cermat:subject-visibility',event=>{if(!event.detail.active){held.clear();settleAll();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();settleAll();}});
  new MutationObserver(schedule).observe(app,{childList:true});
  // Dialogs retain their native focus trap and keyboard behavior.
  dialogObserver=new MutationObserver(records=>{
    for(const {target}of records)if(target.open)animate(target,[{opacity:0,transform:'translateY(4px) scale(.99)'},{opacity:1,transform:'none'}],180);
  });
  document.querySelectorAll('dialog').forEach(dialog=>dialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
  window.CermatMotion={segment,settle:settleAll,get reduced(){return preference.matches;}};
  refresh();
})();
