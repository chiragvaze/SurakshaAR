/*
 * Reusable UI pieces: app bar, page shell, buttons, notices, status badges, toast.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;

  var LANG_SHORT = { hi: 'हि', sat: 'SAT', en: 'EN' };
  var STATUS_ICON = { green: '✓', amber: '!', red: '✕' };

  function appBar(ctx, opts) {
    opts = opts || {};
    var t = ctx.t;
    var here = encodeURIComponent(root.location.hash || '#/home');
    return h('header', { class: 'appbar' },
      opts.back
        ? h('a', { class: 'appbar__back', href: opts.back, 'aria-label': t('nav.back') }, h('span', { 'aria-hidden': 'true' }, '←'), ' ', t('nav.back'))
        : h('span', { class: 'appbar__brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }), t('app.name')),
      h('a', { class: 'appbar__lang', href: '#/language?next=' + here, 'aria-label': t('nav.language') },
        h('span', { 'aria-hidden': 'true' }, '文A '), LANG_SHORT[ctx.lang] || 'EN')
    );
  }

  /** Standard screen: app bar + <main> with an h1 that receives focus on navigation. */
  function page(ctx, opts, children) {
    return h('div', { class: 'screen' + (opts.wide ? ' screen--wide' : '') },
      opts.noBar ? null : appBar(ctx, opts),
      h('main', { class: 'page', id: 'main' }, children)
    );
  }

  function title(text, sub) {
    return [h('h1', { class: 'page__title', tabindex: '-1' }, text), sub ? h('p', { class: 'page__sub' }, sub) : null];
  }

  function btn(label, opts) {
    opts = opts || {};
    var cls = 'btn btn--' + (opts.variant || 'primary') + (opts.block === false ? '' : ' btn--block');
    if (opts.href) return h('a', { class: cls, href: opts.href, id: opts.id }, label);
    return h('button', { type: opts.type || 'button', class: cls, onClick: opts.onClick, disabled: opts.disabled, id: opts.id }, label);
  }

  function notice(text, kind) {
    kind = kind || 'info';
    return h('div', { class: 'notice notice--' + kind, role: kind === 'error' ? 'alert' : 'status' }, text);
  }

  function statusBadge(t, status) {
    return h('span', { class: 'badge badge--' + status },
      h('span', { class: 'badge__icon', 'aria-hidden': 'true' }, STATUS_ICON[status] || ''), t('risk.' + status));
  }

  function refresherBadge(t, due) {
    return due
      ? h('span', { class: 'badge badge--red' }, h('span', { class: 'badge__icon', 'aria-hidden': 'true' }, '⏰'), t('dash.refresher.due'))
      : h('span', { class: 'badge badge--green' }, h('span', { class: 'badge__icon', 'aria-hidden': 'true' }, '✓'), t('dash.refresher.ok'));
  }

  function moduleTitle(moduleId, lang) {
    var scenario = SA.scenario.get(moduleId);
    return scenario ? SA.i18n.pick(scenario.title, lang) : moduleId;
  }

  var toastTimer = null;
  function toast(text, kind) {
    var el = root.document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.className = 'toast toast--' + (kind || 'info') + ' is-visible';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 5000);
  }

  SA.ui = {
    appBar: appBar,
    page: page,
    title: title,
    btn: btn,
    notice: notice,
    statusBadge: statusBadge,
    refresherBadge: refresherBadge,
    moduleTitle: moduleTitle,
    toast: toast
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
