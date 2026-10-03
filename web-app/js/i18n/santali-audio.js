/*
 * Offline Santali voice manifest: text key -> bundled pre-recorded clip
 * (docs/SANTALI_LOCALIZATION.md, "Audio"). The ONLY place clip file names appear; screens
 * and Unity resolve clips through this table (exported to Unity by export-unity-content.js).
 *
 * status:
 *   'recording-pending'  no clip yet. The file must NOT exist. The UI says so (no fake voice).
 *   'recorded'           the clip exists under web-app/<file>, recorded by a native speaker
 *                        from the Santali text whose SHA-256 prefix is in `textSha`. If the text
 *                        changes later, tests fail until the clip is re-recorded.
 *
 * Clips are mono OGG Vorbis; see the recording spec in docs/SANTALI_LOCALIZATION.md.
 * No clip has been recorded yet: every entry is 'recording-pending'.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  var P = 'recording-pending';

  function clip(group, name) { return { file: 'audio/sat/' + group + '/sat_' + name + '.ogg', status: P }; }

  // Lines the trainer speaks: AR narration (Narrator.cs) and the web speaker buttons.
  SA.SANTALI_AUDIO = {
    'ar.placeHint': clip('common', 'ar_place_hint'),
    'assess.correct': clip('common', 'assess_correct'),
    'assess.wrong': clip('common', 'assess_wrong'),
    'ar.complete': clip('common', 'ar_complete'),
    'result.passed': clip('common', 'result_passed'),
    'result.failed': clip('common', 'result_failed'),

    'module.fire_explosion.purpose': clip('fire', 'fire_purpose'),
    'scn.fire_01_exit.prompt': clip('fire', 'fire_exit_prompt'),
    'scn.fire_01_exit.why': clip('fire', 'fire_exit_why'),
    'scn.fire_02_extinguisher.prompt': clip('fire', 'fire_extinguisher_prompt'),
    'scn.fire_02_extinguisher.why': clip('fire', 'fire_extinguisher_why'),
    'scn.fire_03_smoke.prompt': clip('fire', 'fire_smoke_prompt'),
    'scn.fire_03_smoke.why': clip('fire', 'fire_smoke_why'),

    'module.gas_confined.purpose': clip('gas', 'gas_purpose'),
    'scn.gas_01_zone.prompt': clip('gas', 'gas_zone_prompt'),
    'scn.gas_01_zone.why': clip('gas', 'gas_zone_why'),
    'scn.gas_02_ppe.prompt': clip('gas', 'gas_ppe_prompt'),
    'scn.gas_02_ppe.why': clip('gas', 'gas_ppe_why'),
    'scn.gas_03_buddy.prompt': clip('gas', 'gas_buddy_prompt'),
    'scn.gas_03_buddy.why': clip('gas', 'gas_buddy_why')
  };

  SA.SANTALI_AUDIO_STATUS = { PENDING: P, RECORDED: 'recorded' };
})(typeof globalThis !== 'undefined' ? globalThis : window);
