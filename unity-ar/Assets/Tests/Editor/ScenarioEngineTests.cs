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
            Assert.AreEqual(prompt.hi, prompt.Get("sat"), "Santali prompt falls back to Hindi");
            Assert.AreEqual("आग आर विस्फोट", c.Module("fire_explosion").title.Get("sat"), "Santali title is used when present");
            Assert.AreEqual("Step 2/3", c.T("assess.step", "en", ("n", 2), ("total", 3)));
            Assert.AreEqual("चरण 2/3", c.T("assess.step", "sat", ("n", 2), ("total", 3)));
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
