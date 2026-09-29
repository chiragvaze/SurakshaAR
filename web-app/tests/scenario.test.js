'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load, seededRng, play } = require('./helpers/load');

const SA = load();
const clone = (o) => JSON.parse(JSON.stringify(o));

test('embedded scenario data is identical to docs/25_SCENARIO_CONTENT.json', () => {
  const docs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'docs', '25_SCENARIO_CONTENT.json'), 'utf8'));
  assert.deepEqual(SA.SCENARIO_CONTENT, docs, 'run `npm run sync:scenarios`');
});

test('both modules pass validation and are available', () => {
  assert.deepEqual(SA.scenario.errors(), {});
  assert.ok(SA.scenario.isAvailable('fire_explosion'));
  assert.ok(SA.scenario.isAvailable('gas_confined'));
  assert.equal(SA.scenario.get('unknown_module'), null);
});

test('correct answers match the spec for Fire and Gas', () => {
  const correct = (id) => SA.scenario.get(id).steps.map((s) => s.correct);
  assert.deepEqual(correct('fire_explosion'), ['exit_sign', 'co2', 'crawl_low']);
  assert.deepEqual(correct('gas_confined'), ['red_zone', 'detector_breathing', 'attendant']);
});

test('validator catches malformed scenarios', () => {
  const base = SA.SCENARIO_CONTENT.modules[0];
  const cases = {
    'module:step_count': (m) => { m.steps.pop(); },
    'option_count': (m) => { m.steps[0].options.pop(); },
    'correct_not_single_option': (m) => { m.steps[1].correct = 'sand'; },
    'duplicate_option': (m) => { m.steps[2].options[1] = m.steps[2].options[0]; },
    'duplicate_id': (m) => { m.steps[1].id = m.steps[0].id; },
    'module:unknown_id': (m) => { m.id = 'machinery'; },
    'missing_text': (m) => { m.steps[0].options[2] = 'ladder'; m.steps[0].correct = m.steps[0].options[0]; }
  };
  for (const [expected, mutate] of Object.entries(cases)) {
    const m = clone(base);
    mutate(m);
    const errors = SA.scenarioValidator.validateModule(m, SA.STRINGS, {});
    assert.ok(errors.some((e) => e.includes(expected)), expected + ' -> ' + errors.join(','));
  }
});

test('invalid module is marked unavailable, valid one still loads', () => {
  const content = clone(SA.SCENARIO_CONTENT);
  content.modules[1].steps.pop();
  const reg = SA.scenarioValidator.validateContent(content, SA.STRINGS);
  assert.ok(reg.modules.fire_explosion);
  assert.equal(reg.modules.gas_confined, undefined);
  assert.ok(reg.errors.gas_confined.length > 0);
});

test('TC-003 Fire: all correct -> 100, pass', () => {
  const r = play(SA, 'fire_explosion', ['correct', 'correct', 'correct']);
  assert.deepEqual([r.score, r.wrong, SA.scoring.isPass(r.score)], [100, 0, true]);
});

test('TC-004 Fire: one wrong -> 67, fail', () => {
  const r = play(SA, 'fire_explosion', ['correct', 'wrong', 'correct']);
  assert.deepEqual([r.score, r.wrong, SA.scoring.isPass(r.score)], [67, 1, false]);
});

test('TC-005 Gas: all correct -> 100, pass', () => {
  const r = play(SA, 'gas_confined', ['correct', 'correct', 'correct']);
  assert.deepEqual([r.score, r.wrong, SA.scoring.isPass(r.score)], [100, 0, true]);
});

test('TC-006 Gas: two wrong -> 33, fail', () => {
  const r = play(SA, 'gas_confined', ['wrong', 'correct', 'wrong']);
  assert.deepEqual([r.score, r.wrong, SA.scoring.isPass(r.score)], [33, 2, false]);
});

test('engine result has the Unity bridge shape', () => {
  const r = play(SA, 'gas_confined', ['wrong', 'wrong', 'wrong']);
  assert.equal(r.module, 'gas_confined');
  assert.equal(r.completed, true);
  assert.equal(r.score, 0);
  assert.equal(r.wrong, 3);
});

test('duplicate answer is ignored and cannot change the recorded choice', () => {
  const sc = SA.scenario.get('fire_explosion');
  let s = SA.scenario.createSession(sc, { rng: seededRng(1), nowMs: 1 });
  s = SA.scenario.answer(sc, s, 'lift').session;
  const again = SA.scenario.answer(sc, s, 'exit_sign');
  assert.equal(again.accepted, false);
  assert.equal(again.session.answers[0], 'lift');
  assert.equal(SA.scenario.wrongCount(sc, again.session), 1);
});

test('cannot advance an unanswered step, cannot answer with a foreign option', () => {
  const sc = SA.scenario.get('fire_explosion');
  const s = SA.scenario.createSession(sc, { rng: seededRng(1), nowMs: 1 });
  assert.equal(SA.scenario.advance(sc, s), null);
  assert.equal(SA.scenario.answer(sc, s, 'co2').accepted, false);
  assert.throws(() => SA.scenario.toResult(sc, s), /INCOMPLETE/);
});

test('option order is a shuffled permutation of the scenario options', () => {
  const sc = SA.scenario.get('gas_confined');
  const s = SA.scenario.createSession(sc, { rng: seededRng(99), nowMs: 1 });
  sc.steps.forEach((step, i) => assert.deepEqual([...s.order[i]].sort(), [...step.options].sort()));
  // Over many sessions the correct option must not always be first.
  const firsts = new Set();
  for (let k = 0; k < 30; k++) firsts.add(SA.scenario.createSession(sc, { rng: seededRng(k + 1), nowMs: 1 }).order[0][0]);
  assert.ok(firsts.size > 1);
});

test('persisted session validation rejects tampered/garbage sessions', () => {
  const sc = SA.scenario.get('fire_explosion');
  const good = SA.scenario.createSession(sc, { rng: seededRng(3), nowMs: 5 });
  assert.ok(SA.scenario.isValidSession(sc, good));
  const bad = [
    null, 'x', {},
    Object.assign(clone(good), { module: 'gas_confined' }),
    Object.assign(clone(good), { stepIndex: 7 }),
    Object.assign(clone(good), { answers: ['nope', null, null] }),
    Object.assign(clone(good), { stepIndex: 1 }), // skipped step 0 without answering
    Object.assign(clone(good), { order: [['a', 'b', 'c'], good.order[1], good.order[2]] })
  ];
  bad.forEach((b, i) => assert.equal(SA.scenario.isValidSession(sc, b), false, 'case ' + i));
});
