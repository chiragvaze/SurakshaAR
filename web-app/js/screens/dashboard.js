/*
 * Supervisor dashboard (docs/10_RETENTION_DASHBOARD.md): seeded workers + this phone's
 * worker, risk/status/refresher, and the +7-day logical time control. No auth/backend
 * by design for the prototype (docs/24_DECISION_LOG.md D-004). Also the public GitHub
 * Pages page. Ids (#tile-*, #dash-*, [data-worker]) are kept for tests and the demo script.
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

    function tile(label, value, tone, icon, id) {
      return ui.metric({ label: label, value: value, tone: tone, icon: icon, id: id, cls: 'tile' });
    }

    function cell(col, content, cls) {
      return h('td', { class: cls || null, 'data-label': t('dash.col.' + col) }, content);
    }

    var table = h('table', { class: 'dash-table', id: 'dash-table' },
      h('thead', null, h('tr', null,
        ['worker', 'module', 'score', 'fails', 'risk', 'status', 'refresher'].map(function (c) {
          return h('th', { scope: 'col' }, t('dash.col.' + c));
        }))),
      h('tbody', null, rows.map(function (r) {
        var tone = { green: 'success', amber: 'warning', red: 'danger' }[r.status];
        var meter = h('span', { class: 'risk-meter__fill tone-' + tone });
        meter.style.width = Math.max(3, r.risk) + '%';
        return h('tr', { class: r.local ? 'is-local' : '', 'data-worker': r.id },
          h('th', { scope: 'row' },
            h('span', { class: 'dash-who' }, ui.avatar(r.name, { size: 'sm', seed: r.id }),
              h('span', { class: 'dash-who__text' },
                h('span', { class: 'dash-name' }, r.name),
                h('span', { class: 'dash-sub' }, r.id + (r.local ? ' · ' + t('dash.thisDevice') : '')),
                h('span', { class: 'dash-sub' }, t('dash.daysAgo', { days: r.daysSince }))))),
          cell('module', ui.moduleTitle(r.module, ctx.lang)),
          cell('score', String(r.score), 'num'),
          cell('fails', String(r.fails), 'num'),
          cell('risk', h('span', { class: 'risk-meter' }, h('span', { class: 'num num--risk' }, String(r.risk)), h('span', { class: 'risk-meter__track', 'aria-hidden': 'true' }, meter))),
          cell('status', ui.statusBadge(t, r.status)),
          cell('refresher', ui.refresherBadge(t, r.refresherDue)));
      })));

    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/welcome', wide: true, cls: 'screen--dash' }, [
      ui.title(t('dash.title'), t('dash.seedNote'), { eyebrow: t('app.name') }),
      h('section', { class: 'gcard gcard--glass time-bar' },
        h('div', { class: 'time-bar__info' },
          h('span', { class: 'row__icon tone-' + (offsetDays ? 'warning' : 'primary') }, ui.icon('calendar', { size: 20 })),
          h('p', { class: 'time-bar__label', id: 'dash-time', tabindex: '-1', 'aria-live': 'polite' },
            offsetDays ? t('dash.timeOffset', { days: offsetDays }) : t('dash.timeNow'))),
        h('div', { class: 'btn-row' },
          ui.btn(t('dash.simulate'), { onClick: simulate, id: 'dash-simulate', icon: 'plus' }),
          ui.btn(t('dash.reset'), { variant: 'secondary', onClick: reset, disabled: !offsetDays, id: 'dash-reset', icon: 'refresh' }))),
      h('div', { class: 'metrics tiles' },
        tile(t('dash.summary.workers'), rows.length, null, 'users', 'tile-workers'),
        tile(t('risk.green'), count.green, 'success', 'checkCircle', 'tile-green'),
        tile(t('risk.amber'), count.amber, 'warning', 'alert', 'tile-amber'),
        tile(t('risk.red'), count.red, 'danger', 'xCircle', 'tile-red'),
        tile(t('dash.summary.due'), count.due, 'danger', 'clock', 'tile-due')),
      h('div', { class: 'table-wrap gcard', role: 'region', 'aria-label': t('dash.title') }, table)
    ]);
  };

  SA.screens.error = function (ctx) {
    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/welcome' }, [
      ui.title(ctx.t('err.title')),
      ui.errorState({ title: ctx.t('err.generic'), text: ctx.t('offline.text') }),
      ui.btn(ctx.t('nav.home'), { href: ctx.state.worker ? '#/home' : '#/welcome' })
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
