using System;
using UnityEngine;
using UnityEngine.UI;

namespace SurakshaAR
{
    /// <summary>
    /// Screen overlay for the AR trainer (built in code). Top: exit, module, "Step n/3",
    /// progress, replay voice, mute. Prompt card under it. Bottom: hint / feedback / result with large buttons.
    /// Colour is never the only signal: every state also has a ✓/✕ symbol and text.
    /// Visual style follows the Suraksha Drishti design system (docs/26_UI_REDESIGN.md):
    /// dark translucent "glass" panels with rounded corners so the camera view stays visible,
    /// indigo primary actions, safe-area aware. Behaviour and events are unchanged.
    /// </summary>
    public class TrainerHUD : MonoBehaviour
    {
        public event Action ExitPressed;
        public event Action PrimaryPressed;
        public event Action SecondaryPressed;
        public event Action MuteToggled;
        public event Action ReplayPressed;

        // Design tokens (mirrors web-app/css/tokens.css, dark theme over the camera image).
        static class Hud
        {
            public static readonly Color Glass = new Color32(0x0D, 0x14, 0x20, 0xD6);
            public static readonly Color GlassStrong = new Color32(0x0D, 0x14, 0x20, 0xF0);
            public static readonly Color Control = new Color32(0xFF, 0xFF, 0xFF, 0x24);
            public static readonly Color Primary = new Color32(0x63, 0x66, 0xF1, 0xFF);
            public static readonly Color PrimarySoft = new Color32(0xA5, 0xB4, 0xFC, 0xFF);
            public static readonly Color Success = new Color32(0x16, 0xA3, 0x4A, 0xFF);
            public static readonly Color Danger = new Color32(0xEF, 0x44, 0x44, 0xFF);
            public static readonly Color SuccessGlass = new Color32(0x0A, 0x2E, 0x1E, 0xF0);
            public static readonly Color DangerGlass = new Color32(0x3B, 0x10, 0x16, 0xF0);
            public static readonly Color Pending = new Color32(0xFF, 0xFF, 0xFF, 0x2E);
            public static readonly Color Text = new Color32(0xF8, 0xFA, 0xFC, 0xFF);
            public static readonly Color TextSecondary = new Color32(0xCB, 0xD5, 0xE1, 0xFF);
            public static readonly Color Light = new Color32(0xFF, 0xFF, 0xFF, 0xF2);
            public static readonly Color Ink = new Color32(0x10, 0x18, 0x28, 0xFF);
        }
        static readonly Color PanelBg = Hud.Glass;
        static Sprite s_Round;
        const float Width = 1080f;

        Canvas m_Canvas;
        UIText m_Title, m_Step, m_Prompt, m_Heading, m_Body, m_Note, m_ErrorText;
        UIText m_PrimaryLabel, m_SecondaryLabel, m_ExitLabel, m_ErrorButtonLabel;
        Image m_BottomBg;
        GameObject m_PromptCard, m_Bottom, m_Primary, m_Secondary, m_ErrorPanel, m_Progress;
        Image[] m_Segments = new Image[0];
        UIText[] m_SegmentText = new UIText[0];
        Text m_Diag;
        UIText m_MuteText;
        UIText m_VoiceNote;

        void Awake() => Build();

        // ------------------------------------------------------------------ API

        public void SetHeader(string moduleTitle, string stepText, int stepIndex, bool?[] answers, string exitLabel)
        {
            m_Title.Set(moduleTitle, 38, Hud.Text, true);
            m_Step.Set(stepText, 42, Hud.PrimarySoft, true);
            m_ExitLabel.Set("✕  " + exitLabel, 34, Hud.Text, true);
            m_Progress.SetActive(answers != null);
            if (answers == null) return;
            if (m_Segments.Length != answers.Length) BuildSegments(answers.Length);
            for (int i = 0; i < answers.Length; i++)
            {
                bool? a = answers[i];
                m_Segments[i].color = a == null ? (i == stepIndex ? Hud.Primary : Hud.Pending) : a.Value ? Hud.Success : Hud.Danger;
                m_SegmentText[i].Set(a == null ? (i + 1).ToString() : a.Value ? "✓" : "✕", 30, Color.white, true);
            }
        }

        public void SetPrompt(string text)
        {
            m_PromptCard.SetActive(!string.IsNullOrEmpty(text));
            m_Prompt.Set(text, 50, Color.white, true);
        }

        public void ShowHint(string text)
        {
            ShowBottom(null, text, null, null, null, PanelBg, false);
        }

        public void ShowFeedback(bool correct, string heading, string why, string buttonLabel)
        {
            ShowBottom((correct ? "✓  " : "✕  ") + heading, why, null, buttonLabel, null,
                correct ? Hud.SuccessGlass : Hud.DangerGlass, false);
        }

        public void ShowComplete(string heading, string body, string note, bool passed, string primary, string secondary)
        {
            ShowBottom((passed ? "✓  " : "✕  ") + heading, body, note, primary, secondary,
                passed ? Hud.SuccessGlass : Hud.DangerGlass, true);
        }

        public void ShowError(string message, string buttonLabel)
        {
            m_ErrorText.Set(message, 46, Hud.Text, true);
            m_ErrorButtonLabel.Set(buttonLabel, 44, Color.white, true);
            m_ErrorPanel.SetActive(true);
        }

        public void SetDiagnostics(string text) => m_Diag.text = text;

        public void SetMuted(bool muted) => m_MuteText.Set(muted ? "🔇" : "🔊", 56, Color.white);

        /// <summary>
        /// Labels the voice source when it is not the selected language (Santali clip missing ->
        /// "Santali voice not recorded · Hindi voice"). Null/empty hides the label.
        /// </summary>
        public void SetVoiceNote(string text)
        {
            m_VoiceNote.gameObject.SetActive(!string.IsNullOrEmpty(text));
            m_VoiceNote.Set(text, 30, Hud.PrimarySoft, true);
        }

        // ------------------------------------------------------------------ internals

        void ShowBottom(string heading, string body, string note, string primary, string secondary, Color bg, bool bigHeading)
        {
            m_Bottom.SetActive(true);
            m_BottomBg.color = bg;
            m_Heading.Set(heading, bigHeading ? 60 : 50, Color.white, true);
            m_Body.Set(body, 42, Hud.TextSecondary);
            m_Note.Set(note, 32, Hud.TextSecondary);
            m_Primary.SetActive(!string.IsNullOrEmpty(primary));
            if (!string.IsNullOrEmpty(primary)) m_PrimaryLabel.Set(primary, 46, Color.white, true);
            m_Secondary.SetActive(!string.IsNullOrEmpty(secondary));
            if (!string.IsNullOrEmpty(secondary)) m_SecondaryLabel.Set(secondary, 42, Hud.Ink, true);
        }

        void Build()
        {
            var canvasGo = new GameObject("Trainer Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasGo.transform.SetParent(transform, false);
            m_Canvas = canvasGo.GetComponent<Canvas>();
            m_Canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGo.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(Width, 1920);
            scaler.matchWidthOrHeight = 0f; // match width: layout widths are in 1080-wide units
            var root = (RectTransform)canvasGo.transform;
            Canvas.ForceUpdateCanvases();

            // Safe area (status bar / notch / gesture bar) in canvas units (canvas matches width).
            float unitsPerPixel = Width / Mathf.Max(1f, Screen.width);
            Rect safe = Screen.safeArea;
            float top = Mathf.Max(40f, (Screen.height - safe.yMax) * unitsPerPixel + 16f);
            float bottomInset = Mathf.Max(0f, safe.yMin * unitsPerPixel);

            // ---- top bar
            var bar = Panel(root, "TopBar", PanelBg, true);
            Anchor(bar, 0, 1, 1, 1, new Vector2(24, -top - 150), new Vector2(-24, -top));
            var exit = Button(bar, "Exit", Hud.Control, () => ExitPressed?.Invoke(), out m_ExitLabel, 230);
            Anchor((RectTransform)exit.transform, 0, 0, 0, 1, new Vector2(16, 16), new Vector2(246, -16));
            var titleCol = VStack(bar, "Titles", 4);
            Anchor(titleCol, 0, 0, 1, 1, new Vector2(262, 8), new Vector2(-284, -8));
            m_Title = UIText.Create(titleCol, "Module", 660);
            m_Step = UIText.Create(titleCol, "Step", 660);
            var mute = Button(bar, "Mute", Hud.Control, () => MuteToggled?.Invoke(), out _, 118);
            Anchor((RectTransform)mute.transform, 1, 0, 1, 1, new Vector2(-134, 16), new Vector2(-16, -16));
            m_MuteText = UIText.Create(mute.transform, "Icon", 100);
            var mrt = (RectTransform)m_MuteText.transform;
            mrt.anchorMin = mrt.anchorMax = new Vector2(0.5f, 0.5f);
            m_MuteText.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            SetMuted(false);
            var replay = Button(bar, "Replay", Hud.Control, () => ReplayPressed?.Invoke(), out var replayIcon, 118);
            Anchor((RectTransform)replay.transform, 1, 0, 1, 1, new Vector2(-268, 16), new Vector2(-150, -16));
            replayIcon.Set("↻", 60, Color.white, true);

            m_Progress = new GameObject("Progress", typeof(RectTransform), typeof(HorizontalLayoutGroup));
            var prt = (RectTransform)m_Progress.transform;
            prt.SetParent(root, false);
            Anchor(prt, 0, 1, 1, 1, new Vector2(24, -top - 212), new Vector2(-24, -top - 166));
            var hl = m_Progress.GetComponent<HorizontalLayoutGroup>();
            hl.spacing = 10; hl.childForceExpandWidth = true; hl.childForceExpandHeight = true; hl.childControlWidth = true; hl.childControlHeight = true;

            m_Diag = LegacyText(root, "", 22, new Color(1, 1, 1, 0.6f));
            Anchor((RectTransform)m_Diag.transform, 0, 1, 1, 1, new Vector2(20, -top - 250), new Vector2(-20, -top - 214));
            m_Diag.alignment = TextAnchor.UpperRight;

            // ---- prompt card
            var promptRt = VStack(root, "PromptCard", 0, PanelBg, 28, true);
            Anchor(promptRt, 0, 1, 1, 1, Vector2.zero, Vector2.zero);
            promptRt.pivot = new Vector2(0.5f, 1f);
            promptRt.anchoredPosition = new Vector2(0, -top - 262);
            promptRt.sizeDelta = new Vector2(-48, 0);
            Fit(promptRt);
            m_PromptCard = promptRt.gameObject;
            m_Prompt = UIText.Create(promptRt, "Prompt", Width - 104);
            m_PromptCard.SetActive(false);

            // ---- bottom panel
            var bottom = VStack(root, "Bottom", 18, PanelBg, 32, true);
            m_BottomBg = bottom.GetComponent<Image>();
            Anchor(bottom, 0, 0, 1, 0, Vector2.zero, Vector2.zero);
            bottom.pivot = new Vector2(0.5f, 0f);
            bottom.anchoredPosition = new Vector2(0, 24 + bottomInset);
            bottom.sizeDelta = new Vector2(-48, 0);
            Fit(bottom);
            m_Bottom = bottom.gameObject;
            m_VoiceNote = UIText.Create(bottom, "VoiceNote", Width - 112);
            m_VoiceNote.gameObject.SetActive(false);
            m_Heading = UIText.Create(bottom, "Heading", Width - 112);
            m_Body = UIText.Create(bottom, "Body", Width - 112);
            m_Note = UIText.Create(bottom, "Note", Width - 112);
            m_Primary = Button(bottom, "Primary", Hud.Primary, () => PrimaryPressed?.Invoke(), out m_PrimaryLabel, Width - 112);
            m_Secondary = Button(bottom, "Secondary", Hud.Light, () => SecondaryPressed?.Invoke(), out m_SecondaryLabel, Width - 112);
            m_Primary.SetActive(false);
            m_Secondary.SetActive(false);

            // ---- error overlay
            var err = Panel(root, "Error", Hud.GlassStrong);
            Anchor(err, 0, 0, 1, 1, Vector2.zero, Vector2.zero);
            var errStack = VStack(err, "ErrorStack", 60, null, 60);
            Anchor(errStack, 0, 0.5f, 1, 0.5f, Vector2.zero, Vector2.zero);
            errStack.sizeDelta = new Vector2(0, 0);
            Fit(errStack);
            m_ErrorText = UIText.Create(errStack, "ErrorText", Width - 160);
            Button(errStack, "ErrorButton", Hud.Primary, () => ExitPressed?.Invoke(), out m_ErrorButtonLabel, Width - 160);
            m_ErrorPanel = err.gameObject;
            m_ErrorPanel.SetActive(false);
        }

        void BuildSegments(int n)
        {
            foreach (Transform c in m_Progress.transform) Destroy(c.gameObject);
            m_Segments = new Image[n];
            m_SegmentText = new UIText[n];
            for (int i = 0; i < n; i++)
            {
                var seg = Panel((RectTransform)m_Progress.transform, "Seg" + i, Hud.Pending, true, 2f);
                m_Segments[i] = seg.GetComponent<Image>();
                var lbl = UIText.Create(seg, "N", 300);
                var rt = (RectTransform)lbl.transform;
                rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
                lbl.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                m_SegmentText[i] = lbl;
            }
        }

        // ------------------------------------------------------------------ builders

        static RectTransform Panel(RectTransform parent, string name, Color color, bool rounded = false, float radiusDivider = 1f)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = color;
            img.raycastTarget = color.a > 0.01f;
            if (rounded)
            {
                img.sprite = RoundSprite();
                img.type = Image.Type.Sliced;
                img.pixelsPerUnitMultiplier = radiusDivider;
            }
            return rt;
        }

        /// <summary>White rounded-rectangle sprite (48-unit corner radius), anti-aliased, 9-sliced.</summary>
        static Sprite RoundSprite()
        {
            if (s_Round != null) return s_Round;
            const int size = 128, r = 48;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            var px = new Color32[size * size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float cx = Mathf.Clamp(x + 0.5f, r, size - r), cy = Mathf.Clamp(y + 0.5f, r, size - r);
                    float d = Mathf.Sqrt((x + 0.5f - cx) * (x + 0.5f - cx) + (y + 0.5f - cy) * (y + 0.5f - cy));
                    byte a = (byte)(Mathf.Clamp01(r - d + 0.5f) * 255f);
                    px[y * size + x] = new Color32(255, 255, 255, a);
                }
            tex.SetPixels32(px);
            tex.Apply(false, true);
            s_Round = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f, 0, SpriteMeshType.FullRect, new Vector4(r, r, r, r));
            return s_Round;
        }

        static RectTransform VStack(RectTransform parent, string name, float spacing, Color? bg = null, int padding = 0, bool rounded = false)
        {
            var rt = bg.HasValue ? Panel(parent, name, bg.Value, rounded) : (RectTransform)new GameObject(name, typeof(RectTransform)).transform;
            if (!bg.HasValue) rt.SetParent(parent, false);
            var v = rt.gameObject.AddComponent<VerticalLayoutGroup>();
            v.spacing = spacing;
            v.padding = new RectOffset(padding, padding, padding, padding);
            v.childAlignment = TextAnchor.UpperCenter;
            v.childControlWidth = false; v.childControlHeight = true;
            v.childForceExpandWidth = false; v.childForceExpandHeight = false;
            return rt;
        }

        static void Fit(RectTransform rt)
        {
            var f = rt.gameObject.AddComponent<ContentSizeFitter>();
            f.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        }

        static void Anchor(RectTransform rt, float minX, float minY, float maxX, float maxY, Vector2 offMin, Vector2 offMax)
        {
            rt.anchorMin = new Vector2(minX, minY);
            rt.anchorMax = new Vector2(maxX, maxY);
            rt.offsetMin = offMin;
            rt.offsetMax = offMax;
        }

        GameObject Button(RectTransform parent, string name, Color bg, Action onClick, out UIText label, float width)
        {
            var rt = Panel(parent, name, bg, true, 1.3f);
            var le = rt.gameObject.AddComponent<LayoutElement>();
            le.preferredWidth = width;
            le.minHeight = 130;
            le.preferredHeight = 130;
            rt.sizeDelta = new Vector2(width, 130);
            rt.gameObject.AddComponent<Button>().onClick.AddListener(() => onClick());
            label = UIText.Create(rt, "Label", width - 40);
            var lrt = (RectTransform)label.transform;
            lrt.anchorMin = new Vector2(0.5f, 0.5f); lrt.anchorMax = new Vector2(0.5f, 0.5f);
            lrt.sizeDelta = new Vector2(width - 40, 60);
            // Label height follows its texture; keep it centred in the button.
            var fitter = label.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            return rt.gameObject;
        }

        static Text LegacyText(Transform parent, string text, int size, Color color)
        {
            var go = new GameObject("Text", typeof(RectTransform), typeof(Text));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
            var t = go.GetComponent<Text>();
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.text = text;
            t.fontSize = size;
            t.color = color;
            t.alignment = TextAnchor.MiddleCenter;
            t.raycastTarget = false;
            return t;
        }
    }
}
