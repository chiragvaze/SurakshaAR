/*
 * Scenario validator (docs/06_SCENARIO_ENGINE.md §Validation):
 *  - known module id, unique step IDs, exactly 3 steps, exactly 3 unique options,
 *    exactly one correct option that is among the options,
 *  - every language resolves to text (English is the terminal fallback, so every
 *    prompt/option/explanation key must exist in English).
 * A module that fails validation is shown as "not available" instead of crashing.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var STEPS_PER_MODULE = 3;
  var OPTIONS_PER_STEP = 3;
  var ID_RE = /^[a-z0-9_]{1,40}$/;

  function stepKeys(step) {
    var keys = ['scn.' + step.id + '.prompt', 'scn.' + step.id + '.why'];
    (step.options || []).forEach(function (opt) { keys.push('scn.' + step.id + '.opt.' + opt); });
    return keys;
  }

  /** @returns {string[]} list of error codes (empty when valid) */
  function validateModule(mod, dict, seenStepIds) {
    var errors = [];
    seenStepIds = seenStepIds || {};
    if (!SA.validation.isPlainObject(mod)) return ['module:not_object'];
    if (!SA.validation.isModuleId(mod.id)) errors.push('module:unknown_id');
    if (!mod.title || typeof mod.title.en !== 'string' || !mod.title.en) errors.push('module:title_missing_en');
    if (!Array.isArray(mod.steps)) return errors.concat('module:steps_not_array');
    if (mod.steps.length !== STEPS_PER_MODULE) errors.push('module:step_count');

    mod.steps.forEach(function (step, i) {
      var p = 'step[' + i + ']:';
      if (!SA.validation.isPlainObject(step)) { errors.push(p + 'not_object'); return; }
      if (typeof step.id !== 'string' || !ID_RE.test(step.id)) { errors.push(p + 'bad_id'); return; }
      if (seenStepIds[step.id]) errors.push(p + 'duplicate_id');
      seenStepIds[step.id] = true;
      if (!Array.isArray(step.options) || step.options.length !== OPTIONS_PER_STEP) {
        errors.push(p + 'option_count');
        return;
      }
      var uniq = {};
      step.options.forEach(function (o) {
        if (typeof o !== 'string' || !ID_RE.test(o)) errors.push(p + 'bad_option_id');
        else if (uniq[o]) errors.push(p + 'duplicate_option');
        uniq[o] = true;
      });
      if (step.options.filter(function (o) { return o === step.correct; }).length !== 1) {
        errors.push(p + 'correct_not_single_option');
      }
      if (dict) {
        stepKeys(step).forEach(function (key) {
          if (!SA.i18n.has(key, dict)) errors.push(p + 'missing_text:' + key);
        });
      }
    });
    return errors;
  }

  /** @returns {{modules: Object<string, object>, errors: Object<string, string[]>}} */
  function validateContent(content, dict) {
    var result = { modules: {}, errors: {} };
    if (!content || !Array.isArray(content.modules)) {
      result.errors._content = ['content:modules_missing'];
      return result;
    }
    var seen = {};
    content.modules.forEach(function (mod, i) {
      var id = mod && typeof mod.id === 'string' ? mod.id : '_module' + i;
      var errs = validateModule(mod, dict, seen);
      if (errs.length) result.errors[id] = errs;
      else result.modules[id] = mod;
    });
    return result;
  }

  SA.scenarioValidator = {
    STEPS_PER_MODULE: STEPS_PER_MODULE,
    OPTIONS_PER_STEP: OPTIONS_PER_STEP,
    validateModule: validateModule,
    validateContent: validateContent
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
