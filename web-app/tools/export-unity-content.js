#!/usr/bin/env node
/*
 * Exports the scenario structure + localized text for the Unity AR trainer, so Web and AR
 * never drift (docs/06_SCENARIO_ENGINE.md "Unity contract"):
 *
 *   docs/25_SCENARIO_CONTENT.json  (structure, correct answers, titles)   \
 *   web-app/js/i18n/strings.js     (prompts, options, "why", AR UI text)   -> unity-ar/Assets/Resources/SurakshaContent.json
 *   web-app/js/i18n/santali.js     (Santali text + review status)          /
 *   web-app/js/i18n/santali-audio.js (Santali voice clip manifest)        /
 *
 * Text stays per language (en/hi/sat) WITHOUT resolving fallbacks; Unity applies the same
 * sat -> hi -> en chain at runtime. Each text also carries satReview (native-review-required |
 * native-reviewed | fallback-hindi) so AR shows the Hindi original under unreviewed safety
 * text. The JSON shape is JsonUtility-friendly (no dictionaries).
 *
 * Usage: npm run export:unity        tests/unity-content.test.js fails if the file is stale.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, '..', 'unity-ar', 'Assets', 'Resources', 'SurakshaContent.json');
const LANGS = ['en', 'hi', 'sat'];
const UI_PREFIXES = ['ar.', 'assess.', 'result.', 'module.'];

function loadWebSources() {
  // Same files the browser loads; they attach to globalThis.SA.
  require(path.join(ROOT, 'js/data/scenarios.js'));
  require(path.join(ROOT, 'js/i18n/strings.js'));
  require(path.join(ROOT, 'js/i18n/ui-strings.js'));
  require(path.join(ROOT, 'js/i18n/santali.js'));
  require(path.join(ROOT, 'js/i18n/santali-audio.js'));
  return globalThis.SA;
}

function localized(strings, key) {
  const out = {};
  for (const lang of LANGS) out[lang] = (strings[lang] && strings[lang][key]) || '';
  if (!out.en) throw new Error('Missing English text for ' + key);
  out.satReview = globalThis.SA.santali.review(key);
  return out;
}

function build() {
  const SA = loadWebSources();
  const S = SA.STRINGS;
  const modules = SA.SCENARIO_CONTENT.modules.map((m) => ({
    id: m.id,
    title: Object.assign({ en: '', hi: '', sat: '' }, m.title, { satReview: SA.santali.review('title.' + m.id, !!(m.title && m.title.sat)) }),
    steps: m.steps.map((st) => ({
      id: st.id,
      correct: st.correct,
      options: st.options.slice(),
      prompt: localized(S, 'scn.' + st.id + '.prompt'),
      why: localized(S, 'scn.' + st.id + '.why'),
      optionText: st.options.map((o) => localized(S, 'scn.' + st.id + '.opt.' + o))
    }))
  }));
  const strings = Object.keys(S.en)
    .filter((k) => UI_PREFIXES.some((p) => k.startsWith(p)))
    .sort()
    .map((key) => Object.assign({ key }, localized(S, key)));
  // Santali voice clips, by text key. Unity plays only 'recorded' entries; the file path is
  // relative to the APK's web assets (assets/web/<file>).
  const voice = Object.keys(SA.SANTALI_AUDIO).sort().map((key) => ({
    key, file: SA.SANTALI_AUDIO[key].file, status: SA.SANTALI_AUDIO[key].status
  }));
  return {
    generatedFrom: 'docs/25_SCENARIO_CONTENT.json + web-app/js/i18n/{strings,santali,santali-audio}.js (npm run export:unity) - do not edit',
    version: SA.SCENARIO_CONTENT.version,
    modules,
    strings,
    voice
  };
}

function render() {
  return JSON.stringify(build(), null, 2) + '\n';
}

if (require.main === module) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, render(), 'utf8');
  console.log('Wrote ' + path.relative(process.cwd(), OUT));
}

module.exports = { render, OUT };
