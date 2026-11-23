const NS='http://www.w3.org/2000/svg';
const svgNode=(tag,attrs)=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
export function objectNode(o) {
  const g=svgNode('g',{'data-ink':o.id,fill:'none',stroke:o.color,'stroke-width':o.width,'stroke-linecap':'round','stroke-linejoin':'round'});
  const a=o.points[0],b=o.points.at(-1);
  if(!a||!b)return g;
  if(o.type==='pen') g.append(svgNode('path',{d:o.points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}));
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
  toolChanged(){const move=this.getTool().tool==='move';this.svg.style.pointerEvents=move?'none':'auto';this.svg.style.touchAction=move?'auto':'none';}
  point(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(this.svg.getScreenCTM().inverse());const vb=this.svg.viewBox.baseVal;return [Math.round(Math.max(0,Math.min(vb.width,p.x))*100)/100,Math.round(Math.max(0,Math.min(vb.height,p.y))*100)/100];}
  remember(){this.state.undo.push(structuredClone(this.state.objects));if(this.state.undo.length>30)this.state.undo.shift();this.state.redo=[];}
  paint(){this.ink.replaceChildren(...this.state.objects.map(objectNode));}
  start(e){
    if(this.active || e.button>0 || this.getTool().tool==='move')return;
    const tool=this.getTool(),p=this.point(e);e.preventDefault();this.svg.setPointerCapture(e.pointerId);
    if(tool.tool==='text') {this.onText(p,text=>{if(!text.trim())return;this.remember();this.state.objects.push({id:crypto.randomUUID(),type:'text',points:[p],color:tool.color,width:tool.width,text:text.slice(0,5000)});this.paint();this.onChange();});return;}
    if(tool.tool==='eraser') {
      const matches=this.state.objects.map((o,i)=>({o,i,d:distance(o,p)})).filter(x=>x.d<18).sort((a,b)=>a.d-b.d);
      if(matches.length){this.remember();this.state.objects.splice(matches[0].i,1);this.paint();this.onChange();}return;
    }
    this.active=e.pointerId;this.draft={id:crypto.randomUUID(),type:tool.tool,points:[p,p],color:tool.tool==='highlight'?'#f1c645':tool.color,width:tool.width*(e.pointerType==='pen'?Math.max(.5,e.pressure*1.5):1)};
  }
  track(e){if(e.pointerId!==this.active||!this.draft)return;e.preventDefault();const p=this.point(e);if(this.draft.type==='pen')for(const event of (e.getCoalescedEvents?.()||[e]))this.draft.points.push(this.point(event));else this.draft.points[1]=p;this.preview.replaceChildren(objectNode(this.draft));}
  finish(e){if(e.pointerId!==this.active||!this.draft)return;this.track(e);this.remember();this.state.objects.push(this.draft);this.draft=null;this.active=null;this.preview.replaceChildren();this.paint();this.onChange();}
  abort(e){if(e.pointerId===this.active){this.active=null;this.draft=null;this.preview.replaceChildren();}}
  undo(){if(!this.state.undo.length)return;this.state.redo.push(structuredClone(this.state.objects));this.state.objects=this.state.undo.pop();this.paint();this.onChange();}
  redo(){if(!this.state.redo.length)return;this.state.undo.push(structuredClone(this.state.objects));this.state.objects=this.state.redo.pop();this.paint();this.onChange();}
  destroy(){this.svg.removeEventListener('pointerdown',this.down);this.svg.removeEventListener('pointermove',this.move);this.svg.removeEventListener('pointerup',this.up);this.svg.removeEventListener('pointercancel',this.cancel);}
}
function distance(o,p){
  if(o.type==='pen')return Math.min(...o.points.map(x=>Math.hypot(x[0]-p[0],x[1]-p[1])));
  const a=o.points[0],b=o.points.at(-1);if(o.type==='text')return Math.hypot(a[0]-p[0],a[1]-p[1]);
  if(o.type==='circle'||o.type==='highlight') {const x1=Math.min(a[0],b[0]),x2=Math.max(a[0],b[0]),y1=Math.min(a[1],b[1]),y2=Math.max(a[1],b[1]);return p[0]>=x1-8&&p[0]<=x2+8&&p[1]>=y1-8&&p[1]<=y2+8?0:1000;}
  const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
