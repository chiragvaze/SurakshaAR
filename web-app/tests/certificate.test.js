'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const nodeCrypto = require('crypto');
const { load } = require('./helpers/load');

const SA = load();
const C = SA.certificate;
const ISSUED = Date.UTC(2026, 8, 29, 10, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function makeCert(overrides) {
  return C.issue(Object.assign({ name: 'Ramesh Munda', module: 'fire_explosion', score: 100, issuedMs: ISSUED }, overrides));
}

test('TC-007 body contains exactly {name, module, score, issuedMs, expiryMs} in order', () => {
  const cert = makeCert();
  const json = Buffer.from(cert.body, 'base64').toString('utf8');
  assert.deepEqual(Object.keys(JSON.parse(json)), ['name', 'module', 'score', 'issuedMs', 'expiryMs']);
  assert.deepEqual(JSON.parse(json), { name: 'Ramesh Munda', module: 'fire_explosion', score: 100, issuedMs: ISSUED, expiryMs: ISSUED + 365 * DAY });
});

test('signature = first 16 hex of HMAC-SHA256(demo secret, base64 body) (independent Node check)', () => {
  const cert = makeCert();
  const expected = nodeCrypto.createHmac('sha256', 'SurakshaAR-SIH2026-HACKATHON-DEMO-SECRET-NOT-FOR-PRODUCTION')
    .update(cert.body).digest('hex').slice(0, 16);
  assert.equal(cert.sig, expected);
  assert.match(cert.sig, /^[0-9a-f]{16}$/);
});

test('payload format is body=<base64>&sig=<16 hex>', () => {
  const cert = makeCert();
  assert.equal(C.toPayload(cert), 'body=' + cert.body + '&sig=' + cert.sig);
});

test('TC-009 untouched certificate verifies VALID', () => {
  const res = C.verify(C.toPayload(makeCert()), ISSUED + DAY);
  assert.equal(res.valid, true);
  assert.equal(res.reason, 'ok');
  assert.equal(res.cert.name, 'Ramesh Munda');
});

test('Hindi worker name round-trips through a VALID certificate', () => {
  const res = C.verify(C.toPayload(makeCert({ name: 'सुनीता हेम्ब्रम', module: 'gas_confined', score: 100 })), ISSUED);
  assert.equal(res.valid, true);
  assert.equal(res.cert.name, 'सुनीता हेम्ब्रम');
});

test('TC-010 changing ANY single body character -> INVALID', () => {
  const cert = makeCert();
  for (let i = 0; i < cert.body.length; i++) {
    const repl = cert.body[i] === 'A' ? 'B' : 'A';
    const body = cert.body.slice(0, i) + repl + cert.body.slice(i + 1);
    const res = C.verify('body=' + body + '&sig=' + cert.sig, ISSUED);
    assert.equal(res.valid, false, 'position ' + i);
  }
});

test('TC-011 changing ANY single signature character -> INVALID', () => {
  const cert = makeCert();
  for (let i = 0; i < cert.sig.length; i++) {
    const sig = cert.sig.slice(0, i) + (cert.sig[i] === 'a' ? 'b' : 'a') + cert.sig.slice(i + 1);
    const res = C.verify('body=' + cert.body + '&sig=' + sig, ISSUED);
    assert.equal(res.valid, false);
    assert.equal(res.reason, 'signature');
  }
  // Upper-casing the signature is also a change -> INVALID.
  assert.equal(C.verify('body=' + cert.body + '&sig=' + cert.sig.toUpperCase(), ISSUED).valid, false);
});

test('demoTamper changes exactly one character and yields INVALID (signature)', () => {
  const payload = C.toPayload(makeCert());
  const tampered = C.demoTamper(payload);
  assert.equal(tampered.length, payload.length);
  assert.equal([...payload].filter((c, i) => c !== tampered[i]).length, 1);
  assert.deepEqual(C.verify(tampered, ISSUED), { valid: false, reason: 'signature' });
});

test('TC-012 expired certificate -> INVALID (expired) using logical now', () => {
  const cert = makeCert();
  assert.equal(C.verify(C.toPayload(cert), cert.expiryMs).valid, true);
  const res = C.verify(C.toPayload(cert), cert.expiryMs + 1);
  assert.equal(res.valid, false);
  assert.equal(res.reason, 'expired');
});

test('malformed payloads -> INVALID without throwing', () => {
  const cert = makeCert();
  const cases = {
    '': 'empty',
    '   ': 'empty',
    'hello': 'malformed',
    'body=abc': 'malformed',
    ['sig=' + cert.sig]: 'malformed',
    ['body=' + cert.body + '&sig=' + cert.sig + '&x=1']: 'malformed',
    ['body=' + cert.body + '&sig=' + cert.sig.slice(0, 15)]: 'malformed',
    ['body=' + cert.body.slice(1) + '&sig=' + cert.sig]: 'malformed',
    ['body=' + cert.body + '&body=' + cert.body]: 'malformed',
    ['body=' + 'A'.repeat(3000) + '&sig=' + cert.sig]: 'malformed'
  };
  for (const [input, reason] of Object.entries(cases)) {
    const res = C.verify(input, ISSUED);
    assert.equal(res.valid, false, input.slice(0, 30));
    assert.equal(res.reason, reason, input.slice(0, 30));
  }
  assert.equal(C.verify(null, ISSUED).valid, false);
  assert.equal(C.verify(12345, ISSUED).valid, false);
});

test('whitespace/newlines around a pasted payload are tolerated', () => {
  const p = C.toPayload(makeCert());
  assert.equal(C.verify('\n  ' + p.slice(0, 40) + '\n' + p.slice(40) + '  \n', ISSUED).valid, true);
});

test('validly signed but invalid content (e.g. failing score, bad module) -> INVALID content', () => {
  const forge = (obj) => {
    const body = Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
    return 'body=' + body + '&sig=' + C.sign(body);
  };
  const ok = { name: 'Ramesh Munda', module: 'fire_explosion', score: 100, issuedMs: ISSUED, expiryMs: ISSUED + DAY };
  assert.equal(C.verify(forge(ok), ISSUED).valid, true);
  const bad = [
    Object.assign({}, ok, { score: 67 }),
    Object.assign({}, ok, { module: 'machinery' }),
    Object.assign({}, ok, { name: '' }),
    Object.assign({}, ok, { expiryMs: ISSUED - 1 }),
    Object.assign({}, ok, { extra: 1 }),
    { name: 'x' }
  ];
  bad.forEach((b, i) => assert.deepEqual(C.verify(forge(b), ISSUED), { valid: false, reason: 'content' }, 'case ' + i));
  // Non-JSON but validly signed body
  const body = Buffer.from('not json').toString('base64');
  assert.equal(C.verify('body=' + body + '&sig=' + C.sign(body), ISSUED).reason, 'content');
});

test('issue() refuses non-passing scores and bad input', () => {
  assert.throws(() => makeCert({ score: 67 }), /CERT_INVALID_INPUT/);
  assert.throws(() => makeCert({ module: 'x' }), /CERT_INVALID_INPUT/);
  assert.throws(() => makeCert({ name: '<script>' }), /CERT_INVALID_INPUT/);
});

test('certificate module is labelled demo-only', () => {
  assert.equal(C.DEMO_SECURITY_ONLY, true);
});
