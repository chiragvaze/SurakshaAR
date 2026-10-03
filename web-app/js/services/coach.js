/*
 * Offline Safety Coach engine. NOT an AI model: it matches the question against the approved
 * scenario content (prompts, options, explanations in SA.STRINGS) and a small keyword list,
 * and answers only with that content. Unknown questions get an honest "I can only answer from
 * your training" reply. Nothing leaves the device.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  // Extra Hindi/English/Santali (provisional) keywords per scenario step (the step's own text is always searched too).
  var ALIASES = {
    fire_01_exit: ['exit', 'lift', 'elevator', 'window', 'alarm', 'escape', 'leave', 'निकास', 'लिफ्ट', 'खिड़की', 'अलार्म', 'बाहर', 'ᱚᱰᱚᱠ', 'ᱞᱤᱯᱷᱴ', 'ᱡᱷᱚᱨᱠᱟ', 'ᱮᱞᱟᱨᱢ'],
    fire_02_extinguisher: ['extinguisher', 'co2', 'electrical', 'electric', 'panel', 'water', 'foam', 'अग्निशामक', 'बिजली', 'पानी', 'फोम', 'झाग', 'ᱧᱤᱵᱷᱟᱹᱣ', 'ᱵᱤᱡᱞᱤ', 'ᱯᱷᱚᱢ'],
    fire_03_smoke: ['smoke', 'crawl', 'corridor', 'breathe', 'धुआँ', 'धुआं', 'धुंआ', 'रेंग', 'गलियारे', 'ᱫᱷᱩᱸᱣᱟᱹ', 'ᱜᱟᱞᱤ'],
    gas_01_zone: ['gas', 'leak', 'zone', 'red', 'smell', 'गैस', 'रिसाव', 'लीक', 'ज़ोन', 'जोन', 'लाल', 'ᱜᱮᱥ', 'ᱞᱤᱠ', 'ᱡᱚᱱ', 'ᱟᱨᱟᱜ'],
    gas_02_ppe: ['confined', 'tank', 'pit', 'breathing', 'detector', 'oxygen', 'सीमित', 'टैंक', 'गड्ढा', 'श्वास', 'डिटेक्टर', 'ऑक्सीजन', 'ᱵᱚᱸᱫ', 'ᱴᱮᱝᱠ', 'ᱜᱟᱰᱟ', 'ᱥᱟᱦᱮᱫ', 'ᱰᱤᱴᱮᱠᱴᱚᱨ', 'ᱚᱠᱥᱤᱡᱮᱱ'],
    gas_03_buddy: ['attendant', 'standby', 'buddy', 'outside', 'watch', 'अटेंडेंट', 'सहायक', 'बाहर', 'साथी', 'ᱮᱴᱮᱱᱰᱮᱱᱴ', 'ᱥᱴᱮᱱᱰᱵᱟᱭ', 'ᱜᱚᱲᱚᱭᱤᱭᱟᱹ']
  };
  var INTENTS = {
    ppe: ['ppe', 'पीपीई', 'helmet', 'हेलमेट', 'gloves', 'दस्ताने', 'vest', 'जैकेट', 'shoes', 'जूते', 'goggles', 'wear', 'पहन', 'उपकरण', 'ᱦᱮᱞᱢᱮᱴ', 'ᱜᱞᱚᱵᱥ', 'ᱡᱩᱛᱟ', 'ᱯᱤᱸᱫᱷᱮ', 'ᱡᱚᱱᱛᱨᱚ'],
    refresher: ['refresher', 'रिफ्रेशर', 'revise', 'revision', 'recap', 'दोहरा', 'याद', 'ᱨᱤᱯᱷᱨᱮᱥᱚᱨ'],
    why: ['fail', 'failed', 'फ़ेल', 'फेल', 'why', 'क्यों', 'mistake', 'गलती', 'गलत', 'ᱯᱷᱮᱞ', 'ᱪᱮᱫᱟᱜ', 'ᱵᱷᱩᱞ'],
    test: ['test', 'quiz', 'exam', 'drill', 'परीक्षा', 'टेस्ट', 'अभ्यास', 'ᱡᱟᱺᱪ', 'ᱟᱵᱷᱭᱟᱥ'],
    explain: ['explain', 'hazard', 'समझा', 'खतरा', 'खतरे', 'ᱵᱩᱡᱷᱟᱹᱣ', 'ᱵᱤᱯᱚᱫ']
  };
  var DRILL_SECONDS = 10;

  function words(s) {
    return String(s || '').toLowerCase().replace(/[?!.,:;()"'·\-–—/]+/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 2; });
  }

  function has(text, list) {
    var lower = String(text || '').toLowerCase();
    return list.some(function (k) { return lower.indexOf(k) !== -1; });
  }

  function allSteps() {
    var out = [];
    SA.validation.MODULE_IDS.forEach(function (m) {
      var sc = SA.scenario.get(m);
      if (sc) sc.steps.forEach(function (s) { out.push({ module: m, step: s }); });
    });
    return out;
  }

  /** Best matching scenario step for free text, or null. */
  function matchStep(text, lang) {
    var q = words(text);
    if (!q.length) return null;
    var best = null;
    allSteps().forEach(function (x) {
      var id = x.step.id;
      var hay = [];
      (lang === 'sat' ? ['en', 'hi', 'sat'] : ['en', lang]).forEach(function (l) {
        hay.push(SA.i18n.tFor(l, 'scn.' + id + '.prompt'), SA.i18n.tFor(l, 'scn.' + id + '.why'));
        x.step.options.forEach(function (o) { hay.push(SA.i18n.tFor(l, 'scn.' + id + '.opt.' + o)); });
      });
      var vocab = words(hay.join(' ')).filter(function (w) { return w.length >= 4; });
      var score = 0;
      q.forEach(function (w) {
        if ((ALIASES[id] || []).some(function (a) { return w.indexOf(a) !== -1 || a.indexOf(w) === 0 && w.length >= 4; })) score += 3;
        else if (w.length >= 4 && vocab.indexOf(w) !== -1) score += 1;
      });
      if (score >= 2 && (!best || score > best.score)) best = { score: score, module: x.module, step: x.step };
    });
    return best;
  }

  /** The safe rule for one step, from approved content: prompt, safe action, explanation. */
  function stepCard(t, step) {
    return {
      stepId: step.id,
      safeKey: 'scn.' + step.id + '.opt.' + step.correct,
      prompt: t('scn.' + step.id + '.prompt'),
      safe: t('scn.' + step.id + '.opt.' + step.correct),
      why: t('scn.' + step.id + '.why')
    };
  }

  function lastAttempt(state, moduleId) {
    var wid = state.worker && state.worker.id;
    var list = state.attempts.filter(function (a) { return a.workerId === wid && (!moduleId || a.module === moduleId); });
    return list.length ? list[list.length - 1] : null;
  }

  /**
   * Answer a question. Returns {kind, text, cards: [stepCard], actions: [{key, href}], choices: [{stepId, label}]}
   */
  function answer(question, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;
    var mod = function (id) { return SA.ui ? SA.ui.moduleTitle(id, lang) : id; };
    var step = matchStep(question, lang);

    if (has(question, INTENTS.why)) {
      var failed = state.attempts.filter(function (a) { return a.workerId === (state.worker && state.worker.id) && !a.passed; });
      if (!failed.length) return { kind: 'why', text: t('coach.ans.whyNone'), cards: [], actions: [] };
      var f = failed[failed.length - 1];
      return {
        kind: 'why', text: t('coach.ans.why', { module: mod(f.module), wrong: f.wrong }),
        cards: SA.scenario.get(f.module).steps.map(function (s) { return stepCard(t, s); }),
        actions: [{ key: 'coach.openReplay', href: '#/replay/' + f.module }]
      };
    }
    if (has(question, INTENTS.refresher)) {
      var last = lastAttempt(state);
      var m = step ? step.module : last ? last.module : SA.validation.MODULE_IDS[0];
      return {
        kind: 'refresher', text: t('coach.ans.refresher', { module: mod(m) }),
        cards: SA.scenario.get(m).steps.map(function (s) { return stepCard(t, s); }),
        actions: [{ key: 'coach.openReplay', href: '#/replay/' + m }]
      };
    }
    if (has(question, INTENTS.test)) {
      return { kind: 'test', text: t('coach.ans.test', { s: DRILL_SECONDS }), cards: [], actions: [{ key: 'coach.openDrill', href: '#/replay?drill=1' }] };
    }
    if (step) {
      return { kind: 'step', text: '', cards: [stepCard(t, step.step)], actions: [{ key: 'coach.openReplay', href: '#/replay/' + step.module }] };
    }
    if (has(question, INTENTS.ppe)) {
      return { kind: 'ppe', text: t('coach.ans.ppe'), cards: [], actions: SA.screens && SA.screens.ppe ? [{ key: 'quick.ppe', href: '#/ppe' }] : [] };
    }
    if (has(question, INTENTS.explain)) {
      return {
        kind: 'explain', text: t('coach.ans.explain'), cards: [], actions: [],
        choices: allSteps().map(function (x) { return { stepId: x.step.id, label: t('scn.' + x.step.id + '.opt.' + x.step.correct) }; })
      };
    }
    return { kind: 'unknown', text: t('coach.ans.unknown'), cards: [], actions: [] };
  }

  /** Answer for a specific step chosen from the "explain" list. */
  function explainStep(stepId, ctx) {
    var found = allSteps().filter(function (x) { return x.step.id === stepId; })[0];
    if (!found) return { kind: 'unknown', text: ctx.t('coach.ans.unknown'), cards: [], actions: [] };
    return { kind: 'step', text: '', cards: [stepCard(ctx.t, found.step)], actions: [{ key: 'coach.openReplay', href: '#/replay/' + found.module }] };
  }

  SA.coach = { answer: answer, explainStep: explainStep, matchStep: matchStep, DRILL_SECONDS: DRILL_SECONDS };
  SA.practice = SA.practice || {};
  SA.practice.DRILL_SECONDS = DRILL_SECONDS;
})(typeof globalThis !== 'undefined' ? globalThis : window);
