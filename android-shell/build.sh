#!/usr/bin/env bash
# Builds the Android shell (WebView + Unity AR library) with the JDK, Android SDK/NDK and
# Gradle that ship with Unity's Android Build Support, so Android Studio is not required.
#
#   ./build.sh            assembleDebug   -> app/build/outputs/apk/debug/app-debug.apk
#   ./build.sh test       JVM unit tests (BridgeContract)
#   ./build.sh install    assembleDebug + adb install -r
#
# Prerequisite: unity-ar/build.sh export  (creates ../unity-ar/Builds/AndroidExport)
set -euo pipefail
cd "$(dirname "$0")"

UNITY_VERSION="2022.3.62f3"
UNITY_ROOT="${UNITY_ROOT:-/c/Program Files/Unity/Hub/Editor/$UNITY_VERSION/Editor}"
AP="$UNITY_ROOT/Data/PlaybackEngines/AndroidPlayer"
[[ -d "$AP" ]] || { echo "Unity Android Build Support not found at: $AP (set UNITY_ROOT)" >&2; exit 1; }
[[ -d ../unity-ar/Builds/AndroidExport/unityLibrary ]] || { echo "Run ../unity-ar/build.sh export first" >&2; exit 1; }

export JAVA_HOME="$AP/OpenJDK"
export ANDROID_SDK_ROOT="$AP/SDK"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
# Unity ships Gradle as jars only (no bin/ script); run its launcher the same way Unity does.
GRADLE_LAUNCHER="$(ls "$AP"/Tools/gradle/lib/gradle-launcher-*.jar 2>/dev/null | head -1 || true)"
[[ -n "$GRADLE_LAUNCHER" ]] || { echo "Unity's Gradle launcher jar not found under $AP/Tools/gradle/lib" >&2; exit 1; }
gradle() { "$JAVA_HOME/bin/java" -Xmx2g -cp "$GRADLE_LAUNCHER" org.gradle.launcher.GradleMain "$@"; }
ADB="$ANDROID_SDK_ROOT/platform-tools/adb"
# Use Unity's bundled aapt2 instead of downloading one from Maven (same as Unity's own export).
AAPT2="$ANDROID_SDK_ROOT/build-tools/34.0.0/aapt2"; [[ -f "$AAPT2.exe" ]] && AAPT2="$AAPT2.exe"

# local.properties with forward slashes (valid on Windows too). Only sdk.dir, like Unity's own
# export: the Unity library sets android.ndkPath itself, and AGP rejects having both (CXX1100).
to_win() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
echo "sdk.dir=$(to_win "$ANDROID_SDK_ROOT")" > local.properties

GRADLE_ARGS=("-Pandroid.aapt2FromMavenOverride=$(to_win "$AAPT2")")

case "${1:-debug}" in
  debug)   gradle --no-daemon "${GRADLE_ARGS[@]}" assembleDebug && echo "APK: $(pwd)/app/build/outputs/apk/debug/app-debug.apk" ;;
  test)    gradle --no-daemon "${GRADLE_ARGS[@]}" :app:testDebugUnitTest ;;
  install) gradle --no-daemon "${GRADLE_ARGS[@]}" assembleDebug && "$ADB" install -r app/build/outputs/apk/debug/app-debug.apk ;;
  *) echo "usage: $0 [debug|test|install]" >&2; exit 2 ;;
esac
