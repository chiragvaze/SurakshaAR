/*
 * Seeded dashboard workers (docs/05_DATA_MODEL.md "Dashboard seed"). Fictional demo data.
 * daysAgo is relative to the real clock when the dashboard renders, so the demo
 * always looks current. Risk shown for each (before -> after +7 days):
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  SA.SEED_WORKERS = [
    { id: 'JH-1001', name: 'Ramesh Munda', module: 'fire_explosion', score: 100, fails: 0, daysAgo: 1 },  //  5 green  -> 40 amber, due
    { id: 'JH-1002', name: 'Sunita Hembrom', module: 'gas_confined', score: 100, fails: 0, daysAgo: 3 },  // 15 green  -> 50 amber, due
    { id: 'JH-1003', name: 'Arjun Mahto', module: 'fire_explosion', score: 67, fails: 1, daysAgo: 2 },    // 42 amber  -> 77 red, due
    { id: 'JH-1004', name: 'Priya Soren', module: 'gas_confined', score: 100, fails: 1, daysAgo: 5 },     // 40 amber  -> 75 red, due
    { id: 'JH-1005', name: 'Birsa Oraon', module: 'fire_explosion', score: 33, fails: 2, daysAgo: 4 },    // 84 red    -> 100 red, due
    { id: 'JH-1006', name: 'Anita Kisku', module: 'gas_confined', score: 67, fails: 0, daysAgo: 0 },      // 17 green  -> 52 amber, due
    { id: 'JH-1007', name: 'Manoj Tudu', module: 'gas_confined', score: 0, fails: 3, daysAgo: 10 },       // 100 red, due
    { id: 'JH-1008', name: 'Kavita Marandi', module: 'fire_explosion', score: 100, fails: 0, daysAgo: 8 } // 40 amber, due -> 75 red
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
