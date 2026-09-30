# Performance Specification

## Targets
- AR: 30 FPS target, 24 FPS minimum.
- cold start: <5 seconds target.
- APK: <=150 MB.
- Unity assets: <60 MB.
- models: <5k tris.
- textures: <=1024.
- no realtime lights.
- mono OGG audio.

## Optimization order
1. Remove unnecessary assets.
2. Reduce model polygons.
3. Reduce texture sizes.
4. Reduce number of simultaneously rendered options.
5. Remove shadows/realtime lighting.
6. Simplify audio.
7. Only then consider deeper architectural changes.

## Measured (Redmi Note 11, Android 13; debug APK 0.4.0-m4)

| Target | Measured | Source |
|---|---|---|
| AR 30 FPS target, 24 minimum | About 29.8–29.9 FPS sustained: Fire about 9 min, Gas 3+ min. Brief isolated dips (25.9 during AR start-up, one 20.1 reading) recovered immediately. | Phase 2 M5 |
| Cold start under 5 s | About 1.8 s to Welcome; about 2.0 s to Home on a second cold start | P3-M1 |
| First usable AR view | Fire about 5.2 s, Gas about 4.1 s after tapping Start. About 4 s of this is Unity's startup screen. No target is documented. | P3-M1 |
| APK up to 150 MB | 25.3 MB (25,284,700 bytes) | Phase 2 M5 |
| Unity assets under 60 MB | Not measured separately. The whole APK, Unity included, is 25.3 MB. | Phase 2 M5 |
| Memory | AR process 360–411 MB PSS, no upward trend | Phase 2 M5 |

**Release APK (P3-M2, D-035):**
- APK size: 22.8 MB (22,798,055 bytes).
- Cold-start first frame: 0.95 s and 0.76 s. The Welcome render time can't be measured in the release build, because in-page timing requires WebView debugging, which release turns off.
- First usable AR view: Fire 5.0 s; Gas 4.0 s and 3.6 s.
- FPS was not re-measured for the release build. The Unity native code is the same export, and IL2CPP compiles in its Release configuration for both builds.

Only one phone model has been measured.

## Frame-drop fallback
- two options instead of three where the scenario permits a safe prototype simplification;
- smaller models;
- no shadows.
