import '../subjects/ui.js';
import { topics } from './data/topics.js';
import { SCHEMA, loadAttempts, newAttempt, putAttempt, recover, journal, pref, setPref, validateBackup } from './shared/storage.js';
import { isAnswered, scoreAttempt, shuffleUnique } from './shared/scoring.js';
import { PaperRenderer } from './shared/paper.js';
import { html, formatDate, countTasks, plural, fold, clock, button, pdfLink, answerForm } from './shared/ui.js';
import { setupOffline, offlinePanel, cacheArchive } from './shared/offline.js';

const UI=window.CermatUI;
const app = document.getElementById('app');
const dialog = document.getElementById('app-dialog');
const portraitUrl = 'https://commons.wikimedia.org/wiki/File:Anton%C3%ADn_Machek_-_Portrait_of_Josef_Jungmann.jpg';
const archiveNote = 'V archivu CERMAT nejsou u ročníků 2015–2020 zveřejněny náhradní termíny. V roce 2020 je zveřejněn jeden řádný termín. Pilotní testy z let 2015 a 2016 se liší od současného formátu.';
const toolLabels = {
  move:'Posouvání', underline:'Podtržení', highlight:'Zvýraznění', circle:'Kroužek',
  strike:'Přeškrtnutí', pen:'Pero', arrow:'Šipka', text:'Poznámka', grammar:'Označení větného členu', eraser:'Guma'
};

let data, facts, examMap, questionMap, attempts = new Map();
let view = 'home', attempt, currentFact, paper, selectedPage;
let zoom = 100, tool = { tool:'move', color:'#2663a5', width:2.3 };
let startedAt = null, saveTimer, saveChain = Promise.resolve();
let query = '', searchOpen = false, selectedCategory = '', practiceMode = 'topics', reviewFilter = 'all';
let practiceCount = 10, practiceTags = new Set(), readOnlyPaper = false, resultScroll = 0;
let openedYears = new Set(),topicOverview=false,yearsInitialized=false;

async function json(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Načtení dat se nezdařilo.');
  return response.json();
}
async function boot() {
  [data, facts] = await Promise.all([json('./data/subject-cz.json'), json('./data/facts.json')]);
  examMap = new Map(data.exams.map(exam => [exam.id, exam]));
  questionMap = new Map(data.questions.map(question => [question.id, question]));
  try {
    await recover();
    attempts = new Map((await loadAttempts()).filter(record => record.questionIds.every(id=>questionMap.has(id))).map(record => [record.id, record]));
  } catch {
    notice('Nepodařilo se načíst místní historii. Zálohu můžeš obnovit v Nastavení.');
  }
  nextFact();
  render();
  setupOffline(data);
}

function listAttempts(status) {
  return [...attempts.values()].filter(record => record.status===status).sort((a,b) => b.updatedAt-a.updatedAt);
}
function answered(record) {
  return record.questionIds.filter(id => isAnswered(questionMap.get(id), record.answers[id])).length;
}
function bestFor(examId) {
  const scores = listAttempts('submitted').filter(a=>a.examId===examId && a.result?.final).map(a=>a.result.points);
  return scores.length ? Math.max(...scores) : null;
}
function topicStats(category) {
  const rows = listAttempts('submitted').flatMap(a=>a.result?.rows || []).filter(row=>!row.pending && (!category||questionMap.get(row.id)?.category===category));
  const total = rows.reduce((n,row)=>n+row.max,0);
  return { rows, pct:total?Math.round(100*rows.reduce((n,row)=>n+row.points,0)/total):null };
}
function nextFact() {
  const previous = pref('fact',-1);
  const next = previous<0 ? Math.floor(Math.random()*facts.length) : (previous+1+Math.floor(Math.random()*(facts.length-1)))%facts.length;
  currentFact = facts[next];
  setPref('fact',next);
}
function factMarkup() {
  return UI.fact({id:'daily-fact',title:currentFact.title,text:currentFact.text,source:currentFact.source,credit:currentFact.credit,next:button('Další zajímavost →','fact','','text-button')});
}
function nav() {
  return UI.navigation({subject:'cz',brandAction:'data-action="home"',menuAction:'data-action="menu"',
    items:button('Testy','scroll','sect-tests','on')+button('Témata','practice','topics')+button('Můj pokrok','scroll','ov')+button('Rozepsané a historie','history')+button('Nastavení','settings')+button('Hledat','search','','si','aria-label="Hledat test"'),
    search:`<div class="sbar" ${searchOpen?'':'hidden'}><input id="test-search" type="search" aria-label="Hledat test" placeholder="Hledat rok, termín nebo test…" value="${html(query)}"></div>`});
}
function unfinishedMarkup(showAll=false) {
  const drafts = listAttempts('active');
  if (!drafts.length && !showAll) return '';
  return `<section class="unfinished"><div class="sech"><div><span class="editorial-label">ROZEPSANÉ TESTY</span><h2>Pokračuj, kde jsi skončil</h2></div>${!showAll&&drafts.length>3?button('Zobrazit vše','history','','text-button'):''}</div>
    ${drafts.length ? `<div class="unfinished-list">${drafts.slice(0,showAll?drafts.length:3).map(a=>`<div class="unfinished-row"><div><strong>${html(a.title)}</strong><span>${answered(a)}/${a.questionIds.length} hotovo · ${formatDate(a.updatedAt)}</span></div>${button('Pokračovat','resume',a.id)}</div>`).join('')}</div>` : '<p class="mut">Žádný rozepsaný test.</p>'}</section>`;
}
function overview() {
  const completed=listAttempts('submitted'),finals=completed.filter(a=>a.result?.final);
  const average=finals.length?Math.round(finals.reduce((n,a)=>n+a.result.pct,0)/finals.length):null;
  const officialIds=new Set(finals.filter(a=>a.examId).map(a=>a.examId)),available=data.exams.filter(e=>e.complete).length;
  return UI.progress({metrics:[{value:completed.length,label:'Odevzdané pokusy'},{value:average===null?'—':average+' %',label:'Průměrná úspěšnost'}],label:'Dokončená zadání · '+officialIds.size+' / '+available,max:available,value:officialIds.size,
    description:completed.length?'Výsledky a poznámky najdeš v historii.':'Po prvním testu tu uvidíš svůj pokrok.',
    topics:completed.length?topics.map(c=>{const s=topicStats(c.id);return `<div class="tp"><span>${html(c.name)}</span><div class="bar"><i style="width:${s.pct??0}%"></i></div><b>${s.pct===null?'—':s.pct+' %'}</b></div>`;}).join(''):''});
}
function topicCards() {
  return topics.map(category=>{
    const pool=practicePool(category.id,new Set()),s=topicStats(category.id);
    const unfinished=listAttempts('active').filter(a=>a.kind==='practice' && a.practice?.category===category.id);
    return UI.topic({id:category.id,title:category.name,description:category.description,
      count:`${countTasks(pool.length)} <span>·</span> ${category.topics.length} podtémat`,
      stats:s.rows.length?`<span><b>${s.rows.length}</b> ${plural(s.rows.length,'vyhodnocená úloha','vyhodnocené úlohy','vyhodnocených úloh')}</span>`:'',accuracy:s.pct,
      actions:button('Procvičovat','practice',category.id,'topic-practice-action',`aria-label="Procvičovat ${html(category.name)}"`),
      sessions:unfinished.map(a=>({label:`${answered(a)}/${a.questionIds.length} odpovědí`,updated:formatDate(a.updatedAt),action:button('Pokračovat','resume',a.id,'topic-resume-action',`aria-label="Pokračovat ${html(category.name)} · ${html(formatDate(a.updatedAt))}"`)}))});
  }).join('');
}
function topicHome() {
  return UI.topicHome({cards:topicCards(),action:button('Přehled témat →','practice','topics','text-button')});
}
function renderYears() {
  const q=fold(query.trim()),exams=data.exams.filter(e=>!q||fold(`cesky jazyk čeština ${e.year} ${e.title} ${e.id}`).includes(q));
  const years=[...new Set(exams.map(e=>e.year))];
  if(!years.length)return '<p class="mut">Žádné zadání neodpovídá hledání.</p>';
  if(!yearsInitialized){openedYears.add(years[0]);yearsInitialized=true;}
  return years.map(year=>{
    const items=exams.filter(e=>e.year===year),done=items.filter(e=>bestFor(e.id)!==null).length;
    const unfinished=items.filter(e=>listAttempts('active').some(a=>a.examId===e.id)).length;
    const terms=items.map(e=>{
      const draft=listAttempts('active').find(a=>a.examId===e.id),recent=listAttempts('submitted').find(a=>a.examId===e.id),best=bestFor(e.id);
      const title=e.kind==='regular'&&data.exams.filter(x=>x.year===e.year&&x.kind==='regular').length===1&&e.year<=2020?'Řádný termín':e.title;
      return UI.term({id:e.id,title,
        meta:e.complete?`${countTasks(e.questionIds.length)} <span>·</span> ${e.durationMinutes} min <span>·</span> ${e.maxPoints} bodů${e.historicalFormat?' · pilotní formát':''}`:'Zadání a klíč v PDF',
        status:draft?`<span class="draft-mark">Rozepsáno · ${answered(draft)}/${draft.questionIds.length} odpovědí</span>`:best!==null?'<span class="completion-mark">Dokončeno</span>':'<span class="mut">Zatím nespuštěno</span>',
        review:`<div class="term-review">${pdfLink(e.files.paper.path,'Zadání PDF')} · ${pdfLink(e.files.key.path,'Klíč PDF')}</div>`,best:best===null?'—':best+' / '+e.maxPoints,
        actions:(e.complete?button(draft?'Pokračovat':'Spustit',draft?'resume':'start',draft?draft.id:e.id,'p'):'')+(draft?button('Nový pokus','start',e.id):'')+(recent?button('Výsledek','result',recent.id):'')});
    }).join('');
    return UI.year({year,open:openedYears.has(year)||q,count:items.length,tasks:items.reduce((n,e)=>n+e.questionIds.length,0),unfinished,done,terms});
  }).join('');
}
function home() {
  return UI.home({navigation:nav(),hero:UI.hero({subject:'cz',title:'Čeština má',accent:'svůj příběh.',description:'Oficiální testy CERMAT, procvičování podle témat a pracovní papír na poznámky i rozbor textu.'}),unfinished:unfinishedMarkup(),title:'Testy z českého jazyka',
    library:`<div class="mix-feature">${UI.mix({meta:'Poskládej si test z různých ročníků.',actions:button('Nastavit mix','practice','mix','p')+button('10','mix-preset','10','', 'aria-label="Nastavit mix 10 úloh"')+button('30','mix-preset','30','', 'aria-label="Nastavit mix 30 úloh"')})}</div><section class="exam-index" aria-labelledby="official-exams-title"><div class="exam-index-heading"><h3 id="official-exams-title">Oficiální termíny</h3><span>${data.exams.length} termínů</span></div><div class="year-grid" id="year-grid">${renderYears()}</div></section><details class="archive-notes"><summary>O zadáních a dostupnosti termínů</summary><p>${archiveNote}</p><p>Zdroj zadání a klíčů je Centrum pro zjišťování výsledků vzdělávání. <a href="${html(data.source)}" target="_blank" rel="noopener">Oficiální archiv CERMAT</a></p></details>`,
    fact:factMarkup(),portrait:`<figure class="comenius"><img src="./assets/josef-jungmann.jpg" width="600" height="800" alt="Portrét Josefa Jungmanna od Antonína Machka z roku 1833"><figcaption><strong>Josef Jungmann</strong><span>1773–1847</span><a href="${portraitUrl}" target="_blank" rel="noopener">Antonín Machek, 1833 · zdroj snímku</a></figcaption></figure>`,progress:overview(),topics:topicHome(),
    notice:`<p class="cz-notice" id="global-notice" role="status">${html(message)}</p>`,footer:`<span>Cermat testy · Český jazyk pro 9. třídu</span><div class="row">${button('Offline archiv','settings','offline','text-button')}${button('Záloha postupu','settings','backup','text-button')}</div>`});
}
function practicePool(category, tags) {
  return data.questions.filter(q=>q.keyVerified && q.text && (!category||q.category===category) && (!tags.size||q.topics.some(tag=>tags.has(tag))));
}
function practiceView() {
  if(topicOverview)return UI.heading({title:'Procvičování podle témat',back:button('← Zpět na testy','home','','text-button')})+'<p class="practice-lead">Vyber oblast a sestav si vlastní sadu úloh. Každý pokus má své odpovědi, pracovní papír a výsledky.</p><div class="topic-grid">'+topicCards()+'</div>'+button('Sestavit test z více oblastí','practice','all','text-button');
  const cat = topics.find(c=>c.id===selectedCategory);
  const selected = cat?[cat]:topics;
  const stats = topicStats(selectedCategory);
  const sessions = listAttempts('submitted').filter(a=>a.kind!=='official' && (!cat||a.practice?.category===cat.id)).slice(0,6);
  return `${UI.heading({title:cat?.name||(practiceMode==='mix'?'Náhodný mix':'Sestav si procvičování'),back:cat?button('← Všechna témata','practice','topics','text-button'):button('← Zpět na testy','home','','text-button')})}
    <p class="practice-lead">${cat?.description||'Vyber si podtémata a počet úloh z oficiálních zadání.'}</p>
    <div class="practice-layout"><form class="practice-config" id="practice-form"><h2>Sestav si procvičování</h2>
    <fieldset class="subtopic-picker"><legend>Co chceš procvičit?</legend><p>Bez výběru zahrneme všechna ${cat?'podtémata v této oblasti':'témata'}.</p>
      ${selected.map(c=>`${cat?'':`<details class="topic-filter"><summary>${c.name}</summary>`}<div class="subtopic-options">${c.topics.map(([id,name])=>{
        const n=practicePool(c.id,new Set([id])).length;
        return `<label><input type="checkbox" name="topic-tag" value="${id}" ${practiceTags.has(id)?'checked':''} ${n?'':'disabled'}><span>${name}</span><small>${n}</small></label>`;
      }).join('')}</div>${cat?'':'</details>'}`).join('')}
    </fieldset><fieldset class="practice-count"><legend>Kolik úloh?</legend><div class="count-presets">${[5,10,20,30].map(n=>button(String(n),'count',n,'',`aria-pressed="${n===practiceCount}"`)).join('')}<label>Vlastní počet<input id="practice-count" type="number" min="1" max="${data.questions.length}" step="1" inputmode="numeric" value="${practiceCount}" required></label></div></fieldset>
    <div class="practice-availability" id="practice-availability" aria-live="polite"></div><button class="p practice-generate" type="submit" id="practice-generate">Vygenerovat a začít</button>
    <p class="practice-caption">Vygenerovaný test se uloží, i když ho nedokončíš.</p><p class="cz-notice" id="global-notice" role="status">${html(message)}</p></form>
    <section class="topic-progress"><div class="sech"><h2>Výsledky procvičování</h2></div><div class="practice-metrics"><div><strong>${sessions.length}</strong><span>Poslední pokusy</span></div><div><strong>${stats.rows.length}</strong><span>Vyhodnocené úlohy v oblasti</span></div><div><strong>${stats.pct===null?'—':stats.pct+' %'}</strong><span>Úspěšnost v oblasti</span></div></div>
      ${sessions.length?`<div class="practice-session-list">${sessions.map(historyRow).join('')}</div>`:'<p class="mut topic-archive-note">Výsledky se tu objeví po odevzdání testu.</p>'}
      <p class="topic-archive-note">Počty odpovídají dostupným úlohám v archivu. Podtémata jsou pomocná a při nulovém počtu zůstávají nedostupná.</p></section></div>`;
}
function updatePractice() {
  practiceCount = Number(document.getElementById('practice-count').value);
  practiceTags = new Set([...app.querySelectorAll('input[name="topic-tag"]:checked')].map(i=>i.value));
  const pool = practicePool(selectedCategory,practiceTags);
  const valid = Number.isInteger(practiceCount) && practiceCount>=1 && practiceCount<=data.questions.length;
  const size = Math.min(practiceCount,pool.length);
  const text = !pool.length?'Pro tento výběr nejsou dostupné ověřené úlohy.':!valid?'Zadej kladný celý počet úloh.':`Test bude mít ${size} ${plural(size,'úlohu','úlohy','úloh')}.`;
  document.getElementById('practice-availability').innerHTML = `<strong>${countTasks(pool.length)} k dispozici</strong><span>${text}</span>`;
  document.getElementById('practice-generate').disabled = !valid || !pool.length;
  app.querySelectorAll('[data-action="count"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.value)===practiceCount)));
}
function historyRow(a) {
  const r = a.result;
  return `<article class="history-row"><div><h2>${html(a.title)}</h2><span>${formatDate(a.updatedAt)} · ${countTasks(a.questionIds.length)}${r?.pendingCount?' · čeká na kontrolu':''}</span></div><strong>${r?.final?r.pct+' %':(r?.points??0)+' b.'}</strong>${button('Otevřít řešení','result',a.id)}</article>`;
}
function historyView() {
  const records = listAttempts('submitted');
  return `<header class="sethd">${button('Zpět na testy','home')}<h1>Rozepsané a historie</h1></header>${unfinishedMarkup(true)}<div class="sech"><h2>Odevzdané pokusy</h2><span>${records.length}</span></div>
  ${records.length?`<div class="history-list">${records.map(historyRow).join('')}</div>`:'<p class="mut">Výsledky, chyby a poznámky najdeš po odevzdání testu tady.</p>'}`;
}
function settingsView() {
  return `<header class="sethd">${button('Zpět na testy','home')}<h1>Nastavení</h1></header>
    ${offlinePanel()}
    <section class="card complete-backup" id="backup"><h2>Záloha a přenos dat</h2><p class="mut">Záloha obsahuje odpovědi, výsledky i poznámky. Můžeš ji přenést do jiného prohlížeče nebo do aplikace na ploše iPhonu.</p>
    <div class="row">${button('Stáhnout zálohu','export','','p')}<label class="backup-file-label">Načíst zálohu<input type="file" id="backup-file" accept="application/json,.json"></label></div><p class="cz-notice" id="global-notice" role="status">${html(message)}</p></section>
    <section class="card"><h2>Zdroje</h2><p class="mut"><a href="${data.source}" target="_blank" rel="noopener">Archiv zkoušek CERMAT</a> · <a href="./IMPORT_REPORT.json">Přehled importu</a> · <a href="./README.md">Návod k nasazení</a></p>
    <p class="mut">Portrét Josefa Jungmanna namaloval Antonín Machek v roce 1833. Snímek od <a href="${portraitUrl}" target="_blank" rel="noopener">Ablakok / Wikimedia Commons</a> je použit ve zmenšené velikosti podle licence <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</p></section>`;
}

function toolbar(exam, length) {
  const undoButtons = `${button('Zpět','undo','','','title="Vrátit tah" disabled')}${button('Znovu','redo','','','title="Zopakovat tah" disabled')}`;
  const zoomButtons = `<div class="zoom-controls">${button('−','zoom','-25','','aria-label="Zmenšit"')}${button(zoom+' %','zoom','100','','id="paper-zoom" aria-label="Přizpůsobit šířce"')}${button('+','zoom','25','','aria-label="Zvětšit"')}</div>`;
  const jump = exam ? `<label class="jump-label"><span>Přejít na stranu</span><select id="paper-jump">${exam.pageSizes.map((_,i)=>`<option value="${i+1}">Strana ${i+1}</option>`).join('')}</select></label>` :
    `<label class="jump-label"><span>Přejít na úlohu</span><select id="practice-jump">${Array.from({length},(_,i)=>`<option value="${i}" ${attempt.currentIndex===i?'selected':''}>${i+1}. úloha</option>`).join('')}</select></label>`;
  if (readOnlyPaper) return `<div class="workspace-tools"><div class="tool-primary">${zoomButtons}${jump}</div></div>`;
  return `<div class="workspace-tools"><div class="tool-primary">
    <label><span>Nástroj poznámek</span><select id="ink-tool">${Object.entries(toolLabels).map(([id,label])=>`<option value="${id}" ${tool.tool===id?'selected':''}>${label}</option>`).join('')}</select></label>
    <div class="tool-actions">${undoButtons}</div>${zoomButtons}${jump}</div>
    <details class="instrument-options"><summary>Barva a tloušťka</summary><div class="instrument-fields"><label>Barva<input type="color" id="ink-color" value="${tool.color}"></label><label>Tloušťka<input type="range" id="ink-width" min="1" max="8" step=".5" value="${tool.width}"></label></div></details>
    <div class="instrument-hint" id="tool-hint">${toolHint()}</div></div>`;
}
function toolHint() {
  if (tool.tool==='move') return 'Posouvej stránku. Pro psaní a zvýraznění vyber nástroj.';
  if (['text','grammar'].includes(tool.tool)) return 'Klepni do zadání a vlož poznámku.';
  if (tool.tool==='eraser') return 'Klepni na poznámku nebo čáru, kterou chceš smazat.';
  return 'Tahem myší, prstem nebo Apple Pencil označ místo v zadání.';
}
function pageMarkup(exam, pageNumber, key, pageQuestions, label) {
  const [width,height] = exam.pageSizes[pageNumber-1];
  return `<section class="exam-page cz-page" id="paper-page-${pageNumber}"><div class="exam-page-heading"><h2>${html(label||'Strana '+pageNumber)}</h2>${pdfLink(exam.files.paper.path,'Originál PDF',pageNumber)}</div>
    <div class="paper-surface pdf-sheet" data-pdf-page="${pageNumber}" data-exam="${exam.id}" data-paper-key="${key}" style="aspect-ratio:${width}/${height}">
      <span class="pdf-status" role="status">Načítám stránku…</span><canvas role="img"></canvas><svg class="study-paper-svg" aria-label="Vrstva poznámek" xmlns="http://www.w3.org/2000/svg"></svg>
    </div><details class="pdf-transcript"><summary>Text stránky</summary><div class="pdf-transcript-text"></div></details>
    ${pageQuestions.length&&!readOnlyPaper?`<div class="final-answers cz-answer-stack"><h3>Odpovědi k úlohám</h3>${pageQuestions.map(q=>answerForm(q,attempt.answers[q.id])).join('')}</div>`:''}</section>`;
}
function workspace() {
  const questions = attempt.questionIds.map(id=>questionMap.get(id));
  const exam = attempt.examId ? examMap.get(attempt.examId) : null;
  const activeQuestion = questions[attempt.currentIndex] || questions[0];
  const activeExam = exam || examMap.get(activeQuestion.examId);
  const numbers = exam ? exam.pageSizes.map((_,i)=>i+1) : [...new Set([...activeQuestion.contextPages,...activeQuestion.pages])].sort((a,b)=>a-b);
  const title = html(attempt.title);
  const source = exam ? `${exam.year} · cvičný limit ${exam.durationMinutes} min · ${exam.maxPoints} b.` : `${activeExam.year} · ${html(activeExam.title)} · původní úloha ${activeQuestion.no}`;
  const pageParts = numbers.map(p => {
    const qs = exam ? questions.filter(q=>q.pages.at(-1)===p) : p===numbers.at(-1)?[activeQuestion]:[];
    return pageMarkup(activeExam,p,(exam ? exam.id : activeQuestion.id)+':p'+p,qs,exam?'Strana '+p:'Původní strana '+p);
  }).join('');
  return `<header class="workspace-top">
    ${button(readOnlyPaper?'Výsledek':'Uložit a odejít',readOnlyPaper?'result':'leave',attempt.id)}
    <div class="workspace-title"><strong>${title}</strong><span id="save-status" aria-live="polite">${readOnlyPaper?'Uložené poznámky':'Uloženo v zařízení'}</span></div>
    ${!readOnlyPaper?`<span id="timer" aria-label="Čas testu">00:00</span>${button('Odevzdat','finish','','p')}</header>`:'</header>'}
    ${toolbar(exam,questions.length)}
    <div class="workspace-introduction"><span>${source}</span><span id="answered-count">${answered(attempt)} / ${questions.length} zodpovězeno</span></div>
    ${exam?`<details class="question-index"><summary>Přejít na úlohu</summary><div class="cz-question-nav">${questions.map(q=>button(String(q.no),'jump-question',q.id,isAnswered(q,attempt.answers[q.id])?'answered':'',`aria-label="Úloha ${q.no}"`)).join('')}</div></details>`:`
      <div class="cz-practice-header"><div><h1>Úloha ${attempt.currentIndex+1} z ${questions.length}</h1><p class="mut">Na původní stránce vyřeš úlohu ${activeQuestion.no}.</p></div><div class="row">
      ${button('Předchozí','step','-1','',attempt.currentIndex===0?'disabled':'')}${button('Další','step','1','',attempt.currentIndex===questions.length-1?'disabled':'')}</div></div>`}
    <div class="cz-paper-scroll"><div class="cz-paper-inner"><div class="exam-paper-stack">${pageParts}</div></div></div>
    <div class="workspace-bottom">${button(readOnlyPaper?'Zpět na výsledek':'Uložit a odejít',readOnlyPaper?'result':'leave',attempt.id)}
    ${!exam&&!readOnlyPaper&&attempt.currentIndex<questions.length-1?button('Další úloha','step','1','p'):''}
    ${!readOnlyPaper?button('Odevzdat test','finish','','p'):''}</div>`;
}
function setupPaper() {
  paper = new PaperRenderer();
  const top = app.querySelector('.workspace-top');
  app.style.setProperty('--cz-toolbar-top',top.getBoundingClientRect().height+'px');
  app.querySelectorAll('.pdf-sheet').forEach(element => {
    const exam = examMap.get(element.dataset.exam);
    const page = Number(element.dataset.pdfPage);
    const key = element.dataset.paperKey;
    const [w,h] = exam.pageSizes[page-1];
    const state = attempt.papers[key] || {objects:[],undo:[],redo:[]};
    paper.mount(element,exam.files.paper.path,page,w,h,key,{
      state,readOnly:readOnlyPaper,
      getTool:()=>tool.tool==='grammar'?{...tool,tool:'text'}:tool,
      onSelect:id=>{selectedPage=id;refreshUndo();},
      onChange:()=>{attempt.papers[key]=state;selectedPage=key;queueSave();refreshUndo();},
      onText:(_point,callback)=>openNote(callback)
    });
  });
  updateZoom();
  refreshUndo();
  updateTimer();
}

function resultView() {
  const result = attempt.result;
  const exam = examMap.get(attempt.examId);
  const rows = result.rows.filter(row=>reviewFilter==='all'||(reviewFilter==='mistakes'&&!row.correct&&!row.pending)||(reviewFilter==='pending'&&row.pending));
  return `<header class="result-heading"><div class="row">${button('Zpět na testy','home')}${button('Historie','history')}</div><h1>${html(attempt.title)}</h1></header>
    <section class="card result-score"><div class="big" id="score-points">${result.points} / ${result.max}</div><div><strong>${result.final?result.pct+' % úspěšnost':'Dosud přidělené body'}</strong><p class="mut">${result.pendingCount?`K ruční kontrole · ${countTasks(result.pendingCount)} · max. ${result.pendingMax} b.`:`Čas ${clock(attempt.elapsedMs)} · ${answered(attempt)} / ${result.rows.length} zodpovězeno.`}</p></div></section>
    ${exam?`<div class="inline-key-links">${pdfLink(exam.files.paper.path,'Oficiální zadání PDF')}${pdfLink(exam.files.key.path,'Oficiální klíč PDF')}${exam.files.guide?.path?pdfLink(exam.files.guide.path,'Komentované řešení PDF'):''}</div>`:''}
    <div class="row result-summary-actions">${button('Uložený pracovní papír','saved-paper')}${button('Procvičit chyby','retry-mistakes','','',result.rows.some(r=>!r.correct&&!r.pending)?'':'disabled')}</div>
    <div class="review-heading"><h2>Kontrola odpovědí</h2><span>${rows.length} / ${result.rows.length}</span></div>
    <div class="row result-summary-actions">${[['all','Všechny'],['mistakes','Chyby'],['pending','K ruční kontrole']].map(([id,label])=>button(label,'filter',id,'',`aria-pressed="${id===reviewFilter}"`)).join('')}</div>
    ${rows.length?rows.map(resultRow).join(''):'<p class="mut">V tomto výběru nejsou žádné úlohy.</p>'}`;
}
function resultRow(row) {
  const q = questionMap.get(row.id);
  const exam = examMap.get(q.examId);
  const answer = attempt.answers[q.id] || {};
  const your = q.parts.length?q.parts.map(p=>`${p.no} · ${answer[p.no]||'—'}`).join('\n'):answer.value||'—';
  const expected = q.parts.length ? q.parts.map(p=>`${p.no} · ${p.officialAnswer}`).join('\n') : q.officialAnswer;
  const hasWrittenAnswer = Object.values(answer).some(value=>String(value).trim());
  const state = row.pending?'Ke kontrole':row.correct?'Správně':row.answered?'Zkontroluj řešení':'Nevyplněno';
  const points = row.pending?'— / '+row.max:row.points+' / '+row.max;
  return `<article class="card answer-review" id="review-${q.id}"><div class="review-heading"><h2>Úloha ${q.no}${attempt.examId?'':' · '+exam.year}</h2><span class="${row.correct?'ok':row.pending?'':'bad'}">${state} · ${points} b.</span></div>
    <p class="review-question">${html(q.prompt.replace(/\s+/g,' ').slice(0,380))}</p>
    <div class="review-answer-grid"><div><span class="mut">Tvoje odpověď</span><pre class="key-text">${html(your)}</pre></div><div><span class="mut">Oficiální klíč</span><pre class="key-text">${html(expected||'Viz klíč PDF.')}</pre></div></div>
    <div class="inline-key-links">${pdfLink(exam.files.paper.path,'Zadání',q.anchor.page)}${pdfLink(exam.files.key.path,'Klíč a bodování',q.keyPage)}</div>
    ${row.open?`<details class="result-source"><summary>Pravidla bodování</summary><pre class="key-text">${html(q.rubric || 'Podrobnosti jsou v klíči správných řešení.')}</pre></details>
      ${hasWrittenAnswer?`<div class="manual-review"><label for="manual-${q.id}">Body podle klíče</label><select id="manual-${q.id}" data-manual="${q.id}"><option value="">${row.pending?'Vyber body':'Bez ručního hodnocení'}</option>${Array.from({length:q.points+1},(_,i)=>`<option value="${i}" ${attempt.manualScores?.[q.id]===i?'selected':''}>${i} / ${q.points}</option>`).join('')}</select></div>`:''}`:''}
    </article>`;
}

let message = '';
function notice(text) {
  message = text;
  const field = document.getElementById('global-notice');
  if (field) field.textContent = text;
}
function render({keepScroll=false}={}) {
  const scroll = window.scrollY;
  paper?.close();
  paper = null;
  app.className = view==='home'?'homev':view==='practice'?'practice-view':view==='exam'?'paperview cz-workspace':view==='history'?'history-view':'';
  app.innerHTML = view==='home'?home():view==='practice'?practiceView():view==='exam'?workspace():view==='result'?resultView():view==='settings'?settingsView():historyView();
  if (view==='exam') setupPaper();
  if (view==='practice'&&document.getElementById('practice-count')) updatePractice();
  if (view==='settings') dispatchEvent(new Event('cermat:offline-panel'));
  window.scrollTo(0,keepScroll?scroll:0);
}
function openModal(title, body, confirmLabel, callback) {
  dialog.innerHTML = `<form method="dialog"><h2>${html(title)}</h2>${body}<div class="row"><button value="cancel">Zrušit</button><button class="p" value="ok">${html(confirmLabel)}</button></div></form>`;
  dialog.returnValue = '';
  dialog.addEventListener('close',()=>{if(dialog.returnValue==='ok')callback();},{once:true});
  dialog.showModal();
}
function openNote(callback) {
  const grammar = tool.tool==='grammar';
  openModal(grammar?'Označení větného členu':'Poznámka do zadání',`<label for="ink-text">Text poznámky</label><textarea id="ink-text" maxlength="180" rows="3" autofocus></textarea>
  ${grammar?`<div class="dialog-presets">${['Podmět','Přísudek','Předmět','Přívlastek','Příslovečné určení','Věta vedlejší'].map(label=>button(label,'note-preset',label)).join('')}</div>`:''}`,
  'Vložit',()=>callback(document.getElementById('ink-text').value));
}
function activeLayer() {
  return paper?.layers.get(selectedPage) || [...(paper?.layers.values()||[])].reverse().find(layer=>layer.state.objects.length||layer.state.redo.length);
}
function refreshUndo() {
  const layer = activeLayer();
  const undo = app.querySelector('[data-action="undo"]'), redo = app.querySelector('[data-action="redo"]');
  if (undo) undo.disabled = !layer?.state.undo.length;
  if (redo) redo.disabled = !layer?.state.redo.length;
}
function updateZoom() {
  const inner = app.querySelector('.cz-paper-inner');
  if (!inner) return;
  inner.classList.toggle('zoomed',zoom>100);
  inner.style.width = zoom>100 ? zoom+'%' : '100%';
  app.querySelector('#paper-zoom').textContent = zoom+' %';
}
function updateTimer() {
  const el = document.getElementById('timer');
  if (!el||!attempt) return;
  const elapsed = attempt.elapsedMs + (startedAt===null?0:Date.now()-startedAt);
  const exam = examMap.get(attempt.examId);
  const remaining = exam ? exam.durationMinutes*60000-elapsed : elapsed;
  el.textContent = clock(remaining);
  el.title = exam ? (remaining<=0?'Čas vypršel':'Zbývající čas') : 'Uplynulý čas';
}
function pauseClock() {
  if (attempt&&startedAt!==null) attempt.elapsedMs += Date.now()-startedAt;
  startedAt = null;
}
function saveNow() {
  clearTimeout(saveTimer);
  if (!attempt) return Promise.resolve();
  attempt.updatedAt = Date.now();
  const snapshot = structuredClone(attempt);
  attempts.set(attempt.id,attempt);
  const journalSaved = journal(snapshot);
  const update = (text, bad=false) => {
    const el=document.getElementById('save-status');
    if (el&&!readOnlyPaper&&attempt?.id===snapshot.id) {
      el.textContent=text;
      el.classList.toggle('save-error',bad);
      return el;
    }
  };
  update('Ukládám…');
  saveChain=saveChain.catch(()=>{}).then(()=>putAttempt(snapshot)).then(()=>{
    const status=update('Uloženo v zařízení');
    window.CermatMotion?.saved?.(status);
  }).catch(()=>{
    update(journalSaved?'Uloženo do obnovy · vytvoř zálohu':'Ukládání selhalo · vytvoř zálohu',true);
  });
  return saveChain;
}
function queueSave() {
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>saveNow(),180);
}
async function enter(record,resuming=false) {
  message='';
  attempt=record;
  view='exam';
  zoom=100;
  selectedPage=null;
  readOnlyPaper=false;
  tool={...tool,tool:'move'};
  startedAt=window.CermatSubjectBridge?.active===false?null:Date.now();
  await saveNow();
  render();
  if(resuming)window.CermatMotion?.resumed?.();
}
async function leave() {
  pauseClock();
  await saveNow();
  view='home';
  readOnlyPaper=false;
  render();
}
function switchView(next) {
  view=next;
  message='';
  readOnlyPaper=false;
  render();
}
async function submit() {
  pauseClock();
  attempt.result=scoreAttempt(attempt,questionMap);
  attempt.status='submitted';
  await saveNow();
  reviewFilter='all';
  view='result';
  render();
}
async function saveManual(id,value) {
  if (value==='') delete attempt.manualScores[id];
  else attempt.manualScores[id]=Number(value);
  attempt.result=scoreAttempt(attempt,questionMap);
  await saveNow();
  render({keepScroll:true});
}
function updateAnswer(element) {
  if (!attempt||readOnlyPaper||view!=='exam') return;
  const id=element.dataset.answer;
  attempt.answers[id] ||= {};
  attempt.answers[id][element.dataset.part]=element.value;
  refreshAnswerCount();
  queueSave();
}
function refreshAnswerCount() {
  document.getElementById('answered-count').textContent=answered(attempt)+' / '+attempt.questionIds.length+' zodpovězeno';
  app.querySelectorAll('[data-action="jump-question"]').forEach(b=>b.classList.toggle('answered',isAnswered(questionMap.get(b.dataset.value),attempt.answers[b.dataset.value])));
}
function resetAnswer(id) {
  delete attempt.answers[id];
  const section=document.getElementById('task-'+id);
  section?.querySelectorAll('input,select,textarea').forEach(element=>{
    if(element.type==='radio')element.checked=false;
    else element.value='';
  });
  refreshAnswerCount();
  queueSave();
}
function changePracticeIndex(index) {
  attempt.currentIndex=Math.min(attempt.questionIds.length-1,Math.max(0,index));
  queueSave();
  render();
}
function backupDownload() {
  const records=[...attempts.values()].map(record=>({
    ...record, papers:Object.fromEntries(Object.entries(record.papers).map(([key,page])=>[key,{objects:page.objects}]))
  }));
  const payload=JSON.stringify({schemaVersion:SCHEMA,subject:'cz',exportedAt:new Date().toISOString(),attempts:records},null,2);
  const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url;
  link.download='CERMAT_Cestina_zaloha.json';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function importBackup(file) {
  if (!file) return;
  if (file.size>30*1024*1024) throw new Error('Záloha je větší než 30 MB.');
  let parsed;
  try { parsed=JSON.parse(await file.text()); }
  catch { throw new Error('Soubor zálohy není platný JSON.'); }
  const records=validateBackup(parsed,questionMap);
  let count=0;
  for (const record of records) {
    if ((attempts.get(record.id)?.updatedAt??0)>=record.updatedAt) continue;
    record.manualScores ||= {};
    if (record.status==='submitted')record.result=scoreAttempt(record,questionMap);
    await putAttempt(record);
    attempts.set(record.id,record);
    count++;
  }
  notice(`Načteno ${count} ${plural(count,'pokus','pokusy','pokusů')}.`);
}

async function action(event) {
  const target=event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  event.preventDefault();
  const { action:name, value }=target.dataset;
  if (name==='note-preset') {document.getElementById('ink-text').value=value;return;}
  if (name==='home') switchView('home');
  else if (name==='menu') {
    const opened=target.getAttribute('aria-expanded')==='true';
    target.setAttribute('aria-expanded',String(!opened));
    target.closest('.topnav').classList.toggle('menu-open',!opened);
  } else if (name==='scroll') document.getElementById(value)?.scrollIntoView({behavior:window.CermatMotion?.scrollBehavior || 'auto'});
  else if (name==='search') {
    searchOpen=!searchOpen;
    app.querySelector('.sbar').hidden=!searchOpen;
    if(searchOpen)document.getElementById('test-search').focus();
    else {query='';document.getElementById('test-search').value='';document.getElementById('year-grid').innerHTML=renderYears();}
  } else if(name==='fact'){
    nextFact();
    document.getElementById('daily-fact').outerHTML=factMarkup();
    app.querySelector('[data-action="fact"]').focus({preventScroll:true});
  } else if(name==='history')switchView('history');
  else if(name==='settings'){switchView('settings');if(value)document.getElementById(value)?.scrollIntoView();}
  else if(name==='mix-preset'){practiceCount=Number(value);topicOverview=false;selectedCategory='';practiceTags.clear();practiceMode='mix';switchView('practice');}
  else if(name==='practice'){
    topicOverview=value==='topics';
    selectedCategory=topics.some(c=>c.id===value)?value:'';
    practiceTags.clear();
    practiceMode=value==='mix'?'mix':'topics';
    switchView('practice');
  } else if(name==='count'){
    document.getElementById('practice-count').value=value;
    updatePractice();
  } else if(name==='start'){
    const exam=examMap.get(value);
    if(!exam?.complete)return;
    const name='Český jazyk – '+exam.year+' · '+exam.title;
    await enter(newAttempt('official',name,exam.questionIds.map(id=>questionMap.get(id)),exam.id));
  } else if(name==='resume'){
    const record=attempts.get(value);
    if(record?.status==='active')await enter(record,true);
  } else if(name==='leave')await leave();
  else if(name==='finish'){
    const blank=attempt.questionIds.length-answered(attempt);
    openModal('Odevzdat test?',`<p>${blank?`Některé úlohy ještě nemají úplnou odpověď (${blank}).`:'Zkontrolujeme odpovědi podle oficiálního klíče.'}</p>`,'Odevzdat',()=>submit().catch(e=>notice(e.message)));
  } else if(name==='clear-answer')resetAnswer(value);
  else if(name==='zoom'){
    zoom=value==='100'?100:Math.min(225,Math.max(100,zoom+Number(value)));
    updateZoom();
  } else if(name==='step')changePracticeIndex(attempt.currentIndex+Number(value));
  else if(name==='undo'||name==='redo'){activeLayer()?.[name]();refreshUndo();}
  else if(name==='jump-question'){
    const q=questionMap.get(value);
    const page=document.getElementById('paper-page-'+q.anchor.page);
    page?.scrollIntoView({behavior:window.CermatMotion?.scrollBehavior || 'auto'});
  } else if(name==='result'){
    const record=attempts.get(value);
    if(record?.result){attempt=record;reviewFilter='all';switchView('result');if(resultScroll){window.scrollTo(0,resultScroll);resultScroll=0;}}
  } else if(name==='filter'){reviewFilter=value;render({keepScroll:true});}
  else if(name==='saved-paper'){resultScroll=window.scrollY;readOnlyPaper=true;zoom=100;view='exam';render();}
  else if(name==='retry-mistakes'){
    const questions=attempt.result.rows.filter(r=>!r.pending&&!r.correct).map(r=>questionMap.get(r.id));
    if(questions.length)await enter(newAttempt('practice','Oprava chyb',questions));
  } else if(name==='export')backupDownload();
  else if(name==='cache-archive')await cacheArchive();
}

app.addEventListener('click',event=>action(event).catch(error=>notice(error.message)));
dialog.addEventListener('click',event=>action(event).catch(error=>notice(error.message)));
app.addEventListener('toggle',event=>{
  const year=Number(event.target.dataset.year);
  if(!year)return;
  if(event.target.open)openedYears.add(year);else openedYears.delete(year);
},true);
app.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='test-search'){query=el.value;document.getElementById('year-grid').innerHTML=renderYears();}
  if(el.id==='practice-count'||el.name==='topic-tag')updatePractice();
  if(el.dataset.answer && el.type!=='radio' && el.tagName!=='SELECT')updateAnswer(el);
  if(el.id==='ink-color')tool.color=el.value;
  if(el.id==='ink-width')tool.width=Number(el.value);
});
app.addEventListener('change',event=>{
  const el=event.target;
  if(el.dataset.answer && (el.type==='radio'||el.tagName==='SELECT'))updateAnswer(el);
  if(el.id==='ink-tool'){
    tool.tool=el.value;
    paper?.layers.forEach(layer=>layer.toolChanged());
    document.getElementById('tool-hint').textContent=toolHint();
  }
  if(el.id==='paper-jump')document.getElementById('paper-page-'+el.value)?.scrollIntoView({behavior:window.CermatMotion?.scrollBehavior || 'auto'});
  if(el.id==='practice-jump')changePracticeIndex(Number(el.value));
  if(el.dataset.manual)saveManual(el.dataset.manual,el.value).catch(error=>notice(error.message));
  if(el.id==='backup-file')importBackup(el.files[0]).catch(error=>notice(error.message));
});
app.addEventListener('submit',async event=>{
  if(event.target.id!=='practice-form')return;
  event.preventDefault();
  updatePractice();
  const pool=practicePool(selectedCategory,practiceTags);
  if(!pool.length||!Number.isInteger(practiceCount)||practiceCount<1)return;
  const title=topics.find(c=>c.id===selectedCategory)?.name||(practiceMode==='mix'?'Náhodný mix':'Procvičování podle témat');
  const record=newAttempt('practice',title,shuffleUnique(pool,practiceCount));
  record.practice={mode:practiceMode,category:selectedCategory,tags:[...practiceTags]};
  try {await enter(record);} catch (error) {notice(error.message);}
});
document.addEventListener('keydown',event=>{
  if(view!=='exam'||readOnlyPaper||event.target.matches('input,textarea,select')||dialog.open)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
    event.preventDefault();
    activeLayer()?.[event.shiftKey?'redo':'undo']();
    refreshUndo();
  }
});
document.addEventListener('visibilitychange',()=>{
  if(view!=='exam'||readOnlyPaper)return;
  if(document.hidden){pauseClock();saveNow();}
  else if(startedAt===null&&window.CermatSubjectBridge?.active!==false)startedAt=Date.now();
});
addEventListener('cermat:subject-visibility',event=>{
  if(view!=='exam'||readOnlyPaper)return;
  if(event.detail.active){if(startedAt===null&&!document.hidden)startedAt=Date.now();}
  else {pauseClock();updateTimer();saveNow();}
});
addEventListener('pagehide',()=>{if(view==='exam'&&!readOnlyPaper){pauseClock();saveNow();}});
addEventListener('pageshow',()=>{if(view==='exam'&&!readOnlyPaper&&startedAt===null&&window.CermatSubjectBridge?.active!==false)startedAt=Date.now();});
addEventListener('resize',()=>{
  const top=app.querySelector('.workspace-top');
  if(top)app.style.setProperty('--cz-toolbar-top',top.getBoundingClientRect().height+'px');
});
setInterval(updateTimer,1000);
boot().catch(error=>{
  app.innerHTML=`<section class="startup"><h1>CERMAT Čeština</h1><p>Aplikaci se nepodařilo načíst.</p><p class="mut">${html(error.message)}</p><button type="button" id="reload-app">Zkusit znovu</button></section>`;
  document.getElementById('reload-app').onclick=()=>location.reload();
});
