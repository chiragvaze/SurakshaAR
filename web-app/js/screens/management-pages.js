/*
 * Web dashboard pages registered into the management shell (screens/management.js):
 *   worker (profile) · assessments · modules · trainer (Trainer Mode + PPE review queue)
 *   alerts · nearmiss · zones · analytics
 * All data is local: sa_v1 via SA.management.summary(), sa_safety_v1 via SA.safety, seeded
 * demo workers (latest result only, labelled). Charts are inline SVG / CSS (no library).
 * Role-based visibility: NAV in management.js decides which pages a role gets; the worker
 * profile also hides fields a role does not need (contractor: no scores or risk).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  var V = SA.mviews = SA.mviews || {};
  var M = function () { return SA.mui; };
  var DAY = 24 * 60 * 60 * 1000;
  var NS = 'http://www.w3.org/2000/svg';

  function mt(k, p) { return SA.mui.mt(k, p); }
  function svg(tag, attrs) {
    var e = root.document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, String(attrs[k])); });
    return e;
  }
  function tone(score) { return score >= 90 ? 'success' : score >= 70 ? 'primary' : score >= 50 ? 'warning' : 'danger'; }
  function moduleLook(id) { return SA.trainUI ? SA.trainUI.look(id) : { icon: 'shield', tone: 'primary' }; }
  function durText(ms) { var s = Math.max(1, Math.round(ms / 1000)); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s'; }
  function fmtTime(ms) { return SA.safetyUI ? SA.safetyUI.fmtTime(ms, 'en') : new Date(ms).toISOString().slice(0, 16); }

  /** Every assessment we know about: this device's attempts + each seeded worker's latest result. */
  function assessments(state, sum) {
    var names = {};
    sum.workers.forEach(function (w) { names[w.id] = w.name; });
    var list = state.attempts.map(function (a) {
      return { id: a.id, workerId: a.workerId, name: names[a.workerId] || a.workerId, module: a.module, score: a.score, passed: a.passed, wrong: a.wrong, steps: a.steps, ms: a.completedMs, durMs: a.completedMs - a.startedMs, source: 'device' };
    });
    SA.SEED_WORKERS.forEach(function (s) {
      list.push({ id: 'seed-' + s.id, workerId: s.id, name: s.name, module: s.module, score: s.score, passed: SA.scoring.isPass(s.score), ms: sum.nowMs - (s.daysAgo + sum.offsetDays) * DAY, durMs: null, source: 'seeded' });
    });
    return list.sort(function (a, b) { return b.ms - a.ms; });
  }

  function ago(ms, nowMs) {
    var d = Math.max(0, Math.floor((nowMs - ms) / DAY));
    return d === 0 ? mt('m.as.today') : mt('m.as.daysAgo', { days: d });
  }

  function backToWorkers(role) {
    return h('a', { class: 'link', href: M().href(role, M().WORKERS_VIEW[role]), id: 'mgmt-back-workers' }, ui.icon('back', { size: 16 }), mt('m.back.workers'));
  }

  function ppeBadge(p) {
    if (p.review) return ui.badge(mt(p.review.decision === 'approved' ? 'm.ppe.approved' : 'm.ppe.rejected'), p.review.decision === 'approved' ? 'success' : 'danger');
    return ui.badge(mt('m.ppe.' + p.outcome), { ready: 'success', missing: 'danger', review: 'warning' }[p.outcome]);
  }

  // ---------------- worker profile ----------------
  V.worker = function (ctx, sum, role) {
    var w = sum.workers.filter(function (x) { return x.id === ctx.query.id; })[0];
    if (!w) return [backToWorkers(role), ui.empty({ icon: 'users', title: mt('m.wp.notFound'), text: mt('m.wp.notFoundText'), id: 'mgmt-worker-missing' })];
    var showScores = role !== 'contractor';
    var showRisk = role === 'officer' || role === 'trainer';
    var history = assessments(ctx.state, sum).filter(function (a) { return a.workerId === w.id; });
    var mine = sum.assignments.filter(function (a) { return a.workerId === w.id; });
    var ppe = SA.safety ? SA.safety.get().ppe.filter(function (p) { return p.workerId === w.id; }).slice(-5).reverse() : [];

    var head = h('section', { class: 'gcard gcard--glass wprofile', id: 'mgmt-worker', 'data-worker': w.id },
      ui.avatar(w.name, { size: 'lg', seed: w.id }),
      h('div', { class: 'wprofile__id' },
        h('h2', { class: 'wprofile__name' }, w.name),
        h('p', { class: 'wprofile__sub tabular' }, w.id + ' · ' + (w.local ? mt('m.thisDevice') : mt('m.seeded'))),
        h('div', { class: 'wrow__badges' }, M().statusPill(w.training), showRisk ? M().riskBadge(w.status) : null, M().certPill(w.certStatus))));

    var metrics = h('div', { class: 'metrics metrics--4' },
      showScores ? M().metric(mt('m.wp.latest'), typeof w.score === 'number' ? w.score : null, 'target', 'purple', 'wp-latest') : null,
      showRisk ? M().metric(mt('m.wp.risk'), w.risk, 'gauge', w.status === 'red' ? 'danger' : w.status === 'amber' ? 'warning' : 'success', 'wp-risk') : null,
      M().metric(mt('m.wp.modules'), w.passedModules.length + '/' + SA.validation.MODULE_IDS.length, 'checkCircle', 'success', 'wp-modules'),
      M().metric(mt('m.wp.days'), w.daysSince, 'calendar', 'teal', 'wp-days'));

    var progress = h('div', { class: 'hbars' }, SA.validation.MODULE_IDS.map(function (m) {
      var r = w.modules[m];
      return showScores
        ? ui.bar(M().moduleName(m), r ? r.score : 0, 100, m === 'fire_explosion' ? 'fire' : 'gas', r ? r.score + '/100' : mt('m.noRecord'))
        : ui.bar(M().moduleName(m), r && r.passed ? 1 : 0, 1, r && r.passed ? 'success' : 'neutral', r && r.passed ? mt('m.as.passed') : mt('m.noRecord'));
    }));

    var hist = history.length
      ? h('div', { class: 'list' }, history.map(function (a) {
          return ui.row({ icon: moduleLook(a.module).icon, tone: moduleLook(a.module).tone, title: M().moduleName(a.module),
            sub: ago(a.ms, sum.nowMs) + ' · ' + (a.source === 'device' ? mt('m.as.device') : mt('m.as.seeded')),
            trailing: h('span', { class: 'cluster' }, showScores ? h('span', { class: 'tabular wscore' }, a.score + '/100') : null, ui.badge(mt(a.passed ? 'm.as.passed' : 'm.as.failed'), a.passed ? 'success' : 'danger')) });
        }))
      : ui.empty({ icon: 'clipboard', title: mt('m.wp.noHistory') });

    var passport;
    var cert = w.local ? SA.training.latestCertificate(ctx.state, w.id) : null;
    if (cert) {
      var payload = SA.certificate.toPayload(cert);
      var qr = h('div', { class: 'qr qr--sm', role: 'img', 'aria-label': 'Certificate QR', id: 'wp-qr' });
      try { qr.innerHTML = SA.qr.toSvgString(SA.qr.encode(payload), 4); } catch (e) { qr = ui.notice('QR unavailable', 'error'); } // numbers-only SVG (see certificate.js)
      passport = h('div', { class: 'wpassport' }, qr, h('div', { class: 'stack' },
        M().certPill(w.certStatus),
        h('p', { class: 'demo-note' }, mt('m.certs.issued', { date: M().fmtDate(w.cert.issuedMs), expiry: M().fmtDate(w.cert.expiryMs) })),
        ui.btn(mt('m.zn.verify'), { href: '#/verify?use=last', variant: 'secondary', size: 'sm', block: false, icon: 'scan' })));
    } else passport = ui.empty({ icon: 'passport', title: mt('m.wp.noPassport') });

    var refresher = w.untrained ? mt('m.noRecord') : w.refresherDue ? mt('m.wp.refresherDue') : mt('m.wp.refresherIn', { days: Math.max(0, 7 - w.daysSince) });

    return [
      backToWorkers(role),
      head,
      metrics,
      h('div', { class: 'mgrid' },
        M().panel(M().section('m.wp.progress', [progress, h('p', { class: 'demo-note' }, ui.icon('calendar', { size: 14 }), ' ', mt('m.wp.refresher') + ': ' + refresher)], 'wp-progress'), 'mgrid__main'),
        M().panel(M().section('m.wp.passport', passport, 'wp-passport'), 'mgrid__side')),
      M().section('m.wp.history', [hist, w.seeded ? h('p', { class: 'demo-note' }, mt('m.wp.seededHistory')) : null], 'wp-history'),
      role !== 'officer' || mine.length ? M().section('m.wp.assignments', mine.length ? h('div', { class: 'list' }, mine.map(function (a) {
        return ui.row({ icon: 'clipboard', tone: a.overdue ? 'danger' : 'primary', title: M().moduleName(a.module), trailing: ui.badge((a.overdue ? mt('m.assign.overdue') + ' · ' : '') + mt('m.assign.dueOn', { date: a.due }), a.overdue ? 'danger' : 'primary') });
      })) : ui.empty({ icon: 'clipboard', title: mt('m.assign.none') }), 'wp-assignments') : null,
      role !== 'contractor' && ppe.length ? M().section('m.wp.ppe', h('div', { class: 'list' }, ppe.map(function (p) {
        return ui.row({ icon: 'helmet', tone: 'teal', title: fmtTime(p.ms), trailing: ppeBadge(p) });
      })), 'wp-ppe') : null,
      h('p', { class: 'demo-note' }, mt('m.wp.visibility', { vis: mt('m.login.vis.' + role) }))
    ];
  };

  // ---------------- assessments ----------------
  V.assessments = function (ctx, sum) {
    var filter = ['fire_explosion', 'gas_confined'].indexOf(ctx.query.m) !== -1 ? ctx.query.m : 'all';
    var all = assessments(ctx.state, sum);
    var list = all.filter(function (a) { return filter === 'all' || a.module === filter; });
    var passed = list.filter(function (a) { return a.passed; }).length;
    var timed = list.filter(function (a) { return a.durMs !== null; });
    return [
      h('div', { class: 'metrics metrics--4', id: 'mgmt-as-cards' },
        M().metric(mt('m.as.total'), list.length, 'clipboard', 'primary', 'as-total'),
        M().metric(mt('m.as.passRate'), list.length ? Math.round(100 * passed / list.length) + '%' : null, 'checkCircle', 'success', 'as-pass'),
        M().metric(mt('m.as.avg'), list.length ? Math.round(list.reduce(function (s, a) { return s + a.score; }, 0) / list.length) : null, 'target', 'purple', 'as-avg'),
        M().metric(mt('m.as.avgTime'), timed.length ? durText(timed.reduce(function (s, a) { return s + a.durMs; }, 0) / timed.length) : null, 'timer', 'teal', 'as-time')),
      ui.segmented({
        label: mt('m.tab.assessments'), id: 'as-filter', value: filter,
        options: [{ value: 'all', label: mt('m.as.all') }].concat(SA.validation.MODULE_IDS.map(function (m) { return { value: m, label: M().moduleName(m) }; })),
        onChange: function (v) { ctx.navigate(M().href('trainer', 'assessments', v === 'all' ? '' : '&m=' + v)); }
      }),
      list.length ? h('div', { class: 'wtable', id: 'mgmt-assessments' }, list.map(function (a) {
        var L = moduleLook(a.module);
        return h('article', { class: 'wrow arow', 'data-assessment': a.id },
          h('div', { class: 'wrow__who' }, ui.avatar(a.name, { size: 'sm', seed: a.workerId }),
            h('div', { class: 'wrow__id' }, h('span', { class: 'wrow__name' }, a.name), h('span', { class: 'wrow__sub tabular' }, a.workerId + ' · ' + (a.source === 'device' ? mt('m.as.device') : mt('m.as.seeded'))))),
          h('div', { class: 'wrow__who' }, h('span', { class: 'row__icon tone-' + L.tone }, ui.icon(L.icon, { size: 16 })),
            h('div', { class: 'wrow__id' }, h('span', { class: 'wrow__name' }, M().moduleName(a.module)), h('span', { class: 'wrow__sub' }, ago(a.ms, sum.nowMs) + (a.durMs !== null ? ' · ' + durText(a.durMs) : '')))),
          h('div', { class: 'wrow__badges' }, h('span', { class: 'wscore tabular' }, a.score + '/100'), ui.badge(mt(a.passed ? 'm.as.passed' : 'm.as.failed'), a.passed ? 'success' : 'danger')));
      })) : ui.empty({ icon: 'clipboard', title: mt('m.as.none') })
    ];
  };

  // ---------------- modules ----------------
  V.modules = function (ctx, sum) {
    var all = assessments(ctx.state, sum);
    return h('div', { class: 'modcards', id: 'mgmt-modules' }, SA.validation.MODULE_IDS.map(function (m) {
      var sc = SA.scenario.get(m);
      var L = moduleLook(m);
      var latest = sum.workers.filter(function (w) { return w.modules[m]; }).map(function (w) { return w.modules[m].score; });
      var timed = all.filter(function (a) { return a.module === m && a.durMs !== null; });
      var st = sum.modules[m];
      return h('article', { class: 'gcard modcard', 'data-module': m },
        h('div', { class: 'modcard__thumb tone-' + L.tone, 'aria-hidden': 'true' }, ui.icon(L.icon, { size: 36, stroke: 1.6 })),
        h('div', { class: 'modcard__body' },
          h('h3', { class: 'modcard__title' }, M().moduleName(m)),
          h('p', { class: 'demo-note' }, SA.i18n.tFor('en', 'module.' + m + '.purpose')),
          h('div', { class: 'cluster' }, ui.chip(mt('m.mod.steps', { n: sc.steps.length }), { icon: 'layers' }), ui.chip('AR + screen', { icon: 'cube', tone: 'primary' }))),
        h('dl', { class: 'modcard__stats' },
          stat(mt('m.mod.completion'), st.pct + '%', 'mod-' + m + '-completion'),
          stat(mt('m.mod.avg'), latest.length ? Math.round(latest.reduce(function (a, b) { return a + b; }, 0) / latest.length) : mt('m.noRecord')),
          stat(mt('m.mod.completed'), st.passed + '/' + sum.total),
          stat(mt('m.mod.avgTime'), timed.length ? durText(timed.reduce(function (s, a) { return s + a.durMs; }, 0) / timed.length) : mt('m.noRecord'))),
        ui.bar(mt('m.mod.completion'), st.passed, sum.total, L.tone, st.pct + '%'),
        h('details', { class: 'modcard__steps' },
          h('summary', null, mt('m.mod.view')),
          h('ol', { class: 'hazard-list' }, sc.steps.map(function (s, i) {
            return h('li', { class: 'hazard' }, h('span', { class: 'hazard__n' }, String(i + 1)),
              h('span', { class: 'hazard__body' },
                h('span', { class: 'hazard__text' }, SA.i18n.tFor('en', 'scn.' + s.id + '.prompt')),
                h('span', { class: 'hazard__label' }, mt('m.mod.safe') + ': ' + SA.i18n.tFor('en', 'scn.' + s.id + '.opt.' + s.correct))));
          }))));
    }));
    function stat(label, value, id) { return h('div', { class: 'modcard__stat', id: id }, h('dt', null, label), h('dd', { class: 'tabular' }, String(value))); }
  };

  // ---------------- Trainer Mode ----------------
  function reviewCard(ctx, p, sum) {
    var w = sum.workers.filter(function (x) { return x.id === p.workerId; })[0];
    function decide(d) {
      SA.safety.reviewPpe(p.id, d, SA.clock.now(ctx.store.get()));
      ui.toast(mt('m.tr.reviewed'), 'success');
      ctx.rerender({ keepScroll: true });
    }
    return h('article', { class: 'mcard ccard', 'data-ppe': p.id },
      h('div', { class: 'wrow__who' }, ui.avatar(w ? w.name : p.workerId, { size: 'sm', seed: p.workerId }),
        h('div', { class: 'wrow__id' }, h('span', { class: 'wrow__name' }, w ? w.name : p.workerId), h('span', { class: 'wrow__sub tabular' }, p.workerId + ' · ' + fmtTime(p.ms))), ppeBadge(p)),
      h('div', { class: 'ppe-grid' }, SA.safety.PPE_ITEMS.map(function (k) {
        var v = p.items[k];
        return h('span', { class: 'ppe-cell ppe-cell--' + v }, ui.icon(v === 'yes' ? 'check' : v === 'no' ? 'x' : 'eye', { size: 14, stroke: 2.6 }), mt('m.ppe.item.' + k) + ' · ' + mt('m.ppe.state.' + v));
      })),
      h('div', { class: 'btn-row' },
        ui.btn(mt('m.tr.approve'), { onClick: function () { decide('approved'); }, size: 'sm', icon: 'check', id: 'ppe-approve-' + p.id }),
        ui.btn(mt('m.tr.reject'), { onClick: function () { decide('rejected'); }, size: 'sm', variant: 'secondary', icon: 'x', id: 'ppe-reject-' + p.id })));
  }

  V.trainer = function (ctx, sum) {
    var s = ctx.state.inProgress;
    var sc = s ? SA.scenario.get(s.module) : null;
    var live = s && sc && ctx.state.worker
      ? ui.row({ icon: 'activity', tone: 'success', title: mt('m.tr.active', { name: ctx.state.worker.name, module: M().moduleName(s.module), step: s.stepIndex + 1, total: sc.steps.length }), id: 'tr-live' })
      : ui.empty({ icon: 'activity', title: mt('m.tr.noActive'), id: 'tr-live-empty' });
    var queue = SA.safety.reviewQueue();
    var interventions = sum.workers.filter(function (w) { return w.refresherDue || (typeof w.score === 'number' && !SA.scoring.isPass(w.score)); });
    var recent = SA.safety.get().ppe.slice(-5).reverse();
    return [
      M().panel(M().section('m.tr.live', live, 'tr-sec-live')),
      M().section('m.tr.review', [
        h('p', { class: 'demo-note' }, mt('m.tr.reviewNote')),
        queue.length ? h('div', { class: 'ccards', id: 'tr-review' }, queue.map(function (p) { return reviewCard(ctx, p, sum); })) : ui.empty({ icon: 'helmet', title: mt('m.tr.noReview'), id: 'tr-review-empty' })
      ], 'tr-sec-review'),
      M().section('m.tr.queue', [
        h('p', { class: 'demo-note' }, mt('m.tr.queueNote')),
        interventions.length ? h('div', { class: 'list', id: 'tr-queue' }, interventions.map(function (w) {
          return ui.row({
            lead: ui.avatar(w.name, { size: 'sm', seed: w.id }), title: w.name,
            sub: w.id + ' · ' + (w.refresherDue ? mt('m.status.refresher') : mt('m.as.failed') + ' · ' + w.score + '/100'),
            trailing: ui.btn(mt('m.tr.assignRefresher'), { size: 'sm', variant: 'soft', block: false, icon: 'plus', onClick: function () {
              var mod = w.module || SA.validation.MODULE_IDS[0];
              SA.management.addAssignment({ workerId: w.id, module: mod, due: SA.management.isoDate(sum.nowMs + 3 * DAY) }, sum.nowMs);
              ui.toast(mt('m.tr.assigned'), 'success');
              ctx.rerender({ keepScroll: true });
            } })
          });
        })) : ui.empty({ icon: 'users', title: mt('m.tr.noQueue') })
      ], 'tr-sec-queue'),
      recent.length ? M().section('m.tr.recentPpe', h('div', { class: 'list' }, recent.map(function (p) {
        var w = sum.workers.filter(function (x) { return x.id === p.workerId; })[0];
        return ui.row({ icon: 'helmet', tone: 'teal', title: (w ? w.name : p.workerId) + ' · ' + fmtTime(p.ms), trailing: ppeBadge(p) });
      })), 'tr-sec-recent') : null
    ];
  };

  /** Side panel on the trainer dashboard. */
  V.trainerSide = function (ctx, sum) {
    var q = SA.safety.reviewQueue().length;
    var s = ctx.state.inProgress;
    return M().panel([
      h('h3', { class: 'msub' }, mt('m.tab.trainer')),
      M().metric(mt('m.tr.pending'), q, 'eye', q ? 'warning' : 'success', 'mgmt-ppe-pending'),
      h('p', { class: 'demo-note' }, s && ctx.state.worker ? mt('m.tr.active', { name: ctx.state.worker.name, module: M().moduleName(s.module), step: s.stepIndex + 1, total: SA.scenario.get(s.module).steps.length }) : mt('m.tr.noActive')),
      ui.btn(mt('m.tr.openMode'), { href: M().href('trainer', 'trainer'), variant: 'secondary', size: 'sm', icon: 'eye' })
    ], 'mgrid__side');
  };

  // ---------------- alerts ----------------
  var SEV_ORDER = { critical: 0, high: 1, medium: 2, info: 3 };
  var SEV_TONE = { critical: 'danger', high: 'danger', medium: 'warning', info: 'primary' };

  function alertList(ctx, sum, role) {
    var out = [];
    var safety = SA.safety ? SA.safety.get() : { sos: [], nearmiss: [] };
    function add(sev, icon, title, text, href, roles) { if (!roles || roles.indexOf(role) !== -1) out.push({ sev: sev, icon: icon, title: title, text: text, href: href }); }
    var names = {};
    sum.workers.forEach(function (w) { names[w.id] = w.name; });
    safety.sos.slice().reverse().forEach(function (e) {
      add('critical', 'siren', mt('m.al.sos', { type: SA.i18n.tFor('en', 'sos.type.' + e.type), name: names[e.workerId] || e.workerId }), mt('m.al.sosText', { time: fmtTime(e.ms) }), null, ['officer', 'trainer']);
    });
    var openNm = safety.nearmiss.filter(function (n) { return n.status !== 'resolved'; });
    if (openNm.length) add(openNm.some(function (n) { return n.severity === 'high'; }) ? 'high' : 'medium', 'report', mt('m.al.nm', { n: openNm.length }), mt('m.al.nmText'), M().href('officer', 'nearmiss'), ['officer']);
    if (sum.highRisk) add('high', 'alert', mt('m.al.red', { n: sum.highRisk }), mt('m.al.redText'), M().href(role, M().WORKERS_VIEW[role]), ['officer', 'trainer']);
    var reviews = SA.safety ? SA.safety.reviewQueue().length : 0;
    if (reviews) add('medium', 'eye', mt('m.al.ppe', { n: reviews }), mt('m.al.ppeText'), M().href('trainer', 'trainer'), ['trainer']);
    if (sum.refresherDue) add('medium', 'clock', mt('m.al.refresher', { n: sum.refresherDue }), mt('m.al.refresherText'), M().href(role, M().WORKERS_VIEW[role]));
    var failed = sum.workers.filter(function (w) { return typeof w.score === 'number' && !SA.scoring.isPass(w.score); }).length;
    if (failed) add('medium', 'xCircle', mt('m.al.failed', { n: failed }), mt('m.al.failedText'), M().href('trainer', 'workers'), ['trainer']);
    if (sum.certsAttention) add('medium', 'passport', mt('m.al.cert', { n: sum.certsAttention }), mt('m.al.certText'), M().href(role, 'certificates'), ['officer', 'contractor']);
    var overdue = sum.assignments.filter(function (a) { return a.overdue; }).length;
    if (overdue) add('medium', 'calendar', mt('m.al.overdue', { n: overdue }), mt('m.al.overdueText'), M().href('trainer', 'training'), ['trainer', 'contractor']);
    return out.sort(function (a, b) { return SEV_ORDER[a.sev] - SEV_ORDER[b.sev]; });
  }

  V.alerts = function (ctx, sum, role) {
    var list = alertList(ctx, sum, role);
    if (!list.length) return ui.empty({ icon: 'bell', title: mt('m.al.none'), text: mt('m.al.noneText'), id: 'mgmt-alerts-empty' });
    return h('div', { class: 'alist', id: 'mgmt-alerts' }, list.map(function (a, i) {
      var body = [
        h('span', { class: 'row__icon tone-' + SEV_TONE[a.sev] }, ui.icon(a.icon, { size: 20 })),
        h('span', { class: 'row__body' }, h('span', { class: 'row__title' }, a.title), h('span', { class: 'row__sub' }, a.text)),
        ui.badge(mt('m.al.' + a.sev), SEV_TONE[a.sev])
      ];
      return a.href
        ? h('a', { class: 'acard-alert acard-alert--' + a.sev, href: a.href, id: 'mgmt-alert-' + i, 'data-sev': a.sev }, body)
        : h('div', { class: 'acard-alert acard-alert--' + a.sev, id: 'mgmt-alert-' + i, 'data-sev': a.sev }, body);
    }));
  };

  V.navBadge = function (view, ctx, role) {
    if (view === 'alerts') {
      var sum = SA.management.summary(ctx.state);
      return alertList(ctx, sum, role).filter(function (a) { return a.sev !== 'info'; }).length;
    }
    if (view === 'trainer' && SA.safety) return SA.safety.reviewQueue().length;
    if (view === 'nearmiss' && SA.safety) return SA.safety.get().nearmiss.filter(function (n) { return n.status === 'open'; }).length;
    return 0;
  };

  // ---------------- near-miss (officer) ----------------
  var NM_TONE = { open: 'danger', investigating: 'warning', resolved: 'success' };
  var SEV_T = { low: 'neutral', medium: 'warning', high: 'danger' };

  function nmCard(ctx, n, withActions) {
    return h('article', { class: 'nm-card', 'data-report': n.id },
      h('div', { class: 'nm-card__head' },
        ui.badge(mt('m.nm.sev.' + n.severity), SEV_T[n.severity], 'alert'),
        ui.badge(mt('m.nm.' + n.status), NM_TONE[n.status]),
        h('span', { class: 'nm-card__time' }, fmtTime(n.ms))),
      h('p', { class: 'nm-card__desc' }, n.desc),
      h('p', { class: 'nm-card__meta' }, ui.icon('pin', { size: 14 }), n.location),
      h('p', { class: 'nm-card__meta' }, ui.icon('user', { size: 14 }), mt('m.nm.by', { name: n.name, id: n.workerId })),
      h('p', { class: 'nm-card__meta' }, ui.icon('info', { size: 14 }), mt('m.nm.photos')),
      withActions ? h('div', { class: 'cluster' }, SA.safety.NM_STATUS.filter(function (s) { return s !== n.status; }).map(function (s) {
        return ui.btn(mt('m.nm.setStatus', { status: mt('m.nm.' + s) }), { size: 'sm', variant: s === 'resolved' ? 'soft' : 'secondary', block: false, id: 'nm-' + n.id + '-' + s, onClick: function () {
          SA.safety.setNearMissStatus(n.id, s, SA.clock.now(ctx.store.get()));
          ui.toast(mt('m.nm.updated'), 'success');
          ctx.rerender({ keepScroll: true });
        } });
      })) : null);
  }

  V.nearmiss = function (ctx) {
    var filter = SA.safety.NM_STATUS.indexOf(ctx.query.s) !== -1 ? ctx.query.s : 'all';
    var all = SA.safety.get().nearmiss.slice().reverse();
    var list = all.filter(function (n) { return filter === 'all' || n.status === filter; });
    return [
      ui.segmented({
        label: mt('m.tab.nearmiss'), id: 'nm-filter', value: filter,
        options: ['all'].concat(SA.safety.NM_STATUS).map(function (s) { return { value: s, label: mt('m.nm.' + s) + ' (' + (s === 'all' ? all.length : all.filter(function (n) { return n.status === s; }).length) + ')' }; }),
        onChange: function (v) { ctx.navigate(M().href('officer', 'nearmiss', v === 'all' ? '' : '&s=' + v)); }
      }),
      list.length ? h('div', { class: 'ccards', id: 'mgmt-nearmiss' }, list.map(function (n) { return nmCard(ctx, n, true); }))
        : ui.empty({ icon: 'report', title: all.length ? mt('m.nm.noneFilter') : mt('m.nearMiss.none'), text: mt('m.nm.local') }),
      h('p', { class: 'demo-note' }, mt('m.nm.local'))
    ];
  };

  /** Officer dashboard section (keeps the original id and labels). */
  V.nearmissSummary = function (ctx) {
    var all = SA.safety.get().nearmiss;
    var c = { open: 0, investigating: 0, resolved: 0 };
    all.forEach(function (n) { c[n.status]++; });
    return M().panel(M().section('m.nearMiss.title', all.length ? [
      h('p', { class: 'demo-note', id: 'mgmt-nm-summary' }, mt('m.nm.summary', c)),
      h('div', { class: 'ccards' }, all.slice(-2).reverse().map(function (n) { return nmCard(ctx, n, false); })),
      ui.btn(mt('m.nm.viewAll'), { href: M().href('officer', 'nearmiss'), variant: 'secondary', size: 'sm', block: false, icon: 'chevronRight' })
    ] : [ui.empty({ icon: 'report', title: mt('m.nearMiss.none'), text: mt('m.nm.local') })], 'mgmt-sec-nearmiss'));
  };

  // ---------------- zone clearance (officer) ----------------
  V.zones = function (ctx, sum) {
    var local = ctx.state.worker ? SA.insights.clearance(ctx.state, sum.nowMs) : null;
    var rows = sum.workers.map(function (w) {
      var z = {};
      SA.validation.MODULE_IDS.forEach(function (m) {
        z[m] = w.local && local ? local.zones.filter(function (x) { return x.module === m; })[0] : { module: m, status: 'notCleared' };
      });
      return { w: w, z: z };
    });
    var ST = { cleared: ['m.zn.cleared', 'success', 'checkCircle'], refresher: ['m.zn.refresher', 'warning', 'clock'], notCleared: ['m.zn.not', 'neutral', 'lock'] };
    return [
      h('div', { class: 'zonecards' }, SA.validation.MODULE_IDS.map(function (m, i) {
        var n = rows.filter(function (r) { return r.z[m].status === 'cleared'; }).length;
        var L = moduleLook(m);
        return h('article', { class: 'gcard zonecard', 'data-zone': m },
          h('div', { class: 'zonecard__head' }, h('span', { class: 'zonecard__no tabular' }, 'ZONE 0' + (i + 1)), h('span', { class: 'row__icon tone-' + L.tone }, ui.icon(L.icon, { size: 18 }))),
          h('h3', { class: 'modcard__title' }, mt('m.zn.zone.' + m)),
          ui.ring({ value: n, max: sum.total, size: 96, stroke: 9, tone: n ? 'success' : 'primary', label: mt('m.zn.count', { n: n, total: sum.total }), center: h('span', { class: 'mbig' }, String(n)) }),
          h('p', { class: 'demo-note' }, mt('m.zn.count', { n: n, total: sum.total })));
      })),
      h('div', { class: 'wtable', id: 'mgmt-zones' }, rows.map(function (r) {
        return h('article', { class: 'wrow zrow', 'data-worker': r.w.id },
          h('div', { class: 'wrow__who' }, ui.avatar(r.w.name, { size: 'sm', seed: r.w.id }),
            h('div', { class: 'wrow__id' }, h('span', { class: 'wrow__name' }, r.w.name), h('span', { class: 'wrow__sub tabular' }, r.w.id + ' · ' + (r.w.local ? mt('m.thisDevice') : mt('m.seeded'))))),
          SA.validation.MODULE_IDS.map(function (m) {
            var z = r.z[m], s = ST[z.status];
            return h('div', { class: 'zcell' }, h('span', { class: 'wrow__sub' }, mt('m.zn.zone.' + m)), ui.badge(mt(s[0]), s[1], s[2]),
              z.status !== 'notCleared' && z.expiryMs ? h('span', { class: 'wrow__sub' }, mt('m.zn.expires', { date: M().fmtDate(z.expiryMs) })) : null);
          }));
      })),
      h('p', { class: 'demo-note' }, mt('m.zn.rule'))
    ];
  };

  // ---------------- analytics ----------------
  var RANGES = { '7d': 7, '30d': 30, '3m': 91, '1y': 365 };

  function lineChart(series, id) {
    var W = 640, H = 180, P = 8;
    var max = Math.max(1, Math.max.apply(null, series.map(function (s) { return s.v; })));
    var step = series.length > 1 ? (W - 2 * P) / (series.length - 1) : 0;
    var pts = series.map(function (s, i) { return [P + i * step, H - P - (H - 2 * P) * s.v / max]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + (P + (series.length - 1) * step).toFixed(1) + ' ' + (H - P) + ' L' + P + ' ' + (H - P) + ' Z';
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart chart--line', role: 'img', 'aria-label': series.map(function (x) { return x.label + ': ' + x.v; }).join(', '), id: id });
    var defs = svg('defs');
    var grad = svg('linearGradient', { id: id + '-g', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(svg('stop', { offset: '0%', class: 'chart__stop-a' }));
    grad.appendChild(svg('stop', { offset: '100%', class: 'chart__stop-b' }));
    defs.appendChild(grad); s.appendChild(defs);
    [0.25, 0.5, 0.75].forEach(function (f) { s.appendChild(svg('line', { x1: 0, x2: W, y1: (H * f).toFixed(1), y2: (H * f).toFixed(1), class: 'chart__grid' })); });
    s.appendChild(svg('path', { d: area, fill: 'url(#' + id + '-g)', class: 'chart__area' }));
    s.appendChild(svg('path', { d: line, class: 'chart__line', pathLength: 1 }));
    pts.forEach(function (p, i) { if (series[i].v) s.appendChild(svg('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 4, class: 'chart__dot' })); });
    return s;
  }

  function donut(parts, total, center, label) {
    var s = svg('svg', { viewBox: '0 0 120 120', class: 'chart chart--donut', role: 'img', 'aria-label': label });
    s.appendChild(svg('circle', { cx: 60, cy: 60, r: 48, class: 'chart__donut-track', 'stroke-width': 14, fill: 'none' }));
    var offset = 0;
    parts.forEach(function (p) {
      if (!p.v || !total) return;
      var len = 100 * p.v / total;
      s.appendChild(svg('circle', { cx: 60, cy: 60, r: 48, fill: 'none', 'stroke-width': 14, pathLength: 100, class: 'chart__seg tone-' + p.tone, 'stroke-dasharray': (len >= 99.9 ? '100 0' : Math.max(0, len - 1.2).toFixed(2) + ' ' + (100 - len + 1.2).toFixed(2)), 'stroke-dashoffset': (25 - offset).toFixed(2) }));
      offset += len;
    });
    return h('div', { class: 'donut' }, s, h('div', { class: 'donut__center' }, center));
  }

  V.analytics = function (ctx, sum, role) {
    var range = RANGES[ctx.query.r] ? ctx.query.r : '30d';
    var days = RANGES[range];
    var all = assessments(ctx.state, sum);
    var from = sum.nowMs - days * DAY;
    var inRange = all.filter(function (a) { return a.ms > from && a.ms <= sum.nowMs; });
    var prev = all.filter(function (a) { return a.ms > from - days * DAY && a.ms <= from; }).length;
    var bucketDays = days <= 30 ? 1 : days <= 91 ? 7 : 30;
    var buckets = [];
    for (var t0 = from; t0 < sum.nowMs; t0 += bucketDays * DAY) {
      var t1 = t0 + bucketDays * DAY;
      buckets.push({ label: M().fmtDate(t1), v: inRange.filter(function (a) { return a.ms > t0 && a.ms <= t1; }).length });
    }
    var passIn = inRange.filter(function (a) { return a.passed; }).length;
    var assessed = sum.workers.filter(function (w) { return typeof w.risk === 'number'; });
    var retention = assessed.length ? Math.round(100 - assessed.reduce(function (s, w) { return s + w.risk; }, 0) / assessed.length) : null;
    var trained = sum.workers.filter(function (w) { return !w.untrained; });
    var upToDate = trained.filter(function (w) { return !w.refresherDue; }).length;
    var diff = inRange.length - prev;
    var trend = diff > 0 ? mt('m.an.trend.up', { n: diff }) : diff < 0 ? mt('m.an.trend.down', { n: -diff }) : mt('m.an.trend.flat');
    var ppe = SA.safety ? SA.safety.get().ppe : [];
    var ppeC = { ready: 0, missing: 0, review: 0 };
    ppe.forEach(function (p) { ppeC[p.outcome]++; });
    var LANG = { hi: 'Hindi', sat: 'Santali', en: 'English' };

    return [
      ui.segmented({
        label: mt('m.an.range'), id: 'an-range', value: range,
        options: Object.keys(RANGES).map(function (k) { return { value: k, label: k.toUpperCase(), id: 'an-range-' + k }; }),
        onChange: function (v) { ctx.navigate(M().href(role, 'analytics', '&r=' + v)); }
      }),
      h('div', { class: 'metrics metrics--4' },
        M().metric(mt('m.an.attempts'), inRange.length, 'activity', 'primary', 'an-attempts', trend),
        M().metric(mt('m.an.passRate'), inRange.length ? Math.round(100 * passIn / inRange.length) + '%' : null, 'checkCircle', 'success', 'an-pass'),
        M().metric(mt('m.an.retention'), retention === null ? null : retention + '%', 'shieldCheck', 'teal', 'an-retention', mt('m.an.retentionText')),
        M().metric(mt('m.an.refresherDone'), trained.length ? Math.round(100 * upToDate / trained.length) + '%' : null, 'clock', 'purple', 'an-refresher')),
      M().panel(M().section('m.an.activity', [
        inRange.length ? lineChart(buckets, 'an-line') : ui.empty({ icon: 'chart', title: mt('m.an.noData') }),
        inRange.length ? h('div', { class: 'chart__axis' }, h('span', null, buckets[0].label), h('span', null, buckets[buckets.length - 1].label)) : null,
        h('p', { class: 'demo-note' }, mt('m.an.activityNote'))
      ], 'an-sec-activity')),
      h('div', { class: 'mgrid' },
        M().panel(M().section('m.an.completion', M().moduleProgress(sum), 'an-sec-completion'), 'mgrid__main'),
        M().panel(M().section('m.an.risk', h('div', { class: 'donut-row' },
          donut([{ v: sum.risk.green, tone: 'success' }, { v: sum.risk.amber, tone: 'warning' }, { v: sum.risk.red, tone: 'danger' }], sum.risk.green + sum.risk.amber + sum.risk.red,
            h('span', { class: 'mbig' }, String(sum.risk.green + sum.risk.amber + sum.risk.red)), mt('m.an.risk')),
          h('ul', { class: 'legend' },
            legend('success', mt('m.risk.green'), sum.risk.green), legend('warning', mt('m.risk.amber'), sum.risk.amber), legend('danger', mt('m.risk.red'), sum.risk.red))), 'an-sec-risk'), 'mgrid__side')),
      M().panel(M().section('m.an.heatmap', h('div', { class: 'heatmap', id: 'an-heatmap', role: 'table', 'aria-label': mt('m.an.heatmap') },
        h('div', { class: 'heatmap__row heatmap__row--head', role: 'row' }, h('span', { role: 'columnheader' }, mt('m.workers.title')),
          SA.validation.MODULE_IDS.map(function (m) { return h('span', { role: 'columnheader' }, M().moduleName(m)); })),
        sum.workers.map(function (w) {
          return h('div', { class: 'heatmap__row', role: 'row' }, h('span', { class: 'heatmap__name', role: 'rowheader' }, w.name),
            SA.validation.MODULE_IDS.map(function (m) {
              var r = w.modules[m];
              return h('span', { class: 'heatmap__cell' + (r ? ' tone-' + tone(r.score) : ' is-empty'), role: 'cell' }, r ? String(r.score) : mt('m.noRecord'));
            }));
        })), 'an-sec-heatmap')),
      h('div', { class: 'mgrid' },
        M().panel(M().section('m.an.ppe', ppe.length ? h('div', { class: 'donut-row' },
          donut([{ v: ppeC.ready, tone: 'success' }, { v: ppeC.review, tone: 'warning' }, { v: ppeC.missing, tone: 'danger' }], ppe.length, h('span', { class: 'mbig' }, Math.round(100 * ppeC.ready / ppe.length) + '%'), mt('m.an.ppe')),
          h('ul', { class: 'legend' }, legend('success', mt('m.ppe.ready'), ppeC.ready), legend('warning', mt('m.ppe.review'), ppeC.review), legend('danger', mt('m.ppe.missing'), ppeC.missing)))
          : ui.empty({ icon: 'helmet', title: mt('m.an.ppeNone') }), 'an-sec-ppe'), 'mgrid__main'),
        M().panel(M().section('m.an.language', h('p', { class: 'demo-note' }, mt('m.an.languageText', { lang: LANG[ctx.state.settings.language] || '—' })), 'an-sec-lang'), 'mgrid__side'))
    ];
    function legend(t, label, n) { return h('li', { class: 'legend__item' }, h('span', { class: 'legend__dot tone-' + t, 'aria-hidden': 'true' }), h('span', { class: 'legend__label' }, label), h('span', { class: 'legend__n tabular' }, String(n))); }
  };

  SA.mpages = { assessments: assessments, alertList: alertList };
})(typeof globalThis !== 'undefined' ? globalThis : window);
