const NS='http://www.w3.org/2000/svg';
const svgNode=(tag,attrs)=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
export function objectNode(o) {
  const g=svgNode('g',{'data-ink':o.id,fill:'none',stroke:o.color,'stroke-width':o.width,'stroke-linecap':'round','stroke-linejoin':'round'});
  const a=o.points[0],b=o.points.at(-1);
  if(!a||!b)return g;
  if(o.inkVersion===2 && ['pen','highlight'].includes(o.type)){
    const ink=window.CermatWorksheet.stroke(o.points,o.width,!!o.penPressure);
    g.append(svgNode('path',{d:ink.d,...(ink.fill?{fill:o.color,stroke:'none'}:{})}));
    if(o.type==='highlight')g.setAttribute('opacity','.30');
  } else if(o.type==='pen') g.append(svgNode('path',{d:o.points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}));
  else if(o.type==='highlight')g.append(svgNode('rect',{x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),width:Math.max(Math.abs(a[0]-b[0]),2),height:Math.max(Math.abs(a[1]-b[1]),12),fill:o.color,opacity:.3,stroke:'none'}));
  else if(o.type==='circle')g.append(svgNode('ellipse',{cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,rx:Math.max(2,Math.abs(a[0]-b[0])/2),ry:Math.max(2,Math.abs(a[1]-b[1])/2)}));
  else if(o.type==='text') {
    const text=svgNode('text',{x:a[0],y:a[1],fill:o.color,stroke:'none','font-size':12+o.width,'font-family':'Arial,sans-serif'});
    String(o.text||'').split('\n').forEach((s,i)=>{const t=svgNode('tspan',{x:a[0],dy:i?'1.3em':0});t.textContent=s;text.append(t);});g.append(text);
  } else {
    const end=o.type==='underline'?[b[0],a[1]]:b;
    g.append(svgNode('line',{x1:a[0],y1:a[1],x2:end[0],y2:end[1]}));
    if(o.type==='arrow') {
      const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),len=10;
      const left=[b[0]-len*Math.cos(angle-.45),b[1]-len*Math.sin(angle-.45)],right=[b[0]-len*Math.cos(angle+.45),b[1]-len*Math.sin(angle+.45)];
      g.append(svgNode('path',{d:`M${left.join(' ')} L${b.join(' ')} L${right.join(' ')}`}));
    }
  }
  return g;
}
export class AnnotationLayer {
  constructor(svg,state,getTool,onChange,onText) {
    this.svg=svg;this.state=state;this.getTool=getTool;this.onChange=onChange;this.onText=onText;
    this.state.objects ||= [];this.state.undo ||= [];this.state.redo ||= [];
    this.ink=svgNode('g',{});this.preview=svgNode('g',{'pointer-events':'none'});svg.append(this.ink,this.preview);
    this.paint();this.down=e=>this.start(e);this.move=e=>this.track(e);this.up=e=>this.finish(e);this.cancel=e=>this.abort(e);
    svg.addEventListener('pointerdown',this.down);svg.addEventListener('pointermove',this.move);svg.addEventListener('pointerup',this.up);svg.addEventListener('pointercancel',this.cancel);this.toolChanged();
  }
  toolChanged(){
    const pan=this.getTool().tool==='move';
    this.svg.style.pointerEvents='auto';this.svg.style.touchAction=pan?'pan-x pan-y pinch-zoom':'none';
    this.svg.dataset.tool=pan?'navigate':this.getTool().tool;
  }
  point(e,pressure=false){
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(this.svg.getScreenCTM().inverse()),vb=this.svg.viewBox.baseVal;
    const pair=[Math.round(Math.max(0,Math.min(vb.width,p.x))*100)/100,Math.round(Math.max(0,Math.min(vb.height,p.y))*100)/100];
    if(pressure)pair.push(Math.round((e.pressure||this.draft?.points.at(-1)?.[2]||.5)*1000)/1000);
    return pair;
  }
  remember(previous=this.state.objects){
    this.state.undo.push(structuredClone(previous));if(this.state.undo.length>30)this.state.undo.shift();this.state.redo=[];
  }
  paint(){this.ink.replaceChildren(...this.state.objects.map(objectNode));}
  tolerance(pixels){return pixels*this.svg.viewBox.baseVal.width/(this.svg.getBoundingClientRect().width||1);}
  noteAt(p){
    const pad=this.tolerance(5);
    for(let i=this.state.objects.length-1;i>=0;i--){
      const o=this.state.objects[i];if(o.type!=='text')continue;
      const node=this.ink.children[i],box=node?.getBBox();
      if(box && p[0]>=box.x-pad && p[0]<=box.x+box.width+pad && p[1]>=box.y-pad && p[1]<=box.y+box.height+pad)return o;
    }
  }
  editNote(p,tool){
    const note=this.noteAt(p);
    const apply=value=>{
      if(!this.svg.isConnected||value===note?.text)return;
      this.remember();
      if(note){
        this.state.objects=value===null?this.state.objects.filter(o=>o.id!==note.id):this.state.objects.map(o=>o.id===note.id?{...o,text:value}:o);
      }else if(value!==null){
        const vb=this.svg.viewBox.baseVal,at=window.CermatWorksheet.noteOrigin(p,value,12+tool.width,vb.width,vb.height);
        this.state.objects.push({id:crypto.randomUUID(),type:'text',points:[at],color:tool.color,width:tool.width,text:value});
      }
      this.paint();this.onChange();
    };
    this.onText({initial:note?.text||'',existing:!!note,onSave:apply,onDelete:()=>apply(null)});
  }
  eraseTo(p){
    const radius=this.tolerance(8);
    window.CermatWorksheet.sweep(this.last||p,p,radius*.85,q=>{
      const note=this.noteAt(q);
      for(let i=this.state.objects.length-1;i>=0;i--){
        const o=this.state.objects[i];
        if(o.type==='text'?note!==o:distance(o,q)>radius+o.width/2)continue;
        this.state.objects.splice(i,1);this.ink.children[i].remove();break;
      }
    });
    this.last=p;
  }
  start(e){
    if(this.active!=null||e.button>0)return;
    const tool=this.getTool(),p=this.point(e);
    if(tool.tool==='move'){if(e.pointerType==='mouse')window.CermatWorksheet.dragPage(this.svg,e,this.svg.closest('.cz-paper-scroll'));return;}
    e.preventDefault();this.svg.setPointerCapture(e.pointerId);this.active=e.pointerId;
    if(tool.tool==='text'){this.noteStart=p;return;}
    if(tool.tool==='eraser'){this.beforeErase=this.state.objects.slice();this.last=p;this.eraseTo(p);return;}
    const free=tool.tool==='pen'||tool.tool==='highlight',pressure=tool.tool==='pen'&&e.pointerType==='pen';
    this.draft={id:crypto.randomUUID(),type:tool.tool,points:free?[this.point(e,pressure)]:[p,p],
      color:tool.tool==='highlight'?tool.markerColor:tool.color,width:tool.tool==='highlight'?Math.max(6,tool.width*4.5):tool.width};
    if(free){this.draft.inkVersion=2;this.draft.penPressure=pressure;}
    this.previewDraft();
  }
  previewDraft(){
    if(this.frame)return;
    this.frame=requestAnimationFrame(()=>{this.frame=0;if(this.draft)this.preview.replaceChildren(objectNode(this.draft));});
  }
  track(e){
    if(e.pointerId!==this.active)return;
    e.preventDefault();
    if(this.beforeErase){this.eraseTo(this.point(e));return;}
    if(!this.draft)return;
    if(this.draft.inkVersion===2){
      for(const sample of window.CermatWorksheet.samples(e))window.CermatWorksheet.append(this.draft.points,this.point(sample,this.draft.penPressure));
    }else this.draft.points[1]=this.point(e);
    this.previewDraft();
  }
  finish(e){
    if(e.pointerId!==this.active)return;
    this.track(e);this.complete();
  }
  complete(){
    if(this.active==null)return;
    this.active=null;
    if(this.noteStart){const p=this.noteStart;this.noteStart=null;this.editNote(p,this.getTool());return;}
    if(this.beforeErase){
      if(this.state.objects.length!==this.beforeErase.length){this.remember(this.beforeErase);this.onChange();}
      this.beforeErase=null;this.last=null;
    }else if(this.draft){
      this.remember();this.state.objects.push(this.draft);this.ink.append(objectNode(this.draft));
      this.draft=null;this.preview.replaceChildren();this.onChange();
    }
  }
  abort(e){
    if(e.pointerId!==this.active)return;
    this.noteStart=null;this.complete();
  }
  undo(){if(!this.state.undo.length)return;this.state.redo.push(structuredClone(this.state.objects));this.state.objects=this.state.undo.pop();this.paint();this.onChange();}
  redo(){if(!this.state.redo.length)return;this.state.undo.push(structuredClone(this.state.objects));this.state.objects=this.state.redo.pop();this.paint();this.onChange();}
  destroy(){
    this.noteStart=null;this.complete();cancelAnimationFrame(this.frame);
    for(const [name,fn] of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel]])this.svg.removeEventListener(name,fn);
  }
}
function distance(o,p){
  const a=o.points[0],b=o.points.at(-1);
  function toSegment(a,b){
    const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
  }
  if(o.type==='pen'||o.type==='highlight'&&o.inkVersion===2){
    let best=Math.hypot(p[0]-a[0],p[1]-a[1]);
    for(let i=1;i<o.points.length;i++)best=Math.min(best,toSegment(o.points[i-1],o.points[i]));
    return best;
  }
  const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,rx=Math.max(2,Math.abs(a[0]-b[0])/2),ry=Math.max(2,Math.abs(a[1]-b[1])/2);
  if(o.type==='circle'){
    const angle=Math.atan2((p[1]-cy)/ry,(p[0]-cx)/rx);
    return Math.hypot(p[0]-cx-rx*Math.cos(angle),p[1]-cy-ry*Math.sin(angle));
  }
  if(o.type==='highlight'){
    const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]);
    return Math.hypot(Math.max(x-p[0],0,p[0]-x-Math.max(2,2*rx)),Math.max(y-p[1],0,p[1]-y-Math.max(12,2*ry)));
  }
  return toSegment(a,o.type==='underline'?[b[0],a[1]]:b);
}
