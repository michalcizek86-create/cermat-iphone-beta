/* Presentation shared by the two subject documents. The paper and its SVG keep their native coordinates. */
(function () {
  'use strict';
  const app = document.getElementById('app');
  if (!app) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const css = getComputedStyle(document.documentElement);
  const token = name => css.getPropertyValue('--motion-' + name).trim();
  const duration = name => parseFloat(token(name)) || 0;
  const timing = {
    subject: duration('subject'), press: duration('press'), component: duration('component'), page: duration('page'),
    disclosure: duration('disclosure'), progress: duration('progress'),
    entrance: duration('entrance'), stagger: duration('stagger'),
    ease: token('ease') || 'ease-out', spring: token('spring') || 'ease-out'
  };
  const animations = new Set(), disclosures = new Map(), menus = new Map(), segments = new Map();
  const surfaceExits = new Map();
  const barValues = new Map(), bars = new Map(), metricValues = new Map(), pointers = new Set();
  const disclosureSelector = '.year-card, .topic-filter, .topic-drafts, .subtopic-results, .archive-notes';
  const editableSelector = 'input, textarea, select, [contenteditable="true"]';
  let rootNode, screen, entranceTime = -Infinity, seen = false, menuIntent, arrivalObserver;

  function allowed() {
    return !preference.matches && !document.hidden && window.CermatSubjectBridge?.active !== false && !pointers.size;
  }
  function animate(element, frames, ms, options = {}) {
    if (!allowed() || !ms || !element?.isConnected || !element.animate) return null;
    const animation = element.animate(frames, {duration:ms, easing:timing.ease, ...options});
    animations.add(animation);
    const release = () => animations.delete(animation);
    animation.finished.then(release, release);
    return animation;
  }

  function indicatorPosition(group) {
    const state=segments.get(group);
    if (!state) return;
    const [left,right]=group.querySelectorAll('[data-subject-choice]');
    if (!right || left.offsetLeft === right.offsetLeft) return;
    const x=state.indicator.getBoundingClientRect().left - group.getBoundingClientRect().left - group.clientLeft;
    return Math.max(0, Math.min(1, (x-left.offsetLeft)/(right.offsetLeft-left.offsetLeft)));
  }
  function segment(group, choice, {from, position, animated = false} = {}) {
    if (!group?.isConnected) return;
    let state = segments.get(group);
    if (!state) {
      const indicator = document.createElement('span');
      indicator.className = 'subject-indicator'; indicator.setAttribute('aria-hidden', 'true');
      group.prepend(indicator);
      state = {indicator}; segments.set(group, state); segmentResize.observe(group);
    }
    const target = group.querySelector(`[data-subject-choice="${choice}"]`);
    if (!target) return;
    for (const button of group.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button === target));
    const x = target.offsetLeft, width = target.offsetWidth;
    if (!width) { state.choice = choice; return; } // Hidden frames are measured on reveal.
    if (!animated && state.choice === choice && state.x === x && state.width === width) return;
    const previous = from && group.querySelector(`[data-subject-choice="${from}"]`);
    let startX = previous?.offsetLeft ?? state.x, startWidth = previous?.offsetWidth || state.width;
    const [left,right]=group.querySelectorAll('[data-subject-choice]');
    if (animated && Number.isFinite(position)) {
      startX=left.offsetLeft+(right.offsetLeft-left.offsetLeft)*position;
      startWidth=left.offsetWidth+(right.offsetWidth-left.offsetWidth)*position;
    } else if (state.animation?.playState === 'running') {
      const drawn = state.indicator.getBoundingClientRect();
      startX = drawn.left - group.getBoundingClientRect().left - group.clientLeft;
      startWidth = drawn.width;
    }
    state.animation?.cancel();
    const destination = `translateX(${x}px)`;
    state.indicator.style.width = width + 'px'; state.indicator.style.transform = destination;
    Object.assign(state, {choice, x, width}); group.dataset.motionReady = '';
    // Set the width once. Only the transform changes during travel, even on reversal.
    if (animated && !preference.matches && !document.hidden && !pointers.size && state.indicator.animate && startWidth && Number.isFinite(startX)) {
      state.animation = state.indicator.animate([
        {transform:`translateX(${startX}px) scaleX(${startWidth / width})`}, {transform:destination}
      ], {duration:timing.subject, easing:timing.spring});
      state.animation.id='cermat-subject-indicator';
    }
  }
  const segmentResize = new ResizeObserver(entries => {
    for (const {target} of entries) {
      const state = segments.get(target);
      if (state) segment(target, state.choice);
    }
  });

  function indicateDisclosure(details, state) {
    details.dataset.motionExpanded = String(state.open);
    state.summary.setAttribute('aria-expanded', String(state.open));
    for (const [child, originalInert] of state.contents) child.inert = !state.open || originalInert;
  }
  // Record each following branch once, including the sections below the year list.
  function followingBranches(details) {
    const branches = new Map();
    for (let item = details; item && item !== app; item = item.parentElement) {
      for (let next = item.nextElementSibling; next; next = next.nextElementSibling) {
        if (!next.hidden) branches.set(next, next.getBoundingClientRect());
      }
    }
    return branches;
  }
  function finishRevealsOnScroll() {
    for (const [details, state] of disclosures) if (state.branches) settleDisclosure(details);
  }
  function settleDisclosure(details) {
    const state = disclosures.get(details);
    if (!state) return;
    disclosures.delete(details);
    details.open = state.open; state.animation?.cancel(); state.contentAnimation?.cancel();
    if (state.branches) {
      for (const animation of state.branches) animation.cancel();
      if (![...disclosures.values()].some(item => item.branches)) {
        removeEventListener('wheel', finishRevealsOnScroll); removeEventListener('touchmove', finishRevealsOnScroll);
      }
    }
    details.style.overflow = state.overflow; details.style.boxSizing = state.boxSizing; details.style.overflowAnchor = state.anchor;
    delete details.dataset.motionExpanded;
    for (const [child, originalInert] of state.contents) child.inert = originalInert;
    state.summary.setAttribute('aria-expanded', String(state.open));
  }
  function toggleDisclosure(details, summary) {
    if (!allowed() || !details.animate) return false;
    const running = disclosures.get(details);
    if (running) {
      running.open = !running.open; indicateDisclosure(details, running); running.animation.reverse();
      running.contentAnimation?.reverse();
      for (const animation of running.branches || []) animation.reverse();
      return true;
    }
    const contents = [...details.children].filter(child => child !== summary).map(child => [child, child.inert]);
    if (!contents.length) return false;
    const state = {open:!details.open, summary, contents, overflow:details.style.overflow,
      boxSizing:details.style.boxSizing, anchor:details.style.overflowAnchor};
    const start = details.getBoundingClientRect().height;
    const useClip = details.matches('.year-card') && CSS.supports('clip-path: inset(0px)') &&
      typeof KeyframeEffect !== 'undefined' && 'composite' in KeyframeEffect.prototype;
    const before = useClip ? followingBranches(details) : null;
    details.open = state.open;
    const end = details.getBoundingClientRect().height;
    const moves = [];
    if (before) for (const [element, first] of before) {
      const last = element.getBoundingClientRect();
      const displacement = state.open ? first.top - last.top : last.top - first.top;
      if (Math.abs(displacement) > .5 && Math.min(first.top, last.top) < innerHeight + 24 &&
          Math.max(first.bottom, last.bottom) > -24) moves.push([element, displacement]);
    }
    details.open = true; // Keep the real terms visible during a close.
    details.style.overflow = 'hidden'; details.style.boxSizing = 'border-box'; details.style.overflowAnchor = 'none';
    disclosures.set(details, state); indicateDisclosure(details, state);
    const year = details.matches('.year-card');
    const ms = year ? timing.disclosure : timing.component;
    const direction = (closed, expanded) => state.open ? [closed, expanded] : [expanded, closed];
    if (useClip) {
      // The list takes its natural dimensions once. The visible rows glide into place without per-frame layout.
      const closed = {clipPath:`inset(0 0 ${Math.abs(end-start)}px 0)`};
      state.animation = animate(details, direction(closed, {clipPath:'inset(0 0 0px 0)'}), ms, {fill:'both'});
      state.branches = [];
      for (const [element, y] of moves) {
        const frames = direction({transform:`translateY(${y}px)`}, {transform:'translateY(0px)'});
        const animation = animate(element, frames, ms, {fill:'both', composite:'add'});
        if (animation) state.branches.push(animation);
      }
      addEventListener('wheel', finishRevealsOnScroll, {passive:true});
      addEventListener('touchmove', finishRevealsOnScroll, {passive:true});
    } else {
      state.animation = animate(details, [{height:start+'px'}, {height:end+'px'}], ms, {fill:'both'});
    }
    if (!state.animation) { settleDisclosure(details); return true; }
    if (year) {
      const frames = direction({opacity:.3, transform:'translateY(-6px)'}, {opacity:1, transform:'translateY(0px)'});
      state.contentAnimation = animate(details.querySelector('.year-terms'), frames, ms, {fill:'both'});
    }
    state.animation.finished.then(() => { if (disclosures.get(details) === state) settleDisclosure(details); }, () => {});
    return true;
  }

  function settleMenu(header) {
    const state = menus.get(header);
    if (!state) return;
    menus.delete(header); state.animation?.cancel();
    state.nav.style.overflow = state.overflow; state.nav.inert = state.inert;
    delete header.dataset.motionMenuClosing;
  }
  function captureMenu(toggle) {
    if (!allowed()) return;
    const header = toggle.closest('.topnav'), nav = header.querySelector('.nav');
    if (!nav.animate) return;
    const closing = header.classList.contains('menu-open');
    menuIntent = {header, nav, height:closing ? nav.getBoundingClientRect().height : 0,
      padding:closing ? getComputedStyle(nav).paddingBottom : ''};
    if (closing) header.dataset.motionMenuClosing = '';
  }
  function finishMenu({header, nav, height, padding}) {
    if (!header.isConnected) return;
    const open = header.classList.contains('menu-open');
    if (open) delete header.dataset.motionMenuClosing;
    const running = menus.get(header);
    if (running) { nav.inert = !open || running.inert; running.animation.reverse(); return; }
    const state = {nav, overflow:nav.style.overflow, inert:nav.inert};
    const expanded = {height:(open ? nav.getBoundingClientRect().height : height)+'px',
      opacity:1, paddingBottom:open ? getComputedStyle(nav).paddingBottom : padding};
    const closed = {height:'0px', opacity:0, paddingBottom:'0px'};
    menus.set(header, state); nav.inert = !open || state.inert; nav.style.overflow = 'hidden';
    state.animation = animate(nav, open ? [closed, expanded] : [expanded, closed], timing.component, {fill:'both'});
    if (!state.animation) { settleMenu(header); return; }
    state.animation.finished.then(() => { if (menus.get(header) === state) settleMenu(header); }, () => {});
  }

  function clearSurfaceExit(surface) {
    const state = surfaceExits.get(surface);
    if (!state) return;
    surfaceExits.delete(surface); cancelAnimationFrame(state.frame);
    state.animation?.cancel(); state.shadeAnimation?.cancel(); state.shade?.remove();
    delete surface.dataset.motionExit; surface.inert = state.inert;
  }
  if (!CSS.supports('overlay: auto')) document.addEventListener('beforetoggle', event => {
    const surface = event.target;
    if (!surface.matches('dialog, [popover]')) return;
    const reopeningDialog = surfaceExits.has(surface) && surface.matches('dialog') && event.newState === 'open';
    clearSurfaceExit(surface);
    if (reopeningDialog) queueMicrotask(() => {
      // WebKit can retain body focus when it reopens a just-inert modal.
      if (surface.matches(':modal') && !surface.contains(document.activeElement)) {
        const first = surface.querySelector('[autofocus]') || surface.querySelector('button:enabled, input:enabled:not([type="hidden"]), select:enabled, textarea:enabled, a[href], [tabindex="0"]');
        (first || surface).focus({preventScroll:true});
      }
    });
    if (event.newState !== 'closed' || !allowed() || !surface.animate) return;
    const {top, left, width, height} = surface.getBoundingClientRect();
    if (!width || !height) return;
    const style = getComputedStyle(surface);
    const bounds = {top:top+'px', left:left+'px', width:width+'px', height:height+'px', display:style.display};
    const opacity = style.opacity;
    const shadeColor = getComputedStyle(surface, '::backdrop').backgroundColor;
    const state = {inert:surface.inert}; surfaceExits.set(surface, state);
    // Native close/submit has already returned focus by the time this frame is painted.
    state.frame = requestAnimationFrame(() => {
      if (!surface.isConnected || surface.matches('dialog[open], :popover-open') || !allowed()) { clearSurfaceExit(surface); return; }
      surface.dataset.motionExit = ''; surface.inert = true;
      state.animation = animate(surface, [
        {...bounds, opacity, transform:'none'}, {...bounds, opacity:0, transform:'translateY(5px) scale(.996)'}
      ], timing.component, {fill:'both'});
      if (!state.animation) { clearSurfaceExit(surface); return; }
      state.animation.id = 'cermat-surface-exit';
      if (shadeColor !== 'transparent' && shadeColor !== 'rgba(0, 0, 0, 0)') {
        const shade = document.createElement('div'); shade.dataset.motionBackdrop = ''; shade.inert = true;
        shade.setAttribute('aria-hidden','true'); shade.style.backgroundColor = shadeColor;
        surface.before(shade); state.shade = shade;
        state.shadeAnimation = animate(shade, [{opacity}, {opacity:0}], timing.component);
      }
      const clean = () => { if (surfaceExits.get(surface) === state) clearSurfaceExit(surface); };
      state.animation.finished.then(clean, clean);
    });
  }, true);

  function settleBar(bar, state, complete) {
    if (state.animation) {
      const progress = state.animation.effect.getComputedTiming().progress ?? 0;
      barValues.set(state.key, state.from + (state.value - state.from) * progress);
      const animation = state.animation;
      state.animation = null;
      animation.cancel();
    }
    if (complete) barValues.set(state.key, state.value);
    delete bar.dataset.motionFill;
    bar.style.removeProperty('--motion-fill');
  }
  function presentBar(bar, state) {
    if (state.animation || !state.visible || !allowed() || !bar.hasAttribute('data-motion-fill')) return;
    const scale = value => 'scaleX(' + value / 100 + ')';
    const motion = animate(bar, [{transform:scale(state.from)}, {transform:scale(state.value)}], timing.progress);
    if (!motion) { settleBar(bar,state,true); return; }
    motion.id = 'cermat-progress';
    state.animation = motion;
    motion.finished.then(() => { if (state.animation === motion) settleBar(bar,state,true); }, () => {});
  }
  function prepareBar(bar, state) {
    const value = Math.max(0, Math.min(100, parseFloat(bar.style.width) || 0));
    if (state.value === value) return;
    settleBar(bar,state,false);
    state.value = value;
    state.from = barValues.get(state.key) ?? 0;
    if (preference.matches || !barObserver || !bar.animate || !timing.progress) {
      settleBar(bar,state,true);
    } else if (state.from !== value) {
      bar.style.setProperty('--motion-fill', state.from / 100);
      bar.dataset.motionFill = '';
      presentBar(bar,state);
    }
  }
  const barObserver = window.IntersectionObserver && new IntersectionObserver(entries => {
    for (const {target,isIntersecting} of entries) {
      const state=bars.get(target);
      if (state) { state.visible=isIntersecting; presentBar(target,state); }
    }
  });
  const barStyles = new MutationObserver(entries => {
    for (const {target} of entries) if (bars.has(target)) prepareBar(target,bars.get(target));
  });
  function barsAndMetrics() {
    barStyles.disconnect();
    for (const [bar,state] of bars) if (!bar.isConnected) {
      settleBar(bar,state,false); barObserver?.unobserve(bar); bars.delete(bar);
    }
    if (screen === 'paper') return;
    for (const bar of app.querySelectorAll('.goal > i, .tp .bar > i')) {
      let state = bars.get(bar);
      if (!state) {
        const key = bar.closest('.tp')?.querySelector('span')?.textContent || 'daily-goal';
        state = {key, visible:false}; bars.set(bar,state); barObserver?.observe(bar);
      }
      prepareBar(bar,state);
      barStyles.observe(bar,{attributes:true,attributeFilter:['style']});
    }
    const metrics = app.querySelectorAll('.ovrow b, .practice-metrics strong, .topic-card-stats, .result-score .big, .result-score > strong');
    metrics.forEach((metric, index) => {
      const topic = metric.closest('[data-topic-id]');
      const key = topic ? 'topic:' + topic.dataset.topicId : screen + ':' + index;
      const value = metric.textContent, previous = metricValues.get(key);
      metricValues.set(key, value);
      if (previous !== undefined && previous !== value)
        animate(metric, [{opacity:.5, transform:'translateY(2px)'}, {opacity:1, transform:'none'}], timing.component);
    });
  }
  let dirtyStatus, pendingSave, resumeNote, resumeTimer, lastSavePulse = -Infinity;
  function clearResume() {
    clearTimeout(resumeTimer); resumeNote?.remove(); resumeNote = null;
  }
  function markEdited() {
    clearResume();
    pendingSave = null;
    dirtyStatus = app.querySelector('#study-save-status, #save-status');
  }
  // The subject adapters call this only after their own durable write succeeds.
  function saved(element) {
    if (!element || element !== dirtyStatus || !element.isConnected) return;
    if (pointers.size) { pendingSave=element; return; }
    pendingSave = null;
    dirtyStatus = null;
    if (!allowed() || performance.now() - lastSavePulse < 750) return;
    lastSavePulse = performance.now();
    element.dataset.motionSaved = '';
  }
  function resumed() {
    clearResume();
    const title = app.querySelector('.workspace-title');
    if (!title) return;
    const note = document.createElement('span');
    note.className = 'motion-resume-note';
    note.setAttribute('role','status');
    title.append(note); note.textContent = 'Pokračuješ v testu';
    resumeNote = note;
    animate(note,[{opacity:.3,transform:'translateY(3px)'},{opacity:1,transform:'none'}],timing.component);
    resumeTimer = setTimeout(() => {
      if (resumeNote !== note) return;
      const exit = animate(note,[{opacity:1},{opacity:0}],timing.press);
      const finish = () => { if (resumeNote === note) clearResume(); };
      if (exit) exit.finished.then(finish,finish); else finish();
    },1250);
  }
  function screenKey() {
    if (app.classList.contains('paperview')) return 'paper';
    if (app.classList.contains('homev')) return 'home';
    if (app.classList.contains('history-view')) return 'history';
    if (rootNode?.matches('.result-heading')) return 'result';
    return app.className + ':' + (rootNode?.querySelector('h1')?.textContent || rootNode?.className || '');
  }
  function visibleElements(selector, limit, within = app) {
    const elements = [];
    for (const el of within.querySelectorAll(selector)) {
      const box = el.getBoundingClientRect();
      if (box.height && box.width && box.bottom > 0 && box.top < innerHeight) elements.push(el);
      if (elements.length === limit) break;
    }
    return elements;
  }
  function subjectContent() {
    if (screen === 'paper') return [...app.querySelectorAll('.workspace-title > strong, .workspace-introduction')];
    if (screen === 'home') {
      // Photos and paper textures already blend with their frame. Only text needs a separate moving layer.
      const editorial = visibleElements('.notebook-intro, .fact-editorial, .notebook-progress',2);
      const content = visibleElements('.library-heading, .notebook-mix, .exam-index-heading, .year-card > summary, .year-card[open] > .year-terms, .topic-home > .sech, .topic-card, .unfinished',3-editorial.length);
      return editorial.concat(content);
    }
    const selector = ':scope > header h1, .result-heading h1, .practice-lead, .topic-card, .practice-config > h2, .practice-metrics, .result-score, .history-row > div, .unfinished-row > div, :scope > .sech, :scope > .mut, .sgrp';
    return visibleElements(selector,3);
  }
  function reveal(element, index, elapsed, {distance=9, fade=.36, ms=timing.page, scale=1} = {}) {
    const delay = index * timing.stagger - elapsed;
    if (delay <= -ms) return;
    const frames = distance
      ? [{opacity:fade,transform:'translateY(' + distance + 'px) scale(' + scale + ')'}, {opacity:1,transform:'none'}]
      : [{opacity:fade}, {opacity:1}];
    const motion = animate(element,frames,ms,{delay,fill:'backwards'});
    if (motion) motion.id='cermat-screen-enter';
  }
  function enterScreen(elapsed = 0) {
    if (!allowed() || elapsed >= timing.entrance + timing.stagger * 3) return;
    if (screen === 'paper') {
      const title=rootNode?.querySelector('.workspace-title > strong');
      if (title) reveal(title,0,elapsed,{distance:5});
      return;
    }
    let selector;
    if (screen === 'home') selector = '.notebook-intro h1, .notebook-intro > p:not(.notebook-kicker), .unfinished .sech, .library-heading, .fact-editorial h2';
    else if (screen === 'result') selector = '.result-heading h1, .result-score .big, .result-score .big + div, .answer-review .review-heading';
    else if (screen === 'history') selector = '.sethd h1, .unfinished .sech, .unfinished-list, .unfinished > .mut, :scope > .sech, .history-row, :scope > .mut';
    else selector = ':scope > header h1, :scope > h1, .practice-lead, .practice-layout > *, .topic-grid > .topic-card, :scope > .sgrp, :scope > .card, :scope > .mut';
    visibleElements(selector,4).forEach((el,i) => {
      const score = el.matches('.result-score .big');
      const interactive = el.matches('.practice-config, .topic-card, .card, .unfinished-list, .history-row');
      reveal(el,i,elapsed,{distance:interactive?0:score?12:9,fade:score ? .45 : .36, scale:score ? .954 : 1,
        ms:screen==='home'||screen==='result'?timing.entrance:timing.page});
    });
  }
  function cancelArrival() {
    arrivalObserver?.disconnect();
    arrivalObserver=null;
  }
  function sectionArrival(section) {
    cancelArrival();
    // WebKit can stop a native anchor scroll if the mobile menu is still changing height.
    for (const header of menus.keys()) settleMenu(header);
    if (!section || !allowed() || !window.IntersectionObserver) return;
    const target = section.querySelector('.ovrow, .library-heading, :scope > .sech') || section;
    const observer = new IntersectionObserver(entries => {
      if (observer !== arrivalObserver || !entries.some(entry=>entry.isIntersecting)) return;
      cancelArrival();
      if (!allowed() || !target.isConnected) return;
      reveal(target,0,0,{distance:7,fade:.35});
      if (section.id === 'ov') {
        const detail=section.querySelector('.ov-detail');
        if (detail) reveal(detail,1,0,{distance:0});
      }
    },{threshold:.25});
    arrivalObserver=observer;
    observer.observe(target);
  }
  function refresh() {
    const current = app.firstElementChild;
    if (current === rootNode || !current) return;
    rootNode = current;
    for (const [group, state] of segments) if (!group.isConnected) {
      segmentResize.unobserve(group); state.animation?.cancel(); segments.delete(group);
    }
    for (const details of disclosures.keys()) settleDisclosure(details);
    for (const header of menus.keys()) settleMenu(header);
    const previous = screen; screen = screenKey();
    cancelArrival();
    if (!resumeNote?.isConnected) clearResume();
    if (!dirtyStatus?.isConnected) dirtyStatus = pendingSave = null;
    barsAndMetrics();
    if (!allowed()) return;
    const now = performance.now();
    if (screen !== previous) entranceTime = now;
    else if (screen === 'paper') return; // Question changes, resizing and PDF renders are immediate.
    seen = true; enterScreen(now - entranceTime);
  }
  function settleAll(keepIndicators = false) {
    cancelArrival();
    for (const [bar,state] of bars) {
      if (state.animation || preference.matches) settleBar(bar,state,true);
    }
    for (const surface of surfaceExits.keys()) clearSurfaceExit(surface);
    for (const details of disclosures.keys()) settleDisclosure(details);
    for (const header of menus.keys()) settleMenu(header);
    for (const animation of animations) animation.cancel();
    animations.clear(); entranceTime = -Infinity;
    if (!keepIndicators) for (const state of segments.values()) state.animation?.cancel();
  }
  function interruptForInput() {
    settleAll(); dispatchEvent(new Event('cermat:motion-settle'));
  }
  const scrollBehavior = () => preference.matches ? 'auto' : 'smooth';
  document.addEventListener('click', event => {
    const summary = event.target.closest('summary');
    if (summary?.parentElement.matches(disclosureSelector) && !event.target.closest('a, button, input, select') && toggleDisclosure(summary.parentElement, summary)) event.preventDefault();
    const toggle = event.target.closest('.mobile-nav-toggle');
    if (toggle) captureMenu(toggle);
    const nav = event.target.closest('[data-motion-section], [data-action="scroll"]');
    if (nav) sectionArrival(document.getElementById(nav.dataset.motionSection || nav.dataset.value));
    const anchor = event.target.closest('.notebook-links a[href^="#"]');
    if (anchor) {
      const target = document.getElementById(anchor.hash.slice(1));
      if (target) { event.preventDefault(); sectionArrival(target); target.scrollIntoView({behavior:scrollBehavior()}); }
    }
  }, true);
  document.addEventListener('click', () => {
    if (menuIntent) { const intent = menuIntent; menuIntent = null; finishMenu(intent); }
  });
  document.addEventListener('toggle', event => {
    const details = event.target;
    if (details.matches?.(disclosureSelector) && !disclosures.has(details))
      details.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(details.open));
  }, true);
  document.addEventListener('change', event => {
    if (event.target.matches('#paper-tool, #ink-tool'))
      animate(app.querySelector('#paper-tool-hint, .instrument-hint'), [{opacity:.6}, {opacity:1}], timing.press);
  });
  let pressed;
  function releasePress() {
    if (pressed) { delete pressed.dataset.motionPressed; pressed=null; }
  }
  function clearSaveCue(event) {
    if (event.animationName === 'cermat-save') delete event.target.dataset.motionSaved;
  }
  app.addEventListener('animationend', clearSaveCue);
  app.addEventListener('animationcancel', clearSaveCue);
  app.addEventListener('input', () => { if (screen === 'paper') markEdited(); },true);
  app.addEventListener('change', () => { if (screen === 'paper') markEdited(); },true);
  document.addEventListener('pointerdown', event => {
    releasePress();
    if (event.isPrimary && event.button === 0 && !preference.matches) {
      const button = event.target.closest('button:enabled, .notebook-links a, .year-card > summary');
      if (button && (!button.closest('.paperview, #mk, .subject-switch') || button.matches('.workspace-top > button, .workspace-bottom > button'))) {
        pressed = button; button.dataset.motionPressed = '';
      }
    }
    if (screen === 'paper' && event.target.closest('.study-paper-svg, .final-answers, .workspace-tools')) markEdited();
    if (event.target.closest('.study-paper-svg, .paper-surface')) { pointers.add(event.pointerId); interruptForInput(); }
    else if (event.target.closest('.final-answers, .workspace-tools, #mk')) interruptForInput();
  }, {capture:true, passive:true});
  document.addEventListener('focusin', event => {
    if (event.target.matches(editableSelector)) interruptForInput();
  });
  const releasePointer = event => {
    pointers.delete(event.pointerId);
    if (event.isPrimary) releasePress();
    if (!pointers.size && pendingSave) saved(pendingSave);
  };
  addEventListener('pointerup', releasePointer, {passive:true}); addEventListener('pointercancel', releasePointer, {passive:true});
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    settleAll(); releasePress();
    for (const el of app.querySelectorAll('[data-motion-saved]')) delete el.dataset.motionSaved;
  });
  addEventListener('resize', () => {
    for (const details of disclosures.keys()) settleDisclosure(details);
    for (const header of menus.keys()) settleMenu(header);
  }, {passive:true});
  addEventListener('cermat:subject-visibility', event => {
    if (!event.detail.active) { releasePress(); pointers.clear(); settleAll(true); }
    else {
      for (const [bar,state] of bars) presentBar(bar,state);
      if (!seen && rootNode && allowed()) {
        seen = true; entranceTime = performance.now();
        if (!event.detail.transition) enterScreen();
      }
    }
  });
  addEventListener('blur',releasePress);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { releasePress(); pointers.clear(); settleAll(); } });
  // Only direct app replacements signal navigation. Pen samples, chat tokens and keystrokes do not trigger a scan.
  new MutationObserver(refresh).observe(app, {childList:true});
  window.CermatMotion = {segment, indicatorPosition, subjectContent, saved, resumed, settle:settleAll, get reduced() { return preference.matches; }, get scrollBehavior() { return scrollBehavior(); }};
  refresh();
})();
