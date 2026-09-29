/*
 * Certificate display (with locally generated QR) and offline verification.
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

  SA.screens.certificate = function (ctx) {
    var t = ctx.t;
    var stored = SA.training.latestCertificate(ctx.state, ctx.state.worker.id);
    var decoded = stored ? SA.certificate.decodeBody(stored.body) : null;
    if (!stored || !decoded) {
      return ui.page(ctx, { back: '#/home' }, [
        ui.title(t('cert.title')),
        ui.notice(t('cert.none'), 'info'),
        ui.btn(t('nav.home'), { href: '#/home' })
      ]);
    }
    var payload = SA.certificate.toPayload(stored);
    return ui.page(ctx, { back: '#/home' }, [
      ui.title(t('cert.title')),
      h('article', { class: 'cert', id: 'certificate' },
        h('div', { class: 'cert__band', 'aria-hidden': 'true' }),
        h('p', { class: 'cert__brand' }, t('app.name'), ' · SurakshaAR'),
        facts(ctx, decoded, stored.workerId),
        qrBlock(ctx, payload),
        h('label', { class: 'field__label cert__payload-label', for: 'cert-payload' }, t('cert.payload')),
        h('textarea', { class: 'payload', id: 'cert-payload', readonly: true, rows: '3', spellcheck: 'false', value: payload })
      ),
      h('p', { class: 'demo-note' }, h('span', { 'aria-hidden': 'true' }, '⚠ '), t('cert.demoNote')),
      ui.btn(t('cert.verify'), { href: '#/verify?use=last', id: 'cert-verify' }),
      ui.btn(t('nav.home'), { href: '#/home', variant: 'secondary' })
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
        h('p', { class: 'verdict__label', id: 'verdict-label' },
          h('span', { 'aria-hidden': 'true' }, res.valid ? '✓ ' : '✕ '), res.valid ? t('verify.valid') : t('verify.invalid')),
        h('p', { class: 'verdict__reason', id: 'verdict-reason' }, reason),
        res.valid ? facts(ctx, res.cert) : null,
        h('p', { class: 'verdict__offline' }, t('verify.offline'))));
    }

    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/welcome' }, [
      ui.title(t('verify.title'), t('verify.hint')),
      h('label', { class: 'field__label', for: 'verify-input' }, t('verify.input')),
      input,
      hint,
      h('div', { class: 'btn-row' },
        ui.btn(t('verify.useLast'), { variant: 'secondary', onClick: useLast, id: 'verify-use-last' }),
        ui.btn(t('verify.tamper'), { variant: 'secondary', onClick: tamper, id: 'verify-tamper' })),
      ui.btn(t('verify.submit'), { onClick: runVerify, id: 'verify-submit' }),
      out,
      h('p', { class: 'demo-note' }, h('span', { 'aria-hidden': 'true' }, '⚠ '), t('cert.demoNote'))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
