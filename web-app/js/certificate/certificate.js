/*
 * Certificate issue + offline verification (docs/09_CERTIFICATE_QR.md, docs/04_SECURITY.md).
 *
 * ============================== HACKATHON DEMO SECURITY ONLY ==============================
 * The HMAC secret below ships inside the app, so anyone can extract it and forge
 * certificates. This demonstrates tamper detection only, not real trust.
 * Production must sign server-side with an asymmetric key (private key never on the
 * device) and verify with the public key. See docs/04_SECURITY.md "Production".
 * ==========================================================================================
 *
 * body    = base64(UTF-8(JSON {name, module, score, issuedMs, expiryMs}))  (keys in this order)
 * sig     = first 16 hex chars of HMAC-SHA256(key = UTF-8(DEMO_SECRET), msg = ASCII(body))
 * payload = "body=<body>&sig=<sig>"   (this string is what the QR code contains)
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  // HACKATHON DEMO SECURITY ONLY: public, embedded, not a real credential.
  var DEMO_SECRET = 'SurakshaAR-SIH2026-HACKATHON-DEMO-SECRET-NOT-FOR-PRODUCTION';
  var DAY_MS = 24 * 60 * 60 * 1000;
  var VALIDITY_MS = 365 * DAY_MS;
  var MAX_VALIDITY_MS = 5 * 366 * DAY_MS;
  var MIN_ISSUED_MS = Date.UTC(2024, 0, 1);
  var MAX_PAYLOAD_LENGTH = 2048;
  var SIG_LENGTH = 16;
  var BODY_KEYS = ['name', 'module', 'score', 'issuedMs', 'expiryMs'];
  var B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
  var SIG_RE = /^[0-9a-f]{16}$/;

  var secretBytes = null;

  function sign(body) {
    if (!secretBytes) secretBytes = SA.codec.utf8Encode(DEMO_SECRET);
    var mac = SA.crypto.hmacSha256(secretBytes, SA.codec.utf8Encode(body));
    return SA.crypto.toHex(mac).slice(0, SIG_LENGTH);
  }

  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /** Validate a decoded body object. Returns a clean copy or null. */
  function checkBody(obj) {
    var V = SA.validation;
    if (!V.isPlainObject(obj)) return null;
    var keys = Object.keys(obj);
    if (keys.length !== BODY_KEYS.length || BODY_KEYS.some(function (k) { return keys.indexOf(k) === -1; })) return null;
    if (V.checkName(obj.name) || !V.isModuleId(obj.module)) return null;
    // Only passing results are ever certified.
    if (!V.isSafeInt(obj.score, SA.scoring.PASS_MARK, 100)) return null;
    if (!V.isSafeInt(obj.issuedMs, MIN_ISSUED_MS, Number.MAX_SAFE_INTEGER)) return null;
    if (!V.isSafeInt(obj.expiryMs, obj.issuedMs + 1, obj.issuedMs + MAX_VALIDITY_MS)) return null;
    return { name: obj.name, module: obj.module, score: obj.score, issuedMs: obj.issuedMs, expiryMs: obj.expiryMs };
  }

  /** @returns {object|null} decoded + validated body, or null if malformed */
  function decodeBody(body) {
    var bytes = SA.codec.base64Decode(body);
    if (!bytes) return null;
    var text = SA.codec.utf8Decode(bytes);
    if (text === null) return null;
    try {
      return checkBody(JSON.parse(text));
    } catch (e) {
      return null;
    }
  }

  /**
   * Issue a certificate for a passing result.
   * @param {{name:string, module:string, score:number, issuedMs:number}} input
   */
  function issue(input) {
    var data = {
      name: input.name,
      module: input.module,
      score: input.score,
      issuedMs: input.issuedMs,
      expiryMs: input.issuedMs + VALIDITY_MS
    };
    if (!checkBody(data)) throw new Error('CERT_INVALID_INPUT');
    var body = SA.codec.base64Encode(SA.codec.utf8Encode(JSON.stringify(data)));
    return { body: body, sig: sign(body), issuedMs: data.issuedMs, expiryMs: data.expiryMs };
  }

  function toPayload(cert) { return 'body=' + cert.body + '&sig=' + cert.sig; }

  /**
   * Parse "body=<base64>&sig=<16 hex>". Parsed by hand (not URLSearchParams) because
   * Base64 contains "+" which URLSearchParams would turn into a space.
   */
  function parsePayload(text) {
    if (typeof text !== 'string') return { ok: false, reason: 'malformed' };
    var clean = text.replace(/\s+/g, '');
    if (!clean) return { ok: false, reason: 'empty' };
    if (clean.length > MAX_PAYLOAD_LENGTH) return { ok: false, reason: 'malformed' };
    var parts = clean.split('&');
    if (parts.length !== 2) return { ok: false, reason: 'malformed' };
    var fields = {};
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf('=');
      if (eq <= 0) return { ok: false, reason: 'malformed' };
      var k = parts[i].slice(0, eq);
      if ((k !== 'body' && k !== 'sig') || fields[k] !== undefined) return { ok: false, reason: 'malformed' };
      fields[k] = parts[i].slice(eq + 1);
    }
    if (!fields.body || !fields.sig || fields.body.length % 4 !== 0 || !B64_RE.test(fields.body) || !SIG_RE.test(fields.sig)) {
      return { ok: false, reason: 'malformed' };
    }
    return { ok: true, body: fields.body, sig: fields.sig };
  }

  /**
   * Offline verification: parse -> recompute HMAC -> compare -> decode -> check expiry.
   * @returns {{valid:boolean, reason:'ok'|'empty'|'malformed'|'signature'|'content'|'expired', cert?:object}}
   */
  function verify(text, nowMs) {
    var p = parsePayload(text);
    if (!p.ok) return { valid: false, reason: p.reason };
    if (!safeEqual(sign(p.body), p.sig)) return { valid: false, reason: 'signature' };
    var cert = decodeBody(p.body);
    if (!cert) return { valid: false, reason: 'content' };
    if (nowMs > cert.expiryMs) return { valid: false, reason: 'expired', cert: cert };
    return { valid: true, reason: 'ok', cert: cert };
  }

  /**
   * Demo helper for the tamper test: change exactly one character inside the body,
   * keeping it structurally valid Base64 so the failure is caught by the signature check.
   */
  function demoTamper(text) {
    var p = parsePayload(text);
    if (!p.ok) return null;
    var body = p.body.replace(/=+$/, '');
    var idx = Math.floor(body.length / 2);
    var ch = body.charAt(idx);
    var replacement = ch === 'A' ? 'B' : 'A';
    var tampered = p.body.slice(0, idx) + replacement + p.body.slice(idx + 1);
    return 'body=' + tampered + '&sig=' + p.sig;
  }

  SA.certificate = {
    DEMO_SECURITY_ONLY: true,
    VALIDITY_MS: VALIDITY_MS,
    SIG_LENGTH: SIG_LENGTH,
    MAX_PAYLOAD_LENGTH: MAX_PAYLOAD_LENGTH,
    sign: sign,
    issue: issue,
    toPayload: toPayload,
    parsePayload: parsePayload,
    decodeBody: decodeBody,
    verify: verify,
    demoTamper: demoTamper
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
