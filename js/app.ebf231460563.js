
let np=[],ni=0,ncol='#1b1b2f',nera=false,nw=2.6,pads={},hints=new Set(),tests=[],stats={},view='home',cur=null,qs=[],ans={},timerId=null,left=0,res=null;
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const L='ABCDEF';

function cleanSvg(str){if(typeof str==='string'&&str.startsWith('cermat-asset:'))return cermatAsset(str);try{const d=new DOMParser().parseFromString(String(str),'image/svg+xml');const r=d.documentElement;if(!r||r.nodeName!=='svg'||d.querySelector('parsererror'))return '';
 const ok=new Set(['svg','g','path','line','polyline','polygon','rect','circle','ellipse','text','tspan','defs','marker','image','title']);
 (function w(n){[...n.children].forEach(c=>{if(!ok.has(c.nodeName)){c.remove();return}if(c.nodeName==='image'&&!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(c.getAttribute('href')||'')){c.remove();return}[...c.attributes].forEach(a=>{if(/^on/i.test(a.name)||(/href/i.test(a.name)&&c.nodeName!=='image')||/javascript:/i.test(a.value))c.removeAttribute(a.name)});w(c)})})(r);
 [...r.attributes].forEach(a=>{if(/^on/i.test(a.name)||/href/i.test(a.name))r.removeAttribute(a.name)});
 r.setAttribute('role','img');return new XMLSerializer().serializeToString(r)}catch(e){return ''}}

let wp={};
function wpPaint(P){const cv=P.cv,r=cv.getBoundingClientRect();if(!r.width)return;const d=window.devicePixelRatio||1,W=Math.round(r.width*d),H=Math.round(r.height*d);
 if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
 const x=cv.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);x.lineCap='round';x.lineJoin='round';
 P.strokes.forEach(s=>{x.globalCompositeOperation=s.e?'destination-out':'source-over';x.strokeStyle=s.c;x.lineWidth=(s.e?18:(getP().pw||2.4))*d;x.beginPath();
  s.p.forEach((q,i)=>{const X=q[0]*W,Y=q[1]*H;i?x.lineTo(X,Y):x.moveTo(X,Y)});if(s.p.length===1)x.lineTo(s.p[0][0]*W+.1,s.p[0][1]*H);x.stroke()});x.globalCompositeOperation='source-over'}
function initWp(){document.querySelectorAll('.wp').forEach(el=>{const id=el.dataset.id,cv=el.querySelector('canvas'),P=wp[id]={strokes:[],col:'#1d1c19',er:false,cv};let st=null;
 el.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const k=b.dataset.w;
  if(k==='c'||k==='e'){P.er=k==='e';if(k==='c')P.col=b.dataset.c;el.querySelectorAll('.wt').forEach(x=>x.classList.toggle('on',x===b))}
  else if(k==='u'){P.strokes.pop();wpPaint(P)}else if(k==='x'){P.strokes=[];wpPaint(P)}};
 const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 cv.onpointerdown=e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}st={c:P.col,e:P.er,p:[pt(e)]};P.strokes.push(st);wpPaint(P)};
 cv.onpointermove=e=>{if(!st)return;st.p.push(pt(e));wpPaint(P)};
 cv.onpointerup=cv.onpointercancel=()=>{st=null}})}
function togWp(id,b){const el=document.getElementById('wp-'+id);el.hidden=!el.hidden;b.classList.toggle('on',!el.hidden);if(!el.hidden)wpPaint(wp[id])}
function wpHtml(q){const dr=q.type==='draw';return `<div class='wp' id='wp-${q.id}' data-id='${q.id}' ${dr?'':'hidden'}><div class='wpt'><button class='wt on' data-w='c' data-c='#1d1c19'>Černá</button><button class='wt' data-w='c' data-c='#1f3a93'>Modrá</button><button class='wt' data-w='c' data-c='#b3261e'>Červená</button><button class='wt' data-w='e'>Guma</button><button data-w='u'>Zpět</button><button data-w='x'>Smazat</button></div>${dr?(chkOf(q)&&getP().auto!==false?`<p class='mut' style='margin:0 0 8px;font-size:.85rem'>Kresbu po odevzdání vyhodnotím sám.</p>`:''):`<p class='mut' style='margin:0 0 8px;font-size:.85rem'>Sem můžeš psát postup nebo kreslit prstem či perem. Odpověď zadej do políčka výše.</p>`}<div class='wpc${dr?'':' free'}'>${dr?cleanSvg(q.svg):''}<canvas></canvas></div></div>`}
function selfJ(i,ok){const r=res.rows[i];r.g=ok?r.m:0;r.pend=false;r.auto=0;r.msg='';res.got=res.rows.reduce((a,x)=>a+x.g,0);res.pct=res.tot?Math.round(res.got/res.tot*100):0;
 if(!cur.temp){const s=stats[cur.id]||{best:0};stats[cur.id]={last:res.pct,best:Math.max(s.best,res.pct)};save()}const y=window.scrollY;render();window.scrollTo(0,y)}
addEventListener('resize',()=>{for(const k in wp)wpPaint(wp[k])});
function det(r,i){const q=r.q,im=res.imgs&&res.imgs[q.id];
 if(q.type==='draw')return `<div class='wpc'>${cleanSvg(q.svg)}${im?`<img src='${im}' alt=''>`:''}</div><p class='mut' style='margin:10px 0 4px'>Vzorové řešení:</p><div class='wpc'>${cleanSvg(q.sol)}</div>`+(r.pend?`<div class='row' style='margin-top:12px'><button class='p' onclick='selfJ(${i},1)'>Mám správně</button><button onclick='selfJ(${i},0)'>Mám špatně</button></div>`:`<div class='${r.g?'ok':'bad'}' style='margin-top:10px'>${r.g?'✓ Správně':'✗ Špatně'} (${r.auto?'vyhodnoceno automaticky':'podle tvého hodnocení'})</div>${r.msg?`<div class='mut' style='margin-top:4px'>${r.msg}</div>`:''}${r.auto?`<div class='row' style='margin-top:10px'><button onclick='selfJ(${i},${r.g?0:1})'>${r.g?'Nesouhlasím – je to špatně':'Nesouhlasím – je to správně'}</button></div>`:''}`);
 return det0(r)+(im?`<p class='mut' style='margin:10px 0 4px'>Tvůj postup:</p><div class='wpc free'><img src='${im}' alt=''></div>`:'')}

const GOAL=20;
function dk(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function topicOf(q){if(q.topic)return q.topic;const t=q.text||'';
 if(/%|procent|zlevn|zdraž/i.test(t))return'Procenta';
 if(/rovnic/i.test(t))return'Rovnice';
 if(/Zjednodušte|Rozložte|Umocněte|vytkn|vzorce/i.test(t))return'Výrazy';
 if(/obsah|obvod|úhl|úhel|kružnic|trojúhelník|čtverec|čtverce|kvádr|osa |osu |osov|výšku|sestroj|narýsuj|Pythagor|obdélník/i.test(t))return'Geometrie';
 if(/měřítk|dm²|cm³|mm²|m³|litr/i.test(t))return'Jednotky a měřítko';
 if(/zlom|\d\/\d/.test(t))return'Zlomky';
 if(/poměr/i.test(t))return'Poměr';
 if(/graf|průměr|tržb/i.test(t))return'Statistika';
 return'Počty a slovní úlohy'}
function numv(s){s=String(s).trim().replace(/[−–]/g,'-').replace(/\s+/g,'').replace(',','.').replace(/%$/,'');let m;
 if(/^-?\d+(\.\d+)?$/.test(s))return parseFloat(s);
 if(m=s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/))return +m[2]?m[1]/m[2]:NaN;
 return NaN}
function pw(s){let i;while((i=s.indexOf('**'))>=0){let j=i-1,b;if(s[j]===')'){let d=0;for(;j>=0;j--){if(s[j]===')')d++;else if(s[j]==='('){d--;if(!d)break}}b=s.slice(j,i)}else{while(j>=0&&/[0-9.xy]/.test(s[j]))j--;j++;b=s.slice(j,i)}
 const m=/^\d+/.exec(s.slice(i+2));if(!m||!b||j<0)return null;s=s.slice(0,j)+'Math.pow('+b+','+m[0]+')'+s.slice(i+2+m[0].length)}return s}
function algv(s,x,y){s=String(s).toLowerCase().replace(/[·∙×]/g,'*').replace(/[−–]/g,'-').replace(/\s+/g,'').replace(/,/g,'.').replace(/²/g,'^2').replace(/\^/g,'**');
 if(!/^[0-9xy+\-*/().]+$/.test(s)||!/[xy]/.test(s))return NaN;
 s=s.replace(/(\d|\))(?=[xy(])/g,'$1*').replace(/([xy])(?=[xy\d(])/g,'$1*');s=pw(s);if(s===null)return NaN;
 try{const v=Function('x','y','"use strict";return ('+s+')')(x,y);return typeof v==='number'&&isFinite(v)?v:NaN}catch(e){return NaN}}
function sameAns(q,a,alt){a=String(a).replace(/^\s*[xy]\s*=\s*/i,'');if(norm(a)===norm(alt))return true;
 if(/Rozložte na součin|vytkněte/i.test(q.text||'')){const z=t=>norm(t).replace(/[·∙*]/g,'');return z(a)===z(alt)}
 if(!/zlomk/i.test(q.text||'')){const u=numv(a),v=numv(alt);if(!isNaN(u)&&!isNaN(v)&&Math.abs(u-v)<1e-9)return true}
 let ok=true,any=false;for(const[p,r]of[[1.3,.7],[2.1,-1.4],[-.6,3.2]]){const u=algv(a,p,r),v=algv(alt,p,r);if(isNaN(u)||isNaN(v)){ok=false;break}any=true;if(Math.abs(u-v)>1e-7*Math.max(1,Math.abs(v))){ok=false;break}}
 return ok&&any}
function weakTopics(){const t=stats.__tp||{};return Object.entries(t).filter(([k,v])=>v[1]>=2&&v[0]/v[1]<.75).sort((a,b)=>a[1][0]/a[1][1]-b[1][0]/b[1][1]).map(x=>x[0])}
function startWeak(){const wk=weakTopics();if(!wk.length)return;const pool=[];tests.forEach(t=>t.questions.forEach(q=>{if(q.type!=='draw'&&wk.includes(topicOf(q)))pool.push(q)}));
 if(!pool.length)return;startT({id:'weak',title:'Slabá místa: '+wk.slice(0,3).join(', '),minutes:0,shuffle:false,temp:true,questions:pool.sort(()=>Math.random()-.5).slice(0,12).map(q=>Object.assign({},q,{no:''}))})}
function overview(){const tp=stats.__tp||{},ks=Object.keys(tp).filter(k=>tp[k][1]>0).sort((a,b)=>tp[a][0]/tp[a][1]-tp[b][0]/tp[b][1]);
 const st=stats.__st||{n:0,last:''},dy=stats.__day||{d:'',n:0},today=dk(new Date()),n=dy.d===today?dy.n:0,sk=(st.last===today||st.last===dk(new Date(Date.now()-864e5)))?st.n:0;
 return `<div class="card ov" id="ov" role="region" aria-label="Tvůj pokrok"><div class="ovrow"><div><b>${sk}</b><span>dní v řadě</span></div><div><b>${n}/${goal()}</b><span>úloh dnes</span></div></div><div class="ov-detail"><div class="ov-label">Denní cíl</div><div class="goal" role="progressbar" aria-label="Dnešní vyřešené úlohy" aria-valuemin="0" aria-valuemax="${goal()}" aria-valuenow="${Math.min(n,goal())}"><i style="width:${Math.min(100,n/goal()*100)}%"></i></div><p class="mut">${ks.length?'Každý vyřešený příklad se počítá.':'Po prvním testu se tu ukáže, která témata ti jdou a která ne.'}</p></div>`+
 (ks.length?`<div class="tps">${ks.slice(0,6).map(k=>{const p=Math.round(tp[k][0]/tp[k][1]*100);return `<div class="tp${p<75?' w':''}"><span>${esc(k)}</span><div class="bar"><i style="width:${p}%"></i></div><b>${p} %</b></div>`}).join('')}</div>`:'')+
 (weakTopics().length?`<button class="p" onclick="startWeak()">Procvičit slabá místa</button>`:'')+`</div>`}
let lastIn=null;
function mkBar(){let b=document.getElementById('mk');if(b)return b;b=document.createElement('div');b.id='mk';b.hidden=true;
 b.innerHTML=['/','−',',','√','²','π','%','x','y','(',')'].map(c=>`<button type="button" data-k="${c}">${c}</button>`).join('')+'<button type="button" data-k="⌫" aria-label="Smazat znak">⌫</button>';
 b.onpointerdown=e=>e.preventDefault();
 b.onclick=e=>{const k=e.target.closest('button');if(!k||!lastIn)return;lastIn.focus();const c=k.dataset.k,s=lastIn.selectionStart,t=lastIn.selectionEnd;
  if(c==='⌫'){if(s!==t)lastIn.setRangeText('',s,t,'end');else if(s>0)lastIn.setRangeText('',s-1,s,'end')}else lastIn.setRangeText(c,s,t,'end');
  lastIn.dispatchEvent(new Event('input',{bubbles:true}))};
 document.body.appendChild(b);return b}
document.addEventListener('focusin',e=>{const t=e.target,sm=matchMedia('(pointer:coarse)').matches||innerWidth<700;
 if(view==='run'&&sm&&getP().kb!==false&&t.matches&&t.matches('.ansb input[type=text]')){lastIn=t;mkBar().hidden=false}
 else if(!(t.closest&&t.closest('#mk'))){const m=document.getElementById('mk');if(m)m.hidden=true}});

function getP(){let p={};try{p=JSON.parse(localStorage.getItem('cermat-student-prefs')||localStorage.getItem('prefs')||'{}')}catch(e){}return p}
function applyPrefs(){const p=getP(),h=document.documentElement;[1,2,3].forEach(i=>h.classList.toggle('z'+i,p.z===i));h.classList.toggle('easy',!!p.e);if(p.th==='light'||p.th==='dark')h.dataset.theme=p.th;else delete h.dataset.theme}
function setP(k,v){const p=getP();p[k]=v;try{localStorage.setItem('cermat-student-prefs',JSON.stringify(p))}catch(e){}applyPrefs();if(view==='settings'){const y=window.scrollY;render();window.scrollTo(0,y)}}
function goal(){return getP().goal||20}
function strMult(){return[1.6,1,.6][getP().str===undefined?1:getP().str]||1}
function seg(k,opts,cur){return `<div class="seg">${opts.map(o=>{const v=o[0],lit=typeof v==='string'?"'"+v+"'":v;return `<button class="${cur===v?'on':''}" aria-pressed="${cur===v}" onclick="setP('${k}',${lit})">${o[1]}</button>`}).join('')}</div>`}
function srow(t,d,c){return `<div class="srow"><div><b>${t}</b><span>${d}</span></div>${c}</div>`}
function resetStats(b){if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Opravdu? Klepni znovu';setTimeout(()=>{if(b.isConnected){delete b.dataset.arm;b.textContent='Smazat statistiky'}},3000);return}
 snap('Před smazáním statistik');stats={};save();b.textContent='Smazáno ✓'}
function vbOf(q){const m=/viewBox="([\d.\s-]+)"/.exec(q.svg||'');if(!m)return[260,150];const a=m[1].trim().split(/\s+/).map(Number);return[a[2]||260,a[3]||150]}
const DRAWCHK=[
 ['Sestrojte osu úsečky AB',{k:'line',a:[130,20],b:[130,130],tol:11}],
 ['Narýsujte kružnici k se středem S',{k:'circle',c:[80,75],r:70,tol:12}],
 ['Narýsujte výšku trojúhelníku ABC na stranu AB',{k:'line',a:[80,25],b:[80,130],tol:11}],
 ['Sestrojte bod B, který je obrazem bodu A',{k:'point',p:[155.1,147.8],tol:13}],
 ['Rovnoramenný trojúhelník ABC má základnu AB. Narýsujte jeho osu',{k:'line',a:[100,30],b:[100,130],tol:11}]];
function chkOf(q){return q.chk||(DRAWCHK.find(x=>(q.text||'').startsWith(x[0]))||[])[1]}
function plen(a){let L=0;for(let i=1;i<a.length;i++)L+=Math.hypot(a[i][0]-a[i-1][0],a[i][1]-a[i-1][1]);return L}
function resamp(a,st){if(a.length<2)return a.slice();const o=[a[0]];let need=st;for(let i=1;i<a.length;i++){let[x0,y0]=a[i-1],[x1,y1]=a[i],d=Math.hypot(x1-x0,y1-y0);while(d>=need&&d>0){const t=need/d;x0+=(x1-x0)*t;y0+=(y1-y0)*t;o.push([x0,y0]);d=Math.hypot(x1-x0,y1-y0);need=st}need-=d}return o}
function fitLine(a){const r=resamp(a,2);let mx=0,my=0;r.forEach(p=>{mx+=p[0];my+=p[1]});mx/=r.length;my/=r.length;let sxx=0,syy=0,sxy=0;r.forEach(p=>{const dx=p[0]-mx,dy=p[1]-my;sxx+=dx*dx;syy+=dy*dy;sxy+=dx*dy});
 const t=.5*Math.atan2(2*sxy,sxx-syy),ux=Math.cos(t),uy=Math.sin(t);let ss=0;r.forEach(p=>{const d=(p[0]-mx)*uy-(p[1]-my)*ux;ss+=d*d});return{mx,my,ux,uy,rms:Math.sqrt(ss/r.length)}}
function checkDraw(q,S,m){const c=chkOf(q);if(!c)return null;const[vw,vh]=vbOf(q),P=S.filter(s=>!s.e&&s.p.length>0).map(s=>s.p.map(p=>[p[0]*vw,p[1]*vh])),tol=c.tol*m;
 if(!P.length)return{ok:false,msg:'Nic jsi nenakreslil.'};
 if(c.k==='point'){let best=1e9,small=0;P.forEach(a=>{const xs=a.map(p=>p[0]),ys=a.map(p=>p[1]);if(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))>34)return;small++;const cx=xs.reduce((s,v)=>s+v,0)/xs.length,cy=ys.reduce((s,v)=>s+v,0)/ys.length;best=Math.min(best,Math.hypot(cx-c.p[0],cy-c.p[1]))});
  if(!small)return{ok:false,msg:'Bod označ malou tečkou nebo křížkem.'};return best<=tol?{ok:true,msg:'Bod je na správném místě.'}:{ok:false,msg:'Bod je od správného místa vzdálený.'}}
 if(c.k==='points'){let hit=c.p.map(()=>false),wrong=0,small=0;P.forEach(a=>{const xs=a.map(p=>p[0]),ys=a.map(p=>p[1]);if(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))>34)return;small++;const cx=xs.reduce((s,v)=>s+v,0)/xs.length,cy=ys.reduce((s,v)=>s+v,0)/ys.length;let m=false;c.p.forEach((t,i)=>{if(Math.hypot(cx-t[0],cy-t[1])<=tol){hit[i]=true;m=true}});if(!m)wrong++});
  const n=hit.filter(Boolean).length;if(!small)return{ok:false,msg:'Body označ malou tečkou nebo křížkem.'};if(n===c.p.length&&!wrong)return{ok:true,msg:'Našel jsi všechny '+c.p.length+' body.'};
  return{ok:false,msg:n<c.p.length?'Našel jsi '+n+' z '+c.p.length+' bodů.':'Označil jsi i bod navíc.'}}
 if(c.k==='circle'){const sets=P.filter(a=>plen(a)>=.6*2*Math.PI*c.r);if(P.length>1)sets.push([].concat(...P));if(!sets.length)return{ok:false,msg:'Kružnice je příliš malá nebo nedokončená.'};
  let why='';for(const a of sets){const r=resamp(a,3);let mx=0,my=0;r.forEach(p=>{mx+=p[0];my+=p[1]});mx/=r.length;my/=r.length;const rad=r.reduce((s,p)=>s+Math.hypot(p[0]-mx,p[1]-my),0)/r.length,dc=Math.hypot(mx-c.c[0],my-c.c[1]);
   if(dc<=tol&&Math.abs(rad-c.r)<=Math.max(.2*c.r*m,4))return{ok:true,msg:'Střed i poloměr kružnice sedí.'};why=dc>tol?'Střed kružnice je jinde.':'Poloměr kružnice neodpovídá (má procházet bodem A).'}
  return{ok:false,msg:why}}
 if(c.k==='line'){const D=Math.hypot(c.b[0]-c.a[0],c.b[1]-c.a[1]),vx=(c.b[0]-c.a[0])/D,vy=(c.b[1]-c.a[1])/D;let best=null;
  for(const a of P){const L=plen(a);if(L<.6*D)continue;const f=fitLine(a),dist=p=>Math.abs((p[0]-f.mx)*f.uy-(p[1]-f.my)*f.ux),da=dist(c.a),db=dist(c.b),ang=Math.acos(Math.min(1,Math.abs(f.ux*vx+f.uy*vy)))*180/Math.PI,bent=f.rms>Math.max(5,.07*L);
   if(!bent&&da<=tol&&db<=tol)return{ok:true,msg:'Čára je správně: míří i prochází, kudy má.'};const sc=Math.max(da,db)+(bent?50:0);if(!best||sc<best.sc)best={sc,bent,ang,d:Math.max(da,db)}}
  if(!best)return{ok:false,msg:'Čára je příliš krátká.'};if(best.bent)return{ok:false,msg:'Čára je příliš křivá, zkus ji vést rovně.'};
  return{ok:false,msg:best.ang>8?'Čára má špatný sklon (je odchýlená o '+Math.round(best.ang)+'°).':'Čára míjí správné místo.'}}
 return null}

let storeReady=false,snapCache=[];
let home,topNav,tlist,backup;
function idb(){return new Promise((res,rej)=>{try{const r=indexedDB.open('cermat-testy',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
function idbGet(k){return idb().then(db=>new Promise((res,rej)=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))}
function idbSet(k,v){return idb().then(db=>new Promise((res,rej)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)}))}
function snap(why){
  const item={stats:JSON.parse(JSON.stringify(stats)),ts:Date.now(),why:why||'Záloha postupu'};
  return idbGet('cermat-student-stats-snapshots').then(items=>idbSet('cermat-student-stats-snapshots',[item,...(items||[])].slice(0,6))).catch(()=>{});
}

function openSnaps(){idbGet('cermat-student-stats-snapshots').then(a=>{snapCache=a||[];go('snaps')}).catch(()=>{snapCache=[];go('snaps')})}
function snapsV(){return `<header class="sethd"><button onclick="go('settings')">‹ Zpět</button><h1>Zálohy</h1></header><p class="mut">Zálohy statistik v tomto zařízení. Odpovědi a kresby mají vlastní uložené pokusy.</p>`+(snapCache.length?snapCache.map((s,i)=>`<div class="card"><div class="row sp"><div><h2>${new Date(s.ts).toLocaleString('cs-CZ')}</h2><span class="mut">${esc(s.why||'záloha')}</span></div><button onclick="restoreSnap(${i},this)">Obnovit</button></div></div>`).join(''):`<div class="card"><p class="mut" style="margin:0">Zatím žádné zálohy.</p></div>`)}
function restoreSnap(i,b){if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Opravdu? Klepni znovu';setTimeout(()=>{if(b.isConnected){delete b.dataset.arm;b.textContent='Obnovit'}},3000);return}const s=snapCache[i];if(!s)return;snap('Před obnovou ze zálohy');stats=JSON.parse(JSON.stringify(s.stats));save();go('home')}
function shufOpts(q){const fx=/^(jiný|jiná|jiné|větší než|menší než)/i,ix=q.options.map((o,i)=>i),mv=ix.filter(i=>!fx.test(q.options[i])).sort(()=>Math.random()-.5),fi=ix.filter(i=>fx.test(q.options[i])),od=[...mv,...fi];return Object.assign({},q,{options:od.map(i=>q.options[i]),correct:od.indexOf(q.correct)})}

function setV(){const p=getP(),z=p.z||0;
 return `<header class="sethd"><button onclick="go('home')">‹ Zpět</button><h1>Nastavení</h1></header>
<div class="sgrp">Vzhled</div><div class="card">`+
 srow('Téma','Světlé, tmavé, nebo podle zařízení.',seg('th',[['auto','Automaticky'],['light','Světlé'],['dark','Tmavé']],p.th||'auto'))+
 srow('Velikost písma','Zvětší text v celé aplikaci.',seg('z',[[0,'Normální'],[1,'Větší'],[2,'Velké'],[3,'Největší']],z))+
 srow('Čitelné písmo','Větší mezery mezi písmeny, slovy a řádky.',seg('e',[[false,'Vypnuto'],[true,'Zapnuto']],!!p.e))+
 `</div><div class="sgrp">Testy</div><div class="card">`+
 srow('Pořadí otázek','Při každém spuštění otázky zamíchá, aby sis je nepamatoval podle pořadí.',seg('rq',[[false,'Podle zadání'],[true,'Náhodně']],!!p.rq))+
 srow('Pořadí možností A–E','Zamíchá možnosti. Poslední možnost typu „jiný výsledek“ zůstane na konci.',seg('ro',[[false,'Podle zadání'],[true,'Náhodně']],!!p.ro))+
 srow('Velikost náhodného mixu','Kolik náhodných úloh ze všech testů dohromady se vybere.',seg('mix',[[10,'10'],[20,'20'],[30,'30'],[40,'40']],p.mix||20))+
 srow('Denní cíl','Kolik úloh denně chceš vyřešit.',seg('goal',[[10,'10'],[20,'20'],[30,'30'],[50,'50']],goal()))+
 srow('Matematická klávesnice','Lišta se znaky / − √ ² π při psaní odpovědi (telefon a tablet).',seg('kb',[[true,'Zapnuto'],[false,'Vypnuto']],p.kb!==false))+
 `</div>`+`<div class="sgrp">Data</div><div class="card">`+
 srow('Ukládání','Testy a postup se ukládají natrvalo v tomto zařízení a navíc se zálohují. Nic se nemaže samo.','')+
 srow('Záloha postupu','Stáhni si uložené odpovědi, výsledky a poznámky.',`<div class="seg"><button onclick="go('progress-backup')">Otevřít</button></div>`)+
 srow('Zálohy v zařízení','Automatické zálohy, ze kterých jde vše vrátit.',`<div class="seg"><button onclick="openSnaps()">Zobrazit zálohy</button></div>`)+
 srow('Statistiky a postup','Smaže procenta, témata a sérii dní. Testy zůstanou.',`<div class="seg"><button class="d" onclick="resetStats(this)">Smazat statistiky</button></div>`)+
 `</div><p class="mut" style="text-align:center;margin:26px 0 0">Cermat testy · vlastní cvičné úlohy</p>`}

let filt='',fraw='',sOpen=false;
function navTo(k){const g=()=>{const el=document.getElementById(k==='o'?'ov':'sect-tests');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})};if(view!=='home'){go('home');setTimeout(g,60)}else g()}
function toggleSearch(){sOpen=!sOpen;if(!sOpen&&filt){filt='';fraw='';render();return}const b=document.querySelector('.sbar');if(b){b.hidden=!(sOpen||filt);if(sOpen){const i=document.getElementById('sq');if(i)i.focus()}}}
function doSearch(el){fraw=el.value;filt=fraw.trim().toLowerCase();const p=el.selectionStart;render();const e=document.getElementById('sq');if(e){e.focus();try{e.setSelectionRange(p,p)}catch(_){}}}
document.addEventListener('click',e=>{document.querySelectorAll('.dd[open]').forEach(d=>{if(!d.contains(e.target))d.open=false})});

const PLAY='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',SHUF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>';
function tpts(t){return t.questions.reduce((a,q)=>a+(q.type==='series'?(q.officialScoring?q.officialScoring.max:q.stmts.length):(q.points||1)),0)}

function mixPool(){const seen=new Set(),o=[];tests.forEach(t=>t.questions.forEach(q=>{if(/předchozí/i.test(q.text||''))return;const k=(q.text||'')+q.type;if(seen.has(k))return;seen.add(k);o.push(q)}));return o}
function startMix(n){const pool=mixPool();if(!pool.length)return;const pick=pool.sort(()=>Math.random()-.5).slice(0,Math.min(n,pool.length));startT({id:'mix',title:'Náhodný mix',minutes:Math.max(10,Math.round(pick.length*1.2)),shuffle:false,temp:true,questions:pick.map(q=>Object.assign({},q,{no:''}))})}
function randTest(){startMix(getP().mix||20)}
function mixCard(){
  const n=getP().mix||20, minutes=Math.max(10,Math.round(n*1.2));
  return `<article class="tc mix notebook-mix" aria-labelledby="mix-heading">
    <div class="mix-copy"><h3 id="mix-heading">Náhodný mix</h3><p>Úlohy napříč testy a tématy.</p><p class="mix-meta">Přibližně ${minutes} min</p></div>
    <div class="tc-act"><button class="p" onclick="startMix(${n})">Spustit ${n} úloh</button><button onclick="startMix(10)" aria-label="Spustit mix 10 úloh" title="Spustit mix 10 úloh">10</button><button onclick="startMix(30)" aria-label="Spustit mix 30 úloh" title="Spustit mix 30 úloh">30</button></div>
  </article>`;
}

function save(){if(storeReady)return CermatStudent.persist(CermatUpgrade.store);}

function go(next){
  const routes=['home','run','result','progress-backup','settings','snaps','topics','topic','history'];
  if(!routes.includes(next))return;
  view=next;render();
}
function render(){if(view!=='run'){const p=document.getElementById('paper');if(p)p.remove()}document.getElementById('app').className=view==='run'?'paperview':view==='home'?'homev':'';document.getElementById('app').innerHTML=({home,run:runP,result,'progress-backup':backup,settings:setV,snaps:snapsV})[view]();if(view==='run')initWp();else{const m=document.getElementById('mk');if(m)m.hidden=true}document.body.classList.toggle('mkon',view==='run'&&getP().kb!==false&&(matchMedia('(pointer:coarse)').matches||innerWidth<700));window.scrollTo(0,0)}

function startT(t,force){cur=t;qs=(force||t.shuffle||getP().rq)?[...t.questions].sort(()=>Math.random()-.5):t.questions;if(force||getP().ro)qs=qs.map(q=>q.type==='choice'?shufOpts(q):q);ans={};pads={};wp={};hints=new Set();{const p=document.getElementById('paper');if(p)p.remove()}np=[];ni=0;ncol='#1b1b2f';nera=false;left=t.minutes*60;view='run';render();clearInterval(timerId);
 if(left>0){tick();timerId=setInterval(()=>{left--;tick();if(left<=0)finish()},1000)}}
function tick(){const e=document.getElementById('timer');if(e)e.textContent='Čas do konce: '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')}
function setS(id,k,v){(ans[id]=ans[id]||[])[k]=v}
function run(){return `<h1>${esc(cur.title)}</h1>${cur.sheet?'<p class="mut">Zadání otevři v oficiálním PDF od Cermatu: <a href="https://prijimacky.cermat.gov.cz/menu/testova-zadani-k-procvicovani/testova-zadani-v-pdf.html" target="_blank" rel="noopener">testová zadání</a>. Tady jen zaznamenávej odpovědi.</p>':''}<div class="topbar">${cur.minutes?'<div id="timer"></div>':'<span></span>'}<button onclick="togPaper()">Poznámky</button></div>`+qs.map((q,i)=>{let b='';
 if(q.type==='choice')b=q.options.map((o,k)=>`<label class="ch"><input type="radio" name="r${i}" onchange="ans['${q.id}']=${k}"><span><b>${L[k]}</b> ${esc(o)}</span></label>`).join('');
 else if(q.type==='short')b=`<input type="text" placeholder="Tvoje odpověď" oninput="ans['${q.id}']=this.value">`;
 else b=q.stmts.map((s,k)=>`<div class="ch tf"><span>${esc(s.t)}</span><span class="row"><label class="row" style="margin:0;color:inherit"><input type="radio" name="s${i}_${k}" onchange="setS('${q.id}',${k},true)">ANO</label><label class="row" style="margin:0;color:inherit"><input type="radio" name="s${i}_${k}" onchange="setS('${q.id}',${k},false)">NE</label></span></div>`).join('');
 const mx=q.type==='series'?(q.officialScoring?q.officialScoring.max:q.stmts.length):q.points;
 return `<div class="card"><h2>${i+1}. ${esc(q.text)} <span class="mut">(${mx} b.)</span></h2>${b}${tools(q)}</div>`}).join('')+`<button class="p" onclick="finish()">Odevzdat test</button>`}
const norm=s=>String(s).toLowerCase().replace(/[−–]/g,'-').replace(/\s+/g,'').replace(',','.');
function grade(q,a){
 if(q.type==='series'&&q.officialScoring){const r=a||[],n=q.stmts.reduce((v,s,k)=>v+(r[k]===s.a?1:0),0);return[q.officialScoring.points[n]||0,q.officialScoring.max]}
 if(q.type==='draw')return[0,q.points];
 if(q.type==='series'){const r=a||[];let g=0;q.stmts.forEach((s,k)=>{if(r[k]===s.a)g++});return[g,q.stmts.length]}
 let ok=false;if(a!==undefined&&a!==''){ok=q.type==='choice'?a===q.correct:String(q.correct).split('|').some(x=>sameAns(q,a,x))}
 return[ok?q.points:0,q.points]}
function finish(){clearInterval(timerId);let got=0,tot=0;const imgs={};for(const id in wp){const P=wp[id];if(P&&P.strokes.length&&P.cv.width)imgs[id]=P.cv.toDataURL('image/png')}
 const rows=qs.map(q=>{const a=ans[q.id];let[g,m]=grade(q,a),pend=q.type==='draw',auto=0,msg='';
  if(pend&&getP().auto!==false){const P=wp[q.id],r=checkDraw(q,P?P.strokes:[],strMult());if(r){pend=false;auto=1;msg=r.msg;g=r.ok?q.points:0}}
  got+=g;tot+=m;return{q,a,g,m,pend,auto,msg}});
 const pct=tot?Math.round(got/tot*100):0;
 {const tp=stats.__tp=stats.__tp||{};let an=0;rows.forEach(r=>{if(r.pend)return;const k=topicOf(r.q),v=tp[k]=tp[k]||[0,0];v[1]++;if(r.g===r.m)v[0]++;if(v[1]>30){v[0]*=.8;v[1]*=.8}if(r.a!==undefined&&r.a!==''&&!(Array.isArray(r.a)&&!r.a.length))an++});
  const today=dk(new Date()),yd=dk(new Date(Date.now()-864e5)),st=stats.__st=stats.__st||{n:0,last:''};if(st.last!==today){st.n=st.last===yd?st.n+1:1;st.last=today}
  const dy=stats.__day=stats.__day||{d:'',n:0};if(dy.d!==today){dy.d=today;dy.n=0}dy.n+=an;save()}
 if(!cur.temp){const s=stats[cur.id]||{best:0};stats[cur.id]={last:pct,best:Math.max(s.best,pct)};save()}
 res={got,tot,pct,rows,hints:hints.size,imgs};view='result';render()}
function det0(r){const q=r.q,a=r.a;
 if(q.type==='series')return q.stmts.map((s,k)=>{const o=(a||[])[k]===s.a;return `<div class="${o?'ok':'bad'}">${o?'✓':'✗'} ${esc(s.t)} — správně: <b>${s.a?'ANO':'NE'}</b>${(a||[])[k]===undefined?' (bez odpovědi)':''}</div>`}).join('');
 const mine=a===undefined||a===''?'— bez odpovědi —':q.type==='choice'?L[a]+') '+esc(q.options[a]):esc(a);
 const good=q.type==='choice'?L[q.correct]+') '+esc(q.options[q.correct]):esc(String(q.correct).split('|').join(' / '));
 return `<div class="${r.g?'ok':'bad'}">${r.g?'✓ Správně':'✗ Špatně'} — tvoje odpověď: ${mine}</div>${r.g?'':`<div>Správně: <b>${good}</b></div>`}`}
function result(){const w=res.rows.filter(r=>r.g<r.m);return `<h1>Výsledek</h1><div class="card"><div class="big ${res.pct>=50?'ok':'bad'}">${res.pct} %</div><div class="mut">${res.got} z ${res.tot} bodů</div></div>`+
res.rows.map((r,i)=>`<div class="card"><h2>${esc(r.q.no||String(i+1))}. ${esc(r.q.text)} <span class="mut">(${r.pend?'?':r.g}/${r.m} b.)</span></h2>${det(r,i)}${r.g<r.m&&!r.pend&&r.q.hint?'<div class="hintbox" style="margin-top:10px"><b>Nápověda:</b> '+esc(r.q.hint)+'</div>':''}</div>`).join('')+
`<div class="row"><button class="p" onclick="startT(cur)">Zkusit znovu</button>${w.length?`<button onclick="retryW()">Procvičit jen chyby (${w.length})</button>`:''}<button onclick="go('home')">Zpět na testy</button></div>`}
function retryW(){const w=res.rows.filter(r=>r.g<r.m).map(r=>r.q);startT({id:cur.id+'-r',title:cur.title+' – chyby',minutes:0,shuffle:false,temp:true,questions:w})}

function tools(q){return `<div class="row" style="margin-top:10px">${q.hint?`<button onclick="togHint('${q.id}')">Nápověda</button>`:''}</div>${q.hint?`<div id="h-${q.id}" class="hintbox" hidden>${esc(q.hint)}</div>`:''}`}
function togHint(id){const e=document.getElementById('h-'+id);e.hidden=!e.hidden;if(!e.hidden)hints.add(id)}
function togPad(id){const e=document.getElementById('p-'+id);e.hidden=!e.hidden;if(!e.hidden&&!e.firstChild)mkPad(e)}
function mkPad(e,h){
 e.innerHTML=`<div class="padbar row" style="margin-top:8px"><button data-c="#1f2328" class="on">Tužka</button><button data-c="#d33">Červená</button><button data-c="#2f5bd3">Modrá</button><button data-c="#fff" data-w="18">Guma</button><button class="d" data-x="1">Smazat</button></div><canvas></canvas><textarea placeholder="Poznámky, výpočty…" style="margin-top:6px;min-height:50px"></textarea>`;
 const cv=e.querySelector('canvas'),ctx=cv.getContext('2d');cv.width=Math.max(280,Math.round(cv.getBoundingClientRect().width));cv.height=h||280;cv.style.height=(h||280)+'px';if(h){const t=e.querySelector('textarea');if(t)t.remove()}
 let col='#1f2328',w=2.5,dr=false,lx=0,ly=0;ctx.lineCap='round';ctx.lineJoin='round';
 const pt=ev=>{const r=cv.getBoundingClientRect();return[(ev.clientX-r.left)*cv.width/r.width,(ev.clientY-r.top)*cv.height/r.height]};
 cv.onpointerdown=ev=>{dr=true;cv.setPointerCapture(ev.pointerId);[lx,ly]=pt(ev);ctx.beginPath();ctx.arc(lx,ly,w/2,0,7);ctx.fillStyle=col;ctx.fill()};
 cv.onpointermove=ev=>{if(!dr)return;const[x,y]=pt(ev);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();lx=x;ly=y};
 cv.onpointerup=cv.onpointercancel=()=>{dr=false};
 e.querySelectorAll('.padbar button').forEach(b=>b.onclick=()=>{if(b.dataset.x){ctx.clearRect(0,0,cv.width,cv.height);return}col=b.dataset.c;w=+b.dataset.w||2.5;e.querySelectorAll('.padbar button').forEach(x=>x.classList.remove('on'));b.classList.add('on')})}
function runP(){let mxT=0;qs.forEach(q=>{mxT+=q.type==='series'?(q.officialScoring?q.officialScoring.max:q.stmts.length):q.points});
 const bar=`<div class='topbar'>${cur.minutes?'<div id="timer"></div>':'<span class="mut">Bez časového limitu</span>'}<span style='display:flex;gap:8px'><button onclick='togPaper()'>Poznámky</button><button class='d' onclick='leaveT(this)'>✕ Opustit</button></span></div>`;
 const head=`<div class='phead'><h1 class='pt1'>${esc(cur.title)}</h1><div class='pmeta'>${cur.minutes?'<span>Časový limit: '+cur.minutes+' minut</span>':''}<span>Maximální počet bodů: ${mxT}</span></div><p class='pins'>Odpovědi zaznamenávejte přímo do testu. U výběru z možností označte jedinou odpověď, u série ANO/NE označte u každého tvrzení jedno políčko a u krátkých úloh napište výsledek do rámečku.${cur.sheet?' Zadání úloh najdete v <a href="https://prijimacky.cermat.gov.cz/menu/testova-zadani-k-procvicovani/testova-zadani-v-pdf.html" target="_blank" rel="noopener">oficiálním PDF od Cermatu</a>.':''}</p></div>`;
 const body=qs.map((q,i)=>{const mx=q.type==='series'?(q.officialScoring?q.officialScoring.max:q.stmts.length):q.points;let b='';
  if(q.type==='choice'){const bl=q.options.every(o=>!o);b=`<div class='opts${bl?' row':''}'>`+q.options.map((o,k)=>`<label class='po'><input type='radio' name='p${i}' data-id='${q.id}' data-k='${k}' onclick='pick(this)'><span class='bub'>${L[k]}</span>${o?`<span>${esc(o)}</span>`:''}</label>`).join('')+'</div>'}
  else if(q.type==='short')b=`<div class='ansb'><span>Odpověď:</span><input type='text' aria-label="Odpověď na úlohu ${esc(q.no||String(i+1))}" data-id='${q.id}' oninput='ans[this.dataset.id]=this.value' autocomplete='off'></div>`;
  else if(q.type==='draw')b='';else b=`<table class='tfp'><tr><th></th><th>ANO</th><th>NE</th></tr>`+q.stmts.map((s,k)=>`<tr><td>${esc(s.t)}</td><td><input type='radio' class='sq' name='p${i}_${k}' data-id='${q.id}' data-k='${k}' data-v='1' aria-label="${esc(s.t)} – ANO" onclick='pickS(this)'></td><td><input type='radio' class='sq' name='p${i}_${k}' data-id='${q.id}' data-k='${k}' data-v='0' aria-label="${esc(s.t)} – NE" onclick='pickS(this)'></td></tr>`).join('')+'</table>';
  const h='';
  return `<div class='pq'><div class='pqh'><span class='pn'>${esc(q.no||String(i+1))}</span><h2 class='pqt'>${esc(q.text)}</h2><span class='pp'>${mx} b.</span></div>${q.type==='draw'||!q.svg?'':`<div class='fig'>${cleanSvg(q.svg)}</div>`}${b}${h}${q.type==='draw'?'':`<button class='hb' onclick="togWp('${q.id}',this)">Psát / kreslit</button>`}${wpHtml(q)}</div>`}).join('');
 return bar+`<div class='paper'>${head}${body}<div style='margin-top:20px'><button class='p' onclick='finish()'>Odevzdat test</button></div></div>`}
function leaveT(b){if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Opravdu opustit?';setTimeout(()=>{if(b.isConnected){delete b.dataset.arm;b.textContent='✕ Opustit'}},3000);return}clearInterval(timerId);{const p=document.getElementById('paper');if(p)p.remove()}go('home')}
function pick(el){const id=el.dataset.id,k=+el.dataset.k;if(ans[id]===k){el.checked=false;delete ans[id]}else ans[id]=k}
function pickS(el){const id=el.dataset.id,k=+el.dataset.k,v=el.dataset.v==='1',a=ans[id]=ans[id]||[];if(a[k]===v){a[k]=undefined;el.checked=false}else a[k]=v}
function notesHtml(){return `<div id='notes' hidden><div class='nbar'><div class='row'><button class='tl on' data-c='#1b1b2f' onclick='ntool(this)'>Černá</button><button class='tl' data-c='#2748d8' onclick='ntool(this)'>Modrá</button><button class='tl' data-c='#d62839' onclick='ntool(this)'>Červená</button><button class='tl' data-e='1' onclick='ntool(this)'>Guma</button><button class='d' data-x='1' onclick='ntool(this)'>Smazat list</button></div><div class='row'><button onclick='npg(-1)'>‹</button><span id='npn' class='mut'>1 / 1</span><button onclick='npg(1)'>›</button><button onclick='npNew()'>+ Nový list</button><button class='p' onclick='togNotes()'>Zavřít</button></div></div><div id='nstage'></div></div>`}
function togNotes(){const e=document.getElementById('notes');e.hidden=!e.hidden;if(!e.hidden&&!np.length)npNew()}
function npNew(){const st=document.getElementById('nstage'),cv=document.createElement('canvas'),r=st.getBoundingClientRect();cv.width=Math.round(r.width);cv.height=Math.round(r.height);st.appendChild(cv);nbind(cv);np.push(cv);npShow(np.length-1)}
function npShow(i){ni=i;np.forEach((c,k)=>{c.style.display=k===i?'block':'none'});document.getElementById('npn').textContent=(i+1)+' / '+np.length}
function npg(d){const i=ni+d;if(i>=0&&i<np.length)npShow(i)}
function ntool(b){if(b.dataset.x){const c=np[ni];if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);return}nera=!!b.dataset.e;if(b.dataset.c)ncol=b.dataset.c;document.querySelectorAll('#notes .tl').forEach(x=>x.classList.remove('on'));b.classList.add('on')}
function nbind(cv){const ctx=cv.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';let dr=false,lx=0,ly=0;
 const pt=ev=>{const r=cv.getBoundingClientRect();return[(ev.clientX-r.left)*cv.width/r.width,(ev.clientY-r.top)*cv.height/r.height]};
 const st=()=>{ctx.globalCompositeOperation=nera?'destination-out':'source-over';ctx.strokeStyle=ctx.fillStyle=ncol;ctx.lineWidth=nera?24:nw};
 cv.onpointerdown=ev=>{dr=true;cv.setPointerCapture(ev.pointerId);[lx,ly]=pt(ev);st();ctx.beginPath();ctx.arc(lx,ly,ctx.lineWidth/2,0,7);ctx.fill()};
 cv.onpointermove=ev=>{if(!dr)return;const[x,y]=pt(ev);st();ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();lx=x;ly=y};
 cv.onpointerup=cv.onpointercancel=()=>{dr=false}}
function togPaper(){let p=document.getElementById('paper');
 if(!p){p=document.createElement('div');p.id='paper';p.innerHTML='<div class="phead"><b>Poznámky – prázdný papír</b><button onclick="togPaper()">Zavřít</button></div><div class="pbody"></div>';document.body.appendChild(p);mkPaper(p);return}
 p.hidden=!p.hidden}
function mkPaper(p){
 const W=1000,H=1500,S=Math.min(window.devicePixelRatio||1,2),cols=['#1f2328','#2748d8','#d62839','#14804a','#7c5cff','#f08a24'];
 const ic=d=>`<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>${d}</svg>`;
 p.innerHTML=`<div class='phead'><b>Poznámky</b><div class='zoom'><button data-z='-' aria-label='Oddálit'>−</button><span id='zl'>100 %</span><button data-z='+' aria-label='Přiblížit'>+</button><button data-z='f'>Celá šířka</button></div><div class='zoom'><button data-pg='-' aria-label='Předchozí list'>‹</button><span id='pgl'>1 / 1</span><button data-pg='+' aria-label='Další list'>›</button><button data-pg='n'>+ Nový list</button><button data-pg='d' class='d'>Smazat list</button></div><button data-x='1'>Zavřít</button></div><div class='pscroll'><div class='pspacer'><div class='psheet' data-p='blank'><canvas></canvas></div></div></div><div class='ptools'><button data-t='p' title='Tužka'>${ic(`<path d='M12 20h9'/><path d='M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z'/>`)}</button><button data-t='e' title='Guma'>${ic(`<path d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/><path d='M22 21H7'/><path d='m5 11 9 9'/>`)}</button><button data-t='m' title='Posun'>${ic(`<path d='M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20'/>`)}</button><i class='sep'></i>${cols.map(c=>`<button class='sw' data-c='${c}' style='background:${c}' aria-label='Barva'></button>`).join('')}<i class='sep'></i><input type='range' min='1' max='40' step='0.5' value='2.4' data-r='1' aria-label='Tloušťka'><span class='dotwrap'><i class='dotp'></i></span><i class='sep'></i><button data-a='u' title='Zpět'>${ic(`<path d='M3 7v6h6'/><path d='M21 17a9 9 0 00-15-6.7L3 13'/>`)}</button><button data-a='r' title='Vpřed'>${ic(`<path d='M21 7v6h-6'/><path d='M3 17a9 9 0 0115-6.7L21 13'/>`)}</button><select data-sel='1' aria-label='Papír'><option value='blank'>Čistý</option><option value='dots'>Tečky</option><option value='grid'>Čtverečky</option><option value='lines'>Linky</option></select><button data-a='c' title='Smazat vše (stiskni dvakrát)'>${ic(`<path d='M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'/>`)}</button></div>`;
 const sc=p.querySelector('.pscroll'),sp=p.querySelector('.pspacer'),sh=p.querySelector('.psheet'),cv=p.querySelector('canvas'),ctx=cv.getContext('2d'),zl=p.querySelector('#zl');
 cv.width=W*S;cv.height=H*S;cv.style.width=W+'px';cv.style.height=H+'px';ctx.scale(S,S);
 let z=1,tool='p',col=cols[0],size={p:2.4,e:18},strokes=[],redo=[],pages=[{s:[],r:[],b:'blank'}],pi=0,cur=null,pin=null,pan=null;pages[0].s=strokes;pages[0].r=redo;const pts=new Map();
 const lay=()=>{sp.style.width=W*z+'px';sp.style.height=H*z+'px';sh.style.transform='scale('+z+')';zl.textContent=Math.round(z*100)+' %'};
 const atZoom=(nz,Lx,Ly,fx,fy)=>{z=Math.min(3,Math.max(.3,nz));lay();const r=sp.getBoundingClientRect();sc.scrollLeft+=r.left+Lx*z-fx;sc.scrollTop+=r.top+Ly*z-fy};
 const zoomBy=(k,fx,fy)=>{const r=sp.getBoundingClientRect();atZoom(z*k,(fx-r.left)/z,(fy-r.top)/z,fx,fy)};
 const fit=()=>{z=Math.min(1,Math.max(.3,(sc.clientWidth-24)/W));lay();sc.scrollLeft=0};
 const pt=ev=>{const r=cv.getBoundingClientRect();return[(ev.clientX-r.left)*W/r.width,(ev.clientY-r.top)*H/r.height,ev.pointerType==='pen'?.4+ev.pressure*1.2:1]};
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const mode=st=>{ctx.globalCompositeOperation=st.t==='e'?'destination-out':'source-over';ctx.strokeStyle=ctx.fillStyle=st.c;ctx.lineCap=ctx.lineJoin='round'};
 function seg(st,i){const q=st.p,n=q.length,a=i===1?q[0]:mid(q[i-1],q[i]),b=i<n-1?mid(q[i],q[i+1]):q[i];ctx.save();mode(st);ctx.lineWidth=st.s*q[i][2];ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(q[i][0],q[i][1],b[0],b[1]);ctx.stroke();ctx.restore()}
 function dot(st){ctx.save();mode(st);ctx.beginPath();ctx.arc(st.p[0][0],st.p[0][1],st.s*st.p[0][2]/2,0,7);ctx.fill();ctx.restore()}
 function paint(){ctx.clearRect(0,0,W,H);strokes.forEach(st=>{dot(st);for(let i=1;i<st.p.length;i++)seg(st,i)})}
 const upd=()=>{p.querySelector("[data-a='u']").disabled=!strokes.length;p.querySelector("[data-a='r']").disabled=!redo.length};
 const sync=()=>{p.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tool));p.querySelectorAll('[data-c]').forEach(b=>b.classList.toggle('on',tool==='p'&&b.dataset.c===col));const rg=p.querySelector('[data-r]'),d=p.querySelector('.dotp');rg.disabled=tool==='m';if(tool!=='m')rg.value=size[tool];const s=Math.max(4,Math.min(26,tool==='m'?4:size[tool]));d.style.width=d.style.height=s+'px';d.style.background=tool==='e'?'transparent':col;d.style.border=tool==='e'?'1.5px dashed currentColor':'none';sc.style.cursor=tool==='m'?'grab':'crosshair'};
 sc.onpointerdown=ev=>{sc.setPointerCapture(ev.pointerId);pts.set(ev.pointerId,[ev.clientX,ev.clientY]);
  if(pts.size===2){if(cur){cur=null;paint()}pan=null;const[a,b]=[...pts.values()],r=sp.getBoundingClientRect(),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,z:z,Lx:(mx-r.left)/z,Ly:(my-r.top)/z};return}
  if(pts.size>2)return;
  if(tool==='m'){pan={x:ev.clientX,y:ev.clientY,l:sc.scrollLeft,t:sc.scrollTop};return}
  cur={t:tool,c:col,s:size[tool],p:[pt(ev)]};dot(cur)};
 sc.onpointermove=ev=>{if(!pts.has(ev.pointerId))return;pts.set(ev.pointerId,[ev.clientX,ev.clientY]);
  if(pin&&pts.size===2){const[a,b]=[...pts.values()];atZoom(pin.z*Math.hypot(a[0]-b[0],a[1]-b[1])/pin.d,pin.Lx,pin.Ly,(a[0]+b[0])/2,(a[1]+b[1])/2);return}
  if(pan){sc.scrollLeft=pan.l-(ev.clientX-pan.x);sc.scrollTop=pan.t-(ev.clientY-pan.y);return}
  if(cur){cur.p.push(pt(ev));seg(cur,Math.max(1,cur.p.length-2))}};
 sc.onpointerup=sc.onpointercancel=ev=>{pts.delete(ev.pointerId);if(pts.size<2)pin=null;if(!pts.size){pan=null;if(cur){const n=cur.p.length;if(n>2)seg(cur,n-1);strokes.push(cur);redo=[];cur=null;upd()}}};
 sc.addEventListener('wheel',ev=>{if(ev.ctrlKey||ev.metaKey){ev.preventDefault();zoomBy(ev.deltaY<0?1.1:1/1.1,ev.clientX,ev.clientY)}},{passive:false});
 const sel=p.querySelector('[data-sel]'),pgl=p.querySelector('#pgl'),pb=k=>p.querySelector("[data-pg='"+k+"']");
 const loadPg=i=>{pi=i;strokes=pages[i].s;redo=pages[i].r;sh.dataset.p=pages[i].b;sel.value=pages[i].b;cur=null;paint();upd();pgl.textContent=(i+1)+' / '+pages.length;pb('-').disabled=i===0;pb('+').disabled=i===pages.length-1;sc.scrollTop=0;sc.scrollLeft=0};
 const savePg=()=>{pages[pi]={s:strokes,r:redo,b:sh.dataset.p}};
 const goPg=b=>{const k=b.dataset.pg;
  if(k==='-'&&pi>0){savePg();loadPg(pi-1)}
  else if(k==='+'&&pi<pages.length-1){savePg();loadPg(pi+1)}
  else if(k==='n'){savePg();pages.splice(pi+1,0,{s:[],r:[],b:sh.dataset.p});loadPg(pi+1)}
  else if(k==='d'){if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Opravdu?';setTimeout(()=>{delete b.dataset.arm;b.textContent='Smazat list'},2500);return}
   delete b.dataset.arm;b.textContent='Smazat list';
   if(pages.length===1){strokes=[];redo=[];pages[0]={s:strokes,r:redo,b:sh.dataset.p};paint();upd();return}
   pages.splice(pi,1);loadPg(Math.min(pi,pages.length-1))}};
 loadPg(0);
 p.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.pg){goPg(b);return}
  if(b.dataset.x)return togPaper();
  if(b.dataset.z){if(b.dataset.z==='f'){fit();return}const r=sc.getBoundingClientRect();zoomBy(b.dataset.z==='+'?1.25:.8,r.left+r.width/2,r.top+r.height/2);return}
  if(b.dataset.t){tool=b.dataset.t;sync();return}
  if(b.dataset.c){col=b.dataset.c;tool='p';sync();return}
  if(b.dataset.a==='u'&&strokes.length){redo.push(strokes.pop());paint();upd()}
  if(b.dataset.a==='r'&&redo.length){strokes.push(redo.pop());paint();upd()}
  if(b.dataset.a==='c'){if(b.classList.contains('arm')){strokes=[];redo=[];paint();upd();b.classList.remove('arm')}else{b.classList.add('arm');setTimeout(()=>b.classList.remove('arm'),2500)}}};
 p.oninput=ev=>{if(ev.target.dataset.r&&tool!=='m'){size[tool]=+ev.target.value;sync()}};
 p.onchange=ev=>{if(ev.target.dataset.sel)sh.dataset.p=ev.target.value};
 fit();upd();sync()}

// Official CERMAT additions use the existing test/question schema. Artwork is immutable
// and referenced by ID so it is not copied into progress or browser storage.
function cermatAsset(value){return typeof value==='string'&&value.startsWith('cermat-asset:')?CERMAT_IMAGES[value.slice(13)]||'':value}

tests=CERMAT_STUDENT_TESTS;
CermatUpgrade.install();
applyPrefs();
render();
try{navigator.storage?.persist?.().catch(()=>{});}catch(_){}
window.CERMAT_APP_READY=true;
