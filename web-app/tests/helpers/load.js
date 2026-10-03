/*
 * Loads the app's business-logic scripts (the same files the browser loads) into
 * Node's global scope and returns the SA namespace. UI/screen scripts are not loaded.
 */
'use strict';
const path = require('path');

const FILES = [
  'js/utils/codec.js',
  'js/utils/sha256.js',
  'js/utils/qr.js',
  'js/utils/validation.js',
  'js/data/scenarios.js',
  'js/data/seed-workers.js',
  'js/i18n/strings.js',
  'js/i18n/ui-strings.js',
  'js/i18n/santali.js',
  'js/i18n/santali-audio.js',
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
  'js/services/voice.js'
];

function load() {
  if (!globalThis.SA) {
    FILES.forEach((f) => require(path.join(__dirname, '..', '..', f)));
    globalThis.SA.scenario.load(globalThis.SA.SCENARIO_CONTENT, globalThis.SA.STRINGS);
  }
  return globalThis.SA;
}

/** In-memory localStorage stand-in. */
function memoryStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    _data: data
  };
}

/** Deterministic RNG for reproducible option order. */
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Play a whole module: answers[i] is 'correct' or 'wrong' for step i. */
function play(SA, moduleId, pattern) {
  const scenario = SA.scenario.get(moduleId);
  let session = SA.scenario.createSession(scenario, { rng: seededRng(7), nowMs: Date.now() });
  scenario.steps.forEach((step, i) => {
    const choice = pattern[i] === 'correct' ? step.correct : step.options.find((o) => o !== step.correct);
    const res = SA.scenario.answer(scenario, session, choice);
    if (!res.accepted) throw new Error('answer not accepted at step ' + i);
    session = res.session;
    if (i < scenario.steps.length - 1) session = SA.scenario.advance(scenario, session);
  });
  return SA.scenario.toResult(scenario, session);
}

module.exports = { load, memoryStorage, seededRng, play, FILES };
