# Santali localisation and offline Santali voice

Status as of 2026-10-03 (decision D-042):

| | Status |
|---|---|
| Santali text | **COMPLETE coverage, PROVISIONAL wording**: all 448 worker-app keys and both module titles, in Ol Chiki |
| Native-speaker review | **PENDING**: no review has taken place (`REVIEW_LOG` is empty) |
| Santali voice | **PARTIAL**: the offline playback pipeline is finished; **0 of 20** clips are recorded |
| Management portal | English only, by decision (D-040, unchanged) |

## 1. Language identifier and script
- **Identifier:** `sat` (ISO 639-3). It is used everywhere: `sa_v1.settings.language`, `SA.STRINGS.sat`, the bridge `lang` parameter, and Unity's `LocalizedText.sat`.
- **Script:** Ol Chiki (`Olck`, Unicode U+1C50–U+1C7F) for all Santali text.
  - The three earlier Santali strings were in Devanagari: the greeting `जोहार` and the two module titles. They were converted, so the script is now consistent.
  - The language picker shows `ᱥᱟᱱᱛᱟᱲᱤ` with "Santali · संताली" under it.
- **Digits** stay Latin (0–9). Scores, worker IDs and certificate dates then read the same in every language and on the certificate.
- **Dates:** formatted with `sat-IN-u-nu-latn` where the engine has Santali locale data; otherwise `en-IN`. Hindi month names are never used for Santali.
  - Chromium/WebView currently falls back to `en-IN`.
  - Node has the Santali data.
- **Fonts:** `Noto Sans Ol Chiki` (shipped with Android) and `Nirmala UI` (Windows) are in the font stack. In AR, text is drawn by Android's text engine (D-025), so it uses the same system font.

## 2. Where the text lives
| File | Content |
|---|---|
| `web-app/js/i18n/santali.js` | **Every Santali string** (one reviewable file), plus `SANTALI_FALLBACK` (deliberately untranslated keys: none), `REVIEW_LOG` (native sign-offs: none), safety-critical prefixes and review status |
| `docs/25_SCENARIO_CONTENT.json` | Santali module titles (synced to `js/data/scenarios.js`) |
| `web-app/js/i18n/santali-audio.js` | Voice manifest: text key → clip file + status |
| `docs/santali-review.csv` | **Generated** review sheet (`npm run santali:sheet`): key, safety-critical flag, English, Hindi, provisional Santali, review status, voice file and status, text hash |
| `unity-ar/Assets/Resources/SurakshaContent.json` | **Generated** for AR (`npm run export:unity`): per-language text + `satReview` + voice manifest |

There is still one localisation system. `santali.js` merges into `SA.STRINGS.sat`, so lookups use the existing `SA.i18n.t` and the fallback chain `sat → hi → en`. Unity reads the same text through the existing export.

## 3. Translation source and review status
- **Source:** the existing English strings, with the existing Hindi as a reference. The Santali text is a **provisional draft written for this prototype by an AI assistant (Claude)**. It is effectively machine translation.
  - No dictionary, glossary or native speaker was used.
  - It must not be treated as approved safety wording.
- **Review status per key:** `SA.santali.review(key)` returns one of three values:
  - `native-review-required`: all 448 keys and both titles;
  - `native-reviewed`: only when `REVIEW_LOG` holds a real reviewer's record. **None.**
  - `fallback-hindi`: no Santali text; none.
- **Safety-critical keys** (prefixes `scn.`, `ar.`, `assess.`, `module.`, `briefing.`, `ppe.`, `sos.`, `coach.ans.`, `nm.`) are flagged in the sheet. Review them first.
- **Tests enforce honesty:**
  - nothing may report `native-reviewed` without a `REVIEW_LOG` entry;
  - the review sheet must never contain `native-reviewed` rows that weren't signed off;
  - the file header must keep its "PROVISIONAL DRAFT" warning.

### Safeguard while unreviewed: the Hindi original is always shown
For every safety-critical key that is still `native-review-required`, the screen shows the Santali text first and the **Hindi original under it**, labelled "हिन्दी".

- **Web screens:** briefing (purpose, hazards), assessment (prompt, options, explanation), Haadsa Replay / Pressure Drill and Safety Coach cards.
- **AR:** prompt card, option labels, explanation, placement and tap hints.

A worker therefore never depends on an unreviewed translation alone. Once a key is signed off in `REVIEW_LOG`, the Hindi line disappears for that key automatically, on the web and in AR after `npm run export:unity`.

The Home screen also shows a bilingual notice when Santali is selected: provisional translation, native review pending.

### How to complete the native review
1. Run `npm run santali:sheet`, then give `docs/santali-review.csv` to a native Santali speaker with safety-domain knowledge. Ideally that's a trainer from the Santal Parganas / Kolhan region.
2. Copy the corrections into `web-app/js/i18n/santali.js`.
3. Add one `REVIEW_LOG` entry per approved key: `{ reviewer, date, note }`. Only for a review that really happened.
4. Run `npm run export:unity`, `npm run santali:sheet` and `npm test`.

### Terminology policy (provisional, for the reviewer to confirm)
- **Acronyms stay in Latin letters:** AR, QR, PPE, CO₂, SOS, ID, HMAC, ARCore.
- **Common site loanwords** are written in Ol Chiki rather than coined:
  - ᱴᱨᱮᱱᱤᱝ (training), ᱥᱟᱹᱴᱤᱯᱷᱤᱠᱮᱴ (certificate), ᱢᱳᱰᱭᱩᱞ (module);
  - ᱜᱮᱥ (gas), ᱞᱤᱠ (leak), ᱮᱞᱟᱨᱢ (alarm);
  - ᱰᱤᱴᱮᱠᱴᱚᱨ (detector), ᱚᱠᱥᱤᱡᱮᱱ (oxygen), ᱥᱴᱮᱱᱰᱵᱟᱭ ᱮᱴᱮᱱᱰᱮᱱᱴ (standby attendant).
- **Core terms** used consistently:
  - ᱨᱩᱠᱷᱤᱭᱟᱹ (safety / safe), ᱵᱤᱯᱚᱫ (hazard / danger), ᱡᱚᱠᱷᱤᱢ (risk);
  - ᱥᱮᱸᱜᱮᱞ (fire), ᱫᱷᱩᱸᱣᱟᱹ (smoke);
  - ᱵᱚᱸᱫ ᱡᱟᱭᱜᱟ (confined space, literally "closed place");
  - ᱚᱰᱚᱠ ᱦᱚᱨ (exit, "way out"), ᱥᱮᱸᱜᱮᱞ ᱧᱤᱵᱷᱟᱹᱣ ᱡᱚᱱᱛᱨᱚ (fire extinguisher);
  - ᱥᱟᱦᱮᱫ ᱡᱚᱱᱛᱨᱚ (breathing set), ᱯᱟᱥ / ᱯᱟᱥ ᱵᱟᱝ (pass / not passed);
  - ᱴᱷᱤᱠ (VALID) / ᱵᱷᱩᱞ (INVALID). The Latin word is kept in brackets, as in Hindi.
- **Known weak spots for the reviewer:**
  - the verb for "crawl" (drafted as "go low under the smoke");
  - "near-miss" (drafted as "saved from an accident");
  - "severity";
  - the imperative and politeness forms throughout.

## 4. Audio (offline pre-recorded Santali voice)
### Architecture
```text
Santali text key  ──>  SA.SANTALI_AUDIO / SurakshaContent.voice  (key -> audio/sat/<group>/sat_<name>.ogg + status)
        │
        ├── web screens: SA.voice.play(keys)  -> HTMLAudioElement on the bundled file (APK assets / same origin)
        └── AR trainer:  Narrator.Say(line)    -> SurakshaNative.voicePlay(files) -> MediaPlayer on assets/web/<file>
```
- One central mapping (`santali-audio.js`). Clip file names appear nowhere else. Unity gets the same table through the export.
- **20 voice lines:**
  - 6 shared: place hint, correct, not safe, training complete, passed, not passed;
  - 7 Fire: module purpose, plus prompt and explanation × 3 steps;
  - 7 Gas: the same set.
- **Location:** `web-app/audio/sat/{common,fire,gas}/`. Gradle copies `audio/**/*.ogg` into the APK (`assets/web/audio/...`) **uncompressed** (`noCompress '.ogg'`), so the web screens and the AR trainer share one copy.
- **Playback rules:**
  - one clip sequence at a time: a new one stops the old;
  - stopped on every route change, before AR launches, on mute and on exit;
  - Replay repeats the last line;
  - the worker can keep training while a clip plays;
  - `MediaPlayer` is released after each clip;
  - Java accepts only paths matching `audio/sat/<group>/sat_<name>.ogg`.
- **A group of lines plays only if every clip in it is recorded.** A partly recorded line is never played.

### What happens today (no clips recorded)
| Where | Selected language | Behaviour |
|---|---|---|
| AR trainer | Hindi | Hindi TTS, unchanged |
| AR trainer | English | English TTS, unchanged |
| AR trainer | Santali | The **Hindi text of the same line** is spoken with the Hindi TTS voice, and the HUD shows **"ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ ᱵᱟᱝ ᱨᱮᱠᱚᱨᱰ ᱟᱠᱟᱱᱟ · ᱦᱤᱱᱫᱤ ᱟᱲᱟᱝ / संताली आवाज़ रिकॉर्ड नहीं · हिन्दी आवाज़"** in both scripts. Santali text is never fed to the Hindi TTS voice. Without a Hindi voice: text only. Replay (↻) repeats the line. |
| Web screens (briefing, browser trainer, result) | Santali | A note: "ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ ᱱᱤᱛᱚᱜ ᱵᱟᱝ ᱨᱮᱠᱚᱨᱰ ᱟᱠᱟᱱᱟ · ᱠᱷᱟᱹᱞᱤ ᱚᱞ" ("Santali voice not recorded yet · text only"). Nothing is played. |
| Web screens | Hindi / English | Unchanged: no voice, as before |

Nothing is ever labelled Santali voice unless it is a recorded Santali clip. No TTS engine, cloud service, browser speech synthesis or network is used for Santali.

### Recording specification
- **Recording:**
  - **Speaker:** a native Santali speaker, recording the **finalised, reviewed** text only. Record each line after its key is in `REVIEW_LOG`.
  - **Source:** mono, 48 kHz (or 44.1 kHz), 24-bit WAV; quiet room; no music or effects; no background noise.
  - **Delivery:** clear, calm and at a moderate pace. Consistent speaker and distance across all clips.
  - **Editing:** trim leading and trailing silence to 150 ms or less. Normalise to about −16 LUFS integrated, true peak ≤ −1 dBTP.
- **Shipping format:** mono **OGG Vorbis**, 22.05 kHz or 24 kHz, about 48 kbps (q≈2). Expect about 6 KB per second, roughly 0.3–0.5 MB for all 20 lines. Example: `ffmpeg -i in.wav -ac 1 -ar 24000 -af loudnorm=I=-16:TP=-1 -c:a libvorbis -q:a 2 out.ogg`
- **File names** are stable and key-based, exactly as in the manifest, for example:
  - `audio/sat/fire/sat_fire_exit_prompt.ogg`
  - `audio/sat/fire/sat_fire_extinguisher_prompt.ogg`
  - `audio/sat/gas/sat_gas_ppe_prompt.ogg`
  - `audio/sat/gas/sat_gas_buddy_prompt.ogg`
- **To add a clip:**
  1. Copy the file to its manifest path.
  2. Set `status: 'recorded'` and `textSha` (the first 12 hex characters of the SHA-256 of the Santali text, the `santali_text_sha12` column in the sheet).
  3. Add the file to `sw.js` `ASSETS`.
  4. Run `npm run export:unity` and `npm test`.
- **Tests that guard the recordings:**
  - every required Fire/Gas line is in the manifest;
  - `recorded` clips must exist and `pending` ones must not;
  - there are no orphan files;
  - a recorded clip whose Santali text later changes fails until it is re-recorded;
  - recorded clips must be in the offline cache.

## 5. Offline behaviour
Everything above is local:
- the text is in the JS bundle and the clips are in the APK assets;
- AR text is rendered by Android, and AR playback uses `MediaPlayer` on APK assets;
- the fallback voice is offline Android TTS.

There is no INTERNET permission, remote translation, CDN or remote audio, cloud TTS, analytics or telemetry. The "no network" tests cover the new files, and the manifest test rejects non-relative clip paths.

## 6. Management portal
The management portal (Trainer, Mine Safety Officer, Contractor) stays **English-only**, as decided in D-040. It uses `SA.MGMT_STRINGS` through `tFor('en', …)` and is unaffected by the worker's language: selecting Santali changes nothing there. Role selection, persistence, logout, assignments, compliance, risk, certificates, +7 days and reset keep working (tested). The two worker-app links into the portal are translated.

## 7. Known limitations
- The Santali wording is **unreviewed** and may contain errors. The Hindi original is shown next to every safety instruction for that reason.
- **No Santali voice clips exist.** In AR, Santali users hear the Hindi voice, clearly labelled. The web screens are text-only in Santali.
- The Santali voice covers the fixed lines; scores are not spoken in Santali (they are on screen).
- The Safety Coach's Santali keyword list is also provisional.
- Dates show English month names in Chromium/WebView, which has no Santali locale data.
- Dynamic text is not voiced: worker names, numbers, coach answers.

## 8. Device validation (2026-10-03, Redmi Note 11, Android 13, airplane mode)
- **Ol Chiki** renders correctly in the WebView and in AR, using the system `NotoSansOlChiki-Regular.ttf`.
- **Pipeline check** (a temporary build with two test tones standing in for clips, never committed):
  - **Web briefing:** Listen played the clip, then the button changed to Play again.
  - **AR question 1:** the clip played via MediaPlayer about 0.4 s after the scene was placed, and ↻ replayed it.
  - **Lines without clips:** spoken by the Hindi voice, with the bilingual label.
  - **Fire AR in Santali:** score 100; the result reached the app.
- **Release `0.6.0-sat`** (no audio files):
  - Santali persisted across the upgrade and a restart.
  - The briefing shows the "not recorded" note and the Hindi lines.
  - Gas AR in Santali ran (operator-reported).
  - Switching to Hindi restored Hindi, and Hindi AR used the normal Hindi voice.
  - Hindi persisted after a force-stop.
  - No crashes; no latency problems were reported.

## 9. Future: dynamic Santali speech
For this curriculum, a fixed set of reviewed, pre-recorded clips is the most reliable option. A future offline Santali TTS model would be needed only for dynamic text. It would need:
- a native-speaker voice dataset;
- an on-device model small enough for low-end phones;
- review of its pronunciation of safety terms.

It would plug into the same `voice` abstraction, with clips for the fixed lines and TTS only for the rest. It is not planned for the prototype.
