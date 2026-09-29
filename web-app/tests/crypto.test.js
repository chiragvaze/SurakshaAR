'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const nodeCrypto = require('crypto');
const { load } = require('./helpers/load');

const SA = load();

test('SHA-256 matches Node crypto across block boundaries', () => {
  for (const n of [0, 1, 3, 55, 56, 57, 63, 64, 65, 119, 120, 128, 1000, 5000]) {
    const bytes = nodeCrypto.randomBytes(n);
    assert.equal(SA.crypto.toHex(SA.crypto.sha256(bytes)), nodeCrypto.createHash('sha256').update(bytes).digest('hex'), 'len ' + n);
  }
});

test('SHA-256 known vector ("abc")', () => {
  assert.equal(SA.crypto.toHex(SA.crypto.sha256(Buffer.from('abc'))),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('HMAC-SHA256 matches Node crypto for short, block-size and long keys', () => {
  for (const keyLen of [0, 5, 32, 64, 65, 200]) {
    const key = nodeCrypto.randomBytes(keyLen);
    const msg = nodeCrypto.randomBytes(123);
    assert.equal(SA.crypto.toHex(SA.crypto.hmacSha256(key, msg)), nodeCrypto.createHmac('sha256', key).update(msg).digest('hex'), 'keyLen ' + keyLen);
  }
});

test('Base64 round-trips and matches Buffer encoding', () => {
  for (const n of [0, 1, 2, 3, 4, 5, 100]) {
    const bytes = nodeCrypto.randomBytes(n);
    const b64 = SA.codec.base64Encode(bytes);
    assert.equal(b64, Buffer.from(bytes).toString('base64'));
    assert.deepEqual(Buffer.from(SA.codec.base64Decode(b64)), Buffer.from(bytes));
  }
});

test('Base64 decoder rejects malformed input instead of throwing', () => {
  for (const bad of ['abc', 'ab=c', '====', 'A===', 'ab$d', 'YW Jj', null, 42]) {
    assert.equal(SA.codec.base64Decode(bad), null, String(bad));
  }
});

test('UTF-8 round-trips Hindi/Santali text; invalid UTF-8 returns null', () => {
  const s = 'सुनीता हेम्ब्रम ᱥᱟᱱᱛᱟᱲᱤ';
  assert.equal(SA.codec.utf8Decode(SA.codec.utf8Encode(s)), s);
  assert.equal(SA.codec.utf8Decode(new Uint8Array([0xff, 0xfe])), null);
});
