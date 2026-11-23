export const html = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
export const formatDate = stamp => new Date(stamp).toLocaleString('cs-CZ', {day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
export const plural = (n, one, few, many) => n===1 ? one : n>=2&&n<=4 ? few : many;
export const countTasks = n => `${n} ${plural(n,'úloha','úlohy','úloh')}`;
export const fold = value => value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export const clock = milliseconds => {
  const seconds = Math.max(0, Math.floor(milliseconds/1000));
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
};
export function button(label, action, value = '', cls = '', extra = '') {
  return `<button type="button" class="${cls}" data-action="${action}" data-value="${html(value)}" ${extra}>${html(label)}</button>`;
}
export function pdfLink(path, label, page = '') {
  return `<a href="./${html(path)}${page ? '#page='+page : ''}" target="_blank" rel="noopener">${html(label)}</a>`;
}
export function answerForm(question, answer = {}) {
  const qid = question.id;
  const attribute = (part, type) => `data-answer="${qid}" data-part="${part}" ${type||''}`;
  const radios = (part, options) => options.map(option =>
    `<label class="po"><input type="radio" name="${qid}-${part}" ${attribute(part)} value="${option}" ${answer[part]===option?'checked':''} aria-label="${option}"><span class="bub">${option}</span></label>`
  ).join('');
  const openInput = part => `<textarea id="answer-${qid}-${part}" ${attribute(part)} rows="2" maxlength="3000" spellcheck="false" aria-label="Odpověď ${part==='value'?question.no:part}" autocomplete="off">${html(answer[part])}</textarea>`;
  let inputs;
  if (question.kind==='choice') {
    inputs = `<div class="opts row">${radios('value', question.options)}</div>`;
  } else if (!question.parts.length) {
    inputs = openInput('value');
  } else {
    inputs = question.parts.map(part => {
      const partLabel = question.kind==='ordering' ? `${part.no.split('.')[1]}. místo` : part.no;
      let control;
      if (question.kind==='boolean-group') {
        control = `<div class="answer-inline" role="group" aria-label="Odpověď ${part.no}">${radios(part.no,question.options)}</div>`;
      } else if (['matching','ordering'].includes(question.kind)) {
        control = `<select id="answer-${qid}-${part.no}" ${attribute(part.no)} aria-label="Odpověď ${html(partLabel)}"><option value="">Vyber možnost</option>${question.options.map(value => `<option ${answer[part.no]===value?'selected':''}>${value}</option>`).join('')}</select>`;
      } else {
        control = openInput(part.no);
      }
      return `<div class="part-answer"><label for="answer-${qid}-${part.no}">${html(partLabel)}</label>${control}</div>`;
    }).join('');
  }
  return `<div class="cz-answer" id="task-${qid}" data-question="${qid}"><fieldset><legend>Úloha ${question.no} · ${question.points} b.</legend>${inputs}</fieldset>${button('Smazat odpověď','clear-answer',qid,'text-button clear-answer')}</div>`;
}
