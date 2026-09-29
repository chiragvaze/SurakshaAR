'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load } = require('./helpers/load');

const SA = load();
const ROOT = path.join(__dirname, '..');

let jsQR = null;
try { jsQR = require('jsqr'); } catch (e) { /* dev dependency not installed */ }

function decodeMatrix(qr) {
  const scale = 4, border = 4, dim = (qr.size + border * 2) * scale;
  const px = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.modules[y][x]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + border) * scale + dy) * dim + (x + border) * scale + dx) * 4;
          px[i] = px[i + 1] = px[i + 2] = 0;
        }
      }
    }
  }
  const r = jsQR(px, dim, dim);
  return r ? r.data : null;
}

test('TC-008 QR of a real certificate payload decodes back to the payload (jsQR)', { skip: !jsQR && 'jsqr not installed (npm install)' }, () => {
  const names = ['Ramesh Munda', 'सुनीता हेम्ब्रम', 'A'.repeat(60), 'क'.repeat(60)];
  for (const name of names) {
    const cert = SA.certificate.issue({ name, module: 'gas_confined', score: 100, issuedMs: Date.UTC(2026, 8, 29) });
    const payload = SA.certificate.toPayload(cert);
    const qr = SA.qr.encode(payload);
    assert.equal(decodeMatrix(qr), payload, name.slice(0, 10) + ' v' + qr.version);
  }
});

test('QR encoder handles many lengths (versions 1..40 range)', { skip: !jsQR && 'jsqr not installed' }, () => {
  for (const len of [1, 10, 14, 15, 50, 100, 200, 300, 500, 1000, 2000]) {
    const text = 'x'.repeat(len);
    const qr = SA.qr.encode(text);
    assert.equal(decodeMatrix(qr), text, 'len ' + len + ' v' + qr.version);
  }
});

test('QR encoder throws on data too long, SVG contains no text input', () => {
  assert.throws(() => SA.qr.encode('x'.repeat(3000)), /QR_DATA_TOO_LONG/);
  const svg = SA.qr.toSvgString(SA.qr.encode('<script>alert(1)</script>'));
  assert.ok(!svg.includes('script'));
  assert.match(svg, /^<svg [^>]+viewBox="0 0 \d+ \d+"/);
});

test('service worker caches every asset index.html loads', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length > 20);
  for (const ref of refs) {
    assert.ok(sw.includes("'" + ref + "'"), 'sw.js missing ' + ref);
    assert.ok(fs.existsSync(path.join(ROOT, ref)), 'missing file ' + ref);
  }
});

test('app makes no network calls: no fetch/XHR/external URLs in app scripts', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  for (const s of scripts) {
    const code = fs.readFileSync(path.join(ROOT, s), 'utf8');
    assert.ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(code), s + ' makes a network call');
    const urls = (code.match(/https?:\/\/[a-z0-9][^\s'"]*/gi) || []).filter((u) => u !== 'http://www.w3.org/2000/svg');
    assert.deepEqual(urls, [], s);
  }
});
