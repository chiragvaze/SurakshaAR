/*
 * Onboarding screens: Welcome, Language, Worker profile.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  SA.screens.welcome = function (ctx) {
    var t = ctx.t;
    var secondary = ctx.lang !== 'en'
      ? h('p', { class: 'welcome__secondary', lang: 'en' }, SA.i18n.tFor('en', 'welcome.purpose'))
      : null;
    return ui.page(ctx, { noBar: true }, [
      h('div', { class: 'welcome' },
        h('div', { class: 'hazard-band', 'aria-hidden': 'true' }),
        h('div', { class: 'brand-mark brand-mark--lg', 'aria-hidden': 'true' }),
        h('h1', { class: 'welcome__title', tabindex: '-1' }, t('app.name')),
        ctx.lang !== 'en' ? h('p', { class: 'welcome__title-en', lang: 'en' }, 'Suraksha Drishti') : null,
        h('p', { class: 'welcome__tagline' }, t('app.tagline')),
        h('p', { class: 'welcome__purpose' }, t('welcome.purpose')),
        secondary,
        ui.btn(t('welcome.start'), { href: '#/language?next=' + encodeURIComponent('#/profile'), id: 'start-training' }),
        h('p', { class: 'welcome__offline' }, t('welcome.offline'))
      )
    ]);
  };

  SA.screens.language = function (ctx) {
    var t = ctx.t;
    var current = ctx.state.settings.language;
    function choose(code) {
      ctx.store.update(function (s) { s.settings.language = code; });
      SA.i18n.setLanguage(code);
      var next = ctx.safeNext(ctx.query.next);
      ctx.navigate(next || (ctx.state.worker ? '#/home' : '#/profile'));
    }
    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/welcome' }, [
      ui.title(t('lang.title'), t('lang.hint')),
      h('div', { class: 'lang-list', role: 'group', 'aria-label': t('lang.title') },
        SA.LANGUAGE_OPTIONS.map(function (opt) {
          return h('button', {
            type: 'button',
            class: 'lang-option' + (current === opt.code ? ' is-selected' : ''),
            'aria-pressed': current === opt.code ? 'true' : 'false',
            'data-lang': opt.code,
            onClick: function () { choose(opt.code); }
          },
          h('span', { class: 'lang-option__label' }, opt.label),
          h('span', { class: 'lang-option__sub' }, opt.sub),
          current === opt.code ? h('span', { class: 'lang-option__check', 'aria-hidden': 'true' }, '✓') : null);
        })
      )
    ]);
  };

  SA.screens.profile = function (ctx) {
    var t = ctx.t;
    var V = SA.validation;
    var worker = ctx.state.worker || { name: '', id: '' };

    var nameErr = h('p', { class: 'field__error', id: 'name-error', hidden: true });
    var idErr = h('p', { class: 'field__error', id: 'id-error', hidden: true });
    var nameInput = h('input', {
      id: 'worker-name', name: 'name', type: 'text', value: worker.name, maxlength: String(V.NAME_MAX + 10),
      autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', required: true
    });
    var idInput = h('input', {
      id: 'worker-id', name: 'workerId', type: 'text', value: worker.id, maxlength: String(V.ID_MAX + 5),
      autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', required: true, 'aria-describedby': 'id-hint'
    });

    function showError(input, errEl, code, prefix) {
      errEl.hidden = !code;
      errEl.textContent = code ? t(prefix + (code === 'required' ? 'Required' : 'Invalid')) : '';
      if (code) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', errEl.id + (input === idInput ? ' id-hint' : ''));
      } else {
        input.removeAttribute('aria-invalid');
      }
    }

    function submit(ev) {
      ev.preventDefault();
      var name = V.normalizeName(nameInput.value);
      var id = V.normalizeWorkerId(idInput.value);
      var nameCode = V.checkName(name);
      var idCode = V.checkWorkerId(id);
      showError(nameInput, nameErr, nameCode, 'profile.err.name');
      showError(idInput, idErr, idCode, 'profile.err.id');
      if (nameCode) { nameInput.focus(); return; }
      if (idCode) { idInput.focus(); return; }
      ctx.store.update(function (s) {
        if (!s.worker || s.worker.id !== id) s.inProgress = null; // a different worker never inherits a session
        s.worker = { id: id, name: name };
      });
      ctx.navigate('#/home');
    }

    return ui.page(ctx, { back: ctx.state.worker ? '#/home' : '#/language' }, [
      ui.title(t('profile.title')),
      h('form', { class: 'form', novalidate: true, onSubmit: submit },
        h('div', { class: 'field' },
          h('label', { for: 'worker-name', class: 'field__label' }, t('profile.name')), nameInput, nameErr),
        h('div', { class: 'field' },
          h('label', { for: 'worker-id', class: 'field__label' }, t('profile.id')), idInput,
          h('p', { class: 'field__hint', id: 'id-hint' }, t('profile.idHint')), idErr),
        h('p', { class: 'privacy-note' }, h('span', { 'aria-hidden': 'true' }, '🔒 '), t('profile.privacy')),
        ui.btn(t('profile.continue'), { type: 'submit', id: 'profile-continue' })
      )
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
