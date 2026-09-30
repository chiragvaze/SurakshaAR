# Repository Structure

```text
surakshaar/
├── docs/
│   ├── 00_MASTER_SPEC.md
│   ├── 01_PRD.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_UI_UX.md
│   ├── 04_SECURITY.md
│   ├── 05_DATA_MODEL.md
│   ├── 06_SCENARIO_ENGINE.md
│   ├── 07_API_AND_BRIDGE_CONTRACTS.md
│   ├── 08_LOCALIZATION.md
│   ├── 09_CERTIFICATE_QR.md
│   ├── 10_RETENTION_DASHBOARD.md
│   ├── 11_UNITY_AR_SPEC.md
│   ├── 12_ANDROID_BUILD_SPEC.md
│   ├── 13_TEST_STRATEGY.md
│   ├── 14_TEST_CASES.md
│   ├── 15_PERFORMANCE.md
│   ├── 16_PRIVACY.md
│   ├── 17_DEPLOYMENT.md
│   ├── 18_FALLBACKS_AND_RISKS.md
│   ├── 19_DEMO_SCRIPT.md
│   ├── 20_DEFINITION_OF_DONE.md
│   ├── 21_PHASE_PLAN.md
│   ├── 22_REPO_STRUCTURE.md
│   ├── 23_ROADMAP.md
│   └── 24_DECISION_LOG.md
├── web-app/
├── unity-ar/
├── android-shell/
└── dashboard/
```

## Principle
Documentation lives under `/docs`; implementation lives outside it.

## `web-app/` (Phase 1)
```text
web-app/
├── index.html            # loads classic scripts in dependency order
├── sw.js                 # offline cache for http(s) serving
├── css/app.css
├── js/
│   ├── utils/            # codec (UTF-8/Base64), sha256 (+HMAC), qr encoder, validation
│   ├── data/             # scenarios.js (generated from docs/25), seed-workers.js
│   ├── i18n/             # strings.js (en/hi/sat), i18n.js (fallback)
│   ├── scenario/         # scoring.js, validator.js, engine.js (shared by all modules)
│   ├── storage/          # store.js (sa_v1)
│   ├── certificate/      # certificate.js (demo HMAC issue/verify)
│   ├── services/         # clock, retention, training pipeline, bridge (Phase 2 boundary)
│   ├── components/       # dom builder + shared UI pieces
│   ├── screens/          # onboarding, home, training, certificate/verify, dashboard
│   └── app.js            # router, guards, boot
├── tests/                # node:test unit + integration tests
└── tools/                # serve.js (dev server), sync-scenarios.js
```
`unity-ar/`, `android-shell/` and `dashboard/` are created in the phases that need them. The Phase 1 dashboard is a `web-app` screen (D-016).

## `android-shell/` (Phase 2, Milestone 4)
```text
android-shell/
├── build.sh                 # builds with Unity's JDK/SDK/NDK/Gradle (no Android Studio)
├── settings.gradle          # :app + :unityLibrary (../unity-ar/Builds/AndroidExport)
└── app/src/main/
    ├── AndroidManifest.xml  # MainActivity (launcher), ARUnityActivity (:unity process)
    ├── java/com/surakshaar/shell/
    │   ├── MainActivity.kt      # WebView + WebViewAssetLoader + Android.launchAR bridge
    │   ├── ARUnityActivity.kt   # Unity host: returnARResult / cancelAR
    │   └── BridgeContract.kt    # whitelist, result sanitizing, safe JS calls
    └── res/                     # strings, vector launcher icon
```
The web app is **not** copied into this folder. Gradle copies `../web-app` into build assets at build time.
