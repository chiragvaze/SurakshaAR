/*
 * Practice screens (never scored, never issue certificates, nothing stored):
 *   #/replay[/<module>][?drill=1]  Haadsa Replay — walk through the real scenario decisions,
 *                                  see the consequence of each choice; Pressure Drill = timed
 *   #/coach                        Safety Coach chat (offline content-based guide, SA.coach)
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  // ---------------- Haadsa Replay / Pressure Drill ----------------
  var run = null;        // in-memory practice run (not persisted, not scored)
  var timer = null;

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  if (root.addEventListener) root.addEventListener('hashchange', stopTimer);

  function newRun(moduleId, drill) {
    var sc = SA.scenario.get(moduleId);
    return {
      module: moduleId, drill: !!drill, index: 0, startedMs: Date.now(),
      steps: sc.steps.map(function (s, i) {
        var opts = s.options.slice();
        for (var k = 0; k < i + 1; k++) opts.push(opts.shift()); // vary order per moment, deterministic
        return { step: s, options: opts, choice: null, safe: null, ms: null, timedOut: false };
      }),
      momentStart: Date.now(), done: false
    };
  }

  function chooser(ctx, drill) {
    var t = ctx.t;
    return ui.page(ctx, { back: '#/train' }, [
      h('div', { class: 'module-head' },
        h('span', { class: 'module-head__icon tone-' + (drill ? 'warning' : 'purple'), 'aria-hidden': 'true' }, ui.icon(drill ? 'timer' : 'replay', { size: 28, stroke: 1.8 })),
        h('div', { class: 'module-head__text' },
          h('h1', { class: 'page__title', tabindex: '-1' }, drill ? t('drill.title') : t('replay.title')),
          h('p', { class: 'page__sub' }, drill ? t('drill.sub') : t('replay.sub')))),
      ui.segmented({
        label: t('train.practice'), id: 'replay-mode', value: drill ? 'drill' : 'replay', cls: 'segmented--block',
        options: [{ value: 'replay', label: t('replay.title'), icon: 'replay', id: 'mode-replay' }, { value: 'drill', label: t('drill.title'), icon: 'timer', id: 'mode-drill' }],
        onChange: function (v) { ctx.navigate(v === 'drill' ? '#/replay?drill=1' : '#/replay'); }
      }),
      ui.notice(t('replay.note'), 'info'),
      ui.section({ title: t('replay.choose') },
        h('div', { class: 'tcards' }, SA.validation.MODULE_IDS.map(function (id) {
          var L = SA.trainUI.look(id);
          return ui.card({ href: '#/replay/' + id + (drill ? '?drill=1' : ''), cls: 'tcard', id: 'replay-' + id }, [
            h('span', { class: 'tcard__thumb tone-' + L.tone, 'aria-hidden': 'true' }, ui.icon(L.icon, { size: 30, stroke: 1.8 })),
            h('span', { class: 'tcard__body' },
              h('span', { class: 'tcard__title' }, ui.moduleTitle(id, ctx.lang)),
              h('span', { class: 'tcard__meta' }, ui.chip(t('train.steps', { n: SA.scenario.get(id).steps.length }), { icon: 'layers' }),
                drill ? ui.chip(t('drill.secondsLeft', { s: SA.practice.DRILL_SECONDS }), { icon: 'timer', tone: 'warning' }) : null)),
            h('span', { class: 'row__chev' }, ui.icon('chevronRight', { size: 20 }))]);
        })))
    ]);
  }

  function timeline(r) {
    return h('ol', { class: 'timeline', 'aria-hidden': 'true' },
      r.steps.map(function (s, i) {
        var cls = s.choice === null && !s.timedOut ? (i === r.index ? 'is-current' : '') : s.safe ? 'is-safe' : 'is-unsafe';
        return h('li', { class: 'timeline__item ' + cls },
          h('span', { class: 'timeline__dot' }, s.choice === null && !s.timedOut ? String(i + 1) : ui.icon(s.safe ? 'check' : 'x', { size: 12, stroke: 3 })));
      }));
  }

  SA.screens.replay = function (ctx) {
    var t = ctx.t;
    stopTimer();
    var drill = ctx.query.drill === '1';
    var moduleId = ctx.param;
    if (!moduleId || !SA.scenario.get(moduleId)) { run = null; return chooser(ctx, drill); }
    if (!run || run.module !== moduleId || run.drill !== drill) run = newRun(moduleId, drill);
    var r = run;
    var base = '#/replay/' + moduleId + (drill ? '?drill=1' : '');

    if (r.done) {
      var safe = r.steps.filter(function (s) { return s.safe; }).length;
      var avg = r.steps.reduce(function (a, s) { return a + (s.ms || 0); }, 0) / r.steps.length / 1000;
      return ui.page(ctx, { back: '#/replay' + (drill ? '?drill=1' : '') }, [
        timeline(r),
        h('section', { class: 'gcard gcard--glass result', id: 'replay-summary' },
          h('p', { class: 'eyebrow' }, (drill ? t('drill.title') : t('replay.title')) + ' · ' + ui.moduleTitle(moduleId, ctx.lang)),
          ui.ring({ value: safe, max: r.steps.length, size: 140, stroke: 12, tone: safe === r.steps.length ? 'success' : 'warning', label: t('replay.doneText', { n: safe, total: r.steps.length }),
            center: h('span', { class: 'result__score' }, h('span', { class: 'result__score-num tabular' }, String(safe)), h('span', { class: 'result__score-max' }, '/' + r.steps.length)) }),
          h('h1', { class: 'result__headline', tabindex: '-1' }, t('replay.done')),
          h('p', { class: 'result__passmark' }, t('replay.doneText', { n: safe, total: r.steps.length })),
          h('p', { class: 'result__passmark tabular', id: 'replay-avg' }, t('replay.avgTime', { s: avg.toFixed(1) }))),
        ui.notice(t('replay.note'), 'info'),
        h('div', { class: 'stack' },
          ui.btn(t('replay.again'), { onClick: function () { run = newRun(moduleId, drill); ctx.rerender({ keepScroll: false }); }, id: 'replay-again', icon: 'refresh' }),
          ui.btn(t('home.next.cta') + ' · ' + ui.moduleTitle(moduleId, ctx.lang), { href: '#/briefing/' + moduleId, variant: 'secondary', icon: 'play' }))
      ]);
    }

    var cur = r.steps[r.index];
    var key = 'scn.' + cur.step.id;
    var answered = cur.choice !== null || cur.timedOut;

    function pick(opt) {
      if (cur.choice !== null || cur.timedOut) return;
      stopTimer();
      cur.choice = opt;
      cur.safe = opt === cur.step.correct;
      cur.ms = Date.now() - r.momentStart;
      if (root.navigator && root.navigator.vibrate) { try { root.navigator.vibrate(cur.safe ? 15 : [30, 40, 30]); } catch (e) { /* no haptics */ } }
      ctx.rerender({ focus: '#replay-consequence-title' });
    }
    function next() {
      if (r.index < r.steps.length - 1) { r.index++; r.momentStart = Date.now(); } else r.done = true;
      ctx.rerender({ keepScroll: false });
    }

    var clock = null;
    if (drill && !answered) {
      var left = SA.practice.DRILL_SECONDS - Math.floor((Date.now() - r.momentStart) / 1000);
      var label = h('span', { class: 'drill-clock__text tabular', id: 'drill-left' }, t('drill.secondsLeft', { s: Math.max(0, left) }));
      var fill = h('span', { class: 'drill-clock__fill' });
      fill.style.width = Math.max(0, 100 * left / SA.practice.DRILL_SECONDS) + '%';
      clock = h('div', { class: 'drill-clock', role: 'timer', 'aria-live': 'off' }, ui.icon('timer', { size: 16 }), label, h('span', { class: 'drill-clock__bar' }, fill));
      timer = setInterval(function () {
        var l = SA.practice.DRILL_SECONDS - (Date.now() - r.momentStart) / 1000;
        if (l <= 0) {
          stopTimer();
          cur.timedOut = true; cur.safe = false; cur.ms = SA.practice.DRILL_SECONDS * 1000;
          ctx.rerender({ focus: '#replay-consequence-title' });
          return;
        }
        label.textContent = t('drill.secondsLeft', { s: Math.ceil(l) });
        fill.style.width = Math.max(0, 100 * l / SA.practice.DRILL_SECONDS) + '%';
      }, 250);
    }

    var consequence = null;
    if (answered) {
      consequence = h('section', { class: 'consequence consequence--' + (cur.safe ? 'safe' : 'unsafe'), role: 'status', id: 'replay-consequence' },
        h('h2', { class: 'consequence__title', id: 'replay-consequence-title', tabindex: '-1' },
          ui.icon(cur.safe ? 'shieldCheck' : 'alert', { size: 22 }),
          cur.timedOut ? t('replay.timeUp') : cur.safe ? t('replay.safe') : t('replay.unsafe')),
        !cur.safe ? h('p', { class: 'consequence__safe' }, ui.icon('check', { size: 16, stroke: 3 }), t(key + '.opt.' + cur.step.correct), ui.satRef(ctx, key + '.opt.' + cur.step.correct)) : null,
        h('p', { class: 'consequence__why' }, t(key + '.why'), ui.satRef(ctx, key + '.why')),
        ui.btn(r.index < r.steps.length - 1 ? t('replay.next') : t('replay.finish'), { onClick: next, id: 'replay-next', icon: 'chevronRight' }));
    }

    return ui.page(ctx, { back: '#/replay' + (drill ? '?drill=1' : ''), barTitle: drill ? t('drill.title') : t('replay.title'), cls: 'screen--replay' }, [
      h('div', { class: 'replay-scene' },
        h('div', { class: 'replay-scene__head' },
          h('span', { class: 'eyebrow' }, ui.moduleTitle(moduleId, ctx.lang)),
          h('span', { class: 'chip chip--glass' }, ui.icon('replay', { size: 14 }), t('replay.moment', { n: r.index + 1, total: r.steps.length }))),
        timeline(r),
        h('p', { class: 'replay-scene__prompt', id: 'replay-prompt' }, t(key + '.prompt'), ui.satRef(ctx, key + '.prompt'))),
      clock,
      h('h1', { class: 'replay-ask', tabindex: '-1' }, t('replay.ask')),
      h('div', { class: 'options', role: 'group', 'aria-labelledby': 'replay-prompt' },
        cur.options.map(function (opt, i) {
          var cls = 'option';
          if (answered) cls += opt === cur.step.correct ? ' is-correct' : opt === cur.choice ? ' is-wrong' : ' is-dim';
          return h('button', { type: 'button', class: cls, disabled: answered, 'data-option': opt, onClick: function () { pick(opt); } },
            h('span', { class: 'option__letter', 'aria-hidden': 'true' }, 'ABC'.charAt(i)),
            h('span', { class: 'option__text' }, h('span', { class: 'option__label' }, t(key + '.opt.' + opt)), ui.satRef(ctx, key + '.opt.' + opt)));
        })),
      consequence,
      h('p', { class: 'demo-note' }, t('replay.note'))
    ]);
  };

  // ---------------- Safety Coach ----------------
  var chat = [];          // in-memory conversation for this app session
  var chatWorker = null;

  SA.screens.coach = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    if (chatWorker !== w.id) { chat = []; chatWorker = w.id; }
    var listEl = h('div', { class: 'chat', id: 'coach-chat', 'aria-live': 'polite' });
    var input = h('input', { class: 'chat-input__field', id: 'coach-input', type: 'text', maxlength: '200', placeholder: t('coach.placeholder'), 'aria-label': t('coach.placeholder'), autocomplete: 'off' });

    function bubble(m) {
      if (m.from === 'you') return h('div', { class: 'msg msg--you' }, h('span', { class: 'sr-only' }, t('coach.you') + ': '), m.text);
      var a = m.answer;
      return h('div', { class: 'msg msg--bot' },
        h('span', { class: 'msg__avatar', 'aria-hidden': 'true' }, ui.icon('sparkle', { size: 16 })),
        h('div', { class: 'msg__body' },
          h('span', { class: 'sr-only' }, t('coach.bot') + ': '),
          a.text ? h('p', { class: 'msg__text' }, a.text) : null,
          (a.cards || []).map(function (c) {
            return h('div', { class: 'msg-card', 'data-step': c.stepId },
              h('p', { class: 'msg-card__q' }, c.prompt, ui.satRef(ctx, 'scn.' + c.stepId + '.prompt')),
              h('p', { class: 'msg-card__safe' }, ui.icon('checkCircle', { size: 16 }), c.safe, ui.satRef(ctx, c.safeKey)),
              h('p', { class: 'msg-card__why' }, c.why, ui.satRef(ctx, 'scn.' + c.stepId + '.why')));
          }),
          a.choices ? h('div', { class: 'chips' }, a.choices.map(function (c) {
            return h('button', { type: 'button', class: 'chip chip--primary chip-btn', 'data-explain': c.stepId, onClick: function () { pushAnswer(c.label, SA.coach.explainStep(c.stepId, ctx)); } }, c.label);
          })) : null,
          (a.actions || []).length ? h('div', { class: 'cluster' }, a.actions.map(function (x) { return ui.btn(t(x.key), { href: x.href, variant: 'soft', size: 'sm', block: false, icon: 'chevronRight' }); })) : null));
    }

    function paint() {
      var msgs = [{ from: 'bot', answer: { text: t('coach.hello', { name: w.name }), cards: [], actions: [] } }].concat(chat);
      listEl.replaceChildren.apply(listEl, msgs.map(bubble));
      if (listEl.lastChild && listEl.lastChild.scrollIntoView) { try { listEl.lastChild.scrollIntoView({ block: 'end', behavior: 'smooth' }); } catch (e) { /* old webview */ } }
    }
    function pushAnswer(q, ans) {
      chat.push({ from: 'you', text: q });
      chat.push({ from: 'bot', answer: ans });
      if (chat.length > 40) chat = chat.slice(-40);
      paint();
    }
    function ask(q) {
      q = String(q || '').trim();
      if (!q) return;
      pushAnswer(q, SA.coach.answer(q, ctx));
      input.value = '';
    }

    var prompts = ['explain', 'refresher', 'ppe', 'test', 'why'];
    paint();
    return ui.page(ctx, { back: '#/home', cls: 'screen--coach' }, [
      h('div', { class: 'coach-head' },
        h('span', { class: 'coach-card__icon coach-head__icon', 'aria-hidden': 'true' }, ui.icon('sparkle', { size: 24 })),
        h('div', null,
          h('h1', { class: 'page__title', tabindex: '-1' }, t('coach.title')),
          h('p', { class: 'page__sub' }, t('coach.sub')))),
      ui.notice(t('coach.note'), 'info', { id: 'coach-note' }),
      listEl,
      h('div', { class: 'chat-dock' },
      h('div', { class: 'chips chips--scroll', role: 'group', 'aria-label': t('coach.title') },
        prompts.map(function (p) {
          return h('button', { type: 'button', class: 'chip chip--glass chip-btn', id: 'coach-prompt-' + p, onClick: function () { ask(t('coach.prompt.' + p)); } }, t('coach.prompt.' + p));
        })),
      h('form', { class: 'chat-input', id: 'coach-form', onSubmit: function (ev) { ev.preventDefault(); ask(input.value); } },
        input,
        h('button', { type: 'button', class: 'icon-btn chat-input__mic', disabled: true, 'aria-label': t('coach.voiceOff'), title: t('coach.voiceOff'), id: 'coach-mic' }, ui.icon('micOff')),
        h('button', { type: 'submit', class: 'icon-btn chat-input__send', 'aria-label': t('coach.send'), id: 'coach-send' }, ui.icon('send'))))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
