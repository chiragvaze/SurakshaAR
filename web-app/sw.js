/*
 * Service worker for offline reloads when the app is served over http(s) (phone
 * browser / PWA fallback). Network-first so development never serves stale files;
 * falls back to the cache when offline. Not used from file:// or Android assets.
 * tests/assets.test.js checks this list matches every file index.html loads.
 */
'use strict';
var CACHE = 'surakshaar-v1';
var ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/utils/codec.js',
  'js/utils/sha256.js',
  'js/utils/qr.js',
  'js/utils/validation.js',
  'js/data/scenarios.js',
  'js/data/seed-workers.js',
  'js/i18n/strings.js',
  'js/i18n/i18n.js',
  'js/scenario/scoring.js',
  'js/scenario/validator.js',
  'js/scenario/engine.js',
  'js/storage/store.js',
  'js/services/clock.js',
  'js/certificate/certificate.js',
  'js/services/retention.js',
  'js/services/training.js',
  'js/services/bridge.js',
  'js/components/dom.js',
  'js/components/ui.js',
  'js/screens/onboarding.js',
  'js/screens/home.js',
  'js/screens/training.js',
  'js/screens/certificate.js',
  'js/screens/dashboard.js',
  'js/app.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); });
    })
  );
});
