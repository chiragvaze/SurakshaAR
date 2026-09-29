using System;
using UnityEngine;

namespace SurakshaAR
{
    /// <summary>
    /// Unity side of the Web &lt;-&gt; Android &lt;-&gt; Unity contract (docs/07_API_AND_BRIDGE_CONTRACTS.md).
    ///
    /// In:  the Android shell starts the Unity activity with Intent extras "module" and "lang"
    ///      (it received them from the web app's Android.launchAR(module, lang)).
    /// Out: Unity calls the hosting activity's returnARResult(json) / cancelAR(reason).
    ///      The shell forwards the JSON to window.SurakshaAR.onARResult(json), where the web
    ///      layer re-validates and re-scores it. Unity never issues certificates.
    ///
    /// In a standalone Unity APK (Milestone 1 smoke test) there is no shell activity, so the
    /// calls fail gracefully and return false.
    /// </summary>
    public static class AndroidBridge
    {
        public static readonly string[] Modules = { "fire_explosion", "gas_confined" };
        public static readonly string[] Languages = { "en", "hi", "sat" };

        public const string DefaultModule = "fire_explosion";
        public const string DefaultLanguage = "en";

        public static string Module { get; private set; } = DefaultModule;
        public static string Language { get; private set; } = DefaultLanguage;

        /// <summary>True when the activity was started with launch extras (i.e. by the shell).</summary>
        public static bool LaunchedByShell { get; private set; }

        /// <summary>True when the shell passed a module/lang that is not in the contract.</summary>
        public static bool InvalidLaunchParams { get; private set; }

        public static bool IsValidModule(string module) => module != null && Array.IndexOf(Modules, module) >= 0;
        public static bool IsValidLanguage(string lang) => lang != null && Array.IndexOf(Languages, lang) >= 0;

        /// <summary>
        /// Same formula as the web layer: round(100 * (steps - wrong) / steps).
        /// Math.Floor(x + 0.5) matches JavaScript Math.round for these non-negative values
        /// (C# Math.Round would use banker's rounding).
        /// </summary>
        public static int ComputeScore(int steps, int wrong)
        {
            if (steps <= 0) throw new ArgumentOutOfRangeException(nameof(steps));
            if (wrong < 0 || wrong > steps) throw new ArgumentOutOfRangeException(nameof(wrong));
            return (int)Math.Floor(100.0 * (steps - wrong) / steps + 0.5);
        }

        /// <summary>{"module":"...","score":N,"wrong":N,"completed":true}</summary>
        public static string BuildResultJson(string module, int steps, int wrong)
        {
            if (!IsValidModule(module)) throw new ArgumentException("Unknown module", nameof(module));
            int score = ComputeScore(steps, wrong);
            // module is from a fixed whitelist, so no JSON escaping is needed.
            return "{\"module\":\"" + module + "\",\"score\":" + score + ",\"wrong\":" + wrong + ",\"completed\":true}";
        }

        /// <summary>Read module/lang from the launching Intent. Safe to call in the editor.</summary>
        public static void ReadLaunchParams()
        {
            string module = null, lang = null;
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
                using (var intent = activity.Call<AndroidJavaObject>("getIntent"))
                {
                    module = intent.Call<string>("getStringExtra", "module");
                    lang = intent.Call<string>("getStringExtra", "lang");
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning("[AndroidBridge] Could not read launch intent: " + e.Message);
            }
#endif
            LaunchedByShell = module != null || lang != null;
            InvalidLaunchParams = LaunchedByShell && (!IsValidModule(module) || !IsValidLanguage(lang));
            Module = IsValidModule(module) ? module : DefaultModule;
            Language = IsValidLanguage(lang) ? lang : DefaultLanguage;
            Debug.Log($"[AndroidBridge] launch module={Module} lang={Language} byShell={LaunchedByShell} invalid={InvalidLaunchParams}");
        }

        /// <summary>Send a completed result to the shell. Returns false when no shell is present.</summary>
        public static bool SendResult(string module, int steps, int wrong)
        {
            string json = BuildResultJson(module, steps, wrong);
            Debug.Log("[AndroidBridge] result " + json);
            return CallHostActivity("returnARResult", json);
        }

        /// <summary>Tell the shell AR was closed without a result (e.g. back button, AR unsupported).</summary>
        public static bool Cancel(string reason)
        {
            Debug.Log("[AndroidBridge] cancel " + reason);
            return CallHostActivity("cancelAR", reason);
        }

        static bool CallHostActivity(string method, string argument)
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
                {
                    activity.Call(method, argument);
                    return true;
                }
            }
            catch (Exception e)
            {
                // Standalone Unity APK: the activity has no such method.
                Debug.Log($"[AndroidBridge] no shell activity for {method}: {e.Message}");
                return false;
            }
#else
            return false;
#endif
        }
    }
}
