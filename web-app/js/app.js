/*
 * App shell: boot, hash router with guards, global error handling.
 * Hash routing works from http://, file:// and Android WebView assets alike.
 */
(function (root) {
  'use strict';
  var SA = root.SA;
  var ui = SA.ui;

  // needs: which prerequisites must exist before the screen can render
  var ROUTES = {
    welcome: [],
    language: [],
    profile: ['language'],
    home: ['language', 'worker'],
    briefing: ['language', 'worker'],
    assess: ['language', 'worker'],
    result: ['language', 'worker'],
    certificate: ['language', 'worker'],
    verify: ['language'],
    dashboard: ['language']
  };

  var appEl = null;

  function parseHash(hash) {
    var raw = String(hash || '').replace(/^#\/?/, '');
    var qIndex = raw.indexOf('?');
    var path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var query = {};
    if (qIndex !== -1) {
      raw.slice(qIndex + 1).split('&').forEach(function (pair) {
        var eq = pair.indexOf('=');
        if (eq <= 0) return;
        try { query[pair.slice(0, eq)] = decodeURIComponent(pair.slice(eq + 1)); } catch (e) { /* ignore bad escapes */ }
      });
    }
    var parts = path.split('/').filter(Boolean);
    return { name: parts[0] || '', param: parts[1] || null, query: query };
  }

  /** Only allow in-app "#/<known route>" targets for ?next= redirects. */
  function safeNext(next) {
    if (typeof next !== 'string' || next.slice(0, 2) !== '#/') return null;
    var r = parseHash(next);
    return Object.prototype.hasOwnProperty.call(ROUTES, r.name) && r.name !== 'language' ? next : null;
  }

  function navigate(hash) {
    if (root.location.hash === hash) render();
    else root.location.hash = hash;
  }

  function redirect(hash) {
    root.location.replace(hash);
  }

  function currentLang(state) {
    return state.settings.language || SA.i18n.DEFAULT_LANG;
  }

  /** Returns a redirect target if the route's prerequisites are missing, else null. */
  function guard(route, state) {
    if (!route.name) return state.worker && state.settings.language ? '#/home' : '#/welcome';
    var needs = ROUTES[route.name];
    if (!needs) return state.worker && state.settings.language ? '#/home' : '#/welcome';
    if (needs.indexOf('language') !== -1 && !state.settings.language) {
      return '#/language?next=' + encodeURIComponent(root.location.hash);
    }
    if (needs.indexOf('worker') !== -1 && !state.worker) return '#/profile';
    return null;
  }

  function render(opts) {
    opts = opts || {};
    var state = SA.store.get();
    var route = parseHash(root.location.hash);
    var target = guard(route, state);
    if (target) { redirect(target); return; }

    var lang = SA.i18n.setLanguage(currentLang(state));
    var ctx = {
      t: SA.i18n.t,
      lang: lang,
      state: state,
      store: SA.store,
      param: route.param,
      query: route.query,
      navigate: navigate,
      redirect: redirect,
      safeNext: safeNext,
      rerender: function (o) { render(Object.assign({ keepScroll: true }, o)); }
    };

    var node;
    try {
      node = SA.screens[route.name](ctx);
    } catch (e) {
      if (root.console) root.console.error('[render] ' + route.name, e);
      node = SA.screens.error(ctx);
    }
    var scrollY = root.scrollY;
    appEl.replaceChildren(node);
    root.document.title = SA.i18n.t('app.name') + ' · SurakshaAR';

    var focusEl = (opts.focus && appEl.querySelector(opts.focus)) || (!opts.keepScroll && appEl.querySelector('h1'));
    if (opts.keepScroll && !opts.focus) root.scrollTo(0, scrollY);
    else if (!opts.focus) root.scrollTo(0, 0);
    if (focusEl) {
      try { focusEl.focus({ preventScroll: !opts.focus }); } catch (e) { focusEl.focus(); }
    }
  }

  function boot() {
    appEl = root.document.getElementById('app');
    var storeStatus = SA.store.init();
    SA.scenario.load(SA.SCENARIO_CONTENT, SA.STRINGS);
    SA.i18n.setLanguage(currentLang(SA.store.get()));

    if (storeStatus === 'reset') ui.toast(SA.i18n.t('err.storageReset'), 'error');
    if (storeStatus === 'unavailable') ui.toast(SA.i18n.t('err.storageUnavailable'), 'error');

    // Future Unity result (Phase 2) lands here through the same pipeline as the web trainer.
    SA.bridge.onResult(function (outcome) {
      if (outcome.ok) navigate('#/result');
      else ui.toast(SA.i18n.t('err.resultRejected'), 'error');
    });

    root.addEventListener('hashchange', function () { render(); });
    root.addEventListener('error', function (ev) {
      if (root.console) root.console.error('[uncaught]', ev.error || ev.message);
      ui.toast(SA.i18n.t('err.generic'), 'error');
    });
    root.addEventListener('unhandledrejection', function (ev) {
      if (root.console) root.console.error('[unhandled]', ev.reason);
      ui.toast(SA.i18n.t('err.generic'), 'error');
    });

    render();
    registerServiceWorker();
  }

  // Offline reloads in a phone browser. Not used for file:// or Android assets (already local).
  function registerServiceWorker() {
    var proto = root.location.protocol;
    if ((proto === 'http:' || proto === 'https:') && 'serviceWorker' in root.navigator) {
      root.navigator.serviceWorker.register('sw.js').catch(function (e) {
        if (root.console) root.console.warn('[sw] registration failed', e);
      });
    }
  }

  SA.app = { parseHash: parseHash, safeNext: safeNext, ROUTES: ROUTES };

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
