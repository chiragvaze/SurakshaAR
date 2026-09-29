using System.Collections;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
#if UNITY_ANDROID
using UnityEngine.Android;
#endif

namespace SurakshaAR
{
    /// <summary>
    /// Start-up sequence: launch params -> content -> camera permission -> ARCore availability
    /// -> start session. Every failure shows a clear message instead of crashing; "Back to app"
    /// returns a reason code to the shell (cancelAR). Camera frames stay on-device (ARCore only).
    /// </summary>
    public class ARBootstrap : MonoBehaviour
    {
        public ARSession session;
        public ARScenarioController controller;

        IEnumerator Start()
        {
            Application.targetFrameRate = 30;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            AndroidBridge.ReadLaunchParams();
            if (!controller.LoadContent(AndroidBridge.Module, AndroidBridge.Language)) yield break;
            if (AndroidBridge.InvalidLaunchParams)
            {
                controller.Fail("ar.err.badParams", "bad_params");
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
                    controller.Fail("ar.err.cameraDenied", "camera_denied");
                    yield break;
                }
            }
#endif

            if (ARSession.state == ARSessionState.None || ARSession.state == ARSessionState.CheckingAvailability)
                yield return ARSession.CheckAvailability();

            if (ARSession.state == ARSessionState.NeedsInstall)
                yield return ARSession.Install(); // Google Play Services for AR missing/outdated (needs network)

            if (ARSession.state == ARSessionState.Unsupported || ARSession.state == ARSessionState.NeedsInstall)
            {
                controller.Fail("ar.err.unsupported", "ar_unsupported");
                yield break;
            }

            session.enabled = true;
            controller.OnSessionStarted();
        }
    }
}
