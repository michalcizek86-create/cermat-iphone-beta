// Scoring always uses imported key cells. Ambiguous/open responses await review.
export function isAnswered(q, value) {
  const fields = q.parts.length ? q.parts.map(p => p.no) : ['value'];
  return fields.every(k => String(value?.[k] ?? '').trim().length > 0);
}
export function scoreQuestion(q, value = {}, manual) {
  const open = q.kind === 'open' || q.kind === 'open-group';
  if (open) {
    const empty = !Object.values(value).some(v => String(v).trim());
    const reviewed = !empty && Number.isInteger(manual) && manual >= 0 && manual <= q.points;
    return { id: q.id, points: reviewed ? manual : 0, max: q.points, pending: !reviewed && !empty, open, answered: isAnswered(q,value), correct: reviewed && manual === q.points };
  }
  let points = 0, correctCount = 0;
  if (q.kind === 'choice') {
    points = value.value === q.officialAnswer ? q.points : 0;
    correctCount = points ? 1 : 0;
  } else {
    correctCount = q.parts.filter(p => value[p.no] === (p.answerValue ?? p.officialAnswer.split('\n')[0].trim())).length;
    if (q.kind === 'ordering') points = correctCount === q.parts.length ? q.points : 0;
    else if (q.scoreMap && Object.keys(q.scoreMap).length) points = q.scoreMap[correctCount] ?? 0;
    else if (q.kind === 'matching' && q.parts.length === q.points) points = correctCount;
  }
  return { id: q.id, points, max: q.points, pending: false, open, correctCount, answered: isAnswered(q,value), correct: points === q.points };
}
export function scoreAttempt(attempt, questionMap) {
  const rows = attempt.questionIds.map(id => scoreQuestion(questionMap.get(id), attempt.answers[id], attempt.manualScores?.[id]));
  const points = rows.reduce((n,r)=>n+r.points,0), max = rows.reduce((n,r)=>n+r.max,0);
  const pendingMax = rows.filter(r=>r.pending).reduce((n,r)=>n+r.max,0);
  return { subject: 'cz', rows, points, max, pendingMax, pendingCount: rows.filter(r=>r.pending).length,
    pct: max ? Math.round(points/max*100) : 0, final: !pendingMax };
}
export function shuffleUnique(pool, count, random = Math.random) {
  const a = [...new Map(pool.map(q=>[q.id,q])).values()];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0,Math.min(count,a.length));
}
