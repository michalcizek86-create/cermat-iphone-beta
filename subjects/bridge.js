/* A small header control connects the two existing application documents. */
(function () {
  'use strict';
  const subject = document.documentElement.dataset.subject;
  if (parent===window) {
    const shell = new URL(subject==='cz'?'../index.html':'./index.html',location.href);
    shell.searchParams.set('subject',subject);
    location.replace(shell.href);
    return;
  }
  let active = false;
  let ready = false;
  let observedTop;
  const resize = new ResizeObserver(entries => {
    const top = entries[0]?.target;
    if (subject==='cz' && top?.isConnected) document.getElementById('app').style.setProperty('--cz-toolbar-top', top.offsetHeight+'px');
  });

  function visibility(value,transition=false) {
    if (value===active) return;
    active = value;
    dispatchEvent(new CustomEvent('cermat:subject-visibility', {detail:{active,transition}}));
  }

  function select(next,keyboard=false) {
    if (next===subject) return;
    const group=document.querySelector('.subject-switch');
    const position=window.CermatMotion?.indicatorPosition?.(group);
    visibility(false);
    parent.postMessage({type:'CERMAT_SELECT_SUBJECT',subject:next,keyboard,position},location.origin);
  }

  function control() {
    const group = document.createElement('div');
    group.className = 'subject-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Předmět');
    for (const [id,label] of [['math','Matematika'],['cz','Čeština']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.subjectChoice = id;
      button.setAttribute('aria-pressed', String(id===subject));
      button.addEventListener('click', () => select(id));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        select(event.key==='Home' ? 'math' : event.key==='End' ? 'cz' : subject==='math' ? 'cz' : 'math',true);
      });
      group.append(button);
    }
    return group;
  }

  function attach() {
    const target = document.querySelector('.tn-in, .workspace-top, .sethd, .practice-heading, .result-heading, .result-heading .row');
    if (!target) return;
    if (!target.querySelector('.subject-switch')) {
      const group = control();
      const brand = target.querySelector('.study-brand');
      brand ? brand.after(group) : target.append(group);
      window.CermatMotion?.segment(group,subject);
    }
    const top = document.querySelector('.workspace-top');
    if (top!==observedTop) {
      resize.disconnect();
      if (top) resize.observe(top);
      observedTop = top;
    }
    if (!ready) {
      ready = true;
      parent.postMessage({type:'CERMAT_SUBJECT_READY'},location.origin);
    }
  }

  addEventListener('message', event => {
    if (event.source!==parent || event.origin!==location.origin || event.data?.type!=='CERMAT_SUBJECT_VISIBILITY')return;
    visibility(!!event.data.active,!!event.data.animate);
    // Both still-visible indicators move together while the subject papers blend.
    document.querySelectorAll('.subject-switch').forEach(group =>
      window.CermatMotion?.segment(group,event.data.choice || subject,{from:event.data.from,position:event.data.position,animated:event.data.animate}));
    if(event.data.active && event.data.keyboard)document.querySelector('[data-subject-choice="'+subject+'"]')?.focus({preventScroll:true});
  });
  addEventListener('cermat:motion-settle',()=>parent.postMessage({type:'CERMAT_SETTLE_SUBJECT'},location.origin));
  window.CermatSubjectBridge = {get active(){return active;}};
  // View changes replace app children; drawing paths never need a header scan.
  new MutationObserver(attach).observe(document.getElementById('app'), {childList:true});
  attach();
})();
