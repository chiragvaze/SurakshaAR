/*
 * UI preferences: theme (light | dark) and visual effects (full | reduced), stored under
 * their own key "sa_ui_v1" (sa_v1's sanitiser keeps only known fields, so it is not extended).
 *
 * Loaded in <head> so the theme is applied before the first paint (no flash). Light is the
 * default; the device's dark-mode setting is deliberately NOT followed (design brief).
 * "reduced" effects (no backdrop blur) is picked automatically on low-memory devices until
 * the user chooses.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var KEY = 'sa_ui_v1';
  var THEMES = ['light', 'dark'];
  var EFFECTS = ['full', 'reduced'];
  var backend = null;
  var prefs = defaults();
  var listeners = [];

  function defaults() { return { v: 1, theme: 'light', effects: null }; }

  function sanitize(raw) {
    var p = defaults();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return p;
    if (THEMES.indexOf(raw.theme) !== -1) p.theme = raw.theme;
    if (EFFECTS.indexOf(raw.effects) !== -1) p.effects = raw.effects;
    return p;
  }

  function detectBackend() {
    try {
      var ls = root.localStorage;
      if (!ls) return null;
      ls.getItem(KEY);
      return ls;
    } catch (e) { return null; }
  }

  /** Low-end heuristic used only while the user has not chosen: blur is the costliest effect. */
  function autoEffects() {
    var nav = root.navigator || {};
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return 'reduced';
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) return 'reduced';
    return 'full';
  }

  function init(customBackend) {
    backend = customBackend !== undefined ? customBackend : detectBackend();
    prefs = defaults();
    if (backend) {
      try {
        var raw = backend.getItem(KEY);
        if (raw) prefs = sanitize(JSON.parse(raw));
      } catch (e) { prefs = defaults(); }
    }
    apply();
    return prefs;
  }

  function save() {
    if (!backend) return;
    try { backend.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* quota / private mode: keep in memory */ }
  }

  function effects() { return prefs.effects || autoEffects(); }

  function apply() {
    var doc = root.document;
    if (!doc || !doc.documentElement || !doc.documentElement.setAttribute) return;
    doc.documentElement.setAttribute('data-theme', prefs.theme);
    doc.documentElement.setAttribute('data-effects', effects());
    var meta = doc.querySelector && doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', prefs.theme === 'dark' ? '#070B12' : '#F6F8FB');
    // Android shell (optional, newer builds only): match the system bars to the theme.
    try {
      if (root.Android && typeof root.Android.setDarkTheme === 'function') root.Android.setDarkTheme(prefs.theme === 'dark');
    } catch (e) { /* older shell: ignore */ }
  }

  /** Smooth colour transition only while switching (not on every repaint). */
  function animateSwitch() {
    var el = root.document && root.document.documentElement;
    if (!el || !el.classList) return;
    el.classList.add('theme-switching');
    setTimeout(function () { el.classList.remove('theme-switching'); }, 400);
  }

  function setTheme(theme) {
    if (THEMES.indexOf(theme) === -1) throw new Error('PREFS_BAD_THEME');
    if (theme === prefs.theme) return prefs;
    animateSwitch();
    prefs.theme = theme;
    save();
    apply();
    listeners.forEach(function (fn) { fn(prefs); });
    return prefs;
  }

  function setEffects(value) {
    if (EFFECTS.indexOf(value) === -1) throw new Error('PREFS_BAD_EFFECTS');
    prefs.effects = value;
    save();
    apply();
    listeners.forEach(function (fn) { fn(prefs); });
    return prefs;
  }

  SA.prefs = {
    KEY: KEY,
    THEMES: THEMES,
    init: init,
    sanitize: sanitize,
    get: function () { return prefs; },
    theme: function () { return prefs.theme; },
    effects: effects,
    setTheme: setTheme,
    toggleTheme: function () { return setTheme(prefs.theme === 'dark' ? 'light' : 'dark'); },
    setEffects: setEffects,
    onChange: function (fn) { listeners.push(fn); }
  };

  if (root.document) init();
})(typeof globalThis !== 'undefined' ? globalThis : window);
