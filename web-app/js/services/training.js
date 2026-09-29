/*
 * Training service: the single pipeline
 *   scenario session -> result -> shared scoring -> attempt -> certificate.
 * Browser assessments (Phase 1) and the future Unity AR result (Phase 2, via
 * services/bridge.js) both enter through completeAssessment().
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  function newId(prefix, nowMs) {
    return prefix + '-' + nowMs.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ---- in-progress session ----

  function getSession(moduleId) {
    var s = SA.store.get().inProgress;
    var scenario = SA.scenario.get(moduleId);
    return scenario && SA.scenario.isValidSession(scenario, s) ? s : null;
  }

  function startSession(moduleId) {
    var scenario = SA.scenario.get(moduleId);
    if (!scenario) throw new Error('MODULE_UNAVAILABLE');
    var session = SA.scenario.createSession(scenario, { nowMs: SA.clock.now(SA.store.get()) });
    SA.store.update(function (s) { s.inProgress = session; });
    return session;
  }

  function saveSession(session) {
    SA.store.update(function (s) { s.inProgress = session; });
  }

  function discardSession() {
    SA.store.update(function (s) { s.inProgress = null; });
  }

  // ---- results ----

  /**
   * Validate an untrusted result ({module, wrong, completed[, score, steps]}).
   * The score is always recomputed; a mismatching reported score is rejected.
   */
  function validateResult(result) {
    if (!SA.validation.isPlainObject(result)) return { ok: false, error: 'not_object' };
    var scenario = SA.scenario.get(result.module);
    if (!scenario) return { ok: false, error: 'unknown_module' };
    var steps = scenario.steps.length;
    if (result.steps !== undefined && result.steps !== steps) return { ok: false, error: 'steps_mismatch' };
    if (result.completed !== true) return { ok: false, error: 'not_completed' };
    if (!SA.validation.isSafeInt(result.wrong, 0, steps)) return { ok: false, error: 'bad_wrong' };
    var ev = SA.scoring.evaluate(steps, result.wrong);
    if (result.score !== undefined && result.score !== ev.score) return { ok: false, error: 'score_mismatch' };
    return { ok: true, value: { module: result.module, steps: steps, wrong: ev.wrong, score: ev.score, passed: ev.passed } };
  }

  /** Record a completed assessment. @returns {object} the stored attempt */
  function completeAssessment(result) {
    var state = SA.store.get();
    if (!state.worker) throw new Error('NO_WORKER');
    var v = validateResult(result);
    if (!v.ok) throw new Error('RESULT_REJECTED:' + v.error);
    var nowMs = SA.clock.now(state);
    var attempt = {
      id: newId('attempt', nowMs),
      workerId: state.worker.id,
      module: v.value.module,
      steps: v.value.steps,
      wrong: v.value.wrong,
      score: v.value.score,
      passed: v.value.passed,
      startedMs: SA.validation.isSafeInt(result.startedMs, 0, nowMs) ? result.startedMs : nowMs,
      completedMs: nowMs
    };
    SA.store.update(function (s) {
      s.attempts.push(attempt);
      if (s.attempts.length > SA.store.MAX_ATTEMPTS) s.attempts = s.attempts.slice(-SA.store.MAX_ATTEMPTS);
      s.last = { attemptId: attempt.id };
      s.inProgress = null;
    });
    return attempt;
  }

  function findAttempt(state, attemptId) {
    for (var i = state.attempts.length - 1; i >= 0; i--) if (state.attempts[i].id === attemptId) return state.attempts[i];
    return null;
  }

  function lastAttempt(state) {
    return state.last && state.last.attemptId ? findAttempt(state, state.last.attemptId) : null;
  }

  /** Home-card status for a module for the current worker. */
  function moduleStatus(state, moduleId) {
    var scenario = SA.scenario.get(moduleId);
    if (!scenario) return { kind: 'unavailable' };
    var s = state.inProgress;
    if (s && s.module === moduleId && SA.scenario.isValidSession(scenario, s)) {
      return { kind: 'inProgress', step: s.stepIndex + 1, total: scenario.steps.length };
    }
    var workerId = state.worker && state.worker.id;
    var mine = state.attempts.filter(function (a) { return a.workerId === workerId && a.module === moduleId; });
    if (!mine.length) return { kind: 'new' };
    var latest = mine[mine.length - 1];
    return { kind: latest.passed ? 'passed' : 'failed', score: latest.score };
  }

  // ---- certificates ----

  /** Issue (or reuse) the certificate for a passed attempt of the current worker. */
  function issueCertificate(attemptId) {
    var state = SA.store.get();
    var attempt = findAttempt(state, attemptId);
    if (!attempt || !attempt.passed || !state.worker || attempt.workerId !== state.worker.id) {
      throw new Error('CERT_NOT_ELIGIBLE');
    }
    var existing = state.certs.filter(function (c) { return c.attemptId === attemptId; })[0];
    if (existing) return existing;
    var cert = SA.certificate.issue({
      name: state.worker.name,
      module: attempt.module,
      score: attempt.score,
      issuedMs: SA.clock.now(state)
    });
    cert.attemptId = attempt.id;
    cert.workerId = attempt.workerId;
    SA.store.update(function (s) {
      s.certs.push(cert);
      if (s.certs.length > SA.store.MAX_CERTS) s.certs = s.certs.slice(-SA.store.MAX_CERTS);
    });
    return cert;
  }

  /** Latest certificate, optionally for one worker. */
  function latestCertificate(state, workerId) {
    for (var i = state.certs.length - 1; i >= 0; i--) {
      if (!workerId || state.certs[i].workerId === workerId) return state.certs[i];
    }
    return null;
  }

  SA.training = {
    getSession: getSession,
    startSession: startSession,
    saveSession: saveSession,
    discardSession: discardSession,
    validateResult: validateResult,
    completeAssessment: completeAssessment,
    findAttempt: findAttempt,
    lastAttempt: lastAttempt,
    moduleStatus: moduleStatus,
    issueCertificate: issueCertificate,
    latestCertificate: latestCertificate
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
