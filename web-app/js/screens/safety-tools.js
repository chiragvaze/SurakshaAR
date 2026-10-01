/*
 * Emergency SOS (#/sos), Near-miss report (#/nearmiss) and Notifications (#/alerts).
 *
 * SOS safety rules: two steps (choose what happened -> confirm) to avoid accidental
 * activation; red only for the emergency itself; no decorative animation; and it never
 * claims an alert was sent — this build has no network, so the event is LOGGED on this
 * phone (with an audit entry) and the worker is told to get help in person.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  var SOS_ICON = { injury: 'activity', fire: 'flame', gas: 'wind', equipment: 'zap', other: 'alert' };
  var NM_TONE = { open: 'danger', investigating: 'warning', resolved: 'success' };
  var SEV_TONE = { low: 'neutral', medium: 'warning', high: 'danger' };

  function fmtTime(ms, lang) {
    try {
      return new Date(ms).toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); }
  }

  // ---------------- SOS ----------------
  SA.screens.sos = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;

    function detailRows(type, ms, status) {
      return h('dl', { class: 'facts sos-facts' },
        h('dt', null, t('sos.ask')), h('dd', { id: 'sos-d-type' }, t('sos.type.' + type)),
        h('dt', null, t('sos.worker')), h('dd', null, w.id),
        h('dt', null, t('sos.time')), h('dd', null, fmtTime(ms, ctx.lang)),
        h('dt', null, t('sos.location')), h('dd', null, t('sos.locationNone')),
        h('dt', null, t('sos.status')), h('dd', { id: 'sos-d-status' }, status));
    }

    function confirm(type) {
      var now = SA.clock.now(ctx.store.get());
      var s;
      function log() {
        var rec = SA.safety.logSos(w.id, type, SA.clock.now(ctx.store.get()));
        s.el.replaceChildren(
          h('div', { class: 'sos-done', role: 'alert' },
            h('span', { class: 'sos-done__icon' }, ui.icon('checkCircle', { size: 32 })),
            h('h2', { class: 'sheet__title', id: 'sos-logged-title', tabindex: '-1' }, t('sos.logged')),
            h('p', { class: 'sos-done__text' }, t('sos.loggedText')),
            detailRows(rec.type, rec.ms, t('sos.statusLogged')),
            ui.btn(t('common.done'), { onClick: function () { s.close(); ctx.rerender(); }, id: 'sos-done', variant: 'secondary' })));
        var tt = s.el.querySelector('#sos-logged-title');
        if (tt) tt.focus();
        if (root.navigator && root.navigator.vibrate) { try { root.navigator.vibrate([80, 60, 80]); } catch (e) { /* no haptics */ } }
      }
      s = ui.sheet({
        id: 'sos-sheet', tone: 'danger', title: t('sos.confirmTitle'),
        content: [detailRows(type, now, t('sos.statusLogged')), ui.notice(t('sos.proto'), 'warning')],
        actions: [
          ui.btn(t('sos.log'), { variant: 'danger', icon: 'siren', onClick: log, id: 'sos-confirm' }),
          ui.btn(t('common.cancel'), { variant: 'secondary', onClick: function () { s.close(); }, id: 'sos-cancel' })
        ]
      });
    }

    var log = SA.safety.get().sos.filter(function (e) { return e.workerId === w.id; }).slice(-5).reverse();

    return ui.page(ctx, { back: '#/home', cls: 'screen--sos' }, [
      h('div', { class: 'sos-head' },
        h('span', { class: 'sos-head__icon', 'aria-hidden': 'true' }, ui.icon('siren', { size: 30 })),
        h('div', null,
          h('h1', { class: 'page__title', tabindex: '-1' }, t('sos.title')),
          h('p', { class: 'page__sub' }, t('sos.ask')))),
      h('div', { class: 'sos-grid', role: 'group', 'aria-label': t('sos.ask') },
        SA.safety.SOS_TYPES.map(function (type) {
          return h('button', { type: 'button', class: 'sos-type', 'data-sos-type': type, id: 'sos-' + type, onClick: function () { confirm(type); } },
            h('span', { class: 'sos-type__icon' }, ui.icon(SOS_ICON[type], { size: 26 })),
            h('span', { class: 'sos-type__label' }, t('sos.type.' + type)));
        })),
      ui.notice(t('sos.proto'), 'warning', { id: 'sos-proto' }),
      log.length ? ui.section({ title: t('sos.history') },
        h('div', { class: 'list', id: 'sos-log' }, log.map(function (e) {
          return ui.row({ icon: SOS_ICON[e.type], tone: 'danger', title: t('sos.type.' + e.type), sub: fmtTime(e.ms, ctx.lang) + ' · ' + t('sos.statusLogged') });
        }))) : null
    ]);
  };

  // ---------------- Near-miss ----------------
  SA.screens.nearmiss = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    var severity = 'medium';
    var locErr = h('p', { class: 'field__error', id: 'nm-loc-error', hidden: true });
    var descErr = h('p', { class: 'field__error', id: 'nm-desc-error', hidden: true });
    var loc = h('input', { class: 'input', id: 'nm-location', type: 'text', maxlength: '80', placeholder: t('nm.locationPh'), autocomplete: 'off' });
    var desc = h('textarea', { class: 'input', id: 'nm-desc', rows: '4', maxlength: '500', placeholder: t('nm.descPh') });

    function submit(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      var l = loc.value.trim(), d = desc.value.trim();
      locErr.hidden = l.length >= 2; locErr.textContent = t('nm.errLocation');
      descErr.hidden = d.length >= 10; descErr.textContent = t('nm.errDesc');
      if (!locErr.hidden) { loc.setAttribute('aria-invalid', 'true'); loc.focus(); return; }
      loc.removeAttribute('aria-invalid');
      if (!descErr.hidden) { desc.setAttribute('aria-invalid', 'true'); desc.focus(); return; }
      try {
        SA.safety.addNearMiss(w, { severity: severity, location: l, desc: d }, SA.clock.now(ctx.store.get()));
        ui.toast(t('nm.saved'), 'success');
        ctx.rerender({ keepScroll: false });
      } catch (e) {
        ui.toast(t('err.generic'), 'error');
      }
    }

    var mine = SA.safety.get().nearmiss.filter(function (n) { return n.workerId === w.id; }).slice().reverse();

    return ui.page(ctx, { back: '#/home' }, [
      h('div', { class: 'module-head' },
        h('span', { class: 'module-head__icon tone-warning', 'aria-hidden': 'true' }, ui.icon('report', { size: 28, stroke: 1.8 })),
        h('div', { class: 'module-head__text' },
          h('h1', { class: 'page__title', tabindex: '-1' }, t('nm.title')),
          h('p', { class: 'page__sub' }, t('nm.sub')))),
      h('form', { class: 'form gcard', id: 'nm-form', novalidate: true, onSubmit: submit },
        h('div', { class: 'field' },
          h('span', { class: 'field__label', id: 'nm-sev-label' }, t('nm.severity')),
          ui.segmented({
            label: t('nm.severity'), id: 'nm-severity', value: severity, cls: 'segmented--block',
            options: SA.safety.SEVERITIES.map(function (s) { return { value: s, label: t('nm.sev.' + s), id: 'nm-sev-' + s }; }),
            onChange: function (v) { severity = v; }
          })),
        h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'nm-location' }, t('nm.location')), loc, locErr),
        h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'nm-desc' }, t('nm.desc')), desc, descErr),
        h('p', { class: 'privacy-note' }, ui.icon('info', { size: 16 }), h('span', null, t('nm.photoNote'))),
        h('p', { class: 'privacy-note' }, ui.icon('lock', { size: 16 }), h('span', null, t('nm.localNote'))),
        ui.btn(t('nm.submit'), { type: 'submit', id: 'nm-submit', icon: 'send' })),
      ui.section({ title: t('nm.mine') },
        mine.length
          ? h('div', { class: 'nm-list', id: 'nm-mine' }, mine.map(function (n) {
              return h('article', { class: 'nm-card', 'data-report': n.id },
                h('div', { class: 'nm-card__head' },
                  ui.badge(t('nm.sev.' + n.severity), SEV_TONE[n.severity], 'alert'),
                  ui.badge(t('nm.status.' + n.status), NM_TONE[n.status])),
                h('p', { class: 'nm-card__desc' }, n.desc),
                h('p', { class: 'nm-card__meta' }, ui.icon('pin', { size: 14 }), n.location + ' · ' + fmtTime(n.ms, ctx.lang)));
            }))
          : ui.empty({ icon: 'report', title: t('nm.none'), text: t('nm.noneText'), id: 'nm-empty' }))
    ]);
  };

  // ---------------- Notifications ----------------
  SA.screens.alerts = function (ctx) {
    var t = ctx.t;
    var list = SA.insights.alerts(ctx.state);
    function rowFor(a) {
      var m = a.module ? ui.moduleTitle(a.module, ctx.lang) : '';
      switch (a.kind) {
        case 'refresher': return { title: t('alerts.refresher', { module: m }), sub: t('alerts.refresherText', { days: a.days }), href: '#/briefing/' + a.module };
        case 'expiring': return { title: t('alerts.expiring', { date: SA.i18n.formatDate(a.expiryMs, ctx.lang) }), sub: m, href: '#/certificate' };
        case 'notStarted': return { title: t('alerts.notStarted', { module: m }), sub: t('alerts.notStartedText'), href: '#/briefing/' + a.module };
        case 'assignment': return { title: t('alerts.assignment', { module: m }), sub: t('alerts.assignmentText', { date: a.due }), href: '#/briefing/' + a.module };
        default: return { title: t('alerts.ppe'), sub: t('ppe.sub'), href: '#/ppe' };
      }
    }
    var order = { refresher: 0, assignment: 1, expiring: 2, ppe: 3, notStarted: 4 };
    list.sort(function (a, b) { return order[a.kind] - order[b.kind]; });
    return ui.page(ctx, { back: '#/home' }, [
      ui.title(t('alerts.title')),
      list.length
        ? h('div', { class: 'list', id: 'alerts-list' }, list.map(function (a, i) {
            var r = rowFor(a);
            return ui.row({ icon: a.icon, tone: a.tone, title: r.title, sub: r.sub, href: r.href, id: 'alert-' + i });
          }))
        : ui.empty({ icon: 'bell', title: t('alerts.none'), text: t('alerts.noneText'), id: 'alerts-empty' }),
      h('p', { class: 'demo-note' }, t('offline.text'))
    ]);
  };

  SA.safetyUI = { fmtTime: fmtTime, NM_TONE: NM_TONE, SEV_TONE: SEV_TONE, SOS_ICON: SOS_ICON };
})(typeof globalThis !== 'undefined' ? globalThis : window);
