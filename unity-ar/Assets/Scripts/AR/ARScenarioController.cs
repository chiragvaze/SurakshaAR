using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.XR.ARFoundation;

namespace SurakshaAR
{
    /// <summary>
    /// Drives ONE scenario engine for every module from data (docs/06_SCENARIO_ENGINE.md):
    ///   place training area -> for each step: hazard cue + 3 spatial options in a ~0.7 m arc,
    ///   ~0.4 m above the floor -> tap -> ✓/✕ feedback + "why" -> Continue -> result -> bridge.
    /// Nothing here is Fire- or Gas-specific; props come from PropFactory by option/step ID.
    /// The web layer re-validates and re-scores the result (Unity never issues certificates).
    /// </summary>
    public class ARScenarioController : MonoBehaviour
    {
        enum Phase { Loading, Placing, Asking, Feedback, Complete, Sent, Error }

        public ARPlacementController placement;
        public TrainerHUD hud;
        public Narrator narrator;
        public Camera arCamera;

        [Header("Material templates (keep shaders in the build)")]
        public Material opaqueTemplate;
        public Material translucentTemplate;
        public Material textTemplate;

        [Header("Layout (metres)")]
        public float arcRadius = 0.7f;
        public float arcHalfAngle = 30f; // chord = 2 * 0.7 * sin(30°) = 0.7 m: fits a phone view at ~1.2 m
        public float optionHeight = 0.4f;
        public float labelWidth = 0.34f;

        ScenarioContent m_Content;
        ScenarioModule m_Module;
        ScenarioSession m_Session;
        Palette m_Palette;
        Transform m_Root;
        readonly List<OptionTag> m_Options = new List<OptionTag>();
        GameObject m_Context;
        Phase m_Phase = Phase.Loading;
        string m_Lang;
        float m_FpsSmoothed = 30f;
        bool m_Ready;

        string T(string key, params (string, object)[] args) => m_Content.T(key, m_Lang, args);

        void Awake()
        {
            m_Palette = new Palette(opaqueTemplate, translucentTemplate, textTemplate);
            m_Root = new GameObject("Scenario Root").transform;
            m_Root.gameObject.SetActive(false);
            placement.content = m_Root;
            placement.Placed += OnPlaced;
            hud.ExitPressed += Exit;
            hud.PrimaryPressed += OnPrimary;
            hud.SecondaryPressed += OnSecondary;
            hud.MuteToggled += () => { narrator.SetMuted(!narrator.Muted); hud.SetMuted(narrator.Muted); };
        }

        // ------------------------------------------------------------------ start-up (called by ARBootstrap)

        /// <summary>Load + validate content for the requested module. Returns false (and shows an error) on failure.</summary>
        public bool LoadContent(string moduleId, string lang)
        {
            m_Lang = lang;
            try
            {
                m_Content = ScenarioContent.LoadFromResources();
            }
            catch (System.Exception e)
            {
                Debug.LogError("[Scenario] content load failed: " + e);
                Fail("Training content could not be loaded.", "content_error");
                return false;
            }
            m_Module = m_Content.Module(moduleId);
            var errors = ScenarioValidator.Validate(m_Module);
            if (errors.Count > 0)
            {
                Debug.LogError("[Scenario] invalid module " + moduleId + ": " + string.Join(", ", errors));
                Fail(T("ar.err.content"), "content_error");
                return false;
            }
            m_Session = new ScenarioSession(m_Module);
            hud.SetHeader(m_Module.title.Get(m_Lang), "", 0, null, T("ar.exit"));
            hud.ShowHint(T("ar.placeHint"));
            return true;
        }

        public void Fail(string localizedMessageOrKey, string code)
        {
            m_Phase = Phase.Error;
            m_ErrorCode = code;
            string msg = m_Content != null && localizedMessageOrKey.StartsWith("ar.") ? T(localizedMessageOrKey) : localizedMessageOrKey;
            hud.ShowError(msg, m_Content != null ? T("ar.back") : "Back to app");
        }

        string m_ErrorCode;

        /// <summary>AR session is running: start placement (auto-fallback handled by ARPlacementController).</summary>
        public void OnSessionStarted()
        {
            if (m_Phase == Phase.Error) return;
            m_Phase = Phase.Placing;
            m_Ready = true;
            narrator.Say(T("ar.placeHint"), m_Lang == "en" ? "en" : "hi");
        }

        // ------------------------------------------------------------------ frame loop

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            if (dt > 0f) m_FpsSmoothed = Mathf.Lerp(m_FpsSmoothed, 1f / dt, 0.05f);
            hud.SetDiagnostics($"{ARSession.state} · planes {placement.HorizontalPlaneCount} · {placement.Mode} · {m_FpsSmoothed:0} fps");

            if (Input.GetKeyDown(KeyCode.Escape)) { Exit(); return; }
            if (!m_Ready) return;

            if (m_Phase == Phase.Placing && placement.Mode == ARPlacementController.PlacementMode.None)
            {
                float c = placement.FallbackCountdown;
                hud.ShowHint(c >= 0f ? T("ar.placeHint") + "\n" + T("ar.autoPlaceIn", ("s", Mathf.CeilToInt(c))) : T("ar.placeHint"));
            }

            if (!TryGetTap(out Vector2 tap)) return;

            if (m_Phase == Phase.Asking && TryHitOption(tap, out OptionTag option))
            {
                Choose(option);
                return;
            }
            // Taps that miss the options may (re)place the training area: always while placing,
            // and later only when it was auto-placed (so the user can move it onto the real floor).
            bool canMove = m_Phase == Phase.Placing ||
                           ((m_Phase == Phase.Asking || m_Phase == Phase.Feedback) && placement.Mode == ARPlacementController.PlacementMode.Fallback);
            if (canMove) placement.TryPlaceAt(tap);
        }

        static bool TryGetTap(out Vector2 position)
        {
            position = default;
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                if (touch.phase != TouchPhase.Began) return false;
                if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject(touch.fingerId)) return false;
                position = touch.position;
                return true;
            }
#if UNITY_EDITOR
            if (Input.GetMouseButtonDown(0) && (EventSystem.current == null || !EventSystem.current.IsPointerOverGameObject()))
            {
                position = Input.mousePosition;
                return true;
            }
#endif
            return false;
        }

        bool TryHitOption(Vector2 screenPos, out OptionTag option)
        {
            option = null;
            Ray ray = arCamera.ScreenPointToRay(screenPos);
            if (!Physics.Raycast(ray, out RaycastHit hit, 10f)) return false;
            option = hit.collider.GetComponentInParent<OptionTag>();
            return option != null;
        }

        // ------------------------------------------------------------------ scenario flow

        void OnPlaced(ARPlacementController.PlacementMode mode)
        {
            if (m_Phase == Phase.Placing)
            {
                StartStep();
                if (mode == ARPlacementController.PlacementMode.Fallback)
                    hud.ShowHint(T("ar.lookAhead") + "\n" + T("ar.tapOption"));
            }
            else if (m_Phase == Phase.Asking || m_Phase == Phase.Feedback)
            {
                FaceOptionsToUser(); // area moved from fallback onto a real plane
            }
        }

        void StartStep()
        {
            ClearStep();
            ScenarioStep step = m_Session.CurrentStep;

            m_Context = PropFactory.BuildContext(step.id, m_Palette);
            if (m_Context != null)
            {
                m_Context.transform.SetParent(m_Root, false);
                m_Context.transform.localPosition = new Vector3(0f, 0f, arcRadius * 1.2f); // behind the arc
            }

            IReadOnlyList<string> order = m_Session.CurrentOptions;
            for (int i = 0; i < order.Count; i++)
            {
                float t = order.Count == 1 ? 0f : Mathf.Lerp(-arcHalfAngle, arcHalfAngle, i / (float)(order.Count - 1));
                float rad = t * Mathf.Deg2Rad;
                // Concave arc around the user: centre option at the placement point, sides curve away.
                var pos = new Vector3(arcRadius * Mathf.Sin(rad), optionHeight, arcRadius * (1f - Mathf.Cos(rad)));
                m_Options.Add(BuildOption(step, order[i], pos));
            }
            FaceOptionsToUser();

            m_Phase = Phase.Asking;
            UpdateHeader();
            string prompt = step.prompt.Get(m_Lang);
            hud.SetPrompt(prompt);
            if (placement.Mode != ARPlacementController.PlacementMode.Fallback || m_Session.StepIndex > 0)
                hud.ShowHint(T("ar.tapOption") + (placement.Mode == ARPlacementController.PlacementMode.Fallback ? "\n" + T("ar.moveHint") : ""));
            narrator.Say(prompt, step.prompt.ResolvedLanguage(m_Lang));
        }

        OptionTag BuildOption(ScenarioStep step, string optionId, Vector3 localPos)
        {
            var go = new GameObject("Option_" + optionId);
            go.transform.SetParent(m_Root, false);
            go.transform.localPosition = localPos;

            var prop = PropFactory.BuildOption(optionId, m_Palette);
            prop.transform.SetParent(go.transform, false);

            // Grounding: thin pole to the floor + a soft floor marker.
            PropFactory.Part(PrimitiveType.Cylinder, go.transform, new Vector3(0, -(optionHeight + 0.17f) / 2f, 0.02f),
                new Vector3(0.015f, (optionHeight - 0.17f) / 2f, 0.015f), m_Palette.Solid(new Color(0.55f, 0.55f, 0.55f)));
            PropFactory.Part(PrimitiveType.Cylinder, go.transform, new Vector3(0, -optionHeight + 0.002f, 0),
                new Vector3(0.24f, 0.002f, 0.24f), m_Palette.Glass(new Color(0f, 0f, 0f, 0.35f)));

            var box = go.AddComponent<BoxCollider>(); // generous tap target: prop + label
            box.center = new Vector3(0f, 0.08f, 0f);
            box.size = new Vector3(0.40f, 0.66f, 0.34f);

            var tag = go.AddComponent<OptionTag>();
            tag.Init(optionId, prop.transform, null, (o, s) => Relabel(o, s, step));
            Relabel(tag, OptionTag.State.Idle, step);
            return tag;
        }

        /// <summary>(Re)builds an option's label for its state. ✓/✕ + words, not colour alone.</summary>
        void Relabel(OptionTag option, OptionTag.State state, ScenarioStep step)
        {
            if (option.label != null)
            {
                var r = option.label.GetComponent<Renderer>();
                if (r != null) m_Palette.Release(r.sharedMaterial);
                Destroy(option.label.gameObject);
            }
            string text = step.TextFor(option.optionId)?.Get(m_Lang) ?? option.optionId;
            Color fg = Color.black, bg = Palette.Sand;
            switch (state)
            {
                case OptionTag.State.Correct: text += "\n✓ " + T("assess.correct"); fg = Color.white; bg = Palette.Green; break;
                case OptionTag.State.Safe: text += "\n✓ " + T("assess.safeAnswer"); fg = Color.white; bg = Palette.Green; break;
                case OptionTag.State.Wrong: text += "\n✕ " + T("assess.wrong"); fg = Color.white; bg = Palette.Red; break;
                case OptionTag.State.Dimmed: bg = new Color(0.6f, 0.6f, 0.6f, 0.8f); fg = new Color(0.15f, 0.15f, 0.15f); break;
            }
            option.label = PropFactory.TextQuad(option.transform, text, new Vector3(0f, 0.27f, 0f), labelWidth, fg, bg, m_Palette,
                fontPx: 54, bold: true, paddingPx: 22, radiusPx: 24, widthPx: 560);
            // Grow upwards so multi-line labels never cover the prop.
            float h = option.label.localScale.y;
            if (option.label.GetComponent<TextMesh>() == null) option.label.localPosition = new Vector3(0f, 0.19f + h / 2f, 0f);
        }

        void FaceOptionsToUser()
        {
            foreach (var o in m_Options)
            {
                Vector3 away = Vector3.ProjectOnPlane(o.transform.position - arCamera.transform.position, Vector3.up);
                if (away.sqrMagnitude > 1e-4f) o.transform.rotation = Quaternion.LookRotation(away.normalized, Vector3.up);
            }
        }

        void Choose(OptionTag chosen)
        {
            if (m_Phase != Phase.Asking) return;
            if (!m_Session.Answer(chosen.optionId, out bool correct)) return; // duplicate tap ignored
            m_Phase = Phase.Feedback;

            string correctId = m_Session.CurrentStep.correct;
            foreach (var o in m_Options)
            {
                if (o == chosen) o.SetState(correct ? OptionTag.State.Correct : OptionTag.State.Wrong);
                else if (o.optionId == correctId) o.SetState(OptionTag.State.Safe); // revealed only after answering
                else o.SetState(OptionTag.State.Dimmed);
            }
            if (correct) Handheld.Vibrate();

            UpdateHeader();
            ScenarioStep step = m_Session.CurrentStep;
            string heading = correct ? T("assess.correct") : T("assess.wrong");
            string why = step.why.Get(m_Lang);
            hud.ShowFeedback(correct, heading, why, m_Session.IsLastStep ? T("assess.finish") : T("assess.continue"));
            narrator.Say(heading + ". " + why, step.why.ResolvedLanguage(m_Lang));
            Debug.Log($"[Scenario] {step.id}: chose {chosen.optionId} correct={correct}");
        }

        void OnPrimary()
        {
            switch (m_Phase)
            {
                case Phase.Feedback:
                    if (m_Session.Advance()) StartStep();
                    else ShowComplete();
                    break;
                case Phase.Complete:
                    SendResult();
                    break;
                case Phase.Sent:
                    Restart(); // standalone build only
                    break;
            }
        }

        void OnSecondary()
        {
            if (m_Phase == Phase.Sent || m_Phase == Phase.Complete) Restart();
        }

        void ShowComplete()
        {
            m_Phase = Phase.Complete;
            ClearStep();
            hud.SetPrompt(null);
            UpdateHeader();
            int steps = m_Session.StepCount, wrong = m_Session.WrongCount, score = m_Session.Score;
            string verdict = m_Session.Passed ? T("result.passed") : T("result.failed");
            string body = $"{T("result.score")}: {score}/100\n{T("result.wrong")}: {T("result.wrongOf", ("wrong", wrong), ("steps", steps))}\n{T("result.passMark", ("mark", ScenarioSession.PassMark))}";
            hud.ShowComplete(T("ar.complete") + " · " + verdict, body, null, m_Session.Passed, T("ar.finish"), null);
            narrator.Say(T("ar.complete") + ". " + verdict + ". " + T("result.score") + " " + score, m_Lang == "en" ? "en" : "hi");
            Debug.Log($"[Scenario] complete module={m_Module.id} steps={steps} wrong={wrong} score={score}");
        }

        void SendResult()
        {
            m_Phase = Phase.Sent; // guards against a double tap sending twice
            bool sent = AndroidBridge.SendResult(m_Module.id, m_Session.StepCount, m_Session.WrongCount);
            if (sent)
            {
                hud.ShowHint(T("ar.sending"));
                return;
            }
            // Standalone test build: nothing to return to. Show the payload and allow a rerun.
            string json = AndroidBridge.BuildResultJson(m_Module.id, m_Session.StepCount, m_Session.WrongCount);
            hud.ShowComplete(T("ar.complete"), T("ar.standalone"), json, m_Session.Passed, T("ar.trainAgain"), null);
        }

        void Restart()
        {
            m_Session = new ScenarioSession(m_Module);
            m_Phase = Phase.Asking;
            StartStep();
        }

        void UpdateHeader()
        {
            int n = m_Session.StepCount;
            var answers = new bool?[n];
            for (int i = 0; i < n; i++)
            {
                string a = m_Session.AnswerAt(i);
                answers[i] = a == null ? (bool?)null : a == m_Module.steps[i].correct;
            }
            string stepText = m_Phase == Phase.Complete || m_Phase == Phase.Sent
                ? ""
                : T("assess.step", ("n", m_Session.StepIndex + 1), ("total", n));
            hud.SetHeader(m_Module.title.Get(m_Lang), stepText, m_Session.StepIndex, answers, T("ar.exit"));
        }

        void ClearStep()
        {
            foreach (var o in m_Options)
            {
                if (o == null) continue;
                var r = o.label != null ? o.label.GetComponent<Renderer>() : null;
                if (r != null) m_Palette.Release(r.sharedMaterial);
                Destroy(o.gameObject);
            }
            m_Options.Clear();
            if (m_Context != null) Destroy(m_Context);
            m_Context = null;
        }

        void Exit()
        {
            narrator.Stop();
            string reason = m_Phase == Phase.Error && !string.IsNullOrEmpty(m_ErrorCode) ? m_ErrorCode : "user_closed";
            if (!AndroidBridge.Cancel(reason)) Application.Quit();
        }
    }
}
