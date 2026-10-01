/*
 * Module briefing (LEARN), assessment (FIND, browser trainer) and result (PROVE).
 * They render whatever scenario the engine gives them; nothing here is specific to Fire
 * or Gas, and the training/scoring pipeline (SA.scenario, SA.training) is unchanged.
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
      ui.errorState({ title: ctx.t('err.moduleUnavailable'), text: ctx.t('err.generic') }),
      ui.btn(ctx.t('nav.home'), { href: '#/home' })
    ]);
  }

  /** LEARN → FIND → PROVE; stage: 0 learn, 1 find, 2 prove, 3 all done. */
  function stages(t, stage) {
    return ui.stepper([
      { label: t('lfp.learn'), sub: t('lfp.learn.sub') },
      { label: t('lfp.find'), sub: t('lfp.find.sub') },
      { label: t('lfp.prove'), sub: t('lfp.prove.sub') }
    ], stage, { label: t('lfp.label'), id: 'lfp' });
  }

  function moduleHead(ctx, moduleId, sub) {
    var L = SA.trainUI.look(moduleId);
    return h('div', { class: 'module-head' },
      h('span', { class: 'module-head__icon tone-' + L.tone, 'aria-hidden': 'true' }, ui.icon(L.icon, { size: 28, stroke: 1.8 })),
      h('div', { class: 'module-head__text' },
        h('h1', { class: 'page__title', tabindex: '-1' }, ui.moduleTitle(moduleId, ctx.lang)),
        sub ? h('p', { class: 'page__sub' }, sub) : null));
  }

  // ---------------- Briefing (LEARN) ----------------
  SA.screens.briefing = function (ctx) {
    var t = ctx.t;
    var moduleId = ctx.param;
    var scenario = SA.scenario.get(moduleId);
    if (!scenario) return unavailable(ctx);
    var session = SA.training.getSession(moduleId);
    var ar = SA.bridge.isARAvailable();
    var status = h('div', { class: 'briefing__status', role: 'status' });

    function start(fresh) {
      // AR (Android shell) runs its own session in Unity; only the browser trainer needs a web session.
      var mode = SA.bridge.launch(moduleId, ctx.lang);
      if (mode === 'ar') {
        status.replaceChildren(h('span', { class: 'ar-launch' }, h('span', { class: 'ar-launch__pulse', 'aria-hidden': 'true' }), t('briefing.arOpening')));
        return;
      }
      if (fresh || !session) SA.training.startSession(moduleId);
      ctx.navigate('#/assess/' + moduleId);
    }

    var hazards = h('ol', { class: 'hazard-list', 'aria-label': t('briefing.steps') },
      scenario.steps.map(function (s, i) {
        var done = session && session.answers[i] !== null;
        return h('li', { class: 'hazard step-pill' + (done ? ' is-done' : '') },
          h('span', { class: 'hazard__n' }, done ? ui.icon('check', { size: 14, stroke: 3 }) : String(i + 1)),
          h('span', { class: 'hazard__body' },
            h('span', { class: 'hazard__label' }, t('briefing.hazard', { n: i + 1 })),
            h('span', { class: 'hazard__text' }, t('scn.' + s.id + '.prompt'))));
      }));

    return ui.page(ctx, { back: '#/home' }, [
      moduleHead(ctx, moduleId, t('module.' + moduleId + '.purpose')),
      stages(t, 0),
      h('section', { class: 'gcard', 'aria-labelledby': 'learn-h' },
        h('div', { class: 'card-head' }, h('span', { class: 'row__icon tone-primary' }, ui.icon('book', { size: 18 })), h('h2', { class: 'section-title', id: 'learn-h' }, t('briefing.learn.title'))),
        hazards,
        h('p', { class: 'briefing__hint' }, t('briefing.steps'))),
      h('div', { class: 'grid-2 briefing-modes' },
        h('section', { class: 'gcard gcard--sm' },
          h('span', { class: 'row__icon tone-teal' }, ui.icon(ar ? 'cube' : 'target', { size: 18 })),
          h('h2', { class: 'mini-title' }, t('briefing.find.title')),
          ui.chip(ar ? t('briefing.mode.ar') : t('briefing.mode.web'), { tone: ar ? 'primary' : undefined, id: 'briefing-mode' }),
          h('p', { class: 'mini-text' }, ar ? t('briefing.find.ar') : t('briefing.find.web'))),
        h('section', { class: 'gcard gcard--sm' },
          h('span', { class: 'row__icon tone-purple' }, ui.icon('award', { size: 18 })),
          h('h2', { class: 'mini-title' }, t('briefing.prove.title')),
          h('p', { class: 'mini-text' }, t('briefing.prove.text', { mark: SA.scoring.PASS_MARK })))),
      status,
      h('div', { class: 'stack sticky-cta' },
        session
          ? [ui.btn(t('briefing.resume', { step: session.stepIndex + 1, total: scenario.steps.length }), { onClick: function () { start(false); }, id: 'briefing-start', icon: 'play' }),
             ui.btn(t('briefing.restart'), { variant: 'secondary', onClick: function () { start(true); }, id: 'briefing-restart', icon: 'refresh' })]
          : ui.btn(t('briefing.start'), { onClick: function () { start(true); }, id: 'briefing-start', icon: ar ? 'cube' : 'play' }))
    ]);
  };

  // ---------------- Assessment (FIND, browser trainer) ----------------
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
      if (root.navigator && root.navigator.vibrate) { try { root.navigator.vibrate(res.session.answers[step.index] === step.correct ? 15 : [30, 40, 30]); } catch (e) { /* no haptics */ } }
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
        return h('li', { class: 'progress__seg ' + cls }, a === null ? String(i + 1) : ui.icon(a === s.correct ? 'check' : 'x', { size: 14, stroke: 3 }));
      }));

    var options = h('div', { class: 'options', role: 'group', 'aria-labelledby': 'step-prompt' },
      step.options.map(function (opt, i) {
        var cls = 'option';
        var tag = null;
        if (step.answered) {
          if (opt === step.correct) {
            cls += ' is-correct';
            tag = h('span', { class: 'option__tag' }, ui.icon('check', { size: 14, stroke: 3 }), opt === step.answer ? t('assess.correct') : t('assess.safeAnswer'));
          } else if (opt === step.answer) {
            cls += ' is-wrong';
            tag = h('span', { class: 'option__tag' }, ui.icon('x', { size: 14, stroke: 3 }), t('assess.wrong'));
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
          h('span', { class: 'feedback__icon' }, ui.icon(ok ? 'checkCircle' : 'xCircle', { size: 22 })), ok ? t('assess.correct') : t('assess.wrong')),
        h('p', { class: 'feedback__why' }, t(key + '.why')),
        ui.btn(step.isLast ? t('assess.finish') : t('assess.continue'), { onClick: next, id: 'assess-next', icon: step.isLast ? 'award' : 'chevronRight' }));
    }

    return ui.page(ctx, { back: '#/briefing/' + moduleId, barTitle: ui.moduleTitle(moduleId, ctx.lang) }, [
      stages(t, 1),
      h('div', { class: 'assess-head' },
        h('p', { class: 'assess-head__module' }, ui.chip(t('lfp.find'), { icon: 'target', tone: 'primary' })),
        h('p', { class: 'assess-head__step tabular', id: 'step-count' }, t('assess.step', { n: step.index + 1, total: step.total }))),
      progress,
      h('h1', { class: 'prompt', id: 'step-prompt', tabindex: '-1' }, t(key + '.prompt')),
      options,
      feedback
    ]);
  };

  // ---------------- Result (PROVE) ----------------
  SA.screens.result = function (ctx) {
    var t = ctx.t;
    var attempt = SA.training.lastAttempt(ctx.state);
    if (!attempt || attempt.workerId !== ctx.state.worker.id) {
      return ui.page(ctx, { back: '#/home' }, [
        ui.title(t('result.title')),
        ui.empty({ icon: 'award', title: t('result.none'), action: ui.btn(t('nav.home'), { href: '#/home', block: false }) })
      ]);
    }
    var w = ctx.state.worker;
    var safe = attempt.steps - attempt.wrong;
    var tone = attempt.passed ? 'success' : 'danger';
    var headline = attempt.score === 100 ? t('res.excellent') : attempt.passed ? t('res.good') : t('res.practice');

    function getCertificate() {
      try {
        SA.training.issueCertificate(attempt.id);
        ctx.navigate('#/certificate');
      } catch (e) {
        if (root.console) root.console.error(e);
        ui.toast(t('err.certFailed'), 'error');
      }
    }

    var metrics = h('div', { class: 'metrics result-metrics' },
      ui.metric({ label: t('res.metric.safe'), value: safe + '/' + attempt.steps, icon: 'shieldCheck', tone: 'success', id: 'result-safe' }),
      ui.metric({ label: t('res.metric.accuracy'), value: Math.round(100 * safe / attempt.steps), unit: '%', icon: 'target', tone: 'primary', id: 'result-accuracy' }),
      ui.metric({ label: t('res.metric.mistakes'), value: attempt.wrong, icon: 'alert', tone: attempt.wrong ? 'danger' : 'neutral', id: 'result-mistakes' }),
      ui.metric({ label: t('res.metric.time'), value: SA.trainUI.duration(t, attempt.completedMs - attempt.startedMs), icon: 'timer', tone: 'teal', id: 'result-time' }));

    return ui.page(ctx, { back: '#/home' }, [
      stages(t, attempt.passed ? 3 : 2),
      h('section', { class: 'gcard gcard--glass result result--' + (attempt.passed ? 'pass' : 'fail'), id: 'result-card' },
        h('p', { class: 'eyebrow' }, t('result.title') + ' · ' + ui.moduleTitle(attempt.module, ctx.lang)),
        ui.ring({
          value: attempt.score, size: 168, stroke: 14, tone: tone, label: t('result.score') + ' ' + attempt.score + '/100',
          center: h('span', { class: 'result__score' },
            h('span', { class: 'result__score-num tabular', id: 'result-score' }, String(attempt.score)),
            h('span', { class: 'result__score-max' }, '/100'))
        }),
        h('h1', { class: 'result__headline', tabindex: '-1' }, headline),
        h('p', { class: 'result__verdict', id: 'result-verdict' },
          ui.icon(attempt.passed ? 'checkCircle' : 'xCircle', { size: 18 }), attempt.passed ? t('result.passed') : t('result.failed')),
        h('p', { class: 'result__passmark' }, t('result.passMark', { mark: SA.scoring.PASS_MARK }))),
      metrics,
      ui.notice(attempt.wrong ? t('res.practiceAgain') : t('res.wellDone'), attempt.wrong ? 'warning' : 'success'),
      h('dl', { class: 'facts gcard gcard--sm' },
        h('dt', null, t('result.wrong')), h('dd', { id: 'result-wrong' }, t('result.wrongOf', { wrong: attempt.wrong, steps: attempt.steps })),
        h('dt', null, t('result.module')), h('dd', null, ui.moduleTitle(attempt.module, ctx.lang)),
        h('dt', null, t('result.worker')), h('dd', null, w.name + ' · ' + w.id)),
      h('div', { class: 'stack' },
        attempt.passed
          ? ui.btn(t('result.getCert'), { onClick: getCertificate, id: 'result-cert', icon: 'award' })
          : ui.btn(t('result.retry'), { href: '#/briefing/' + attempt.module, id: 'result-retry', icon: 'refresh' }),
        attempt.wrong && SA.screens.replay ? ui.btn(t('res.replayCta'), { href: '#/replay/' + attempt.module, variant: 'soft', id: 'result-replay', icon: 'replay' }) : null,
        ui.btn(t('nav.home'), { href: '#/home', variant: 'secondary', icon: 'home' }))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
