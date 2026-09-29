# Unity AR Specification

## Unity stack
- Unity 2022.3 LTS
- AR Foundation 5.1.x
- ARCore XR Plugin 5.1.x
- IL2CPP
- ARM64
- minimum API 29
- OpenGLES3
- no Vulkan

## Scene
One scene:
`AR_Trainer`

## Placement
- first tap raycasts against detected plane;
- creates anchor;
- options arranged in a ~0.7m arc;
- options ~0.4m above floor;
- touch raycast against BoxCollider;
- if plane detection fails, auto-place ~1.5m ahead after ~3 seconds.

## Scripts
Expected conceptual scripts:
- `Scenario.cs`
- `ARScenarioController.cs`
- `AndroidBridge.cs`
- `OptionTag.cs`
- `ScenarioValidator.cs`

## Data
Scenario files can be read from StreamingAssets via UnityWebRequest.

## Performance
- models <5k tris
- textures <=1024
- no realtime lights
- mono OGG
- 30 FPS target
- 24 FPS minimum
- Unity assets <60 MB

## AR content
### Fire
Exit sign, extinguisher/electrical-fire context, smoke response.

### Gas
Leak zone, confined-space PPE, standby attendant.

## Fallback
Auto-placement if plane detection is flaky.

If AR library merge fails, use the two-app deep-link architecture.

## Implementation status (Milestone 1: standalone smoke test)
- Project: `unity-ar/` (Unity 2022.3.62f3, AR Foundation/ARCore 5.1.6). See `24_DECISION_LOG.md` D-021 and D-022.
- Scripts:
  - `Assets/Scripts/AR/ARPlacementController.cs`: tap → raycast on a horizontal plane → anchor attached to the plane. If no horizontal plane appears within 3 s of tracking, content is auto-placed 1.5 m ahead (0.6 m below the camera). A later tap on a plane re-places the content.
  - `ARBootstrap.cs`: camera permission, then ARCore availability, then session start. Each failure shows a message instead of crashing.
  - `Bridge/AndroidBridge.cs`: reads `module`/`lang` Intent extras and returns `{"module","score","wrong","completed"}` via `returnARResult` / `cancelAR`.
  - `UI/SmokeTestHUD.cs`: diagnostic overlay with a *Test fallback* button, which turns plane detection off to force the fallback path.
- Build without Android Studio:
  - `unity-ar/build.sh apk` → `unity-ar/Builds/SurakshaAR-ARTrainer-smoketest.apk`
  - `unity-ar/build.sh export` → Android library for `android-shell/`
- EditMode tests: `Assets/Tests/Editor/AndroidBridgeTests.cs` (score formula matches the web layer, plus the JSON contract).

### Milestone 1 device test (2026-09-29)
- **Device:** Redmi Note 11 (2201117TI, "spes"), Android 13 / API 33, arm64-v8a, GLES 3.2.
- **ARCore:** Google Play Services for AR 1.56, ARCore SDK 1.42 in the app.
- **APK:** `unity-ar/Builds/SurakshaAR-ARTrainer-smoketest.apk`, 17.2 MB, installed with `adb install -r`.
- **Results:**
  - Camera permission was granted.
  - The session reached SessionTracking, and 3–5 horizontal planes were detected.
  - A tap on a plane gave `placed via Plane`.
  - With plane detection off, the fallback fired after about 3 s (`placed via Fallback`), and the cube was visible ahead once the phone was raised.
  - 28–30 FPS.
  - No crash: the crash buffer is empty. The only app exit on record was a background SIGKILL by the OS.
- **Notes for later milestones:**
  - Fallback content is out of view when the phone points at the floor; the hint text should say "look ahead".
  - A "referenced script is missing" warning is logged once at startup and needs investigating.
  - The merged manifest contains an INTERNET permission from the ARCore/UnityWebRequest packages.

## Implementation status (Milestone 2: Fire AR on the shared engine)
- **Engine:**
  - `Scripts/Scenario/Scenario.cs`: content model, `LocalizedText` fallback, and `ScenarioSession` (shuffled options, one answer per step, shared score formula).
  - `ScenarioValidator.cs`: same rules as the web app.
  - `Scripts/AR/ARScenarioController.cs`: module-agnostic flow: place → step → tap → feedback → result → `AndroidBridge.SendResult`.
- **Layout:**
  - Three options in a concave arc, radius 0.7 m (±40°), 0.4 m above the floor.
  - Each option has a thin pole and floor marker, a billboard label and a 0.40 × 0.66 × 0.34 m BoxCollider tap target (`OptionTag`).
  - A per-step hazard cue sits behind the arc.
- **Fire props (`PropFactory`), unlit primitives, no textures except text:**
  - Step 1: exit sign, lift, window; cue: alarm beacon with flames.
  - Step 2: CO₂ extinguisher (black horn), water bucket, foam extinguisher; cue: electrical panel on fire.
  - Step 3: crawling figure, upright figure, door with back arrow; cue: smoke layer above clearer air.
  - Other IDs get a generic marker until their props are added (Gas: Milestone 3).
- **Feedback:**
  - The chosen option shows "✓ Correct" (green) or "✕ Not safe" (red) and pulses.
  - After a wrong answer the safe option is revealed as "✓ Safe answer"; nothing is revealed before an answer.
  - The bottom panel shows the "why" text with Continue / See result.
  - Duplicate taps are ignored.
- **Re-placement:** a tap that misses the options moves the area only while placing, or when it was auto-placed by the fallback.
- **EditMode tests:** `Assets/Tests/Editor/ScenarioEngineTests.cs` plus `AndroidBridgeTests.cs` (20 tests).

### Milestone 2 device test (2026-09-29, Redmi Note 11 / Android 13)
- **English Fire, played by hand:**
  - Round 1 (water at step 2) gave `wrong=1 score=67`, NOT PASSED.
  - "Train again", then all correct, gave `wrong=0 score=100`, PASSED.
  - Result JSON matched the contract both times.
- **Hindi and Santali (launched with `--es lang hi|sat` Intent extras):**
  - Devanagari is correctly shaped by the native renderer.
  - The Hindi TTS voice is available.
  - Santali uses its module title and falls back to Hindi for everything else, without errors.
- **Invalid module (`--es module machinery`):** shows the error screen; "Back to app" sends `cancel bad_params`. No crash.
- **Placement:** worked on a detected plane and via fallback. 26–30 FPS during training. No crash-buffer entries.
- **Fixes found on the device:**
  - `Assets/link.xml` keeps the collider classes that are only created at runtime; engine stripping had removed them.
  - The arc was narrowed to ±30° (0.7 m chord) to fit the phone view.
  - The step hazard cue is moved behind and beside the arc.

## Implementation status (Milestone 3: Gas Leak & Confined Space AR)
- **Gas props (`PropFactory`), same engine and layout as Fire:**
  - Step 1: red leak zone (red disc, leaking pipe, gas cloud, "⚠ GAS"), open area (grass, tree, sun), office (desk, monitor, chair). Cue: gas alarm with blinking light, off to the side.
  - Step 2: gas detector (O₂/H₂S display) + breathing set (cylinder, mask, hose); hard hat + gloves; worker with no PPE ("✕"). Cue: manhole with a "⚠ CONFINED SPACE" sign and gas inside.
  - Step 3: standby attendant in hi-vis with a radio; empty post (faint outline, "?"); phone + clock. Cue: manhole with a worker's helmet in the opening and a rope leading out.
- Step 1 deliberately has no free-floating gas cloud: it could sit behind a wrong option (Office) and imply that option is the hazard.
- **Shared-engine fix:** every step now sets its own bottom hint, so "Train again" after an auto-placed area no longer shows the previous result card. Fire and Gas both use this path.
- **Tests:** 26 EditMode tests. New ones check that every scenario option/step has a dedicated prop under the 5k-triangle budget, that Gas scores 100 and 67 with the contract JSON, and that Gas has Hindi text with the Santali→Hindi fallback.

### Milestone 3 device test (2026-09-29, Redmi Note 11 / Android 13)
- **Gas, played by hand:**
  - Round with two wrong answers: `score=33`.
  - All wrong (office, no_ppe, nobody): `score=0`.
  - All correct (red_zone, detector_breathing, attendant): `score=100`.
  - After "Train again": red_zone ✓, cap_gloves ✕, attendant ✓ gave `score=67`.
  - Every payload was `{"module":"gas_confined","score":N,"wrong":N,"completed":true}`.
- **Hindi Gas:** correctly shaped text; the Hindi TTS voice is usable.
- **Fire regression:** exit ✓, water ✕, crawl low ✓ gave `score=67`, with the same props and layout as Milestone 2.
- 27–30 FPS during Gas and Fire training. No crash-buffer entries. APK 17.4 MB with CAMERA and VIBRATE permissions only.
