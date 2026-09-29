/*
 * Web side of the future Web <-> Android <-> Unity boundary (docs/07_API_AND_BRIDGE_CONTRACTS.md).
 * Phase 1 does NOT implement Android or Unity. This file only defines the contract:
 *
 *   Web -> Android:  window.Android.launchAR(module, lang)
 *                    module: "fire_explosion" | "gas_confined", lang: "en" | "hi" | "sat"
 *   Android -> Web:  window.SurakshaAR.onARResult(json)
 *                    json: {"module":"fire_explosion","score":100,"wrong":0,"completed":true}
 *
 * When window.Android is absent (every Phase 1 browser run), launch() returns "web" and
 * the browser scenario engine runs the same assessment. Both paths end in
 * SA.training.completeAssessment(), so scoring/certificate logic is never duplicated.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var resultListener = null;

  function isARAvailable() {
    return !!(root.Android && typeof root.Android.launchAR === 'function');
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

  function report(outcome) {
    if (resultListener) resultListener(outcome);
    return outcome;
  }

  SA.bridge = {
    isARAvailable: isARAvailable,
    launch: launch,
    receiveARResult: receiveARResult,
    onResult: function (fn) { resultListener = fn; }
  };

  // Global entry point the Android shell will call via evaluateJavascript().
  root.SurakshaAR = root.SurakshaAR || {};
  root.SurakshaAR.onARResult = receiveARResult;
})(typeof globalThis !== 'undefined' ? globalThis : window);
