/*
 * Translation lookup with the documented fallback chain: sat -> hi -> en.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var CHAINS = { sat: ['sat', 'hi', 'en'], hi: ['hi', 'en'], en: ['en'] };
  // Santali dates use the Santali locale with Latin digits where the engine has Santali data
  // (Ol Chiki month names); otherwise English (India) rather than Hindi month names.
  var LOCALES = { en: 'en-IN', hi: 'hi-IN', sat: 'sat-IN-u-nu-latn' };
  var LOCALE_FALLBACK = { sat: 'en-IN' };
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

  /** BCP 47 tag for dates/times in a language, falling back when the engine lacks the data. */
  function locale(lang) {
    lang = lang || current;
    var tag = LOCALES[lang] || 'en-IN';
    try {
      if (LOCALE_FALLBACK[lang] && !(root.Intl && Intl.DateTimeFormat.supportedLocalesOf([tag]).length)) return LOCALE_FALLBACK[lang];
    } catch (e) { return LOCALE_FALLBACK[lang] || 'en-IN'; }
    return tag;
  }

  function formatDate(ms, lang) {
    try {
      return new Date(ms).toLocaleDateString(locale(lang), {
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
    formatDate: formatDate,
    locale: locale
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
