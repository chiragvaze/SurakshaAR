using System;
using UnityEngine;

namespace SurakshaAR
{
    /// <summary>
    /// Voice instructions. Voice is optional: if nothing can be played the trainer stays
    /// text-only and nothing breaks.
    ///   en / hi : offline Android text-to-speech (en-IN / hi-IN voice).
    ///   sat     : offline pre-recorded Santali clips bundled in the APK (SurakshaNative.voicePlay,
    ///             manifest web-app/js/i18n/santali-audio.js). If a line has no recorded clip, the
    ///             HINDI text of the same line is spoken with the Hindi voice and VoiceFallback is
    ///             raised so the HUD labels it "Hindi voice" (docs/SANTALI_LOCALIZATION.md). Santali
    ///             text is never fed to the Hindi TTS voice, and Hindi speech is never labelled Santali.
    /// One utterance at a time; Replay() repeats the last one.
    /// </summary>
    public class Narrator : MonoBehaviour
    {
        public bool Muted { get; private set; }

        /// <summary>Raised on every utterance: true = Hindi voice is standing in for missing Santali clips.</summary>
        public event Action<bool> VoiceFallback;

        /// <summary>Content with the Santali voice manifest (set by ARScenarioController).</summary>
        public ScenarioContent content;

        AndroidJavaClass m_Native;
        string m_Pending;
        string m_PendingLang;
        string m_CurrentLang;
        Line m_Last;

        /// <summary>One spoken line: its text, the clip keys for Santali, and its Hindi equivalent.</summary>
        public class Line
        {
            public string text;       // text in `lang`
            public string lang;       // language the text is written in: en | hi | sat
            public string[] satKeys;  // Santali clip keys, in order (only used when lang == sat)
            public string hindi;      // the same line in Hindi (fallback voice for sat)
        }

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
                    m_Native.CallStatic("voiceInit", activity);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogWarning("[Narrator] voice unavailable: " + e.Message);
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
        public void Say(string text, string lang) => Say(new Line { text = text, lang = lang });

        public void Say(Line line)
        {
            if (line == null || string.IsNullOrEmpty(line.text)) return;
            m_Last = line;
            if (Muted) return;
            Stop();
            if (line.lang == "sat")
            {
                if (PlayClips(content?.VoiceFiles(line.satKeys)))
                {
                    VoiceFallback?.Invoke(false);
                    return;
                }
                // No recorded Santali clip: say the same line in Hindi, clearly labelled by the HUD.
                VoiceFallback?.Invoke(!string.IsNullOrEmpty(line.hindi) && m_Native != null);
                if (!string.IsNullOrEmpty(line.hindi)) Tts(line.hindi, "hi");
                return;
            }
            VoiceFallback?.Invoke(false);
            Tts(line.text, line.lang == "en" ? "en" : "hi");
        }

        /// <summary>Repeat the last line (the HUD replay button).</summary>
        public void Replay()
        {
            if (m_Last == null) return;
            if (Muted) SetMuted(false);
            Say(m_Last);
        }

        bool PlayClips(string[] files)
        {
            if (files == null || m_Native == null) return false;
            try { return m_Native.CallStatic<bool>("voicePlay", new object[] { files }); }
            catch (System.Exception e) { Debug.LogWarning("[Narrator] clip: " + e.Message); return false; }
        }

        void Tts(string text, string lang)
        {
            if (m_Native == null) return;
            int state = State;
            if (state == 2) SpeakNow(text, lang);
            else if (state == 1 || state == 0) { m_Pending = text; m_PendingLang = lang; }
        }

        void SpeakNow(string text, string lang)
        {
            try
            {
                string voice = lang == "en" ? "en" : "hi"; // only en/hi text reaches TTS
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
            try { m_Native?.CallStatic("voiceStop"); } catch { /* ignore */ }
        }

        void OnDestroy()
        {
            try { m_Native?.CallStatic("ttsShutdown"); } catch { /* ignore */ }
            try { m_Native?.CallStatic("voiceStop"); } catch { /* ignore */ }
            m_Native?.Dispose();
        }
    }
}
