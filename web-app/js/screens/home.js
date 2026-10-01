/*
 * Home — personal safety command centre: greeting, Safety Status (readiness ring),
 * Retention Guard, continue training, quick actions, modules, today's safety, coach,
 * certificate / verify. All values come from local data via SA.insights / SA.training.
 * Ids used by tests and the demo script are kept (#module-*, #home-certificate,
 * #home-verify, #home-dashboard, #home-manage, #retention-card).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  function safetyStatus(ctx, nowMs) {
    var t = ctx.t;
    var r = SA.insights.readiness(ctx.state);
    var ppe = SA.safety ? SA.safety.ppeToday(ctx.state.worker.id, nowMs) : null;
    var tone = r.pct === 100 ? 'success' : r.pct > 0 ? 'primary' : 'warning';
    var checks = r.modules.map(function (m) {
      var ok = m.status.kind === 'passed';
      return h('li', { class: 'check-line' + (ok ? ' is-ok' : '') },
        h('span', { class: 'check-line__mark' }, ui.icon(ok ? 'check' : 'dot', { size: 14, stroke: 3 })),
        h('span', { class: 'check-line__text' }, ui.moduleTitle(m.id, ctx.lang)));
    });
    if (SA.safety) {
      var ppeOk = ppe && ppe.outcome === 'ready';
      checks.push(h('li', { class: 'check-line' + (ppeOk ? ' is-ok' : '') },
        h('span', { class: 'check-line__mark' }, ui.icon(ppeOk ? 'check' : 'dot', { size: 14, stroke: 3 })),
        h('span', { class: 'check-line__text' }, t('home.ppe') + ' · ' + (ppe ? t('home.ppe.today') : t('home.ppe.notToday')))));
    }
    return h('section', { class: 'gcard gcard--glass status-card', id: 'safety-status', 'aria-labelledby': 'status-h' },
      h('div', { class: 'status-card__text' },
        h('h2', { class: 'eyebrow', id: 'status-h' }, t('home.status.title')),
        h('p', { class: 'status-card__pct tabular' }, r.pct + '%'),
        h('p', { class: 'status-card__label' }, t('home.status.readiness')),
        h('ul', { class: 'check-list' }, checks)),
      ui.ring({ value: r.pct, size: 112, stroke: 11, tone: tone, label: t('home.status.readiness') + ' ' + r.pct + '%', id: 'readiness-ring',
        center: h('span', { class: 'status-card__ring-text' }, ui.icon('shieldCheck', { size: 30, stroke: 1.8 })) }));
  }

  function retentionCard(ctx, nowMs) {
    var t = ctx.t;
    var sum = SA.insights.retention(ctx.state, nowMs);
    if (!sum) {
      return h('section', { class: 'gcard retention', 'aria-labelledby': 'retention-h' },
        h('div', { class: 'retention__head' },
          h('span', { class: 'row__icon tone-neutral' }, ui.icon('activity', { size: 20 })),
          h('h2', { class: 'retention__title', id: 'retention-h' }, t('retention.title'))),
        h('p', { class: 'retention__line' }, t('retention.none')));
    }
    var tone = { green: 'success', amber: 'warning', red: 'danger' }[sum.status];
    return h('section', { class: 'gcard retention retention--' + sum.status, 'aria-labelledby': 'retention-h', id: 'retention-card' },
      h('div', { class: 'retention__head' },
        h('span', { class: 'row__icon tone-' + tone }, ui.icon('activity', { size: 20 })),
        h('h2', { class: 'retention__title', id: 'retention-h' }, t('retention.title')),
        ui.statusBadge(t, sum.status)),
      h('div', { class: 'retention__body' },
        h('p', { class: 'retention__risk tabular' }, t('retention.risk', { risk: sum.risk })),
        h('div', { class: 'retention__meter', role: 'img', 'aria-label': t('retention.risk', { risk: sum.risk }) }, meterFill(sum.risk, tone))),
      h('p', { class: 'retention__line' }, t('retention.lastTraining', { days: sum.daysSince })),
      sum.refresherDue
        ? h('p', { class: 'retention__due' }, ui.icon('clock', { size: 16 }), t('retention.due'))
        : h('p', { class: 'retention__line' }, t('retention.nextIn', { days: sum.daysUntilRefresher })));
  }

  function meterFill(pct, tone) {
    var f = h('span', { class: 'retention__meter-fill tone-' + tone });
    f.style.width = Math.max(2, pct) + '%';
    return f;
  }

  function continueCard(ctx) {
    var t = ctx.t;
    var next = SA.insights.nextModule(ctx.state);
    var L;
    if (!next) {
      if (!SA.screens.replay) return null;
      return ui.card({ cls: 'continue-card continue-card--done', id: 'home-continue', href: '#/replay' }, [
        h('span', { class: 'continue-card__icon tone-success' }, ui.icon('award', { size: 26 })),
        h('span', { class: 'continue-card__body' },
          h('span', { class: 'eyebrow' }, t('home.allDone.title')),
          h('span', { class: 'continue-card__title' }, t('train.replay.title')),
          h('span', { class: 'continue-card__sub' }, t('home.allDone.text'))),
        h('span', { class: 'row__chev' }, ui.icon('chevronRight', { size: 20 }))
      ]);
    }
    L = SA.trainUI.look(next.id);
    var st = next.status;
    var eyebrow = st.kind === 'inProgress' ? t('home.continue.title') : st.kind === 'failed' ? t('home.retry.title') : t('home.next.title');
    var progress = st.kind === 'inProgress' ? st.step - 1 : 0;
    var total = (SA.scenario.get(next.id) || { steps: [] }).steps.length;
    var bar = h('span', { class: 'continue-card__bar' }, (function () {
      var f = h('span', { class: 'continue-card__fill tone-' + L.tone });
      f.style.width = (total ? Math.round(100 * progress / total) : 0) + '%';
      return f;
    })());
    return h('section', { class: 'gcard continue-card', id: 'home-continue' },
      h('div', { class: 'continue-card__top' },
        h('span', { class: 'continue-card__icon tone-' + L.tone }, ui.icon(L.icon, { size: 26 })),
        h('span', { class: 'continue-card__body' },
          h('span', { class: 'eyebrow' }, eyebrow),
          h('span', { class: 'continue-card__title' }, ui.moduleTitle(next.id, ctx.lang)),
          h('span', { class: 'continue-card__sub tabular' }, st.kind === 'inProgress' ? t('home.continue.step', { step: st.step, total: st.total }) : t('train.steps', { n: total })))),
      bar,
      ui.btn(st.kind === 'inProgress' ? t('home.continue.cta') : t('home.next.cta'), { href: '#/briefing/' + next.id, id: 'home-continue-cta', icon: 'play' }));
  }

  function quickActions(ctx) {
    var t = ctx.t;
    var next = SA.insights.nextModule(ctx.state);
    var items = [
      { id: 'quick-ar', icon: 'cube', tone: 'primary', label: t('quick.ar'), href: '#/briefing/' + (next ? next.id : SA.validation.MODULE_IDS[0]) },
      SA.screens.ppe ? { id: 'quick-ppe', icon: 'helmet', tone: 'teal', label: t('quick.ppe'), href: '#/ppe' } : null,
      SA.screens.replay ? { id: 'quick-drill', icon: 'timer', tone: 'warning', label: t('quick.drill'), href: '#/replay?drill=1' } : null,
      SA.screens.sos ? { id: 'quick-sos', icon: 'siren', tone: 'danger', label: t('quick.sos'), href: '#/sos', sos: true } : null
    ].filter(Boolean);
    return ui.section({ title: t('home.quick') },
      h('div', { class: 'quick-grid' }, items.map(function (q) {
        return h('a', { class: 'quick' + (q.sos ? ' quick--sos' : ''), href: q.href, id: q.id },
          h('span', { class: 'quick__icon tone-' + q.tone }, ui.icon(q.icon, { size: 22 })),
          h('span', { class: 'quick__label' }, q.label));
      })));
  }

  function todaySection(ctx, nowMs) {
    var t = ctx.t;
    var last = SA.insights.lastAttempt(ctx.state);
    var ret = SA.insights.retention(ctx.state, nowMs);
    var clr = SA.insights.clearance(ctx.state, nowMs);
    var streak = SA.insights.streak(ctx.state, nowMs);
    function ago(ms) { var d = SA.retention.daysSince(ms, nowMs); return d === 0 ? t('today.today') : t('today.daysAgo', { days: d }); }
    var tiles = [
      { icon: 'zap', tone: 'warning', label: t('today.streak'), value: t('today.streakValue', { n: streak }), id: 'today-streak' },
      { icon: 'badgeCheck', tone: 'primary', label: t('today.lastAssessment'), value: last ? last.score + '/100 · ' + ago(last.completedMs) : t('common.none'), id: 'today-last' },
      { icon: 'calendar', tone: ret && ret.refresherDue ? 'danger' : 'teal', label: t('today.nextRefresher'), value: !ret ? t('common.none') : ret.refresherDue ? t('today.dueNow') : t('today.inDays', { days: ret.daysUntilRefresher }), id: 'today-refresher' },
      { icon: 'pin', tone: clr.cleared ? 'success' : 'neutral', label: t('today.clearance'), value: t('today.clearanceValue', { n: clr.cleared, total: clr.total }), id: 'today-clearance', href: '#/certificate' }
    ];
    return ui.section({ title: t('today.title') },
      h('div', { class: 'today-grid' }, tiles.map(function (x) {
        var inner = [h('span', { class: 'today__icon tone-' + x.tone }, ui.icon(x.icon, { size: 18 })), h('span', { class: 'today__label' }, x.label), h('span', { class: 'today__value tabular' }, x.value)];
        return x.href ? h('a', { class: 'today', href: x.href, id: x.id }, inner) : h('div', { class: 'today', id: x.id }, inner);
      })));
  }

  function coachCard(ctx, nowMs) {
    if (!SA.screens.coach) return null;
    var t = ctx.t;
    var last = SA.insights.lastAttempt(ctx.state);
    var ret = SA.insights.retention(ctx.state, nowMs);
    var tip = ret && ret.refresherDue ? t('coach.card.due')
      : last && last.score < 100 ? t('coach.card.weak', { module: ui.moduleTitle(last.module, ctx.lang), score: last.score })
      : t('coach.card.idle');
    return h('section', { class: 'gcard coach-card', id: 'home-coach' },
      h('div', { class: 'coach-card__head' },
        h('span', { class: 'coach-card__icon' }, ui.icon('sparkle', { size: 20 })),
        h('h2', { class: 'section-title' }, t('coach.card.title'))),
      h('p', { class: 'coach-card__tip' }, tip),
      h('div', { class: 'btn-row' },
        ui.btn(t('coach.card.cta'), { href: '#/coach', variant: 'secondary', icon: 'coach' }),
        SA.screens.replay ? ui.btn(t('coach.card.replay'), { href: '#/replay' + (last ? '/' + last.module : ''), variant: 'soft', icon: 'replay' }) : null));
  }

  SA.screens.home = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    var nowMs = SA.clock.now(ctx.state);
    return ui.page(ctx, { tab: 'home' }, [
      h('div', { class: 'home-head' },
        h('div', { class: 'home-head__text' },
          h('h1', { class: 'page__title', tabindex: '-1' }, t('home.greeting', { name: w.name })),
          h('p', { class: 'page__sub' }, t('home.ready')),
          h('p', { class: 'worker-head__id tabular' }, t('home.workerId', { id: w.id }))),
        h('a', { class: 'home-head__avatar', href: '#/me', 'aria-label': t('tab.me') }, ui.avatar(w.name, { size: 'md', seed: w.id }))),
      ctx.lang === 'sat' ? ui.notice(t('sat.notice'), 'info') : null,
      safetyStatus(ctx, nowMs),
      continueCard(ctx),
      quickActions(ctx),
      retentionCard(ctx, nowMs),
      ui.section({ title: t('home.modules'), action: { label: t('common.seeAll'), href: '#/train', id: 'home-train' } },
        h('div', { class: 'tcards' }, SA.validation.MODULE_IDS.map(function (id) { return SA.trainUI.trainingCard(ctx, id, { idPrefix: 'module-', compact: true }); }))),
      todaySection(ctx, nowMs),
      coachCard(ctx, nowMs),
      ui.section({ title: t('home.more') },
        h('div', { class: 'grid-2' },
          ui.card({ href: '#/certificate', id: 'home-certificate', cls: 'tile-link' }, [
            h('span', { class: 'row__icon tone-primary' }, ui.icon('award', { size: 20 })),
            h('span', { class: 'tile-link__title' }, t('home.certificate')),
            h('span', { class: 'tile-link__sub' }, t('home.certificate.sub'))]),
          ui.card({ href: '#/verify', id: 'home-verify', cls: 'tile-link' }, [
            h('span', { class: 'row__icon tone-teal' }, ui.icon('scan', { size: 20 })),
            h('span', { class: 'tile-link__title' }, t('home.verify')),
            h('span', { class: 'tile-link__sub' }, t('home.verify.sub'))]))),
      h('nav', { class: 'list home-links', 'aria-label': t('home.moreTitle') },
        SA.screens.nearmiss ? ui.row({ icon: 'report', tone: 'warning', title: t('home.nearmiss'), href: '#/nearmiss', id: 'home-nearmiss' }) : null,
        ui.row({ icon: 'chart', tone: 'blue', title: t('home.dashboard'), href: '#/dashboard', id: 'home-dashboard' }),
        ui.row({ icon: 'grid', tone: 'purple', title: t('home.manage'), href: '#/manage', id: 'home-manage' }),
        ui.row({ icon: 'users', tone: 'neutral', title: t('home.changeWorker'), href: '#/profile', id: 'home-change-worker' }))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
