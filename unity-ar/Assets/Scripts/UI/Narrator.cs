using UnityEngine;

namespace SurakshaAR
{
    /// <summary>
    /// Voice instructions via offline Android text-to-speech. Voice is optional: if the engine or
    /// the language voice is missing, the trainer stays text-only and nothing breaks.
    /// Santali has no TTS voice; Santali text currently falls back to Hindi, spoken with the
    /// Hindi voice (docs/08_LOCALIZATION.md: "Hindi audio fallback, then text-only").
    /// </summary>
    public class Narrator : MonoBehaviour
    {
        public bool Muted { get; private set; }

        AndroidJavaClass m_Native;
        string m_Pending;
        string m_PendingLang;
        string m_CurrentLang;

        void Start()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                m_Native = new AndroidJavaClass("com.surakshaar.unity.SurakshaNative");
                using (var up = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
                using (var activity = up.GetStatic<AndroidJavaObject>("currentActivity"))
                {
                    m_Native.CallStatic("ttsInit", activity);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogWarning("[Narrator] TTS unavailable: " + e.Message);
                m_Native = null;
            }
#endif
        }

        void Update()
        {
            // TTS starts asynchronously; speak the latest queued line once it is ready.
            if (m_Pending != null && State == 2)
            {
                string text = m_Pending, lang = m_PendingLang;
                m_Pending = null;
                SpeakNow(text, lang);
            }
        }

        int State
        {
            get
            {
                if (m_Native == null) return -1;
                try { return m_Native.CallStatic<int>("ttsState"); } catch { return -1; }
            }
        }

        /// <param name="lang">Language the text is actually written in ("en" or "hi").</param>
        public void Say(string text, string lang)
        {
            if (Muted || string.IsNullOrEmpty(text) || m_Native == null) return;
            int state = State;
            if (state == 2) SpeakNow(text, lang);
            else if (state == 1 || state == 0) { m_Pending = text; m_PendingLang = lang; }
        }

        void SpeakNow(string text, string lang)
        {
            try
            {
                string voice = lang == "en" ? "en" : "hi"; // sat has no voice -> Hindi voice
                if (voice != m_CurrentLang)
                {
                    m_Native.CallStatic<bool>("ttsSetLanguage", voice);
                    m_CurrentLang = voice;
                }
                m_Native.CallStatic<bool>("ttsSpeak", text);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning("[Narrator] " + e.Message);
            }
        }

        public void SetMuted(bool muted)
        {
            Muted = muted;
            if (muted) Stop();
        }

        public void Stop()
        {
            m_Pending = null;
            try { m_Native?.CallStatic("ttsStop"); } catch { /* ignore */ }
        }

        void OnDestroy()
        {
            try { m_Native?.CallStatic("ttsShutdown"); } catch { /* ignore */ }
            m_Native?.Dispose();
        }
    }
}
