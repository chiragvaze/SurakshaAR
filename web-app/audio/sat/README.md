# Santali voice clips (offline, pre-recorded)

No clips have been recorded yet. Every line is `recording-pending` in
`web-app/js/i18n/santali-audio.js`, and the app says "Santali voice not recorded yet" instead
of playing anything else.

To add a clip:
1. A native Santali speaker reviews the line's Santali text in `js/i18n/santali.js` (record the
   review in `REVIEW_LOG`). Record only finalised text.
2. Record it to the spec in `docs/SANTALI_LOCALIZATION.md`, and save it at the exact path in the
   manifest, for example `audio/sat/fire/sat_fire_exit_prompt.ogg`.
3. In `santali-audio.js`, set that entry's `status: 'recorded'` and its `textSha`: the first
   12 hex characters of the SHA-256 of the Santali text. Run `npm run santali:sheet` to print them.
4. Add the file to `ASSETS` in `web-app/sw.js`, then run `npm run export:unity` and `npm test`.

Only `.ogg` files are packaged into the APK. This README is not.
