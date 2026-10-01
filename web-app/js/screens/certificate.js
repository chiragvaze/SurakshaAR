/*
 * Suraksha Passport (#/certificate): worker safety identity, certification status, zone
 * clearance (demo rule, SA.insights) and the locally generated certificate QR ("scan at gate").
 * Offline verification (#/verify). Certificate issue/verify logic is unchanged (SA.certificate).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  function facts(ctx, cert, workerId) {
    var t = ctx.t;
    return h('dl', { class: 'facts facts--cert' },
      h('dt', null, t('cert.worker')), h('dd', { id: 'cert-worker' }, cert.name + (workerId ? ' · ' + workerId : '')),
      h('dt', null, t('cert.module')), h('dd', { id: 'cert-module' }, ui.moduleTitle(cert.module, ctx.lang)),
      h('dt', null, t('cert.score')), h('dd', { id: 'cert-score' }, cert.score + '/100'),
      h('dt', null, t('cert.issued')), h('dd', null, SA.i18n.formatDate(cert.issuedMs, ctx.lang)),
      h('dt', null, t('cert.expiry')), h('dd', null, SA.i18n.formatDate(cert.expiryMs, ctx.lang)));
  }

  function qrBlock(ctx, payload) {
    var box = h('div', { class: 'qr', role: 'img', 'aria-label': ctx.t('cert.qrAlt'), id: 'cert-qr' });
    try {
      // The SVG string is built only from numbers in SA.qr (no user text), so innerHTML is safe here.
      box.innerHTML = SA.qr.toSvgString(SA.qr.encode(payload), 4);
      return box;
    } catch (e) {
      if (root.console) root.console.error('[qr]', e);
      return ui.notice(ctx.t('cert.qrError'), 'error');
    }
  }

  var ZONE = {
    cleared: { tone: 'success', icon: 'checkCircle', key: 'passport.zone.cleared' },
    refresher: { tone: 'warning', icon: 'clock', key: 'passport.zone.refresher' },
    notCleared: { tone: 'neutral', icon: 'lock', key: 'passport.zone.notCleared' }
  };

  function zoneCard(ctx, z, ppeOk) {
    var t = ctx.t;
    var L = SA.trainUI.look(z.module);
    var st = SA.training.moduleStatus(ctx.state, z.module);
    var Z = ZONE[z.status];
    function req(ok, label) {
      return h('li', { class: 'check-line' + (ok ? ' is-ok' : '') },
        h('span', { class: 'check-line__mark' }, ui.icon(ok ? 'check' : 'dot', { size: 14, stroke: 3 })), h('span', null, label));
    }
    return h('article', { class: 'zone zone--' + z.status, 'data-zone': z.module },
      h('div', { class: 'zone__head' },
        h('span', { class: 'zone__icon tone-' + L.tone }, ui.icon(L.icon, { size: 20 })),
        h('div', { class: 'zone__name' },
          h('span', { class: 'zone__title' }, t('passport.zone.' + z.module)),
          h('span', { class: 'zone__sub' }, z.status === 'notCleared' ? t('passport.zone.needs') : t('passport.zone.expires', { date: SA.i18n.formatDate(z.expiryMs, ctx.lang) }))),
        ui.badge(t(Z.key), Z.tone, Z.icon)),
      h('ul', { class: 'check-list zone__reqs' },
        req(st.kind === 'passed', ui.moduleTitle(z.module, ctx.lang)),
        req(z.status !== 'notCleared', t('cert.title')),
        req(z.status === 'cleared', t('retention.title')),
        SA.safety ? req(ppeOk, t('passport.ppe')) : null));
  }

  SA.screens.certificate = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    var nowMs = SA.clock.now(ctx.state);
    var stored = SA.training.latestCertificate(ctx.state, w.id);
    var decoded = stored ? SA.certificate.decodeBody(stored.body) : null;
    var payload = stored && decoded ? SA.certificate.toPayload(stored) : null;
    var check = payload ? SA.certificate.verify(payload, nowMs) : null;
    var clr = SA.insights.clearance(ctx.state, nowMs);
    var r = SA.insights.readiness(ctx.state);
    var ret = SA.insights.retention(ctx.state, nowMs);
    var last = SA.insights.lastAttempt(ctx.state);
    var ppe = SA.safety ? SA.safety.latestPpe(w.id) : null;
    var ppeToday = SA.safety ? SA.safety.ppeToday(w.id, nowMs) : null;

    var status = !check ? { key: 'passport.none', tone: 'neutral', icon: 'info' }
      : check.valid && !(ret && ret.refresherDue) ? { key: 'passport.verified', tone: 'success', icon: 'badgeCheck' }
      : { key: 'passport.attention', tone: 'warning', icon: 'alert' };

    var passport = h('section', { class: 'passport', id: 'passport-card', 'aria-labelledby': 'passport-name' },
      h('div', { class: 'passport__band', 'aria-hidden': 'true' },
        h('span', { class: 'passport__brand' }, ui.brandMark(), h('span', null, t('passport.title'))),
        h('span', { class: 'passport__chip' }, ui.icon('shield', { size: 14 }), 'SurakshaAR')),
      h('div', { class: 'passport__body' },
        h('div', { class: 'passport__who' },
          ui.avatar(w.name, { size: 'lg', seed: w.id }),
          h('div', { class: 'passport__id' },
            h('h2', { class: 'passport__name', id: 'passport-name' }, w.name),
            h('p', { class: 'passport__wid tabular' }, w.id + ' · ' + t('passport.role')),
            ui.badge(t(status.key), status.tone, status.icon, { solid: status.tone === 'success', id: 'passport-status' }))),
        h('dl', { class: 'passport__facts' },
          pf(t('passport.training'), r.passed + '/' + r.total, 'passport-training'),
          pf(t('passport.ppe'), ppe ? SA.i18n.formatDate(ppe.ms, ctx.lang) : t('common.none'), 'passport-ppe'),
          pf(t('today.lastAssessment'), last ? last.score + '/100' : t('common.none'), 'passport-last'),
          pf(t('today.nextRefresher'), !ret ? t('common.none') : ret.refresherDue ? t('today.dueNow') : t('today.inDays', { days: ret.daysUntilRefresher }), 'passport-refresher'))));

    function pf(label, value, id) { return h('div', { class: 'passport__fact', id: id }, h('dt', null, label), h('dd', { class: 'tabular' }, value)); }

    var qrCard = payload
      ? h('section', { class: 'gcard qr-card', 'aria-labelledby': 'qr-h' },
          h('div', { class: 'card-head' }, h('span', { class: 'row__icon tone-primary' }, ui.icon('qr', { size: 18 })), h('h2', { class: 'section-title', id: 'qr-h' }, t('passport.scan'))),
          h('article', { class: 'cert', id: 'certificate' },
            qrBlock(ctx, payload),
            h('p', { class: 'qr-card__hint' }, t('passport.qrHint')),
            h('p', { class: 'cert__brand' }, t('cert.title')),
            facts(ctx, decoded, stored.workerId),
            h('details', { class: 'cert__code' },
              h('summary', null, t('passport.code')),
              h('label', { class: 'field__label cert__payload-label', for: 'cert-payload' }, t('cert.payload')),
              h('textarea', { class: 'payload', id: 'cert-payload', readonly: true, rows: '3', spellcheck: 'false', value: payload }))),
          ui.btn(t('cert.verify'), { href: '#/verify?use=last', id: 'cert-verify', icon: 'scan' }))
      : ui.empty({ icon: 'qr', title: t('cert.none'), id: 'cert-none', action: ui.btn(t('home.next.cta'), { href: '#/train', block: false, icon: 'play' }) });

    return ui.page(ctx, { tab: 'passport' }, [
      ui.title(t('passport.title'), t('passport.sub')),
      passport,
      qrCard,
      ui.section({ title: t('passport.zones'), id: 'passport-zones' }, [
        h('div', { class: 'zones' }, clr.zones.map(function (z) { return zoneCard(ctx, z, !!(ppeToday && ppeToday.outcome === 'ready')); })),
        h('p', { class: 'demo-note' }, t('passport.zone.rule'))
      ]),
      h('p', { class: 'demo-note' }, ui.icon('alert', { size: 14 }), ' ', t('cert.demoNote'))
    ]);
  };

  SA.screens.verify = function (ctx) {
    var t = ctx.t;
    var last = SA.training.latestCertificate(ctx.state, ctx.state.worker && ctx.state.worker.id) ||
               SA.training.latestCertificate(ctx.state);
    var input = h('textarea', {
      class: 'payload payload--edit', id: 'verify-input', rows: '5', spellcheck: 'false',
      autocomplete: 'off', autocapitalize: 'off', maxlength: String(SA.certificate.MAX_PAYLOAD_LENGTH),
      value: ctx.query.use === 'last' && last ? SA.certificate.toPayload(last) : ''
    });
    var out = h('div', { class: 'verify-out', id: 'verify-result', 'aria-live': 'polite' });
    var hint = h('p', { class: 'verify-hint', role: 'status' });

    function clearResult() { out.replaceChildren(); }
    input.addEventListener('input', function () { clearResult(); hint.textContent = ''; });

    function useLast() {
      clearResult();
      if (!last) { hint.textContent = t('verify.noLast'); return; }
      input.value = SA.certificate.toPayload(last);
      hint.textContent = '';
    }

    function tamper() {
      clearResult();
      var changed = SA.certificate.demoTamper(input.value);
      if (!changed) { hint.textContent = t('verify.reason.malformed'); return; }
      input.value = changed;
      hint.textContent = t('verify.tampered');
    }

    function runVerify() {
      var res = SA.certificate.verify(input.value, SA.clock.now(ctx.store.get()));
      if (res.reason === 'empty') { clearResult(); hint.textContent = t('verify.reason.empty'); input.focus(); return; }
      hint.textContent = '';
      var reason = res.valid ? t('verify.ok')
        : res.reason === 'expired' ? t('verify.reason.expired', { date: SA.i18n.formatDate(res.cert.expiryMs, ctx.lang) })
        : t('verify.reason.' + res.reason);
      out.replaceChildren(h('section', { class: 'verdict verdict--' + (res.valid ? 'valid' : 'invalid') },
        h('span', { class: 'verdict__icon' }, ui.icon(res.valid ? 'badgeCheck' : 'xCircle', { size: 40, stroke: 1.8 })),
        h('p', { class: 'verdict__label', id: 'verdict-label' },
          h('span', { 'aria-hidden': 'true' }, res.valid ? '✓ ' : '✕ '), res.valid ? t('verify.valid') : t('verify.invalid')),
        h('p', { class: 'verdict__reason', id: 'verdict-reason' }, reason),
        res.valid ? facts(ctx, res.cert) : null,
        h('p', { class: 'verdict__offline' }, ui.icon('offline', { size: 14 }), t('verify.offline'))));
      if (root.navigator && root.navigator.vibrate) { try { root.navigator.vibrate(res.valid ? 20 : [40, 60, 40]); } catch (e) { /* no haptics */ } }
    }

    return ui.page(ctx, ctx.state.worker ? { tab: 'verify' } : { back: '#/welcome' }, [
      ui.title(t('verify.title'), t('verify.hint')),
      ui.notice(t('verify.scanNote'), 'info', { id: 'verify-scan-note' }),
      h('section', { class: 'gcard verify-card' },
        h('label', { class: 'field__label', for: 'verify-input' }, t('verify.input')),
        input,
        hint,
        h('div', { class: 'btn-row' },
          ui.btn(t('verify.useLast'), { variant: 'secondary', onClick: useLast, id: 'verify-use-last', icon: 'copy' }),
          ui.btn(t('verify.tamper'), { variant: 'secondary', onClick: tamper, id: 'verify-tamper', icon: 'edit' })),
        ui.btn(t('verify.submit'), { onClick: runVerify, id: 'verify-submit', icon: 'shieldCheck' })),
      out,
      h('p', { class: 'demo-note' }, ui.icon('alert', { size: 14 }), ' ', t('cert.demoNote'))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
