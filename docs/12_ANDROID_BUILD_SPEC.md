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
