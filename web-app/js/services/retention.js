/*
 * Retention Guard (docs/10_RETENTION_DASHBOARD.md).
 *   risk   = min(100, days_since*5 + fails*15 + (100 - score)/2), rounded to an integer
 *   status = green < 30, amber < 60, red >= 60
 *   refresher due when days_since >= 7 (days since the last completed training;
 *   completing a refresher is itself a training, which resets days_since).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var REFRESHER_DAYS = 7;
  var GREEN_BELOW = 30;
  var AMBER_BELOW = 60;

  function daysSince(lastMs, nowMs) {
    return Math.max(0, Math.floor((nowMs - lastMs) / SA.clock.DAY_MS));
  }

  function computeRisk(days, fails, score) {
    var raw = days * 5 + fails * 15 + (100 - score) / 2;
    return Math.max(0, Math.round(Math.min(100, raw)));
  }

  function riskStatus(risk) {
    if (risk < GREEN_BELOW) return 'green';
    if (risk < AMBER_BELOW) return 'amber';
    return 'red';
  }

  function isRefresherDue(days) { return days >= REFRESHER_DAYS; }

  /** @param {{lastTrainingMs:number, fails:number, score:number}} rec */
  function summarize(rec, nowMs) {
    var days = daysSince(rec.lastTrainingMs, nowMs);
    var risk = computeRisk(days, rec.fails, rec.score);
    return {
      daysSince: days,
      risk: risk,
      status: riskStatus(risk),
      refresherDue: isRefresherDue(days),
      daysUntilRefresher: Math.max(0, REFRESHER_DAYS - days)
    };
  }

  /** Retention record for a worker from their local attempts, or null if none. */
  function workerRecord(attempts, workerId) {
    var mine = attempts.filter(function (a) { return a.workerId === workerId; });
    if (!mine.length) return null;
    var latest = mine.reduce(function (acc, a) { return a.completedMs >= acc.completedMs ? a : acc; });
    return {
      module: latest.module,
      score: latest.score,
      fails: mine.filter(function (a) { return !a.passed; }).length,
      lastTrainingMs: latest.completedMs
    };
  }

  /**
   * Dashboard rows: seeded workers + this phone's worker (if they have trained),
   * sorted by risk (highest first).
   */
  function dashboardRows(seed, state, realNowMs) {
    var nowMs = SA.clock.now(state, realNowMs);
    var rows = seed.map(function (w) {
      var rec = { module: w.module, score: w.score, fails: w.fails, lastTrainingMs: realNowMs - w.daysAgo * SA.clock.DAY_MS };
      return Object.assign({ id: w.id, name: w.name, local: false, module: w.module, score: w.score, fails: w.fails }, summarize(rec, nowMs));
    });
    if (state.worker) {
      var rec = workerRecord(state.attempts, state.worker.id);
      if (rec) {
        rows.push(Object.assign({ id: state.worker.id, name: state.worker.name, local: true, module: rec.module, score: rec.score, fails: rec.fails }, summarize(rec, nowMs)));
      }
    }
    return rows.sort(function (a, b) { return b.risk - a.risk; });
  }

  SA.retention = {
    REFRESHER_DAYS: REFRESHER_DAYS,
    daysSince: daysSince,
    computeRisk: computeRisk,
    riskStatus: riskStatus,
    isRefresherDue: isRefresherDue,
    summarize: summarize,
    workerRecord: workerRecord,
    dashboardRows: dashboardRows
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
