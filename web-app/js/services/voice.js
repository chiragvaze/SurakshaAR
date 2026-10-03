/*
 * Offline voice for the web screens: speak(keys, lang) -> bundled pre-recorded clip.
 *
 * Santali only (docs/SANTALI_LOCALIZATION.md): a key resolves to a clip through
 * SA.SANTALI_AUDIO. There is no text-to-speech here, no browser speech synthesis and no
 * network: the clips are local files served with the app (Android: the APK's assets).
 * English and Hindi web screens keep their existing behaviour (no voice; the AR trainer
 * has its own Android TTS). A clip that is missing, pending or fails to load is reported as
 * such; nothing else is ever played in its place.
 *
 * One clip at a time: play() stops whatever is playing, and the router calls stop() on
 * every route change and before AR launches.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var STATUS = { READY: 'ready', PENDING: 'pending', NONE: 'none' };
  var current = null; // { audio, queue, token }
  var token = 0;
  var listeners = [];
  var factory = function (src) { return new root.Audio(src); };

  function manifest() { return SA.SANTALI_AUDIO || {}; }

  /** {status, file?} for one key. 'none' = this key/language has no voice line at all. */
  function resolve(key, lang) {
    if (lang !== 'sat') return { status: STATUS.NONE };
    var e = manifest()[key];
    if (!e) return { status: STATUS.NONE };
    if (e.status === 'recorded' && e.file) return { status: STATUS.READY, file: e.file };
    return { status: STATUS.PENDING, file: e.file };
  }

  /** A group of lines is playable only if EVERY line has a recorded clip (no partial voice). */
  function resolveAll(keys, lang) {
    var list = (keys || []).map(function (k) { return resolve(k, lang); });
    if (!list.length || list.some(function (r) { return r.status === STATUS.NONE; })) return { status: STATUS.NONE, files: [] };
    if (list.some(function (r) { return r.status === STATUS.PENDING; })) return { status: STATUS.PENDING, files: [] };
    return { status: STATUS.READY, files: list.map(function (r) { return r.file; }) };
  }

  function emit(state, id) { listeners.slice().forEach(function (fn) { try { fn(state, id); } catch (e) { /* listener error */ } }); }

  function release(c) {
    if (!c || !c.audio) return;
    try { c.audio.pause(); } catch (e) { /* ignore */ }
    c.audio.onended = c.audio.onerror = null;
    try { c.audio.removeAttribute('src'); c.audio.load(); } catch (e) { /* frees the decoder */ }
    c.audio = null;
  }

  function stop() {
    if (!current) return;
    var id = current.id;
    release(current);
    current = null;
    emit('stopped', id);
  }

  /**
   * Play the clips for keys in order. id identifies the control that started it.
   * @returns {string} 'playing' | 'pending' | 'none' | 'error'
   */
  function play(keys, lang, id) {
    stop();
    var r = resolveAll(keys, lang);
    if (r.status !== STATUS.READY) return r.status;
    var my = { id: id || null, queue: r.files.slice(), token: ++token, audio: null };
    current = my;
    function next() {
      if (current !== my) return;
      release(my);
      var file = my.queue.shift();
      if (!file) { current = null; emit('ended', my.id); return; }
      var a;
      try { a = factory(file); } catch (e) { current = null; emit('error', my.id); return; }
      my.audio = a;
      a.onended = next;
      a.onerror = function () { if (current === my) { release(my); current = null; emit('error', my.id); } };
      try {
        var p = a.play();
        if (p && typeof p.catch === 'function') p.catch(function () { if (a.onerror) a.onerror(); });
      } catch (e) { a.onerror(); }
    }
    emit('playing', my.id);
    next();
    return current === my ? 'playing' : 'error';
  }

  SA.voice = {
    STATUS: STATUS,
    resolve: resolve,
    resolveAll: resolveAll,
    play: play,
    stop: stop,
    isPlaying: function (id) { return !!current && (id === undefined || current.id === id); },
    onChange: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    _setAudioFactory: function (fn) { factory = fn; }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
