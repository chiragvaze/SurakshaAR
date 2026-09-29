/*
 * Input validation shared by the profile screen, local-storage loading and
 * certificate verification. Only name + worker ID are ever collected (docs/16_PRIVACY.md).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var MODULE_IDS = ['fire_explosion', 'gas_confined'];
  var LANGS = ['en', 'hi', 'sat'];
  var NAME_MAX = 60;
  var ID_MAX = 20;
  // Letters/marks in any script (Devanagari needs \p{M}), spaces, dot, apostrophe, hyphen.
  var NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
  var ID_RE = /^[A-Za-z0-9][A-Za-z0-9/_-]*$/;

  function normalizeName(value) {
    return String(value == null ? '' : value).normalize('NFC').replace(/\s+/g, ' ').trim();
  }

  function normalizeWorkerId(value) {
    return String(value == null ? '' : value).trim().toUpperCase();
  }

  /** @returns {null|'required'|'invalid'} */
  function checkName(value) {
    if (typeof value !== 'string' || value.length === 0) return 'required';
    if (value.length < 2 || value.length > NAME_MAX || !NAME_RE.test(value)) return 'invalid';
    return null;
  }

  /** @returns {null|'required'|'invalid'} */
  function checkWorkerId(value) {
    if (typeof value !== 'string' || value.length === 0) return 'required';
    if (value.length > ID_MAX || !ID_RE.test(value)) return 'invalid';
    return null;
  }

  function isModuleId(value) {
    return typeof value === 'string' && MODULE_IDS.indexOf(value) !== -1;
  }

  function isLanguage(value) {
    return typeof value === 'string' && LANGS.indexOf(value) !== -1;
  }

  function isSafeInt(value, min, max) {
    return Number.isSafeInteger(value) && value >= min && value <= max;
  }

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  SA.validation = {
    MODULE_IDS: MODULE_IDS,
    LANGS: LANGS,
    NAME_MAX: NAME_MAX,
    ID_MAX: ID_MAX,
    normalizeName: normalizeName,
    normalizeWorkerId: normalizeWorkerId,
    checkName: checkName,
    checkWorkerId: checkWorkerId,
    isModuleId: isModuleId,
    isLanguage: isLanguage,
    isSafeInt: isSafeInt,
    isPlainObject: isPlainObject
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
