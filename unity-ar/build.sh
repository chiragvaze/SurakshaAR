#!/usr/bin/env bash
# Batch-mode Unity build for the AR trainer (Git Bash on Windows, or bash on macOS/Linux).
#
#   ./build.sh setup     configure Player/XR settings + generate the AR_Trainer scene
#   ./build.sh apk       standalone smoke-test APK -> Builds/SurakshaAR-ARTrainer-smoketest.apk
#   ./build.sh export    Android library export   -> Builds/AndroidExport (used by android-shell)
#
# Override the editor location with UNITY_EDITOR=/path/to/Unity(.exe).
set -euo pipefail
cd "$(dirname "$0")"

UNITY_VERSION="2022.3.62f3"
if [[ -z "${UNITY_EDITOR:-}" ]]; then
  for candidate in \
    "/c/Program Files/Unity/Hub/Editor/$UNITY_VERSION/Editor/Unity.exe" \
    "/Applications/Unity/Hub/Editor/$UNITY_VERSION/Unity.app/Contents/MacOS/Unity" \
    "$HOME/Unity/Hub/Editor/$UNITY_VERSION/Editor/Unity"; do
    [[ -x "$candidate" ]] && UNITY_EDITOR="$candidate" && break
  done
fi
[[ -n "${UNITY_EDITOR:-}" ]] || { echo "Unity $UNITY_VERSION not found; set UNITY_EDITOR" >&2; exit 1; }

case "${1:-apk}" in
  setup)  METHOD="SurakshaAR.EditorTools.SurakshaBuild.CI_Setup" ;;
  apk)    METHOD="SurakshaAR.EditorTools.SurakshaBuild.CI_BuildStandaloneApk" ;;
  export) METHOD="SurakshaAR.EditorTools.SurakshaBuild.CI_ExportAndroidLibrary" ;;
  *) echo "usage: $0 [setup|apk|export]" >&2; exit 2 ;;
esac

mkdir -p Logs
LOG="Logs/build-${1:-apk}.log"
echo "Unity: $UNITY_EDITOR"
echo "Running $METHOD (log: unity-ar/$LOG)"
set +e
"$UNITY_EDITOR" -batchmode -nographics -quit -projectPath "$(pwd)" -buildTarget Android \
  -executeMethod "$METHOD" -logFile "$LOG"
code=$?
set -e
grep -E "\[SurakshaBuild\]|error CS|Build (succeeded|failed)|Exception" "$LOG" | tail -40 || true
exit $code
