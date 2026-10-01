/*
 * Local Role-Based Dashboard Prototype: data layer + screen rendering (with a minimal fake DOM).
 * Existing worker-flow behaviour is covered by the other test files and must stay unchanged.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { load, memoryStorage, play } = require('./helpers/load');
const dom = require('./helpers/fakedom');

const SA = load();
dom.install();
['js/components/dom.js', 'js/components/ui.js', 'js/i18n/mgmt-strings.js', 'js/services/management.js', 'js/screens/management.js']
  .forEach((f) => require(path.join(__dirname, '..', f)));

const DAY = SA.clock.DAY_MS;
const M = SA.management;

/** Fresh worker store + management store. Optionally Ramesh Kumar with Fire/Gas results and a Fire certificate. */
function setup(opts = {}) {
  const ws = memoryStorage();
  const ms = memoryStorage();
  SA.store.init(ws);
  M.init(ms);
  if (opts.worker !== false) {
    SA.store.update((s) => { s.settings.language = 'hi'; s.worker = { id: 'JH-2001', name: 'Ramesh Kumar' }; });
  }
  if (opts.train) {
    const fire = SA.training.completeAssessment(play(SA, 'fire_explosion', opts.fire || ['correct', 'correct', 'correct']));
    SA.training.completeAssessment(play(SA, 'gas_confined', opts.gas || ['correct', 'correct', 'correct']));
    if (opts.cert !== false && fire.passed) SA.training.issueCertificate(fire.id);
  }
  return { ws, ms };
}

function render(param, query) {
  const nav = { navigate: null, redirect: null };
  const ctx = {
    t: SA.i18n.t, lang: 'hi', state: SA.store.get(), store: SA.store, param: param || null, query: query || {},
    navigate: (h) => { nav.navigate = h; }, redirect: (h) => { nav.redirect = h; }, rerender: () => {}
  };
  return { node: SA.screens.manage(ctx), nav };
}

const text = (node) => (node ? node.textContent : '');
const local = (sum) => sum.workers.find((w) => w.local);

test('trainer dashboard renders summary cards, progress and worker cards from local data', () => {
  setup({ train: true });
  M.setRole('trainer');
  const { node, nav } = render('trainer');
  assert.equal(nav.redirect, null);
  assert.match(text(dom.byId(node, 'mgmt-total')), /^9/);
  assert.match(text(dom.byId(node, 'mgmt-completed')), /^1/);
  assert.match(text(dom.byId(node, 'mgmt-avg')), /^74/); // (100+100+67+100+33+67+0+100 seeded + 100 local) / 9
  assert.match(text(dom.byId(node, 'mgmt-due')), /^2/);
  assert.ok(dom.byId(node, 'mgmt-progress'));
  const cards = dom.byClass(node, 'mcard');
  assert.equal(cards.length, 9);
  const ramesh = cards.find((c) => c.getAttribute('data-worker') === 'JH-2001');
  for (const s of ['Ramesh Kumar', 'JH-2001', 'Fire', 'Gas', '100', 'COMPLETED', 'GREEN', 'Current']) assert.ok(text(ramesh).includes(s), s);
});

test('mine safety officer dashboard renders compliance, risk, trends, certificates and a prototype near-miss section', () => {
  setup({ train: true });
  M.setRole('officer');
  const { node } = render('officer');
  for (const id of ['mgmt-total', 'mgmt-trained', 'mgmt-due', 'mgmt-highrisk', 'mgmt-certs-valid', 'mgmt-certs-attention', 'mgmt-risk', 'mgmt-training-chart', 'mgmt-score-chart']) {
    assert.ok(dom.byId(node, id), id);
  }
  assert.match(text(dom.byId(node, 'mgmt-certs-valid')), /^1/);
  const nearMiss = dom.byId(node, 'mgmt-sec-nearmiss');
  assert.ok(text(nearMiss).includes('Near-Miss Reports — Prototype'));
  assert.ok(text(nearMiss).includes('No near-miss reports recorded.'));
  assert.equal(dom.byClass(nearMiss, 'mcard').length, 0, 'no fabricated near-miss records');
  const certs = render('officer', { view: 'certificates' }).node;
  assert.equal(dom.byAttr(certs, 'data-cert').length, 1);
  assert.ok(text(certs).includes('VALID'));
});

test('contractor dashboard renders workforce summary, completion and certificate status', () => {
  setup({ train: true });
  M.setRole('contractor');
  const { node } = render('contractor');
  assert.match(text(dom.byId(node, 'mgmt-total')), /^9/);
  assert.match(text(dom.byId(node, 'mgmt-trained')), /^5/); // 4 seeded passes + this device's worker
  assert.match(text(dom.byId(node, 'mgmt-pending')), /^4/);
  assert.equal(text(dom.byId(node, 'mgmt-completion')), '11%');
  const ramesh = dom.byAttr(node, 'data-worker').find((c) => c.getAttribute('data-worker') === 'JH-2001');
  assert.ok(text(ramesh).includes('2 / 2'));
  assert.ok(text(ramesh).includes('VALID'));
});

test('all roles use the same rows as the existing supervisor dashboard', () => {
  setup({ train: true });
  const now = Date.now();
  const rows = SA.retention.dashboardRows(SA.SEED_WORKERS, SA.store.get(), now);
  const sum = M.summary(SA.store.get(), now);
  assert.equal(sum.workers.length, rows.length);
  for (const r of rows) {
    const w = sum.workers.find((x) => x.id === r.id);
    assert.ok(w, r.id);
    assert.deepEqual([w.name, w.risk, w.status, w.refresherDue, w.daysSince, w.score, w.fails], [r.name, r.risk, r.status, r.refresherDue, r.daysSince, r.score, r.fails], r.id);
  }
  const seeded = sum.workers.filter((w) => w.seeded).map((w) => w.id).sort();
  assert.deepEqual(seeded, SA.SEED_WORKERS.map((w) => w.id).sort(), 'existing seeded demo workers kept');
  // The same worker card values appear for every role.
  for (const role of M.ROLES) {
    M.setRole(role);
    const card = dom.byAttr(render(role, { view: role === 'officer' ? 'risk' : 'workers' }).node, 'data-worker').find((c) => c.getAttribute('data-worker') === 'JH-2001');
    assert.ok(text(card).includes('Ramesh Kumar') && text(card).includes('GREEN') && text(card).includes('COMPLETED'), role);
  }
});

test('scores: per-module results from local attempts, average of latest scores, pass mark 70', () => {
  setup({ train: true, fire: ['correct', 'wrong', 'correct'], cert: false });
  const w = local(M.summary(SA.store.get()));
  assert.deepEqual(w.modules.fire_explosion, { score: 67, passed: false });
  assert.deepEqual(w.modules.gas_confined, { score: 100, passed: true });
  assert.deepEqual(w.passedModules, ['gas_confined']);
  assert.equal(w.training, 'inProgress');
  const sum = M.summary(SA.store.get());
  const scored = sum.workers.map((x) => x.score);
  assert.equal(sum.averageScore, Math.round(scored.reduce((a, b) => a + b, 0) / scored.length));
  // Seeded workers only record their latest module; the other module is shown as "no record".
  const seeded = sum.workers.find((x) => x.id === 'JH-1001');
  assert.deepEqual(Object.keys(seeded.modules), ['fire_explosion']);
});

test('risk levels use the existing retention formula and thresholds', () => {
  setup({ train: true });
  const sum = M.summary(SA.store.get());
  for (const w of sum.workers) {
    assert.equal(w.risk, SA.retention.computeRisk(w.daysSince, w.fails, w.score), w.id);
    assert.equal(w.status, SA.retention.riskStatus(w.risk), w.id);
  }
  assert.deepEqual(sum.risk, { green: 4, amber: 3, red: 2 });
});

test('refresher due at 7+ days; +7 days and Reset (logical time) move every dashboard', () => {
  setup({ train: true });
  assert.equal(M.summary(SA.store.get()).refresherDue, 2);
  SA.store.update((s) => { s.retention.demoOffsetMs = 7 * DAY; });
  const after = M.summary(SA.store.get());
  assert.equal(after.refresherDue, 9);
  assert.deepEqual(after.risk, { green: 0, amber: 4, red: 5 });
  const w = local(after);
  assert.equal(w.daysSince, 7);
  assert.equal(w.refresherDue, true);
  assert.equal(w.training, 'refresher');
  assert.equal(w.risk, 35);
  SA.store.update((s) => { s.retention.demoOffsetMs = 0; });
  const reset = M.summary(SA.store.get());
  assert.equal(reset.refresherDue, 2);
  assert.equal(local(reset).training, 'completed');
});

test('certificate status: VALID, ATTENTION when refresher due / expired / tampered, none for seeded workers', () => {
  setup({ train: true });
  let sum = M.summary(SA.store.get());
  assert.equal(local(sum).certStatus, 'valid');
  assert.equal(sum.certsValid, 1);
  assert.equal(sum.certsRecent, 1);
  assert.ok(sum.workers.filter((x) => x.seeded).every((x) => x.certStatus === 'none'));

  SA.store.update((s) => { s.retention.demoOffsetMs = 7 * DAY; });
  sum = M.summary(SA.store.get());
  assert.equal(local(sum).certStatus, 'attention');
  assert.equal(sum.certsAttention, 1);
  SA.store.update((s) => { s.retention.demoOffsetMs = 0; });

  const expired = M.summary(SA.store.get(), Date.now() + 400 * DAY);
  assert.equal(expired.certs[0].valid, false);
  assert.equal(expired.certs[0].reason, 'expired');
  assert.equal(expired.certs[0].status, 'attention');

  // A stored certificate whose signature was altered no longer verifies (existing verify()).
  SA.store.update((s) => { s.certs[0].sig = s.certs[0].sig.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')); });
  sum = M.summary(SA.store.get());
  assert.equal(sum.certs[0].valid, false);
  assert.equal(sum.certs[0].reason, 'signature');
  assert.equal(local(sum).certStatus, 'attention');
});

test('role switching: each dashboard needs its role; other roles go back to role selection', () => {
  setup({ train: true });
  assert.equal(render('trainer').nav.redirect, '#/manage', 'no role selected yet');
  const r = render(null);
  assert.deepEqual(dom.byAttr(r.node, 'data-role').map((n) => n.getAttribute('data-role')), ['trainer', 'officer', 'contractor']);
  dom.findAll(r.node, (n) => n.getAttribute('data-role') === 'officer')[0].click();
  assert.equal(M.get().role, 'officer');
  assert.equal(r.nav.navigate, '#/manage/officer');
  assert.equal(render('officer').nav.redirect, null);
  assert.equal(render('trainer').nav.redirect, '#/manage');
  M.setRole('trainer');
  assert.equal(render('trainer').nav.redirect, null);
  assert.equal(render('nonsense').nav.redirect, '#/manage');
  assert.throws(() => M.setRole('admin'), /MGMT_BAD_ROLE/);
});

test('logout clears the persisted role and returns to role selection', () => {
  const { ms } = setup({ train: true });
  M.setRole('contractor');
  assert.equal(JSON.parse(ms.getItem(M.KEY)).role, 'contractor');
  M.init(ms); // reload keeps the role
  assert.equal(M.get().role, 'contractor');
  const r = render('contractor');
  dom.byId(r.node, 'mgmt-logout').click();
  assert.equal(r.nav.navigate, '#/manage');
  assert.equal(M.get().role, null);
  assert.equal(JSON.parse(ms.getItem(M.KEY)).role, null);
  assert.equal(render('contractor').nav.redirect, '#/manage');
});

test('module assignments are validated, stored locally under their own key and survive reload', () => {
  const { ws, ms } = setup({ train: true });
  const nowMs = SA.clock.now(SA.store.get());
  const before = ws.getItem(SA.store.KEY);
  const a = M.addAssignment({ workerId: 'JH-2001', module: 'fire_explosion', due: '2026-10-15' }, nowMs);
  assert.equal(ws.getItem(SA.store.KEY), before, 'worker app state (sa_v1) untouched');
  assert.equal(JSON.parse(ms.getItem(M.KEY)).assignments[0].id, a.id);
  for (const bad of [
    { workerId: 'JH-2001', module: 'machinery', due: '2026-10-15' },
    { workerId: '', module: 'fire_explosion', due: '2026-10-15' },
    { workerId: 'JH-2001', module: 'fire_explosion', due: '2026-02-30' },
    { workerId: 'JH-2001', module: 'fire_explosion', due: '15/10/2026' }
  ]) assert.throws(() => M.addAssignment(bad, nowMs), /MGMT_BAD_ASSIGNMENT/);
  M.init(ms);
  assert.equal(M.get().assignments.length, 1);
  const listed = M.summary(SA.store.get()).assignments[0];
  assert.equal(listed.name, 'Ramesh Kumar');
  assert.equal(listed.overdue, '2026-10-15' < M.isoDate(nowMs));
  M.removeAssignment(a.id);
  assert.equal(M.get().assignments.length, 0);
  // Garbage in storage is dropped field by field.
  const clean = M.sanitize({ role: 'root', assignments: [{ id: 'x', workerId: 'JH-1', module: 'gas_confined', due: '2026-01-01', createdMs: 1 }, { id: 'y', module: 'gas_confined' }, 'junk'] });
  assert.equal(clean.role, null);
  assert.equal(clean.assignments.length, 1);
});

test('assign-module form on the trainer dashboard creates an assignment', () => {
  setup({ train: true });
  M.setRole('trainer');
  const { node } = render('trainer', { view: 'training' });
  dom.byId(node, 'assign-worker').value = 'JH-1003';
  dom.byId(node, 'assign-module').value = 'gas_confined';
  dom.byId(node, 'assign-due').value = '2026-11-01';
  dom.byId(node, 'assign-form').dispatch('submit');
  assert.deepEqual(M.get().assignments.map((x) => [x.workerId, x.module, x.due]), [['JH-1003', 'gas_confined', '2026-11-01']]);
  assert.equal(dom.byAttr(render('trainer', { view: 'training' }).node, 'data-assignment').length, 1);
});

test('this device\'s worker appears as PENDING before training; seeded data is labelled', () => {
  setup({ train: false });
  const sum = M.summary(SA.store.get());
  const w = local(sum);
  assert.equal(w.name, 'Ramesh Kumar');
  assert.equal(w.training, 'pending');
  assert.equal(w.risk, null);
  assert.equal(w.certStatus, 'none');
  assert.equal(sum.total, 9);
  M.setRole('trainer');
  const card = dom.byAttr(render('trainer').node, 'data-worker').find((c) => c.getAttribute('data-worker') === 'JH-1001');
  assert.ok(text(card).includes('seeded demo'));
});

test('management actions never modify the worker app state; no worker -> seeded workers only', () => {
  const { ws } = setup({ train: true });
  const snapshot = ws.getItem(SA.store.KEY);
  M.setRole('officer');
  render('officer');
  render('officer', { view: 'risk' });
  render('officer', { view: 'certificates' });
  M.logout();
  assert.equal(ws.getItem(SA.store.KEY), snapshot);
  setup({ worker: false });
  const sum = M.summary(SA.store.get());
  assert.equal(sum.total, SA.SEED_WORKERS.length);
  assert.ok(sum.workers.every((x) => x.seeded));
});
