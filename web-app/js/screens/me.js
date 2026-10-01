/*
 * Profile & Settings (#/me): worker identity, theme, visual effects, language, safety tools,
 * local data summary. Presentation only; worker edits go through the existing #/profile form.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  var LANG_NAME = { hi: 'हिन्दी', sat: 'Santali', en: 'English' };

  /** Rows for screens that exist in this build only (never a broken link). */
  function toolRows(t) {
    var tools = [
      ['ppe', 'helmet', 'train.ppe.title', 'teal'],
      ['coach', 'coach', 'coach.title', 'purple'],
      ['nearmiss', 'report', 'home.nearmiss', 'warning'],
      ['alerts', 'bell', 'home.alerts', 'primary'],
      ['sos', 'siren', 'quick.sos', 'danger']
    ];
    return tools.filter(function (x) { return SA.screens[x[0]]; }).map(function (x) {
      return ui.row({ icon: x[1], tone: x[3], title: t(x[2]), href: '#/' + x[0], id: 'me-' + x[0] });
    });
  }

  SA.screens.me = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    var attempts = ctx.state.attempts.filter(function (a) { return a.workerId === w.id; }).length;
    var certs = ctx.state.certs.filter(function (c) { return c.workerId === w.id; }).length;
    var tools = toolRows(t);

    return ui.page(ctx, { tab: 'me' }, [
      h('section', { class: 'gcard gcard--glass me-card', id: 'me-card' },
        ui.avatar(w.name, { size: 'lg', seed: w.id }),
        h('div', { class: 'me-card__text' },
          h('h1', { class: 'page__title me-card__name', tabindex: '-1' }, w.name),
          h('p', { class: 'me-card__id tabular' }, t('home.workerId', { id: w.id })),
          h('div', { class: 'cluster' }, ui.chip(t('passport.role'), { icon: 'helmet', tone: 'primary' }), ui.offlinePill(t)))),

      ui.section({ title: t('me.settings'), id: 'me-settings' }, [
        h('div', { class: 'gcard settings-card' },
          h('div', { class: 'setting' },
            h('div', { class: 'setting__text' }, h('span', { class: 'setting__label' }, t('theme.title'))),
            ui.themeToggle(t)),
          h('div', { class: 'setting' },
            h('div', { class: 'setting__text' },
              h('span', { class: 'setting__label' }, t('effects.title')),
              h('span', { class: 'setting__hint' }, t('effects.hint'))),
            ui.segmented({
              label: t('effects.title'), id: 'effects-segmented', value: SA.prefs.effects(),
              options: [{ value: 'full', label: t('effects.full'), id: 'effects-full' }, { value: 'reduced', label: t('effects.reduced'), id: 'effects-reduced' }],
              onChange: function (v) { SA.prefs.setEffects(v); }
            }))),
        h('div', { class: 'list' },
          ui.row({ icon: 'language', title: t('me.language'), sub: LANG_NAME[ctx.lang] || ctx.lang, href: '#/language?next=' + encodeURIComponent('#/me'), id: 'me-language' }),
          ui.row({ icon: 'edit', tone: 'neutral', title: t('me.editWorker'), sub: w.name + ' · ' + w.id, href: '#/profile', id: 'me-edit' }))
      ]),

      tools.length ? ui.section({ title: t('me.safety') }, h('div', { class: 'list' }, tools)) : null,

      ui.section({ title: t('me.data') }, [
        h('div', { class: 'list' },
          ui.row({ icon: 'shieldCheck', tone: 'success', title: t('offline.title'), sub: t('offline.text') }),
          ui.row({ icon: 'clipboard', tone: 'neutral', title: t('me.data'), sub: t('me.stats', { attempts: attempts, certs: certs }), id: 'me-stats' }),
          ui.row({ icon: 'chart', tone: 'blue', title: t('home.dashboard'), href: '#/dashboard', id: 'me-dashboard' }),
          ui.row({ icon: 'grid', tone: 'purple', title: t('home.manage'), href: '#/manage', id: 'me-manage' })),
        h('p', { class: 'demo-note' }, t('profile.privacy'))
      ]),

      ui.section({ title: t('me.about') },
        h('p', { class: 'demo-note' }, t('app.name') + ' · SurakshaAR · ' + t('me.version')))
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
