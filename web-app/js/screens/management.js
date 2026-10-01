/*
 * Local Role-Based Dashboard Prototype (management mode / web dashboard), separate from the worker flow.
 *   #/manage                                role selection ("login" — NOT authentication)
 *   #/manage/<trainer|officer|contractor>   role dashboard; ?view=<page> picks a page, ?q= filters workers
 * All figures come from SA.management (computed from this device's local data).
 *
 * Shell: glass sidebar (desktop) · drawer + bottom bar (phones) · header with search and theme toggle.
 * Role-based visibility: each role only gets the pages in NAV[role].
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};
  SA.mviews = SA.mviews || {}; // extra pages registered by later files (key -> function(ctx, sum, role))

  function mt(key, params) { return SA.i18n.tFor('en', key, params, SA.MGMT_STRINGS); }

  var ROLE_ICON = { trainer: 'clipboard', officer: 'shieldCheck', contractor: 'building' };
  // Core pages per role; optional pages are appended only when their view is registered.
  var NAV = {
    trainer: ['dashboard', 'workers', 'training', 'assessments', 'modules', 'trainer', 'analytics', 'alerts', 'settings'],
    officer: ['dashboard', 'risk', 'certificates', 'nearmiss', 'zones', 'analytics', 'alerts', 'settings'],
    contractor: ['dashboard', 'workers', 'certificates', 'alerts', 'settings']
  };
  var CORE = ['dashboard', 'workers', 'training', 'risk', 'certificates', 'settings'];
  var VIEW_ICON = {
    dashboard: 'grid', workers: 'users', training: 'clipboard', risk: 'gauge', certificates: 'passport', settings: 'settings',
    assessments: 'badgeCheck', modules: 'layers', trainer: 'eye', analytics: 'chart', alerts: 'bell', nearmiss: 'report', zones: 'pin'
  };
  var WORKERS_VIEW = { trainer: 'workers', officer: 'risk', contractor: 'workers' };

  function navFor(role) {
    return NAV[role].filter(function (v) { return CORE.indexOf(v) !== -1 || SA.mviews[v]; });
  }

  function workerAppHref(state) { return state.worker && state.settings.language ? '#/home' : '#/welcome'; }
  function moduleName(id) { return ui.moduleTitle(id, 'en'); }
  function fmtDate(ms) { return SA.i18n.formatDate(ms, 'en'); }
  function href(role, view, extra) { return '#/manage/' + role + '?view=' + view + (extra || ''); }

  function greeting(role) {
    var hr = new Date().getHours();
    var k = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
    return mt('m.greet.' + k, { role: mt('m.role.' + role) });
  }

  // ---------- building blocks ----------

  function section(titleKey, children, id, action) {
    return ui.section({ title: mt(titleKey), id: id, cls: 'msection', action: action }, children);
  }

  function panel(children, cls, id) {
    return h('div', { class: 'gcard mpanel' + (cls ? ' ' + cls : ''), id: id }, children);
  }

  function metric(label, value, icon, tone, id, sub) {
    return ui.metric({ label: label, value: value === null || value === undefined ? mt('m.noRecord') : value, icon: icon, tone: tone, id: id, sub: sub });
  }

  function riskBadge(status) {
    if (!status) return ui.badge(mt('m.risk.none'), 'neutral');
    var tone = { green: 'success', amber: 'warning', red: 'danger' }[status];
    var ic = { green: 'checkCircle', amber: 'alert', red: 'xCircle' }[status];
    return h('span', { class: 'badge badge--' + status + ' badge--' + tone }, ui.icon(ic, { size: 14, stroke: 2.4 }), h('span', null, mt('m.risk.' + status)));
  }

  function statusPill(training) {
    var tone = { completed: 'success', inProgress: 'warning', pending: 'neutral', refresher: 'danger' }[training];
    return ui.badge(mt('m.status.' + training), tone);
  }

  function refresherPill(w) {
    if (w.untrained) return ui.badge(mt('m.noRecord'), 'neutral');
    return w.refresherDue ? ui.badge(mt('m.refresher.due'), 'danger', 'clock') : ui.badge(mt('m.refresher.current'), 'success', 'check');
  }

  function certPill(certStatus) {
    if (certStatus === 'valid') return ui.badge(mt('m.cert.valid'), 'success', 'checkCircle');
    if (certStatus === 'attention') return ui.badge(mt('m.cert.attention'), 'warning', 'alert');
    return ui.badge(mt('m.cert.none'), 'neutral');
  }

  function moduleScore(w, id) {
    var m = w.modules[id];
    return m ? String(m.score) : mt('m.noRecord');
  }

  /** WorkerTable row: a table row on desktop, a card on phones (pure CSS). */
  function workerCard(w, fields, role) {
    var facts = [];
    function fact(label, value) { facts.push(h('div', { class: 'wfact' }, h('dt', null, label), h('dd', { class: 'tabular' }, value))); }
    if (fields.indexOf('scores') !== -1) {
      fact(mt('m.col.fire'), moduleScore(w, 'fire_explosion'));
      fact(mt('m.col.gas'), moduleScore(w, 'gas_confined'));
    }
    if (fields.indexOf('completion') !== -1) fact(mt('m.col.completion'), w.passedModules.length + ' / ' + SA.validation.MODULE_IDS.length);
    fact(mt('m.col.latest'), typeof w.score === 'number' ? String(w.score) : mt('m.noRecord'));
    var profileHref = SA.mviews.worker && role ? href(role, 'worker', '&id=' + encodeURIComponent(w.id)) : null;
    var nameEl = profileHref
      ? h('a', { class: 'wrow__name', href: profileHref }, w.name)
      : h('span', { class: 'wrow__name' }, w.name);
    return h('article', { class: 'mcard wrow' + (w.local ? ' mcard--local' : ''), 'data-worker': w.id },
      h('div', { class: 'wrow__who' },
        ui.avatar(w.name, { size: 'sm', seed: w.id }),
        h('div', { class: 'wrow__id' }, nameEl,
          h('span', { class: 'wrow__sub tabular' }, w.id + ' · ' + (w.local ? mt('m.thisDevice') : mt('m.seeded'))))),
      h('dl', { class: 'wrow__facts' }, facts),
      h('div', { class: 'wrow__badges' },
        statusPill(w.training),
        riskBadge(w.status),
        fields.indexOf('refresher') !== -1 ? refresherPill(w) : null,
        fields.indexOf('cert') !== -1 ? certPill(w.certStatus) : null));
  }

  function filterWorkers(list, q) {
    if (!q) return list;
    var needle = q.toLowerCase();
    return list.filter(function (w) { return w.name.toLowerCase().indexOf(needle) !== -1 || w.id.toLowerCase().indexOf(needle) !== -1; });
  }

  function workerList(sum, fields, opts) {
    opts = opts || {};
    var list = filterWorkers(sum.workers.slice(), opts.q);
    if (opts.sortByRisk) list.sort(function (a, b) { return (b.risk || -1) - (a.risk || -1); });
    else list.sort(function (a, b) { return (b.local ? 1 : 0) - (a.local ? 1 : 0); });
    if (!list.length) {
      return ui.empty({ icon: 'users', title: opts.q ? 'No workers match "' + opts.q + '"' : 'No workers yet', text: opts.q ? 'Try a name or worker ID.' : 'Your worker list will appear here.', id: 'mgmt-workers-empty' });
    }
    return h('div', { class: 'wtable', id: 'mgmt-workers' }, list.map(function (w) { return workerCard(w, fields, opts.role); }));
  }

  function riskDistribution(sum) {
    return h('div', { class: 'hbars', id: 'mgmt-risk' },
      ui.bar(mt('m.risk.green'), sum.risk.green, sum.total, 'success'),
      ui.bar(mt('m.risk.amber'), sum.risk.amber, sum.total, 'warning'),
      ui.bar(mt('m.risk.red'), sum.risk.red, sum.total, 'danger'));
  }

  function moduleProgress(sum) {
    var rows = SA.validation.MODULE_IDS.map(function (m) {
      var s = sum.modules[m];
      return ui.bar(moduleName(m), s.passed, sum.total, m === 'fire_explosion' ? 'fire' : 'gas', mt('m.progress.of', { n: s.passed, total: sum.total }));
    });
    rows.push(ui.bar(mt('m.progress.overall'), sum.completed, sum.total, 'primary', sum.completionPct + '%'));
    return h('div', { class: 'hbars', id: 'mgmt-progress' }, rows);
  }

  function certReason(c) {
    if (c.reason === 'expired') return mt('m.certs.reason.expired');
    if (!c.valid) return mt('m.certs.reason.invalid');
    return mt('m.certs.reason.refresher');
  }

  function certificateSection(sum) {
    var cards = sum.certs.map(function (c) {
      return h('article', { class: 'mcard ccard', 'data-cert': c.workerId },
        h('div', { class: 'wrow__who' },
          ui.avatar(c.name, { size: 'sm', seed: c.workerId }),
          h('div', { class: 'wrow__id' },
            h('span', { class: 'wrow__name' }, c.name),
            h('span', { class: 'wrow__sub tabular' }, c.workerId + ' · ' + (c.module ? moduleName(c.module) : '') + (typeof c.score === 'number' ? ' · ' + c.score + '/100' : '')))),
        h('p', { class: 'ccard__line' }, ui.icon('calendar', { size: 14 }), mt('m.certs.issued', { date: fmtDate(c.issuedMs), expiry: fmtDate(c.expiryMs) })),
        h('div', { class: 'wrow__badges' },
          certPill(c.status),
          c.status === 'attention' ? ui.badge(certReason(c), 'neutral') : null,
          c.recent ? ui.badge(mt('m.certs.recent'), 'primary') : null));
    });
    return [
      h('div', { class: 'metrics metrics--3' },
        metric(mt('m.certs.valid'), sum.certsValid, 'checkCircle', 'success', 'mgmt-certs-valid'),
        metric(mt('m.certs.attention'), sum.certsAttention, 'alert', 'warning', 'mgmt-certs-attention'),
        metric(mt('m.certs.recent'), sum.certsRecent, 'award', 'primary', 'mgmt-certs-recent')),
      cards.length ? h('div', { class: 'ccards', id: 'mgmt-certs' }, cards) : ui.empty({ icon: 'passport', title: mt('m.certs.none'), text: mt('m.certs.seedNote') }),
      cards.length ? h('p', { class: 'demo-note' }, mt('m.certs.seedNote')) : null
    ];
  }

  // ---------- role pages ----------

  function trainerView(ctx, sum, view) {
    if (view === 'workers') return section('m.workers.title', workerList(sum, ['scores', 'refresher'], { q: ctx.query.q, role: 'trainer' }), 'mgmt-sec-workers');
    if (view === 'training') return assignView(ctx, sum);
    return [
      h('div', { class: 'metrics metrics--4', id: 'mgmt-cards' },
        metric(mt('m.card.totalWorkers'), sum.total, 'users', 'primary', 'mgmt-total'),
        metric(mt('m.card.completed'), sum.completed, 'checkCircle', 'success', 'mgmt-completed'),
        metric(mt('m.card.avgScore'), sum.averageScore, 'target', 'purple', 'mgmt-avg'),
        metric(mt('m.card.refresherDue'), sum.refresherDue, 'clock', 'danger', 'mgmt-due')),
      h('div', { class: 'mgrid' },
        panel(section('m.progress.title', moduleProgress(sum), 'mgmt-sec-progress'), 'mgrid__main'),
        SA.mviews.trainerSide ? SA.mviews.trainerSide(ctx, sum) : null),
      section('m.workers.title', workerList(sum, ['scores', 'refresher'], { role: 'trainer' }), 'mgmt-sec-workers', { label: 'All workers', href: href('trainer', 'workers') })
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
        ui.toast(mt('m.assign.added'), 'success');
        ctx.rerender({ keepScroll: true });
      } catch (e) {
        ui.toast(mt('m.assign.invalid'), 'error');
      }
    }
    var list = sum.assignments.slice().reverse().map(function (a) {
      return h('article', { class: 'mcard acard', 'data-assignment': a.id },
        h('div', { class: 'wrow__who' },
          h('span', { class: 'row__icon tone-' + (a.module === 'fire_explosion' ? 'fire' : 'gas') }, ui.icon(a.module === 'fire_explosion' ? 'flame' : 'wind', { size: 18 })),
          h('div', { class: 'wrow__id' },
            h('span', { class: 'wrow__name' }, a.name),
            h('span', { class: 'wrow__sub tabular' }, a.workerId + ' · ' + moduleName(a.module)))),
        h('div', { class: 'wrow__badges' },
          ui.badge((a.overdue ? mt('m.assign.overdue') + ' · ' : '') + mt('m.assign.dueOn', { date: a.due }), a.overdue ? 'danger' : 'primary', 'calendar'),
          ui.btn(mt('m.assign.remove'), { variant: 'ghost', size: 'sm', block: false, icon: 'trash', onClick: function () { M.removeAssignment(a.id); ctx.rerender({ keepScroll: true }); } })));
    });
    return [
      h('div', { class: 'mgrid' },
        panel(section('m.assign.title', [
          h('p', { class: 'demo-note' }, mt('m.assign.note')),
          h('form', { class: 'form mform', id: 'assign-form', novalidate: true, onSubmit: submit },
            h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'assign-worker' }, mt('m.assign.worker')), workerSel),
            h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'assign-module' }, mt('m.assign.module')), moduleSel),
            h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'assign-due' }, mt('m.assign.due')), dueInput),
            ui.btn(mt('m.assign.submit'), { type: 'submit', id: 'assign-submit', icon: 'plus' }))
        ], 'mgmt-sec-assign'), 'mgrid__side'),
        panel(section('m.progress.title', moduleProgress(sum), 'mgmt-sec-progress'), 'mgrid__main')),
      section('m.assign.list', list.length ? h('div', { class: 'ccards', id: 'mgmt-assignments' }, list) : ui.empty({ icon: 'clipboard', title: mt('m.assign.none'), text: mt('m.assign.note') }), 'mgmt-sec-assignments')
    ];
  }

  function officerView(ctx, sum, view) {
    if (view === 'risk') {
      return [
        h('div', { class: 'mgrid' },
          panel(section('m.officer.riskDist', [riskDistribution(sum), h('p', { class: 'demo-note' }, mt('m.officer.riskNote'))], 'mgmt-sec-risk'), 'mgrid__main'),
          panel([ui.row({ icon: 'calendar', title: mt('m.officer.simulator'), href: '#/dashboard', id: 'mgmt-simulator' })], 'mgrid__side')),
        section('m.workers.title', workerList(sum, ['scores', 'refresher', 'cert'], { sortByRisk: true, q: ctx.query.q, role: 'officer' }), 'mgmt-sec-workers')
      ];
    }
    if (view === 'certificates') return section('m.certs.title', certificateSection(sum), 'mgmt-sec-certs');
    return [
      section('m.officer.compliance', h('div', { class: 'metrics metrics--6', id: 'mgmt-cards' },
        metric(mt('m.card.totalWorkers'), sum.total, 'users', 'primary', 'mgmt-total'),
        metric(mt('m.card.trained'), sum.trained, 'checkCircle', 'success', 'mgmt-trained'),
        metric(mt('m.card.refresherDue'), sum.refresherDue, 'clock', 'danger', 'mgmt-due'),
        metric(mt('m.card.highRisk'), sum.highRisk, 'alert', 'danger', 'mgmt-highrisk'),
        metric(mt('m.card.certsValid'), sum.certsValid, 'passport', 'success', 'mgmt-certs-valid'),
        metric(mt('m.card.certsAttention'), sum.certsAttention, 'alert', 'warning', 'mgmt-certs-attention')), 'mgmt-sec-compliance'),
      h('div', { class: 'mgrid' },
        panel(section('m.officer.riskDist', [riskDistribution(sum), h('p', { class: 'demo-note' }, mt('m.officer.riskNote'))], 'mgmt-sec-risk'), 'mgrid__main'),
        panel([
          h('h3', { class: 'msub' }, mt('m.officer.trainingChart')),
          h('div', { class: 'hbars', id: 'mgmt-training-chart' },
            ['completed', 'inProgress', 'pending', 'refresher'].map(function (k) {
              var tone = { completed: 'success', inProgress: 'warning', pending: 'neutral', refresher: 'danger' }[k];
              return ui.bar(mt('m.status.' + k), sum.training[k], sum.total, tone);
            }))
        ], 'mgrid__side')),
      panel(section('m.officer.trends', [
        h('h3', { class: 'msub' }, mt('m.officer.scoreChart')),
        h('div', { class: 'hbars', id: 'mgmt-score-chart' },
          sum.scoreBands.map(function (b) { return ui.bar(b.label, b.n, sum.total, 'purple'); })),
        h('h3', { class: 'msub' }, mt('m.officer.refresherChart')),
        h('div', { class: 'hbars' }, ui.bar(mt('m.card.refresherDue'), sum.refresherDue, sum.total, 'danger', mt('m.progress.of', { n: sum.refresherDue, total: sum.total })))
      ], 'mgmt-sec-trends')),
      panel(ui.row({ icon: 'calendar', title: mt('m.officer.simulator'), href: '#/dashboard', id: 'mgmt-simulator' }), 'mpanel--flush'),
      SA.mviews.nearmissSummary ? SA.mviews.nearmissSummary(ctx, sum)
        : panel(section('m.nearMiss.title', [ui.empty({ icon: 'report', title: mt('m.nearMiss.none'), text: mt('m.nearMiss.note') })], 'mgmt-sec-nearmiss'))
    ];
  }

  function contractorView(ctx, sum, view) {
    if (view === 'workers') return section('m.workers.title', workerList(sum, ['completion', 'cert'], { q: ctx.query.q, role: 'contractor' }), 'mgmt-sec-workers');
    if (view === 'certificates') return section('m.certs.title', certificateSection(sum), 'mgmt-sec-certs');
    return [
      section('m.contractor.workforce', [h('div', { class: 'metrics metrics--4', id: 'mgmt-cards' },
        metric(mt('m.card.totalWorkers'), sum.total, 'users', 'primary', 'mgmt-total'),
        metric(mt('m.card.trained'), sum.trained, 'checkCircle', 'success', 'mgmt-trained'),
        metric(mt('m.card.pending'), sum.pending, 'clock', 'warning', 'mgmt-pending'),
        metric(mt('m.card.refresherDue'), sum.refresherDue, 'alert', 'danger', 'mgmt-due')),
        h('p', { class: 'demo-note' }, mt('m.contractor.defs'))], 'mgmt-sec-workforce'),
      h('div', { class: 'mgrid' },
        panel(section('m.contractor.completion', h('div', { class: 'completion' },
          ui.ring({ value: sum.completionPct, size: 132, stroke: 12, label: mt('m.contractor.completion') + ': ' + sum.completionPct + '%', center: h('span', { class: 'mbig', id: 'mgmt-completion' }, sum.completionPct + '%') }),
          h('p', { class: 'demo-note' }, mt('m.contractor.completionNote', { n: sum.completed, total: sum.total }))), 'mgmt-sec-completion'), 'mgrid__side'),
        panel(section('m.progress.title', moduleProgress(sum)), 'mgrid__main')),
      section('m.workers.title', workerList(sum, ['completion', 'cert'], { role: 'contractor' }), 'mgmt-sec-workers')
    ];
  }

  function settingsView(ctx, role) {
    var M = SA.management;
    return [
      panel([
        h('div', { class: 'setting' },
          h('div', { class: 'setting__text' }, h('span', { class: 'setting__label' }, mt('m.settings.appearance'))),
          ui.segmented({
            label: mt('m.settings.appearance'), id: 'mgmt-theme', value: SA.prefs.theme(),
            options: [{ value: 'light', label: mt('m.settings.light'), icon: 'sun' }, { value: 'dark', label: mt('m.settings.dark'), icon: 'moon' }],
            onChange: function (v) { SA.prefs.setTheme(v); ctx.rerender({ keepScroll: true }); }
          })),
        h('div', { class: 'setting' },
          h('div', { class: 'setting__text' }, h('span', { class: 'setting__label' }, mt('m.settings.effects')), h('span', { class: 'setting__hint' }, mt('m.settings.effectsHint'))),
          ui.segmented({
            label: mt('m.settings.effects'), id: 'mgmt-effects', value: SA.prefs.effects(),
            options: [{ value: 'full', label: mt('m.settings.full') }, { value: 'reduced', label: mt('m.settings.reduced') }],
            onChange: function (v) { SA.prefs.setEffects(v); }
          }))
      ], 'settings-card'),
      panel([
        ui.row({ icon: ROLE_ICON[role], title: mt('m.settings.session'), sub: mt('m.settings.sessionText', { role: mt('m.role.' + role) }) }),
        ui.row({ icon: 'lock', tone: 'neutral', title: mt('m.settings.data'), sub: mt('m.settings.dataText') }),
        ui.row({ icon: 'logout', tone: 'danger', title: mt('m.logout'), onClick: function () { M.logout(); ctx.navigate('#/manage'); }, id: 'mgmt-settings-logout' })
      ], 'mpanel--flush')
    ];
  }

  // ---------- shell ----------

  function themeButton(ctx) {
    var dark = SA.prefs.theme() === 'dark';
    return ui.iconButton(dark ? 'sun' : 'moon', dark ? mt('m.theme.toLight') : mt('m.theme.toDark'), {
      variant: 'glass', id: 'mgmt-theme-toggle', onClick: function () { SA.prefs.toggleTheme(); ctx.rerender({ keepScroll: true }); }
    });
  }

  function shell(ctx, role, view, content) {
    var M = SA.management;
    var items = navFor(role);
    var app = h('div', { class: 'mgmt', lang: 'en' });
    function setDrawer(open) {
      if (open) app.classList.add('is-drawer-open'); else app.classList.remove('is-drawer-open');
      var btn = app.querySelector && app.querySelector('#mgmt-menu');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function navLink(v, cls) {
      var on = v === view;
      var badge = SA.mviews.navBadge ? SA.mviews.navBadge(v, ctx, role) : null;
      return h('a', {
        class: cls + (on ? ' is-active' : ''), href: href(role, v), id: (cls === 'sidenav__item' ? 'mtab-' : 'mbtab-') + v,
        'aria-current': on ? 'page' : null, onClick: function () { setDrawer(false); }
      }, ui.icon(VIEW_ICON[v] || 'dot', { size: 20 }), h('span', { class: cls + '-label' }, mt('m.tab.' + v)), badge ? h('span', { class: 'navcount' }, String(badge)) : null);
    }
    var sidebar = h('aside', { class: 'sidebar', id: 'mgmt-sidebar', 'aria-label': mt('m.navLabel') },
      h('a', { class: 'sidebar__brand', href: '#/manage/' + role },
        ui.brandMark(), h('span', { class: 'sidebar__brand-text' }, h('span', { class: 'sidebar__brand-name' }, mt('m.brand')), h('span', { class: 'sidebar__brand-sub' }, mt('m.brandSub')))),
      h('nav', { class: 'sidenav mtabs', 'aria-label': mt('m.role.' + role) }, items.map(function (v) { return navLink(v, 'sidenav__item'); })),
      h('div', { class: 'sidebar__foot' },
        h('div', { class: 'sidebar__me' },
          h('span', { class: 'row__icon tone-primary' }, ui.icon(ROLE_ICON[role], { size: 18 })),
          h('span', { class: 'sidebar__me-text' },
            h('span', { class: 'mrole', id: 'mgmt-role' }, mt('m.signedInAs', { role: mt('m.role.' + role) })),
            h('a', { class: 'sidebar__switch', href: '#/manage', id: 'mgmt-switch' }, mt('m.switchRole')))),
        h('div', { class: 'sidebar__actions' },
          ui.btn(mt('m.logout'), { variant: 'ghost', size: 'sm', block: false, id: 'mgmt-logout', icon: 'logout', onClick: function () { M.logout(); ctx.navigate('#/manage'); } }),
          h('a', { class: 'link sidebar__app', href: workerAppHref(ctx.state), id: 'mgmt-worker-app' }, mt('m.backToApp')))));

    var search = h('input', { type: 'search', class: 'msearch__input', id: 'mgmt-search', placeholder: mt('m.search'), 'aria-label': mt('m.searchLabel'), value: ctx.query.q || '', autocomplete: 'off' });
    var header = h('header', { class: 'mheader' },
      h('button', { type: 'button', class: 'icon-btn icon-btn--glass mheader__menu', id: 'mgmt-menu', 'aria-label': mt('m.menu'), 'aria-controls': 'mgmt-sidebar', 'aria-expanded': 'false', onClick: function () { setDrawer(!app.classList.contains('is-drawer-open')); } }, ui.icon('menu')),
      h('form', { class: 'msearch', role: 'search', onSubmit: function (ev) { ev.preventDefault(); ctx.navigate(href(role, WORKERS_VIEW[role], search.value.trim() ? '&q=' + encodeURIComponent(search.value.trim()) : '')); } },
        ui.icon('search', { size: 18, 'class': 'msearch__icon' }), search),
      h('div', { class: 'mheader__actions' },
        SA.mviews.alerts ? h('a', { class: 'icon-btn icon-btn--glass mheader__bell', href: href(role, 'alerts'), id: 'mgmt-bell', 'aria-label': mt('m.tab.alerts') },
          ui.icon('bell'), SA.mviews.navBadge && SA.mviews.navBadge('alerts', ctx, role) ? h('span', { class: 'mheader__dot', 'aria-hidden': 'true' }) : null) : null,
        themeButton(ctx),
        h('span', { class: 'mheader__avatar', title: mt('m.role.' + role) }, ui.avatar(mt('m.role.' + role), { size: 'sm', seed: role }))));

    var primary = items.slice(0, 4);
    var bottom = h('nav', { class: 'mbottom', 'aria-label': mt('m.navLabel') },
      primary.map(function (v) { return navLink(v, 'mbottom__item'); }),
      h('button', { type: 'button', class: 'mbottom__item', id: 'mgmt-more', onClick: function () { setDrawer(true); } }, ui.icon('menu', { size: 20 }), h('span', { class: 'mbottom__item-label' }, mt('m.more'))));

    var titleText = view === 'dashboard' ? greeting(role) : mt('m.tab.' + view);
    app.appendChild(sidebar);
    app.appendChild(h('div', { class: 'drawer-scrim', onClick: function () { setDrawer(false); }, 'aria-hidden': 'true' }));
    app.appendChild(h('div', { class: 'mmain' },
      header,
      h('main', { class: 'mcontent', id: 'main' },
        h('div', { class: 'mhead' },
          h('p', { class: 'eyebrow' }, mt('m.role.' + role) + ' · ' + mt('m.portal.sub')),
          h('h1', { class: 'page__title', tabindex: '-1' }, titleText),
          h('p', { class: 'page__sub' }, view === 'dashboard' ? mt('m.overview') : mt('m.protoNote'))),
        content)));
    app.appendChild(bottom);
    return app;
  }

  function portal(ctx) {
    var M = SA.management;
    var sum = M.summary(ctx.state);
    var seeded = sum.workers.filter(function (w) { return w.seeded; }).length;
    return h('div', { class: 'mgmt-login', lang: 'en' },
      h('header', { class: 'mlogin__bar' },
        h('a', { class: 'link', href: workerAppHref(ctx.state), id: 'mgmt-worker-app' }, ui.icon('back', { size: 18 }), mt('m.backToApp').replace(/^←\s*/, '')),
        themeButton(ctx)),
      h('main', { class: 'mlogin', id: 'main' },
        h('div', { class: 'mlogin__hero' },
          ui.brandMark('lg'),
          h('p', { class: 'eyebrow' }, mt('m.portal.sub')),
          h('h1', { class: 'page__title', tabindex: '-1' }, mt('m.login.title')),
          h('p', { class: 'page__sub' }, mt('m.login.sub'))),
        h('div', { class: 'mlogin__roles', id: 'mgmt-roles' }, M.ROLES.map(function (r) {
          return h('button', {
            type: 'button', class: 'gcard gcard--glass gcard--interactive mrolecard', 'data-role': r, id: 'role-' + r,
            onClick: function () { M.setRole(r); ctx.navigate('#/manage/' + r); }
          },
          h('span', { class: 'mrolecard__icon tone-' + ({ trainer: 'primary', officer: 'teal', contractor: 'purple' })[r] }, ui.icon(ROLE_ICON[r], { size: 24 })),
          h('span', { class: 'mrolecard__body' },
            h('span', { class: 'mrolecard__title' }, mt('m.role.' + r)),
            h('span', { class: 'mrolecard__sub' }, mt('m.role.' + r + '.sub')),
            h('span', { class: 'mrolecard__vis' }, ui.icon('eye', { size: 14 }), mt('m.login.vis.' + r))),
          h('span', { class: 'row__chev' }, ui.icon('chevronRight', { size: 20 })));
        })),
        ui.notice(mt('m.protoNote'), 'warning', { id: 'mgmt-proto-note' }),
        h('p', { class: 'demo-note mlogin__seed' }, mt('m.seedNote', { seeded: seeded, local: sum.workers.length - seeded }))));
  }

  SA.screens.manage = function (ctx) {
    var M = SA.management;
    var role = ctx.param;
    if (!role) return portal(ctx);
    // Only the selected role's dashboard is shown; anything else goes back to role selection.
    if (M.ROLES.indexOf(role) === -1 || M.get().role !== role) { ctx.redirect('#/manage'); return h('div'); }
    var items = navFor(role);
    var view = ctx.query.view === 'worker' && SA.mviews.worker ? 'worker' : (items.indexOf(ctx.query.view) !== -1 ? ctx.query.view : 'dashboard');
    var sum = M.summary(ctx.state);
    var content;
    if (view === 'settings') content = settingsView(ctx, role);
    else if (CORE.indexOf(view) === -1) content = SA.mviews[view](ctx, sum, role);
    else content = role === 'trainer' ? trainerView(ctx, sum, view)
      : role === 'officer' ? officerView(ctx, sum, view)
      : contractorView(ctx, sum, view);
    return shell(ctx, role, view === 'worker' ? WORKERS_VIEW[role] : view, [
      sum.offsetDays ? ui.notice(mt('m.timeNote', { days: sum.offsetDays }), 'warning', { id: 'mgmt-time-note' }) : null,
      content
    ]);
  };

  // Shared with the extra management pages (management-pages.js).
  SA.mui = {
    mt: mt, section: section, panel: panel, metric: metric, riskBadge: riskBadge, statusPill: statusPill,
    refresherPill: refresherPill, certPill: certPill, workerCard: workerCard, workerList: workerList,
    moduleProgress: moduleProgress, riskDistribution: riskDistribution, moduleName: moduleName,
    fmtDate: fmtDate, href: href, WORKERS_VIEW: WORKERS_VIEW
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
