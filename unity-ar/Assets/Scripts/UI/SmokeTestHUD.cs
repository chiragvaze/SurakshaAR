using UnityEngine;
using UnityEngine.UI;
using UnityEngine.XR.ARFoundation;

namespace SurakshaAR
{
    /// <summary>
    /// Milestone 1 diagnostic overlay (built in code, no prefab needed): session/plane/placement
    /// status, FPS, and buttons for the fallback test and the Unity -> Android -> Web bridge
    /// smoke test. Replaced by the real training UI in Milestone 2.
    /// </summary>
    public class SmokeTestHUD : MonoBehaviour
    {
        public ARPlacementController placement;

        static readonly Color Amber = new Color32(0xF0, 0xA2, 0x02, 0xFF);
        static readonly Color SeamBlack = new Color32(0x0F, 0x14, 0x19, 0xE6);
        static readonly Color Sand = new Color32(0xED, 0xE6, 0xDA, 0xFF);
        static readonly Color Red = new Color32(0xC1, 0x29, 0x2E, 0xFF);

        Font m_Font;
        Text m_Status;
        Text m_Hint;
        Text m_Message;
        GameObject m_ErrorPanel;
        Text m_ErrorText;
        string m_ErrorCode;
        string m_LaunchInfo = "";
        float m_FpsSmoothed = 30f;

        void Awake()
        {
            m_Font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            BuildUi();
        }

        public void SetLaunchInfo(string module, string lang, bool byShell)
        {
            m_LaunchInfo = $"module={module}  lang={lang}  ({(byShell ? "from Android shell" : "standalone default")})";
        }

        public void ShowError(string message, string code)
        {
            m_ErrorCode = code;
            m_ErrorText.text = message;
            m_ErrorPanel.SetActive(true);
        }

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) Close(); // Android back button

            float dt = Time.unscaledDeltaTime;
            if (dt > 0f) m_FpsSmoothed = Mathf.Lerp(m_FpsSmoothed, 1f / dt, 0.05f);

            string mode = placement.Mode switch
            {
                ARPlacementController.PlacementMode.Plane => "TAP ON PLANE (anchored)",
                ARPlacementController.PlacementMode.Fallback => "AUTO FALLBACK (1.5 m ahead)",
                _ => "not placed"
            };
            m_Status.text =
                "SurakshaAR · AR smoke test\n" +
                m_LaunchInfo + "\n" +
                $"Session: {ARSession.state}\n" +
                $"Horizontal planes: {placement.HorizontalPlaneCount}{(placement.FallbackOnlyTest ? " (detection off: fallback test)" : "")}\n" +
                $"Placement: {mode}\n" +
                $"FPS: {m_FpsSmoothed:0}";

            float countdown = placement.FallbackCountdown;
            if (ARSession.state != ARSessionState.SessionTracking)
                m_Hint.text = "Move the phone slowly to start tracking…";
            else if (placement.Mode == ARPlacementController.PlacementMode.None)
                m_Hint.text = placement.HorizontalPlaneCount > 0
                    ? "Tap a highlighted floor/table surface to place the cube"
                    : $"Point at the floor… auto-place in {Mathf.Max(0f, countdown):0.0} s";
            else
                m_Hint.text = "Walk around: the cube should stay fixed in place. Tap a plane to move it.";
        }

        // ---------- actions ----------

        void SendTestResult()
        {
            bool sent = AndroidBridge.SendResult(AndroidBridge.Module, 3, 0);
            m_Message.text = sent
                ? "Result sent to Android shell."
                : "Standalone build (no shell). Result JSON:\n" + AndroidBridge.BuildResultJson(AndroidBridge.Module, 3, 0);
        }

        void TestFallback()
        {
            bool on = !placement.FallbackOnlyTest;
            placement.ResetPlacement(on);
            m_Message.text = on ? "Plane detection OFF: cube should auto-place in ~3 s." : "Plane detection ON: tap a plane.";
        }

        void Close()
        {
            string reason = m_ErrorPanel.activeSelf && !string.IsNullOrEmpty(m_ErrorCode) ? m_ErrorCode : "user_closed";
            if (!AndroidBridge.Cancel(reason)) Application.Quit();
        }

        // ---------- UI construction ----------

        void BuildUi()
        {
            var canvasGo = new GameObject("HUD Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasGo.transform.SetParent(transform, false);
            var canvas = canvasGo.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGo.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0.5f;
            var root = (RectTransform)canvasGo.transform;

            var top = Panel(root, "Status", new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -470), new Vector2(0, -60), SeamBlack);
            m_Status = Label(top, 34, Sand, TextAnchor.UpperLeft, new Vector2(30, 20), new Vector2(-30, -20));

            var hint = Panel(root, "Hint", new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -600), new Vector2(0, -480), Amber);
            m_Hint = Label(hint, 38, Color.black, TextAnchor.MiddleCenter, new Vector2(20, 0), new Vector2(-20, 0));
            m_Hint.fontStyle = FontStyle.Bold;

            var bottom = Panel(root, "Actions", new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 40), new Vector2(0, 560), new Color(0, 0, 0, 0));
            m_Message = Label(bottom, 30, Sand, TextAnchor.LowerCenter, new Vector2(30, 390), new Vector2(-30, 0));
            Button(bottom, "Send test result", Amber, Color.black, new Vector2(0.05f, 0), new Vector2(0.95f, 0), 250, 370, SendTestResult);
            Button(bottom, "Test fallback", Sand, Color.black, new Vector2(0.05f, 0), new Vector2(0.48f, 0), 60, 220, TestFallback);
            Button(bottom, "Close", Sand, Color.black, new Vector2(0.52f, 0), new Vector2(0.95f, 0), 60, 220, Close);

            m_ErrorPanel = Panel(root, "Error", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color32(0x0F, 0x14, 0x19, 0xF5)).gameObject;
            var errRect = (RectTransform)m_ErrorPanel.transform;
            m_ErrorText = Label(errRect, 44, Sand, TextAnchor.MiddleCenter, new Vector2(60, 400), new Vector2(-60, -300));
            Button(errRect, "Back to app", Red, Color.white, new Vector2(0.1f, 0), new Vector2(0.9f, 0), 200, 360, Close);
            m_ErrorPanel.SetActive(false);
        }

        static RectTransform Panel(RectTransform parent, string name, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
            var img = go.GetComponent<Image>();
            img.color = color;
            img.raycastTarget = color.a > 0.01f;
            return rt;
        }

        Text Label(RectTransform parent, int size, Color color, TextAnchor anchor, Vector2 offsetMin, Vector2 offsetMax)
        {
            var go = new GameObject("Text", typeof(RectTransform), typeof(Text));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
            var t = go.GetComponent<Text>();
            t.font = m_Font;
            t.fontSize = size;
            t.color = color;
            t.alignment = anchor;
            t.raycastTarget = false;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            return t;
        }

        void Button(RectTransform parent, string label, Color bg, Color fg, Vector2 anchorMin, Vector2 anchorMax, float bottom, float top, UnityEngine.Events.UnityAction onClick)
        {
            var go = new GameObject(label, typeof(RectTransform), typeof(Image), typeof(Button));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            // Horizontal extent from anchors; vertical position in pixels from the parent's bottom.
            rt.anchorMin = new Vector2(anchorMin.x, 0);
            rt.anchorMax = new Vector2(anchorMax.x, 0);
            rt.offsetMin = new Vector2(0, bottom);
            rt.offsetMax = new Vector2(0, top);
            go.GetComponent<Image>().color = bg;
            go.GetComponent<Button>().onClick.AddListener(onClick);
            var text = Label(rt, 44, fg, TextAnchor.MiddleCenter, Vector2.zero, Vector2.zero);
            text.text = label;
            text.fontStyle = FontStyle.Bold;
        }
    }
}
