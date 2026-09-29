/*
 * Logical prototype time (docs/10_RETENTION_DASHBOARD.md, D-007).
 * The device clock is never changed: "+7 days" only adds to a stored offset,
 * logical now = real now + retention.demoOffsetMs. All app timestamps use it.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var DAY_MS = 24 * 60 * 60 * 1000;

  function offsetMs(state) {
    return state && state.retention && Number.isSafeInteger(state.retention.demoOffsetMs) ? state.retention.demoOffsetMs : 0;
  }

  function now(state, realNowMs) {
    return (typeof realNowMs === 'number' ? realNowMs : Date.now()) + offsetMs(state);
  }

  function offsetDays(state) { return Math.round(offsetMs(state) / DAY_MS); }

  SA.clock = { DAY_MS: DAY_MS, now: now, offsetMs: offsetMs, offsetDays: offsetDays };
})(typeof globalThis !== 'undefined' ? globalThis : window);
