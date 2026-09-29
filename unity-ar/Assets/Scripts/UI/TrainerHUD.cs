using System;
using UnityEngine;
using UnityEngine.UI;

namespace SurakshaAR
{
    /// <summary>
    /// Screen overlay for the AR trainer (built in code). Top: exit, module, "Step n/3",
    /// progress, mute. Prompt card under it. Bottom: hint / feedback / result with large buttons.
    /// Colour is never the only signal: every state also has a ✓/✕ symbol and text.
    /// </summary>
    public class TrainerHUD : MonoBehaviour
    {
        public event Action ExitPressed;
        public event Action PrimaryPressed;
        public event Action SecondaryPressed;
        public event Action MuteToggled;

        static readonly Color PanelBg = new Color32(0x0F, 0x14, 0x19, 0xE8);
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

        void Awake() => Build();

        // ------------------------------------------------------------------ API

        public void SetHeader(string moduleTitle, string stepText, int stepIndex, bool?[] answers, string exitLabel)
        {
            m_Title.Set(moduleTitle, 38, Palette.Sand, true);
            m_Step.Set(stepText, 42, Palette.Amber, true);
            m_ExitLabel.Set("✕  " + exitLabel, 34, Palette.Sand, true);
            m_Progress.SetActive(answers != null);
            if (answers == null) return;
            if (m_Segments.Length != answers.Length) BuildSegments(answers.Length);
            for (int i = 0; i < answers.Length; i++)
            {
                bool? a = answers[i];
                m_Segments[i].color = a == null ? (i == stepIndex ? Palette.Amber : Palette.Slate) : a.Value ? Palette.Green : Palette.Red;
                m_SegmentText[i].Set(a == null ? (i + 1).ToString() : a.Value ? "✓" : "✕", 30, a == null && i == stepIndex ? Color.black : Color.white, true);
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
                correct ? new Color32(0x17, 0x38, 0x26, 0xF2) : new Color32(0x3F, 0x15, 0x17, 0xF2), false);
        }

        public void ShowComplete(string heading, string body, string note, bool passed, string primary, string secondary)
        {
            ShowBottom((passed ? "✓  " : "✕  ") + heading, body, note, primary, secondary,
                passed ? new Color32(0x17, 0x38, 0x26, 0xF2) : new Color32(0x3F, 0x15, 0x17, 0xF2), true);
        }

        public void ShowError(string message, string buttonLabel)
        {
            m_ErrorText.Set(message, 46, Palette.Sand, true);
            m_ErrorButtonLabel.Set(buttonLabel, 44, Color.white, true);
            m_ErrorPanel.SetActive(true);
        }

        public void SetDiagnostics(string text) => m_Diag.text = text;

        public void SetMuted(bool muted) => m_MuteText.Set(muted ? "🔇" : "🔊", 56, Color.white);

        // ------------------------------------------------------------------ internals

        void ShowBottom(string heading, string body, string note, string primary, string secondary, Color bg, bool bigHeading)
        {
            m_Bottom.SetActive(true);
            m_BottomBg.color = bg;
            m_Heading.Set(heading, bigHeading ? 60 : 50, Color.white, true);
            m_Body.Set(body, 42, Palette.Sand);
            m_Note.Set(note, 32, Palette.Sand);
            m_Primary.SetActive(!string.IsNullOrEmpty(primary));
            if (!string.IsNullOrEmpty(primary)) m_PrimaryLabel.Set(primary, 46, Color.black, true);
            m_Secondary.SetActive(!string.IsNullOrEmpty(secondary));
            if (!string.IsNullOrEmpty(secondary)) m_SecondaryLabel.Set(secondary, 42, Color.black, true);
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

            // Safe-area-ish top padding for status bar / notch.
            const float top = 70f;

            // ---- top bar
            var bar = Panel(root, "TopBar", PanelBg);
            Anchor(bar, 0, 1, 1, 1, new Vector2(0, -top - 150), new Vector2(0, -top));
            var exit = Button(bar, "Exit", new Color32(0x2D, 0x3A, 0x45, 0xFF), () => ExitPressed?.Invoke(), out m_ExitLabel, 230);
            Anchor((RectTransform)exit.transform, 0, 0, 0, 1, new Vector2(16, 16), new Vector2(246, -16));
            var titleCol = VStack(bar, "Titles", 4);
            Anchor(titleCol, 0, 0, 1, 1, new Vector2(262, 8), new Vector2(-150, -8));
            m_Title = UIText.Create(titleCol, "Module", 660);
            m_Step = UIText.Create(titleCol, "Step", 660);
            var mute = Button(bar, "Mute", new Color32(0x2D, 0x3A, 0x45, 0xFF), () => MuteToggled?.Invoke(), out _, 118);
            Anchor((RectTransform)mute.transform, 1, 0, 1, 1, new Vector2(-134, 16), new Vector2(-16, -16));
            m_MuteText = UIText.Create(mute.transform, "Icon", 100);
            var mrt = (RectTransform)m_MuteText.transform;
            mrt.anchorMin = mrt.anchorMax = new Vector2(0.5f, 0.5f);
            m_MuteText.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            SetMuted(false);

            m_Progress = new GameObject("Progress", typeof(RectTransform), typeof(HorizontalLayoutGroup));
            var prt = (RectTransform)m_Progress.transform;
            prt.SetParent(root, false);
            Anchor(prt, 0, 1, 1, 1, new Vector2(16, -top - 210), new Vector2(-16, -top - 160));
            var hl = m_Progress.GetComponent<HorizontalLayoutGroup>();
            hl.spacing = 10; hl.childForceExpandWidth = true; hl.childForceExpandHeight = true; hl.childControlWidth = true; hl.childControlHeight = true;

            m_Diag = LegacyText(root, "", 22, new Color(1, 1, 1, 0.6f));
            Anchor((RectTransform)m_Diag.transform, 0, 1, 1, 1, new Vector2(20, -top - 250), new Vector2(-20, -top - 214));
            m_Diag.alignment = TextAnchor.UpperRight;

            // ---- prompt card
            var promptRt = VStack(root, "PromptCard", 0, PanelBg, 24);
            Anchor(promptRt, 0, 1, 1, 1, Vector2.zero, Vector2.zero);
            promptRt.pivot = new Vector2(0.5f, 1f);
            promptRt.anchoredPosition = new Vector2(0, -top - 262);
            promptRt.sizeDelta = new Vector2(-32, 0);
            Fit(promptRt);
            m_PromptCard = promptRt.gameObject;
            m_Prompt = UIText.Create(promptRt, "Prompt", Width - 80);
            m_PromptCard.SetActive(false);

            // ---- bottom panel
            var bottom = VStack(root, "Bottom", 18, PanelBg, 30);
            m_BottomBg = bottom.GetComponent<Image>();
            Anchor(bottom, 0, 0, 1, 0, Vector2.zero, Vector2.zero);
            bottom.pivot = new Vector2(0.5f, 0f);
            bottom.anchoredPosition = new Vector2(0, 24);
            bottom.sizeDelta = new Vector2(-32, 0);
            Fit(bottom);
            m_Bottom = bottom.gameObject;
            m_Heading = UIText.Create(bottom, "Heading", Width - 92);
            m_Body = UIText.Create(bottom, "Body", Width - 92);
            m_Note = UIText.Create(bottom, "Note", Width - 92);
            m_Primary = Button(bottom, "Primary", Palette.Amber, () => PrimaryPressed?.Invoke(), out m_PrimaryLabel, Width - 92);
            m_Secondary = Button(bottom, "Secondary", Palette.Sand, () => SecondaryPressed?.Invoke(), out m_SecondaryLabel, Width - 92);
            m_Primary.SetActive(false);
            m_Secondary.SetActive(false);

            // ---- error overlay
            var err = Panel(root, "Error", new Color32(0x0F, 0x14, 0x19, 0xF5));
            Anchor(err, 0, 0, 1, 1, Vector2.zero, Vector2.zero);
            var errStack = VStack(err, "ErrorStack", 60, null, 60);
            Anchor(errStack, 0, 0.5f, 1, 0.5f, Vector2.zero, Vector2.zero);
            errStack.sizeDelta = new Vector2(0, 0);
            Fit(errStack);
            m_ErrorText = UIText.Create(errStack, "ErrorText", Width - 160);
            Button(errStack, "ErrorButton", Palette.Red, () => ExitPressed?.Invoke(), out m_ErrorButtonLabel, Width - 160);
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
                var seg = Panel((RectTransform)m_Progress.transform, "Seg" + i, Palette.Slate);
                m_Segments[i] = seg.GetComponent<Image>();
                var lbl = UIText.Create(seg, "N", 300);
                var rt = (RectTransform)lbl.transform;
                rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
                lbl.gameObject.AddComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                m_SegmentText[i] = lbl;
            }
        }

        // ------------------------------------------------------------------ builders

        static RectTransform Panel(RectTransform parent, string name, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = color;
            img.raycastTarget = color.a > 0.01f;
            return rt;
        }

        static RectTransform VStack(RectTransform parent, string name, float spacing, Color? bg = null, int padding = 0)
        {
            var rt = bg.HasValue ? Panel(parent, name, bg.Value) : (RectTransform)new GameObject(name, typeof(RectTransform)).transform;
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
            var rt = Panel(parent, name, bg);
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
