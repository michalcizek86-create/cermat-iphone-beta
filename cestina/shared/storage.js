// Shared platform contract. All records carry a subject; no mathematics data is read.
export const SCHEMA = 2;
const DB_NAME = 'cermat-platform-v2';
const JOURNAL = 'cermat:cz:recovery:v2';
let database;
export function db() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      const s = r.result.createObjectStore('attempts', { keyPath: 'id' });
      s.createIndex('subject', 'subject');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => { database = null; reject(r.error); };
    r.onblocked = () => { database = null; reject(new Error('Úložiště je otevřené v jiné verzi aplikace. Zavři ostatní okna.')); };
  });
  return database;
}
async function transaction(mode, callback) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('attempts', mode);
    let result;
    try { result = callback(tx.objectStore('attempts')); } catch (e) { reject(e); return; }
    tx.oncomplete = () => resolve(result?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Ukládání bylo přerušeno.'));
  });
}
export const loadAttempts = () => transaction('readonly', s => s.index('subject').getAll('cz'));
export const putAttempt = a => {
  if (a.subject !== 'cz' || !a.id.startsWith('cz:')) throw new Error('Neplatný předmět zálohy.');
  return transaction('readwrite', s => s.put(a));
};
export function journal(a) {
  try { localStorage.setItem(JOURNAL, JSON.stringify(a)); return true; } catch { return false; }
}
export async function recover() {
  let a;
  try { a = JSON.parse(localStorage.getItem(JOURNAL) || 'null'); }
  catch { return; }
  if (a?.subject !== 'cz' || typeof a.id!=='string' || !a.id.startsWith('cz:') || !Array.isArray(a.questionIds)) return;
  const prior = (await loadAttempts()).find(x => x.id === a.id);
  if (!prior || a.updatedAt > prior.updatedAt) await putAttempt(a);
}
export const pref = (key, fallback) => {
  try { const s = localStorage.getItem('cermat:cz:' + key); return s === null ? fallback : JSON.parse(s); } catch { return fallback; }
};
export const setPref = (key, value) => {
  try { localStorage.setItem('cermat:cz:' + key, JSON.stringify(value)); } catch { /* Attempts use IndexedDB. */ }
};
export function newAttempt(kind, title, questions, examId = null) {
  const now = Date.now();
  return { schemaVersion: SCHEMA, id: 'cz:' + crypto.randomUUID(), subject: 'cz', profileId: 'local', kind, title, examId,
    questionIds: questions.map(q => q.id), answers: {}, papers: {}, manualScores: {}, status: 'active', startedAt: now,
    updatedAt: now, elapsedMs: 0, currentIndex: 0, result: null };
}
export function validateBackup(data, questionMap) {
  if (data.schemaVersion !== SCHEMA || data.subject !== 'cz' || !Array.isArray(data.attempts)) throw new Error('Vyber zálohu této aplikace CERMAT Čeština.');
  if (data.attempts.length > 3000) throw new Error('Záloha obsahuje příliš mnoho pokusů.');
  for (const a of data.attempts) {
    if (a?.schemaVersion !== SCHEMA || a.subject !== 'cz' || typeof a.id!=='string' || !a.id.startsWith('cz:') ||
        !['active','submitted'].includes(a.status) || !Array.isArray(a.questionIds) || !a.questionIds.length ||
        a.questionIds.some(id => !questionMap.has(id)) || new Set(a.questionIds).size !== a.questionIds.length ||
        !Number.isFinite(a.updatedAt) || !a.answers || typeof a.answers !== 'object' || !a.papers || typeof a.papers !== 'object') {
      throw new Error('Záloha má neplatné nebo neznámé údaje.');
    }
    for (const p of Object.values(a.papers)) {
      if (!Array.isArray(p?.objects) || p.objects.length > 15000) throw new Error('Neplatná vrstva poznámek.');
      for (const o of p.objects) {
        if (!['pen','highlight','underline','strike','circle','arrow','text'].includes(o.type) || !/^#[0-9a-f]{6}$/i.test(o.color) ||
            !Number.isFinite(o.width) || o.width < 0 || o.width > 40 || !Array.isArray(o.points) || !o.points.length || o.points.length > 100000 ||
            o.points.some(pt => !Array.isArray(pt) || pt.length !== 2 || pt.some(n => !Number.isFinite(n) || Math.abs(n)>10000)) ||
            (o.text && (typeof o.text !== 'string' || o.text.length > 5000))) throw new Error('Neplatný objekt poznámky.');
      }
      p.undo = []; p.redo = [];
    }
  }
  return data.attempts;
}
