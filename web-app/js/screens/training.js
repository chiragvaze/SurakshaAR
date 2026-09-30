/*
 * Module briefing, assessment and result screens. They render whatever scenario
 * the engine gives them; nothing here is specific to Fire or Gas.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  function unavailable(ctx) {
    return ui.page(ctx, { back: '#/home' }, [
      ui.title(ctx.t('err.title')),
      ui.notice(ctx.t('err.moduleUnavailable'), 'error'),
      ui.btn(ctx.t('nav.home'), { href: '#/home' })
    ]);
  }

  // ---------------- Briefing ----------------
  SA.screens.briefing = function (ctx) {
    var t = ctx.t;
    var moduleId = ctx.param;
    var scenario = SA.scenario.get(moduleId);
    if (!scenario) return unavailable(ctx);
    var session = SA.training.getSession(moduleId);
    var status = h('div', { class: 'briefing__status', role: 'status' });

    function start(fresh) {
      // AR (Android shell) runs its own session in Unity; only the browser trainer needs a web session.
      var mode = SA.bridge.launch(moduleId, ctx.lang);
      if (mode === 'ar') { status.textContent = t('briefing.arOpening'); return; }
      if (fresh || !session) SA.training.startSession(moduleId);
      ctx.navigate('#/assess/' + moduleId);
    }

    return ui.page(ctx, { back: '#/home' }, [
      ui.title(ui.moduleTitle(moduleId, ctx.lang), t('module.' + moduleId + '.purpose')),
      h('ol', { class: 'step-pills', 'aria-label': t('briefing.steps') },
        scenario.steps.map(function (s, i) {
          var done = session && session.answers[i] !== null;
          return h('li', { class: 'step-pill' + (done ? ' is-done' : '') }, t('briefing.stepN', { n: i + 1 }));
        })),
      h('p', { class: 'briefing__hint' }, t('briefing.steps')),
      status,
      session
        ? [ui.btn(t('briefing.resume', { step: session.stepIndex + 1, total: scenario.steps.length }), { onClick: function () { start(false); }, id: 'briefing-start' }),
           ui.btn(t('briefing.restart'), { variant: 'secondary', onClick: function () { start(true); }, id: 'briefing-restart' })]
        : ui.btn(t('briefing.start'), { onClick: function () { start(true); }, id: 'briefing-start' })
    ]);
  };

  // ---------------- Assessment ----------------
  SA.screens.assess = function (ctx) {
    var t = ctx.t;
    var moduleId = ctx.param;
    var scenario = SA.scenario.get(moduleId);
    if (!scenario) return unavailable(ctx);
    var session = SA.training.getSession(moduleId);
    if (!session) { ctx.redirect('#/briefing/' + moduleId); return h('div'); }

    var step = SA.scenario.currentStep(scenario, session);
    var key = 'scn.' + step.id;
    var busy = false;

    function choose(optionId) {
      if (busy) return;
      var res = SA.scenario.answer(scenario, session, optionId);
      if (!res.accepted) return; // duplicate / invalid submission ignored
      busy = true;
      SA.training.saveSession(res.session);
      ctx.rerender({ focus: '#feedback-title' });
    }

    function next() {
      if (busy) return;
      busy = true;
      if (!step.isLast) {
        var advanced = SA.scenario.advance(scenario, session);
        if (advanced) SA.training.saveSession(advanced);
        ctx.rerender({ keepScroll: false });
        return;
      }
      try {
        SA.training.completeAssessment(SA.scenario.toResult(scenario, session));
        ctx.navigate('#/result');
      } catch (e) {
        if (root.console) root.console.error(e);
        ui.toast(t('err.resultRejected'), 'error');
        busy = false;
      }
    }

    var progress = h('ol', { class: 'progress', 'aria-hidden': 'true' },
      scenario.steps.map(function (s, i) {
        var a = session.answers[i];
        var cls = a === null ? (i === step.index ? 'is-current' : '') : (a === s.correct ? 'is-correct' : 'is-wrong');
        return h('li', { class: 'progress__seg ' + cls }, a === null ? String(i + 1) : (a === s.correct ? '✓' : '✕'));
      }));

    var options = h('div', { class: 'options', role: 'group', 'aria-labelledby': 'step-prompt' },
      step.options.map(function (opt, i) {
        var cls = 'option';
        var tag = null;
        if (step.answered) {
          if (opt === step.correct) {
            cls += ' is-correct';
            tag = h('span', { class: 'option__tag' }, '✓ ', opt === step.answer ? t('assess.correct') : t('assess.safeAnswer'));
          } else if (opt === step.answer) {
            cls += ' is-wrong';
            tag = h('span', { class: 'option__tag' }, '✕ ', t('assess.wrong'));
          } else {
            cls += ' is-dim';
          }
        }
        return h('button', {
          type: 'button', class: cls, disabled: step.answered, 'data-option': opt,
          'aria-pressed': step.answer === opt ? 'true' : 'false',
          onClick: function () { choose(opt); }
        },
        h('span', { class: 'option__letter', 'aria-hidden': 'true' }, 'ABC'.charAt(i)),
        h('span', { class: 'option__text' }, h('span', { class: 'option__label' }, t(key + '.opt.' + opt)), tag));
      }));

    var feedback = null;
    if (step.answered) {
      var ok = step.answer === step.correct;
      feedback = h('section', { class: 'feedback feedback--' + (ok ? 'correct' : 'wrong'), role: 'status' },
        h('h2', { class: 'feedback__title', id: 'feedback-title', tabindex: '-1' },
          h('span', { 'aria-hidden': 'true' }, ok ? '✓ ' : '✕ '), ok ? t('assess.correct') : t('assess.wrong')),
        h('p', { class: 'feedback__why' }, t(key + '.why')),
        ui.btn(step.isLast ? t('assess.finish') : t('assess.continue'), { onClick: next, id: 'assess-next' }));
    }

    return ui.page(ctx, { back: '#/briefing/' + moduleId }, [
      h('div', { class: 'assess-head' },
        h('p', { class: 'assess-head__module' }, ui.moduleTitle(moduleId, ctx.lang)),
        h('p', { class: 'assess-head__step', id: 'step-count' }, t('assess.step', { n: step.index + 1, total: step.total }))),
      progress,
      h('h1', { class: 'prompt', id: 'step-prompt', tabindex: '-1' }, t(key + '.prompt')),
      options,
      feedback
    ]);
  };

  // ---------------- Result ----------------
  SA.screens.result = function (ctx) {
    var t = ctx.t;
    var attempt = SA.training.lastAttempt(ctx.state);
    if (!attempt || attempt.workerId !== ctx.state.worker.id) {
      return ui.page(ctx, { back: '#/home' }, [
        ui.title(t('result.title')),
        ui.notice(t('result.none'), 'info'),
        ui.btn(t('nav.home'), { href: '#/home' })
      ]);
    }
    var w = ctx.state.worker;

    function getCertificate() {
      try {
        SA.training.issueCertificate(attempt.id);
        ctx.navigate('#/certificate');
      } catch (e) {
        if (root.console) root.console.error(e);
        ui.toast(t('err.certFailed'), 'error');
      }
    }

    return ui.page(ctx, { back: '#/home' }, [
      ui.title(t('result.title')),
      h('section', { class: 'result result--' + (attempt.passed ? 'pass' : 'fail'), id: 'result-card' },
        h('p', { class: 'result__verdict', id: 'result-verdict' },
          h('span', { 'aria-hidden': 'true' }, attempt.passed ? '✓ ' : '✕ '),
          attempt.passed ? t('result.passed') : t('result.failed')),
        h('p', { class: 'result__score' },
          h('span', { class: 'result__score-num', id: 'result-score' }, String(attempt.score)),
          h('span', { class: 'result__score-max' }, '/100')),
        h('p', { class: 'result__passmark' }, t('result.passMark', { mark: SA.scoring.PASS_MARK })),
        h('dl', { class: 'facts' },
          h('dt', null, t('result.wrong')), h('dd', { id: 'result-wrong' }, t('result.wrongOf', { wrong: attempt.wrong, steps: attempt.steps })),
          h('dt', null, t('result.module')), h('dd', null, ui.moduleTitle(attempt.module, ctx.lang)),
          h('dt', null, t('result.worker')), h('dd', null, w.name + ' · ' + w.id))
      ),
      attempt.passed
        ? ui.btn(t('result.getCert'), { onClick: getCertificate, id: 'result-cert' })
        : ui.btn(t('result.retry'), { href: '#/briefing/' + attempt.module, id: 'result-retry' }),
      ui.btn(t('nav.home'), { href: '#/home', variant: 'secondary' })
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
