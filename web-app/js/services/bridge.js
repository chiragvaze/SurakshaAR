/*
 * Web side of the future Web <-> Android <-> Unity boundary (docs/07_API_AND_BRIDGE_CONTRACTS.md).
 * Phase 1 does NOT implement Android or Unity. This file only defines the contract:
 *
 *   Web -> Android:  window.Android.launchAR(module, lang)
 *                    module: "fire_explosion" | "gas_confined", lang: "en" | "hi" | "sat"
 *   Android -> Web:  window.SurakshaAR.onARResult(json)
 *                    json: {"module":"fire_explosion","score":100,"wrong":0,"completed":true}
 *                    window.SurakshaAR.onARError(code)   AR closed without a result
 *                    code: user_closed | ar_unsupported | camera_denied | launch_failed | bad_params | bad_result
 *
 * When window.Android is absent (every Phase 1 browser run), launch() returns "web" and
 * the browser scenario engine runs the same assessment. Both paths end in
 * SA.training.completeAssessment(), so scoring/certificate logic is never duplicated.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var resultListener = null;
  // Set when AR cannot run on this phone; later launches use the web trainer instead.
  var arUnusable = false;
  var UNUSABLE_CODES = ['ar_unsupported', 'camera_denied', 'launch_failed'];

  function isARAvailable() {
    return !arUnusable && !!(root.Android && typeof root.Android.launchAR === 'function');
  }

  /** @returns {'ar'|'web'} which trainer was started */
  function launch(moduleId, lang) {
    if (!SA.validation.isModuleId(moduleId) || !SA.validation.isLanguage(lang)) throw new Error('BRIDGE_BAD_ARGS');
    if (isARAvailable()) {
      try {
        root.Android.launchAR(moduleId, lang);
        return 'ar';
      } catch (e) {
        if (root.console) root.console.error('[bridge] launchAR failed, using web trainer', e);
      }
    }
    return 'web';
  }

  /**
   * Called by the Android shell when Unity finishes. Accepts a JSON string or object.
   * @returns {{ok:boolean, attempt?:object, error?:string}}
   */
  function receiveARResult(payload) {
    var result = payload;
    if (typeof payload === 'string') {
      if (payload.length > 1024) return report({ ok: false, error: 'too_large' });
      try { result = JSON.parse(payload); } catch (e) { return report({ ok: false, error: 'bad_json' }); }
    }
    try {
      return report({ ok: true, attempt: SA.training.completeAssessment(result) });
    } catch (e) {
      return report({ ok: false, error: String(e && e.message) });
    }
  }

  /**
   * Called by the Android shell when AR closes without a result (user closed it, AR
   * unsupported, camera denied, launch failed...). Never creates an attempt.
   */
  function receiveARError(code) {
    var c = typeof code === 'string' && /^[a-z_]{1,40}$/.test(code) ? code : 'unknown';
    if (UNUSABLE_CODES.indexOf(c) !== -1) arUnusable = true;
    return report({ ok: false, cancelled: true, error: c });
  }

  function report(outcome) {
    if (resultListener) resultListener(outcome);
    return outcome;
  }

  SA.bridge = {
    isARAvailable: isARAvailable,
    launch: launch,
    receiveARResult: receiveARResult,
    receiveARError: receiveARError,
    resetARAvailability: function () { arUnusable = false; },
    onResult: function (fn) { resultListener = fn; }
  };

  // Global entry point the Android shell will call via evaluateJavascript().
  root.SurakshaAR = root.SurakshaAR || {};
  root.SurakshaAR.onARResult = receiveARResult;
  root.SurakshaAR.onARError = receiveARError;
})(typeof globalThis !== 'undefined' ? globalThis : window);
