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
GRADLE="$(ls -d "$AP"/Tools/gradle/bin/gradle* 2>/dev/null | grep -v '\.bat$' | head -1)"
if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* ]]; then GRADLE="$AP/Tools/gradle/bin/gradle.bat"; fi
ADB="$ANDROID_SDK_ROOT/platform-tools/adb"

# local.properties with forward slashes (valid on Windows too).
to_win() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
{
  echo "sdk.dir=$(to_win "$ANDROID_SDK_ROOT")"
  echo "ndk.dir=$(to_win "$AP/NDK")"
} > local.properties

case "${1:-debug}" in
  debug)   "$GRADLE" --no-daemon assembleDebug ;;
  test)    "$GRADLE" --no-daemon testDebugUnitTest ;;
  install) "$GRADLE" --no-daemon assembleDebug && "$ADB" install -r app/build/outputs/apk/debug/app-debug.apk ;;
  *) echo "usage: $0 [debug|test|install]" >&2; exit 2 ;;
esac
