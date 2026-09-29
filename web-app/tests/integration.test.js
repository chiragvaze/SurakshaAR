'use strict';
/*
 * Integration: worker -> module -> result -> certificate -> verification -> +7 days,
 * and the future Unity/Android bridge contract, all through the real services.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, memoryStorage, play } = require('./helpers/load');

const SA = load();
const DAY = 24 * 60 * 60 * 1000;

function freshWorker() {
  SA.store.init(memoryStorage());
  SA.store.update((s) => { s.settings.language = 'hi'; s.worker = { id: 'JH-2001', name: 'Demo Worker' }; });
}

test('Fire pass -> attempt -> certificate -> VALID -> tamper -> INVALID', () => {
  freshWorker();
  const attempt = SA.training.completeAssessment(play(SA, 'fire_explosion', ['correct', 'correct', 'correct']));
  assert.equal(attempt.score, 100);
  assert.equal(attempt.passed, true);
  assert.equal(SA.training.lastAttempt(SA.store.get()).id, attempt.id);
  assert.equal(SA.store.get().inProgress, null);

  const cert = SA.training.issueCertificate(attempt.id);
  assert.equal(SA.training.issueCertificate(attempt.id).sig, cert.sig, 'reused, not duplicated');
  assert.equal(SA.store.get().certs.length, 1);

  const payload = SA.certificate.toPayload(SA.training.latestCertificate(SA.store.get(), 'JH-2001'));
  const now = SA.clock.now(SA.store.get());
  const ok = SA.certificate.verify(payload, now);
  assert.equal(ok.valid, true);
  assert.deepEqual([ok.cert.name, ok.cert.module, ok.cert.score], ['Demo Worker', 'fire_explosion', 100]);
  assert.equal(SA.certificate.verify(SA.certificate.demoTamper(payload), now).valid, false);
});

test('failed attempt cannot get a certificate', () => {
  freshWorker();
  const attempt = SA.training.completeAssessment(play(SA, 'gas_confined', ['wrong', 'correct', 'wrong']));
  assert.equal(attempt.score, 33);
  assert.throws(() => SA.training.issueCertificate(attempt.id), /CERT_NOT_ELIGIBLE/);
});

test('+7 days: retention of this worker becomes Refresher Due; verification uses logical time', () => {
  freshWorker();
  const attempt = SA.training.completeAssessment(play(SA, 'fire_explosion', ['correct', 'correct', 'correct']));
  const cert = SA.training.issueCertificate(attempt.id);
  const rec = () => SA.retention.summarize(SA.retention.workerRecord(SA.store.get().attempts, 'JH-2001'), SA.clock.now(SA.store.get()));
  assert.equal(rec().refresherDue, false);
  SA.store.update((s) => { s.retention.demoOffsetMs += 7 * DAY; });
  assert.deepEqual([rec().daysSince, rec().risk, rec().status, rec().refresherDue], [7, 35, 'amber', true]);
  // Completing a refresher (new training at logical time) resets days_since.
  SA.training.completeAssessment(play(SA, 'fire_explosion', ['correct', 'correct', 'correct']));
  assert.equal(rec().refresherDue, false);
  // Jump past the certificate expiry in logical time -> INVALID (expired).
  SA.store.update((s) => { s.retention.demoOffsetMs = 400 * DAY; });
  assert.equal(SA.certificate.verify(SA.certificate.toPayload(cert), SA.clock.now(SA.store.get())).reason, 'expired');
});

test('completeAssessment requires a worker and rejects unknown modules / inconsistent results', () => {
  SA.store.init(memoryStorage());
  assert.throws(() => SA.training.completeAssessment({ module: 'fire_explosion', wrong: 0, completed: true }), /NO_WORKER/);
  freshWorker();
  const bad = [
    { module: 'machinery', wrong: 0, completed: true },
    { module: 'fire_explosion', wrong: 4, completed: true },
    { module: 'fire_explosion', wrong: 0, completed: false },
    { module: 'fire_explosion', wrong: 2, score: 100, completed: true },
    { module: 'fire_explosion', steps: 5, wrong: 0, completed: true },
    null
  ];
  bad.forEach((r, i) => assert.throws(() => SA.training.completeAssessment(r), /RESULT_REJECTED/, 'case ' + i));
  assert.equal(SA.store.get().attempts.length, 0);
});

test('in-progress session persists and resumes, and is dropped if invalid', () => {
  freshWorker();
  const s = SA.training.startSession('gas_confined');
  const sc = SA.scenario.get('gas_confined');
  SA.training.saveSession(SA.scenario.answer(sc, s, sc.steps[0].correct).session);
  assert.equal(SA.training.getSession('gas_confined').answers[0], 'red_zone');
  assert.equal(SA.training.getSession('fire_explosion'), null);
  SA.store.update((st) => { st.inProgress.answers[0] = 'hacked'; });
  assert.equal(SA.training.getSession('gas_confined'), null);
});

// ---------------- Phase 2 bridge contract ----------------

test('bridge: without window.Android the web trainer is used', () => {
  delete globalThis.Android;
  assert.equal(SA.bridge.isARAvailable(), false);
  assert.equal(SA.bridge.launch('fire_explosion', 'hi'), 'web');
  assert.throws(() => SA.bridge.launch('machinery', 'hi'), /BRIDGE_BAD_ARGS/);
});

test('bridge: Android.launchAR(module, lang) is called when present', () => {
  const calls = [];
  globalThis.Android = { launchAR: (m, l) => calls.push([m, l]) };
  try {
    assert.equal(SA.bridge.launch('gas_confined', 'sat'), 'ar');
    assert.deepEqual(calls, [['gas_confined', 'sat']]);
  } finally {
    delete globalThis.Android;
  }
});

test('bridge: onARError reports cancellation, stores nothing, sanitizes the code', () => {
  freshWorker();
  let notified = null;
  SA.bridge.onResult((o) => { notified = o; });
  assert.deepEqual(globalThis.SurakshaAR.onARError('user_closed'), { ok: false, cancelled: true, error: 'user_closed' });
  assert.deepEqual(notified, { ok: false, cancelled: true, error: 'user_closed' });
  assert.equal(globalThis.SurakshaAR.onARError('<script>').error, 'unknown');
  assert.equal(globalThis.SurakshaAR.onARError(42).error, 'unknown');
  assert.equal(SA.store.get().attempts.length, 0);
  SA.bridge.onResult(null);
});

test('bridge: after AR is unusable on this phone, Start falls back to the web trainer', () => {
  const calls = [];
  globalThis.Android = { launchAR: (m, l) => calls.push([m, l]) };
  try {
    SA.bridge.resetARAvailability();
    globalThis.SurakshaAR.onARError('user_closed');
    assert.equal(SA.bridge.launch('fire_explosion', 'en'), 'ar', 'closing AR keeps AR available');
    for (const code of ['ar_unsupported', 'camera_denied', 'launch_failed']) {
      SA.bridge.resetARAvailability();
      globalThis.SurakshaAR.onARError(code);
      assert.equal(SA.bridge.launch('fire_explosion', 'en'), 'web', code);
    }
    assert.equal(calls.length, 1);
  } finally {
    SA.bridge.resetARAvailability();
    delete globalThis.Android;
  }
});

test('bridge: Unity result JSON enters the same pipeline (SurakshaAR.onARResult)', () => {
  freshWorker();
  let notified = null;
  SA.bridge.onResult((o) => { notified = o; });
  const out = globalThis.SurakshaAR.onARResult('{"module":"fire_explosion","score":100,"wrong":0,"completed":true}');
  assert.equal(out.ok, true);
  assert.equal(out.attempt.score, 100);
  assert.equal(notified.ok, true);
  assert.equal(SA.training.issueCertificate(out.attempt.id).sig.length, 16);

  assert.equal(globalThis.SurakshaAR.onARResult('{"module":"fire_explosion","score":100,"wrong":2,"completed":true}').ok, false);
  assert.equal(globalThis.SurakshaAR.onARResult('not json').ok, false);
  assert.equal(notified.ok, false);
  SA.bridge.onResult(null);
});
