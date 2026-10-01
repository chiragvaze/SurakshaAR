/*
 * Local Role-Based Dashboard Prototype (management mode), separate from the worker flow.
 *   #/manage                                role selection
 *   #/manage/<trainer|officer|contractor>   role dashboard; ?view=<tab> picks a section
 * All figures come from SA.management (computed from this device's local data).
 * Role selection is a prototype convenience, NOT authentication.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  function mt(key, params) { return SA.i18n.tFor('en', key, params, SA.MGMT_STRINGS); }

  var ROLE_ICON = { trainer: '🧑‍🏫', officer: '🦺', contractor: '👷' };
  var TABS = {
    trainer: ['dashboard', 'workers', 'training'],
    officer: ['dashboard', 'risk', 'certificates'],
    contractor: ['dashboard', 'workers', 'certificates']
  };

  function workerAppHref(state) { return state.worker && state.settings.language ? '#/home' : '#/welcome'; }

  function moduleName(id) { return ui.moduleTitle(id, 'en'); }

  function fmtDate(ms) { return SA.i18n.formatDate(ms, 'en'); }

  // ---------- small building blocks ----------

  function tile(label, value, cls, id) {
    return h('div', { class: 'tile ' + (cls || ''), id: id },
      h('span', { class: 'tile__value' }, value === null || value === undefined ? mt('m.noRecord') : String(value)),
      h('span', { class: 'tile__label' }, label));
  }

  function section(titleKey, children, id) {
    return h('section', { class: 'msection', id: id, 'aria-labelledby': id ? id + '-h' : null },
      h('h2', { class: 'section-title', id: id ? id + '-h' : null }, mt(titleKey)), children);
  }

  /** Horizontal bar: label, filled share of total, and the value as text (not colour alone). */
  function bar(label, n, total, cls, valueText) {
    var p = total ? Math.round(100 * n / total) : 0;
    var fill = h('span', { class: 'mbar__fill ' + (cls || ''), 'data-pct': String(p) });
    // CSSOM, not a style attribute: the dev server's strict CSP (style-src 'self') blocks the latter.
    fill.style.width = p + '%';
    return h('div', { class: 'mbar' },
      h('span', { class: 'mbar__label' }, label),
      h('span', { class: 'mbar__track', role: 'img', 'aria-label': label + ': ' + (valueText || n) }, fill),
      h('span', { class: 'mbar__value' }, valueText || String(n)));
  }

  function riskBadge(status) {
    if (!status) return h('span', { class: 'badge badge--none' }, mt('m.risk.none'));
    return h('span', { class: 'badge badge--' + status }, mt('m.risk.' + status));
  }

  function statusPill(training) { return h('span', { class: 'mpill mpill--' + training }, mt('m.status.' + training)); }

  function refresherPill(w) {
    if (w.untrained) return h('span', { class: 'mpill mpill--muted' }, mt('m.noRecord'));
    return w.refresherDue
      ? h('span', { class: 'mpill mpill--refresher' }, '⏰ ' + mt('m.refresher.due'))
      : h('span', { class: 'mpill mpill--current' }, mt('m.refresher.current'));
  }

  function certPill(certStatus) {
    if (certStatus === 'valid') return h('span', { class: 'badge badge--green' }, '✓ ' + mt('m.cert.valid'));
    if (certStatus === 'attention') return h('span', { class: 'badge badge--amber' }, '! ' + mt('m.cert.attention'));
    return h('span', { class: 'mpill mpill--muted' }, mt('m.cert.none'));
  }

  function moduleScore(w, id) {
    var m = w.modules[id];
    return m ? String(m.score) : mt('m.noRecord');
  }

  /** One worker as a card (works on phones; wraps into a grid on wider screens). */
  function workerCard(w, fields) {
    var facts = [];
    function fact(label, value) { facts.push(h('dt', null, label), h('dd', null, value)); }
    if (fields.indexOf('scores') !== -1) {
      fact(mt('m.col.fire'), moduleScore(w, 'fire_explosion'));
      fact(mt('m.col.gas'), moduleScore(w, 'gas_confined'));
    }
    if (fields.indexOf('completion') !== -1) fact(mt('m.col.completion'), w.passedModules.length + ' / ' + SA.validation.MODULE_IDS.length);
    fact(mt('m.col.latest'), typeof w.score === 'number' ? String(w.score) : mt('m.noRecord'));
    return h('article', { class: 'mcard' + (w.local ? ' mcard--local' : ''), 'data-worker': w.id },
      h('div', { class: 'mcard__head' },
        h('span', { class: 'mcard__name' }, w.name),
        h('span', { class: 'mcard__id' }, w.id + ' · ' + (w.local ? mt('m.thisDevice') : mt('m.seeded')))),
      h('dl', { class: 'mfacts' }, facts),
      h('div', { class: 'mcard__badges' },
        statusPill(w.training),
        riskBadge(w.status),
        fields.indexOf('refresher') !== -1 ? refresherPill(w) : null,
        fields.indexOf('cert') !== -1 ? certPill(w.certStatus) : null));
  }

  function workerList(sum, fields, sortByRisk) {
    var list = sum.workers.slice();
    if (sortByRisk) list.sort(function (a, b) { return (b.risk || -1) - (a.risk || -1); });
    else list.sort(function (a, b) { return (b.local ? 1 : 0) - (a.local ? 1 : 0); });
    return h('div', { class: 'mcards', id: 'mgmt-workers' }, list.map(function (w) { return workerCard(w, fields); }));
  }

  function riskDistribution(sum) {
    return h('div', { class: 'mbars', id: 'mgmt-risk' },
      bar(mt('m.risk.green'), sum.risk.green, sum.total, 'mbar__fill--green'),
      bar(mt('m.risk.amber'), sum.risk.amber, sum.total, 'mbar__fill--amber'),
      bar(mt('m.risk.red'), sum.risk.red, sum.total, 'mbar__fill--red'));
  }

  function moduleProgress(sum) {
    var rows = SA.validation.MODULE_IDS.map(function (m) {
      var s = sum.modules[m];
      return bar(moduleName(m), s.passed, sum.total, 'mbar__fill--' + m, mt('m.progress.of', { n: s.passed, total: sum.total }));
    });
    rows.push(bar(mt('m.progress.overall'), sum.completed, sum.total, 'mbar__fill--amber', sum.completionPct + '%'));
    return h('div', { class: 'mbars', id: 'mgmt-progress' }, rows);
  }

  function certReason(c) {
    if (c.reason === 'expired') return mt('m.certs.reason.expired');
    if (!c.valid) return mt('m.certs.reason.invalid');
    return mt('m.certs.reason.refresher');
  }

  function certificateSection(sum) {
    var cards = sum.certs.map(function (c) {
      return h('article', { class: 'mcard', 'data-cert': c.workerId },
        h('div', { class: 'mcard__head' },
          h('span', { class: 'mcard__name' }, c.name),
          h('span', { class: 'mcard__id' }, c.workerId + ' · ' + (c.module ? moduleName(c.module) : '') + (typeof c.score === 'number' ? ' · ' + c.score + '/100' : ''))),
        h('p', { class: 'mcard__line' }, mt('m.certs.issued', { date: fmtDate(c.issuedMs), expiry: fmtDate(c.expiryMs) })),
        h('div', { class: 'mcard__badges' },
          certPill(c.status),
          c.status === 'attention' ? h('span', { class: 'mpill mpill--muted' }, certReason(c)) : null,
          c.recent ? h('span', { class: 'mpill mpill--current' }, mt('m.certs.recent')) : null));
    });
    return [
      h('div', { class: 'tiles' },
        tile(mt('m.certs.valid'), sum.certsValid, 'tile--green', 'mgmt-certs-valid'),
        tile(mt('m.certs.attention'), sum.certsAttention, 'tile--amber', 'mgmt-certs-attention'),
        tile(mt('m.certs.recent'), sum.certsRecent, '', 'mgmt-certs-recent')),
      cards.length ? h('div', { class: 'mcards', id: 'mgmt-certs' }, cards) : ui.notice(mt('m.certs.none'), 'info'),
      h('p', { class: 'demo-note' }, mt('m.certs.seedNote'))
    ];
  }

  // ---------- role views ----------

  function trainerView(ctx, sum, view) {
    if (view === 'workers') return section('m.workers.title', workerList(sum, ['scores', 'refresher']), 'mgmt-sec-workers');
    if (view === 'training') return assignView(ctx, sum);
    return [
      h('div', { class: 'tiles', id: 'mgmt-cards' },
        tile(mt('m.card.totalWorkers'), sum.total, '', 'mgmt-total'),
        tile(mt('m.card.completed'), sum.completed, 'tile--green', 'mgmt-completed'),
        tile(mt('m.card.avgScore'), sum.averageScore, '', 'mgmt-avg'),
        tile(mt('m.card.refresherDue'), sum.refresherDue, 'tile--due', 'mgmt-due')),
      section('m.progress.title', moduleProgress(sum), 'mgmt-sec-progress'),
      section('m.workers.title', workerList(sum, ['scores', 'refresher']), 'mgmt-sec-workers')
    ];
  }

  function assignView(ctx, sum) {
    var M = SA.management;
    var choices = sum.workers.slice().sort(function (a, b) { return (b.local ? 1 : 0) - (a.local ? 1 : 0); }); // this device's worker first
    var workerSel = h('select', { id: 'assign-worker', class: 'mselect' },
      choices.map(function (w) { return h('option', { value: w.id }, w.name + ' (' + w.id + ')'); }));
    var moduleSel = h('select', { id: 'assign-module', class: 'mselect' },
      SA.validation.MODULE_IDS.map(function (m) { return h('option', { value: m }, moduleName(m)); }));
    var dueInput = h('input', { id: 'assign-due', class: 'mselect', type: 'date', value: M.isoDate(sum.nowMs + 14 * SA.clock.DAY_MS) });
    function submit(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      try {
        M.addAssignment({ workerId: workerSel.value, module: moduleSel.value, due: dueInput.value }, SA.clock.now(ctx.store.get()));
        ui.toast(mt('m.assign.added'), 'info');
        ctx.rerender({ keepScroll: true });
      } catch (e) {
        ui.toast(mt('m.assign.invalid'), 'error');
      }
    }
    var list = sum.assignments.slice().reverse().map(function (a) {
      return h('article', { class: 'mcard', 'data-assignment': a.id },
        h('div', { class: 'mcard__head' },
          h('span', { class: 'mcard__name' }, a.name),
          h('span', { class: 'mcard__id' }, a.workerId + ' · ' + moduleName(a.module))),
        h('div', { class: 'mcard__badges' },
          h('span', { class: 'mpill ' + (a.overdue ? 'mpill--refresher' : 'mpill--current') },
            (a.overdue ? mt('m.assign.overdue') + ' · ' : '') + mt('m.assign.dueOn', { date: a.due })),
          ui.btn(mt('m.assign.remove'), { variant: 'secondary', block: false, onClick: function () { M.removeAssignment(a.id); ctx.rerender({ keepScroll: true }); } })));
    });
    return [
      section('m.assign.title', [
        h('p', { class: 'demo-note' }, mt('m.assign.note')),
        h('form', { class: 'form mform', id: 'assign-form', novalidate: true, onSubmit: submit },
          h('label', { class: 'field__label', for: 'assign-worker' }, mt('m.assign.worker')), workerSel,
          h('label', { class: 'field__label', for: 'assign-module' }, mt('m.assign.module')), moduleSel,
          h('label', { class: 'field__label', for: 'assign-due' }, mt('m.assign.due')), dueInput,
          ui.btn(mt('m.assign.submit'), { type: 'submit', id: 'assign-submit' }))
      ], 'mgmt-sec-assign'),
      section('m.assign.list', list.length ? h('div', { class: 'mcards', id: 'mgmt-assignments' }, list) : ui.notice(mt('m.assign.none'), 'info'), 'mgmt-sec-assignments'),
      section('m.progress.title', moduleProgress(sum), 'mgmt-sec-progress')
    ];
  }

  function officerView(ctx, sum, view) {
    if (view === 'risk') {
      return [
        section('m.officer.riskDist', [riskDistribution(sum), h('p', { class: 'demo-note' }, mt('m.officer.riskNote'))], 'mgmt-sec-risk'),
        ui.btn(mt('m.officer.simulator'), { href: '#/dashboard', variant: 'secondary', id: 'mgmt-simulator' }),
        section('m.workers.title', workerList(sum, ['scores', 'refresher', 'cert'], true), 'mgmt-sec-workers')
      ];
    }
    if (view === 'certificates') return section('m.certs.title', certificateSection(sum), 'mgmt-sec-certs');
    return [
      section('m.officer.compliance', h('div', { class: 'tiles', id: 'mgmt-cards' },
        tile(mt('m.card.totalWorkers'), sum.total, '', 'mgmt-total'),
        tile(mt('m.card.trained'), sum.trained, 'tile--green', 'mgmt-trained'),
        tile(mt('m.card.refresherDue'), sum.refresherDue, 'tile--due', 'mgmt-due'),
        tile(mt('m.card.highRisk'), sum.highRisk, 'tile--red', 'mgmt-highrisk'),
        tile(mt('m.card.certsValid'), sum.certsValid, 'tile--green', 'mgmt-certs-valid'),
        tile(mt('m.card.certsAttention'), sum.certsAttention, 'tile--amber', 'mgmt-certs-attention')), 'mgmt-sec-compliance'),
      section('m.officer.riskDist', [riskDistribution(sum), h('p', { class: 'demo-note' }, mt('m.officer.riskNote'))], 'mgmt-sec-risk'),
      section('m.officer.trends', [
        h('h3', { class: 'msub' }, mt('m.officer.trainingChart')),
        h('div', { class: 'mbars', id: 'mgmt-training-chart' },
          ['completed', 'inProgress', 'pending', 'refresher'].map(function (k) {
            return bar(mt('m.status.' + k), sum.training[k], sum.total, 'mbar__fill--' + k);
          })),
        h('h3', { class: 'msub' }, mt('m.officer.scoreChart')),
        h('div', { class: 'mbars', id: 'mgmt-score-chart' },
          sum.scoreBands.map(function (b) { return bar(b.label, b.n, sum.total, 'mbar__fill--amber'); })),
        h('h3', { class: 'msub' }, mt('m.officer.refresherChart')),
        h('div', { class: 'mbars' }, bar(mt('m.card.refresherDue'), sum.refresherDue, sum.total, 'mbar__fill--refresher', mt('m.progress.of', { n: sum.refresherDue, total: sum.total })))
      ], 'mgmt-sec-trends'),
      ui.btn(mt('m.officer.simulator'), { href: '#/dashboard', variant: 'secondary', id: 'mgmt-simulator' }),
      section('m.nearMiss.title', [ui.notice(mt('m.nearMiss.none'), 'info'), h('p', { class: 'demo-note' }, mt('m.nearMiss.note'))], 'mgmt-sec-nearmiss')
    ];
  }

  function contractorView(ctx, sum, view) {
    if (view === 'workers') return section('m.workers.title', workerList(sum, ['completion', 'cert']), 'mgmt-sec-workers');
    if (view === 'certificates') return section('m.certs.title', certificateSection(sum), 'mgmt-sec-certs');
    return [
      section('m.contractor.workforce', [h('div', { class: 'tiles', id: 'mgmt-cards' },
        tile(mt('m.card.totalWorkers'), sum.total, '', 'mgmt-total'),
        tile(mt('m.card.trained'), sum.trained, 'tile--green', 'mgmt-trained'),
        tile(mt('m.card.pending'), sum.pending, 'tile--amber', 'mgmt-pending'),
        tile(mt('m.card.refresherDue'), sum.refresherDue, 'tile--due', 'mgmt-due')),
        h('p', { class: 'demo-note' }, mt('m.contractor.defs'))], 'mgmt-sec-workforce'),
      section('m.contractor.completion', [
        h('p', { class: 'mbig', id: 'mgmt-completion' }, sum.completionPct + '%'),
        h('p', { class: 'demo-note' }, mt('m.contractor.completionNote', { n: sum.completed, total: sum.total })),
        moduleProgress(sum)
      ], 'mgmt-sec-completion'),
      section('m.workers.title', workerList(sum, ['completion', 'cert']), 'mgmt-sec-workers')
    ];
  }

  // ---------- shell ----------

  function shell(ctx, role, view, content) {
    var M = SA.management;
    var nav = role ? h('nav', { class: 'mtabs', 'aria-label': mt('m.role.' + role) },
      TABS[role].map(function (v) {
        return h('a', { class: 'mtab' + (v === view ? ' is-active' : ''), href: '#/manage/' + role + '?view=' + v, 'aria-current': v === view ? 'page' : null, id: 'mtab-' + v }, mt('m.tab.' + v));
      })) : null;
    var actions = role ? h('div', { class: 'mactions' },
      h('span', { class: 'mrole', id: 'mgmt-role' }, ROLE_ICON[role] + ' ' + mt('m.signedInAs', { role: mt('m.role.' + role) })),
      h('a', { class: 'link', href: '#/manage', id: 'mgmt-switch' }, mt('m.switchRole')),
      ui.btn(mt('m.logout'), { variant: 'secondary', block: false, id: 'mgmt-logout', onClick: function () { M.logout(); ctx.navigate('#/manage'); } })) : null;
    return h('div', { class: 'screen screen--wide mgmt', lang: 'en' },
      h('header', { class: 'appbar' },
        h('a', { class: 'appbar__brand', href: '#/manage' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }), mt('m.portal')),
        h('a', { class: 'appbar__lang', href: workerAppHref(ctx.state), id: 'mgmt-worker-app' }, mt('m.backToApp'))),
      h('main', { class: 'page', id: 'main' },
        h('h1', { class: 'page__title', tabindex: '-1' }, role ? mt('m.role.' + role) : mt('m.portal')),
        h('p', { class: 'page__sub' }, mt('m.portal.sub')),
        actions, nav, content));
  }

  function portal(ctx) {
    var M = SA.management;
    var sum = M.summary(ctx.state);
    var seeded = sum.workers.filter(function (w) { return w.seeded; }).length;
    return shell(ctx, null, null, [
      ui.notice(mt('m.protoNote'), 'info'),
      h('h2', { class: 'section-title' }, mt('m.selectRole')),
      h('div', { class: 'card-list', id: 'mgmt-roles' }, M.ROLES.map(function (r) {
        return h('button', {
          type: 'button', class: 'card mrolecard', 'data-role': r, id: 'role-' + r,
          onClick: function () { M.setRole(r); ctx.navigate('#/manage/' + r); }
        },
        h('span', { class: 'card__icon', 'aria-hidden': 'true' }, ROLE_ICON[r]),
        h('span', { class: 'card__body' },
          h('span', { class: 'card__title' }, mt('m.role.' + r)),
          h('span', { class: 'card__meta' }, mt('m.role.' + r + '.sub'))),
        h('span', { class: 'card__chevron', 'aria-hidden': 'true' }, '›'));
      })),
      h('p', { class: 'demo-note' }, mt('m.seedNote', { seeded: seeded, local: sum.workers.length - seeded }))
    ]);
  }

  SA.screens.manage = function (ctx) {
    var M = SA.management;
    var role = ctx.param;
    if (!role) return portal(ctx);
    // Only the selected role's dashboard is shown; anything else goes back to role selection.
    if (M.ROLES.indexOf(role) === -1 || M.get().role !== role) { ctx.redirect('#/manage'); return h('div'); }
    var view = TABS[role].indexOf(ctx.query.view) !== -1 ? ctx.query.view : 'dashboard';
    var sum = M.summary(ctx.state);
    var content = role === 'trainer' ? trainerView(ctx, sum, view)
      : role === 'officer' ? officerView(ctx, sum, view)
      : contractorView(ctx, sum, view);
    return shell(ctx, role, view, [
      sum.offsetDays ? ui.notice(mt('m.timeNote', { days: sum.offsetDays }), 'info') : null,
      content
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
