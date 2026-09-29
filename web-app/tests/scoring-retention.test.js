'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers/load');

const SA = load();
const DAY = 24 * 60 * 60 * 1000;

test('score formula for 3 steps: 100 / 67 / 33 / 0', () => {
  assert.deepEqual([0, 1, 2, 3].map((w) => SA.scoring.computeScore(3, w)), [100, 67, 33, 0]);
});

test('pass threshold is >= 70', () => {
  assert.equal(SA.scoring.isPass(70), true);
  assert.equal(SA.scoring.isPass(69), false);
  assert.equal(SA.scoring.isPass(67), false);
  assert.equal(SA.scoring.isPass(100), true);
});

test('scoring rejects invalid input', () => {
  assert.throws(() => SA.scoring.computeScore(0, 0));
  assert.throws(() => SA.scoring.computeScore(3, 4));
  assert.throws(() => SA.scoring.computeScore(3, -1));
  assert.throws(() => SA.scoring.computeScore(3, 1.5));
});

test('TC-015 risk formula and clamp', () => {
  assert.equal(SA.retention.computeRisk(0, 0, 100), 0);
  assert.equal(SA.retention.computeRisk(1, 0, 100), 5);
  assert.equal(SA.retention.computeRisk(2, 1, 67), 42); // 10 + 15 + 16.5 = 41.5 -> 42
  assert.equal(SA.retention.computeRisk(4, 2, 33), 84); // 20 + 30 + 33.5 = 83.5 -> 84
  assert.equal(SA.retention.computeRisk(10, 3, 0), 100); // 145 clamped
});

test('risk status thresholds: green <30, amber <60, red >=60', () => {
  assert.equal(SA.retention.riskStatus(29), 'green');
  assert.equal(SA.retention.riskStatus(30), 'amber');
  assert.equal(SA.retention.riskStatus(59), 'amber');
  assert.equal(SA.retention.riskStatus(60), 'red');
  assert.equal(SA.retention.riskStatus(100), 'red');
});

test('refresher due at >= 7 days since last training', () => {
  const now = Date.UTC(2026, 8, 29);
  assert.equal(SA.retention.summarize({ lastTrainingMs: now - 6 * DAY, fails: 0, score: 100 }, now).refresherDue, false);
  const s = SA.retention.summarize({ lastTrainingMs: now - 7 * DAY, fails: 0, score: 100 }, now);
  assert.equal(s.refresherDue, true);
  assert.equal(s.daysSince, 7);
  assert.equal(s.risk, 35);
});

test('dashboard: 8 seeded workers with varied states', () => {
  const state = SA.store.defaultState();
  const rows = SA.retention.dashboardRows(SA.SEED_WORKERS, state, Date.now());
  assert.equal(rows.length, 8);
  const statuses = new Set(rows.map((r) => r.status));
  assert.deepEqual([...statuses].sort(), ['amber', 'green', 'red']);
  assert.ok(rows.some((r) => r.refresherDue) && rows.some((r) => !r.refresherDue));
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].risk >= rows[i].risk, 'sorted by risk');
});

test('TC-014 +7 days recalculates days, risk, status and refresher', () => {
  const real = Date.now();
  const state = SA.store.defaultState();
  const before = Object.fromEntries(SA.retention.dashboardRows(SA.SEED_WORKERS, state, real).map((r) => [r.id, r]));
  state.retention.demoOffsetMs = 7 * DAY;
  const after = Object.fromEntries(SA.retention.dashboardRows(SA.SEED_WORKERS, state, real).map((r) => [r.id, r]));

  // Ramesh: 1 day, perfect -> 5 green, not due; +7 -> 8 days, 40 amber, due
  assert.deepEqual([before['JH-1001'].risk, before['JH-1001'].status, before['JH-1001'].refresherDue], [5, 'green', false]);
  assert.deepEqual([after['JH-1001'].daysSince, after['JH-1001'].risk, after['JH-1001'].status, after['JH-1001'].refresherDue], [8, 40, 'amber', true]);
  // Arjun: amber -> red
  assert.equal(before['JH-1003'].status, 'amber');
  assert.equal(after['JH-1003'].status, 'red');
  // Every worker is due after +7
  assert.ok(Object.values(after).every((r) => r.refresherDue));
});

test('local worker appears on dashboard from their attempts', () => {
  const real = Date.now();
  const state = SA.store.defaultState();
  state.worker = { id: 'W001', name: 'Demo Worker' };
  state.attempts = [
    { id: 'a1', workerId: 'W001', module: 'fire_explosion', steps: 3, wrong: 1, score: 67, passed: false, startedMs: real, completedMs: real },
    { id: 'a2', workerId: 'W001', module: 'fire_explosion', steps: 3, wrong: 0, score: 100, passed: true, startedMs: real, completedMs: real + 1 }
  ];
  const rows = SA.retention.dashboardRows(SA.SEED_WORKERS, state, real);
  assert.equal(rows.length, 9);
  const me = rows.find((r) => r.local);
  assert.deepEqual([me.score, me.fails, me.daysSince, me.risk, me.status], [100, 1, 0, 15, 'green']);
});
