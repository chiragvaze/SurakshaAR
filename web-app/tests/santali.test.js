/*
 * Santali (sat) localisation and offline Santali voice (docs/SANTALI_LOCALIZATION.md).
 * Santali text is a provisional draft; these tests enforce coverage, honesty of the review
 * status, the Hindi-reference safeguard and the "no fake voice" rule.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { load, memoryStorage, play } = require('./helpers/load');
const dom = require('./helpers/fakedom');

const SA = load();
dom.install();
[
  'js/services/prefs.js', 'js/i18n/mgmt-strings.js', 'js/services/management.js', 'js/services/safety.js', 'js/services/insights.js',
  'js/components/dom.js', 'js/components/icons.js', 'js/components/ui.js',
  'js/screens/onboarding.js', 'js/screens/home.js', 'js/screens/me.js', 'js/screens/train.js', 'js/screens/training.js',
  'js/screens/certificate.js', 'js/screens/management.js', 'js/screens/management-pages.js'
].forEach((f) => require(path.join(__dirname, '..', f)));

const ROOT = path.join(__dirname, '..');
const S = SA.STRINGS;
const OLCHIKI = /[᱐-᱿]/;
const DEVANAGARI = /[ऀ-ॿ]/;
const text = (n) => (n ? n.textContent : '');
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
const OK3 = ['correct', 'correct', 'correct'];

function setup(lang, opts = {}) {
  SA.store.init(memoryStorage());
  SA.management.init(memoryStorage());
  SA.safety.init(memoryStorage());
  SA.store.update((s) => { s.settings.language = lang; s.worker = { id: 'JH-2001', name: opts.name || 'Ramesh Kumar' }; });
  SA.i18n.setLanguage(lang);
}

function ctx(param) {
  const lang = SA.store.get().settings.language;
  return {
    t: SA.i18n.t, lang, state: SA.store.get(), store: SA.store, param: param || null, query: {},
    navigate() {}, redirect() {}, rerender() {}, safeNext: () => null
  };
}

function fakeAudio(log, behaviour = {}) {
  return (src) => {
    const a = {
      src, paused: true, onended: null, onerror: null,
      play() { log.push('play ' + src); this.paused = false; if (behaviour.fail) return Promise.reject(new Error('NotSupported')); return Promise.resolve(); },
      pause() { log.push('pause ' + src); this.paused = true; },
      removeAttribute() {}, load() {}
    };
    log.audios = (log.audios || []).concat(a);
    return a;
  };
}

// 1. registration ----------------------------------------------------------------------------
test('Santali is a registered language: validation, fallback chain, picker label in Ol Chiki', () => {
  assert.ok(SA.validation.isLanguage('sat'));
  assert.deepEqual(SA.i18n.chain('sat'), ['sat', 'hi', 'en']);
  const opt = SA.LANGUAGE_OPTIONS.find((o) => o.code === 'sat');
  assert.match(opt.label, OLCHIKI);
  assert.match(opt.sub, /Santali/);
  assert.deepEqual(SA.LANGUAGE_OPTIONS.map((o) => o.code), ['hi', 'sat', 'en']);
  assert.equal(SA.santali.SCRIPT, 'Olck');
});

// 2 + 3. switching and persistence -------------------------------------------------------------
test('switching hi <-> sat changes text immediately and Santali persists across a reload', () => {
  const ls = memoryStorage();
  SA.store.init(ls);
  SA.store.update((s) => { s.settings.language = 'sat'; s.worker = { id: 'JH-2001', name: 'Ramesh Kumar' }; });
  SA.store.init(ls); // reload
  assert.equal(SA.store.get().settings.language, 'sat');
  SA.i18n.setLanguage(SA.store.get().settings.language);
  assert.equal(SA.i18n.t('nav.home'), 'ᱚᱲᱟᱜ');
  SA.store.update((s) => { s.settings.language = 'hi'; });
  SA.i18n.setLanguage('hi');
  assert.equal(SA.i18n.t('nav.home'), 'होम');
  SA.store.update((s) => { s.settings.language = 'sat'; });
  SA.i18n.setLanguage('sat');
  assert.equal(SA.i18n.t('home.greeting', { name: 'X' }), 'ᱡᱚᱦᱟᱨ, X');
  SA.store.init(ls);
  assert.equal(SA.store.get().settings.language, 'sat', 'still Santali after another reload');
});

// 5. every worker key has Santali ---------------------------------------------------------------
test('every worker-app key has Santali text in Ol Chiki (or is an explicit, documented fallback)', () => {
  const missing = Object.keys(S.en).filter((k) => !S.sat[k] && !SA.SANTALI_FALLBACK[k]);
  assert.deepEqual(missing, [], 'missing Santali keys');
  Object.keys(SA.SANTALI_FALLBACK).forEach((k) => assert.ok(SA.SANTALI_FALLBACK[k].length > 10, 'fallback reason for ' + k));
  for (const k of Object.keys(S.sat)) {
    assert.ok(S.en[k], 'Santali key without English source: ' + k);
    assert.equal(placeholders(S.sat[k]), placeholders(S.en[k]), 'placeholders differ for ' + k);
    assert.ok(!DEVANAGARI.test(S.sat[k]), 'Santali must be Ol Chiki, not Devanagari: ' + k);
    // Script-neutral strings (acronyms, dashes) are allowed; everything else uses Ol Chiki.
    if (/[A-Za-z]{4,}/.test(S.en[k]) && !/^[A-Z₂0-9 ]+$/.test(S.sat[k]) && S.sat[k] !== '—') assert.match(S.sat[k], OLCHIKI, k);
  }
});

// 6 + 7. Fire and Gas scenario text -------------------------------------------------------------
test('Fire and Gas: every prompt, option and explanation has Santali text and a voice entry', () => {
  for (const id of SA.validation.MODULE_IDS) {
    const sc = SA.scenario.get(id);
    assert.match(SA.i18n.pick(sc.title, 'sat'), OLCHIKI, id + ' title');
    assert.ok(S.sat['module.' + id + '.purpose'], id + ' purpose');
    for (const step of sc.steps) {
      const k = 'scn.' + step.id;
      assert.match(S.sat[k + '.prompt'], OLCHIKI, k);
      assert.match(S.sat[k + '.why'], OLCHIKI, k);
      step.options.forEach((o) => assert.match(S.sat[k + '.opt.' + o], OLCHIKI, k + '.opt.' + o));
      assert.ok(SA.SANTALI_AUDIO[k + '.prompt'] && SA.SANTALI_AUDIO[k + '.why'], k + ' voice entries');
    }
  }
  for (const k of Object.keys(S.en).filter((x) => /^(ar|assess|result)\./.test(x))) assert.ok(S.sat[k], 'AR/assessment key ' + k);
});

// review honesty + Hindi reference --------------------------------------------------------------
test('review status is honest: nothing is native-reviewed without a review record', () => {
  assert.deepEqual(SA.santali.reviewLog(), {}, 'no native review has taken place');
  for (const k of Object.keys(S.sat)) assert.equal(SA.santali.review(k), 'native-review-required', k);
  assert.equal(SA.santali.review('does.not.exist'), 'fallback-hindi');
  assert.ok(SA.santali.isSafetyCritical('scn.fire_01_exit.prompt'));
  assert.ok(SA.santali.isSafetyCritical('ar.placeHint'));
  assert.ok(!SA.santali.isSafetyCritical('tab.home'));
  const src = fs.readFileSync(path.join(ROOT, 'js/i18n/santali.js'), 'utf8');
  assert.match(src, /PROVISIONAL DRAFT/);
});

test('assessment in Santali shows the Hindi original under every unreviewed safety text', () => {
  setup('sat');
  SA.training.startSession('fire_explosion');
  const node = SA.screens.assess(ctx('fire_explosion'));
  const step = SA.scenario.get('fire_explosion').steps[0];
  const refs = dom.byClass(node, 'sat-ref').map((n) => n.getAttribute('data-ref'));
  assert.ok(refs.includes('scn.' + step.id + '.prompt'));
  step.options.forEach((o) => assert.ok(refs.includes('scn.' + step.id + '.opt.' + o), o));
  const prompt = dom.byId(node, 'step-prompt');
  assert.ok(text(prompt).startsWith(S.sat['scn.' + step.id + '.prompt']), 'Santali first');
  assert.ok(text(prompt).includes(S.hi['scn.' + step.id + '.prompt']), 'Hindi original below');
  // Hindi and English screens are unchanged: no reference lines, no voice control.
  for (const lang of ['hi', 'en']) {
    setup(lang);
    SA.training.startSession('fire_explosion');
    const n = SA.screens.assess(ctx('fire_explosion'));
    assert.equal(dom.byClass(n, 'sat-ref').length, 0, lang);
    assert.equal(dom.byClass(n, 'voice').length, 0, lang);
  }
});

// 4 + 11. fallback / missing audio --------------------------------------------------------------
test('missing Santali voice: the screen says "not recorded" and never plays a substitute', () => {
  setup('sat');
  const log = [];
  SA.voice._setAudioFactory(fakeAudio(log));
  SA.training.startSession('gas_confined');
  const node = SA.screens.assess(ctx('gas_confined'));
  const v = dom.byId(node, 'voice-prompt');
  assert.equal(v.getAttribute('data-voice-status'), 'pending');
  assert.equal(text(v), S.sat['voice.unavailable']);
  assert.equal(v.tagName, 'P', 'a note, not a button');
  assert.equal(SA.voice.play(['scn.gas_01_zone.prompt'], 'sat'), 'pending');
  assert.deepEqual(log, [], 'nothing was played');
  assert.equal(SA.voice.resolve('scn.gas_01_zone.prompt', 'hi').status, 'none', 'Hindi web has no voice line');
  assert.equal(SA.voice.play(['scn.gas_01_zone.prompt'], 'hi'), 'none');
  // Hindi stays Hindi: the Santali notice is not shown in Hindi mode.
  setup('hi');
  assert.equal(dom.byId(SA.screens.home(ctx()), 'sat-notice'), null);
  setup('sat');
  const home = SA.screens.home(ctx());
  assert.ok(text(dom.byId(home, 'sat-notice')).includes(S.hi['sat.notice']), 'Santali notice is bilingual');
});

// 10. audio key resolution + playback rules ----------------------------------------------------
test('voice: key -> clip resolution, one clip at a time, sequence, stop, replay and error handling', () => {
  const saved = JSON.parse(JSON.stringify(SA.SANTALI_AUDIO));
  try {
    SA.SANTALI_AUDIO['scn.fire_01_exit.prompt'].status = 'recorded';
    SA.SANTALI_AUDIO['assess.correct'].status = 'recorded';
    SA.SANTALI_AUDIO['scn.fire_01_exit.why'].status = 'recorded';
    const log = [];
    SA.voice._setAudioFactory(fakeAudio(log));
    assert.deepEqual(SA.voice.resolve('scn.fire_01_exit.prompt', 'sat'), { status: 'ready', file: 'audio/sat/fire/sat_fire_exit_prompt.ogg' });
    assert.equal(SA.voice.resolveAll(['assess.correct', 'scn.gas_01_zone.why'], 'sat').status, 'pending', 'partial groups are not played');

    const events = [];
    const off = SA.voice.onChange((s, id) => events.push(s + ':' + id));
    assert.equal(SA.voice.play(['assess.correct', 'scn.fire_01_exit.why'], 'sat', 'a'), 'playing');
    assert.deepEqual(log.slice(), ['play audio/sat/common/sat_assess_correct.ogg']);
    log.audios[0].onended();
    assert.equal(log[log.length - 1], 'play audio/sat/fire/sat_fire_exit_why.ogg', 'second clip follows the first');
    // Starting another clip stops the current one (no overlap).
    SA.voice.play(['scn.fire_01_exit.prompt'], 'sat', 'b');
    assert.ok(log.includes('pause audio/sat/fire/sat_fire_exit_why.ogg'));
    assert.ok(SA.voice.isPlaying('b') && !SA.voice.isPlaying('a'));
    SA.voice.stop();
    assert.ok(!SA.voice.isPlaying());
    // Replay plays the same clip again.
    SA.voice.play(['scn.fire_01_exit.prompt'], 'sat', 'b');
    assert.equal(log.filter((l) => l === 'play audio/sat/fire/sat_fire_exit_prompt.ogg').length, 2);
    log.audios[log.audios.length - 1].onended();
    assert.ok(!SA.voice.isPlaying(), 'ended');
    // A clip that fails to load is reported, nothing else is played.
    SA.voice._setAudioFactory((src) => { const a = fakeAudio(log)(src); a.play = () => { a.onerror(); }; return a; });
    assert.equal(SA.voice.play(['scn.fire_01_exit.prompt'], 'sat', 'c'), 'error');
    assert.ok(events.includes('error:c'));
    off();

    // With recorded clips the screen shows a real Listen button.
    setup('sat');
    SA.training.startSession('fire_explosion');
    SA.voice._setAudioFactory(fakeAudio(log));
    const node = SA.screens.assess(ctx('fire_explosion'));
    const btn = dom.byId(node, 'voice-prompt');
    assert.equal(btn.getAttribute('data-voice-status'), 'ready');
    btn.click();
    assert.ok(SA.voice.isPlaying('voice-prompt'));
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    btn.click();
    assert.ok(!SA.voice.isPlaying(), 'second tap stops');
  } finally {
    Object.keys(saved).forEach((k) => { SA.SANTALI_AUDIO[k] = saved[k]; });
    SA.voice.stop();
  }
});

// audio manifest validation -------------------------------------------------------------------
test('audio manifest: every Fire/Gas voice key either has its clip on disk or is explicitly pending', () => {
  const required = ['ar.placeHint', 'assess.correct', 'assess.wrong', 'ar.complete', 'result.passed', 'result.failed'];
  SA.validation.MODULE_IDS.forEach((id) => {
    required.push('module.' + id + '.purpose');
    SA.scenario.get(id).steps.forEach((s) => required.push('scn.' + s.id + '.prompt', 'scn.' + s.id + '.why'));
  });
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const files = new Set();
  for (const key of required) {
    const e = SA.SANTALI_AUDIO[key];
    assert.ok(e, 'no voice entry for ' + key);
    assert.ok(['recorded', 'recording-pending'].includes(e.status), key);
    assert.match(e.file, /^audio\/sat\/(common|fire|gas)\/sat_[a-z0-9_]+\.ogg$/, key);
    assert.ok(!files.has(e.file), 'duplicate clip file ' + e.file);
    files.add(e.file);
    const exists = fs.existsSync(path.join(ROOT, e.file));
    if (e.status === 'recorded') {
      assert.ok(exists, 'recorded clip missing on disk: ' + e.file);
      assert.ok(S.sat[key], 'clip without Santali text: ' + key);
      const sha = crypto.createHash('sha256').update(S.sat[key], 'utf8').digest('hex');
      assert.ok(e.textSha && sha.startsWith(e.textSha), 'Santali text changed after recording, re-record: ' + key);
      assert.ok(sw.includes("'" + e.file + "'"), 'recorded clip not cached for offline use: ' + e.file);
    } else {
      assert.ok(!exists, 'clip exists but is marked pending: ' + e.file);
    }
  }
  assert.deepEqual(Object.keys(SA.SANTALI_AUDIO).sort(), required.slice().sort(), 'manifest lists exactly the spoken lines');
  // No orphan audio files.
  const dir = path.join(ROOT, 'audio');
  const onDisk = [];
  (function walk(d) { if (!fs.existsSync(d)) return; fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else onDisk.push(path.relative(ROOT, p).split(path.sep).join('/')); }); })(dir);
  onDisk.filter((f) => !f.endsWith('README.md')).forEach((f) => assert.ok(files.has(f), 'audio file not in the manifest: ' + f));
  // The APK packages the audio folder (copyWebApp) uncompressed so Android can stream it.
  const gradle = fs.readFileSync(path.join(ROOT, '..', 'android-shell', 'app', 'build.gradle'), 'utf8');
  assert.match(gradle, /include [^\n]*'audio\/\*\*\/\*\.ogg'/);
  assert.match(gradle, /'\.ogg'/);
  assert.match(gradle, /tasks\.register\('copyWebApp', Sync\)/, 'Sync, so deleted/test clips never linger in the APK');
});

// 8. certificate flow in Santali ---------------------------------------------------------------
test('Santali Fire and Gas: pass -> certificate -> QR payload verifies; tampering is detected', () => {
  setup('sat', { name: 'ᱥᱩᱱᱤᱛᱟ ᱦᱮᱢᱵᱨᱚᱢ' });
  assert.equal(SA.validation.checkName('ᱥᱩᱱᱤᱛᱟ ᱦᱮᱢᱵᱨᱚᱢ'), null, 'Ol Chiki names are valid');
  for (const id of SA.validation.MODULE_IDS) {
    const attempt = SA.training.completeAssessment(play(SA, id, OK3));
    assert.equal(attempt.score, 100);
    assert.ok(attempt.passed);
    const cert = SA.training.issueCertificate(attempt.id);
    const payload = SA.certificate.toPayload(cert);
    const res = SA.certificate.verify(payload, SA.clock.now(SA.store.get()));
    assert.ok(res.valid, id);
    assert.equal(res.cert.name, 'ᱥᱩᱱᱤᱛᱟ ᱦᱮᱢᱵᱨᱚᱢ');
    assert.ok(SA.qr.encode(payload).size > 0, 'QR encodes');
    const bad = payload.slice(0, -3) + (payload.slice(-3, -2) === 'A' ? 'B' : 'A') + payload.slice(-2);
    assert.equal(SA.certificate.verify(bad, SA.clock.now(SA.store.get())).valid, false, 'tamper detected');
  }
  const node = SA.screens.certificate(ctx());
  assert.ok(text(node).includes(S.sat['cert.title']) || text(node).includes(S.sat['passport.title']), 'certificate screen in Santali');
  assert.ok(text(node).includes('ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ') || text(node).includes('ᱜᱮᱥ ᱞᱤᱠ ᱟᱨ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ'), 'module title in Santali');
  for (const k of ['cert.title', 'verify.valid', 'verify.invalid', 'verify.reason.signature', 'verify.reason.expired', 'retention.due', 'passport.zone.refresher']) {
    assert.match(S.sat[k], OLCHIKI, k);
  }
  assert.match(S.sat['verify.valid'], /VALID/, 'the VALID / INVALID verdict stays readable in Latin too');
});

// 9. management localisation behaviour ---------------------------------------------------------
test('management portal stays English-only (D-040) and keeps working while Santali is selected', () => {
  setup('sat');
  const ms = SA.MGMT_STRINGS;
  assert.ok(!ms.sat && !ms.hi, 'management strings have no Santali/Hindi tables');
  const roles = SA.screens.manage(ctx());
  assert.ok(/Trainer/.test(text(roles)) && /Contractor/.test(text(roles)), 'roles listed');
  assert.match(S.sat['home.manage'], OLCHIKI, 'the worker-app link into the portal is Santali');
});

// date formatting ------------------------------------------------------------------------------
test('Santali dates use Latin digits and never Hindi month names', () => {
  const d = SA.i18n.formatDate(Date.UTC(2026, 9, 3, 6), 'sat');
  assert.match(d, /2026/);
  assert.ok(!DEVANAGARI.test(d), d);
  assert.ok(['sat-IN-u-nu-latn', 'en-IN'].includes(SA.i18n.locale('sat')));
  assert.equal(SA.i18n.locale('hi'), 'hi-IN');
});

// 12. no network ---------------------------------------------------------------------------------
test('Santali and voice code make no network calls and use no speech synthesis or remote audio', () => {
  for (const f of ['js/i18n/santali.js', 'js/i18n/santali-audio.js', 'js/services/voice.js', 'js/components/ui.js']) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|speechSynthesis|SpeechSynthesisUtterance/.test(code), f);
    assert.ok(!/https?:\/\//.test(code.replace('http://www.w3.org/2000/svg', '')), f + ' has a URL');
  }
  Object.values(SA.SANTALI_AUDIO).forEach((e) => assert.ok(!/^[a-z]+:|^\/\//i.test(e.file), 'clip must be a local relative path: ' + e.file));
  const manifest = fs.readFileSync(path.join(ROOT, '..', 'android-shell', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.ok(!/android\.permission\.INTERNET/.test(manifest), 'no INTERNET permission');
});

// reviewer sheet ----------------------------------------------------------------------------------
test('the Santali review sheet (docs/santali-review.csv) is current and lists every key', () => {
  const sheet = require('../tools/santali-sheet.js');
  assert.ok(fs.existsSync(sheet.OUT), 'run npm run santali:sheet');
  const onDisk = fs.readFileSync(sheet.OUT, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(onDisk, sheet.render(), 'stale: run npm run santali:sheet');
  const lines = onDisk.trim().split('\n');
  assert.equal(lines.length, 1 + 2 + Object.keys(S.en).length, 'header + 2 titles + every key');
  assert.ok(!onDisk.includes(',native-reviewed,'), 'no key may claim a native review that did not happen');
});
