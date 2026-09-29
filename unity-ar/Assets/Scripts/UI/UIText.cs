using UnityEngine;
using UnityEngine.UI;

namespace SurakshaAR
{
    /// <summary>
    /// A UI text element that uses Android-rendered textures (correct Hindi shaping) and falls
    /// back to legacy UI Text in the editor. Height follows the wrapped text via LayoutElement.
    /// </summary>
    [RequireComponent(typeof(RectTransform), typeof(LayoutElement))]
    public class UIText : MonoBehaviour
    {
        RawImage m_Image;
        Text m_Fallback;
        LayoutElement m_Layout;
        Texture2D m_Texture;

        public float WidthUnits = 1000f;   // canvas reference units
        static Font s_Font;

        public static UIText Create(Transform parent, string name, float widthUnits)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(LayoutElement));
            go.transform.SetParent(parent, false);
            ((RectTransform)go.transform).sizeDelta = new Vector2(widthUnits, 50f);
            var t = go.AddComponent<UIText>();
            t.WidthUnits = widthUnits;
            return t;
        }

        void EnsureParts()
        {
            if (m_Layout != null) return;
            m_Layout = GetComponent<LayoutElement>();
            m_Layout.preferredWidth = WidthUnits;
        }

        /// <param name="sizeUnits">font size in canvas reference units (1080 x 1920)</param>
        public void Set(string text, float sizeUnits, Color color, bool bold = false, NativeText.Align align = NativeText.Align.Center)
        {
            EnsureParts();
            gameObject.SetActive(!string.IsNullOrEmpty(text));
            if (string.IsNullOrEmpty(text)) return;

            var canvas = GetComponentInParent<Canvas>();
            float scale = canvas != null ? canvas.scaleFactor : 1f;
            int widthPx = Mathf.Max(16, Mathf.RoundToInt(WidthUnits * scale));

            if (m_Texture != null) { Destroy(m_Texture); m_Texture = null; }
            var tex = NativeText.Render(text, widthPx, sizeUnits * scale, color, Color.clear, bold, align);
            if (tex != null)
            {
                if (m_Fallback != null) m_Fallback.gameObject.SetActive(false);
                if (m_Image == null)
                {
                    m_Image = gameObject.AddComponent<RawImage>();
                    m_Image.raycastTarget = false;
                }
                m_Image.enabled = true;
                m_Image.texture = m_Texture = tex;
                m_Layout.preferredHeight = tex.height / scale;
                return;
            }

            // Editor / fallback path.
            if (m_Image != null) m_Image.enabled = false;
            if (m_Fallback == null)
            {
                if (s_Font == null) s_Font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                var go = new GameObject("Text", typeof(RectTransform), typeof(Text));
                go.transform.SetParent(transform, false);
                var rt = (RectTransform)go.transform;
                rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
                rt.offsetMin = rt.offsetMax = Vector2.zero;
                m_Fallback = go.GetComponent<Text>();
                m_Fallback.font = s_Font;
                m_Fallback.raycastTarget = false;
                m_Fallback.horizontalOverflow = HorizontalWrapMode.Wrap;
                m_Fallback.verticalOverflow = VerticalWrapMode.Overflow;
            }
            m_Fallback.gameObject.SetActive(true);
            m_Fallback.text = text;
            m_Fallback.fontSize = Mathf.RoundToInt(sizeUnits);
            m_Fallback.color = color;
            m_Fallback.fontStyle = bold ? FontStyle.Bold : FontStyle.Normal;
            m_Fallback.alignment = align == NativeText.Align.Left ? TextAnchor.UpperLeft : align == NativeText.Align.Right ? TextAnchor.UpperRight : TextAnchor.UpperCenter;
            int lines = Mathf.Max(1, Mathf.CeilToInt(text.Length * sizeUnits * 0.5f / WidthUnits)) + text.Split('\n').Length - 1;
            m_Layout.preferredHeight = lines * sizeUnits * 1.3f;
        }

        void OnDestroy()
        {
            if (m_Texture != null) Destroy(m_Texture);
        }
    }
}
