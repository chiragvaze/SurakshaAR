#!/usr/bin/env node
/*
 * Regenerates js/data/scenarios.js from docs/25_SCENARIO_CONTENT.json (the source of truth).
 * The web app cannot fetch() JSON when opened from file:// or Android assets, so the
 * content is embedded as a script. tests/scenario.test.js fails if the two drift apart.
 *
 * Usage: npm run sync:scenarios
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '..', 'docs', '25_SCENARIO_CONTENT.json');
const OUT = path.resolve(__dirname, '..', 'js', 'data', 'scenarios.js');

const content = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const js = `/*
 * AUTO-GENERATED from docs/25_SCENARIO_CONTENT.json by tools/sync-scenarios.js.
 * Do not edit by hand: edit the docs JSON and run \`npm run sync:scenarios\`.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  SA.SCENARIO_CONTENT = ${JSON.stringify(content, null, 2).replace(/\n/g, '\n  ')};
})(typeof globalThis !== 'undefined' ? globalThis : window);
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, js, 'utf8');
console.log('Wrote ' + path.relative(process.cwd(), OUT));
