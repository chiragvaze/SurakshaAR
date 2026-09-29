/*
 * Local-first state in localStorage under key "sa_v1" (docs/05_DATA_MODEL.md).
 *
 * Stored data is treated as untrusted: on load every field is validated and anything
 * malformed is dropped. Unparseable JSON resets the state (status "reset"). If
 * localStorage is unavailable the app keeps working in memory (status "unavailable").
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var KEY = 'sa_v1';
  var MAX_ATTEMPTS = 200;
  var MAX_CERTS = 50;
  var MAX_OFFSET_MS = 3650 * 24 * 60 * 60 * 1000;
  var CERT_BODY_RE = /^[A-Za-z0-9+/]{4,2048}={0,2}$/;
  var SIG_RE = /^[0-9a-f]{16}$/;

  var backend = null;
  var state = defaultState();
  var status = 'new';

  function defaultState() {
    return {
      v: 1,
      worker: null,
      attempts: [],
      certs: [],
      last: {},
      inProgress: null,
      retention: { demoOffsetMs: 0 },
      settings: { language: null }
    };
  }

  function isStr(v, max) { return typeof v === 'string' && v.length > 0 && v.length <= max; }
  function isTs(v) { return SA.validation.isSafeInt(v, 0, 8640000000000000); }

  function sanitizeWorker(w) {
    if (!SA.validation.isPlainObject(w)) return null;
    if (SA.validation.checkName(w.name) || SA.validation.checkWorkerId(w.id)) return null;
    return { id: w.id, name: w.name };
  }

  function sanitizeAttempt(a) {
    var V = SA.validation;
    if (!V.isPlainObject(a) || !isStr(a.id, 64) || V.checkWorkerId(a.workerId) || !V.isModuleId(a.module)) return null;
    if (!V.isSafeInt(a.steps, 1, 20) || !V.isSafeInt(a.wrong, 0, a.steps)) return null;
    // Recompute instead of trusting stored score/pass flags.
    var ev = SA.scoring.evaluate(a.steps, a.wrong);
    if (a.score !== ev.score || a.passed !== ev.passed) return null;
    if (!isTs(a.startedMs) || !isTs(a.completedMs)) return null;
    return {
      id: a.id, workerId: a.workerId, module: a.module, steps: a.steps, wrong: a.wrong,
      score: ev.score, passed: ev.passed, startedMs: a.startedMs, completedMs: a.completedMs
    };
  }

  function sanitizeCert(c) {
    if (!SA.validation.isPlainObject(c)) return null;
    if (typeof c.body !== 'string' || !CERT_BODY_RE.test(c.body) || typeof c.sig !== 'string' || !SIG_RE.test(c.sig)) return null;
    if (!isTs(c.issuedMs) || !isTs(c.expiryMs) || !isStr(c.attemptId, 64) || SA.validation.checkWorkerId(c.workerId)) return null;
    return { body: c.body, sig: c.sig, issuedMs: c.issuedMs, expiryMs: c.expiryMs, attemptId: c.attemptId, workerId: c.workerId };
  }

  function compact(list, fn, max) {
    if (!Array.isArray(list)) return [];
    return list.map(fn).filter(Boolean).slice(-max);
  }

  /** Build a clean state from untrusted parsed data. */
  function sanitize(raw) {
    var s = defaultState();
    if (!SA.validation.isPlainObject(raw)) return s;
    s.worker = sanitizeWorker(raw.worker);
    s.attempts = compact(raw.attempts, sanitizeAttempt, MAX_ATTEMPTS);
    s.certs = compact(raw.certs, sanitizeCert, MAX_CERTS);
    if (SA.validation.isPlainObject(raw.last) && s.attempts.some(function (a) { return a.id === raw.last.attemptId; })) {
      s.last = { attemptId: raw.last.attemptId };
    }
    // Structure is re-checked against the scenario by SA.scenario.isValidSession before use.
    if (SA.validation.isPlainObject(raw.inProgress) && SA.validation.isModuleId(raw.inProgress.module)) {
      s.inProgress = raw.inProgress;
    }
    if (SA.validation.isPlainObject(raw.retention) && SA.validation.isSafeInt(raw.retention.demoOffsetMs, 0, MAX_OFFSET_MS)) {
      s.retention.demoOffsetMs = raw.retention.demoOffsetMs;
    }
    if (SA.validation.isPlainObject(raw.settings) && SA.validation.isLanguage(raw.settings.language)) {
      s.settings.language = raw.settings.language;
    }
    return s;
  }

  function detectBackend() {
    try {
      var ls = root.localStorage;
      if (!ls) return null;
      ls.setItem(KEY + '_probe', '1');
      ls.removeItem(KEY + '_probe');
      return ls;
    } catch (e) {
      return null;
    }
  }

  /**
   * Load state. @param {Storage} [customBackend] injectable for tests.
   * @returns {'new'|'ok'|'reset'|'unavailable'}
   */
  function init(customBackend) {
    backend = customBackend === undefined ? detectBackend() : customBackend;
    state = defaultState();
    if (!backend) return (status = 'unavailable');
    var raw;
    try {
      raw = backend.getItem(KEY);
    } catch (e) {
      backend = null;
      return (status = 'unavailable');
    }
    if (raw == null) return (status = 'new');
    try {
      var parsed = JSON.parse(raw);
      if (!SA.validation.isPlainObject(parsed)) throw new Error('not an object');
      state = sanitize(parsed);
      status = 'ok';
    } catch (e) {
      state = defaultState();
      status = 'reset';
      save();
    }
    return status;
  }

  function save() {
    if (!backend) return false;
    try {
      backend.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      if (root.console) root.console.error('[store] save failed', e);
      return false;
    }
  }

  /** Apply a mutation to a copy of the state, then commit and persist it. */
  function update(mutator) {
    var draft = JSON.parse(JSON.stringify(state));
    mutator(draft);
    state = draft;
    save();
    return state;
  }

  SA.store = {
    KEY: KEY,
    MAX_ATTEMPTS: MAX_ATTEMPTS,
    MAX_CERTS: MAX_CERTS,
    init: init,
    get: function () { return state; },
    status: function () { return status; },
    update: update,
    sanitize: sanitize,
    defaultState: defaultState
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
