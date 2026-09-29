'use strict';
/* The Unity AR trainer's content file must match the web app's sources exactly. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { load } = require('./helpers/load');

load();
const { render, OUT } = require('../tools/export-unity-content');

test('unity-ar/Assets/Resources/SurakshaContent.json is up to date (run npm run export:unity)', () => {
  assert.ok(fs.existsSync(OUT), 'missing ' + OUT);
  assert.equal(fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n'), render());
});

test('exported content keeps scenario IDs/correct answers and has English text everywhere', () => {
  const content = JSON.parse(render());
  const docs = globalThis.SA.SCENARIO_CONTENT;
  assert.deepEqual(content.modules.map((m) => m.id), docs.modules.map((m) => m.id));
  content.modules.forEach((m, i) => {
    m.steps.forEach((st, j) => {
      const src = docs.modules[i].steps[j];
      assert.equal(st.id, src.id);
      assert.equal(st.correct, src.correct);
      assert.deepEqual(st.options, src.options);
      assert.equal(st.optionText.length, st.options.length);
      assert.ok(st.prompt.en && st.why.en && st.optionText.every((t) => t.en));
    });
  });
  const keys = content.strings.map((s) => s.key);
  for (const k of ['ar.placeHint', 'ar.tapOption', 'assess.correct', 'assess.wrong', 'assess.step', 'result.passed']) {
    assert.ok(keys.includes(k), k);
  }
});
