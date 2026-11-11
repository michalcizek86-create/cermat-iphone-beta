/* Topic practice is a sidecar index. It never writes to the question bank. */
(function(root){
  'use strict';
  const CATEGORIES=[
    {id:'numbers',name:'Čísla a počítání',symbol:'½',intro:'Od zlomků k procentům. Získej jistotu v každém výpočtu.',topics:[['integers','Celá a racionální čísla'],['fractions','Zlomky'],['powers','Mocniny a odmocniny'],['percent','Procenta'],['ratio','Poměry'],['proportionality','Přímá a nepřímá úměrnost']]},
    {id:'algebra',name:'Algebraické výrazy a rovnice',symbol:'x²',intro:'Upravuj výrazy, hledej neznámé a převáděj zadání do rovnic.',topics:[['expressions','Úpravy algebraických výrazů'],['identities','Algebraické vzorce'],['equations','Lineární rovnice a nerovnice'],['systems','Soustavy rovnic'],['equation-word','Slovní úlohy řešené rovnicemi']]},
    {id:'geometry',name:'Geometrie v rovině a prostoru',symbol:'△',intro:'Uvažuj v souvislostech. Počítej, měř a rýsuj přímo do zadání.',topics:[['angles','Úhly'],['triangles','Trojúhelníky'],['pythagoras','Pythagorova věta'],['similarity','Shodnost a podobnost'],['quadrilaterals','Čtyřúhelníky'],['circles','Kruh a kružnice'],['area','Obvody a obsahy'],['volume','Povrchy a objemy těles'],['symmetry','Osová a středová souměrnost'],['constructions','Geometrické konstrukce']]},
    {id:'functions',name:'Funkce, závislosti a logika',symbol:'n + 1',intro:'Čti grafy, objevuj pravidla a rozplétej slovní i logické úlohy.',topics:[['graphs','Grafy'],['tables','Tabulky'],['relationships','Závislosti mezi veličinami'],['word-problems','Slovní úlohy'],['logic','Logické úlohy'],['sequences','Posloupnosti']]}
  ];
  const topicCategory=new Map(),labels=new Map();
  for(const c of CATEGORIES){topicCategory.set(c.id,c.id);labels.set(c.id,c.name);for(const [id,label]of c.topics){topicCategory.set(id,c.id);labels.set(id,label);}}
  const clone=x=>JSON.parse(JSON.stringify(x));
  const clean=x=>String(x??'').normalize('NFKC').replace(/[−–]/g,'-').replace(/\s+/g,' ').trim();
  function fingerprint(q){
    const text=JSON.stringify([q.type,clean(q.text),(q.options||[]).map(clean),(q.stmts||[]).map(s=>[clean(s.t),s.a]),clean(q.correct),q.points??null,clean(q.svg),clean(q.sol)]);
    let a=2166136261,b=2246822507;for(let i=0;i<text.length;i++){const n=text.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,3266489909);}
    return(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')+'-'+text.length;
  }
  const sourceKey=q=>q.source?.testCode&&q.source?.taskNumber?q.source.testCode+':'+q.source.taskNumber:'';
  const refKey=r=>r.examId+'\u001f'+r.questionId;
  const validTags=tags=>[...new Set((Array.isArray(tags)?tags:[]).filter(t=>topicCategory.has(t)))];
  const categoriesOf=tags=>[...new Set(tags.map(t=>topicCategory.get(t)).filter(Boolean))];
  const metadataTags={'Zlomky':['fractions'],'Procenta':['percent'],'Poměr':['ratio'],'Poměry':['ratio'],'Mocniny a odmocniny':['powers'],'Rovnice':['equations'],'Výrazy':['expressions'],'Geometrie':['geometry'],'Konstrukce':['constructions'],'Statistika':['functions'],'Jednotky a měřítko':['numbers']};
  class Catalog {
    constructor(curated=[]){this.curated=new Map(curated.filter(x=>x.questionId||x.fingerprint).map(x=>[x.questionId||x.fingerprint,x]));this.overrides={};this.entries=[];this.byRef=new Map();this.byFingerprint=new Map();this.bySource=new Map();}
    refresh(tests){
      this.entries=[];this.byRef.clear();this.byFingerprint.clear();this.bySource.clear();
      for(const exam of tests)for(const question of exam.questions||[]){
        const fp=fingerprint(question),source=sourceKey(question),identity=source||fp,ref={examId:exam.id,questionId:question.id,fingerprint:fp,sourceId:source,examTitle:exam.title};
        const curated=this.curated.get(question.id)||this.curated.get(fp),override=this.overrides[identity];
        const fallback=metadataTags[question.topic],data=override||curated||(fallback?{tags:fallback,review:false,reason:'Původní tematický štítek: '+question.topic}:{tags:[],review:true,reason:'Téma dosud nebylo ověřeno.'});
        const changed=data.fingerprint&&data.fingerprint!==fp;
        const tags=changed?[]:validTags(data.tags),review=changed||data.review===true||(!tags.length&&!data.excluded);
        const entry={key:refKey(ref),identity,ref,exam,question,tags,categories:categoriesOf(tags),review,subtopicReview:!!data.subtopicReview,excluded:!!data.excluded,reason:changed?'Zadání se od posledního tematického zařazení změnilo. Ověř jeho téma znovu.':data.reason||'',origin:override?'manual':curated?'reviewed':'metadata'};
        this.entries.push(entry);this.byRef.set(entry.key,entry);
        if(!this.byFingerprint.has(fp))this.byFingerprint.set(fp,[]);this.byFingerprint.get(fp).push(entry);
        if(source){if(!this.bySource.has(source))this.bySource.set(source,[]);this.bySource.get(source).push(entry);}
      }
      return this;
    }
    resolve(ref){
      const exact=this.byRef.get(refKey(ref));if(exact&&exact.ref.fingerprint===ref.fingerprint)return exact;
      const candidates=this.byFingerprint.get(ref.fingerprint)||[];
      return candidates.find(x=>x.ref.examId===ref.examId)||(ref.sourceId?candidates.find(x=>x.ref.sourceId===ref.sourceId):candidates.find(x=>ref.examTitle&&x.exam.title===ref.examTitle))||null;
    }
    pool(category,subtopics=[]){
      const chosen=validTags(subtopics).filter(t=>topicCategory.get(t)===category),seenSources=new Set(),seenContent=new Set();
      return this.entries.filter(entry=>{
        if(entry.review||entry.excluded||!entry.categories.includes(category)||chosen.length&&!chosen.some(t=>entry.tags.includes(t)))return false;
        if(seenContent.has(entry.ref.fingerprint)||entry.ref.sourceId&&seenSources.has(entry.ref.sourceId))return false;
        seenContent.add(entry.ref.fingerprint);if(entry.ref.sourceId)seenSources.add(entry.ref.sourceId);return true;
      });
    }
  }
  function shuffle(items,random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
  function choose(pool,count,previous=[],random=Math.random){
    if(!Number.isInteger(count)||count<1||count>1000)throw new Error('Počet úloh musí být celé číslo od 1 do 1 000.');
    const shuffled=shuffle(pool,random),selected=shuffled.slice(0,Math.min(count,pool.length));
    const identities=selected.map(e=>e.ref.fingerprint),prior=previous.map(r=>r.fingerprint);
    if(selected.length&&identities.length===prior.length&&identities.every(id=>prior.includes(id))){
      const replacement=shuffled.slice(selected.length).find(e=>!prior.includes(e.ref.fingerprint));
      if(replacement)selected[selected.length-1]=replacement;
      else if(selected.length>1&&identities.every((id,i)=>id===prior[i]))selected.push(selected.shift());
    }
    return selected;
  }
  function createSession(entries,{category,subtopics=[],requested=entries.length,available=entries.length,mode='category',id,now=Date.now()}){
    const c=CATEGORIES.find(c=>c.id===category);if(!c||!entries.length)throw new Error('Pro tento výběr nejsou dostupné ověřené úlohy.');
    const attemptId=id||'topic-'+now.toString(36)+'-'+Math.random().toString(36).slice(2,10),key='topic::'+attemptId;
    const questions=entries.map((entry,i)=>({...clone(entry.ref),slotId:'practice-'+i,tags:entry.tags.filter(t=>topicCategory.get(t)===category)}));
    return{version:1,kind:'topic-practice',key,attemptId,test:{id:key,title:c.name+(mode==='mistakes'?' – oprava chyb':' – procvičování'),minutes:Math.max(10,Math.round(entries.length*1.2)),shuffle:false,temp:true,kind:'topic-practice'},practice:{category,subtopics:validTags(subtopics),requested,available,mode,createdAt:now},questions,answers:{},papers:{},extraPages:[],left:Math.max(10,Math.round(entries.length*1.2))*60,currentQuestion:questions[0].slotId,updatedAt:now,status:'in-progress'};
  }
  function validSession(record){
    if(record.kind!=='topic-practice')return true;
    if(!CATEGORIES.some(c=>c.id===record.practice?.category)||record.test?.temp!==true||record.test.questions||!Array.isArray(record.questions)||!record.questions.length||record.questions.length>1000)return false;
    const slots=new Set(),identities=new Set();
    for(const ref of record.questions){if(!ref||typeof ref.examId!=='string'||typeof ref.questionId!=='string'||typeof ref.fingerprint!=='string'||typeof ref.slotId!=='string'||slots.has(ref.slotId)||identities.has(ref.fingerprint)||ref.text||ref.correct!==undefined)return false;slots.add(ref.slotId);identities.add(ref.fingerprint);}
    if(record.result?.rows?.some(r=>r.q||!slots.has(r.ref)))return false;
    return true;
  }
  function hydrate(record,catalog){
    if(!validSession(record))throw new Error('Uložené procvičování má neplatný formát. Původní záznam zůstal zachován.');
    const questions=record.questions.map((ref,index)=>{const entry=catalog.resolve(ref);if(!entry)throw new Error('Původní úloha '+ref.questionId+' není v dostupné databázi. Obnov ji ze zálohy; rozepsaná práce zůstala zachována.');return{...clone(entry.question),id:ref.slotId,practiceIndex:index+1,practiceSource:entry.exam.title};});
    const bySlot=new Map(questions.map(q=>[q.id,q]));
    return{test:{...clone(record.test),questions},questions,result:record.result?{...clone(record.result),rows:record.result.rows.map(row=>{const q=bySlot.get(row.ref);if(!q)throw new Error('Výsledek odkazuje na nedostupnou úlohu.');return{...clone(row),q};})}:null};
  }
  function packResult(result){return{...clone({...result,rows:[]}),rows:result.rows.map(({q,...row})=>({...clone(row),ref:q.id}))};}
  const hasAnswer=value=>Array.isArray(value)?value.some(x=>x!==null&&x!==undefined):value!==undefined&&value!==null&&value!=='';
  function summarize(records,category){
    const unique=new Map();for(const r of records)if(r.kind==='topic-practice'&&r.status==='completed'&&r.practice?.category===category&&(!unique.has(r.attemptId)||r.updatedAt>unique.get(r.attemptId).updatedAt))unique.set(r.attemptId,r);
    const sessions=[...unique.values()].sort((a,b)=>b.updatedAt-a.updatedAt),topics={};let answered=0,assessed=0,correct=0,pending=0;
    for(const record of sessions){const refs=new Map(record.questions.map(r=>[r.slotId,r]));for(const row of record.result?.rows||[]){if(row.pend){pending++;continue;}if(!hasAnswer(record.answers?.[row.ref])&&!row.manual)continue;answered++;assessed++;if(row.g===row.m)correct++;for(const tag of refs.get(row.ref)?.tags||[]){if(!topicCategory.has(tag)||CATEGORIES.some(c=>c.id===tag))continue;const t=topics[tag]||(topics[tag]={id:tag,name:labels.get(tag),answered:0,correct:0});t.answered++;if(row.g===row.m)t.correct++;}}}
    const subtopics=Object.values(topics).map(t=>({...t,accuracy:Math.round(t.correct/t.answered*100)})).sort((a,b)=>b.accuracy-a.accuracy||b.answered-a.answered||a.name.localeCompare(b.name,'cs'));
    return{completed:sessions.length,answered,assessed,correct,pending,accuracy:assessed?Math.round(correct/assessed*100):null,strongest:subtopics[0]||null,weakest:subtopics.length>1&&subtopics.at(-1).accuracy<subtopics[0].accuracy?subtopics.at(-1):null,subtopics,sessions};
  }
  root.CermatTopics={CATEGORIES,topicCategory,labels,Catalog,fingerprint,sourceKey,refKey,validTags,categoriesOf,shuffle,choose,createSession,hydrate,packResult,summarize,validSession,hasAnswer};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CermatTopics;
})(typeof window!=='undefined'?window:globalThis);
