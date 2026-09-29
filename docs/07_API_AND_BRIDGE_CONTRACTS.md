# API and Bridge Contracts

## Phase 1
No network API is required.

## Web -> Android -> Unity
Conceptual call:
```js
Android.launchAR(module, lang)
```

Parameters:
- `module`: `fire_explosion` | `gas_confined`
- `lang`: `en` | `hi` | `sat`

## Unity -> Web
Result must communicate:
- module
- score
- wrong
- completion state

Example:
```json
{
  "module": "fire_explosion",
  "score": 100,
  "wrong": 0,
  "completed": true
}
```

## Web-side contract (implemented in Phase 1: `web-app/js/services/bridge.js`)
- Launch: when `window.Android.launchAR` exists, the module briefing's Start button calls `Android.launchAR(module, lang)`. Otherwise the browser scenario engine runs the same assessment.
- Result: the Android shell delivers the Unity result by calling `window.SurakshaAR.onARResult(json)`, for example via `evaluateJavascript`. `json` may be a string or an object with `module`, `wrong`, `completed` and optionally `score`/`steps`.
- The web layer treats the result as untrusted. It rejects an unknown module, `wrong` outside 0..steps, `completed !== true`, or a `score` that differs from `round(100*(steps-wrong)/steps)`. It then stores the attempt and routes to the Result screen, the same pipeline used by the browser trainer.
- Rejected results show an error message and store nothing.

## Deep-link fallback
If Unity Library integration fails:
```text
surakshaar://result?score=100&wrong=0
```

## Future API
If cloud sync is added later, it must be non-blocking and must not replace local-first operation.
