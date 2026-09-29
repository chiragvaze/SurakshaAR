using System;
using NUnit.Framework;

namespace SurakshaAR.Tests
{
    /// <summary>
    /// Unity side of the bridge must stay compatible with the web layer
    /// (web-app/js/scenario/scoring.js and services/training.js), which re-validates every result.
    /// </summary>
    public class AndroidBridgeTests
    {
        [TestCase(3, 0, 100)]
        [TestCase(3, 1, 67)]
        [TestCase(3, 2, 33)]
        [TestCase(3, 3, 0)]
        [TestCase(2, 1, 50)] // .5 rounds up like JavaScript Math.round (not banker's rounding)
        [TestCase(8, 1, 88)] // 87.5 -> 88
        public void ScoreMatchesWebFormula(int steps, int wrong, int expected)
        {
            Assert.AreEqual(expected, AndroidBridge.ComputeScore(steps, wrong));
        }

        [Test]
        public void ScoreRejectsInvalidInput()
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => AndroidBridge.ComputeScore(0, 0));
            Assert.Throws<ArgumentOutOfRangeException>(() => AndroidBridge.ComputeScore(3, 4));
            Assert.Throws<ArgumentOutOfRangeException>(() => AndroidBridge.ComputeScore(3, -1));
        }

        [Test]
        public void ResultJsonMatchesContract()
        {
            Assert.AreEqual("{\"module\":\"fire_explosion\",\"score\":100,\"wrong\":0,\"completed\":true}",
                AndroidBridge.BuildResultJson("fire_explosion", 3, 0));
            Assert.AreEqual("{\"module\":\"gas_confined\",\"score\":33,\"wrong\":2,\"completed\":true}",
                AndroidBridge.BuildResultJson("gas_confined", 3, 2));
        }

        [Test]
        public void ResultJsonRejectsUnknownModule()
        {
            Assert.Throws<ArgumentException>(() => AndroidBridge.BuildResultJson("machinery", 3, 0));
            Assert.Throws<ArgumentException>(() => AndroidBridge.BuildResultJson("fire\",\"x", 3, 0));
            Assert.Throws<ArgumentException>(() => AndroidBridge.BuildResultJson(null, 3, 0));
        }

        [Test]
        public void ModuleAndLanguageWhitelists()
        {
            Assert.IsTrue(AndroidBridge.IsValidModule("fire_explosion"));
            Assert.IsTrue(AndroidBridge.IsValidModule("gas_confined"));
            Assert.IsFalse(AndroidBridge.IsValidModule("Fire_Explosion"));
            Assert.IsFalse(AndroidBridge.IsValidModule(""));
            Assert.IsTrue(AndroidBridge.IsValidLanguage("sat"));
            Assert.IsFalse(AndroidBridge.IsValidLanguage("fr"));
            Assert.IsFalse(AndroidBridge.IsValidLanguage(null));
        }

        [Test]
        public void EditorLaunchDefaultsWithoutShell()
        {
            AndroidBridge.ReadLaunchParams();
            Assert.IsFalse(AndroidBridge.LaunchedByShell);
            Assert.IsFalse(AndroidBridge.InvalidLaunchParams);
            Assert.AreEqual("fire_explosion", AndroidBridge.Module);
            Assert.AreEqual("en", AndroidBridge.Language);
            Assert.IsFalse(AndroidBridge.SendResult("fire_explosion", 3, 0), "no shell in the editor");
        }
    }
}
