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
