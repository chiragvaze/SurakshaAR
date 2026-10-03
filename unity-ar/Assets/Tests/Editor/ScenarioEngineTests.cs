using System.Linq;
using NUnit.Framework;

namespace SurakshaAR.Tests
{
    /// <summary>
    /// The Unity engine uses the exported web content and must behave like
    /// web-app/js/scenario/engine.js (same IDs, correct answers, scoring, fallback).
    /// </summary>
    public class ScenarioEngineTests
    {
        static ScenarioContent Content => ScenarioContent.LoadFromResources();

        static ScenarioSession Play(string moduleId, params bool[] correctPattern)
        {
            var module = Content.Module(moduleId);
            var s = new ScenarioSession(module, new System.Random(7));
            for (int i = 0; i < module.steps.Length; i++)
            {
                var step = s.CurrentStep;
                string pick = correctPattern[i] ? step.correct : step.options.First(o => o != step.correct);
                Assert.IsTrue(s.Answer(pick, out bool correct));
                Assert.AreEqual(correctPattern[i], correct);
                if (i < module.steps.Length - 1) Assert.IsTrue(s.Advance());
            }
            Assert.IsTrue(s.IsComplete);
            return s;
        }

        [Test]
        public void ContentLoadsAndBothModulesValidate()
        {
            var c = Content;
            Assert.IsEmpty(ScenarioValidator.Validate(c.Module("fire_explosion")));
            Assert.IsEmpty(ScenarioValidator.Validate(c.Module("gas_confined")));
            Assert.IsNull(c.Module("machinery"));
        }

        [Test]
        public void FireCorrectAnswersMatchSpec()
        {
            var fire = Content.Module("fire_explosion");
            CollectionAssert.AreEqual(new[] { "exit_sign", "co2", "crawl_low" }, fire.steps.Select(s => s.correct).ToArray());
            CollectionAssert.AreEqual(new[] { "fire_01_exit", "fire_02_extinguisher", "fire_03_smoke" }, fire.steps.Select(s => s.id).ToArray());
        }

        [Test]
        public void FireAllCorrectIs100Pass()
        {
            var s = Play("fire_explosion", true, true, true);
            Assert.AreEqual(0, s.WrongCount);
            Assert.AreEqual(100, s.Score);
            Assert.IsTrue(s.Passed);
            Assert.AreEqual("{\"module\":\"fire_explosion\",\"score\":100,\"wrong\":0,\"completed\":true}",
                AndroidBridge.BuildResultJson("fire_explosion", s.StepCount, s.WrongCount));
        }

        [Test]
        public void FireOneWrongIs67Fail()
        {
            var s = Play("fire_explosion", true, false, true);
            Assert.AreEqual(1, s.WrongCount);
            Assert.AreEqual(67, s.Score);
            Assert.IsFalse(s.Passed);
        }

        [Test]
        public void GasRunsOnTheSameEngine()
        {
            var s = Play("gas_confined", false, true, false);
            Assert.AreEqual(33, s.Score);
        }

        [Test]
        public void DuplicateAndForeignAnswersAreIgnored()
        {
            var s = new ScenarioSession(Content.Module("fire_explosion"), new System.Random(1));
            Assert.IsFalse(s.Advance(), "cannot advance an unanswered step");
            Assert.IsFalse(s.Answer("co2", out _), "option from another step");
            Assert.IsTrue(s.Answer("lift", out bool c1));
            Assert.IsFalse(c1);
            Assert.IsFalse(s.Answer("exit_sign", out _), "second tap ignored");
            Assert.AreEqual("lift", s.CurrentAnswer);
            Assert.AreEqual(1, s.WrongCount);
        }

        [Test]
        public void OptionOrderIsAShuffledPermutation()
        {
            var fire = Content.Module("fire_explosion");
            var firsts = new System.Collections.Generic.HashSet<string>();
            for (int seed = 1; seed <= 30; seed++)
            {
                var s = new ScenarioSession(fire, new System.Random(seed));
                CollectionAssert.AreEquivalent(fire.steps[0].options, s.CurrentOptions);
                firsts.Add(s.CurrentOptions[0]);
            }
            Assert.Greater(firsts.Count, 1, "correct option must not always be first");
        }

        [Test]
        public void LocalizationFallsBackSatToHiToEn()
        {
            var t = new LocalizedText { en = "E", hi = "H", sat = "" };
            Assert.AreEqual("H", t.Get("sat"));
            Assert.AreEqual("hi", t.ResolvedLanguage("sat"));
            Assert.AreEqual("E", new LocalizedText { en = "E" }.Get("sat"));
            Assert.AreEqual("E", t.Get("en"));
            Assert.AreEqual("E", t.Get("fr"));

            var c = Content;
            var prompt = c.Module("fire_explosion").steps[0].prompt;
            Assert.IsNotEmpty(prompt.sat, "Santali (provisional Ol Chiki) prompt is exported");
            Assert.AreEqual(prompt.sat, prompt.Get("sat"), "Santali text is used when present");
            Assert.AreEqual("sat", prompt.ResolvedLanguage("sat"));
            Assert.AreEqual("ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ", c.Module("fire_explosion").title.Get("sat"), "Santali title is used when present");
            Assert.AreEqual("Step 2/3", c.T("assess.step", "en", ("n", 2), ("total", 3)));
            Assert.AreEqual("चरण 2/3", c.T("assess.step", "hi", ("n", 2), ("total", 3)));
            Assert.AreEqual("ᱫᱷᱟᱯ 2/3", c.T("assess.step", "sat", ("n", 2), ("total", 3)));
        }

        [Test]
        public void UnreviewedSantaliShowsTheHindiOriginal()
        {
            var t = new LocalizedText { en = "E", hi = "H", sat = "S", satReview = "native-review-required" };
            Assert.IsTrue(t.NeedsHindiReference("sat"));
            Assert.IsFalse(t.NeedsHindiReference("hi"), "Hindi mode is unchanged");
            Assert.IsFalse(t.NeedsHindiReference("en"));
            t.satReview = LocalizedText.Reviewed;
            Assert.IsFalse(t.NeedsHindiReference("sat"), "a native-reviewed text stands alone");
            Assert.IsFalse(new LocalizedText { en = "E", hi = "H", sat = "" }.NeedsHindiReference("sat"), "fallback text is already Hindi");

            // Exported content: no Santali text claims a native review that has not happened.
            foreach (var m in Content.modules)
            foreach (var st in m.steps)
            {
                Assert.AreEqual("native-review-required", st.prompt.satReview, st.id);
                Assert.IsTrue(st.prompt.NeedsHindiReference("sat"), st.id);
                Assert.IsTrue(st.why.NeedsHindiReference("sat"), st.id);
                Assert.IsTrue(st.optionText.All(o => o.NeedsHindiReference("sat")), st.id);
            }
        }

        [Test]
        public void SantaliVoiceResolvesOnlyRecordedClips()
        {
            var c = Content;
            Assert.IsNotNull(c.voice);
            Assert.That(c.voice.Select(v => v.key), Has.Member("scn.fire_01_exit.prompt").And.Member("scn.gas_03_buddy.why").And.Member("ar.placeHint"));
            Assert.IsTrue(c.voice.All(v => v.file.StartsWith("audio/sat/") && v.file.EndsWith(".ogg")));
            // No clips are recorded yet: nothing resolves, so the Narrator uses the labelled Hindi fallback.
            Assert.IsTrue(c.voice.All(v => v.status == "recording-pending"));
            Assert.IsNull(c.VoiceFiles("scn.fire_01_exit.prompt"));

            var json = UnityEngine.JsonUtility.ToJson(c);
            var withClip = ScenarioContent.Parse(json);
            withClip.voice.First(v => v.key == "assess.correct").status = VoiceClip.Recorded;
            withClip.voice.First(v => v.key == "scn.fire_01_exit.why").status = VoiceClip.Recorded;
            CollectionAssert.AreEqual(new[] { "audio/sat/common/sat_assess_correct.ogg", "audio/sat/fire/sat_fire_exit_why.ogg" },
                withClip.VoiceFiles("assess.correct", "scn.fire_01_exit.why"));
            Assert.IsNull(withClip.VoiceFiles("assess.correct", "scn.fire_01_exit.prompt"), "a partly recorded line is not played");
            Assert.IsNull(withClip.VoiceFiles("no.such.key"));
        }

        [Test]
        public void ValidatorRejectsBrokenModules()
        {
            var m = ScenarioContent.Parse(UnityEngine.JsonUtility.ToJson(Content)).Module("fire_explosion");
            m.steps[1].correct = "sand";
            m.steps[2].options = new[] { "a", "b" };
            m.id = "machinery";
            var errors = ScenarioValidator.Validate(m);
            Assert.That(errors, Has.Some.Contains("unknown_id"));
            Assert.That(errors, Has.Some.Contains("correct_not_single_option"));
            Assert.That(errors, Has.Some.Contains("option_count"));
        }
    }
}
