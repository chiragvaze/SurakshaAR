/*
 * Generic scenario engine (docs/06_SCENARIO_ENGINE.md). One engine drives every
 * module from data; there is no Fire- or Gas-specific logic anywhere.
 *
 * A session is plain JSON so it can be persisted and resumed:
 *   { module, order: [[optionId x3] x steps], stepIndex, answers: [optionId|null], startedMs }
 * `wrong` is always derived from answers vs. the scenario, never stored separately.
 *
 * toResult() returns the same shape the future Unity AR trainer will send back
 * (docs/07_API_AND_BRIDGE_CONTRACTS.md), so both paths share one completion pipeline.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var registry = { modules: {}, errors: {} };

  /** Validate and register scenario content. Invalid modules become "unavailable". */
  function load(content, dict) {
    registry = SA.scenarioValidator.validateContent(content, dict);
    Object.keys(registry.errors).forEach(function (id) {
      if (root.console) root.console.error('[scenario] module "' + id + '" failed validation', registry.errors[id]);
    });
    return registry;
  }

  function get(moduleId) {
    return Object.prototype.hasOwnProperty.call(registry.modules, moduleId) ? registry.modules[moduleId] : null;
  }

  function isAvailable(moduleId) { return !!get(moduleId); }

  function shuffle(list, rng) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /**
   * Start a session. Option display order is shuffled per attempt so the safe answer
   * is not always in the same position (docs/24_DECISION_LOG.md D-017).
   */
  function createSession(scenario, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    return {
      module: scenario.id,
      order: scenario.steps.map(function (s) { return shuffle(s.options, rng); }),
      stepIndex: 0,
      answers: scenario.steps.map(function () { return null; }),
      startedMs: typeof opts.nowMs === 'number' ? opts.nowMs : Date.now()
    };
  }

  /** Persisted sessions are untrusted: check they still match the scenario exactly. */
  function isValidSession(scenario, s) {
    if (!scenario || !SA.validation.isPlainObject(s) || s.module !== scenario.id) return false;
    var n = scenario.steps.length;
    if (!Array.isArray(s.order) || s.order.length !== n) return false;
    if (!Array.isArray(s.answers) || s.answers.length !== n) return false;
    if (!Number.isInteger(s.stepIndex) || s.stepIndex < 0 || s.stepIndex >= n) return false;
    if (!Number.isSafeInteger(s.startedMs)) return false;
    for (var i = 0; i < n; i++) {
      var opts = scenario.steps[i].options;
      var ord = s.order[i];
      if (!Array.isArray(ord) || ord.length !== opts.length) return false;
      if (ord.slice().sort().join('|') !== opts.slice().sort().join('|')) return false;
      var ans = s.answers[i];
      if (ans !== null && opts.indexOf(ans) === -1) return false;
      // Steps must be answered in order: nothing after the current step, everything before it.
      if (i < s.stepIndex && ans === null) return false;
      if (i > s.stepIndex && ans !== null) return false;
    }
    return true;
  }

  function currentStep(scenario, s) {
    var step = scenario.steps[s.stepIndex];
    return {
      index: s.stepIndex,
      total: scenario.steps.length,
      id: step.id,
      options: s.order[s.stepIndex].slice(),
      correct: step.correct,
      answer: s.answers[s.stepIndex],
      answered: s.answers[s.stepIndex] !== null,
      isLast: s.stepIndex === scenario.steps.length - 1
    };
  }

  /**
   * Record an answer for the current step. Duplicate submissions are ignored.
   * @returns {{accepted:boolean, correct:boolean, session:object}}
   */
  function answer(scenario, s, optionId) {
    var step = scenario.steps[s.stepIndex];
    if (s.answers[s.stepIndex] !== null || step.options.indexOf(optionId) === -1) {
      return { accepted: false, correct: s.answers[s.stepIndex] === step.correct, session: s };
    }
    var next = clone(s);
    next.answers[s.stepIndex] = optionId;
    return { accepted: true, correct: optionId === step.correct, session: next };
  }

  /** Move to the next step. Refused unless the current step is answered and not last. */
  function advance(scenario, s) {
    if (s.answers[s.stepIndex] === null || s.stepIndex >= scenario.steps.length - 1) return null;
    var next = clone(s);
    next.stepIndex += 1;
    return next;
  }

  function isComplete(scenario, s) {
    return s.answers.length === scenario.steps.length && s.answers.every(function (a) { return a !== null; });
  }

  function wrongCount(scenario, s) {
    return scenario.steps.reduce(function (n, step, i) {
      return n + (s.answers[i] !== null && s.answers[i] !== step.correct ? 1 : 0);
    }, 0);
  }

  /** Same shape as the future Unity result: {module, score, wrong, completed} (+ steps). */
  function toResult(scenario, s) {
    if (!isComplete(scenario, s)) throw new Error('SCENARIO_INCOMPLETE');
    var steps = scenario.steps.length;
    var wrong = wrongCount(scenario, s);
    return {
      module: scenario.id,
      steps: steps,
      wrong: wrong,
      score: SA.scoring.computeScore(steps, wrong),
      completed: true,
      startedMs: s.startedMs
    };
  }

  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  SA.scenario = {
    load: load,
    get: get,
    isAvailable: isAvailable,
    errors: function () { return registry.errors; },
    createSession: createSession,
    isValidSession: isValidSession,
    currentStep: currentStep,
    answer: answer,
    advance: advance,
    isComplete: isComplete,
    wrongCount: wrongCount,
    toResult: toResult
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
