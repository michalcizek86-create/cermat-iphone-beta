/* Read the old edition once. Only verified schoolwork enters the student journal. */
(function (root) {
  'use strict';
  const statsKey = 'cermat-student-stats-v1';
  const oldIndex = 'cermat-study-index-v1';
  const oldAttempt = 'cermat-study-attempt:';
  const oldHistory = 'cermat-study-history:';
  const clone = value => JSON.parse(JSON.stringify(value));
  const newer = (local, stored) => stored && (!local || (stored.updatedAt || stored.ts || 0) > (local.updatedAt || local.ts || 0)) ? stored : local;
  const list = value => Array.isArray(value) ? value : [];
  const copyValue = value => value === undefined ? undefined : clone(value);

  // Compare all grading and artwork fields. Option order can differ in a saved test.
  function questionSignature(question) {
    if (!question || typeof question !== 'object') return '';
    const {id, no, ...content} = question;
    if (content.type === 'choice' && Array.isArray(content.options)) {
      content.correct = content.options[content.correct];
      content.options = [...content.options].sort();
    }
    return JSON.stringify(content, (_, value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]));
    });
  }

  function approvedCatalog() {
    const byId = new Map(), practiceByTitle = new Map(), questions = new Map();
    for (const test of CERMAT_STUDENT_TESTS) {
      const ownQuestions = new Map(test.questions.map(q => [questionSignature(q), q]));
      const entry = {test, ownQuestions};
      byId.set(test.id, entry);
      if (!test.officialSource) practiceByTitle.set(test.title, entry);
      for (const [signature, question] of ownQuestions) questions.set(signature, question);
    }
    const find = saved => {
      if (!saved || !list(saved.questions).length) return null;
      const candidate = byId.get(saved.id) || practiceByTitle.get(CERMAT_PRACTICE_TITLES[saved.title] || saved.title);
      if (!candidate || candidate.test.officialSource && candidate.test.id !== saved.id) return null;
      const savedQuestions = new Set(saved.questions.map(questionSignature));
      if (!candidate.test.officialSource && savedQuestions.size !== candidate.ownQuestions.size) return null;
      return [...savedQuestions].every(q => candidate.ownQuestions.has(q)) ? candidate : null;
    };
    return {find, byId, questions, topics: new root.CermatTopics.Catalog([]).refresh(CERMAT_STUDENT_TESTS)};
  }

  function verifiedQuestions(saved, approved) {
    if (!list(saved).length) return null;
    const ids = new Set(), questions = [];
    for (const question of saved) {
      const source = approved.get(questionSignature(question));
      if (!source || typeof question.id !== 'string' || !/^[\w.:-]{1,200}$/.test(question.id) || ids.has(question.id)) return null;
      ids.add(question.id);
      const verified = {...clone(source), id:question.id};
      if (question.no === '') verified.no = '';
      if (source.type === 'choice') {
        verified.options = [...question.options];
        verified.correct = question.correct;
      }
      questions.push(verified);
    }
    return questions;
  }

  function verifiedRecord(record, catalog, aliases, store) {
    if (!store.valid(record) || !['in-progress', 'completed'].includes(record.status)) return null;
    if (record.kind === 'topic-practice') {
      const entries = record.questions.map(ref => catalog.topics.resolve(ref));
      if (entries.some(entry => !entry)) return null;
      const {category, subtopics, requested, available, mode, createdAt} = record.practice;
      const clean = root.CermatTopics.createSession(entries, {category, subtopics, requested, available, mode, id:record.attemptId, now:createdAt || record.updatedAt});
      clean.questions = clean.questions.map((ref, i) => ({...ref, slotId:record.questions[i].slotId, tags:root.CermatTopics.validTags(record.questions[i].tags)}));
      return {...work(record), key:clean.key, kind:clean.kind, test:clean.test, practice:clean.practice, questions:clean.questions, result:record.result};
    }

    const test = record.test, candidate = catalog.find(test);
    const sourceId = typeof test.id === 'string' ? test.id.replace(/(?:-r)+$/, '') : '';
    const sourceTest = aliases.get(sourceId) || catalog.byId.get(sourceId);
    const generated = test.temp === true && (['mix', 'weak'].includes(sourceId) || sourceId !== test.id && sourceTest);
    if (!candidate && !generated) return null;
    const approved = candidate?.ownQuestions || sourceTest?.ownQuestions || catalog.questions;
    const questions = verifiedQuestions(record.questions, approved), testQuestions = verifiedQuestions(test.questions, approved);
    if (!questions || !testQuestions) return null;
    const id = candidate?.test.id || (sourceTest ? sourceTest.test.id + test.id.slice(sourceId.length) : test.id);
    const label = sourceId === 'mix' ? 'Náhodný mix' : sourceId === 'weak' ? 'Slabá místa' : sourceTest?.test.title;
    const title = candidate?.test.title || label + (sourceId !== test.id ? ' – chyby' : '');
    const cleanTest = {...clone(candidate?.test || {}), id, title, minutes:Number.isFinite(test.minutes) ? test.minutes : 0, shuffle:!!test.shuffle, questions:testQuestions};
    if (generated) cleanTest.temp = true;
    const key = generated || record.key !== test.id ? id + '::' + record.attemptId : id;
    let result = null;
    if (record.result) {
      const byId = new Map(questions.map(q => [q.id, q]));
      const rows = list(record.result.rows).map(row => ({...row, q:byId.get(row.q?.id)}));
      if (rows.length !== questions.length || rows.some(row => !row.q)) return null;
      result = {...record.result, rows};
    }
    return {...work(record), key, test:cleanTest, questions, result};
  }

  function work(record) {
    const {version, attemptId, status, updatedAt, answers, papers, extraPages, left, currentQuestion, tools, scrollY, viewportWidth, hints} = record;
    return {version, attemptId, status, updatedAt, answers, papers, extraPages, left, currentQuestion, tools, scrollY, viewportWidth, hints};
  }

  async function readLegacy(store, key, fallback) {
    const local = store.read(key) || (fallback ? store.read(fallback) : null);
    const stored = await store.get(key === 'cermat-selftest-v2' ? 'data' : key).catch(() => null);
    return newer(local, stored);
  }

  async function legacyRecords(store) {
    const local = store.read(oldIndex), stored = await store.get(oldIndex).catch(() => null);
    const read = async (field, id, prefix) => {
      const keys = new Set([...list(local?.[field]), ...list(stored?.[field])].map(meta => meta?.[id]).filter(key => typeof key === 'string'));
      return (await Promise.all([...keys].map(key => readLegacy(store, prefix + key)))).filter(Boolean);
    };
    const [attempts, history] = await Promise.all([read('attempts', 'key', oldAttempt), read('history', 'attemptId', oldHistory)]);
    return {attempts, history};
  }

  function copyScores(source, aliases) {
    const result = {};
    for (const [oldId, entry] of aliases) {
      const value = source?.[oldId];
      if (!Number.isFinite(value?.best) || !Number.isFinite(value.last)) continue;
      const id = entry.test.id;
      result[id] = {last:value.last, best:Math.max(value.best, result[id]?.best || 0)};
    }
    return result;
  }

  function summarizeApproved(records, migrated) {
    const completed = new Map();
    for (const record of records) {
      if (record.status !== 'completed' || record.kind === 'topic-practice' || !record.result) continue;
      if ((completed.get(record.attemptId)?.updatedAt || 0) < record.updatedAt) completed.set(record.attemptId, record);
    }
    for (const record of [...completed.values()].sort((a, b) => a.updatedAt - b.updatedAt)) {
      const day = dk(new Date(record.updatedAt)), previous = dk(new Date(record.updatedAt - 864e5));
      const daily = migrated.__day ||= {d:day,n:0}, streak = migrated.__st ||= {last:'',n:0};
      if (daily.d !== day) {daily.d = day; daily.n = 0;}
      if (streak.last !== day) {streak.n = streak.last === previous ? streak.n + 1 : 1; streak.last = day;}
      const totals = migrated.__tp ||= {};
      for (const row of record.result.rows) {
        if (row.pend) continue;
        const value = totals[topicOf(row.q)] ||= [0,0];
        value[0] += Number(row.g === row.m);
        value[1]++;
        if (value[1] > 30) {value[0] *= .8; value[1] *= .8;}
        if (root.CermatTopics.hasAnswer(row.a)) daily.n++;
      }
    }
  }

  async function restore(store) {
    const current = await readLegacy(store, statsKey);
    if (current) {stats = current.stats || {}; return;}
    const [legacy, records] = await Promise.all([readLegacy(store, 'cermat-selftest-v2', 'cermat-selftest-v1'), legacyRecords(store)]);
    if (!legacy && !records.attempts.length && !records.history.length) return;
    const catalog = approvedCatalog(), aliases = new Map();
    for (const test of list(legacy?.tests)) {
      const entry = catalog.find(test);
      if (entry) aliases.set(test.id, entry);
    }
    const verified = key => records[key].flatMap(record => {
      try {
        const value = verifiedRecord(record, catalog, aliases, store);
        return value ? [value] : [];
      } catch (_) {return [];}
    });
    const attempts = verified('attempts'), history = verified('history');
    const migrated = copyScores(legacy?.stats, aliases);
    const hasPrivate = aliases.size !== list(legacy?.tests).length || list(legacy?.trash).length || attempts.length !== records.attempts.length || history.length !== records.history.length;
    if (hasPrivate) summarizeApproved([...attempts, ...history], migrated);
    else for (const key of ['__tp','__st','__day']) {
      if (legacy?.stats?.[key] !== undefined) migrated[key] = copyValue(legacy.stats[key]);
    }
    const saved = await store.restoreLegacy({attempts, history});
    // A second tab may have finished migration or begun studying in the meantime.
    const latest = await readLegacy(store, statsKey);
    stats = latest?.stats || migrated;
    if (!latest && saved) persist(store);
  }

  function persist(store) {
    const value = {stats:clone(stats), ts:Date.now()};
    store.write(statsKey, value);
    return store.put(statsKey, value).catch(() => {});
  }

  root.CermatStudent = {restore, persist};
})(window);
