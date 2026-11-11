(function(root){
  'use strict';
  const T=root.CermatTopics,e=root.CermatPaper.safe,js=v=>e(JSON.stringify(String(v)));
  let api,category='numbers',config={subtopics:[],count:20},ready=Promise.resolve();
  const catalog=new T.Catalog(root.CERMAT_TOPIC_TAGS||[]);
  function refresh(){catalog.refresh(api.getTests());}
  function allRecords(){const records=new Map();for(const r of [...api.store.records.values(),...api.store.history.values()]){const old=records.get(r.attemptId);if(!old||r.updatedAt>old.updatedAt)records.set(r.attemptId,r);}return[...records.values()];}
  const summary=id=>T.summarize(allRecords(),id);
  const drafts=id=>[...api.store.records.values()].filter(r=>r.kind==='topic-practice'&&r.status==='in-progress'&&r.practice?.category===id).sort((a,b)=>b.updatedAt-a.updatedAt);
  const plural=(n,one,few,many)=>n===1?one:n>=2&&n<=4?few:many;
  const percent=x=>x===null?'—':x+' %';
  const date=x=>new Date(x).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});


  async function load(){
    await api.store.ready;
    refresh();
    await Promise.all([...api.store.historyMeta.values()].filter(m=>m.kind==='topic-practice').map(m=>api.store.historyRecord(m.attemptId)));
    api.refresh();
  }

  function cards(){
    return `<div class="topic-grid">${T.CATEGORIES.map(c=>{
      const stats=summary(c.id), pool=catalog.pool(c.id), unfinished=drafts(c.id);
      return `<article class="tc topic-card">
        <span class="topic-symbol topic-symbol-${c.id}" aria-hidden="true">${c.symbol}</span>
        <div class="topic-copy">
          <h3>${e(c.name)}</h3><p>${e(c.intro)}</p>
          <div class="topic-card-count">${pool.length} ${plural(pool.length,'dostupná úloha','dostupné úlohy','dostupných úloh')} <span>·</span> ${c.topics.length} podtémat</div>
          <div class="topic-card-stats"><span><b>${stats.completed}</b> ${plural(stats.completed,'dokončený test','dokončené testy','dokončených testů')}</span><span><b>${percent(stats.accuracy)}</b> úspěšnost</span></div>
          <div class="tc-act"><button class="text-button" onclick="CermatPractice.configure(${js(c.id)})" aria-label="Procvičovat ${e(c.name)}">Procvičovat <span aria-hidden="true">→</span></button>${unfinished.length?`<button onclick="CermatUpgrade.resume(${js(unfinished[0].key)})">Pokračovat (${unfinished.length})</button>`:''}</div>
        </div>
      </article>`;
    }).join('')}</div>`;
  }
  function home(){
    refresh();
    return `<section class="topic-home" id="sect-topics" aria-labelledby="topics-heading">
      <div class="sech"><h2 id="topics-heading">Procvičování podle témat</h2><button class="text-button" onclick="go('topics')">Přehled témat <span aria-hidden="true">→</span></button></div>
      ${cards()}
    </section>`;
  }
  function heading(title,back='home'){return `<header class="practice-heading"><button class="text-button" onclick="go(${js(back)})">← ${back==='home'?'Zpět na testy':'Všechna témata'}</button><span class="editorial-label">MATEMATIKA KROK ZA KROKEM</span><h1>${e(title)}</h1></header>`;}
  function overview(){refresh();return `${heading('Procvičování podle témat')}<p class="practice-lead">Vyber oblast a sestav si vlastní sadu úloh. Každý pokus má své odpovědi, pracovní papír a výsledky.</p>${cards()}`;}
  function statsMarkup(c){
    const s=summary(c.id),unfinished=drafts(c.id);
    return `<section class="topic-progress" aria-labelledby="category-progress"><div class="sech"><h2 id="category-progress">Tvoje procvičování</h2></div><div class="practice-metrics"><div><strong>${s.completed}</strong><span>${plural(s.completed,'dokončený test','dokončené testy','dokončených testů')}</span></div><div><strong>${percent(s.accuracy)}</strong><span>úspěšnost odpovědí</span></div><div><strong>${s.answered}</strong><span>${plural(s.answered,'zodpovězená úloha','zodpovězené úlohy','zodpovězených úloh')}</span></div></div><p class="practice-caption">Úspěšnost počítáme z vyhodnocených odpovědí; neodevzdané odpovědi a nezkontrolované konstrukce se do ní nepočítají.${s.pending?' Na vlastní kontrolu čeká '+s.pending+' konstrukcí.':''}</p>${s.strongest?`<div class="topic-strength"><p><span>Nejsilnější podtéma</span><strong>${e(s.strongest.name)}</strong><small>${s.strongest.accuracy} % · ${s.strongest.answered} ${plural(s.strongest.answered,'odpověď','odpovědi','odpovědí')}</small></p>${s.weakest?`<p><span>Stojí za procvičení</span><strong>${e(s.weakest.name)}</strong><small>${s.weakest.accuracy} % · ${s.weakest.answered} ${plural(s.weakest.answered,'odpověď','odpovědi','odpovědí')}</small></p>`:''}</div><details class="subtopic-results"><summary>Výsledky podle podtémat</summary><div class="practice-table-wrap"><table><thead><tr><th>Podtéma</th><th>Odpovědi</th><th>Úspěšnost</th></tr></thead><tbody>${s.subtopics.map(t=>`<tr><th>${e(t.name)}</th><td>${t.answered}</td><td>${t.accuracy} %</td></tr>`).join('')}</tbody></table></div></details>`:'<p class="mut practice-empty">Po prvním procvičování tu uvidíš, co ti jde a k čemu se vrátit.</p>'}${unfinished.length?`<h3>Rozepsané pokusy</h3><div class="practice-session-list">${unfinished.map(r=>`<article><div><strong>${r.questions.length} ${plural(r.questions.length,'úloha','úlohy','úloh')} · ${Object.values(r.answers).filter(T.hasAnswer).length} odpovědí</strong><span>${date(r.updatedAt)}</span></div><button onclick="CermatUpgrade.resume(${js(r.key)})">Pokračovat</button></article>`).join('')}</div>`:''}<h3>Předchozí procvičování</h3>${s.sessions.length?`<div class="practice-session-list">${s.sessions.slice(0,8).map(r=>`<article><div><strong>${r.questions.length} ${plural(r.questions.length,'úloha','úlohy','úloh')}${r.practice.mode==='mistakes'?' · oprava chyb':''}</strong><span>${date(r.updatedAt)}${r.result?.rows.some(x=>x.pend)?' · čeká na kontrolu':''}</span></div><b>${r.result?.pct??0} %</b><button onclick="CermatUpgrade.openHistory(${js(r.attemptId)})">Řešení</button></article>`).join('')}</div>${s.sessions.length>8?'<button class="text-button" onclick="go(\'history\')">Celá historie pokusů</button>':''}`:'<p class="mut practice-empty">Zatím jsi žádné procvičování v této oblasti nedokončil.</p>'}</section>`;
  }
  function categoryView(){
    refresh();const c=T.CATEGORIES.find(c=>c.id===category);
    return `${heading(c.name,'topics')}<p class="practice-lead">${e(c.intro)}</p><div class="practice-layout"><form class="practice-config" onsubmit="event.preventDefault();CermatPractice.generate()"><h2>Sestav si procvičování</h2><fieldset class="subtopic-picker"><legend>Co chceš procvičit?</legend><p>Bez výběru použijeme celou oblast. Více podtémat spojíme do jednoho výběru.</p><div class="subtopic-options">${c.topics.map(([id,name])=>{const n=catalog.pool(c.id,[id]).length;return `<label><input type="checkbox" name="practice-subtopic" value="${id}" ${config.subtopics.includes(id)?'checked':''} ${n?'':'disabled'}><span>${e(name)}</span><small>${n}</small></label>`;}).join('')}</div><button type="button" class="text-button" onclick="CermatPractice.clearSubtopics()">Vybrat celou oblast</button></fieldset><fieldset class="practice-count"><legend>Kolik úloh?</legend><div class="count-presets">${[10,20,30].map(n=>`<button type="button" data-count="${n}" aria-pressed="${config.count===n}" onclick="CermatPractice.count(${n})">${n}</button>`).join('')}<label>Vlastní počet<input type="number" id="practice-count" min="1" max="1000" step="1" inputmode="numeric" value="${config.count}" required></label></div></fieldset><div class="practice-availability" id="practice-availability" aria-live="polite"></div><button class="p practice-generate" id="practice-generate" type="submit">Vygenerovat a začít</button><p class="practice-caption">Pořadí úloh se uloží. Kdykoli můžeš odejít a později pokračovat se stejným zadáním.</p><p class="practice-form-message" id="practice-form-message" role="status"></p></form>${statsMarkup(c)}</div>`;
  }
  function readConfig(){const count=document.getElementById('practice-count');if(count){config.count=Number(count.value);config.subtopics=[...document.querySelectorAll('[name="practice-subtopic"]:checked')].map(x=>x.value);}return config;}
  function preview(){
    if(!document.getElementById('practice-count'))return;readConfig();
    const pool=catalog.pool(category,config.subtopics),valid=Number.isInteger(config.count)&&config.count>=1&&config.count<=1000,n=Math.min(config.count,pool.length),output=document.getElementById('practice-availability');
    output.innerHTML=`<strong>${pool.length} ${plural(pool.length,'dostupná úloha','dostupné úlohy','dostupných úloh')}</strong><span>${!valid?'Zadej celé číslo od 1 do 1 000.':!pool.length?'Pro tento výběr zatím nejsou ověřené úlohy. Zkus jiná podtémata.':config.count>pool.length?'Požaduješ '+config.count+' '+plural(config.count,'úlohu','úlohy','úloh')+'. Test bude mít '+pool.length+' '+plural(pool.length,'úlohu','úlohy','úloh')+'. Další úlohy nedoplňujeme.':'Připravíme '+n+' '+plural(n,'náhodně vybranou úlohu','náhodně vybrané úlohy','náhodně vybraných úloh')+'.'}</span>`;
    document.getElementById('practice-generate').disabled=!valid||!pool.length;
    document.querySelectorAll('[data-count]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.count)===config.count)));
  }
  async function generate(){
    const button=document.getElementById('practice-generate'),message=document.getElementById('practice-form-message');if(button)button.disabled=true;
    try{readConfig();await ready;if(!api.bankReady())throw new Error('Ještě načítám uloženou knihovnu. Zkus to prosím za okamžik.');refresh();const pool=catalog.pool(category,config.subtopics),previous=allRecords().filter(r=>r.kind==='topic-practice'&&r.practice.category===category).sort((a,b)=>b.updatedAt-a.updatedAt)[0];
      const entries=T.choose(pool,config.count,previous?.questions||[]),record=T.createSession(entries,{category,subtopics:config.subtopics,requested:config.count,available:pool.length});api.start(record);
    }catch(error){if(message)message.textContent=error.message;else api.notify(error.message);if(button)button.disabled=false;}
  }
  function repeat(record,mistakes=false){
    refresh();category=record.practice.category;config={subtopics:[...record.practice.subtopics],count:record.practice.requested};
    if(!mistakes){try{const pool=catalog.pool(category,config.subtopics),entries=T.choose(pool,config.count,record.questions);api.start(T.createSession(entries,{category,subtopics:config.subtopics,requested:config.count,available:pool.length}));}catch(error){api.notify(error.message);}return;}
    const wrong=new Set((record.result?.rows||[]).filter(r=>r.g<r.m&&!r.pend).map(r=>r.ref));
    const entries=record.questions.filter(r=>wrong.has(r.slotId)).map(r=>catalog.resolve(r));
    if(!entries.length){api.notify('Nejdřív zkontroluj konstrukce, nebo si vyber nové procvičování.');return;}
    if(entries.some(x=>!x)){api.notify('Některá původní úloha chybí. Obnov ji ze zálohy; dosavadní práce zůstala zachována.');return;}
    api.start(T.createSession(entries,{category,subtopics:config.subtopics,mode:'mistakes'}));
  }


  root.CermatPractice={catalog,install(options){api=options;ready=load();document.getElementById('app').addEventListener('input',event=>{if(event.target.id==='practice-count')preview();});document.getElementById('app').addEventListener('change',event=>{if(event.target.name==='practice-subtopic'||event.target.id==='practice-count')preview();});},home,view:route=>route==='topics'?overview():route==='topic'?categoryView():null,afterRender:preview,
    configure(id){if(!T.CATEGORIES.some(c=>c.id===id))return;category=id;config={subtopics:[],count:20};api.navigate('topic');},count(n){document.getElementById('practice-count').value=n;preview();},clearSubtopics(){document.querySelectorAll('[name="practice-subtopic"]').forEach(x=>x.checked=false);preview();},generate,repeat,summary,refresh,
    resultActions(record){const wrong=record.result?.rows.filter(r=>r.g<r.m&&!r.pend).length||0;return `<div class="row practice-result-actions"><button class="p" onclick="CermatPractice.repeat(CermatUpgrade.active)">Nové procvičování tématu</button>${wrong?`<button onclick="CermatPractice.repeat(CermatUpgrade.active,true)">Procvičit chyby (${wrong})</button>`:''}<button onclick="CermatPractice.configure(${js(record.practice.category)})">Pokrok v tématu</button><button onclick="go('home')">Zpět na testy</button></div>`;}
  };
})(window);
