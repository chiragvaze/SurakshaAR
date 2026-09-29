/*
 * Minimal local QR Code encoder (ISO/IEC 18004): byte mode, error correction
 * level M, versions 1-40, automatic mask selection. Output is a boolean matrix
 * that is rendered as SVG. No network, no dependencies.
 *
 * Algorithm follows the structure of Project Nayuki's reference QR generator (MIT).
 * tests/qr.test.js decodes the output with an independent decoder (jsQR).
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  // Error correction level M. Index = version (index 0 unused).
  var ECC_PER_BLOCK_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
    26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
  var NUM_BLOCKS_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
    17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
  var FORMAT_BITS_M = 0; // L=1, M=0, Q=3, H=2

  function numRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  function numDataCodewords(ver) {
    return Math.floor(numRawDataModules(ver) / 8) - ECC_PER_BLOCK_M[ver] * NUM_BLOCKS_M[ver];
  }

  function charCountBits(ver) { return ver < 10 ? 8 : 16; }

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  // ---- Reed-Solomon over GF(2^8) with polynomial 0x11D ----
  function rsMultiply(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }

  function rsDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var r = 1;
    for (i = 0; i < degree; i++) {
      for (var j = 0; j < result.length; j++) {
        result[j] = rsMultiply(result[j], r);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      r = rsMultiply(r, 0x02);
    }
    return result;
  }

  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift();
      result.push(0);
      divisor.forEach(function (coef, i) { result[i] ^= rsMultiply(coef, factor); });
    });
    return result;
  }

  // ---- Data encoding ----
  function encodeData(bytes, ver) {
    var bits = [];
    function append(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    append(0x4, 4); // byte mode
    append(bytes.length, charCountBits(ver));
    for (var i = 0; i < bytes.length; i++) append(bytes[i], 8);

    var capacity = numDataCodewords(ver) * 8;
    append(0, Math.min(4, capacity - bits.length));
    append(0, (8 - (bits.length % 8)) % 8);
    for (var pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) append(pad, 8);

    var codewords = [];
    for (i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      codewords.push(v);
    }
    return codewords;
  }

  function addEccAndInterleave(data, ver) {
    var numBlocks = NUM_BLOCKS_M[ver];
    var blockEccLen = ECC_PER_BLOCK_M[ver];
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);
    var divisor = rsDivisor(blockEccLen);

    var blocks = [];
    for (var i = 0, k = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, divisor);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var result = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(blocks[j][i]);
      }
    }
    return result;
  }

  // ---- Matrix construction ----
  function QrMatrix(ver) {
    this.ver = ver;
    this.size = ver * 4 + 17;
    this.modules = [];
    this.isFunction = [];
    for (var y = 0; y < this.size; y++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
  }

  QrMatrix.prototype.setFunction = function (x, y, dark) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  };

  QrMatrix.prototype.alignmentPositions = function () {
    if (this.ver === 1) return [];
    var numAlign = Math.floor(this.ver / 7) + 2;
    var step = Math.floor((this.ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    var result = [6];
    for (var pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  };

  QrMatrix.prototype.drawFunctionPatterns = function () {
    var size = this.size, i, j;
    for (i = 0; i < size; i++) {
      this.setFunction(6, i, i % 2 === 0);
      this.setFunction(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);
    var pos = this.alignmentPositions();
    var n = pos.length;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        var corner = (i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0);
        if (!corner) this.drawAlignment(pos[i], pos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  };

  QrMatrix.prototype.drawFinder = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunction(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  QrMatrix.prototype.drawAlignment = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        this.setFunction(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };

  QrMatrix.prototype.drawFormatBits = function (mask) {
    var data = (FORMAT_BITS_M << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    var size = this.size;
    for (i = 0; i <= 5; i++) this.setFunction(8, i, getBit(bits, i));
    this.setFunction(8, 7, getBit(bits, 6));
    this.setFunction(8, 8, getBit(bits, 7));
    this.setFunction(7, 8, getBit(bits, 8));
    for (i = 9; i < 15; i++) this.setFunction(14 - i, 8, getBit(bits, i));
    for (i = 0; i < 8; i++) this.setFunction(size - 1 - i, 8, getBit(bits, i));
    for (i = 8; i < 15; i++) this.setFunction(8, size - 15 + i, getBit(bits, i));
    this.setFunction(8, size - 8, true); // always-dark module
  };

  QrMatrix.prototype.drawVersion = function () {
    if (this.ver < 7) return;
    var rem = this.ver;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    var bits = (this.ver << 12) | rem;
    for (i = 0; i < 18; i++) {
      var bit = getBit(bits, i);
      var a = this.size - 11 + (i % 3), b = Math.floor(i / 3);
      this.setFunction(a, b, bit);
      this.setFunction(b, a, bit);
    }
  };

  QrMatrix.prototype.drawCodewords = function (data) {
    var size = this.size, i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  function maskBit(mask, x, y) {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return (x * y) % 2 + (x * y) % 3 === 0;
      case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
      default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    }
  }

  QrMatrix.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        if (!this.isFunction[y][x] && maskBit(mask, x, y)) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  // Standard penalty rules N1-N4 (simplified but faithful enough to pick a readable mask).
  QrMatrix.prototype.penalty = function () {
    var size = this.size, m = this.modules, score = 0, x, y;
    function lineScore(get) {
      var s = 0;
      for (var a = 0; a < size; a++) {
        var run = 1;
        for (var b = 1; b <= size; b++) {
          if (b < size && get(a, b) === get(a, b - 1)) { run++; continue; }
          if (run >= 5) s += 3 + (run - 5);
          run = 1;
        }
        // N3: finder-like pattern 1011101 with 4 light modules on either side
        for (b = 0; b + 11 <= size; b++) {
          var p = '';
          for (var c = 0; c < 11; c++) p += get(a, b + c) ? '1' : '0';
          if (p === '10111010000' || p === '00001011101') s += 40;
        }
      }
      return s;
    }
    score += lineScore(function (r, c) { return m[r][c]; });
    score += lineScore(function (c, r) { return m[r][c]; });
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var v = m[y][x];
        if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) score += 3;
      }
    }
    var dark = 0;
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    var total = size * size;
    var k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    score += Math.max(0, k) * 10;
    return score;
  };

  /**
   * Encode text into a QR matrix.
   * @param {string} text
   * @returns {{version:number, size:number, modules:boolean[][]}}
   */
  function encode(text) {
    var bytes = SA.codec.utf8Encode(String(text));
    var ver = 0;
    for (var v = 1; v <= 40; v++) {
      var needed = 4 + charCountBits(v) + bytes.length * 8;
      if (needed <= numDataCodewords(v) * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('QR_DATA_TOO_LONG');

    var qr = new QrMatrix(ver);
    qr.drawFunctionPatterns();
    qr.drawCodewords(addEccAndInterleave(encodeData(bytes, ver), ver));

    var bestMask = 0, bestPenalty = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      qr.applyMask(mask);
      qr.drawFormatBits(mask);
      var p = qr.penalty();
      if (p < bestPenalty) { bestPenalty = p; bestMask = mask; }
      qr.applyMask(mask); // XOR again to undo
    }
    qr.applyMask(bestMask);
    qr.drawFormatBits(bestMask);
    return { version: ver, size: qr.size, modules: qr.modules };
  }

  /** Render a QR matrix as an SVG string (contains only generated numbers, no user text). */
  function toSvgString(qr, border) {
    border = border == null ? 4 : border;
    var dim = qr.size + border * 2;
    var parts = [];
    for (var y = 0; y < qr.size; y++) {
      for (var x = 0; x < qr.size; x++) {
        if (qr.modules[y][x]) parts.push('M' + (x + border) + ',' + (y + border) + 'h1v1h-1z');
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '"' +
      ' shape-rendering="crispEdges" role="img" focusable="false">' +
      '<rect width="100%" height="100%" fill="#FFFFFF"/>' +
      '<path d="' + parts.join('') + '" fill="#000000"/></svg>';
  }

  SA.qr = { encode: encode, toSvgString: toSvgString };
})(typeof globalThis !== 'undefined' ? globalThis : window);
