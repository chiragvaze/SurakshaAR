using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace SurakshaAR
{
    // ------------------------------------------------------------------ content (JsonUtility)
    // Generated from docs/25_SCENARIO_CONTENT.json + web-app/js/i18n/strings.js by
    // web-app/tools/export-unity-content.js -> Assets/Resources/SurakshaContent.json.

    [Serializable]
    public class LocalizedText
    {
        public string en;
        public string hi;
        public string sat;
        /// <summary>native-review-required | native-reviewed | fallback-hindi (web santali.js).</summary>
        public string satReview;

        public const string Reviewed = "native-reviewed";

        static readonly Dictionary<string, string[]> Chains = new Dictionary<string, string[]>
        {
            { "sat", new[] { "sat", "hi", "en" } },
            { "hi", new[] { "hi", "en" } },
            { "en", new[] { "en" } }
        };

        /// <summary>Documented fallback: sat -> hi -> en (docs/08_LOCALIZATION.md).</summary>
        public string Get(string lang)
        {
            if (!Chains.TryGetValue(lang ?? "", out var chain)) chain = Chains["en"];
            foreach (var l in chain)
            {
                string v = l == "sat" ? sat : l == "hi" ? hi : en;
                if (!string.IsNullOrEmpty(v)) return v;
            }
            return "";
        }

        /// <summary>
        /// True when Santali text is shown but has no native-speaker review yet: the trainer then
        /// shows the Hindi original under it (docs/SANTALI_LOCALIZATION.md).
        /// </summary>
        public bool NeedsHindiReference(string lang)
        {
            return lang == "sat" && !string.IsNullOrEmpty(sat) && !string.IsNullOrEmpty(hi) && satReview != Reviewed;
        }

        /// <summary>Which language actually supplied the text (for choosing the TTS voice).</summary>
        public string ResolvedLanguage(string lang)
        {
            if (!Chains.TryGetValue(lang ?? "", out var chain)) chain = Chains["en"];
            foreach (var l in chain)
            {
                string v = l == "sat" ? sat : l == "hi" ? hi : en;
                if (!string.IsNullOrEmpty(v)) return l;
            }
            return "en";
        }
    }

    [Serializable]
    public class ScenarioStep
    {
        public string id;
        public string correct;
        public string[] options;
        public LocalizedText prompt;
        public LocalizedText why;
        public LocalizedText[] optionText;

        public LocalizedText TextFor(string optionId)
        {
            int i = Array.IndexOf(options, optionId);
            return i >= 0 && optionText != null && i < optionText.Length ? optionText[i] : null;
        }
    }

    [Serializable]
    public class ScenarioModule
    {
        public string id;
        public LocalizedText title;
        public ScenarioStep[] steps;
    }

    [Serializable]
    public class UiString
    {
        public string key;
        public string en;
        public string hi;
        public string sat;
        public string satReview;
    }

    /// <summary>One Santali voice clip from web-app/js/i18n/santali-audio.js.</summary>
    [Serializable]
    public class VoiceClip
    {
        public string key;
        public string file;   // relative to the APK's web assets, e.g. audio/sat/fire/sat_fire_exit_prompt.ogg
        public string status; // recorded | recording-pending

        public const string Recorded = "recorded";
    }

    [Serializable]
    public class ScenarioContent
    {
        public string version;
        public ScenarioModule[] modules;
        public UiString[] strings;
        public VoiceClip[] voice;

        [NonSerialized] Dictionary<string, LocalizedText> m_Strings;

        public const string ResourceName = "SurakshaContent";

        public static ScenarioContent LoadFromResources()
        {
            var asset = Resources.Load<TextAsset>(ResourceName);
            if (asset == null) throw new InvalidOperationException("Resources/" + ResourceName + ".json missing");
            return Parse(asset.text);
        }

        public static ScenarioContent Parse(string json)
        {
            var content = JsonUtility.FromJson<ScenarioContent>(json);
            if (content == null || content.modules == null) throw new FormatException("Scenario content is malformed");
            return content;
        }

        public ScenarioModule Module(string id) => modules?.FirstOrDefault(m => m.id == id);

        /// <summary>Localized UI string with {name} parameters; returns the key if missing.</summary>
        public string T(string key, string lang, params (string name, object value)[] args)
        {
            var lt = Text(key);
            string text = lt != null ? lt.Get(lang) : key;
            foreach (var (name, value) in args) text = text.Replace("{" + name + "}", Convert.ToString(value));
            return text;
        }

        /// <summary>All languages of one UI string, or null if the key is unknown.</summary>
        public LocalizedText Text(string key)
        {
            if (m_Strings == null)
            {
                m_Strings = new Dictionary<string, LocalizedText>();
                foreach (var s in strings ?? Array.Empty<UiString>())
                    m_Strings[s.key] = new LocalizedText { en = s.en, hi = s.hi, sat = s.sat, satReview = s.satReview };
            }
            return m_Strings.TryGetValue(key, out var lt) ? lt : null;
        }

        /// <summary>
        /// Clip files for a sequence of text keys, or null unless EVERY key has a recorded clip
        /// (a partly recorded line is never played).
        /// </summary>
        public string[] VoiceFiles(params string[] keys)
        {
            if (keys == null || keys.Length == 0 || voice == null) return null;
            var files = new string[keys.Length];
            for (int i = 0; i < keys.Length; i++)
            {
                var clip = voice.FirstOrDefault(v => v.key == keys[i]);
                if (clip == null || clip.status != VoiceClip.Recorded || string.IsNullOrEmpty(clip.file)) return null;
                files[i] = clip.file;
            }
            return files;
        }
    }

    // ------------------------------------------------------------------ engine

    /// <summary>
    /// One engine for every module (docs/06_SCENARIO_ENGINE.md), mirroring
    /// web-app/js/scenario/engine.js: shuffled option order per attempt, one answer per step
    /// (duplicate taps ignored), wrong count derived from answers, shared scoring formula.
    /// </summary>
    public class ScenarioSession
    {
        public ScenarioModule Module { get; }
        public int StepIndex { get; private set; }
        public int StepCount => Module.steps.Length;
        public ScenarioStep CurrentStep => Module.steps[StepIndex];
        public bool IsLastStep => StepIndex == StepCount - 1;

        readonly string[][] m_Order;
        readonly string[] m_Answers;

        public ScenarioSession(ScenarioModule module, System.Random rng = null)
        {
            Module = module ?? throw new ArgumentNullException(nameof(module));
            rng ??= new System.Random();
            m_Order = module.steps.Select(s => Shuffle(s.options, rng)).ToArray();
            m_Answers = new string[module.steps.Length];
        }

        static string[] Shuffle(string[] items, System.Random rng)
        {
            var a = (string[])items.Clone();
            for (int i = a.Length - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (a[i], a[j]) = (a[j], a[i]);
            }
            return a;
        }

        public IReadOnlyList<string> CurrentOptions => m_Order[StepIndex];
        public string CurrentAnswer => m_Answers[StepIndex];
        public bool CurrentAnswered => m_Answers[StepIndex] != null;
        public string AnswerAt(int step) => m_Answers[step];

        /// <summary>Record the answer for the current step. Returns false for duplicates/unknown options.</summary>
        public bool Answer(string optionId, out bool correct)
        {
            correct = false;
            if (CurrentAnswered || Array.IndexOf(CurrentStep.options, optionId) < 0) return false;
            m_Answers[StepIndex] = optionId;
            correct = optionId == CurrentStep.correct;
            return true;
        }

        /// <summary>Move to the next step; refused unless the current step is answered and not last.</summary>
        public bool Advance()
        {
            if (!CurrentAnswered || IsLastStep) return false;
            StepIndex++;
            return true;
        }

        public bool IsComplete => m_Answers.All(a => a != null);

        public int WrongCount
        {
            get
            {
                int n = 0;
                for (int i = 0; i < m_Answers.Length; i++)
                    if (m_Answers[i] != null && m_Answers[i] != Module.steps[i].correct) n++;
                return n;
            }
        }

        public int Score => AndroidBridge.ComputeScore(StepCount, WrongCount);

        public const int PassMark = 70;
        public bool Passed => Score >= PassMark;
    }
}
