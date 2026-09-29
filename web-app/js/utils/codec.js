/*
 * UTF-8 and strict Base64 helpers.
 * btoa/atob cannot handle Hindi/Santali names, so certificate bodies go through
 * UTF-8 bytes first. Decoding is strict: malformed input returns null, never throws.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var LOOKUP = {};
  for (var i = 0; i < ALPHABET.length; i++) LOOKUP[ALPHABET.charAt(i)] = i;
  var B64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

  function utf8Encode(str) {
    return new TextEncoder().encode(str);
  }

  /** @returns {string|null} null if bytes are not valid UTF-8 */
  function utf8Decode(bytes) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      return null;
    }
  }

  function base64Encode(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
      var n = (b0 << 16) | ((b1 || 0) << 8) | (b2 || 0);
      out += ALPHABET.charAt((n >> 18) & 63) + ALPHABET.charAt((n >> 12) & 63);
      out += i + 1 < bytes.length ? ALPHABET.charAt((n >> 6) & 63) : '=';
      out += i + 2 < bytes.length ? ALPHABET.charAt(n & 63) : '=';
    }
    return out;
  }

  /** @returns {Uint8Array|null} */
  function base64Decode(str) {
    if (typeof str !== 'string' || str.length % 4 !== 0 || !B64_RE.test(str)) return null;
    var pad = str.charAt(str.length - 1) === '=' ? (str.charAt(str.length - 2) === '=' ? 2 : 1) : 0;
    var outLen = (str.length / 4) * 3 - pad;
    var out = new Uint8Array(outLen);
    var o = 0;
    for (var i = 0; i < str.length; i += 4) {
      var c0 = LOOKUP[str.charAt(i)], c1 = LOOKUP[str.charAt(i + 1)];
      var c2 = LOOKUP[str.charAt(i + 2)] || 0, c3 = LOOKUP[str.charAt(i + 3)] || 0;
      var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      if (o < outLen) out[o++] = (n >> 16) & 255;
      if (o < outLen) out[o++] = (n >> 8) & 255;
      if (o < outLen) out[o++] = n & 255;
    }
    return out;
  }

  SA.codec = {
    utf8Encode: utf8Encode,
    utf8Decode: utf8Decode,
    base64Encode: base64Encode,
    base64Decode: base64Decode
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
