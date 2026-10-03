'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, memoryStorage } = require('./helpers/load');

const SA = load();

// ---------------- i18n ----------------

test('TC-002 fallback chain sat -> hi -> en', () => {
  const dict = {
    en: { a: 'A-en', b: 'B-en', c: 'C-en' },
    hi: { a: 'A-hi', b: 'B-hi' },
    sat: { a: 'A-sat' }
  };
  assert.equal(SA.i18n.tFor('sat', 'a', null, dict), 'A-sat');
  assert.equal(SA.i18n.tFor('sat', 'b', null, dict), 'B-hi');
  assert.equal(SA.i18n.tFor('sat', 'c', null, dict), 'C-en');
  assert.equal(SA.i18n.tFor('hi', 'c', null, dict), 'C-en');
  assert.equal(SA.i18n.tFor('en', 'b', null, dict), 'B-en');
  assert.equal(SA.i18n.tFor('en', 'missing', null, dict), 'missing');
});

test('removing a real Santali string falls back to Hindi', () => {
  assert.equal(SA.i18n.tFor('sat', 'home.greeting', { name: 'X' }), 'ᱡᱚᱦᱟᱨ, X');
  const dict = { en: SA.STRINGS.en, hi: SA.STRINGS.hi, sat: {} };
  assert.equal(SA.i18n.tFor('sat', 'home.greeting', { name: 'X' }, dict), 'नमस्ते, X');
});

test('scenario titles use the same fallback', () => {
  assert.equal(SA.i18n.pick({ en: 'E', hi: 'H' }, 'sat'), 'H');
  assert.equal(SA.i18n.pick({ en: 'E' }, 'sat'), 'E');
  assert.equal(SA.i18n.pick(SA.scenario.get('gas_confined').title, 'sat'), 'ᱜᱮᱥ ᱞᱤᱠ ᱟᱨ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ');
});

test('interpolation', () => {
  assert.equal(SA.i18n.tFor('en', 'assess.step', { n: 2, total: 3 }), 'Step 2/3');
  assert.equal(SA.i18n.tFor('hi', 'assess.step', { n: 2, total: 3 }), 'चरण 2/3');
});

test('Hindi dictionary is complete; hi/sat have no keys missing from English', () => {
  const en = Object.keys(SA.STRINGS.en);
  const missingHi = en.filter((k) => !(k in SA.STRINGS.hi));
  assert.deepEqual(missingHi, []);
  for (const lang of ['hi', 'sat']) {
    const orphan = Object.keys(SA.STRINGS[lang]).filter((k) => !(k in SA.STRINGS.en));
    assert.deepEqual(orphan, [], lang);
  }
});

// ---------------- storage ----------------

test('TC-001 language + worker persist across reloads', () => {
  const backend = memoryStorage();
  assert.equal(SA.store.init(backend), 'new');
  SA.store.update((s) => { s.settings.language = 'hi'; s.worker = { id: 'JH-1', name: 'Ramesh Munda' }; });
  assert.equal(SA.store.init(backend), 'ok');
  assert.equal(SA.store.get().settings.language, 'hi');
  assert.deepEqual(SA.store.get().worker, { id: 'JH-1', name: 'Ramesh Munda' });
  assert.ok(backend.getItem('sa_v1'));
});

test('corrupted JSON resets state and reports "reset"', () => {
  const backend = memoryStorage({ sa_v1: '{not json' });
  assert.equal(SA.store.init(backend), 'reset');
  assert.deepEqual(SA.store.get(), SA.store.defaultState());
  assert.doesNotThrow(() => JSON.parse(backend.getItem('sa_v1')));
});

test('non-object JSON (array/number/null) resets', () => {
  for (const raw of ['[]', '42', 'null', '"x"']) {
    assert.equal(SA.store.init(memoryStorage({ sa_v1: raw })), 'reset', raw);
  }
});

test('untrusted fields are sanitized individually', () => {
  const raw = {
    worker: { id: 'JH-1', name: 'Ramesh Munda', aadhaar: '1234' },
    attempts: [
      { id: 'ok', workerId: 'JH-1', module: 'fire_explosion', steps: 3, wrong: 0, score: 100, passed: true, startedMs: 1, completedMs: 2 },
      { id: 'forged-score', workerId: 'JH-1', module: 'fire_explosion', steps: 3, wrong: 2, score: 100, passed: true, startedMs: 1, completedMs: 2 },
      { id: 'bad-module', workerId: 'JH-1', module: 'machinery', steps: 3, wrong: 0, score: 100, passed: true, startedMs: 1, completedMs: 2 },
      'garbage'
    ],
    certs: [{ body: '<b>', sig: 'zz', issuedMs: 1, expiryMs: 2, attemptId: 'ok', workerId: 'JH-1' }],
    last: { attemptId: 'forged-score' },
    retention: { demoOffsetMs: -5 },
    settings: { language: 'fr' }
  };
  assert.equal(SA.store.init(memoryStorage({ sa_v1: JSON.stringify(raw) })), 'ok');
  const s = SA.store.get();
  assert.deepEqual(s.worker, { id: 'JH-1', name: 'Ramesh Munda' }); // extra field dropped
  assert.deepEqual(s.attempts.map((a) => a.id), ['ok']);
  assert.deepEqual(s.certs, []);
  assert.deepEqual(s.last, {});
  assert.equal(s.retention.demoOffsetMs, 0);
  assert.equal(s.settings.language, null);
});

test('localStorage unavailable -> in-memory mode, app keeps working', () => {
  assert.equal(SA.store.init(null), 'unavailable');
  SA.store.update((s) => { s.settings.language = 'en'; });
  assert.equal(SA.store.get().settings.language, 'en');
  const throwing = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('x'); }, removeItem() {} };
  assert.equal(SA.store.init(throwing), 'unavailable');
});

test('failed writes (quota) do not crash updates', () => {
  const backend = memoryStorage();
  SA.store.init(backend);
  backend.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.doesNotThrow(() => SA.store.update((s) => { s.settings.language = 'sat'; }));
  assert.equal(SA.store.get().settings.language, 'sat');
});

// ---------------- validation ----------------

test('worker name / ID validation', () => {
  const V = SA.validation;
  assert.equal(V.checkName(V.normalizeName('  Ramesh   Munda ')), null);
  assert.equal(V.normalizeName('  Ramesh   Munda '), 'Ramesh Munda');
  assert.equal(V.checkName('सुनीता हेम्ब्रम'), null);
  assert.equal(V.checkName(''), 'required');
  assert.equal(V.checkName('R'), 'invalid');
  assert.equal(V.checkName('<script>'), 'invalid');
  assert.equal(V.checkName('x'.repeat(61)), 'invalid');
  assert.equal(V.checkWorkerId(V.normalizeWorkerId(' jh-1024 ')), null);
  assert.equal(V.normalizeWorkerId(' jh-1024 '), 'JH-1024');
  assert.equal(V.checkWorkerId(''), 'required');
  assert.equal(V.checkWorkerId('JH 1024'), 'invalid');
  assert.equal(V.checkWorkerId('A'.repeat(21)), 'invalid');
});
