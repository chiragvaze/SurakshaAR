/*
 * Supervisor dashboard (docs/10_RETENTION_DASHBOARD.md): seeded workers + this phone's
 * worker, risk/status/refresher, and the +7-day logical time control. No auth/backend
 * by design for the prototype (docs/24_DECISION_LOG.md D-004).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  var WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  var MAX_OFFSET_MS = 52 * WEEK_MS;

  SA.screens.dashboard = function (ctx) {
    var t = ctx.t;
    var rows = SA.retention.dashboardRows(SA.SEED_WORKERS, ctx.state, Date.now());
    var offsetDays = SA.clock.offsetDays(ctx.state);
    var count = { green: 0, amber: 0, red: 0, due: 0 };
    rows.forEach(function (r) { count[r.status]++; if (r.refresherDue) count.due++; });

    function simulate() {
      ctx.store.update(function (s) { s.retention.demoOffsetMs = Math.min(MAX_OFFSET_MS, s.retention.demoOffsetMs + WEEK_MS); });
      ctx.rerender({ keepScroll: true, focus: '#dash-time' });
    }
    function reset() {
      ctx.store.update(function (s) { s.retention.demoOffsetMs = 0; });
      ctx.rerender({ keepScroll: true, focus: '#dash-time' });
    }

    function tile(label, value, cls, id) {
      return h('div', { class: 'tile ' + (cls || ''), id: id }, h('span', { class: 'tile__value' }, String(value)), h('span', { class: 'tile__label' }, label));
    }

    var table = h('table', { class: 'dash-table', id: 'dash-table' },
      h('thead', null, h('tr', null,
        ['worker', 'module', 'score', 'fails', 'risk', 'status', 'refresher'].map(function (c) {
          return h('th', { scope: 'col' }, t('dash.col.' + c));
        }))),
      h('tbody', null, rows.map(function (r) {
        return h('tr', { class: r.local ? 'is-local' : '', 'data-worker': r.id },
          h('th', { scope: 'row' },
            h('span', { class: 'dash-name' }, r.name),
            h('span', { class: 'dash-sub' }, r.id + (r.local ? ' · ' + t('dash.thisDevice') : '')),
            h('span', { class: 'dash-sub' }, t('dash.daysAgo', { days: r.daysSince }))),
          h('td', null, ui.moduleTitle(r.module, ctx.lang)),
          h('td', { class: 'num' }, String(r.score)),
          h('td', { class: 'num' }, String(r.fails)),
          h('td', { class: 'num num--risk' }, String(r.risk)),
          h('td', null, ui.statusBadge(t, r.status)),
          h('td', null, ui.refresherBadge(t, r.refresherDue)));
      })));

    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/welcome', wide: true }, [
      ui.title(t('dash.title'), t('dash.seedNote')),
      h('div', { class: 'time-bar' },
        h('p', { class: 'time-bar__label', id: 'dash-time', tabindex: '-1', 'aria-live': 'polite' },
          h('span', { 'aria-hidden': 'true' }, '🗓 '),
          offsetDays ? t('dash.timeOffset', { days: offsetDays }) : t('dash.timeNow')),
        h('div', { class: 'btn-row' },
          ui.btn(t('dash.simulate'), { onClick: simulate, id: 'dash-simulate' }),
          ui.btn(t('dash.reset'), { variant: 'secondary', onClick: reset, disabled: !offsetDays, id: 'dash-reset' }))),
      h('div', { class: 'tiles' },
        tile(t('dash.summary.workers'), rows.length, '', 'tile-workers'),
        tile(t('risk.green'), count.green, 'tile--green', 'tile-green'),
        tile(t('risk.amber'), count.amber, 'tile--amber', 'tile-amber'),
        tile(t('risk.red'), count.red, 'tile--red', 'tile-red'),
        tile(t('dash.summary.due'), count.due, 'tile--due', 'tile-due')),
      h('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': t('dash.title') }, table)
    ]);
  };

  SA.screens.error = function (ctx) {
    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/welcome' }, [
      ui.title(ctx.t('err.title')),
      ui.notice(ctx.t('err.generic'), 'error'),
      ui.btn(ctx.t('nav.home'), { href: ctx.state.worker ? '#/home' : '#/welcome' })
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
