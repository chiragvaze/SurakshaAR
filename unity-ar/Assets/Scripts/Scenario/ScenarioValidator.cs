using System;
using System.Collections.Generic;

namespace SurakshaAR
{
    /// <summary>
    /// Same rules as web-app/js/scenario/validator.js (docs/06_SCENARIO_ENGINE.md "Validation"):
    /// known module id, unique step ids, exactly 3 steps, exactly 3 unique options, exactly one
    /// correct option, and English text (the terminal fallback) for every prompt/option/why.
    /// </summary>
    public static class ScenarioValidator
    {
        public const int StepsPerModule = 3;
        public const int OptionsPerStep = 3;

        public static List<string> Validate(ScenarioModule module)
        {
            var errors = new List<string>();
            if (module == null) { errors.Add("module:null"); return errors; }
            if (!AndroidBridge.IsValidModule(module.id)) errors.Add("module:unknown_id");
            if (module.title == null || string.IsNullOrEmpty(module.title.en)) errors.Add("module:title_missing_en");
            if (module.steps == null) { errors.Add("module:steps_missing"); return errors; }
            if (module.steps.Length != StepsPerModule) errors.Add("module:step_count");

            var seen = new HashSet<string>();
            for (int i = 0; i < module.steps.Length; i++)
            {
                var s = module.steps[i];
                string p = "step[" + i + "]:";
                if (s == null || string.IsNullOrEmpty(s.id)) { errors.Add(p + "bad_id"); continue; }
                if (!seen.Add(s.id)) errors.Add(p + "duplicate_id");
                if (s.options == null || s.options.Length != OptionsPerStep) { errors.Add(p + "option_count"); continue; }
                if (new HashSet<string>(s.options).Count != s.options.Length) errors.Add(p + "duplicate_option");
                if (Array.FindAll(s.options, o => o == s.correct).Length != 1) errors.Add(p + "correct_not_single_option");
                if (s.prompt == null || string.IsNullOrEmpty(s.prompt.en)) errors.Add(p + "missing_prompt_en");
                if (s.why == null || string.IsNullOrEmpty(s.why.en)) errors.Add(p + "missing_why_en");
                if (s.optionText == null || s.optionText.Length != s.options.Length ||
                    Array.Exists(s.optionText, t => t == null || string.IsNullOrEmpty(t.en)))
                    errors.Add(p + "missing_option_text_en");
            }
            return errors;
        }
    }
}
