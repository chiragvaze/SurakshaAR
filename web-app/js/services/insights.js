/*
 * Read-only views derived from existing data for the redesigned screens (Home, Passport,
 * notifications). No new rules for scoring, retention or certificates: everything reuses
 * SA.training, SA.retention and SA.certificate.verify at logical time (SA.clock).
 *
 * Zone clearance is a clearly labelled DEMO rule: a module's hazard area is "cleared" while
 * that module's latest certificate verifies and no refresher is due for it.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var DAY = 24 * 60 * 60 * 1000;
  var EXPIRY_WARN_DAYS = 30;

  function mine(state) {
    var id = state.worker && state.worker.id;
    return state.attempts.filter(function (a) { return a.workerId === id; });
  }

  /** {passed, total, pct, modules: [{id, status}]} — status from SA.training.moduleStatus. */
  function readiness(state) {
    var ids = SA.validation.MODULE_IDS;
    var modules = ids.map(function (id) { return { id: id, status: SA.training.moduleStatus(state, id) }; });
    var passed = modules.filter(function (m) { return m.status.kind === 'passed'; }).length;
    return { passed: passed, total: ids.length, pct: Math.round(100 * passed / ids.length), modules: modules };
  }

  /** Latest stored certificate for this worker and module, decoded. */
  function moduleCert(state, moduleId) {
    var wid = state.worker && state.worker.id;
    for (var i = state.certs.length - 1; i >= 0; i--) {
      var c = state.certs[i];
      if (c.workerId !== wid) continue;
      var body = SA.certificate.decodeBody(c.body);
      if (body && body.module === moduleId) return { stored: c, body: body };
    }
    return null;
  }

  /** Per-module clearance: cleared | refresher | notCleared (demo rule, see header). */
  function clearance(state, nowMs) {
    nowMs = typeof nowMs === 'number' ? nowMs : SA.clock.now(state);
    var attempts = mine(state);
    var zones = SA.validation.MODULE_IDS.map(function (id) {
      var c = moduleCert(state, id);
      if (!c) return { module: id, status: 'notCleared', expiryMs: null };
      var res = SA.certificate.verify(SA.certificate.toPayload(c.stored), nowMs);
      if (!res.valid) return { module: id, status: 'notCleared', expiryMs: c.body.expiryMs, reason: res.reason };
      var passes = attempts.filter(function (a) { return a.module === id && a.passed; });
      var lastPass = passes.length ? passes[passes.length - 1].completedMs : c.stored.issuedMs;
      var due = SA.retention.isRefresherDue(SA.retention.daysSince(lastPass, nowMs));
      return { module: id, status: due ? 'refresher' : 'cleared', expiryMs: c.body.expiryMs };
    });
    return { zones: zones, cleared: zones.filter(function (z) { return z.status === 'cleared'; }).length, total: zones.length };
  }

  /** Consecutive calendar days (ending today or yesterday) with at least one completed attempt. */
  function streak(state, nowMs) {
    nowMs = typeof nowMs === 'number' ? nowMs : SA.clock.now(state);
    var days = {};
    mine(state).forEach(function (a) { days[dayKey(a.completedMs)] = true; });
    var n = 0;
    var cursor = nowMs;
    if (!days[dayKey(cursor)]) cursor -= DAY; // a streak survives until the end of the next day
    while (days[dayKey(cursor)]) { n++; cursor -= DAY; }
    return n;
  }

  function dayKey(ms) { var d = new Date(ms); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }

  /** Retention summary for this worker (existing Retention Guard), or null before training. */
  function retention(state, nowMs) {
    var rec = SA.retention.workerRecord(state.attempts, state.worker && state.worker.id);
    return rec ? SA.retention.summarize(rec, typeof nowMs === 'number' ? nowMs : SA.clock.now(state)) : null;
  }

  function lastAttempt(state) {
    var list = mine(state);
    return list.length ? list.reduce(function (acc, a) { return a.completedMs >= acc.completedMs ? a : acc; }) : null;
  }

  /** The module the worker should do next: in-progress first, then failed, then not started. */
  function nextModule(state) {
    var r = readiness(state);
    var order = ['inProgress', 'failed', 'new'];
    for (var i = 0; i < order.length; i++) {
      for (var j = 0; j < r.modules.length; j++) if (r.modules[j].status.kind === order[i]) return r.modules[j];
    }
    return null;
  }

  /** Worker notifications, derived only from local data. */
  function alerts(state, nowMs) {
    nowMs = typeof nowMs === 'number' ? nowMs : SA.clock.now(state);
    var out = [];
    var wid = state.worker && state.worker.id;
    var attempts = mine(state);
    clearance(state, nowMs).zones.forEach(function (z) {
      var tried = attempts.some(function (a) { return a.module === z.module; });
      if (z.status === 'refresher') {
        var last = attempts.filter(function (a) { return a.module === z.module; }).pop();
        out.push({ kind: 'refresher', tone: 'danger', icon: 'clock', module: z.module, days: last ? SA.retention.daysSince(last.completedMs, nowMs) : 0 });
      } else if (z.status === 'cleared' && z.expiryMs && z.expiryMs - nowMs < EXPIRY_WARN_DAYS * DAY) {
        out.push({ kind: 'expiring', tone: 'warning', icon: 'calendar', module: z.module, expiryMs: z.expiryMs });
      } else if (!tried) {
        out.push({ kind: 'notStarted', tone: 'primary', icon: 'play', module: z.module });
      }
    });
    if (SA.management) {
      SA.management.get().assignments.filter(function (a) { return a.workerId === wid; }).forEach(function (a) {
        out.push({ kind: 'assignment', tone: 'purple', icon: 'clipboard', module: a.module, due: a.due });
      });
    }
    if (SA.safety && wid && !SA.safety.ppeToday(wid, nowMs)) out.push({ kind: 'ppe', tone: 'teal', icon: 'helmet' });
    return out;
  }

  SA.insights = {
    EXPIRY_WARN_DAYS: EXPIRY_WARN_DAYS,
    readiness: readiness,
    moduleCert: moduleCert,
    clearance: clearance,
    streak: streak,
    retention: retention,
    lastAttempt: lastAttempt,
    nextModule: nextModule,
    alerts: alerts
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
