/*
 * Santali (sat) worker-app text, in Ol Chiki script (docs/SANTALI_LOCALIZATION.md).
 *
 * STATUS: PROVISIONAL DRAFT. Every string below was drafted for the prototype without a
 * native-speaker review. None of it is approved safety wording. Until a reviewer signs a key
 * off in REVIEW_LOG, SA.santali.review(key) reports 'native-review-required' and the UI shows
 * the Hindi original next to every safety-critical Santali text (scenario prompts, options,
 * explanations, AR instructions).
 *
 * One file on purpose, so a reviewer can correct it in one place. The review sheet with
 * English, Hindi, Santali and status side by side is generated from this file:
 *   npm run santali:sheet   ->   docs/santali-review.csv
 *
 * Terminology policy (provisional, for the reviewer to confirm):
 *   - Acronyms stay in Latin letters: AR, QR, PPE, CO₂, SOS, ID, HMAC, ARCore.
 *   - Technical loanwords common on Jharkhand sites are written in Ol Chiki rather than
 *     coined: ᱴᱨᱮᱱᱤᱝ (training), ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ (certificate), ᱢᱳᱰᱭᱩᱞ (module), ᱜᱮᱥ (gas).
 *   - Digits stay Latin (0-9) so scores, IDs and dates read the same as on the certificate.
 *
 * Keys missing here fall back sat -> hi -> en (i18n.js). SA.SANTALI_FALLBACK lists keys that
 * are deliberately not translated, with the reason; tests fail on any other missing key.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var sat = {
    'app.name': 'ᱥᱩᱨᱚᱠᱥᱟ ᱫᱽᱨᱤᱥᱴᱤ',
    'app.tagline': 'SurakshaAR · ᱠᱟᱹᱢᱤ ᱡᱟᱭᱜᱟ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱨᱮᱱᱤᱝ',
    'nav.back': 'ᱨᱩᱣᱟᱹᱲ',
    'nav.home': 'ᱚᱲᱟᱜ',
    'nav.language': 'ᱯᱟᱹᱨᱥᱤ ᱵᱚᱫᱚᱞ ᱢᱮ',

    'welcome.purpose': 'ᱦᱩᱰᱤᱧ ᱦᱩᱰᱤᱧ ᱫᱷᱟᱯ ᱛᱮ ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱜᱮᱥ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱪᱮᱫ ᱢᱮ, ᱟᱨ ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ ᱡᱟᱺᱪ ᱫᱟᱲᱮᱭᱟᱜ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱧᱟᱢ ᱢᱮ᱾',
    'welcome.start': 'ᱴᱨᱮᱱᱤᱝ ᱮᱦᱚᱵ ᱢᱮ',
    'welcome.offline': 'ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ ᱪᱟᱞᱟᱜᱼᱟ · ᱦᱤᱱᱫᱤ · ᱥᱟᱱᱛᱟᱲᱤ · English',
    'welcome.manage': 'ᱢᱮᱱᱮᱡᱢᱮᱱᱴ ᱯᱚᱨᱴᱟᱞ (ᱯᱨᱳᱴᱳᱴᱟᱭᱤᱯ)',

    'lang.title': 'ᱟᱢᱟᱜ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    'lang.hint': 'ᱱᱚᱶᱟ ᱛᱟᱭᱚᱢ ᱛᱮ ᱪᱮᱛᱟᱱ ᱯᱟᱴᱤ ᱠᱷᱚᱱ ᱵᱚᱫᱚᱞ ᱫᱟᱲᱮᱭᱟᱜᱼᱟᱢ᱾',

    'profile.title': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ᱵᱤᱵᱨᱚᱬ',
    'profile.name': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ᱧᱩᱛᱩᱢ',
    'profile.id': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ID',
    'profile.idHint': 'ᱟᱠᱷᱚᱨ, ᱮᱞ, - ᱥᱮ / (ᱫᱟᱹᱭᱠᱟᱹ: JH-1024)',
    'profile.privacy': 'ᱠᱷᱟᱹᱞᱤ ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱟᱨ ᱠᱟᱹᱢᱤᱭᱟᱹ ID, ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱜᱮ ᱫᱚᱦᱚᱜᱼᱟ᱾',
    'profile.continue': 'ᱞᱟᱦᱟ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'profile.err.nameRequired': 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱚᱞ ᱢᱮ᱾',
    'profile.err.nameInvalid': '2–60 ᱟᱠᱷᱚᱨ ᱟᱨ ᱯᱷᱟᱸᱠ ᱵᱮᱵᱷᱟᱨ ᱢᱮ᱾',
    'profile.err.idRequired': 'ᱟᱢᱟᱜ ᱠᱟᱹᱢᱤᱭᱟᱹ ID ᱚᱞ ᱢᱮ᱾',
    'profile.err.idInvalid': '20 ᱟᱠᱷᱚᱨ ᱦᱟᱹᱵᱤᱡ, ᱮᱞ, - ᱥᱮ / ᱵᱮᱵᱷᱟᱨ ᱢᱮ᱾',

    'home.greeting': 'ᱡᱚᱦᱟᱨ, {name}',
    'home.workerId': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ID: {id}',
    'home.modules': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱨᱮᱱᱤᱝ',
    'home.status.new': 'ᱵᱟᱝ ᱮᱦᱚᱵ ᱟᱠᱟᱱᱟ',
    'home.status.passed': 'ᱯᱟᱥ · ᱱᱚᱢᱵᱚᱨ {score}',
    'home.status.failed': 'ᱢᱟᱲᱟᱝ ᱱᱚᱢᱵᱚᱨ {score} · ᱫᱚᱦᱲᱟ ᱪᱮᱥᱴᱟᱭ ᱢᱮ',
    'home.status.inProgress': 'ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ · ᱫᱷᱟᱯ {step}/{total}',
    'home.status.unavailable': 'ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'home.more': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱟᱨ ᱡᱟᱺᱪ',
    'home.certificate': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ',
    'home.certificate.sub': 'ᱟᱢᱟᱜ QR ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱩᱫᱩᱜ ᱢᱮ',
    'home.verify': 'ᱡᱟᱺᱪ',
    'home.verify.sub': 'ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱡᱟᱺᱪ ᱢᱮ',
    'home.dashboard': 'ᱥᱩᱯᱚᱨᱵᱟᱭᱡᱚᱨ ᱰᱮᱥᱵᱳᱨᱰ',
    'home.manage': 'ᱢᱮᱱᱮᱡᱢᱮᱱᱴ ᱯᱚᱨᱴᱟᱞ (ᱯᱨᱳᱴᱳᱴᱟᱭᱤᱯ)',
    'home.changeWorker': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ᱵᱚᱫᱚᱞ ᱢᱮ',

    'retention.title': 'ᱨᱤᱴᱮᱱᱥᱚᱱ ᱜᱟᱨᱰ',
    'retention.risk': 'ᱡᱚᱠᱷᱤᱢ {risk}/100',
    'retention.lastTraining': 'ᱢᱟᱲᱟᱝ ᱴᱨᱮᱱᱤᱝ {days} ᱢᱟᱦᱟᱸ ᱞᱟᱦᱟᱨᱮ',
    'retention.nextIn': '{days} ᱢᱟᱦᱟᱸ ᱛᱟᱭᱚᱢ ᱨᱤᱯᱷᱨᱮᱥᱚᱨ',
    'retention.due': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱠᱤ',
    'retention.none': 'ᱴᱨᱮᱠᱤᱝ ᱮᱦᱚᱵ ᱞᱟᱹᱜᱤᱫ ᱢᱤᱫᱴᱟᱹᱝ ᱢᱳᱰᱭᱩᱞ ᱯᱩᱨᱟᱹᱣ ᱢᱮ᱾',
    'risk.green': 'ᱦᱟᱹᱨᱭᱟᱹᱲ · ᱠᱚᱢ ᱡᱚᱠᱷᱤᱢ',
    'risk.amber': 'ᱥᱟᱥᱟᱝ · ᱛᱟᱞᱟ ᱡᱚᱠᱷᱤᱢ',
    'risk.red': 'ᱟᱨᱟᱜ · ᱵᱮᱥᱤ ᱡᱚᱠᱷᱤᱢ',

    'module.fire_explosion.purpose': 'ᱥᱮᱸᱜᱮᱞ ᱞᱟᱜᱟᱣ ᱚᱠᱛᱚ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱮ ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠ ᱢᱮ ᱟᱨ ᱴᱷᱤᱠ ᱥᱮᱸᱜᱮᱞ ᱧᱤᱵᱷᱟᱹᱣ ᱡᱚᱱᱛᱨᱚ ᱵᱮᱵᱷᱟᱨ ᱢᱮ᱾',
    'module.gas_confined.purpose': 'ᱜᱮᱥ ᱞᱤᱠ ᱡᱚᱱ ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ ᱟᱨ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱵᱷᱤᱛᱨᱤ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱮ ᱞᱟᱹᱫᱮ ᱢᱮ᱾',

    'briefing.steps': '3 ᱫᱷᱟᱯ · ᱡᱟᱦᱟᱸ ᱚᱠᱛᱚ ᱦᱚᱸ ᱡᱚᱛᱚ ᱠᱷᱚᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱠᱟᱹᱢᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    'briefing.stepN': 'ᱫᱷᱟᱯ {n}',
    'briefing.start': 'ᱮᱦᱚᱵ ᱢᱮ',
    'briefing.resume': 'ᱞᱟᱦᱟ ᱪᱟᱞᱟᱜ ᱢᱮ · ᱫᱷᱟᱯ {step}/{total}',
    'briefing.restart': 'ᱫᱚᱦᱲᱟ ᱮᱦᱚᱵ ᱢᱮ',
    'briefing.arOpening': 'AR ᱴᱨᱮᱱᱟᱨ ᱡᱷᱤᱡᱽ ᱠᱟᱱᱟ…',

    'assess.step': 'ᱫᱷᱟᱯ {n}/{total}',
    'assess.correct': 'ᱴᱷᱤᱠ · ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱪᱷᱟᱣ',
    'assess.wrong': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱝ',
    'assess.safeAnswer': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱮᱞᱟ',
    'assess.continue': 'ᱞᱟᱦᱟ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'assess.finish': 'ᱯᱷᱚᱞ ᱧᱮᱞ ᱢᱮ',
    'assess.exit': 'ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠ ᱢᱮ',

    'result.title': 'ᱯᱷᱚᱞ',
    'result.score': 'ᱱᱚᱢᱵᱚᱨ',
    'result.wrong': 'ᱵᱷᱩᱞ ᱛᱮᱞᱟ',
    'result.wrongOf': '{steps} ᱠᱷᱚᱱ {wrong}',
    'result.passed': 'ᱯᱟᱥ',
    'result.failed': 'ᱯᱟᱥ ᱵᱟᱝ',
    'result.passMark': 'ᱯᱟᱥ ᱱᱚᱢᱵᱚᱨ: {mark}',
    'result.module': 'ᱢᱳᱰᱭᱩᱞ',
    'result.worker': 'ᱠᱟᱹᱢᱤᱭᱟᱹ',
    'result.getCert': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱤᱫᱤ ᱢᱮ',
    'result.retry': 'ᱫᱚᱦᱲᱟ ᱴᱨᱮᱱᱤᱝ ᱢᱮ',
    'result.none': 'ᱱᱤᱛᱚᱜ ᱡᱟᱦᱟᱸ ᱯᱷᱚᱞ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱯᱟᱹᱦᱤᱞ ᱢᱤᱫᱴᱟᱹᱝ ᱴᱨᱮᱱᱤᱝ ᱢᱳᱰᱭᱩᱞ ᱯᱩᱨᱟᱹᱣ ᱢᱮ᱾',

    'cert.title': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱨᱮᱱᱤᱝ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ',
    'cert.worker': 'ᱠᱟᱹᱢᱤᱭᱟᱹ',
    'cert.module': 'ᱢᱳᱰᱭᱩᱞ',
    'cert.score': 'ᱱᱚᱢᱵᱚᱨ',
    'cert.issued': 'ᱮᱢ ᱢᱟᱦᱟᱸ',
    'cert.expiry': 'ᱢᱟᱱᱚᱛ ᱢᱟᱦᱟᱸ ᱦᱟᱹᱵᱤᱡ',
    'cert.qrAlt': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ QR ᱠᱳᱰ',
    'cert.payload': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ',
    'cert.verify': 'ᱱᱚᱶᱟ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱡᱟᱺᱪ ᱢᱮ',
    'cert.none': 'ᱱᱤᱛᱚᱜ ᱡᱟᱦᱟᱸ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱞᱟᱹᱜᱤᱫ ᱢᱤᱫᱴᱟᱹᱝ ᱢᱳᱰᱭᱩᱞ 70 ᱥᱮ ᱵᱮᱥᱤ ᱱᱚᱢᱵᱚᱨ ᱛᱮ ᱯᱟᱥ ᱢᱮ᱾',
    'cert.demoNote': 'ᱦᱮᱠᱟᱛᱷᱚᱱ ᱯᱨᱳᱴᱳᱴᱟᱭᱤᱯ ᱞᱟᱹᱜᱤᱫ ᱰᱮᱢᱳ ᱥᱩᱦᱤ (HMAC)᱾ ᱱᱚᱶᱟ ᱯᱨᱳᱰᱟᱠᱥᱚᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱫᱚ ᱵᱟᱝ ᱠᱟᱱᱟ᱾',
    'cert.qrError': 'QR ᱠᱳᱰ ᱵᱟᱝ ᱵᱮᱱᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾ ᱞᱟᱛᱟᱨ ᱨᱮᱭᱟᱜ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ ᱵᱮᱵᱷᱟᱨ ᱢᱮ᱾',

    'verify.title': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱡᱟᱺᱪ ᱢᱮ',
    'verify.hint': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ ᱯᱮᱥᱴ ᱢᱮ, ᱥᱮ ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱭᱟᱜ ᱢᱟᱲᱟᱝ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱞᱳᱰ ᱢᱮ᱾',
    'verify.input': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ',
    'verify.useLast': 'ᱢᱟᱲᱟᱝ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱤᱫᱤ ᱢᱮ',
    'verify.noLast': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ ᱱᱤᱛᱚᱜ ᱡᱟᱦᱟᱸ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱟᱝ ᱫᱚᱦᱚ ᱟᱠᱟᱱᱟ᱾',
    'verify.tamper': '1 ᱟᱠᱷᱚᱨ ᱵᱚᱫᱚᱞ ᱢᱮ (ᱰᱮᱢᱳ)',
    'verify.tampered': 'ᱢᱤᱫᱴᱟᱹᱝ ᱟᱠᱷᱚᱨ ᱵᱚᱫᱚᱞ ᱮᱱᱟ᱾ ᱱᱤᱛᱚᱜ ᱡᱟᱺᱪ ᱚᱛᱟᱭ ᱢᱮ᱾',
    'verify.submit': 'ᱡᱟᱺᱪ',
    'verify.valid': 'ᱴᱷᱤᱠ (VALID)',
    'verify.invalid': 'ᱵᱷᱩᱞ (INVALID)',
    'verify.ok': 'ᱥᱩᱦᱤ ᱢᱤᱫ ᱜᱮᱭᱟ ᱟᱨ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱟᱡᱟᱜ ᱢᱟᱱᱚᱛ ᱚᱠᱛᱚ ᱨᱮ ᱢᱮᱱᱟᱜᱼᱟ᱾',
    'verify.reason.empty': 'ᱯᱟᱹᱦᱤᱞ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ ᱟᱫᱮᱨ ᱢᱮ᱾',
    'verify.reason.malformed': 'ᱱᱚᱶᱟ ᱫᱚ SurakshaAR ᱨᱮᱭᱟᱜ ᱴᱷᱤᱠ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ ᱵᱟᱝ ᱠᱟᱱᱟ᱾',
    'verify.reason.signature': 'ᱥᱩᱦᱤ ᱵᱟᱝ ᱢᱤᱫ ᱜᱮᱭᱟ᱾ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱚᱫᱚᱞ ᱟᱠᱟᱱᱟ ᱥᱮ ᱥᱟᱹᱨᱤ ᱵᱟᱝ ᱠᱟᱱᱟ᱾',
    'verify.reason.content': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱨᱮᱭᱟᱜ ᱠᱷᱚᱵᱚᱨ ᱵᱟᱹᱲᱤᱡ ᱥᱮ ᱟᱫᱷᱟ ᱜᱮᱭᱟ᱾',
    'verify.reason.expired': 'ᱱᱚᱶᱟ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ {date} ᱢᱟᱦᱟᱸ ᱨᱮ ᱢᱩᱪᱟᱹᱫ ᱮᱱᱟ᱾',
    'verify.offline': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱜᱮ ᱡᱟᱺᱪ ᱮᱱᱟ᱾ ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱟᱝ ᱵᱮᱵᱷᱟᱨ ᱮᱱᱟ᱾',

    'dash.title': 'ᱥᱩᱯᱚᱨᱵᱟᱭᱡᱚᱨ ᱰᱮᱥᱵᱳᱨᱰ',
    'dash.seedNote': 'ᱰᱮᱢᱳ ᱰᱟᱴᱟ: ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ 8 ᱫᱟᱹᱭᱠᱟᱹ ᱠᱟᱹᱢᱤᱭᱟᱹ᱾',
    'dash.simulate': '+7 ᱢᱟᱦᱟᱸ ᱞᱟᱦᱟ ᱢᱮ',
    'dash.reset': 'ᱚᱠᱛᱚ ᱨᱤᱥᱮᱴ ᱢᱮ',
    'dash.timeNow': 'ᱰᱮᱢᱳ ᱚᱠᱛᱚ: ᱛᱮᱦᱮᱧ',
    'dash.timeOffset': 'ᱰᱮᱢᱳ ᱚᱠᱛᱚ: ᱛᱮᱦᱮᱧ + {days} ᱢᱟᱦᱟᱸ',
    'dash.col.worker': 'ᱠᱟᱹᱢᱤᱭᱟᱹ',
    'dash.col.module': 'ᱢᱟᱲᱟᱝ ᱢᱳᱰᱭᱩᱞ',
    'dash.col.score': 'ᱱᱚᱢᱵᱚᱨ',
    'dash.col.fails': 'ᱯᱷᱮᱞ ᱪᱮᱥᱴᱟ',
    'dash.col.risk': 'ᱡᱚᱠᱷᱤᱢ',
    'dash.col.status': 'ᱡᱚᱠᱷᱤᱢ ᱦᱟᱹᱞᱚᱛ',
    'dash.col.refresher': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ',
    'dash.refresher.due': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱠᱤ',
    'dash.refresher.ok': 'ᱱᱟᱣᱟ ᱜᱮᱭᱟ',
    'dash.thisDevice': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ',
    'dash.daysAgo': '{days} ᱢᱟᱦᱟᱸ ᱞᱟᱦᱟᱨᱮ ᱴᱨᱮᱱᱤᱝ',
    'dash.summary.workers': 'ᱠᱟᱹᱢᱤᱭᱟᱹ',
    'dash.summary.due': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱠᱤ',

    'err.title': 'ᱪᱮᱫ ᱦᱚᱸ ᱵᱷᱩᱞ ᱦᱩᱭ ᱮᱱᱟ',
    'err.generic': 'ᱚᱲᱟᱜ ᱥᱮᱫ ᱨᱩᱣᱟᱹᱲ ᱠᱟᱛᱮ ᱫᱚᱦᱲᱟ ᱪᱮᱥᱴᱟᱭ ᱢᱮ᱾',
    'err.storageReset': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ ᱫᱚᱦᱚ ᱰᱟᱴᱟ ᱵᱟᱹᱲᱤᱡ ᱦᱩᱭ ᱮᱱᱟ, ᱚᱱᱟ ᱛᱮ ᱨᱤᱥᱮᱴ ᱮᱱᱟ᱾',
    'err.storageUnavailable': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱰᱟᱴᱟ ᱵᱟᱝ ᱫᱚᱦᱚ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾ ᱮᱯ ᱵᱚᱸᱫ ᱠᱷᱟᱱ ᱯᱨᱚᱜᱽᱨᱮᱥ ᱟᱫᱚᱜᱼᱟ᱾',
    'err.moduleUnavailable': 'ᱱᱚᱶᱟ ᱴᱨᱮᱱᱤᱝ ᱢᱳᱰᱭᱩᱞ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾',
    'err.resultRejected': 'ᱴᱨᱮᱱᱤᱝ ᱯᱷᱚᱞ ᱵᱟᱝ ᱦᱟᱛᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾ ᱫᱚᱦᱲᱟ ᱴᱨᱮᱱᱤᱝ ᱢᱮ᱾',
    'err.arUnavailable': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ AR ᱴᱨᱮᱱᱤᱝ ᱵᱟᱝ ᱪᱟᱞᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾ ᱯᱷᱚᱱ ᱥᱠᱨᱤᱱ ᱨᱮ ᱴᱨᱮᱱᱤᱝ ᱞᱟᱹᱜᱤᱫ ᱫᱚᱦᱲᱟ ᱮᱦᱚᱵ ᱚᱛᱟᱭ ᱢᱮ᱾',
    'err.certFailed': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱟᱝ ᱵᱮᱱᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾',

    'sat.notice': 'ᱥᱟᱱᱛᱟᱲᱤ ᱚᱞ ᱫᱚ ᱠᱟᱸᱪᱟ (ᱯᱨᱚᱵᱷᱤᱡᱚᱱᱟᱞ) ᱠᱟᱱᱟ, ᱥᱟᱱᱛᱟᱲᱤ ᱨᱚᱲᱤᱭᱟᱹ ᱦᱚᱛᱮᱛᱮ ᱡᱟᱺᱪ ᱵᱟᱠᱤ ᱢᱮᱱᱟᱜᱼᱟ᱾ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱚᱞ ᱥᱟᱶᱛᱮ ᱦᱤᱱᱫᱤ ᱢᱩᱞ ᱚᱞ ᱦᱚᱸ ᱩᱫᱩᱜ ᱠᱟᱱᱟ᱾',

    'ar.placeHint': 'ᱯᱷᱚᱱ ᱚᱛ ᱥᱮᱫ ᱠᱩᱞᱤᱡ ᱢᱮ᱾ ᱥᱟᱥᱟᱝ ᱡᱟᱭᱜᱟ ᱧᱮᱞᱚᱜ ᱠᱷᱟᱱ ᱚᱱᱟ ᱴᱮᱯ ᱠᱟᱛᱮ ᱴᱨᱮᱱᱤᱝ ᱫᱚᱦᱚ ᱢᱮ᱾',
    'ar.autoPlaceIn': 'ᱱᱤᱛᱚᱜ ᱦᱟᱹᱵᱤᱡ ᱚᱛ ᱵᱟᱝ ᱧᱟᱢ ᱮᱱᱟ᱾ {s} ᱥᱮᱠᱮᱱᱰ ᱨᱮ ᱟᱡ ᱛᱮᱜᱮ ᱫᱚᱦᱚᱜᱼᱟ…',
    'ar.lookAhead': 'ᱴᱨᱮᱱᱤᱝ ᱡᱟᱭᱜᱟ ᱟᱢᱟᱜ ᱥᱟᱢᱟᱝ ᱨᱮ ᱢᱮᱱᱟᱜᱼᱟ᱾ ᱥᱟᱢᱟᱝ ᱧᱮᱞ ᱢᱮ᱾',
    'ar.tapOption': 'ᱡᱚᱛᱚ ᱠᱷᱚᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱪᱷᱟᱣ ᱴᱮᱯ ᱢᱮ᱾',
    'ar.moveHint': 'ᱴᱨᱮᱱᱤᱝ ᱡᱟᱭᱜᱟ ᱮᱴᱟᱜ ᱥᱮᱫ ᱫᱚᱦᱚ ᱞᱟᱹᱜᱤᱫ ᱚᱛ ᱴᱮᱯ ᱢᱮ᱾',
    'ar.complete': 'ᱴᱨᱮᱱᱤᱝ ᱯᱩᱨᱟᱹᱣ ᱮᱱᱟ',
    'ar.finish': 'ᱢᱩᱪᱟᱹᱫ ᱢᱮ',
    'ar.trainAgain': 'ᱫᱚᱦᱲᱟ ᱴᱨᱮᱱᱤᱝ ᱢᱮ',
    'ar.sending': 'ᱮᱯ ᱥᱮᱫ ᱨᱩᱣᱟᱹᱲ ᱠᱟᱱᱟ…',
    'ar.standalone': 'ᱴᱮᱥᱴ ᱵᱤᱞᱰ: ᱨᱩᱣᱟᱹᱲ ᱞᱟᱹᱜᱤᱫ ᱡᱟᱦᱟᱸ ᱮᱯ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾',
    'ar.exit': 'ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠ ᱢᱮ',
    'ar.err.cameraDenied': 'AR ᱴᱨᱮᱱᱤᱝ ᱞᱟᱹᱜᱤᱫ ᱠᱮᱢᱮᱨᱟ ᱦᱩᱠᱩᱢ ᱞᱟᱹᱠᱛᱤᱭᱟ᱾ ᱥᱮᱴᱤᱝ ᱨᱮ ᱱᱚᱶᱟ ᱮᱯ ᱞᱟᱹᱜᱤᱫ ᱠᱮᱢᱮᱨᱟ ᱦᱩᱠᱩᱢ ᱮᱢ ᱠᱟᱛᱮ ᱫᱚᱦᱲᱟ ᱪᱮᱥᱴᱟᱭ ᱢᱮ᱾',
    'ar.err.unsupported': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ AR (ARCore) ᱵᱟᱝ ᱪᱟᱞᱟᱣ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾ ᱯᱷᱚᱱ ᱥᱠᱨᱤᱱ ᱨᱮ ᱴᱨᱮᱱᱤᱝ ᱫᱟᱲᱮᱭᱟᱜᱼᱟᱢ᱾',
    'ar.err.badParams': 'ᱵᱟᱝ ᱵᱟᱰᱟᱭ ᱴᱨᱮᱱᱤᱝ ᱢᱳᱰᱭᱩᱞ ᱥᱮ ᱯᱟᱹᱨᱥᱤ᱾ ᱮᱯ ᱥᱮᱫ ᱨᱩᱣᱟᱹᱲ ᱠᱟᱱᱟ᱾',
    'ar.err.content': 'ᱴᱨᱮᱱᱤᱝ ᱥᱟᱢᱜᱽᱨᱤ ᱵᱟᱝ ᱞᱳᱰ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾',
    'ar.back': 'ᱮᱯ ᱥᱮᱫ ᱨᱩᱣᱟᱹᱲ ᱢᱮ',
    'ar.voiceFallback': 'ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ ᱵᱟᱝ ᱨᱮᱠᱚᱨᱰ ᱟᱠᱟᱱᱟ · ᱦᱤᱱᱫᱤ ᱟᱲᱟᱝ',
    'ar.replay': 'ᱫᱚᱦᱲᱟ ᱟᱸᱡᱚᱢ ᱢᱮ',

    'scn.fire_01_exit.prompt': 'ᱥᱮᱸᱜᱮᱞ ᱮᱞᱟᱨᱢ! ᱚᱠᱟ ᱦᱚᱨ ᱛᱮ ᱟᱢ ᱵᱤᱞᱰᱤᱝ ᱠᱷᱚᱱ ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠᱟᱢ?',
    'scn.fire_01_exit.opt.exit_sign': 'ᱚᱰᱚᱠ ᱦᱚᱨ (Exit) ᱪᱤᱱᱦᱟᱹ ᱛᱟᱭᱚᱢ ᱛᱮ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'scn.fire_01_exit.opt.lift': 'ᱞᱤᱯᱷᱴ ᱛᱮ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'scn.fire_01_exit.opt.window': 'ᱡᱷᱚᱨᱠᱟ ᱛᱮ ᱵᱟᱦᱨᱮ ᱚᱰᱚᱠ ᱢᱮ',
    'scn.fire_01_exit.why': 'ᱡᱟᱦᱟᱸ ᱚᱠᱛᱚ ᱦᱚᱸ ᱪᱤᱱᱦᱟᱹ ᱢᱮᱱᱟᱜ ᱚᱰᱚᱠ ᱦᱚᱨ ᱵᱮᱵᱷᱟᱨ ᱢᱮ᱾ ᱥᱮᱸᱜᱮᱞ ᱚᱠᱛᱚ ᱞᱤᱯᱷᱴ ᱛᱤᱝᱜᱩ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ ᱟᱨ ᱡᱷᱚᱨᱠᱟ ᱫᱚ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱦᱚᱨ ᱵᱟᱝ ᱠᱟᱱᱟ᱾',

    'scn.fire_02_extinguisher.prompt': 'ᱵᱤᱡᱞᱤ ᱯᱮᱱᱮᱞ ᱨᱮ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱜᱟᱣ ᱮᱱᱟ᱾ ᱚᱠᱟ ᱥᱮᱸᱜᱮᱞ ᱧᱤᱵᱷᱟᱹᱣ ᱡᱚᱱᱛᱨᱚ ᱵᱮᱵᱷᱟᱨ ᱟᱢ?',
    'scn.fire_02_extinguisher.opt.co2': 'CO₂ ᱥᱮᱸᱜᱮᱞ ᱧᱤᱵᱷᱟᱹᱣ ᱡᱚᱱᱛᱨᱚ',
    'scn.fire_02_extinguisher.opt.water': 'ᱫᱟᱜ',
    'scn.fire_02_extinguisher.opt.foam': 'ᱯᱷᱚᱢ',
    'scn.fire_02_extinguisher.why': 'ᱵᱤᱡᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱨᱮ CO₂ ᱵᱮᱵᱷᱟᱨ ᱢᱮ᱾ ᱫᱟᱜ ᱟᱨ ᱯᱷᱚᱢ ᱛᱮ ᱵᱤᱡᱞᱤ ᱪᱟᱞᱟᱜᱼᱟ, ᱚᱱᱟ ᱛᱮ ᱵᱤᱡᱞᱤ ᱡᱷᱟᱴᱠᱟ ᱦᱩᱭ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾',

    'scn.fire_03_smoke.prompt': 'ᱜᱟᱞᱤ ᱨᱮ ᱫᱷᱩᱸᱣᱟᱹ ᱯᱮᱨᱮᱡ ᱠᱟᱱᱟ᱾ ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱪᱟᱞᱟᱜᱟᱢ?',
    'scn.fire_03_smoke.opt.crawl_low': 'ᱫᱷᱩᱸᱣᱟᱹ ᱞᱟᱛᱟᱨ ᱛᱮ ᱞᱟᱛᱟᱨ ᱦᱩᱭ ᱠᱟᱛᱮ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'scn.fire_03_smoke.opt.run_upright': 'ᱛᱤᱝᱜᱩ ᱠᱟᱛᱮ ᱫᱟᱹᱲ ᱢᱮ',
    'scn.fire_03_smoke.opt.go_back': 'ᱫᱚᱦᱲᱟ ᱵᱷᱤᱛᱨᱤ ᱨᱩᱣᱟᱹᱲ ᱢᱮ',
    'scn.fire_03_smoke.why': 'ᱥᱟᱯᱷᱟ ᱦᱚᱭ ᱚᱛ ᱴᱷᱮᱱ ᱛᱟᱦᱮᱸᱱᱟ᱾ ᱞᱟᱛᱟᱨ ᱛᱮ ᱛᱟᱦᱮᱸᱱ ᱠᱟᱛᱮ ᱚᱰᱚᱠ ᱦᱚᱨ ᱥᱮᱫ ᱪᱟᱞᱟᱜ ᱛᱟᱦᱮᱸᱱ ᱢᱮ᱾',

    'scn.gas_01_zone.prompt': 'ᱜᱮᱥ ᱮᱞᱟᱨᱢ ᱨᱟᱜ ᱠᱟᱱᱟ᱾ ᱚᱠᱟ ᱡᱟᱭᱜᱟ ᱫᱚ ᱜᱮᱥ ᱵᱤᱯᱚᱫ ᱡᱚᱱ ᱠᱟᱱᱟ?',
    'scn.gas_01_zone.opt.red_zone': 'ᱟᱨᱟᱜ ᱞᱤᱠ ᱡᱚᱱ',
    'scn.gas_01_zone.opt.open_area': 'ᱠᱷᱚᱞᱟ ᱡᱟᱭᱜᱟ',
    'scn.gas_01_zone.opt.office': 'ᱚᱯᱷᱤᱥ',
    'scn.gas_01_zone.why': 'ᱟᱨᱟᱜ ᱪᱤᱱᱦᱟᱹ ᱡᱚᱱ ᱨᱮ ᱜᱮᱥ ᱞᱤᱠ ᱦᱩᱭ ᱠᱟᱱᱟ᱾ ᱚᱱᱟ ᱠᱷᱚᱱ ᱥᱟᱸᱝᱜᱤᱧ ᱛᱟᱦᱮᱸᱱ ᱢᱮ ᱟᱨ ᱮᱴᱟᱜ ᱦᱚᱲ ᱠᱚ ᱦᱩᱥᱤᱭᱟᱹᱨ ᱢᱮ᱾',

    'scn.gas_02_ppe.prompt': 'ᱟᱢ ᱢᱤᱫᱴᱟᱹᱝ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ (ᱴᱮᱝᱠ/ᱜᱟᱰᱟ) ᱵᱷᱤᱛᱨᱤ ᱞᱟᱹᱫᱮ ᱞᱟᱹᱠᱛᱤᱭᱟ᱾ ᱪᱮᱫ ᱯᱤᱸᱫᱷᱮ ᱞᱟᱹᱠᱛᱤᱭᱟ?',
    'scn.gas_02_ppe.opt.detector_breathing': 'ᱜᱮᱥ ᱰᱤᱴᱮᱠᱴᱚᱨ + ᱥᱟᱦᱮᱫ ᱡᱚᱱᱛᱨᱚ',
    'scn.gas_02_ppe.opt.cap_gloves': 'ᱴᱩᱯᱤ + ᱜᱞᱚᱵᱥ',
    'scn.gas_02_ppe.opt.no_ppe': 'ᱡᱟᱦᱟᱸ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱡᱚᱱᱛᱨᱚ ᱵᱟᱝ',
    'scn.gas_02_ppe.why': 'ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱨᱮ ᱵᱤᱥ ᱜᱮᱥ ᱥᱮ ᱠᱚᱢ ᱚᱠᱥᱤᱡᱮᱱ ᱛᱟᱦᱮᱸᱱ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾ ᱜᱮᱥ ᱰᱤᱴᱮᱠᱴᱚᱨ ᱥᱟᱶᱛᱮ ᱤᱫᱤ ᱢᱮ ᱟᱨ ᱥᱟᱦᱮᱫ ᱡᱚᱱᱛᱨᱚ ᱯᱤᱸᱫᱷᱮ ᱢᱮ᱾',

    'scn.gas_03_buddy.prompt': 'ᱟᱢ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱵᱷᱤᱛᱨᱤ ᱠᱟᱹᱢᱤ ᱚᱠᱛᱚ ᱚᱠᱚᱭ ᱵᱟᱦᱨᱮ ᱛᱟᱦᱮᱸᱱ ᱞᱟᱹᱠᱛᱤᱭᱟ?',
    'scn.gas_03_buddy.opt.attendant': 'ᱢᱤᱫᱦᱚᱲ ᱥᱴᱮᱱᱰᱵᱟᱭ ᱮᱴᱮᱱᱰᱮᱱᱴ (ᱜᱚᱲᱚᱭᱤᱭᱟᱹ)',
    'scn.gas_03_buddy.opt.nobody': 'ᱡᱟᱦᱟᱸᱭ ᱦᱚᱸ ᱵᱟᱝ',
    'scn.gas_03_buddy.opt.phone_later': 'ᱛᱟᱭᱚᱢ ᱛᱮ ᱡᱟᱦᱟᱸᱭ ᱥᱮ ᱯᱷᱚᱱ ᱢᱮ',
    'scn.gas_03_buddy.why': 'ᱥᱴᱮᱱᱰᱵᱟᱭ ᱮᱴᱮᱱᱰᱮᱱᱴ ᱡᱚᱛᱚ ᱚᱠᱛᱚ ᱟᱢ ᱪᱮᱛᱟᱱ ᱧᱮᱞ ᱛᱟᱦᱮᱸᱱᱟ ᱟᱨ ᱡᱩᱫᱤ ᱪᱮᱫ ᱦᱚᱸ ᱵᱷᱩᱞ ᱦᱩᱭᱩᱜ ᱠᱷᱟᱱ ᱡᱷᱟᱴ ᱛᱮ ᱮᱞᱟᱨᱢ ᱮᱢᱟ᱾',

    'common.close': 'ᱵᱚᱸᱫ ᱢᱮ',
    'common.cancel': 'ᱵᱟᱹᱛᱤᱞ',
    'common.loading': 'ᱞᱳᱰ ᱦᱩᱭ ᱠᱟᱱᱟ…',
    'common.seeAll': 'ᱡᱚᱛᱚ ᱧᱮᱞ ᱢᱮ',
    'common.tryAgain': 'ᱫᱚᱦᱲᱟ ᱪᱮᱥᱴᱟᱭ ᱢᱮ',
    'common.done': 'ᱦᱩᱭ ᱮᱱᱟ',
    'common.none': '—',
    'common.prototype': 'ᱯᱨᱳᱴᱳᱴᱟᱭᱤᱯ',

    'theme.title': 'ᱨᱩᱯ',
    'theme.light': 'ᱢᱟᱨᱥᱟᱞ',
    'theme.dark': 'ᱧᱩᱛ',
    'theme.toLight': 'ᱢᱟᱨᱥᱟᱞ ᱛᱷᱤᱢ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    'theme.toDark': 'ᱧᱩᱛ ᱛᱷᱤᱢ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    'effects.title': 'ᱧᱮᱞ ᱤᱯᱷᱮᱠᱴ',
    'effects.full': 'ᱯᱩᱨᱟᱹ',
    'effects.reduced': 'ᱠᱚᱢ',
    'effects.hint': '"ᱠᱚᱢ" ᱵᱟᱪᱷᱟᱣ ᱠᱷᱟᱱ ᱜᱞᱟᱥ ᱵᱞᱚᱨ ᱵᱚᱸᱫᱚᱜᱼᱟ, ᱚᱱᱟ ᱛᱮ ᱠᱚᱢ ᱫᱟᱢ ᱯᱷᱚᱱ ᱨᱮ ᱦᱚᱸ ᱮᱯ ᱥᱚᱦᱮᱡ ᱛᱮ ᱪᱟᱞᱟᱜᱼᱟ᱾',

    'tab.label': 'ᱢᱩᱬᱩᱛ ᱦᱚᱨ ᱩᱫᱩᱜ',
    'tab.home': 'ᱚᱲᱟᱜ',
    'tab.verify': 'ᱡᱟᱺᱪ',
    'tab.train': 'ᱴᱨᱮᱱᱤᱝ',
    'tab.passport': 'ᱯᱟᱥᱯᱚᱨᱴ',
    'tab.me': 'ᱯᱨᱳᱯᱷᱟᱭᱤᱞ',

    'offline.badge': 'ᱚᱯᱷᱞᱟᱭᱤᱱ',
    'offline.title': 'ᱚᱯᱷᱞᱟᱭᱤᱱ ᱛᱮᱭᱟᱨ',
    'offline.text': 'ᱡᱚᱛᱚ ᱴᱨᱮᱱᱤᱝ ᱟᱨ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱜᱮ ᱛᱟᱦᱮᱸᱱᱟ᱾ ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱟᱝ ᱞᱟᱹᱠᱛᱤᱭᱟ᱾',

    'welcome.hero': 'ᱠᱟᱹᱢᱤ ᱡᱟᱭᱜᱟ ᱨᱮ ᱵᱤᱯᱚᱫ ᱥᱟᱢᱟᱝ ᱞᱟᱦᱟ ᱨᱮ AR ᱨᱮ ᱚᱱᱟ ᱟᱵᱷᱭᱟᱥ ᱢᱮ᱾',
    'welcome.feature.ar': 'AR ᱨᱮ ᱵᱤᱯᱚᱫ ᱟᱵᱷᱭᱟᱥ',
    'welcome.feature.cert': 'ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ ᱡᱟᱺᱪ ᱫᱟᱲᱮᱭᱟᱜ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ',
    'welcome.feature.voice': 'ᱥᱟᱱᱛᱟᱲᱤ ᱚᱞ · ᱦᱤᱱᱫᱤ ᱟᱲᱟᱝ',

    'lang.available': 'ᱢᱮᱱᱟᱜᱼᱟ',
    'lang.partial': 'ᱠᱟᱸᱪᱟ ᱛᱚᱨᱡᱚᱢᱟ · ᱥᱟᱱᱛᱟᱲᱤ ᱨᱚᱲᱤᱭᱟᱹ ᱡᱟᱺᱪ ᱵᱟᱠᱤ',
    'lang.planned': 'ᱦᱮᱡ ᱠᱟᱱ ᱯᱟᱹᱨᱥᱤ',
    'lang.plannedNote': 'ᱱᱚᱶᱟ ᱯᱟᱹᱨᱥᱤ ᱠᱚ ᱞᱟᱹᱜᱤᱫ ᱯᱟᱹᱦᱤᱞ ᱢᱩᱞ ᱨᱚᱲᱤᱭᱟᱹ ᱛᱚᱨᱡᱚᱢᱟ ᱞᱟᱹᱠᱛᱤᱭᱟ, ᱚᱱᱟ ᱛᱮ ᱱᱤᱛᱚᱜ ᱵᱟᱝ ᱵᱟᱪᱷᱟᱣ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾',
    'lang.awaiting': 'ᱢᱩᱞ ᱨᱚᱲᱤᱭᱟᱹ ᱥᱟᱢᱜᱽᱨᱤ ᱵᱟᱠᱤ',

    'home.ready': 'ᱛᱮᱦᱮᱧ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱨᱮᱱᱤᱝ ᱞᱟᱹᱜᱤᱫ ᱛᱮᱭᱟᱨ ᱢᱮᱱᱟᱢᱟ?',
    'home.status.title': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱦᱟᱹᱞᱚᱛ',
    'home.status.readiness': 'ᱴᱨᱮᱱᱤᱝ ᱛᱮᱭᱟᱨᱤ',
    'home.status.passedOf': '{total} ᱠᱷᱚᱱ {n} ᱢᱳᱰᱭᱩᱞ ᱯᱟᱥ',
    'home.ppe': 'PPE ᱟᱡ ᱡᱟᱺᱪ',
    'home.ppe.today': 'ᱛᱮᱦᱮᱧ ᱦᱩᱭ ᱮᱱᱟ',
    'home.ppe.notToday': 'ᱛᱮᱦᱮᱧ ᱵᱟᱝ ᱦᱩᱭ ᱟᱠᱟᱱᱟ',
    'home.continue.title': 'ᱴᱨᱮᱱᱤᱝ ᱞᱟᱦᱟ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'home.continue.step': 'ᱫᱷᱟᱯ {step} / {total}',
    'home.continue.cta': 'ᱞᱟᱦᱟ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'home.next.title': 'ᱤᱱᱟᱹ ᱛᱟᱭᱚᱢ',
    'home.next.cta': 'ᱮᱦᱚᱵ ᱢᱮ',
    'home.retry.title': 'ᱫᱚᱦᱲᱟ ᱴᱨᱮᱱᱤᱝ',
    'home.allDone.title': 'ᱡᱚᱛᱚ ᱢᱳᱰᱭᱩᱞ ᱯᱟᱥ',
    'home.allDone.text': 'ᱟᱵᱷᱭᱟᱥ ᱨᱤᱯᱞᱮ ᱛᱮ ᱟᱢᱟᱜ ᱥᱮᱪᱮᱫ ᱱᱟᱣᱟ ᱫᱚᱦᱚ ᱢᱮ᱾',
    'home.quick': 'ᱡᱷᱟᱴ ᱠᱟᱹᱢᱤ',
    'quick.ar': 'AR ᱴᱨᱮᱱᱤᱝ ᱮᱦᱚᱵ ᱢᱮ',
    'quick.ppe': 'PPE ᱡᱟᱺᱪ',
    'quick.drill': 'ᱫᱟᱵᱟᱣ ᱟᱵᱷᱭᱟᱥ',
    'quick.sos': 'ᱤᱢᱟᱨᱡᱮᱱᱥᱤ SOS',

    'today.title': 'ᱛᱮᱦᱮᱧ ᱨᱮᱭᱟᱜ ᱨᱩᱠᱷᱤᱭᱟᱹ',
    'today.streak': 'ᱴᱨᱮᱱᱤᱝ ᱥᱤᱞᱥᱤᱞᱟ',
    'today.streakValue': '{n} ᱢᱟᱦᱟᱸ',
    'today.lastAssessment': 'ᱢᱟᱲᱟᱝ ᱡᱟᱺᱪ',
    'today.nextRefresher': 'ᱤᱱᱟᱹ ᱛᱟᱭᱚᱢ ᱨᱤᱯᱷᱨᱮᱥᱚᱨ',
    'today.clearance': 'ᱡᱚᱱ ᱦᱩᱠᱩᱢ',
    'today.clearanceValue': '{total} ᱠᱷᱚᱱ {n} ᱡᱟᱭᱜᱟ',
    'today.today': 'ᱛᱮᱦᱮᱧ',
    'today.daysAgo': '{days} ᱢᱟᱦᱟᱸ ᱞᱟᱦᱟᱨᱮ',
    'today.inDays': '{days} ᱢᱟᱦᱟᱸ ᱛᱟᱭᱚᱢ',
    'today.dueNow': 'ᱱᱤᱛᱚᱜ ᱵᱟᱠᱤ',

    'home.moreTitle': 'ᱟᱨᱦᱚᱸ',
    'home.nearmiss': 'ᱦᱟᱫᱥᱟ ᱠᱷᱚᱱ ᱵᱟᱧᱪᱟᱣ ᱨᱤᱯᱳᱨᱴ ᱢᱮ',
    'home.alerts': 'ᱠᱷᱚᱵᱚᱨ',

    'coach.card.title': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱠᱳᱪ',
    'coach.card.weak': 'ᱟᱢᱟᱜ ᱢᱟᱲᱟᱝ {module} ᱱᱚᱢᱵᱚᱨ {score} ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ᱾ ᱢᱤᱫᱴᱟᱹᱝ ᱦᱩᱰᱤᱧ ᱟᱵᱷᱭᱟᱥ ᱨᱤᱯᱞᱮ ᱦᱩᱭᱩᱜ ᱢᱟ?',
    'coach.card.due': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱠᱤ ᱢᱮᱱᱟᱜᱼᱟ᱾ 3 ᱢᱤᱱᱤᱴ ᱨᱮᱭᱟᱜ ᱟᱵᱷᱭᱟᱥ ᱨᱤᱯᱞᱮ ᱟᱢ ᱛᱮᱭᱟᱨ ᱫᱚᱦᱚᱭᱟᱢᱟ᱾',
    'coach.card.idle': 'ᱟᱢᱟᱜ ᱴᱨᱮᱱᱤᱝ ᱨᱮᱭᱟᱜ ᱡᱟᱦᱟᱸ ᱵᱤᱯᱚᱫ ᱵᱟᱵᱚᱫ ᱠᱩᱞᱤ ᱢᱮ᱾ ᱛᱮᱞᱟ ᱟᱢᱟᱜ ᱠᱳᱨᱥ ᱠᱷᱚᱱ, ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ᱾',
    'coach.card.cta': 'ᱠᱳᱪ ᱠᱩᱞᱤ ᱢᱮ',
    'coach.card.replay': 'ᱟᱵᱷᱭᱟᱥ ᱨᱤᱯᱞᱮ',

    'train.title': 'ᱴᱨᱮᱱᱤᱝ',
    'train.sub': 'ᱠᱟᱹᱢᱤ ᱡᱟᱭᱜᱟ ᱨᱮ ᱵᱤᱯᱚᱫ ᱥᱟᱢᱟᱝ ᱞᱟᱦᱟ ᱨᱮ AR ᱨᱮ ᱚᱱᱟ ᱟᱵᱷᱭᱟᱥ ᱢᱮ᱾',
    'train.modules': 'ᱢᱳᱰᱭᱩᱞ',
    'train.practice': 'ᱟᱵᱷᱭᱟᱥ',
    'train.steps': '{n} ᱫᱷᱟᱯ',
    'train.ar': 'AR',
    'train.yourTime': 'ᱟᱢᱟᱜ ᱚᱠᱛᱚ {time}',
    'train.replay.title': 'ᱦᱟᱫᱥᱟ ᱨᱤᱯᱞᱮ',
    'train.replay.sub': 'ᱡᱟᱦᱟᱸ ᱵᱟᱪᱷᱟᱣ ᱯᱷᱚᱞ ᱵᱚᱫᱚᱞ ᱠᱮᱫᱟ, ᱚᱱᱟ ᱵᱩᱡᱷᱟᱹᱣ ᱢᱮ᱾',
    'train.drill.title': 'ᱫᱟᱵᱟᱣ ᱟᱵᱷᱭᱟᱥ',
    'train.drill.sub': 'ᱚᱱᱟ ᱜᱮ ᱵᱟᱪᱷᱟᱣ, ᱡᱚᱛᱚ ᱞᱟᱹᱜᱤᱫ {s} ᱥᱮᱠᱮᱱᱰ᱾',
    'train.ppe.title': 'PPE ᱡᱟᱺᱪ',
    'train.ppe.sub': 'ᱡᱚᱱ ᱵᱷᱤᱛᱨᱤ ᱞᱟᱹᱫᱮ ᱞᱟᱦᱟ ᱨᱮ ᱟᱢ ᱛᱮᱭᱟᱨ ᱢᱮᱱᱟᱢᱟ ᱥᱮ ᱵᱟᱝ ᱡᱟᱺᱪ ᱢᱮ᱾',

    'lfp.label': 'ᱴᱨᱮᱱᱤᱝ ᱫᱷᱟᱯ',
    'lfp.learn': 'ᱪᱮᱫ',
    'lfp.find': 'ᱧᱟᱢ',
    'lfp.prove': 'ᱥᱟᱵᱩᱫ',
    'lfp.learn.sub': 'ᱵᱤᱯᱚᱫ ᱠᱚ',
    'lfp.find.sub': 'ᱪᱤᱱᱦᱟᱹᱣ ᱢᱮ',
    'lfp.prove.sub': 'ᱱᱚᱢᱵᱚᱨ ᱧᱟᱢ ᱢᱮ',

    'briefing.learn.title': 'ᱟᱢᱟᱜ ᱥᱟᱢᱟᱝ ᱨᱮ ᱪᱮᱫ ᱦᱮᱡᱟ',
    'briefing.hazard': 'ᱵᱤᱯᱚᱫ {n}',
    'briefing.find.title': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱠᱟᱹᱢᱤ ᱧᱟᱢ ᱢᱮ',
    'briefing.find.ar': 'AR ᱴᱨᱮᱱᱟᱨ ᱩᱱᱩᱫᱩᱜ ᱟᱢᱟᱜ ᱥᱟᱢᱟᱝ ᱨᱮ ᱫᱚᱦᱚᱭᱟ᱾ ᱡᱚᱛᱚ ᱫᱷᱟᱯ ᱨᱮ ᱡᱚᱛᱚ ᱠᱷᱚᱱ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱪᱷᱟᱣ ᱴᱮᱯ ᱢᱮ᱾',
    'briefing.find.web': 'ᱱᱚᱸᱰᱮ AR ᱵᱟᱹᱱᱩᱜᱼᱟ, ᱚᱱᱟ ᱛᱮ ᱱᱚᱶᱟ ᱥᱠᱨᱤᱱ ᱨᱮᱜᱮ ᱛᱮᱞᱟ ᱮᱢ ᱢᱮ᱾',
    'briefing.prove.title': 'ᱥᱟᱵᱩᱫ ᱢᱮ',
    'briefing.prove.text': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱧᱟᱢ ᱞᱟᱹᱜᱤᱫ {mark} ᱥᱮ ᱵᱮᱥᱤ ᱱᱚᱢᱵᱚᱨ ᱧᱟᱢ ᱢᱮ᱾',
    'briefing.mode.ar': 'AR ᱢᱳᱰ',
    'briefing.mode.web': 'ᱥᱠᱨᱤᱱ ᱢᱳᱰ',

    'res.excellent': 'ᱟᱹᱰᱤ ᱵᱮᱥ · ᱡᱚᱛᱚ ᱫᱷᱟᱯ ᱨᱩᱠᱷᱤᱭᱟᱹ',
    'res.good': 'ᱵᱮᱥ ᱠᱟᱹᱢᱤ',
    'res.practice': 'ᱟᱵᱷᱭᱟᱥ ᱞᱟᱦᱟ ᱪᱟᱞᱟᱜ ᱢᱮ',
    'res.metric.safe': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱪᱷᱟᱣ',
    'res.metric.accuracy': 'ᱴᱷᱤᱠ ᱛᱮᱞᱟ',
    'res.metric.mistakes': 'ᱵᱷᱩᱞ',
    'res.metric.time': 'ᱞᱟᱜᱟᱣ ᱚᱠᱛᱚ',
    'res.timeMin': '{m} ᱢᱤᱱᱤᱴ {s} ᱥᱮᱠᱮᱱᱰ',
    'res.timeSec': '{s} ᱥᱮᱠᱮᱱᱰ',
    'res.wellDone': 'ᱟᱢ ᱡᱚᱛᱚ ᱫᱷᱟᱣ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱠᱟᱹᱢᱤ ᱵᱟᱪᱷᱟᱣ ᱠᱮᱫᱟ᱾',
    'res.practiceAgain': 'ᱵᱷᱩᱞ ᱫᱷᱟᱯ ᱠᱚ ᱨᱤᱯᱞᱮ ᱛᱮ ᱟᱵᱷᱭᱟᱥ ᱢᱮ᱾',
    'res.replayCta': 'ᱟᱵᱷᱭᱟᱥ ᱨᱤᱯᱞᱮ ᱮᱦᱚᱵ ᱢᱮ',
    'res.passport': 'ᱯᱟᱥᱯᱚᱨᱴ ᱧᱮᱞ ᱢᱮ',

    'passport.title': 'ᱥᱩᱨᱚᱠᱥᱟ ᱯᱟᱥᱯᱚᱨᱴ',
    'passport.sub': 'ᱟᱢᱟᱜ ᱰᱤᱡᱤᱴᱟᱞ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱪᱤᱱᱦᱟᱹ',
    'passport.verified': 'ᱡᱟᱺᱪ ᱦᱩᱭ ᱮᱱᱟ',
    'passport.attention': 'ᱦᱩᱥᱤᱭᱟᱹᱨ',
    'passport.none': 'ᱱᱤᱛᱚᱜ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'passport.role': 'ᱠᱟᱹᱢᱤᱭᱟᱹ',
    'passport.training': 'ᱴᱨᱮᱱᱤᱝ ᱯᱩᱨᱟᱹᱣ',
    'passport.ppe': 'PPE ᱟᱡ ᱡᱟᱺᱪ',
    'passport.zones': 'ᱡᱚᱱ ᱦᱩᱠᱩᱢ',
    'passport.zone.fire_explosion': 'ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ ᱡᱟᱭᱜᱟ',
    'passport.zone.gas_confined': 'ᱜᱮᱥ ᱟᱨ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ',
    'passport.zone.cleared': 'ᱦᱩᱠᱩᱢ ᱢᱮᱱᱟᱜᱼᱟ',
    'passport.zone.refresher': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱠᱤ',
    'passport.zone.notCleared': 'ᱦᱩᱠᱩᱢ ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'passport.zone.expires': '{date} ᱦᱟᱹᱵᱤᱡ ᱢᱟᱱᱚᱛ',
    'passport.zone.needs': 'ᱦᱩᱠᱩᱢ ᱞᱟᱹᱜᱤᱫ ᱱᱚᱶᱟ ᱢᱳᱰᱭᱩᱞ ᱯᱟᱥ ᱢᱮ',
    'passport.zone.rule': 'ᱰᱮᱢᱳ ᱱᱤᱭᱚᱢ: ᱢᱳᱰᱭᱩᱞ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱢᱟᱱᱚᱛ ᱟᱨ ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱝ ᱵᱟᱠᱤ ᱠᱷᱟᱱ ᱜᱮ ᱦᱩᱠᱩᱢ᱾',
    'passport.scan': 'ᱜᱮᱴ ᱨᱮ ᱥᱠᱮᱱ ᱢᱮ',
    'passport.qrHint': 'ᱱᱚᱶᱟ ᱮᱯ ᱢᱮᱱᱟᱜ ᱡᱟᱦᱟᱸ ᱯᱷᱚᱱ ᱦᱚᱸ ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ ᱱᱚᱶᱟ ᱡᱟᱺᱪ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾',
    'passport.details': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱤᱵᱨᱚᱬ',
    'passport.code': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ',
    'verify.scanNote': 'ᱱᱚᱶᱟ ᱵᱤᱞᱰ ᱨᱮ ᱠᱮᱢᱮᱨᱟ ᱛᱮ QR ᱥᱠᱮᱱ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱠᱳᱰ ᱯᱮᱥᱴ ᱢᱮ᱾',

    'ppe.title': 'PPE ᱡᱟᱺᱪ',
    'ppe.sub': 'ᱡᱚᱱ ᱵᱷᱤᱛᱨᱤ ᱞᱟᱹᱫᱮ ᱞᱟᱦᱟ ᱨᱮ ᱟᱢ ᱛᱮᱭᱟᱨ ᱢᱮᱱᱟᱢᱟ ᱥᱮ ᱵᱟᱝ ᱡᱟᱺᱪ ᱢᱮ᱾',
    'ppe.selfNote': 'ᱟᱡ ᱡᱟᱺᱪ: ᱱᱚᱶᱟ ᱵᱤᱞᱰ ᱨᱮ ᱠᱮᱢᱮᱨᱟ ᱪᱤᱱᱦᱟᱹᱣ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱡᱚᱛᱚ ᱡᱤᱱᱤᱥ ᱥᱟᱹᱨᱤ ᱛᱮ ᱪᱤᱱᱦᱟᱹ ᱢᱮ᱾',
    'ppe.item.helmet': 'ᱦᱮᱞᱢᱮᱴ',
    'ppe.item.vest': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱡᱮᱠᱮᱴ',
    'ppe.item.gloves': 'ᱜᱞᱚᱵᱥ',
    'ppe.item.shoes': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱡᱩᱛᱟ',
    'ppe.item.goggles': 'ᱢᱮᱫ ᱨᱩᱠᱷᱤᱭᱟᱹ',
    'ppe.state.yes': 'ᱯᱤᱸᱫᱷᱮ ᱟᱠᱟᱫᱟ',
    'ppe.state.no': 'ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'ppe.state.unsure': 'ᱵᱟᱝ ᱵᱟᱰᱟᱭᱟ',
    'ppe.confirm': 'ᱡᱟᱺᱪ ᱫᱚᱦᱚ ᱢᱮ',
    'ppe.result.ready': 'ᱟᱢ ᱛᱮᱭᱟᱨ ᱢᱮᱱᱟᱢᱟ',
    'ppe.result.readyText': 'ᱡᱚᱛᱚ ᱡᱤᱱᱤᱥ ᱡᱟᱺᱪ ᱮᱱᱟ᱾ ᱡᱚᱱ ᱨᱮ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱮ ᱛᱟᱦᱮᱸᱱ ᱢᱮ᱾',
    'ppe.result.missing': 'ᱱᱤᱛᱚᱜ ᱵᱷᱤᱛᱨᱤ ᱞᱟᱹᱫᱮ ᱟᱞᱚᱢ',
    'ppe.result.missingText': '{n} ᱡᱤᱱᱤᱥ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱡᱚᱱ ᱵᱷᱤᱛᱨᱤ ᱞᱟᱹᱫᱮ ᱞᱟᱦᱟ ᱨᱮ ᱴᱷᱤᱠ ᱢᱮ᱾',
    'ppe.result.review': 'ᱟᱢᱟᱜ ᱴᱨᱮᱱᱟᱨ ᱥᱟᱶᱛᱮ ᱡᱟᱺᱪ ᱢᱮ',
    'ppe.result.reviewText': 'ᱛᱤᱱᱟᱹᱜ ᱜᱟᱱ ᱡᱤᱱᱤᱥ "ᱵᱟᱝ ᱵᱟᱰᱟᱭᱟ" ᱢᱮᱱᱟᱜᱼᱟ᱾ ᱟᱢᱟᱜ ᱴᱨᱮᱱᱟᱨ ᱥᱟᱶᱛᱮ ᱡᱟᱺᱪ ᱢᱮ; ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ ᱱᱚᱶᱟ ᱡᱟᱺᱪ ᱛᱟᱞᱤᱠᱟ ᱨᱮ ᱢᱮᱱᱟᱜᱼᱟ᱾',
    'ppe.incomplete': 'ᱯᱟᱹᱦᱤᱞ ᱡᱚᱛᱚ ᱡᱤᱱᱤᱥ ᱪᱤᱱᱦᱟᱹ ᱢᱮ᱾',
    'ppe.last': 'ᱢᱟᱲᱟᱝ ᱡᱟᱺᱪ {date}',
    'ppe.history': 'ᱱᱤᱛᱚᱜ ᱨᱮᱭᱟᱜ ᱡᱟᱺᱪ',

    'replay.title': 'ᱦᱟᱫᱥᱟ ᱨᱤᱯᱞᱮ',
    'replay.sub': 'ᱡᱟᱦᱟᱸ ᱵᱟᱪᱷᱟᱣ ᱯᱷᱚᱞ ᱵᱚᱫᱚᱞ ᱠᱮᱫᱟ, ᱚᱱᱟ ᱵᱩᱡᱷᱟᱹᱣ ᱢᱮ᱾',
    'replay.note': 'ᱠᱷᱟᱹᱞᱤ ᱟᱵᱷᱭᱟᱥ: ᱱᱚᱢᱵᱚᱨ ᱵᱟᱝ ᱧᱟᱢᱚᱜᱼᱟ ᱟᱨ ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ ᱦᱚᱸ ᱵᱟᱝ ᱧᱟᱢᱚᱜᱼᱟ᱾',
    'replay.choose': 'ᱢᱤᱫᱴᱟᱹᱝ ᱦᱟᱹᱞᱚᱛ ᱵᱟᱪᱷᱟᱣ ᱢᱮ',
    'replay.moment': 'ᱢᱚᱦᱚᱛ ᱵᱟᱪᱷᱟᱣ {n} / {total}',
    'replay.ask': 'ᱟᱢ ᱪᱮᱫ ᱠᱟᱹᱢᱤ ᱟᱢ?',
    'replay.safe': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱪᱷᱟᱣ',
    'replay.unsafe': 'ᱱᱚᱶᱟ ᱵᱟᱪᱷᱟᱣ ᱦᱟᱫᱥᱟ ᱥᱮᱫ ᱤᱫᱤᱭᱟ',
    'replay.timeUp': 'ᱚᱠᱛᱚ ᱢᱩᱪᱟᱹᱫ᱾ ᱛᱤᱝᱜᱩ ᱛᱟᱦᱮᱸᱱ ᱦᱚᱸ ᱢᱤᱫᱴᱟᱹᱝ ᱵᱟᱪᱷᱟᱣ ᱜᱮᱭᱟ᱾',
    'replay.next': 'ᱤᱱᱟᱹ ᱛᱟᱭᱚᱢ',
    'replay.finish': 'ᱥᱟᱨᱟᱝᱥ ᱧᱮᱞ ᱢᱮ',
    'replay.done': 'ᱨᱤᱯᱞᱮ ᱯᱩᱨᱟᱹᱣ ᱮᱱᱟ',
    'replay.doneText': 'ᱟᱢ {total} ᱠᱷᱚᱱ {n} ᱫᱷᱟᱣ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱪᱷᱟᱣ ᱠᱮᱫᱟ᱾',
    'replay.avgTime': 'ᱥᱟᱫᱷᱟᱨᱚᱬ ᱵᱟᱪᱷᱟᱣ ᱚᱠᱛᱚ {s} ᱥᱮᱠᱮᱱᱰ',
    'replay.again': 'ᱫᱚᱦᱲᱟ ᱨᱤᱯᱞᱮ',

    'drill.title': 'ᱫᱟᱵᱟᱣ ᱟᱵᱷᱭᱟᱥ',
    'drill.sub': 'ᱴᱟᱭᱢᱟᱨ ᱢᱩᱪᱟᱹᱫ ᱞᱟᱦᱟ ᱨᱮ ᱵᱟᱪᱷᱟᱣ ᱢᱮ᱾',
    'drill.secondsLeft': '{s} ᱥᱮᱠᱮᱱᱰ ᱵᱟᱠᱤ',

    'coach.title': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱠᱳᱪ',
    'coach.sub': 'ᱟᱢᱟᱜ ᱱᱤᱡᱮᱨ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱨᱮᱱᱟᱨ',
    'coach.note': 'ᱚᱯᱷᱞᱟᱭᱤᱱ ᱜᱟᱭᱤᱰ: ᱛᱮᱞᱟ ᱟᱢᱟᱜ ᱦᱟᱛᱟᱣ ᱴᱨᱮᱱᱤᱝ ᱥᱟᱢᱜᱽᱨᱤ ᱠᱷᱚᱱ ᱦᱮᱡᱚᱜᱼᱟ᱾ ᱱᱚᱶᱟ AI ᱢᱳᱰᱮᱞ ᱵᱟᱝ ᱠᱟᱱᱟ᱾',
    'coach.placeholder': 'ᱟᱢᱟᱜ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱠᱳᱪ ᱠᱩᱞᱤ ᱢᱮ…',
    'coach.send': 'ᱠᱩᱞ ᱢᱮ',
    'coach.voiceOff': 'ᱨᱚᱲ ᱠᱟᱛᱮ ᱠᱩᱞᱤ ᱱᱤᱛᱚᱜ ᱚᱯᱷᱞᱟᱭᱤᱱ ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'coach.you': 'ᱟᱢ',
    'coach.bot': 'ᱠᱳᱪ',
    'coach.prompt.explain': 'ᱱᱚᱶᱟ ᱵᱤᱯᱚᱫ ᱵᱩᱡᱷᱟᱹᱣ ᱢᱮ',
    'coach.prompt.refresher': 'ᱤᱧ ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱮᱢ ᱢᱮ',
    'coach.prompt.ppe': 'ᱤᱧ ᱚᱠᱟ PPE ᱞᱟᱹᱠᱛᱤᱭᱟ?',
    'coach.prompt.test': 'ᱤᱧ ᱡᱟᱺᱪ ᱢᱮ',
    'coach.prompt.why': 'ᱤᱧ ᱪᱮᱫᱟᱜ ᱯᱷᱮᱞ ᱞᱮᱱᱟ?',
    'coach.hello': 'ᱡᱚᱦᱟᱨ {name}! ᱥᱮᱸᱜᱮᱞ, ᱫᱷᱩᱸᱣᱟᱹ, ᱥᱮᱸᱜᱮᱞ ᱧᱤᱵᱷᱟᱹᱣ ᱡᱚᱱᱛᱨᱚ, ᱜᱮᱥ ᱞᱤᱠ, ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱥᱮ PPE ᱵᱟᱵᱚᱫ ᱠᱩᱞᱤ ᱢᱮ᱾',
    'coach.ans.explain': 'ᱚᱠᱟ ᱵᱤᱯᱚᱫ? ᱢᱤᱫᱴᱟᱹᱝ ᱵᱟᱪᱷᱟᱣ ᱢᱮ:',
    'coach.ans.ppe': 'ᱡᱟᱦᱟᱸ ᱡᱚᱱ ᱞᱟᱦᱟ ᱨᱮ: ᱦᱮᱞᱢᱮᱴ, ᱨᱩᱠᱷᱤᱭᱟᱹ ᱡᱮᱠᱮᱴ, ᱜᱞᱚᱵᱥ, ᱨᱩᱠᱷᱤᱭᱟᱹ ᱡᱩᱛᱟ ᱟᱨ ᱢᱮᱫ ᱨᱩᱠᱷᱤᱭᱟᱹ᱾ ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ ᱞᱟᱹᱜᱤᱫ ᱜᱮᱥ ᱰᱤᱴᱮᱠᱴᱚᱨ ᱦᱚᱸ ᱥᱟᱶᱛᱮ ᱤᱫᱤ ᱢᱮ, ᱥᱟᱦᱮᱫ ᱡᱚᱱᱛᱨᱚ ᱯᱤᱸᱫᱷᱮ ᱢᱮ ᱟᱨ ᱵᱟᱦᱨᱮ ᱢᱤᱫᱦᱚᱲ ᱥᱴᱮᱱᱰᱵᱟᱭ ᱮᱴᱮᱱᱰᱮᱱᱴ ᱫᱚᱦᱚ ᱢᱮ᱾',
    'coach.ans.refresher': 'ᱦᱩᱰᱤᱧ ᱨᱤᱯᱷᱨᱮᱥᱚᱨ · {module}:',
    'coach.ans.whyNone': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ ᱟᱢᱟᱜ ᱡᱟᱦᱟᱸ ᱯᱷᱮᱞ ᱪᱮᱥᱴᱟ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾ ᱟᱹᱰᱤ ᱵᱮᱥ!',
    'coach.ans.why': 'ᱟᱢᱟᱜ ᱢᱟᱲᱟᱝ {module} ᱪᱮᱥᱴᱟ ᱨᱮ {wrong} ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱟᱝ ᱵᱟᱪᱷᱟᱣ ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ᱾ ᱚᱱᱟ ᱢᱳᱰᱭᱩᱞ ᱨᱮᱭᱟᱜ ᱱᱤᱭᱚᱢ ᱫᱚ ᱱᱚᱶᱟ ᱠᱟᱱᱟ:',
    'coach.ans.test': 'ᱫᱟᱵᱟᱣ ᱟᱵᱷᱭᱟᱥ ᱪᱮᱥᱴᱟᱭ ᱢᱮ: ᱡᱚᱛᱚ ᱵᱟᱪᱷᱟᱣ ᱞᱟᱹᱜᱤᱫ {s} ᱥᱮᱠᱮᱱᱰ᱾',
    'coach.ans.unknown': 'ᱤᱧ ᱠᱷᱟᱹᱞᱤ ᱟᱢᱟᱜ ᱴᱨᱮᱱᱤᱝ ᱥᱟᱢᱜᱽᱨᱤ ᱠᱷᱚᱱ ᱛᱮᱞᱟ ᱮᱢ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾ ᱪᱮᱥᱴᱟᱭ ᱢᱮ: ᱥᱮᱸᱜᱮᱞ, ᱫᱷᱩᱸᱣᱟᱹ, ᱥᱮᱸᱜᱮᱞ ᱧᱤᱵᱷᱟᱹᱣ, ᱜᱮᱥ, ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ, PPE᱾',
    'coach.openDrill': 'ᱫᱟᱵᱟᱣ ᱟᱵᱷᱭᱟᱥ ᱡᱷᱤᱡᱽ ᱢᱮ',
    'coach.openReplay': 'ᱨᱤᱯᱞᱮ ᱡᱷᱤᱡᱽ ᱢᱮ',

    'sos.title': 'ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱜᱚᱲᱚ',
    'sos.ask': 'ᱪᱮᱫ ᱦᱩᱭ ᱮᱱᱟ?',
    'sos.type.injury': 'ᱦᱟᱹᱥᱩ',
    'sos.type.fire': 'ᱥᱮᱸᱜᱮᱞ',
    'sos.type.gas': 'ᱜᱮᱥ ᱞᱤᱠ',
    'sos.type.equipment': 'ᱢᱮᱥᱤᱱ ᱦᱟᱫᱥᱟ',
    'sos.type.other': 'ᱮᱴᱟᱜ',
    'sos.proto': 'ᱯᱨᱳᱴᱳᱴᱟᱭᱤᱯ: ᱱᱚᱶᱟ ᱵᱤᱞᱰ ᱨᱮ ᱱᱮᱴᱣᱟᱨᱠ ᱵᱟᱹᱱᱩᱜᱼᱟ, ᱚᱱᱟ ᱛᱮ ᱡᱟᱦᱟᱸ ᱦᱚᱸ ᱯᱷᱚᱱ ᱠᱷᱚᱱ ᱵᱟᱝ ᱪᱟᱞᱟᱜᱼᱟ᱾ ᱜᱚᱲᱚ ᱞᱟᱹᱜᱤᱫ ᱦᱩᱦᱟᱹ ᱨᱟᱜ ᱢᱮ ᱟᱨ ᱠᱟᱹᱢᱤ ᱡᱟᱭᱜᱟ ᱨᱮᱭᱟᱜ ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱯᱞᱟᱱ ᱢᱟᱱᱟᱣ ᱢᱮ᱾',
    'sos.confirmTitle': 'ᱱᱚᱶᱟ ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱚᱞ ᱫᱚᱦᱚ ᱟᱢ?',
    'sos.log': 'ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱚᱞ ᱫᱚᱦᱚ ᱢᱮ',
    'sos.location': 'ᱡᱟᱭᱜᱟ',
    'sos.locationNone': 'ᱱᱚᱶᱟ ᱵᱤᱞᱰ ᱨᱮ ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'sos.worker': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ID',
    'sos.time': 'ᱚᱠᱛᱚ',
    'sos.status': 'ᱦᱟᱹᱞᱚᱛ',
    'sos.statusLogged': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ ᱚᱞ ᱫᱚᱦᱚ · ᱵᱟᱝ ᱠᱩᱞ ᱟᱠᱟᱱᱟ',
    'sos.logged': 'ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱚᱞ ᱫᱚᱦᱚ ᱮᱱᱟ',
    'sos.loggedText': 'ᱱᱤᱛᱚᱜ ᱟᱡ ᱛᱮ ᱜᱚᱲᱚ ᱧᱟᱢ ᱢᱮ: ᱟᱢᱟᱜ ᱥᱩᱯᱚᱨᱵᱟᱭᱡᱚᱨ ᱞᱟᱹᱭ ᱟᱨ ᱠᱟᱹᱢᱤ ᱡᱟᱭᱜᱟ ᱨᱮᱭᱟᱜ ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱯᱞᱟᱱ ᱢᱟᱱᱟᱣ ᱢᱮ᱾',
    'sos.history': 'ᱤᱢᱟᱨᱡᱮᱱᱥᱤ ᱨᱮᱠᱚᱨᱰ',

    'nm.title': 'ᱦᱟᱫᱥᱟ ᱠᱷᱚᱱ ᱵᱟᱧᱪᱟᱣ ᱨᱤᱯᱳᱨᱴ',
    'nm.sub': 'ᱪᱮᱫ ᱦᱚᱸ ᱵᱷᱩᱞ ᱦᱩᱭ ᱦᱩᱭ ᱛᱮ ᱵᱟᱧᱪᱟᱣ ᱮᱱᱟ? ᱨᱤᱯᱳᱨᱴ ᱛᱮ ᱤᱱᱟᱹ ᱛᱟᱭᱚᱢ ᱨᱮᱭᱟᱜ ᱦᱟᱫᱥᱟ ᱛᱟᱲᱟᱝᱚᱜᱼᱟ᱾',
    'nm.severity': 'ᱵᱤᱯᱚᱫ ᱫᱷᱟᱯ',
    'nm.sev.low': 'ᱠᱚᱢ',
    'nm.sev.medium': 'ᱛᱟᱞᱟ',
    'nm.sev.high': 'ᱵᱮᱥᱤ',
    'nm.location': 'ᱡᱟᱭᱜᱟ',
    'nm.locationPh': 'ᱫᱟᱹᱭᱠᱟᱹ: ᱠᱨᱟᱥᱚᱨ ᱡᱟᱭᱜᱟ, ᱡᱚᱱ 4',
    'nm.desc': 'ᱪᱮᱫ ᱦᱩᱭ ᱮᱱᱟ?',
    'nm.descPh': 'ᱪᱮᱫ ᱧᱮᱞ ᱠᱮᱫᱟᱢ ᱚᱱᱟ ᱚᱞ ᱢᱮ',
    'nm.submit': 'ᱨᱤᱯᱳᱨᱴ ᱫᱚᱦᱚ ᱢᱮ',
    'nm.saved': 'ᱨᱤᱯᱳᱨᱴ ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮ ᱫᱚᱦᱚ ᱮᱱᱟ᱾',
    'nm.errDesc': 'ᱪᱮᱫ ᱦᱩᱭ ᱮᱱᱟ ᱚᱞ ᱢᱮ (ᱠᱚᱢ ᱥᱮ ᱠᱚᱢ 10 ᱟᱠᱷᱚᱨ)᱾',
    'nm.errLocation': 'ᱚᱠᱟᱨᱮ ᱦᱩᱭ ᱮᱱᱟ ᱚᱞ ᱢᱮ᱾',
    'nm.photoNote': 'ᱯᱷᱚᱴᱚ ᱥᱮᱞᱮᱫ ᱞᱟᱹᱜᱤᱫ ᱠᱮᱢᱮᱨᱟ ᱥᱩᱵᱤᱫᱷᱟ ᱞᱟᱹᱠᱛᱤᱭᱟ, ᱱᱚᱶᱟ ᱵᱤᱞᱰ ᱨᱮ ᱵᱟᱹᱱᱩᱜᱼᱟ᱾',
    'nm.localNote': 'ᱠᱷᱟᱹᱞᱤ ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱜᱮ ᱫᱚᱦᱚᱜᱼᱟ᱾ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱚᱯᱷᱤᱥᱚᱨ ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱭᱟᱜ ᱢᱮᱱᱮᱡᱢᱮᱱᱴ ᱯᱚᱨᱴᱟᱞ ᱨᱮ ᱱᱚᱶᱟ ᱧᱮᱞ ᱫᱟᱲᱮᱭᱟᱜᱼᱟ᱾',
    'nm.mine': 'ᱤᱧᱟᱜ ᱨᱤᱯᱳᱨᱴ',
    'nm.none': 'ᱱᱤᱛᱚᱜ ᱡᱟᱦᱟᱸ ᱨᱤᱯᱳᱨᱴ ᱵᱟᱹᱱᱩᱜᱼᱟ',
    'nm.noneText': 'ᱟᱢᱟᱜ ᱦᱟᱫᱥᱟ ᱠᱷᱚᱱ ᱵᱟᱧᱪᱟᱣ ᱨᱤᱯᱳᱨᱴ ᱱᱚᱸᱰᱮ ᱧᱮᱞᱚᱜᱼᱟ᱾',
    'nm.status.open': 'ᱠᱷᱚᱞᱟ',
    'nm.status.investigating': 'ᱡᱟᱺᱪ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ',
    'nm.status.resolved': 'ᱥᱚᱢᱟᱫᱷᱟᱱ ᱮᱱᱟ',

    'alerts.title': 'ᱠᱷᱚᱵᱚᱨ',
    'alerts.none': 'ᱡᱚᱛᱚ ᱴᱷᱤᱠ ᱜᱮᱭᱟ',
    'alerts.noneText': 'ᱴᱨᱮᱱᱤᱝ ᱩᱭᱦᱟᱹᱨ ᱠᱷᱚᱵᱚᱨ ᱱᱚᱸᱰᱮ ᱧᱮᱞᱚᱜᱼᱟ᱾',
    'alerts.refresher': 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ ᱵᱟᱠᱤ · {module}',
    'alerts.refresherText': 'ᱟᱢᱟᱜ ᱢᱟᱲᱟᱝ ᱴᱨᱮᱱᱤᱝ {days} ᱢᱟᱦᱟᱸ ᱞᱟᱦᱟᱨᱮ ᱦᱩᱭ ᱞᱮᱱᱟ᱾',
    'alerts.expiring': 'ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ {date} ᱢᱟᱦᱟᱸ ᱢᱩᱪᱟᱹᱫᱚᱜᱼᱟ',
    'alerts.notStarted': '{module} ᱵᱟᱝ ᱮᱦᱚᱵ ᱟᱠᱟᱱᱟ',
    'alerts.notStartedText': 'ᱡᱚᱱ ᱦᱩᱠᱩᱢ ᱞᱟᱹᱜᱤᱫ ᱱᱚᱶᱟ ᱯᱩᱨᱟᱹᱣ ᱢᱮ᱾',
    'alerts.ppe': 'ᱛᱮᱦᱮᱧ PPE ᱟᱡ ᱡᱟᱺᱪ ᱵᱟᱝ ᱦᱩᱭ ᱟᱠᱟᱱᱟ',
    'alerts.assignment': 'ᱮᱢ ᱟᱠᱟᱱᱟ · {module}',
    'alerts.assignmentText': '{date} ᱦᱟᱹᱵᱤᱡ',

    'me.title': 'ᱯᱨᱳᱯᱷᱟᱭᱤᱞ',
    'me.settings': 'ᱥᱮᱴᱤᱝ',
    'me.language': 'ᱯᱟᱹᱨᱥᱤ',
    'me.editWorker': 'ᱠᱟᱹᱢᱤᱭᱟᱹ ᱵᱤᱵᱨᱚᱬ ᱵᱚᱫᱚᱞ ᱢᱮ',
    'me.safety': 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱡᱚᱱᱛᱨᱚ',
    'me.data': 'ᱱᱚᱶᱟ ᱯᱷᱚᱱ ᱨᱮᱭᱟᱜ ᱰᱟᱴᱟ',
    'me.stats': '{attempts} ᱪᱮᱥᱴᱟ · {certs} ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ',
    'me.about': 'ᱵᱟᱵᱚᱫ',
    'me.version': 'ᱯᱨᱳᱴᱳᱴᱟᱭᱤᱯ ᱵᱤᱞᱰ · ᱤᱱᱴᱚᱨᱱᱮᱴ ᱵᱤᱱᱟᱹ ᱪᱟᱞᱟᱜᱼᱟ',

    'voice.label': 'ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ',
    'voice.play': 'ᱟᱸᱡᱚᱢ ᱢᱮ',
    'voice.replay': 'ᱫᱚᱦᱲᱟ ᱟᱸᱡᱚᱢ ᱢᱮ',
    'voice.stop': 'ᱛᱤᱝᱜᱩ ᱢᱮ',
    'voice.playing': 'ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ…',
    'voice.unavailable': 'ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ ᱱᱤᱛᱚᱜ ᱵᱟᱝ ᱨᱮᱠᱚᱨᱰ ᱟᱠᱟᱱᱟ · ᱠᱷᱟᱹᱞᱤ ᱚᱞ',
    'voice.error': 'ᱟᱲᱟᱝ ᱵᱟᱝ ᱪᱟᱞᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ ᱠᱟᱱᱟ᱾',
    'sat.reference': 'ᱦᱤᱱᱫᱤ ᱢᱩᱞ ᱚᱞ'
  };

  /** Keys deliberately left untranslated (fall back to Hindi), with the reason. Empty today. */
  var FALLBACK = {};

  /**
   * Native-speaker sign-offs: { key: { reviewer, date, note } }. EMPTY: no native review has
   * taken place yet. Only a real reviewer's record may be added here (docs/SANTALI_LOCALIZATION.md).
   */
  var REVIEW_LOG = {};

  // Safety-critical text: wrong wording could make a worker take an unsafe action.
  var SAFETY_PREFIXES = ['scn.', 'ar.', 'assess.', 'module.', 'briefing.', 'ppe.', 'sos.', 'coach.ans.', 'nm.', 'err.arUnavailable'];

  var REVIEW = { REQUIRED: 'native-review-required', REVIEWED: 'native-reviewed', FALLBACK: 'fallback-hindi' };

  function isSafetyCritical(key) {
    return SAFETY_PREFIXES.some(function (p) { return key.indexOf(p) === 0; });
  }

  /**
   * Review status of one Santali text. present: whether Santali text exists (defaults to this
   * file; module titles live in 25_SCENARIO_CONTENT.json and are checked as 'title.<moduleId>').
   */
  function review(key, present) {
    if (Object.prototype.hasOwnProperty.call(REVIEW_LOG, key)) return REVIEW.REVIEWED;
    if (present === undefined) present = Object.prototype.hasOwnProperty.call(sat, key);
    return present ? REVIEW.REQUIRED : REVIEW.FALLBACK;
  }

  /** True when Santali text for this key needs the Hindi original shown beside it. */
  function needsReference(key) {
    return isSafetyCritical(key) && review(key) === REVIEW.REQUIRED;
  }

  if (!SA.STRINGS) throw new Error('santali.js must load after strings.js and ui-strings.js');
  Object.keys(sat).forEach(function (k) { SA.STRINGS.sat[k] = sat[k]; });

  SA.SANTALI_FALLBACK = FALLBACK;
  SA.santali = {
    REVIEW: REVIEW,
    SCRIPT: 'Olck',
    review: review,
    isSafetyCritical: isSafetyCritical,
    needsReference: needsReference,
    reviewLog: function () { return REVIEW_LOG; },
    keys: function () { return Object.keys(sat); }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
