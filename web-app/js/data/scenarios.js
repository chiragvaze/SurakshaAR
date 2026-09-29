/*
 * AUTO-GENERATED from docs/25_SCENARIO_CONTENT.json by tools/sync-scenarios.js.
 * Do not edit by hand: edit the docs JSON and run `npm run sync:scenarios`.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};
  SA.SCENARIO_CONTENT = {
    "version": "1.0",
    "modules": [
      {
        "id": "fire_explosion",
        "title": {
          "en": "Fire & Explosion",
          "hi": "आग और विस्फोट",
          "sat": "आग आर विस्फोट"
        },
        "steps": [
          {
            "id": "fire_01_exit",
            "correct": "exit_sign",
            "options": [
              "exit_sign",
              "lift",
              "window"
            ]
          },
          {
            "id": "fire_02_extinguisher",
            "correct": "co2",
            "options": [
              "co2",
              "water",
              "foam"
            ]
          },
          {
            "id": "fire_03_smoke",
            "correct": "crawl_low",
            "options": [
              "crawl_low",
              "run_upright",
              "go_back"
            ]
          }
        ]
      },
      {
        "id": "gas_confined",
        "title": {
          "en": "Gas Leak & Confined Space",
          "hi": "गैस रिसाव और सीमित स्थान",
          "sat": "गैस रिसाव आर सीमित ठाँव"
        },
        "steps": [
          {
            "id": "gas_01_zone",
            "correct": "red_zone",
            "options": [
              "red_zone",
              "open_area",
              "office"
            ]
          },
          {
            "id": "gas_02_ppe",
            "correct": "detector_breathing",
            "options": [
              "detector_breathing",
              "cap_gloves",
              "no_ppe"
            ]
          },
          {
            "id": "gas_03_buddy",
            "correct": "attendant",
            "options": [
              "attendant",
              "nobody",
              "phone_later"
            ]
          }
        ]
      }
    ]
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
