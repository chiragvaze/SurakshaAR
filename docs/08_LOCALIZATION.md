# Localization Specification

## Prototype languages
- English (`en`)
- Hindi (`hi`)
- Santali (`sat`)

## Fallback
`sat -> hi -> en`

## Rules
- No hardcoded UI text inside components where avoidable.
- Translation dictionaries are separate from UI logic.
- Scenario prompts/options are localized.
- Audio resources are per language.
- If a language audio asset is missing: Hindi audio fallback, then text-only.
- Santali public/demo strings and audio should be reviewed by a native speaker.

## Phase 1 implementation
- Dictionaries: `web-app/js/i18n/strings.js`. Lookup and fallback: `web-app/js/i18n/i18n.js`. The selected language is persisted in `sa_v1.settings.language`.
- Scenario text keys: `scn.<stepId>.prompt`, `scn.<stepId>.opt.<optionId>`, `scn.<stepId>.why` (D-010). Module titles come from `25_SCENARIO_CONTENT.json`.
- English and Hindi are complete; a unit test enforces Hindi completeness.
- Santali is partial pending native-speaker review (D-018). Missing strings fall back to Hindi, and the home screen shows a notice when Santali is selected.
- P3-M3 (D-036) found **no native-speaker-approved Santali content** in the repository.
  - Existing Santali: 1 greeting, 2 module titles and the picker label. None of it has an approval record.
  - There is no Santali audio.
  - The fallback stays unchanged, and no translations are to be invented. The demo is presented in Hindi.

## Santali milestone (D-042, 2026-10-03)
This supersedes the Santali status above. Full details: [`SANTALI_LOCALIZATION.md`](SANTALI_LOCALIZATION.md).
- Santali uses Ol Chiki and covers every worker-app key (448) plus the module titles, in one reviewable file: `web-app/js/i18n/santali.js`.
- The wording is a **provisional AI draft**. Every key is `native-review-required`; no native review has happened.
  - While unreviewed, every safety instruction also shows the Hindi original.
- **Santali audio:**
  - Pre-recorded offline clips are mapped by text key in `santali-audio.js` and played on the web and in AR.
  - **0 of 20 clips are recorded.**
  - In AR, Santali falls back to the Hindi voice speaking the Hindi text, with a visible "Hindi voice" label. Web screens are text-only.
- The fallback chain is still `sat -> hi -> en`. The management portal is still English-only (D-040).

## Future
The supplied deck discusses additional Jharkhand languages. Those are roadmap scope unless explicitly promoted into the prototype.
