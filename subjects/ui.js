/* Shared presentation only. Subject adapters supply content, actions and statistics. */
(function(root){
  'use strict';
  const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function navigation({subject,brandAction,menuAction,items,search}){
    return `<header class="topnav"><div class="tn-in"><a class="brand study-brand" href="#" ${brandAction}><span class="study-monogram" aria-hidden="true">${subject==='cz'?'Č':'M'}</span><span class="bt"><b>Cermat testy</b><span>${subject==='cz'?'Český jazyk':'Matematika'} · 9. třída</span></span></a><button class="mobile-nav-toggle" aria-controls="study-navigation" aria-expanded="false" ${menuAction}>Menu</button><nav class="nav" id="study-navigation" aria-label="Hlavní navigace">${items}</nav></div>${search}</header>`;
  }
  function hero({subject,title,accent,description}){
    return `<section class="notebook-hero" aria-labelledby="notebook-title"><div class="notebook-intro"><p class="notebook-kicker">Přijímací zkoušky · 9. třída</p><h1 id="notebook-title">${e(title)} <span>${e(accent)}</span></h1><p>${e(description)}</p><div class="notebook-links"><a class="notebook-primary" href="#sect-tests">Vybrat test <span aria-hidden="true">↓</span></a><a class="notebook-secondary" href="#sect-topics">Procvičit téma</a></div></div><div class="notebook-pattern" aria-hidden="true" data-pattern="${e(subject)}"></div></section>`;
  }
  function home({navigation,hero,unfinished,title,library,fact,portrait,progress,topics,footer,notice='',headingAction=''}){
    return `${navigation}${hero}${notice}<div class="notebook-layout"><div class="notebook-main">${unfinished}<section class="test-library" id="sect-tests" aria-labelledby="test-library-heading"><div class="sech library-heading"><h2 id="test-library-heading">${e(title)}</h2>${headingAction}</div>${library}</section></div><aside class="notebook-margin" aria-label="Zajímavost a pokrok">${fact}${portrait}<section class="notebook-progress" aria-labelledby="notebook-progress-heading"><h2 id="notebook-progress-heading">Můj pokrok</h2>${progress}</section></aside></div>${topics}<footer class="study-footer">${footer}</footer>`;
  }
  function fact({id='fact-heading',title,text,source,credit='Ověřit ve zdroji',next}){
    return `<section class="fact-editorial" id="${e(id)}" aria-labelledby="${e(id)}-label"><div class="editorial-label" id="${e(id)}-label">Věděl jsi, že…?</div><h2>${e(title)}</h2><p>${e(text)}</p><div class="fact-bottom"><a href="${e(source)}" target="_blank" rel="noopener">${e(credit)}</a>${next}</div></section>`;
  }
  function year({year,open,count,tasks,unfinished,done,terms}){
    const label=count===1?'termín':count<5?'termíny':'termínů';
    return `<details class="tc year-card" data-year="${e(year)}" ${open?'open':''}><summary><h4>${e(year)}</h4><span class="year-summary-meta">${count} ${label} · ${tasks} úloh</span><span class="year-summary-status${unfinished?' in-progress':''}">${unfinished?unfinished+' rozepsáno':done+'/'+count+' dokončeno'}</span><span class="year-chevron" aria-hidden="true"></span></summary><div class="year-terms">${terms}</div></details>`;
  }
  function term({id,title,meta,status='',review='',best,actions}){
    return `<div class="year-term" data-exam-id="${e(id)}"><div class="term-main"><h5>${e(title)}</h5><div class="term-meta">${meta}</div>${status}${review}</div><div class="term-score"><span>Nejlepší</span><strong>${e(best)}</strong></div><div class="term-actions">${actions}</div></div>`;
  }
  function mix({meta,actions}){
    return `<article class="tc mix notebook-mix" aria-labelledby="mix-heading"><div class="mix-copy"><h3 id="mix-heading">Náhodný mix</h3><p>Úlohy napříč testy a tématy.</p><p class="mix-meta">${e(meta)}</p></div><div class="tc-act">${actions}</div></article>`;
  }
  function topic({id,title,description,count,stats='',accuracy,actions,sessions=[]}){
    const result=Number.isFinite(accuracy)?`<span><b>${e(accuracy)} %</b> úspěšnost odpovědí</span>`:'<span class="topic-empty">Zatím bez výsledků</span>';
    const unfinished=sessions.length>1?`<details class="topic-drafts"><summary>Vybrat rozepsaný test (${sessions.length})</summary><ul class="topic-session-list">${sessions.map(s=>`<li><div><strong>${e(s.label)}</strong><span>${e(s.updated)}</span></div>${s.action}</li>`).join('')}</ul></details>`:sessions.length?`<p class="topic-resume-note">Rozepsáno · ${e(sessions[0].label)} · ${e(sessions[0].updated)}</p>`:'';
    return `<article class="tc topic-card" data-topic-id="${e(id)}" aria-labelledby="topic-heading-${e(id)}"><div class="topic-copy"><h3 id="topic-heading-${e(id)}">${e(title)}</h3><p>${e(description)}</p><div class="topic-card-count">${count}</div><div class="topic-card-stats">${stats}${result}</div><div class="tc-act">${actions}${sessions[0]?.action||''}</div>${unfinished}</div></article>`;
  }
  function topicHome({cards,action}){
    return `<section class="topic-home" id="sect-topics" aria-labelledby="topics-heading"><div class="sech"><h2 id="topics-heading">Procvičování podle témat</h2>${action}</div><div class="topic-grid">${cards}</div></section>`;
  }
  function progress({metrics,label,max,value,description,topics='',action=''}){
    return `<div class="card ov" id="ov" role="region" aria-label="Můj pokrok"><div class="ovrow">${metrics.map(m=>`<div><b>${e(m.value)}</b><span>${e(m.label)}</span></div>`).join('')}</div><div class="ov-detail"><div class="ov-label">${e(label)}</div><div class="goal" role="progressbar" aria-label="${e(label)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><i style="width:${max?Math.min(100,value/max*100):0}%"></i></div><p class="mut">${e(description)}</p></div>${topics?`<div class="tps">${topics}</div>`:''}${action}</div>`;
  }
  function heading({title,back,label=''}){
    return `<header class="practice-heading">${back}<span class="editorial-label">${e(label)}</span><h1>${e(title)}</h1></header>`;
  }
  root.CermatUI=Object.freeze({navigation,hero,home,fact,year,term,mix,topic,topicHome,progress,heading});
})(window);
