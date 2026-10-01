/*
 * PPE Check (#/ppe): manual self-check — camera / TensorFlow Lite detection is NOT part of
 * this build, and the screen says so. Each item is Wearing / Missing / Not sure.
 * "Not sure" is the low-confidence path: it is never an automatic fail; the check goes to
 * the trainer review queue (management Trainer Mode) on this device.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  var h = SA.dom.h;
  var ui = SA.ui;
  SA.screens = SA.screens || {};

  var ITEM_ICON = { helmet: 'helmet', vest: 'vest', gloves: 'glove', shoes: 'boots', goggles: 'goggles' };
  var OUTCOME = {
    ready: { tone: 'success', icon: 'checkCircle', title: 'ppe.result.ready', text: 'ppe.result.readyText' },
    missing: { tone: 'danger', icon: 'xCircle', title: 'ppe.result.missing', text: 'ppe.result.missingText' },
    review: { tone: 'warning', icon: 'eye', title: 'ppe.result.review', text: 'ppe.result.reviewText' }
  };

  function outcomeBadge(t, p) {
    var o = OUTCOME[p.outcome];
    var label = t(o.title);
    if (p.review) label += ' · ' + (p.review.decision === 'approved' ? '✓' : '✕');
    return ui.badge(label, o.tone, o.icon);
  }

  function resultCard(t, rec) {
    var o = OUTCOME[rec.outcome];
    var missing = SA.safety.PPE_ITEMS.filter(function (k) { return rec.items[k] === 'no'; }).length;
    return h('section', { class: 'gcard ppe-result ppe-result--' + rec.outcome, id: 'ppe-result', role: 'status' },
      h('span', { class: 'ppe-result__icon tone-' + o.tone }, ui.icon(o.icon, { size: 28 })),
      h('h2', { class: 'ppe-result__title', id: 'ppe-result-title', tabindex: '-1' }, t(o.title)),
      h('p', { class: 'ppe-result__text' }, t(o.text, { n: missing })));
  }

  SA.screens.ppe = function (ctx) {
    var t = ctx.t;
    var w = ctx.state.worker;
    var choices = {};
    var err = h('p', { class: 'field__error', id: 'ppe-error', hidden: true });
    var out = h('div', { id: 'ppe-out', 'aria-live': 'polite' });

    var items = SA.safety.PPE_ITEMS.map(function (k) {
      return h('div', { class: 'ppe-item', 'data-item': k },
        h('div', { class: 'ppe-item__head' },
          h('span', { class: 'ppe-item__icon tone-teal' }, ui.icon(ITEM_ICON[k], { size: 22 })),
          h('span', { class: 'ppe-item__label', id: 'ppe-label-' + k }, t('ppe.item.' + k))),
        ui.segmented({
          label: t('ppe.item.' + k), id: 'ppe-' + k, cls: 'segmented--block ppe-seg',
          options: [
            { value: 'yes', label: t('ppe.state.yes'), icon: 'check', id: 'ppe-' + k + '-yes' },
            { value: 'no', label: t('ppe.state.no'), icon: 'x', id: 'ppe-' + k + '-no' },
            { value: 'unsure', label: t('ppe.state.unsure'), icon: 'eye', id: 'ppe-' + k + '-unsure' }
          ],
          onChange: function (v) { choices[k] = v; err.hidden = true; }
        }));
    });

    function save() {
      var missingChoice = SA.safety.PPE_ITEMS.filter(function (k) { return !choices[k]; });
      if (missingChoice.length) { err.hidden = false; err.textContent = t('ppe.incomplete'); return; }
      var rec = SA.safety.addPpe(w.id, choices, SA.clock.now(ctx.store.get()));
      out.replaceChildren(resultCard(t, rec));
      var title = out.querySelector && out.querySelector('#ppe-result-title');
      if (title) title.focus();
      if (root.navigator && root.navigator.vibrate) { try { root.navigator.vibrate(rec.outcome === 'ready' ? 20 : [40, 60, 40]); } catch (e) { /* no haptics */ } }
    }

    var history = SA.safety.get().ppe.filter(function (p) { return p.workerId === w.id; }).slice(-3).reverse();

    return ui.page(ctx, { back: '#/home' }, [
      h('div', { class: 'module-head' },
        h('span', { class: 'module-head__icon tone-teal', 'aria-hidden': 'true' }, ui.icon('helmet', { size: 28, stroke: 1.8 })),
        h('div', { class: 'module-head__text' },
          h('h1', { class: 'page__title', tabindex: '-1' }, t('ppe.title')),
          h('p', { class: 'page__sub' }, t('ppe.sub')))),
      ui.notice(t('ppe.selfNote'), 'info', { id: 'ppe-note' }),
      h('div', { class: 'ppe-list', id: 'ppe-items' }, items),
      err,
      ui.btn(t('ppe.confirm'), { onClick: save, id: 'ppe-save', icon: 'shieldCheck' }),
      out,
      history.length ? ui.section({ title: t('ppe.history') },
        h('div', { class: 'list', id: 'ppe-history' }, history.map(function (p) {
          return ui.row({ icon: 'clipboard', tone: OUTCOME[p.outcome].tone, title: t('ppe.last', { date: SA.i18n.formatDate(p.ms, ctx.lang) }), trailing: outcomeBadge(t, p) });
        }))) : null
    ]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
