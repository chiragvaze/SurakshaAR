/*
 * The ONE scoring function for every module (docs/00_MASTER_SPEC.md §7).
 *   score = round(100 * (steps - wrong) / steps), pass when score >= 70
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var PASS_MARK = 70;

  function computeScore(steps, wrong) {
    if (!Number.isInteger(steps) || steps <= 0) throw new Error('SCORING_INVALID_STEPS');
    if (!Number.isInteger(wrong) || wrong < 0 || wrong > steps) throw new Error('SCORING_INVALID_WRONG');
    return Math.round(100 * (steps - wrong) / steps);
  }

  function isPass(score) {
    return typeof score === 'number' && score >= PASS_MARK;
  }

  /** Full assessment summary used by results, attempts and the future Unity bridge. */
  function evaluate(steps, wrong) {
    var score = computeScore(steps, wrong);
    return { steps: steps, wrong: wrong, score: score, passed: isPass(score) };
  }

  SA.scoring = { PASS_MARK: PASS_MARK, computeScore: computeScore, isPass: isPass, evaluate: evaluate };
})(typeof globalThis !== 'undefined' ? globalThis : window);
