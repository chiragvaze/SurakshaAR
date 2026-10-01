/*
 * Suraksha Drishti component library (presentation only; no business logic here).
 *
 *   Shell:      page, appBar, tabBar, title, section
 *   Primitives: btn (Primary/Secondary/Ghost/Danger/Glass), iconButton, card (GlassCard), row,
 *               badge (StatusBadge), statusBadge, refresherBadge, chip, notice, avatar
 *   Data:       ring (ProgressRing), metric (MetricCard), bar, stepper
 *   Feedback:   toast, sheet (BottomSheet / Modal), skeleton, empty (EmptyState), errorState
 *   Controls:   segmented, themeToggle, offlinePill
 *
 * All text goes through textContent (SA.dom.h); icons are inline SVG (SA.icons).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;

  var LANG_SHORT = { hi: 'हि', sat: 'SAT', en: 'EN' };
  var STATUS_ICON = { green: 'checkCircle', amber: 'alert', red: 'xCircle' };
  var STATUS_TONE = { green: 'success', amber: 'warning', red: 'danger' };

  function icon(name, opts) { return SA.icons.icon(name, opts); }

  // ------------------------------------------------------------------ shell

  function brandMark(size) {
    return h('span', { class: 'brand-mark' + (size ? ' brand-mark--' + size : ''), 'aria-hidden': 'true' },
      icon('shieldCheck', { size: size === 'lg' ? 40 : 18, stroke: 2.2 }));
  }

  function themeIconButton(t) {
    var dark = SA.prefs && SA.prefs.theme() === 'dark';
    var btnEl = h('button', {
      type: 'button', class: 'icon-btn icon-btn--glass', id: 'theme-toggle',
      'aria-label': dark ? t('theme.toLight') : t('theme.toDark'),
      onClick: function () {
        SA.prefs.toggleTheme();
        var nowDark = SA.prefs.theme() === 'dark';
        btnEl.replaceChildren(icon(nowDark ? 'sun' : 'moon'));
        btnEl.setAttribute('aria-label', nowDark ? t('theme.toLight') : t('theme.toDark'));
      }
    }, icon(dark ? 'sun' : 'moon'));
    return btnEl;
  }

  /** Notifications bell with a count of local reminders (only when that screen exists). */
  function bell(ctx) {
    if (!SA.screens || !SA.screens.alerts || !SA.insights || !ctx.state || !ctx.state.worker) return null;
    var n = SA.insights.alerts(ctx.state).length;
    return h('a', { class: 'icon-btn icon-btn--glass appbar__bell', href: '#/alerts', id: 'appbar-alerts', 'aria-label': ctx.t('alerts.title') + (n ? ' (' + n + ')' : '') },
      icon('bell'), n ? h('span', { class: 'appbar__bell-dot', 'aria-hidden': 'true' }, String(n)) : null);
  }

  function appBar(ctx, opts) {
    opts = opts || {};
    var t = ctx.t;
    var here = encodeURIComponent(root.location.hash || '#/home');
    var left = opts.back
      ? h('a', { class: 'appbar__back', href: opts.back, 'aria-label': t('nav.back') }, icon('back', { size: 20 }), h('span', { class: 'appbar__back-label' }, t('nav.back')))
      : h('span', { class: 'appbar__brand' }, brandMark(), h('span', { class: 'appbar__name' }, t('app.name')));
    return h('header', { class: 'appbar' },
      left,
      opts.barTitle ? h('span', { class: 'appbar__title' }, opts.barTitle) : null,
      h('div', { class: 'appbar__actions' },
        opts.tab ? bell(ctx) : null,
        h('a', { class: 'chip chip--glass appbar__lang', href: '#/language?next=' + here, 'aria-label': t('nav.language') },
          icon('language', { size: 16 }), h('span', null, LANG_SHORT[ctx.lang] || 'EN')),
        themeIconButton(t))
    );
  }

  var TABS = [
    { id: 'home', href: '#/home', icon: 'home' },
    { id: 'verify', href: '#/verify', icon: 'scan' },
    { id: 'train', href: '#/train', icon: 'play', primary: true },
    { id: 'passport', href: '#/certificate', icon: 'passport' },
    { id: 'me', href: '#/me', icon: 'user' }
  ];

  /** Bottom NavigationBar (worker app). The centre action starts training. */
  function tabBar(ctx, active) {
    var t = ctx.t;
    return h('nav', { class: 'tabbar', 'aria-label': t('tab.label') },
      TABS.map(function (tab) {
        var on = tab.id === active;
        return h('a', {
          class: 'tabbar__item' + (tab.primary ? ' tabbar__item--primary' : '') + (on ? ' is-active' : ''),
          href: tab.href, id: 'tab-' + tab.id, 'aria-current': on ? 'page' : null
        },
        h('span', { class: 'tabbar__icon' }, icon(tab.icon, { size: tab.primary ? 26 : 22, stroke: tab.primary ? 2.2 : 2 })),
        h('span', { class: 'tabbar__label' }, t('tab.' + tab.id)));
      }));
  }

  /** Standard screen: app bar + <main> (h1 receives focus) + optional bottom tab bar. */
  function page(ctx, opts, children) {
    opts = opts || {};
    return h('div', { class: 'screen' + (opts.wide ? ' screen--wide' : '') + (opts.tab ? ' has-tabbar' : '') + (opts.cls ? ' ' + opts.cls : '') },
      opts.noBar ? null : appBar(ctx, opts),
      h('main', { class: 'page', id: 'main' }, children),
      opts.tab ? tabBar(ctx, opts.tab) : null
    );
  }

  function title(text, sub, opts) {
    opts = opts || {};
    return h('div', { class: 'page-head' + (opts.cls ? ' ' + opts.cls : '') },
      opts.eyebrow ? h('p', { class: 'eyebrow' }, opts.eyebrow) : null,
      h('h1', { class: 'page__title', tabindex: '-1' }, text),
      sub ? h('p', { class: 'page__sub' }, sub) : null);
  }

  /** Section with a heading and optional trailing link. */
  function section(opts, children) {
    opts = opts || {};
    var hid = opts.id ? opts.id + '-h' : null;
    return h('section', { class: 'section' + (opts.cls ? ' ' + opts.cls : ''), id: opts.id, 'aria-labelledby': hid },
      opts.title ? h('div', { class: 'section__head' },
        h('h2', { class: 'section-title', id: hid }, opts.title),
        opts.action ? h('a', { class: 'section__action', href: opts.action.href, id: opts.action.id }, opts.action.label, icon('chevronRight', { size: 16 })) : null) : null,
      children);
  }

  // ------------------------------------------------------------------ primitives

  function btn(label, opts) {
    opts = opts || {};
    var cls = 'btn btn--' + (opts.variant || 'primary') + (opts.block === false ? '' : ' btn--block') + (opts.size ? ' btn--' + opts.size : '') + (opts.cls ? ' ' + opts.cls : '');
    var content = [opts.icon ? icon(opts.icon, { size: opts.size === 'sm' ? 16 : 20 }) : null, h('span', { class: 'btn__label' }, label)];
    if (opts.href) return h('a', { class: cls, href: opts.href, id: opts.id, role: opts.role }, content);
    return h('button', { type: opts.type || 'button', class: cls, onClick: opts.onClick, disabled: opts.disabled, id: opts.id, 'aria-label': opts.ariaLabel }, content);
  }

  function iconButton(name, label, opts) {
    opts = opts || {};
    var cls = 'icon-btn' + (opts.variant ? ' icon-btn--' + opts.variant : '');
    if (opts.href) return h('a', { class: cls, href: opts.href, 'aria-label': label, id: opts.id }, icon(name));
    return h('button', { type: 'button', class: cls, 'aria-label': label, onClick: opts.onClick, id: opts.id, disabled: opts.disabled }, icon(name));
  }

  /** GlassCard. opts: {glass, href, id, cls, tone, attrs} */
  function card(opts, children) {
    opts = opts || {};
    var cls = 'gcard' + (opts.glass ? ' gcard--glass' : '') + (opts.href || opts.onClick ? ' gcard--interactive' : '') + (opts.tone ? ' gcard--' + opts.tone : '') + (opts.cls ? ' ' + opts.cls : '');
    var props = Object.assign({ class: cls, id: opts.id }, opts.attrs || {});
    if (opts.href) { props.href = opts.href; return h('a', props, children); }
    if (opts.onClick) { props.type = 'button'; props.onClick = opts.onClick; return h('button', props, children); }
    return h(opts.tag || 'div', props, children);
  }

  /** List row: leading icon tile, title/sub, trailing content or chevron. */
  function row(opts) {
    var lead = opts.icon ? h('span', { class: 'row__icon tone-' + (opts.tone || 'primary') }, icon(opts.icon, { size: 20 })) : (opts.lead || null);
    var body = h('span', { class: 'row__body' },
      h('span', { class: 'row__title' }, opts.title),
      opts.sub ? h('span', { class: 'row__sub' }, opts.sub) : null);
    var trail = opts.trailing !== undefined ? opts.trailing : (opts.href || opts.onClick ? h('span', { class: 'row__chev' }, icon('chevronRight', { size: 18 })) : null);
    var cls = 'row' + (opts.href || opts.onClick ? ' row--interactive' : '') + (opts.cls ? ' ' + opts.cls : '');
    if (opts.href) return h('a', { class: cls, href: opts.href, id: opts.id }, lead, body, trail);
    if (opts.onClick) return h('button', { type: 'button', class: cls, onClick: opts.onClick, id: opts.id }, lead, body, trail);
    return h('div', { class: cls, id: opts.id }, lead, body, trail);
  }

  /** StatusBadge: tone = success | warning | danger | primary | neutral; always text + icon. */
  function badge(label, tone, iconName, opts) {
    opts = opts || {};
    return h('span', { class: 'badge badge--' + (tone || 'neutral') + (opts.solid ? ' badge--solid' : ''), id: opts.id },
      iconName ? icon(iconName, { size: 14, stroke: 2.4 }) : null, h('span', null, label));
  }

  function statusBadge(t, status) {
    return h('span', { class: 'badge badge--' + status + ' badge--' + (STATUS_TONE[status] || 'neutral') },
      h('span', { class: 'badge__icon' }, icon(STATUS_ICON[status] || 'dot', { size: 14, stroke: 2.4 })), h('span', null, t('risk.' + status)));
  }

  function refresherBadge(t, due) {
    return due
      ? h('span', { class: 'badge badge--red badge--danger' }, h('span', { class: 'badge__icon' }, icon('clock', { size: 14, stroke: 2.4 })), h('span', null, t('dash.refresher.due')))
      : h('span', { class: 'badge badge--green badge--success' }, h('span', { class: 'badge__icon' }, icon('check', { size: 14, stroke: 2.4 })), h('span', null, t('dash.refresher.ok')));
  }

  function chip(label, opts) {
    opts = opts || {};
    return h('span', { class: 'chip' + (opts.tone ? ' chip--' + opts.tone : ''), id: opts.id }, opts.icon ? icon(opts.icon, { size: 14 }) : null, h('span', null, label));
  }

  function notice(text, kind, opts) {
    kind = kind || 'info';
    opts = opts || {};
    var ic = { info: 'info', error: 'alert', success: 'checkCircle', warning: 'alert' }[kind] || 'info';
    return h('div', { class: 'notice notice--' + kind, role: kind === 'error' ? 'alert' : 'status', id: opts.id },
      h('span', { class: 'notice__icon' }, icon(ic, { size: 18 })), h('span', { class: 'notice__text' }, text));
  }

  var AVATAR_TONES = 5;
  function avatar(name, opts) {
    opts = opts || {};
    var parts = String(name || '?').trim().split(/\s+/);
    var initials = (parts[0] ? parts[0].charAt(0) : '?') + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '');
    var hash = 0;
    String(opts.seed || name || '').split('').forEach(function (c) { hash = (hash * 31 + c.charCodeAt(0)) >>> 0; });
    return h('span', { class: 'avatar avatar--' + (opts.size || 'md') + ' avatar--t' + (hash % AVATAR_TONES), 'aria-hidden': 'true' }, initials.toUpperCase());
  }

  // ------------------------------------------------------------------ data display

  /**
   * ProgressRing. opts: {value 0..max, max=100, size=120, stroke=10, tone, label, center, id}
   * The arc animates in with CSS (custom property set via CSSOM — CSP-safe).
   */
  function ring(opts) {
    var NS = 'http://www.w3.org/2000/svg';
    var size = opts.size || 120;
    var stroke = opts.stroke || 10;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var max = opts.max || 100;
    var p = Math.max(0, Math.min(1, (opts.value || 0) / max));
    function s(tag, attrs) {
      var e = root.document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, String(attrs[k])); });
      return e;
    }
    var svg = s('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, class: 'ring__svg', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(s('circle', { cx: size / 2, cy: size / 2, r: r, 'stroke-width': stroke, class: 'ring__track', fill: 'none' }));
    var arc = s('circle', {
      cx: size / 2, cy: size / 2, r: r, 'stroke-width': stroke, fill: 'none', 'stroke-linecap': 'round',
      class: 'ring__arc', 'stroke-dasharray': c.toFixed(2), 'stroke-dashoffset': (c * (1 - p)).toFixed(2),
      transform: 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'
    });
    if (arc.style && arc.style.setProperty) arc.style.setProperty('--ring-c', c.toFixed(2));
    svg.appendChild(arc);
    var box = h('div', { class: 'ring ring--' + (opts.tone || 'primary'), role: 'img', 'aria-label': opts.label, id: opts.id, 'data-value': String(opts.value) },
      svg, h('div', { class: 'ring__center' }, opts.center));
    if (box.style && box.style.setProperty) box.style.setProperty('--ring-size', size + 'px');
    return box;
  }

  /** MetricCard: value first in DOM order (tests and screen readers read "9 Total workers"). */
  function metric(opts) {
    return h('div', { class: 'metric' + (opts.tone ? ' metric--' + opts.tone : '') + (opts.cls ? ' ' + opts.cls : ''), id: opts.id },
      h('span', { class: 'metric__value' }, opts.value === null || opts.value === undefined ? '—' : String(opts.value), opts.unit ? h('span', { class: 'metric__unit' }, opts.unit) : null),
      h('span', { class: 'metric__label' }, opts.label),
      opts.sub ? h('span', { class: 'metric__sub' }, opts.sub) : null,
      opts.icon ? h('span', { class: 'metric__icon tone-' + (opts.tone || 'primary') }, icon(opts.icon, { size: 18 })) : null);
  }

  /** Horizontal bar with the value as text (never colour alone). */
  function bar(label, n, total, tone, valueText) {
    var p = total ? Math.round(100 * n / total) : 0;
    var fill = h('span', { class: 'hbar__fill tone-' + (tone || 'primary'), 'data-pct': String(p) });
    fill.style.width = p + '%'; // CSSOM, not a style attribute (strict CSP)
    return h('div', { class: 'hbar' },
      h('span', { class: 'hbar__label' }, label),
      h('span', { class: 'hbar__track', role: 'img', 'aria-label': label + ': ' + (valueText || n) }, fill),
      h('span', { class: 'hbar__value' }, valueText || String(n)));
  }

  /** LEARN → FIND → PROVE stepper. steps: [{label, sub}], current index, done count. */
  function stepper(steps, current, opts) {
    opts = opts || {};
    return h('ol', { class: 'stepper', 'aria-label': opts.label, id: opts.id },
      steps.map(function (s, i) {
        var state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return h('li', { class: 'stepper__item is-' + state, 'aria-current': state === 'current' ? 'step' : null },
          h('span', { class: 'stepper__dot' }, state === 'done' ? icon('check', { size: 14, stroke: 3 }) : String(i + 1)),
          h('span', { class: 'stepper__label' }, s.label),
          s.sub ? h('span', { class: 'stepper__sub' }, s.sub) : null);
      }));
  }

  // ------------------------------------------------------------------ feedback

  var toastTimer = null;
  function toast(text, kind) {
    var el = root.document.getElementById('toast');
    if (!el) return;
    var ic = kind === 'error' ? 'alert' : kind === 'success' ? 'checkCircle' : 'info';
    el.replaceChildren(h('span', { class: 'toast__icon' }, icon(ic, { size: 18 })), h('span', { class: 'toast__text' }, text));
    el.className = 'toast toast--' + (kind || 'info') + ' is-visible';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 5000);
  }

  /**
   * BottomSheet on phones, centred Modal on wide screens. Returns {close}.
   * opts: {title, sub, content, actions: [nodes], tone, id, onClose, dismissible=true}
   */
  function sheet(opts) {
    var doc = root.document;
    var prevFocus = doc.activeElement;
    var overlay;
    function close() {
      if (!overlay) return;
      doc.removeEventListener('keydown', onKey);
      overlay.classList.add('is-closing');
      var o = overlay;
      overlay = null;
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 200);
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) { /* gone */ } }
      if (opts.onClose) opts.onClose();
    }
    function onKey(ev) { if (ev.key === 'Escape' && opts.dismissible !== false) close(); }
    var titleId = (opts.id || 'sheet') + '-title';
    var panel = h('div', { class: 'sheet' + (opts.tone ? ' sheet--' + opts.tone : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, id: opts.id },
      h('span', { class: 'sheet__grabber', 'aria-hidden': 'true' }),
      h('div', { class: 'sheet__head' },
        h('h2', { class: 'sheet__title', id: titleId, tabindex: '-1' }, opts.title),
        opts.dismissible === false ? null : iconButton('x', SA.i18n ? SA.i18n.t('common.close') : 'Close', { onClick: close, variant: 'ghost', id: (opts.id || 'sheet') + '-close' })),
      opts.sub ? h('p', { class: 'sheet__sub' }, opts.sub) : null,
      h('div', { class: 'sheet__body' }, opts.content),
      opts.actions ? h('div', { class: 'sheet__actions' }, opts.actions) : null);
    overlay = h('div', { class: 'sheet-overlay', onClick: function (ev) { if (ev.target === overlay && opts.dismissible !== false) close(); } }, panel);
    doc.body.appendChild(overlay);
    doc.addEventListener('keydown', onKey);
    var tEl = panel.querySelector('#' + titleId);
    if (tEl) tEl.focus();
    return { close: close, el: panel };
  }

  /** Remove any open sheet (called by the router on every navigation). */
  function closeSheets() {
    var doc = root.document;
    if (!doc || !doc.querySelectorAll) return;
    Array.prototype.forEach.call(doc.querySelectorAll('.sheet-overlay'), function (o) { if (o.parentNode) o.parentNode.removeChild(o); });
  }

  /** Skeleton loader shaped like the final card. kind: card | row | metric */
  function skeleton(kind, count) {
    var n = count || 1;
    var items = [];
    for (var i = 0; i < n; i++) {
      items.push(h('div', { class: 'skeleton skeleton--' + (kind || 'card'), 'aria-hidden': 'true' },
        h('span', { class: 'skeleton__line skeleton__line--lg' }), h('span', { class: 'skeleton__line' }), h('span', { class: 'skeleton__line skeleton__line--sm' })));
    }
    return h('div', { class: 'skeleton-group', role: 'status', 'aria-label': SA.i18n ? SA.i18n.t('common.loading') : 'Loading' }, items);
  }

  function empty(opts) {
    return h('div', { class: 'empty', id: opts.id },
      h('span', { class: 'empty__icon' }, icon(opts.icon || 'info', { size: 28 })),
      h('p', { class: 'empty__title' }, opts.title),
      opts.text ? h('p', { class: 'empty__text' }, opts.text) : null,
      opts.action || null);
  }

  function errorState(opts) {
    return h('div', { class: 'empty empty--error', role: 'alert', id: opts.id },
      h('span', { class: 'empty__icon' }, icon('alert', { size: 28 })),
      h('p', { class: 'empty__title' }, opts.title),
      opts.text ? h('p', { class: 'empty__text' }, opts.text) : null,
      opts.onRetry ? btn(opts.retryLabel, { onClick: opts.onRetry, variant: 'secondary', block: false, icon: 'refresh' }) : null);
  }

  // ------------------------------------------------------------------ controls

  /** Segmented control. options: [{value, label, icon}] */
  function segmented(opts) {
    var group = h('div', { class: 'segmented' + (opts.cls ? ' ' + opts.cls : ''), role: 'group', 'aria-label': opts.label, id: opts.id });
    function paint(value) {
      group.replaceChildren.apply(group, opts.options.map(function (o) {
        var on = o.value === value;
        return h('button', {
          type: 'button', class: 'segmented__opt' + (on ? ' is-on' : ''), 'aria-pressed': on ? 'true' : 'false', 'data-value': o.value, id: o.id,
          onClick: function () { if (o.value === value) return; paint(o.value); if (opts.onChange) opts.onChange(o.value); }
        }, o.icon ? icon(o.icon, { size: 16 }) : null, h('span', null, o.label));
      }));
    }
    paint(opts.value);
    return group;
  }

  /** ThemeToggle: ☀ Light (default) / ◐ Dark, persisted by SA.prefs. */
  function themeToggle(t, opts) {
    opts = opts || {};
    return segmented({
      label: t('theme.title'), id: opts.id || 'theme-segmented', value: SA.prefs.theme(), cls: 'segmented--theme',
      options: [{ value: 'light', label: t('theme.light'), icon: 'sun', id: 'theme-light' }, { value: 'dark', label: t('theme.dark'), icon: 'moon', id: 'theme-dark' }],
      onChange: function (v) { SA.prefs.setTheme(v); }
    });
  }

  function offlinePill(t) {
    return h('span', { class: 'offline-pill', id: 'offline-pill' }, h('span', { class: 'offline-pill__dot', 'aria-hidden': 'true' }), t('offline.badge'));
  }

  function moduleTitle(moduleId, lang) {
    var scenario = SA.scenario.get(moduleId);
    return scenario ? SA.i18n.pick(scenario.title, lang) : moduleId;
  }

  SA.ui = {
    icon: icon,
    brandMark: brandMark,
    appBar: appBar,
    tabBar: tabBar,
    page: page,
    title: title,
    section: section,
    btn: btn,
    iconButton: iconButton,
    card: card,
    row: row,
    badge: badge,
    statusBadge: statusBadge,
    refresherBadge: refresherBadge,
    chip: chip,
    notice: notice,
    avatar: avatar,
    ring: ring,
    metric: metric,
    bar: bar,
    stepper: stepper,
    toast: toast,
    sheet: sheet,
    closeSheets: closeSheets,
    skeleton: skeleton,
    empty: empty,
    errorState: errorState,
    segmented: segmented,
    themeToggle: themeToggle,
    offlinePill: offlinePill,
    moduleTitle: moduleTitle
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
