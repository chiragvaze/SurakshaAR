/*
 * Local safety records under their own key "sa_safety_v1" (sa_v1 is never extended):
 *   ppe       PPE self-checks (manual; no camera detection in this build) + trainer review
 *   nearmiss  near-miss reports written on this device + officer status workflow
 *   sos       emergency events LOGGED on this device (nothing is sent: no network)
 *   audit     append-only trail of every safety action (who/what/when)
 *
 * Stored data is untrusted: everything is validated field by field on load, like store.js.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var KEY = 'sa_safety_v1';
  var PPE_ITEMS = ['helmet', 'vest', 'gloves', 'shoes', 'goggles'];
  var PPE_STATES = ['yes', 'no', 'unsure'];
  var SEVERITIES = ['low', 'medium', 'high'];
  var NM_STATUS = ['open', 'investigating', 'resolved'];
  var SOS_TYPES = ['injury', 'fire', 'gas', 'equipment', 'other'];
  var REVIEW = ['approved', 'rejected'];
  var ACTORS = ['worker', 'trainer', 'officer', 'contractor'];
  var MAX = { ppe: 100, nearmiss: 100, sos: 50, audit: 300 };
  var TEXT_MAX = 500;
  var LOC_MAX = 80;

  var backend = null;
  var data = defaults();
  var initialised = false;

  function defaults() { return { v: 1, ppe: [], nearmiss: [], sos: [], audit: [] }; }

  var V = function () { return SA.validation; };
  function isTs(v) { return V().isSafeInt(v, 0, 8640000000000000); }
  function isId(v) { return typeof v === 'string' && /^[a-z]+-[a-z0-9-]{4,40}$/.test(v); }
  function isText(v, min, max) { return typeof v === 'string' && v.trim().length >= min && v.length <= max; }
  function oneOf(v, list) { return list.indexOf(v) !== -1; }
  function okWorker(v) { return !V().checkWorkerId(v); }

  function ppeOutcome(items) {
    var vals = PPE_ITEMS.map(function (k) { return items[k]; });
    if (vals.indexOf('no') !== -1) return 'missing';
    if (vals.indexOf('unsure') !== -1) return 'review';
    return 'ready';
  }

  function cleanPpe(p) {
    if (!V().isPlainObject(p) || !isId(p.id) || !okWorker(p.workerId) || !isTs(p.ms) || !V().isPlainObject(p.items)) return null;
    var items = {};
    for (var i = 0; i < PPE_ITEMS.length; i++) {
      if (!oneOf(p.items[PPE_ITEMS[i]], PPE_STATES)) return null;
      items[PPE_ITEMS[i]] = p.items[PPE_ITEMS[i]];
    }
    var review = null;
    if (V().isPlainObject(p.review) && oneOf(p.review.decision, REVIEW) && isTs(p.review.ms)) review = { decision: p.review.decision, ms: p.review.ms };
    return { id: p.id, workerId: p.workerId, ms: p.ms, items: items, outcome: ppeOutcome(items), review: review };
  }

  function cleanNearMiss(n) {
    if (!V().isPlainObject(n) || !isId(n.id) || !okWorker(n.workerId) || V().checkName(n.name) || !isTs(n.ms)) return null;
    if (!oneOf(n.severity, SEVERITIES) || !isText(n.location, 2, LOC_MAX) || !isText(n.desc, 10, TEXT_MAX)) return null;
    return { id: n.id, workerId: n.workerId, name: n.name, ms: n.ms, severity: n.severity, location: n.location, desc: n.desc, status: oneOf(n.status, NM_STATUS) ? n.status : 'open' };
  }

  function cleanSos(s) {
    if (!V().isPlainObject(s) || !isId(s.id) || !okWorker(s.workerId) || !isTs(s.ms) || !oneOf(s.type, SOS_TYPES)) return null;
    return { id: s.id, workerId: s.workerId, ms: s.ms, type: s.type, status: 'logged' };
  }

  function cleanAudit(a) {
    if (!V().isPlainObject(a) || !isTs(a.ms) || !isText(a.action, 3, 40) || !/^[a-z.]+$/.test(a.action) || !oneOf(a.by, ACTORS)) return null;
    return { ms: a.ms, action: a.action, ref: isId(a.ref) ? a.ref : null, by: a.by };
  }

  function list(raw, fn, max) { return Array.isArray(raw) ? raw.map(fn).filter(Boolean).slice(-max) : []; }

  function sanitize(raw) {
    var d = defaults();
    if (!V().isPlainObject(raw)) return d;
    d.ppe = list(raw.ppe, cleanPpe, MAX.ppe);
    d.nearmiss = list(raw.nearmiss, cleanNearMiss, MAX.nearmiss);
    d.sos = list(raw.sos, cleanSos, MAX.sos);
    d.audit = list(raw.audit, cleanAudit, MAX.audit);
    return d;
  }

  function detectBackend() {
    try { var ls = root.localStorage; if (!ls) return null; ls.getItem(KEY); return ls; } catch (e) { return null; }
  }

  function init(customBackend) {
    initialised = true;
    backend = customBackend !== undefined ? customBackend : detectBackend();
    data = defaults();
    if (backend) {
      try { var raw = backend.getItem(KEY); if (raw) data = sanitize(JSON.parse(raw)); } catch (e) { data = defaults(); }
    }
    return data;
  }

  function ensure() { if (!initialised) { initialised = true; init(); } }

  function save() {
    if (!backend) return;
    try { backend.setItem(KEY, JSON.stringify(data)); } catch (e) { /* quota: keep in memory */ }
  }

  function newId(prefix, nowMs) { return prefix + '-' + nowMs.toString(36) + '-' + Math.random().toString(36).slice(2, 8); }

  function audit(action, ref, by, nowMs) {
    data.audit.push({ ms: nowMs, action: action, ref: ref, by: by });
    if (data.audit.length > MAX.audit) data.audit = data.audit.slice(-MAX.audit);
  }

  function push(listName, item) {
    data[listName].push(item);
    if (data[listName].length > MAX[listName]) data[listName] = data[listName].slice(-MAX[listName]);
  }

  // ---------------- PPE ----------------

  function addPpe(workerId, items, nowMs) {
    ensure();
    var rec = cleanPpe({ id: newId('ppe', nowMs), workerId: workerId, ms: nowMs, items: items || {}, review: null });
    if (!rec) throw new Error('SAFETY_BAD_PPE');
    push('ppe', rec);
    audit('ppe.check', rec.id, 'worker', nowMs);
    save();
    return rec;
  }

  function reviewPpe(id, decision, nowMs) {
    ensure();
    if (!oneOf(decision, REVIEW)) throw new Error('SAFETY_BAD_REVIEW');
    var rec = data.ppe.filter(function (p) { return p.id === id; })[0];
    if (!rec || rec.outcome !== 'review' || rec.review) throw new Error('SAFETY_NOT_REVIEWABLE');
    rec.review = { decision: decision, ms: nowMs };
    audit('ppe.review.' + decision, id, 'trainer', nowMs);
    save();
    return rec;
  }

  function latestPpe(workerId) {
    ensure();
    for (var i = data.ppe.length - 1; i >= 0; i--) if (data.ppe[i].workerId === workerId) return data.ppe[i];
    return null;
  }

  function sameDay(a, b) {
    var x = new Date(a), y = new Date(b);
    return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  }

  /** Today's latest check for this worker, at logical time. */
  function ppeToday(workerId, nowMs) {
    var p = latestPpe(workerId);
    return p && sameDay(p.ms, nowMs) ? p : null;
  }

  function reviewQueue() {
    ensure();
    return data.ppe.filter(function (p) { return p.outcome === 'review' && !p.review; });
  }

  // ---------------- near-miss ----------------

  function addNearMiss(worker, input, nowMs) {
    ensure();
    var rec = cleanNearMiss({
      id: newId('nm', nowMs), workerId: worker && worker.id, name: worker && worker.name, ms: nowMs,
      severity: input.severity, location: String(input.location || '').trim(), desc: String(input.desc || '').trim(), status: 'open'
    });
    if (!rec) throw new Error('SAFETY_BAD_NEARMISS');
    push('nearmiss', rec);
    audit('nearmiss.report', rec.id, 'worker', nowMs);
    save();
    return rec;
  }

  function setNearMissStatus(id, status, nowMs) {
    ensure();
    if (!oneOf(status, NM_STATUS)) throw new Error('SAFETY_BAD_STATUS');
    var rec = data.nearmiss.filter(function (n) { return n.id === id; })[0];
    if (!rec) throw new Error('SAFETY_NOT_FOUND');
    rec.status = status;
    audit('nearmiss.' + status, id, 'officer', nowMs);
    save();
    return rec;
  }

  // ---------------- SOS ----------------

  /** Records an emergency on this device only. Never sends anything (no network in this build). */
  function logSos(workerId, type, nowMs) {
    ensure();
    var rec = cleanSos({ id: newId('sos', nowMs), workerId: workerId, ms: nowMs, type: type });
    if (!rec) throw new Error('SAFETY_BAD_SOS');
    push('sos', rec);
    audit('sos.logged', rec.id, 'worker', nowMs);
    save();
    return rec;
  }

  SA.safety = {
    KEY: KEY,
    PPE_ITEMS: PPE_ITEMS,
    SEVERITIES: SEVERITIES,
    NM_STATUS: NM_STATUS,
    SOS_TYPES: SOS_TYPES,
    init: init,
    sanitize: sanitize,
    get: function () { ensure(); return data; },
    addPpe: addPpe,
    reviewPpe: reviewPpe,
    latestPpe: latestPpe,
    ppeToday: ppeToday,
    reviewQueue: reviewQueue,
    addNearMiss: addNearMiss,
    setNearMissStatus: setNearMissStatus,
    logSos: logSos
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
