#!/usr/bin/env node
/*
 * Writes the Santali review sheet docs/santali-review.csv (UTF-8 with BOM, opens in Excel /
 * LibreOffice / Google Sheets): one row per worker-app text key with English source, Hindi,
 * provisional Santali, review status, safety-critical flag and the voice clip status.
 * The sheet is generated from the code, never edited by hand: reviewers send corrections, which
 * go into web-app/js/i18n/santali.js. tests/santali.test.js fails if the sheet is stale.
 *
 * Usage: npm run santali:sheet
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, '..', 'docs', 'santali-review.csv');

function load() {
  ['js/data/scenarios.js', 'js/i18n/strings.js', 'js/i18n/ui-strings.js', 'js/i18n/santali.js', 'js/i18n/santali-audio.js']
    .forEach((f) => require(path.join(ROOT, f)));
  return globalThis.SA;
}

const cell = (v) => {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

function render() {
  const SA = load();
  const S = SA.STRINGS;
  const rows = [['key', 'safety_critical', 'english', 'hindi', 'santali_provisional', 'review_status', 'voice_file', 'voice_status', 'santali_text_sha12']];
  const titles = SA.SCENARIO_CONTENT.modules.map((m) => ['title.' + m.id, 'no', m.title.en, m.title.hi, m.title.sat,
    SA.santali.review('title.' + m.id, !!m.title.sat), '', '', '']);
  rows.push(...titles);
  Object.keys(S.en).sort().forEach((key) => {
    const sat = S.sat[key] || '';
    const v = SA.SANTALI_AUDIO[key];
    rows.push([key, SA.santali.isSafetyCritical(key) ? 'yes' : 'no', S.en[key], S.hi[key] || '', sat,
      SA.santali.review(key), v ? v.file : '', v ? v.status : '',
      v && sat ? crypto.createHash('sha256').update(sat, 'utf8').digest('hex').slice(0, 12) : '']);
  });
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n') + '\n';
}

if (require.main === module) {
  fs.writeFileSync(OUT, render(), 'utf8');
  console.log('Wrote ' + path.relative(process.cwd(), OUT));
}

module.exports = { render, OUT };
