# Test Strategy

## Test layers

### Unit
- score calculation
- risk calculation
- certificate encode/decode
- HMAC verify
- scenario validation
- language fallback

### Integration
- worker persistence
- module -> result
- result -> certificate
- certificate -> verification
- +7 -> dashboard

### AR
- plane detection
- anchor placement
- option tap
- wrong/correct feedback
- Unity result bridge

### Device
- Android 10+
- ARCore supported phone
- low-end device where available
- portrait/landscape behavior as defined
- airplane mode

### Security
- tampered QR
- expired certificate
- malformed payload
- unexpected module ID
- local storage corruption handling

### Performance
- startup
- FPS
- memory
- APK size
- asset size

## Regression principle
A shared scenario engine means every change to scoring/content must run both Fire and Gas tests.

## Execution record (as of 2026-09-30)
- **Automated suites:**
  - Web: 72 tests (`web-app`, `npm test`).
  - Shell: 6 JVM tests (`android-shell/build.sh test`).
  - Unity: 26 EditMode tests.
  - All three pass. P3-M1 ran them before and after the device run, and P3-M2 after its build-configuration change.
- **Device, AR and integration layers:**
  - Physically validated on one phone, the Redmi Note 11 (Android 13, ARCore 1.56).
  - Phase 2 Milestones 1–5 covered AR, the result bridge, offline use, performance and clean install (`11_UNITY_AR_SPEC.md`, `12_ANDROID_BUILD_SPEC.md`).
  - **P3-M1** was the full demo journey inside the APK, including the +7 → dashboard integration path (D-033).
  - **P3-M2** repeated the demo journey as a 24-step offline smoke test on the locally signed **release** APK. Nothing behaved differently (D-035).
- **Not yet covered:**
  - a low-end device, or any second phone model;
  - the unsupported-device and launch-failure paths (code-reviewed and unit-tested only);
  - camera denial after a D-032 fix.
- **Security layer:**
  - Tampered QR: automated tests, plus on the phone (Phase 2 M5, P3-M1).
  - Expired certificate, malformed payload, unexpected module ID and storage corruption: automated tests. The unknown module was also checked on the phone in Phase 2 M2.
