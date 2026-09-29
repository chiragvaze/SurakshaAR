using System.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace SurakshaAR.Tests
{
    /// <summary>
    /// Milestone 3: Gas uses the same engine as Fire and every scenario option/step has a real
    /// prop (no generic placeholders), within the docs/15_PERFORMANCE.md triangle budget.
    /// </summary>
    public class PropAndGasTests
    {
        const int TriangleBudget = 5000; // docs/15_PERFORMANCE.md: models < 5k tris

        static ScenarioContent Content => ScenarioContent.LoadFromResources();

        static Palette MakePalette() => new Palette(
            AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/PropOpaque.mat"),
            AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/PropTranslucent.mat"),
            AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/TextLabel.mat"));

        static int Triangles(GameObject go) =>
            go.GetComponentsInChildren<MeshFilter>(true).Where(f => f.sharedMesh != null).Sum(f => f.sharedMesh.triangles.Length / 3);

        [Test]
        public void EveryScenarioOptionAndStepHasADedicatedProp()
        {
            foreach (var module in Content.modules)
            foreach (var step in module.steps)
            {
                CollectionAssert.Contains(PropFactory.KnownContextIds, step.id, "hazard cue for " + step.id);
                foreach (var option in step.options)
                    CollectionAssert.Contains(PropFactory.KnownOptionIds, option, "prop for " + step.id + "/" + option);
            }
        }

        [Test]
        public void AllPropsBuildWithinTriangleBudget()
        {
            var palette = MakePalette();
            Assert.IsNotNull(AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/PropOpaque.mat"), "run SurakshaAR > 2. Create AR_Trainer Scene first");
            foreach (var id in PropFactory.KnownOptionIds)
            {
                var go = PropFactory.BuildOption(id, palette);
                try
                {
                    Assert.Greater(go.transform.childCount, 0, id);
                    Assert.IsEmpty(go.GetComponentsInChildren<Collider>(true), id + ": props must not carry colliders (one BoxCollider per option)");
                    Assert.Less(Triangles(go), TriangleBudget, id);
                }
                finally { Object.DestroyImmediate(go); }
            }
            foreach (var id in PropFactory.KnownContextIds)
            {
                var go = PropFactory.BuildContext(id, palette);
                try
                {
                    Assert.IsNotNull(go, id);
                    Assert.Less(Triangles(go), TriangleBudget, id);
                }
                finally { if (go != null) Object.DestroyImmediate(go); }
            }
        }

        [Test]
        public void GasCorrectAnswersMatchSpec()
        {
            var gas = Content.Module("gas_confined");
            CollectionAssert.AreEqual(new[] { "gas_01_zone", "gas_02_ppe", "gas_03_buddy" }, gas.steps.Select(s => s.id).ToArray());
            CollectionAssert.AreEqual(new[] { "red_zone", "detector_breathing", "attendant" }, gas.steps.Select(s => s.correct).ToArray());
            foreach (var s in gas.steps) Assert.AreEqual(1, s.options.Count(o => o == s.correct), s.id);
        }

        static ScenarioSession PlayGas(params bool[] pattern)
        {
            var gas = Content.Module("gas_confined");
            var s = new ScenarioSession(gas, new System.Random(11));
            for (int i = 0; i < 3; i++)
            {
                var step = s.CurrentStep;
                Assert.IsTrue(s.Answer(pattern[i] ? step.correct : step.options.First(o => o != step.correct), out _));
                if (i < 2) Assert.IsTrue(s.Advance());
            }
            return s;
        }

        [Test]
        public void GasAllCorrectIs100PassWithBridgePayload()
        {
            var s = PlayGas(true, true, true);
            Assert.AreEqual(100, s.Score);
            Assert.IsTrue(s.Passed);
            Assert.AreEqual("{\"module\":\"gas_confined\",\"score\":100,\"wrong\":0,\"completed\":true}",
                AndroidBridge.BuildResultJson("gas_confined", s.StepCount, s.WrongCount));
        }

        [Test]
        public void GasOneWrongIs67Fail()
        {
            var s = PlayGas(true, false, true);
            Assert.AreEqual(1, s.WrongCount);
            Assert.AreEqual(67, s.Score);
            Assert.IsFalse(s.Passed);
            Assert.AreEqual("{\"module\":\"gas_confined\",\"score\":67,\"wrong\":1,\"completed\":true}",
                AndroidBridge.BuildResultJson("gas_confined", s.StepCount, s.WrongCount));
        }

        [Test]
        public void GasHasHindiTextForEveryPromptOptionAndWhy()
        {
            foreach (var step in Content.Module("gas_confined").steps)
            {
                Assert.IsNotEmpty(step.prompt.hi, step.id);
                Assert.IsNotEmpty(step.why.hi, step.id);
                Assert.IsTrue(step.optionText.All(t => !string.IsNullOrEmpty(t.hi)), step.id);
                Assert.AreEqual(step.prompt.hi, step.prompt.Get("sat"), "Santali falls back to Hindi (no fabricated Santali)");
            }
        }
    }
}
