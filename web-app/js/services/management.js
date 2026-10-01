/*
 * Local Role-Based Dashboard Prototype: data layer.
 *
 * Every number is derived from the data the worker app already keeps (sa_v1 via SA.store) and
 * from the existing business logic:
 *   - workers, risk, status and refresher come from SA.retention.dashboardRows(), the same rows
 *     as the supervisor dashboard (8 seeded workers + this phone's worker);
 *   - per-module scores come from this phone's stored attempts (seeded workers only record
 *     their latest module);
 *   - certificate validity comes from SA.certificate.verify() at logical time (SA.clock).
 *
 * Only the role session and locally stored module assignments are new. They live in a separate,
 * validated key ("sa_mgmt_v1") so the worker app's state and store.js stay untouched.
 *
 * PROTOTYPE ONLY: role selection is not authentication, and nothing leaves the device.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var KEY = 'sa_mgmt_v1';
  var ROLES = ['trainer', 'officer', 'contractor'];
  var MAX_ASSIGNMENTS = 100;
  var RECENT_CERT_DAYS = 30;
  var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  var backend = null;
  var ready = false;
  var mstate = defaultState();

  function defaultState() { return { v: 1, role: null, assignments: [] }; }

  function isRole(r) { return ROLES.indexOf(r) !== -1; }

  function isDateString(s) {
    var m = typeof s === 'string' && DATE_RE.exec(s);
    if (!m) return false;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }

  function sanitizeAssignment(a) {
    var V = SA.validation;
    if (!V.isPlainObject(a) || typeof a.id !== 'string' || !a.id || a.id.length > 64) return null;
    if (V.checkWorkerId(a.workerId) || !V.isModuleId(a.module) || !isDateString(a.due)) return null;
    if (!V.isSafeInt(a.createdMs, 0, 8640000000000000)) return null;
    return { id: a.id, workerId: a.workerId, module: a.module, due: a.due, createdMs: a.createdMs };
  }

  /** Untrusted stored data -> clean state (same approach as SA.store). */
  function sanitize(raw) {
    var s = defaultState();
    if (!SA.validation.isPlainObject(raw)) return s;
    if (isRole(raw.role)) s.role = raw.role;
    if (Array.isArray(raw.assignments)) s.assignments = raw.assignments.map(sanitizeAssignment).filter(Boolean).slice(-MAX_ASSIGNMENTS);
    return s;
  }

  function detectBackend() {
    try {
      var ls = root.localStorage;
      if (!ls) return null;
      ls.setItem(KEY + '_probe', '1');
      ls.removeItem(KEY + '_probe');
      return ls;
    } catch (e) { return null; }
  }

  /** @param {Storage} [customBackend] injectable for tests. */
  function init(customBackend) {
    backend = customBackend === undefined ? detectBackend() : customBackend;
    ready = true;
    mstate = defaultState();
    if (!backend) return mstate;
    try {
      var raw = backend.getItem(KEY);
      if (raw != null) mstate = sanitize(JSON.parse(raw));
    } catch (e) {
      mstate = defaultState();
    }
    return mstate;
  }

  function save() {
    if (!backend) return false;
    try { backend.setItem(KEY, JSON.stringify(mstate)); return true; } catch (e) { return false; }
  }

  /** Lazily loads on first use, so the worker app boot sequence is unchanged. */
  function ensure() { if (!ready) init(); }

  function get() { ensure(); return mstate; }

  // ---- role session (prototype role selection, not authentication) ----

  function setRole(role) {
    if (!isRole(role)) throw new Error('MGMT_BAD_ROLE');
    ensure();
    mstate = Object.assign({}, mstate, { role: role });
    save();
    return role;
  }

  function logout() {
    ensure();
    mstate = Object.assign({}, mstate, { role: null });
    save();
  }

  // ---- assignments (stored on this device only) ----

  function addAssignment(input, nowMs) {
    ensure();
    var a = sanitizeAssignment({
      id: 'assign-' + nowMs.toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      workerId: input && input.workerId,
      module: input && input.module,
      due: input && input.due,
      createdMs: nowMs
    });
    if (!a) throw new Error('MGMT_BAD_ASSIGNMENT');
    mstate = Object.assign({}, mstate, { assignments: mstate.assignments.concat([a]).slice(-MAX_ASSIGNMENTS) });
    save();
    return a;
  }

  function removeAssignment(id) {
    ensure();
    mstate = Object.assign({}, mstate, { assignments: mstate.assignments.filter(function (a) { return a.id !== id; }) });
    save();
  }

  /** YYYY-MM-DD of a timestamp in local time. */
  function isoDate(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---- roster: one shared view of every worker ----

  function latestByModule(attempts, workerId) {
    var out = {};
    attempts.forEach(function (a) {
      if (a.workerId !== workerId) return;
      if (!out[a.module] || a.completedMs >= out[a.module].completedMs) out[a.module] = a;
    });
    return out;
  }

  function certInfo(state, workerId, nowMs) {
    var mine = state.certs.filter(function (c) { return c.workerId === workerId; });
    if (!mine.length) return { state: 'none', count: 0 };
    var latest = mine[mine.length - 1];
    var res = SA.certificate.verify(SA.certificate.toPayload(latest), nowMs);
    var body = SA.certificate.decodeBody(latest.body);
    return {
      state: res.valid ? 'valid' : 'invalid',
      reason: res.valid ? null : res.reason,
      count: mine.length,
      module: body ? body.module : null,
      issuedMs: latest.issuedMs,
      expiryMs: latest.expiryMs
    };
  }

  function trainingStatus(w) {
    var attempted = SA.validation.MODULE_IDS.filter(function (m) { return w.modules[m]; });
    if (!attempted.length && !w.inProgress) return 'pending';
    if (w.refresherDue) return 'refresher';
    if (w.passedModules.length === SA.validation.MODULE_IDS.length) return 'completed';
    return 'inProgress';
  }

  /**
   * All workers the dashboards show: the supervisor dashboard rows (seeded + this phone's
   * trained worker), plus this phone's worker as "pending" before their first training.
   */
  function roster(state, realNowMs) {
    realNowMs = typeof realNowMs === 'number' ? realNowMs : Date.now();
    var nowMs = SA.clock.now(state, realNowMs);
    var rows = SA.retention.dashboardRows(SA.SEED_WORKERS, state, realNowMs);
    var hasLocal = rows.some(function (r) { return r.local; });
    if (state.worker && !hasLocal) {
      rows.push({ id: state.worker.id, name: state.worker.name, local: true, module: null, score: null, fails: 0, daysSince: null, risk: null, status: null, refresherDue: false, untrained: true });
    }
    return rows.map(function (r) {
      var modules = {};
      if (r.local) {
        var latest = latestByModule(state.attempts, r.id);
        Object.keys(latest).forEach(function (m) { modules[m] = { score: latest[m].score, passed: latest[m].passed }; });
      } else {
        // Seeded records only carry the latest module result.
        modules[r.module] = { score: r.score, passed: SA.scoring.isPass(r.score) };
      }
      var w = Object.assign({}, r, {
        seeded: !r.local,
        modules: modules,
        passedModules: SA.validation.MODULE_IDS.filter(function (m) { return modules[m] && modules[m].passed; }),
        inProgress: !!(r.local && state.inProgress && state.worker && state.worker.id === r.id),
        cert: r.local ? certInfo(state, r.id, nowMs) : { state: 'none', count: 0, seeded: true }
      });
      w.training = trainingStatus(w);
      // VALID = verifies now and the worker is not due a refresher; otherwise it needs attention.
      w.certStatus = w.cert.state === 'none' ? 'none' : (w.cert.state === 'valid' && !w.refresherDue ? 'valid' : 'attention');
      return w;
    });
  }

  function pct(n, d) { return d ? Math.round(100 * n / d) : 0; }
  function count(list, fn) { return list.filter(fn).length; }

  /** Every figure any role dashboard shows, computed once from the shared roster. */
  function summary(state, realNowMs) {
    realNowMs = typeof realNowMs === 'number' ? realNowMs : Date.now();
    var nowMs = SA.clock.now(state, realNowMs);
    var workers = roster(state, realNowMs);
    var total = workers.length;
    var scored = workers.filter(function (w) { return typeof w.score === 'number'; });
    var moduleStats = {};
    SA.validation.MODULE_IDS.forEach(function (m) {
      var passed = count(workers, function (w) { return w.modules[m] && w.modules[m].passed; });
      moduleStats[m] = { passed: passed, attempted: count(workers, function (w) { return !!w.modules[m]; }), pct: pct(passed, total) };
    });
    var completed = count(workers, function (w) { return w.passedModules.length === SA.validation.MODULE_IDS.length; });
    var trained = count(workers, function (w) { return w.passedModules.length > 0; });
    var certs = state.certs.map(function (c) {
      var res = SA.certificate.verify(SA.certificate.toPayload(c), nowMs);
      var body = SA.certificate.decodeBody(c.body);
      var owner = workers.filter(function (w) { return w.local && w.id === c.workerId; })[0];
      return {
        workerId: c.workerId, name: body ? body.name : c.workerId, module: body ? body.module : null,
        score: body ? body.score : null, issuedMs: c.issuedMs, expiryMs: c.expiryMs,
        valid: res.valid, reason: res.valid ? null : res.reason,
        status: res.valid && !(owner && owner.refresherDue) ? 'valid' : 'attention',
        recent: nowMs - c.issuedMs <= RECENT_CERT_DAYS * SA.clock.DAY_MS && c.issuedMs <= nowMs
      };
    }).reverse();
    return {
      nowMs: nowMs,
      offsetDays: SA.clock.offsetDays(state),
      workers: workers,
      total: total,
      trained: trained,
      completed: completed,
      pending: count(workers, function (w) { return w.passedModules.length === 0; }),
      completionPct: pct(completed, total),
      averageScore: scored.length ? Math.round(scored.reduce(function (s, w) { return s + w.score; }, 0) / scored.length) : null,
      refresherDue: count(workers, function (w) { return w.refresherDue; }),
      highRisk: count(workers, function (w) { return w.status === 'red'; }),
      risk: {
        green: count(workers, function (w) { return w.status === 'green'; }),
        amber: count(workers, function (w) { return w.status === 'amber'; }),
        red: count(workers, function (w) { return w.status === 'red'; })
      },
      training: {
        completed: count(workers, function (w) { return w.training === 'completed'; }),
        inProgress: count(workers, function (w) { return w.training === 'inProgress'; }),
        pending: count(workers, function (w) { return w.training === 'pending'; }),
        refresher: count(workers, function (w) { return w.training === 'refresher'; })
      },
      scoreBands: [
        { label: '90–100', n: count(scored, function (w) { return w.score >= 90; }) },
        { label: '70–89', n: count(scored, function (w) { return w.score >= 70 && w.score < 90; }) },
        { label: '50–69', n: count(scored, function (w) { return w.score >= 50 && w.score < 70; }) },
        { label: '0–49', n: count(scored, function (w) { return w.score < 50; }) }
      ],
      modules: moduleStats,
      certs: certs,
      certsValid: count(certs, function (c) { return c.status === 'valid'; }),
      certsAttention: count(certs, function (c) { return c.status === 'attention'; }),
      certsRecent: count(certs, function (c) { return c.recent; }),
      assignments: get().assignments.map(function (a) {
        var w = workers.filter(function (x) { return x.id === a.workerId; })[0];
        return Object.assign({}, a, { name: w ? w.name : a.workerId, overdue: a.due < isoDate(nowMs) });
      })
    };
  }

  SA.management = {
    KEY: KEY,
    ROLES: ROLES,
    PROTOTYPE_ONLY: true,
    init: init,
    get: get,
    sanitize: sanitize,
    setRole: setRole,
    logout: logout,
    addAssignment: addAssignment,
    removeAssignment: removeAssignment,
    isoDate: isoDate,
    roster: roster,
    summary: summary
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
