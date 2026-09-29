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

## Future
The supplied deck discusses additional Jharkhand languages. Those are roadmap scope unless explicitly promoted into the prototype.
