/*
 * Training Home: worker info, Retention Guard, module cards, certificate/verify.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  var MODULE_ICON = { fire_explosion: '🔥', gas_confined: '💨' };

  function statusText(t, st) {
    switch (st.kind) {
      case 'passed': return t('home.status.passed', { score: st.score });
      case 'failed': return t('home.status.failed', { score: st.score });
      case 'inProgress': return t('home.status.inProgress', { step: st.step, total: st.total });
      case 'unavailable': return t('home.status.unavailable');
      default: return t('home.status.new');
    }
  }

  function moduleCard(ctx, moduleId) {
    var st = SA.training.moduleStatus(ctx.state, moduleId);
    var content = [
      h('span', { class: 'card__icon', 'aria-hidden': 'true' }, MODULE_ICON[moduleId] || '•'),
      h('span', { class: 'card__body' },
        h('span', { class: 'card__title' }, ui.moduleTitle(moduleId, ctx.lang)),
        h('span', { class: 'card__meta card__meta--' + st.kind }, statusText(ctx.t, st))),
      h('span', { class: 'card__chevron', 'aria-hidden': 'true' }, '›')
    ];
    if (st.kind === 'unavailable') {
      return h('div', { class: 'card card--module card--disabled', 'aria-disabled': 'true', id: 'module-' + moduleId }, content);
    }
    return h('a', { class: 'card card--module card--' + moduleId, href: '#/briefing/' + moduleId, id: 'module-' + moduleId }, content);
  }

  function retentionCard(ctx) {
    var t = ctx.t;
    var rec = SA.retention.workerRecord(ctx.state.attempts, ctx.state.worker.id);
    if (!rec) {
      return h('section', { class: 'retention', 'aria-labelledby': 'retention-h' },
        h('h2', { class: 'retention__title', id: 'retention-h' }, t('retention.title')),
        h('p', { class: 'retention__line' }, t('retention.none')));
    }
    var sum = SA.retention.summarize(rec, SA.clock.now(ctx.state));
    return h('section', { class: 'retention retention--' + sum.status, 'aria-labelledby': 'retention-h', id: 'retention-card' },
      h('div', { class: 'retention__head' },
        h('h2', { class: 'retention__title', id: 'retention-h' }, t('retention.title')),
        ui.statusBadge(t, sum.status)),
      h('p', { class: 'retention__risk' }, t('retention.risk', { risk: sum.risk })),
      h('p', { class: 'retention__line' }, t('retention.lastTraining', { days: sum.daysSince })),
      sum.refresherDue
        ? h('p', { class: 'retention__due' }, h('span', { 'aria-hidden': 'true' }, '⏰ '), t('retention.due'))
        : h('p', { class: 'retention__line' }, t('retention.nextIn', { days: sum.daysUntilRefresher }))
    );
  }

  SA.screens.home = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    return ui.page(ctx, { tab: 'home' }, [
      h('div', { class: 'worker-head' },
        h('h1', { class: 'page__title', tabindex: '-1' }, t('home.greeting', { name: w.name })),
        h('p', { class: 'worker-head__id' }, t('home.workerId', { id: w.id }))),
      ctx.lang === 'sat' ? ui.notice(t('sat.notice'), 'info') : null,
      retentionCard(ctx),
      h('h2', { class: 'section-title' }, t('home.modules')),
      h('div', { class: 'card-list' }, SA.validation.MODULE_IDS.map(function (id) { return moduleCard(ctx, id); })),
      h('h2', { class: 'section-title' }, t('home.more')),
      h('div', { class: 'card-grid' },
        h('a', { class: 'card card--tile', href: '#/certificate', id: 'home-certificate' },
          h('span', { class: 'card__icon', 'aria-hidden': 'true' }, '📜'),
          h('span', { class: 'card__title' }, t('home.certificate')),
          h('span', { class: 'card__meta' }, t('home.certificate.sub'))),
        h('a', { class: 'card card--tile', href: '#/verify', id: 'home-verify' },
          h('span', { class: 'card__icon', 'aria-hidden': 'true' }, '🔍'),
          h('span', { class: 'card__title' }, t('home.verify')),
          h('span', { class: 'card__meta' }, t('home.verify.sub')))),
      h('nav', { class: 'home-links' },
        h('a', { href: '#/dashboard', class: 'link', id: 'home-dashboard' }, t('home.dashboard')),
        h('a', { href: '#/manage', class: 'link', id: 'home-manage' }, t('home.manage')),
        h('a', { href: '#/profile', class: 'link' }, t('home.changeWorker')))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
