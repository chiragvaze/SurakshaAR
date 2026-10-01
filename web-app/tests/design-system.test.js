/*
 * Suraksha Drishti design system: theme preferences, icons and component primitives.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load, memoryStorage } = require('./helpers/load');
const dom = require('./helpers/fakedom');

const SA = load();
dom.install();
['js/services/prefs.js', 'js/components/dom.js', 'js/components/icons.js', 'js/components/ui.js']
  .forEach((f) => require(path.join(__dirname, '..', f)));

const ROOT = path.join(__dirname, '..');
const text = (n) => (n ? n.textContent : '');

test('theme: light is the default, dark persists under sa_ui_v1, garbage is ignored', () => {
  const ls = memoryStorage();
  assert.equal(SA.prefs.init(ls).theme, 'light');
  SA.prefs.setTheme('dark');
  assert.equal(JSON.parse(ls.getItem('sa_ui_v1')).theme, 'dark');
  assert.equal(SA.prefs.init(ls).theme, 'dark', 'reload keeps the choice');
  SA.prefs.toggleTheme();
  assert.equal(SA.prefs.theme(), 'light');
  assert.throws(() => SA.prefs.setTheme('auto'), /PREFS_BAD_THEME/);
  assert.equal(SA.prefs.init(memoryStorage({ sa_ui_v1: '{"theme":"neon","effects":"ultra"}' })).theme, 'light');
  assert.equal(SA.prefs.init(memoryStorage({ sa_ui_v1: 'not json' })).theme, 'light');
  assert.equal(SA.prefs.init(null).theme, 'light', 'no storage: still works in memory');
});

test('theme: the device dark-mode preference is not followed (light stays default)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/services/prefs.js'), 'utf8');
  assert.ok(!/prefers-color-scheme/.test(src));
  const tokens = fs.readFileSync(path.join(ROOT, 'css/tokens.css'), 'utf8');
  assert.ok(!/prefers-color-scheme/.test(tokens));
  assert.match(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /data-theme="light"/);
});

test('effects: reduced (no blur) can be chosen and persists; tokens define the fallback', () => {
  const ls = memoryStorage();
  SA.prefs.init(ls);
  SA.prefs.setEffects('reduced');
  assert.equal(SA.prefs.init(ls).effects, 'reduced');
  assert.equal(SA.prefs.effects(), 'reduced');
  assert.throws(() => SA.prefs.setEffects('max'), /PREFS_BAD_EFFECTS/);
  const tokens = fs.readFileSync(path.join(ROOT, 'css/tokens.css'), 'utf8');
  assert.match(tokens, /html\[data-effects="reduced"\][^}]*--glass-filter: none/);
  assert.match(tokens, /@supports not/);
});

test('design tokens: light and dark themes define the same token set', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/tokens.css'), 'utf8');
  const block = (sel) => css.slice(css.indexOf(sel), css.indexOf('}', css.indexOf(sel)));
  const names = (b) => [...b.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]).sort();
  assert.deepEqual(names(block('html[data-theme="dark"]')), names(block('html[data-theme="light"]')));
  for (const t of ['--color-bg', '--color-surface', '--color-surface-glass', '--color-text', '--color-text-secondary', '--color-border', '--color-primary', '--color-success', '--color-warning', '--color-danger']) {
    assert.ok(names(block('html[data-theme="light"]')).includes(t), t);
  }
  for (const t of ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--shadow-sm', '--shadow-md', '--shadow-lg', '--blur-sm', '--blur-md', '--blur-lg']) {
    assert.ok(css.includes(t + ':'), t);
  }
});

test('component CSS uses tokens: no hard-coded hex colours outside tokens.css', () => {
  for (const f of ['base.css', 'components.css']) {
    const css = fs.readFileSync(path.join(ROOT, 'css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const hex = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).filter((x) => x.toLowerCase() !== '#fff');
    assert.deepEqual(hex, [], f);
  }
});

test('icons: every icon renders an aria-hidden SVG; unknown names fall back safely', () => {
  for (const name of SA.icons.names) {
    const svg = SA.icons.icon(name);
    assert.equal(svg.tagName, 'SVG', name);
    assert.equal(svg.getAttribute('aria-hidden'), 'true', name);
    assert.ok(svg.children.length > 0, name);
  }
  assert.ok(SA.icons.icon('does-not-exist').children.length > 0);
  const labelled = SA.icons.icon('flame', { label: 'Fire' });
  assert.equal(labelled.getAttribute('role'), 'img');
  assert.equal(labelled.getAttribute('aria-label'), 'Fire');
});

test('components: ring, metric, badge, segmented and empty state render accessible text', () => {
  const ui = SA.ui;
  const r = ui.ring({ value: 86, label: 'Score 86%', center: '86%' });
  assert.equal(r.getAttribute('role'), 'img');
  assert.equal(r.getAttribute('aria-label'), 'Score 86%');
  const m = ui.metric({ id: 'm1', value: 9, label: 'Workers', icon: 'users' });
  assert.match(text(m), /^9Workers/, 'value first, label second');
  const b = ui.badge('VERIFIED', 'success', 'checkCircle');
  assert.ok(b.className.includes('badge--success') && text(b) === 'VERIFIED', 'status uses text, not colour alone');
  let picked = null;
  const seg = ui.segmented({ label: 'Theme', value: 'light', options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], onChange: (v) => { picked = v; } });
  const dark = dom.findAll(seg, (n) => n.getAttribute('data-value') === 'dark')[0];
  assert.equal(dark.getAttribute('aria-pressed'), 'false');
  dark.click();
  assert.equal(picked, 'dark');
  assert.equal(dom.findAll(seg, (n) => n.getAttribute('data-value') === 'dark')[0].getAttribute('aria-pressed'), 'true');
  const e = ui.empty({ icon: 'users', title: 'No workers yet', text: 'Your worker list will appear here.' });
  assert.ok(text(e).includes('No workers yet'));
  const bar = ui.bar('Fire', 3, 9, 'fire', '3 of 9');
  const fill = dom.byClass(bar, 'hbar__fill')[0];
  assert.equal(fill.style.width, '33%');
  assert.equal(fill.getAttribute('data-pct'), '33');
});

test('bottom navigation: five tabs, the active one is marked, centre action starts training', () => {
  const ctx = { t: SA.i18n.t, lang: 'hi' };
  const nav = SA.ui.tabBar(ctx, 'home');
  const tabs = dom.findAll(nav, (n) => (n.getAttribute('id') || '').startsWith('tab-'));
  assert.deepEqual(tabs.map((n) => n.getAttribute('href')), ['#/home', '#/verify', '#/train', '#/certificate', '#/me']);
  assert.equal(tabs[0].getAttribute('aria-current'), 'page');
  assert.ok(tabs[2].className.includes('tabbar__item--primary'));
});
