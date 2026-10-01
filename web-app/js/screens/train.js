/*
 * Training library (#/train): module TrainingCards + practice tools. Module status and
 * timings come from this worker's real attempts; nothing here changes training logic.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  var MODULE_LOOK = {
    fire_explosion: { icon: 'flame', tone: 'fire' },
    gas_confined: { icon: 'wind', tone: 'gas' }
  };

  /** Measured duration, or null when the trainer did not report a start time (AR results). */
  function measuredMs(a) { return a && a.completedMs > a.startedMs ? a.completedMs - a.startedMs : null; }

  function look(id) { return MODULE_LOOK[id] || { icon: 'shield', tone: 'primary' }; }

  /** "2 min 5 s" from milliseconds. */
  function duration(t, ms) {
    var s = Math.max(1, Math.round(ms / 1000));
    return s < 60 ? t('res.timeSec', { s: s }) : t('res.timeMin', { m: Math.floor(s / 60), s: s % 60 });
  }

  function statusBadge(t, st) {
    switch (st.kind) {
      case 'passed': return ui.badge(t('home.status.passed', { score: st.score }), 'success', 'checkCircle');
      case 'failed': return ui.badge(t('home.status.failed', { score: st.score }), 'danger', 'alert');
      case 'inProgress': return ui.badge(t('home.status.inProgress', { step: st.step, total: st.total }), 'warning', 'clock');
      case 'unavailable': return ui.badge(t('home.status.unavailable'), 'neutral');
      default: return ui.badge(t('home.status.new'), 'neutral');
    }
  }

  /** TrainingCard: thumbnail, title, purpose, facts, status. */
  function trainingCard(ctx, moduleId, opts) {
    opts = opts || {};
    var t = ctx.t;
    var scenario = SA.scenario.get(moduleId);
    var st = SA.training.moduleStatus(ctx.state, moduleId);
    var L = look(moduleId);
    var mine = ctx.state.attempts.filter(function (a) { return a.workerId === ctx.state.worker.id && a.module === moduleId; });
    var last = mine[mine.length - 1];
    var content = [
      h('span', { class: 'tcard__thumb tone-' + L.tone, 'aria-hidden': 'true' },
        h('span', { class: 'tcard__thumb-ring' }), ui.icon(L.icon, { size: 30, stroke: 1.8 })),
      h('span', { class: 'tcard__body' },
        h('span', { class: 'tcard__title' }, ui.moduleTitle(moduleId, ctx.lang)),
        opts.compact ? null : h('span', { class: 'tcard__purpose' }, t('module.' + moduleId + '.purpose')),
        h('span', { class: 'tcard__meta' },
          ui.chip(t('train.steps', { n: scenario ? scenario.steps.length : 0 }), { icon: 'layers' }),
          SA.bridge.isARAvailable() ? ui.chip(t('train.ar'), { icon: 'cube', tone: 'primary' }) : null,
          measuredMs(last) !== null ? ui.chip(t('train.yourTime', { time: duration(t, measuredMs(last)) }), { icon: 'timer' }) : null),
        h('span', { class: 'tcard__status' }, statusBadge(t, st))),
      h('span', { class: 'row__chev' }, ui.icon('chevronRight', { size: 20 }))
    ];
    if (st.kind === 'unavailable') {
      return h('div', { class: 'gcard tcard is-disabled', 'aria-disabled': 'true', id: (opts.idPrefix || 'train-') + moduleId }, content);
    }
    return ui.card({ href: '#/briefing/' + moduleId, cls: 'tcard', id: (opts.idPrefix || 'train-') + moduleId }, content);
  }

  function practiceRows(t) {
    var rows = [
      ['replay', 'replay', 'train.replay.title', 'train.replay.sub', 'purple', '#/replay'],
      ['replay', 'timer', 'train.drill.title', 'train.drill.sub', 'warning', '#/replay?drill=1'],
      ['ppe', 'helmet', 'train.ppe.title', 'train.ppe.sub', 'teal', '#/ppe']
    ];
    return rows.filter(function (r) { return SA.screens[r[0]]; }).map(function (r) {
      return ui.row({ icon: r[1], tone: r[4], title: t(r[2]), sub: t(r[3], { s: SA.practice ? SA.practice.DRILL_SECONDS : 10 }), href: r[5], id: 'train-' + r[1] });
    });
  }

  SA.screens.train = function (ctx) {
    var t = ctx.t;
    var practice = practiceRows(t);
    return ui.page(ctx, { tab: 'train' }, [
      ui.title(t('train.title'), t('train.sub')),
      ui.section({ title: t('train.modules') },
        h('div', { class: 'tcards' }, SA.validation.MODULE_IDS.map(function (id) { return trainingCard(ctx, id); }))),
      practice.length ? ui.section({ title: t('train.practice') }, h('div', { class: 'list' }, practice)) : null
    ]);
  };

  SA.trainUI = { trainingCard: trainingCard, look: look, duration: duration, measuredMs: measuredMs, statusBadge: statusBadge };
})(typeof globalThis !== 'undefined' ? globalThis : window);
