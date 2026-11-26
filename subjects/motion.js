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
    press: duration('press'), component: duration('component'), page: duration('page'),
    entrance: duration('entrance'), stagger: duration('stagger'),
    ease: token('ease') || 'ease-out', spring: token('spring') || 'ease-out'
  };
  const animations = new Set(), disclosures = new Map(), menus = new Map(), segments = new Map();
  const surfaceExits = new Map();
  const barValues = new Map(), metricValues = new Map(), pointers = new Set();
  const disclosureSelector = '.year-card, .topic-filter, .topic-drafts, .subtopic-results, .archive-notes';
  const editableSelector = 'input, textarea, select, [contenteditable="true"]';
  let rootNode, screen, entranceTime = -Infinity, seen = false, statusObserver, menuIntent;

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

  function segment(group, choice, {from, animated = false} = {}) {
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
    if (state.choice === choice && state.x === x && state.width === width) return;
    const previous = from && group.querySelector(`[data-subject-choice="${from}"]`);
    let startX = previous?.offsetLeft ?? state.x, startWidth = previous?.offsetWidth || state.width;
    if (state.animation?.playState === 'running') {
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
      ], {duration:timing.page, easing:timing.spring});
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
    details.open = state.open; state.animation?.cancel();
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
    if (useClip) {
      // The list takes its natural dimensions once. The visible rows glide into place without per-frame layout.
      const direction = (closed, expanded) => state.open ? [closed, expanded] : [expanded, closed];
      const closed = {clipPath:`inset(0 0 ${Math.abs(end-start)}px 0)`};
      state.animation = animate(details, direction(closed, {clipPath:'inset(0 0 0px 0)'}), timing.component, {fill:'both'});
      state.branches = [];
      for (const [element, y] of moves) {
        const frames = direction({transform:`translateY(${y}px)`}, {transform:'translateY(0px)'});
        const animation = animate(element, frames, timing.component, {fill:'both', composite:'add'});
        if (animation) state.branches.push(animation);
      }
      addEventListener('wheel', finishRevealsOnScroll, {passive:true});
      addEventListener('touchmove', finishRevealsOnScroll, {passive:true});
    } else {
      state.animation = animate(details, [{height:start+'px'}, {height:end+'px'}], timing.component, {fill:'both'});
    }
    if (!state.animation) { settleDisclosure(details); return true; }
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

  function barsAndMetrics() {
    for (const bar of app.querySelectorAll('.goal > i, .tp .bar > i')) {
      const key = bar.closest('.tp')?.querySelector('span')?.textContent || 'daily-goal';
      const value = parseFloat(bar.style.width) || 0, previous = barValues.get(key) ?? 0;
      barValues.set(key, value);
      if (previous === value) continue;
      const animation = animate(bar, [{transform:`scaleX(${previous / 100})`}, {transform:`scaleX(${value / 100})`}], timing.component);
      if (animation) {
        bar.dataset.motionFill = '';
        const restore = () => { delete bar.dataset.motionFill; };
        animation.finished.then(restore, restore);
      }
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
  let lastSavePulse = -Infinity;
  function bindStatus() {
    statusObserver?.disconnect();
    const element = document.querySelector('#save-status, #study-save-status');
    if (!element) return;
    let before = element.textContent;
    statusObserver = new MutationObserver(() => {
      const text = element.textContent, now = performance.now();
      if (text !== before && /^Uloženo/.test(text) && now - lastSavePulse > 900 && !document.activeElement?.matches(editableSelector)) {
        animate(element, [{opacity:.6}, {opacity:1}], timing.press);
        lastSavePulse = now;
      }
      before = text;
    });
    statusObserver.observe(element, {childList:true, characterData:true, subtree:true});
  }
  function screenKey() {
    if (app.classList.contains('paperview')) return 'paper';
    if (app.classList.contains('homev')) return 'home';
    return app.className + ':' + (rootNode?.querySelector('h1')?.textContent || rootNode?.className || '');
  }
  function enterScreen(elapsed = 0) {
    if (!allowed() || elapsed >= timing.entrance + timing.stagger * 3) return;
    if (screen === 'paper') {
      // The header is already in view. Reading its bounds would force layout of the new paper.
      animate(rootNode?.querySelector('.workspace-title > strong'), [{opacity:.65}, {opacity:1}], timing.page);
      return;
    }
    const find = selector => app.querySelector(selector);
    // A form or button stays in its final hit box. Only noninteractive text travels.
    const targets = screen === 'home' ? [
      [find('.notebook-intro h1'), true], [find('.notebook-intro > p:not(.notebook-kicker)'), true],
      [find('.library-heading'), false], [find('.fact-editorial'), false]
    ] : [
      [rootNode?.querySelector('h1'), true], [find(':scope > :is(.practice-lead, .card, .unfinished)'), false],
      ...[...app.querySelectorAll(':scope > .topic-grid > .topic-card:nth-child(-n+3), :scope > .practice-layout > *, :scope > .answer-review:nth-of-type(-n+2)')].slice(0,3).map(el => [el,false])
    ];
    let visible = 0;
    for (const [element, slide] of targets) {
      if (!element || visible === 4) continue;
      const box = element.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= innerHeight) continue;
      const duration = (screen === 'home' || element.matches('.result-score')) ? timing.entrance : timing.page;
      const delay = visible++ * timing.stagger - elapsed;
      if (delay <= -duration) continue;
      const frames = slide ? [{opacity:.55, transform:'translateY(6px)'}, {opacity:1, transform:'none'}] : [{opacity:.65}, {opacity:1}];
      animate(element, frames, duration, {delay, fill:'backwards'});
    }
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
    bindStatus();
    if (screen !== 'paper') barsAndMetrics();
    if (!allowed()) return;
    const now = performance.now();
    if (screen !== previous) entranceTime = now;
    else if (screen === 'paper') return; // Question changes, resizing and PDF renders are immediate.
    seen = true; enterScreen(now - entranceTime);
  }
  function settleAll(keepIndicators = false) {
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
    const anchor = event.target.closest('.notebook-links a[href^="#"]');
    if (anchor) {
      const target = document.getElementById(anchor.hash.slice(1));
      if (target) { event.preventDefault(); target.scrollIntoView({behavior:scrollBehavior()}); }
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
  document.addEventListener('pointerdown', event => {
    if (event.target.closest('.study-paper-svg, .paper-surface')) { pointers.add(event.pointerId); interruptForInput(); }
    else if (event.target.closest('.final-answers, .workspace-tools, #mk')) interruptForInput();
  }, {capture:true, passive:true});
  document.addEventListener('focusin', event => {
    if (event.target.matches(editableSelector)) interruptForInput();
  });
  const releasePointer = event => pointers.delete(event.pointerId);
  addEventListener('pointerup', releasePointer, {passive:true}); addEventListener('pointercancel', releasePointer, {passive:true});
  preference.addEventListener('change', () => { if (preference.matches) settleAll(); });
  addEventListener('resize', () => {
    for (const details of disclosures.keys()) settleDisclosure(details);
    for (const header of menus.keys()) settleMenu(header);
  }, {passive:true});
  addEventListener('cermat:subject-visibility', event => {
    if (!event.detail.active) { pointers.clear(); settleAll(true); }
    else if (!seen && rootNode && allowed()) { seen = true; entranceTime = performance.now(); enterScreen(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pointers.clear(); settleAll(); } });
  // Only direct app replacements signal navigation. Pen samples, chat tokens and keystrokes do not trigger a scan.
  new MutationObserver(refresh).observe(app, {childList:true});
  window.CermatMotion = {segment, settle:settleAll, get reduced() { return preference.matches; }, get scrollBehavior() { return scrollBehavior(); }};
  refresh();
})();
