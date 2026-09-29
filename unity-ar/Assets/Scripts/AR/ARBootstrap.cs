using System.Collections;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
#if UNITY_ANDROID
using UnityEngine.Android;
#endif

namespace SurakshaAR
{
    /// <summary>
    /// Start-up sequence: read launch params -> camera permission -> ARCore availability -> start session.
    /// Every failure shows a clear message instead of crashing, and lets the user go back.
    /// Camera frames are only used locally by ARCore; nothing is recorded or uploaded.
    /// </summary>
    public class ARBootstrap : MonoBehaviour
    {
        public ARSession session;
        public SmokeTestHUD hud;

        IEnumerator Start()
        {
            Application.targetFrameRate = 30;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            AndroidBridge.ReadLaunchParams();
            hud.SetLaunchInfo(AndroidBridge.Module, AndroidBridge.Language, AndroidBridge.LaunchedByShell);
            if (AndroidBridge.InvalidLaunchParams)
            {
                hud.ShowError("Unknown training module or language requested. Returning to the app.", "bad_params");
                yield break;
            }

#if UNITY_ANDROID && !UNITY_EDITOR
            if (!Permission.HasUserAuthorizedPermission(Permission.Camera))
            {
                bool? granted = null;
                var callbacks = new PermissionCallbacks();
                callbacks.PermissionGranted += _ => granted = true;
                callbacks.PermissionDenied += _ => granted = false;
                callbacks.PermissionDeniedAndDontAskAgain += _ => granted = false;
                Permission.RequestUserPermission(Permission.Camera, callbacks);
                while (granted == null) yield return null;
                if (!granted.Value)
                {
                    hud.ShowError("Camera permission is needed for AR training. Allow Camera for this app in Settings > Apps, then try again.", "camera_denied");
                    yield break;
                }
            }
#endif

            if (ARSession.state == ARSessionState.None || ARSession.state == ARSessionState.CheckingAvailability)
            {
                yield return ARSession.CheckAvailability();
            }

            if (ARSession.state == ARSessionState.NeedsInstall)
            {
                // Google Play Services for AR missing/outdated. Installing needs network.
                yield return ARSession.Install();
            }

            if (ARSession.state == ARSessionState.Unsupported || ARSession.state == ARSessionState.NeedsInstall)
            {
                hud.ShowError("This phone does not support ARCore (or Google Play Services for AR is not installed).", "ar_unsupported");
                yield break;
            }

            session.enabled = true;
        }
    }
}
