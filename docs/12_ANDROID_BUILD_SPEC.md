# Android Build Specification

## Shell
- Kotlin
- Android Studio
- WebView
- JavaScript interface
- Unity as Library

## Manifest/permissions
Camera permission is required for AR.

## Build
- Android 10+ / API 29+
- IL2CPP
- ARM64
- OpenGLES3
- no Vulkan

## Integration order
1. Build/export Unity library.
2. Copy into Android project.
3. Copy web app assets.
4. Configure WebView + bridge.
5. Gradle assemble release.
6. Install on physical ARCore phone.
7. Test offline.

## Device
Phase 2/3 needs a physical ARCore-capable Android device.

Enable:
- Developer Options
- USB debugging

## No required cloud credentials
No Firebase, Google Cloud API key, Supabase, Vuforia or other service credential is required for the prototype.

## Implementation status (Milestone 4)
Build steps, with no Android Studio (see `24_DECISION_LOG.md` D-029):
```bash
unity-ar/build.sh export      # Unity -> unity-ar/Builds/AndroidExport (unityLibrary)
android-shell/build.sh test   # JVM unit tests (BridgeContract)
android-shell/build.sh        # -> android-shell/app/build/outputs/apk/debug/app-debug.apk
```

The APK is `com.surakshaar.app`: minSdk 29, targetSdk 34, compileSdk 36, arm64-v8a only, about 25 MB. It requests CAMERA and VIBRATE only.
