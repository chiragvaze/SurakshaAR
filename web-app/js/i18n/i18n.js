/*
 * Translation lookup with the documented fallback chain: sat -> hi -> en.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var CHAINS = { sat: ['sat', 'hi', 'en'], hi: ['hi', 'en'], en: ['en'] };
  var LOCALES = { en: 'en-IN', hi: 'hi-IN', sat: 'hi-IN' };
  var DEFAULT_LANG = 'hi';
  var current = DEFAULT_LANG;
  var warned = {};

  function chain(lang) { return CHAINS[lang] || CHAINS[DEFAULT_LANG]; }

  function interpolate(text, params) {
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m;
    });
  }

  /** Resolve a key for a given language, following the fallback chain. */
  function tFor(lang, key, params, dict) {
    dict = dict || SA.STRINGS;
    var langs = chain(lang);
    for (var i = 0; i < langs.length; i++) {
      var table = dict[langs[i]];
      if (table && typeof table[key] === 'string' && table[key] !== '') return interpolate(table[key], params);
    }
    if (!warned[key] && root.console) { warned[key] = true; root.console.warn('[i18n] missing key: ' + key); }
    return key;
  }

  function t(key, params) { return tFor(current, key, params); }

  /** Pick from a {en,hi,sat} map (e.g. scenario titles) with the same fallback chain. */
  function pick(map, lang) {
    if (!map || typeof map !== 'object') return '';
    var langs = chain(lang || current);
    for (var i = 0; i < langs.length; i++) {
      if (typeof map[langs[i]] === 'string' && map[langs[i]] !== '') return map[langs[i]];
    }
    return '';
  }

  function has(key, dict) {
    dict = dict || SA.STRINGS;
    return !!(dict.en && typeof dict.en[key] === 'string' && dict.en[key] !== '');
  }

  function setLanguage(lang) {
    current = CHAINS[lang] ? lang : DEFAULT_LANG;
    if (root.document) root.document.documentElement.lang = current;
    return current;
  }

  function formatDate(ms, lang) {
    try {
      return new Date(ms).toLocaleDateString(LOCALES[lang || current] || 'en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return new Date(ms).toISOString().slice(0, 10);
    }
  }

  SA.i18n = {
    DEFAULT_LANG: DEFAULT_LANG,
    chain: chain,
    t: t,
    tFor: tFor,
    pick: pick,
    has: has,
    setLanguage: setLanguage,
    getLanguage: function () { return current; },
    formatDate: formatDate
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
