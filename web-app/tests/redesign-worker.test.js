/*
 * Redesigned worker app: derived insights, local safety records and the new screens.
 * Existing scoring / retention / certificate behaviour is covered by the original tests.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { load, memoryStorage, play } = require('./helpers/load');
const dom = require('./helpers/fakedom');

const SA = load();
dom.install();
[
  'js/services/prefs.js', 'js/i18n/mgmt-strings.js', 'js/services/management.js', 'js/services/safety.js', 'js/services/insights.js',
  'js/components/dom.js', 'js/components/icons.js', 'js/components/ui.js',
  'js/screens/onboarding.js', 'js/screens/home.js', 'js/screens/me.js', 'js/screens/train.js', 'js/screens/training.js'
].forEach((f) => require(path.join(__dirname, '..', f)));

const DAY = SA.clock.DAY_MS;
const text = (n) => (n ? n.textContent : '');

function setup(opts = {}) {
  const ws = memoryStorage();
  SA.store.init(ws);
  SA.management.init(memoryStorage());
  SA.safety.init(memoryStorage());
  SA.store.update((s) => { s.settings.language = opts.lang || 'hi'; s.worker = { id: 'JH-2001', name: 'Ramesh Kumar' }; });
  let fire = null;
  if (opts.fire) fire = SA.training.completeAssessment(play(SA, 'fire_explosion', opts.fire));
  if (opts.gas) SA.training.completeAssessment(play(SA, 'gas_confined', opts.gas));
  if (opts.cert && fire && fire.passed) SA.training.issueCertificate(fire.id);
  return { ws };
}

function ctx(param, query) {
  const nav = {};
  return {
    nav,
    t: SA.i18n.t, lang: SA.store.get().settings.language, state: SA.store.get(), store: SA.store, param: param || null, query: query || {},
    navigate: (h) => { nav.navigate = h; }, redirect: (h) => { nav.redirect = h; }, rerender: () => {}, safeNext: () => null
  };
}

const OK3 = ['correct', 'correct', 'correct'];

test('readiness counts passed modules; next module prefers failed over not started', () => {
  setup({ fire: ['correct', 'wrong', 'wrong'] });
  let r = SA.insights.readiness(SA.store.get());
  assert.deepEqual([r.passed, r.total, r.pct], [0, 2, 0]);
  assert.equal(SA.insights.nextModule(SA.store.get()).id, 'fire_explosion');
  setup({ fire: OK3, gas: OK3 });
  r = SA.insights.readiness(SA.store.get());
  assert.deepEqual([r.passed, r.pct], [2, 100]);
  assert.equal(SA.insights.nextModule(SA.store.get()), null);
});

test('zone clearance (demo rule): cleared with a valid certificate, refresher due after 7 days, not cleared without one', () => {
  setup({ fire: OK3, gas: OK3, cert: true });
  let c = SA.insights.clearance(SA.store.get());
  assert.deepEqual(c.zones.map((z) => [z.module, z.status]), [['fire_explosion', 'cleared'], ['gas_confined', 'notCleared']]);
  assert.equal(c.cleared, 1);
  SA.store.update((s) => { s.retention.demoOffsetMs = 7 * DAY; });
  c = SA.insights.clearance(SA.store.get());
  assert.equal(c.zones[0].status, 'refresher');
  // Tampered stored certificate no longer clears (existing verify()).
  SA.store.update((s) => { s.retention.demoOffsetMs = 0; s.certs[0].sig = s.certs[0].sig.replace(/^./, (x) => (x === 'a' ? 'b' : 'a')); });
  assert.equal(SA.insights.clearance(SA.store.get()).zones[0].status, 'notCleared');
});

test('streak counts consecutive training days at logical time', () => {
  setup({ fire: OK3 });
  const now = SA.clock.now(SA.store.get());
  assert.equal(SA.insights.streak(SA.store.get(), now), 1);
  assert.equal(SA.insights.streak(SA.store.get(), now + DAY), 1, 'still alive the next day');
  assert.equal(SA.insights.streak(SA.store.get(), now + 3 * DAY), 0);
});

test('worker notifications are derived from local data only', () => {
  setup({ fire: OK3, cert: true });
  let kinds = SA.insights.alerts(SA.store.get()).map((a) => a.kind).sort();
  assert.deepEqual(kinds, ['notStarted', 'ppe']);
  SA.management.addAssignment({ workerId: 'JH-2001', module: 'gas_confined', due: '2026-12-01' }, Date.now());
  SA.safety.addPpe('JH-2001', { helmet: 'yes', vest: 'yes', gloves: 'yes', shoes: 'yes', goggles: 'yes' }, SA.clock.now(SA.store.get()));
  SA.store.update((s) => { s.retention.demoOffsetMs = 8 * DAY; });
  kinds = SA.insights.alerts(SA.store.get()).map((a) => a.kind).sort();
  assert.deepEqual(kinds, ['assignment', 'notStarted', 'ppe', 'refresher'], 'PPE check was on a previous (logical) day');
});

test('safety store: PPE outcomes, review queue, near-miss validation, SOS logged locally with an audit trail', () => {
  const ls = memoryStorage();
  SA.safety.init(ls);
  const now = 1790000000000;
  const all = (v) => ({ helmet: v, vest: v, gloves: v, shoes: v, goggles: v });
  assert.equal(SA.safety.addPpe('JH-2001', all('yes'), now).outcome, 'ready');
  assert.equal(SA.safety.addPpe('JH-2001', Object.assign(all('yes'), { shoes: 'no' }), now).outcome, 'missing');
  const unsure = SA.safety.addPpe('JH-2001', Object.assign(all('yes'), { gloves: 'unsure' }), now);
  assert.equal(unsure.outcome, 'review', 'low confidence is never an automatic fail');
  assert.deepEqual(SA.safety.reviewQueue().map((p) => p.id), [unsure.id]);
  assert.throws(() => SA.safety.addPpe('JH-2001', { helmet: 'yes' }, now), /SAFETY_BAD_PPE/);
  SA.safety.reviewPpe(unsure.id, 'approved', now + 1);
  assert.equal(SA.safety.reviewQueue().length, 0);
  assert.throws(() => SA.safety.reviewPpe(unsure.id, 'approved', now), /SAFETY_NOT_REVIEWABLE/);

  const w = { id: 'JH-2001', name: 'Ramesh Kumar' };
  assert.throws(() => SA.safety.addNearMiss(w, { severity: 'high', location: 'Zone 4', desc: 'short' }, now), /SAFETY_BAD_NEARMISS/);
  assert.throws(() => SA.safety.addNearMiss(w, { severity: 'extreme', location: 'Zone 4', desc: 'Loose rock fell near the conveyor' }, now), /SAFETY_BAD_NEARMISS/);
  const nm = SA.safety.addNearMiss(w, { severity: 'high', location: 'Zone 4', desc: 'Loose rock fell near the conveyor' }, now);
  assert.equal(nm.status, 'open');
  SA.safety.setNearMissStatus(nm.id, 'investigating', now + 2);

  const sos = SA.safety.logSos('JH-2001', 'gas', now);
  assert.equal(sos.status, 'logged', 'never reported as sent');
  assert.throws(() => SA.safety.logSos('JH-2001', 'party', now), /SAFETY_BAD_SOS/);

  // Reload: everything persists under its own key and is re-validated.
  const reloaded = SA.safety.init(ls);
  assert.equal(reloaded.ppe.length, 3);
  assert.equal(reloaded.nearmiss[0].status, 'investigating');
  assert.deepEqual(reloaded.audit.map((a) => a.action), ['ppe.check', 'ppe.check', 'ppe.check', 'ppe.review.approved', 'nearmiss.report', 'nearmiss.investigating', 'sos.logged']);
  const dirty = SA.safety.sanitize({ ppe: [{ id: 'ppe-xxxxx', workerId: 'JH-1', ms: 1, items: all('maybe') }], nearmiss: ['junk'], sos: [{ id: 'sos-xxxxx', workerId: 'JH-1', ms: 1, type: 'gas', status: 'sent' }], audit: [{ ms: 1, action: 'x', by: 'admin' }] });
  assert.deepEqual([dirty.ppe.length, dirty.nearmiss.length, dirty.sos.length, dirty.audit.length], [0, 0, 1, 0]);
  assert.equal(dirty.sos[0].status, 'logged', 'a stored "sent" status cannot be injected');
});

test('Home keeps the ids used by the demo and shows readiness, retention and today\'s safety', () => {
  setup({ fire: OK3, gas: OK3, cert: true });
  const node = SA.screens.home(ctx());
  for (const id of ['module-fire_explosion', 'module-gas_confined', 'home-certificate', 'home-verify', 'home-dashboard', 'home-manage', 'retention-card', 'safety-status', 'readiness-ring', 'today-clearance']) {
    assert.ok(dom.byId(node, id), id);
  }
  assert.ok(text(dom.byId(node, 'safety-status')).includes('100%'));
  assert.ok(text(dom.byId(node, 'today-clearance')).includes('1'));
  assert.ok(text(dom.byId(node, 'retention-card')).includes(SA.i18n.t('retention.risk', { risk: SA.retention.computeRisk(0, 0, 100) })), 'existing risk formula');
  assert.ok(dom.byId(node, 'tab-home'), 'bottom navigation');
});

test('Result shows the real attempt: score, safe choices, accuracy, mistakes', () => {
  setup({ fire: ['correct', 'wrong', 'correct'] });
  const node = SA.screens.result(ctx());
  assert.equal(text(dom.byId(node, 'result-score')), '67');
  assert.ok(text(dom.byId(node, 'result-safe')).startsWith('2/3'));
  assert.ok(text(dom.byId(node, 'result-accuracy')).startsWith('67'));
  assert.ok(text(dom.byId(node, 'result-mistakes')).startsWith('1'));
  assert.ok(dom.byId(node, 'result-retry'), 'failed -> train again, no certificate button');
  assert.equal(dom.byId(node, 'result-cert'), null);
});

test('Briefing shows LEARN → FIND → PROVE and the hazards without revealing answers', () => {
  setup({});
  const node = SA.screens.briefing(ctx('fire_explosion'));
  const steps = dom.byClass(node, 'stepper__item');
  assert.equal(steps.length, 3);
  assert.ok(steps[0].className.includes('is-current'));
  const body = text(node);
  assert.ok(body.includes(SA.i18n.t('scn.fire_01_exit.prompt')));
  assert.ok(!body.includes(SA.i18n.t('scn.fire_01_exit.why')), 'explanations only after answering');
  assert.ok(dom.byId(node, 'briefing-start'));
});

test('language selector: planned languages are listed but not selectable', () => {
  setup({});
  const node = SA.screens.language(ctx());
  assert.deepEqual(dom.byAttr(node, 'data-lang').map((n) => n.getAttribute('data-lang')), ['hi', 'sat', 'en']);
  const planned = dom.byAttr(node, 'data-planned');
  assert.deepEqual(planned.map((n) => n.getAttribute('data-planned')), ['kho', 'nag', 'ho', 'mun']);
  assert.ok(planned.every((n) => n.tagName === 'DIV' && n.getAttribute('aria-disabled') === 'true'));
});
