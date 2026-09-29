using System.Collections.Generic;
using UnityEngine;

namespace SurakshaAR
{
    /// <summary>Material cache built from template materials (so shaders are guaranteed in the build).</summary>
    public class Palette
    {
        public static readonly Color Amber = new Color32(0xF0, 0xA2, 0x02, 0xFF);
        public static readonly Color Green = new Color32(0x2E, 0x7D, 0x4F, 0xFF);
        public static readonly Color Red = new Color32(0xC1, 0x29, 0x2E, 0xFF);
        public static readonly Color Sand = new Color32(0xED, 0xE6, 0xDA, 0xFF);
        public static readonly Color Seam = new Color32(0x0F, 0x14, 0x19, 0xFF);
        public static readonly Color Slate = new Color32(0x2D, 0x3A, 0x45, 0xFF);

        readonly Material m_Opaque, m_Translucent, m_Textured;
        readonly Dictionary<Color, Material> m_Solid = new Dictionary<Color, Material>();
        readonly Dictionary<Color, Material> m_Glass = new Dictionary<Color, Material>();
        readonly List<Object> m_Owned = new List<Object>();

        public Palette(Material opaque, Material translucent, Material textured)
        {
            m_Opaque = opaque;
            m_Translucent = translucent;
            m_Textured = textured;
        }

        public Material Solid(Color c) => Get(m_Solid, m_Opaque, c);
        public Material Glass(Color c) => Get(m_Glass, m_Translucent, c);

        Material Get(Dictionary<Color, Material> cache, Material template, Color c)
        {
            if (!cache.TryGetValue(c, out var m))
            {
                m = new Material(template) { color = c };
                cache[c] = m;
                m_Owned.Add(m);
            }
            return m;
        }

        /// <summary>New material showing a texture (caller-owned texture is tracked here too).</summary>
        public Material Textured(Texture2D tex)
        {
            var m = new Material(m_Textured) { mainTexture = tex };
            m_Owned.Add(m);
            m_Owned.Add(tex);
            return m;
        }

        public void Release(Material m)
        {
            if (m == null) return;
            if (m.mainTexture != null) { m_Owned.Remove(m.mainTexture); Object.Destroy(m.mainTexture); }
            m_Owned.Remove(m);
            Object.Destroy(m);
        }
    }

    /// <summary>
    /// Builds simple low-poly props from Unity primitives (well under the 5k-triangle budget,
    /// no textures except text, unlit, no shadows). Props face the user along local -Z.
    /// Fire props are specific; any other option ID gets a generic marker until its module's
    /// props are added (Gas = Milestone 3).
    /// </summary>
    public static class PropFactory
    {
        static Font s_Font;

        // ------------------------------------------------------------------ options

        public static GameObject BuildOption(string optionId, Palette p)
        {
            var root = new GameObject("Prop_" + optionId).transform;
            switch (optionId)
            {
                case "exit_sign":
                    Part(PrimitiveType.Cube, root, new Vector3(0, 0, 0), new Vector3(0.30f, 0.14f, 0.03f), p.Solid(Palette.Green));
                    TextQuad(root, "EXIT  ➜", new Vector3(0, 0, -0.017f), 0.27f, Color.white, Color.clear, p, 72);
                    Part(PrimitiveType.Cube, root, new Vector3(0, -0.12f, 0.01f), new Vector3(0.02f, 0.12f, 0.02f), p.Solid(new Color(0.5f, 0.5f, 0.5f)));
                    break;
                case "lift":
                    Part(PrimitiveType.Cube, root, Vector3.zero, new Vector3(0.22f, 0.32f, 0.05f), p.Solid(new Color(0.62f, 0.64f, 0.66f)));
                    Part(PrimitiveType.Cube, root, new Vector3(0, 0, -0.027f), new Vector3(0.006f, 0.30f, 0.004f), p.Solid(Palette.Seam));
                    Part(PrimitiveType.Cube, root, new Vector3(0.14f, 0.02f, -0.01f), new Vector3(0.04f, 0.08f, 0.02f), p.Solid(Palette.Slate));
                    TextQuad(root, "▲▼", new Vector3(0.14f, 0.02f, -0.022f), 0.035f, Palette.Amber, Color.clear, p, 48);
                    break;
                case "window":
                    var frame = p.Solid(new Color(0.85f, 0.85f, 0.85f));
                    Part(PrimitiveType.Quad, root, Vector3.zero, new Vector3(0.26f, 0.26f, 1f), p.Glass(new Color(0.55f, 0.8f, 1f, 0.45f)));
                    Part(PrimitiveType.Cube, root, new Vector3(0, 0.135f, 0), new Vector3(0.29f, 0.02f, 0.03f), frame);
                    Part(PrimitiveType.Cube, root, new Vector3(0, -0.135f, 0), new Vector3(0.29f, 0.02f, 0.03f), frame);
                    Part(PrimitiveType.Cube, root, new Vector3(0.135f, 0, 0), new Vector3(0.02f, 0.29f, 0.03f), frame);
                    Part(PrimitiveType.Cube, root, new Vector3(-0.135f, 0, 0), new Vector3(0.02f, 0.29f, 0.03f), frame);
                    Part(PrimitiveType.Cube, root, Vector3.zero, new Vector3(0.012f, 0.26f, 0.02f), frame);
                    Part(PrimitiveType.Cube, root, Vector3.zero, new Vector3(0.26f, 0.012f, 0.02f), frame);
                    break;
                case "co2":
                    Extinguisher(root, p, Palette.Seam, "CO₂", Color.white);
                    // Wide black discharge horn = CO2 extinguisher.
                    Part(PrimitiveType.Cylinder, root, new Vector3(0.09f, 0.10f, -0.02f), new Vector3(0.05f, 0.05f, 0.05f), p.Solid(Palette.Seam), new Vector3(0, 0, -60));
                    break;
                case "water":
                    Part(PrimitiveType.Cylinder, root, new Vector3(0, -0.06f, 0), new Vector3(0.20f, 0.08f, 0.20f), p.Solid(new Color(0.15f, 0.4f, 0.85f)));
                    Part(PrimitiveType.Cylinder, root, new Vector3(0, 0.021f, 0), new Vector3(0.18f, 0.002f, 0.18f), p.Solid(new Color(0.55f, 0.8f, 1f)));
                    TextQuad(root, "H₂O", new Vector3(0, -0.06f, -0.102f), 0.10f, Color.white, Color.clear, p, 64);
                    break;
                case "foam":
                    Extinguisher(root, p, Palette.Sand, "FOAM", Palette.Seam);
                    break;
                case "crawl_low":
                    Person(root, p, new Vector3(0, -0.10f, 0), lying: true);
                    TextQuad(root, "⬇", new Vector3(0, 0.08f, -0.03f), 0.08f, Palette.Amber, Color.clear, p, 96);
                    break;
                case "run_upright":
                    Person(root, p, Vector3.zero, lying: false);
                    break;
                case "go_back":
                    Part(PrimitiveType.Cube, root, Vector3.zero, new Vector3(0.18f, 0.30f, 0.03f), p.Solid(new Color(0.45f, 0.28f, 0.15f)));
                    TextQuad(root, "↩", new Vector3(0, 0.02f, -0.02f), 0.13f, Color.white, Color.clear, p, 120);
                    break;
                default:
                    Part(PrimitiveType.Cylinder, root, new Vector3(0, -0.08f, 0), new Vector3(0.16f, 0.04f, 0.16f), p.Solid(Palette.Slate));
                    Part(PrimitiveType.Sphere, root, new Vector3(0, 0.03f, 0), new Vector3(0.12f, 0.12f, 0.12f), p.Solid(Palette.Amber));
                    break;
            }
            return root.gameObject;
        }

        static void Extinguisher(Transform root, Palette p, Color band, string text, Color textColor)
        {
            Part(PrimitiveType.Cylinder, root, Vector3.zero, new Vector3(0.10f, 0.14f, 0.10f), p.Solid(Palette.Red));
            Part(PrimitiveType.Cylinder, root, new Vector3(0, 0.155f, 0), new Vector3(0.04f, 0.02f, 0.04f), p.Solid(Palette.Seam));
            Part(PrimitiveType.Cube, root, new Vector3(0, -0.01f, -0.051f), new Vector3(0.085f, 0.06f, 0.002f), p.Solid(band));
            TextQuad(root, text, new Vector3(0, -0.01f, -0.053f), 0.08f, textColor, Color.clear, p, 64);
        }

        static void Person(Transform root, Palette p, Vector3 offset, bool lying)
        {
            var body = Part(PrimitiveType.Capsule, root, offset, new Vector3(0.08f, 0.10f, 0.08f), p.Solid(Palette.Amber),
                lying ? new Vector3(0, 0, 90) : new Vector3(0, 0, -12));
            Vector3 head = lying ? offset + new Vector3(-0.15f, 0.01f, 0) : offset + new Vector3(0.03f, 0.15f, 0);
            Part(PrimitiveType.Sphere, root, head, Vector3.one * 0.07f, p.Solid(new Color(0.55f, 0.38f, 0.26f)));
            Part(PrimitiveType.Sphere, root, head + new Vector3(0, 0.02f, 0), new Vector3(0.075f, 0.04f, 0.075f), p.Solid(Color.white)); // helmet
            body.name = "Body";
        }

        // ------------------------------------------------------------------ step context (hazard cues)

        public static GameObject BuildContext(string stepId, Palette p)
        {
            var root = new GameObject("Context_" + stepId).transform;
            switch (stepId)
            {
                case "fire_01_exit":
                    // Fire alarm beacon on a post (off to the side so it never lines up with an option) + flames.
                    Part(PrimitiveType.Cylinder, root, new Vector3(-0.55f, 0.35f, 0), new Vector3(0.03f, 0.35f, 0.03f), p.Solid(new Color(0.5f, 0.5f, 0.5f)));
                    Part(PrimitiveType.Sphere, root, new Vector3(-0.55f, 0.74f, 0), Vector3.one * 0.12f, p.Solid(Palette.Red)).AddComponent<Flicker>().mode = Flicker.Mode.Blink;
                    Flames(root, p, new Vector3(0.45f, 0, 0.05f), 1f);
                    break;
                case "fire_02_extinguisher":
                    // Electrical panel on fire.
                    Part(PrimitiveType.Cube, root, new Vector3(0, 0.30f, 0), new Vector3(0.40f, 0.60f, 0.15f), p.Solid(new Color(0.55f, 0.58f, 0.6f)));
                    Part(PrimitiveType.Cube, root, new Vector3(0, 0.30f, -0.076f), new Vector3(0.36f, 0.54f, 0.002f), p.Solid(Palette.Slate));
                    TextQuad(root, "⚡", new Vector3(0, 0.42f, -0.08f), 0.16f, Palette.Amber, Color.clear, p, 160);
                    Flames(root, p, new Vector3(0, 0.02f, -0.12f), 1.2f);
                    break;
                case "fire_03_smoke":
                    // Smoke filling the upper part of the corridor; clearer air near the floor.
                    Part(PrimitiveType.Cube, root, new Vector3(0, 1.15f, -0.2f), new Vector3(1.8f, 0.9f, 0.9f), p.Glass(new Color(0.18f, 0.18f, 0.2f, 0.55f)));
                    Part(PrimitiveType.Cube, root, new Vector3(0, 0.75f, -0.2f), new Vector3(1.8f, 0.1f, 0.9f), p.Glass(new Color(0.3f, 0.3f, 0.32f, 0.3f)));
                    Flames(root, p, new Vector3(-0.4f, 0, 0.2f), 0.9f);
                    break;
                default:
                    Object.Destroy(root.gameObject);
                    return null;
            }
            return root.gameObject;
        }

        static void Flames(Transform parent, Palette p, Vector3 at, float size)
        {
            var group = new GameObject("Flames").transform;
            group.SetParent(parent, false);
            group.localPosition = at;
            group.localScale = Vector3.one * size;
            var outer = Part(PrimitiveType.Sphere, group, new Vector3(0, 0.12f, 0), new Vector3(0.18f, 0.26f, 0.18f), p.Glass(new Color(1f, 0.35f, 0.05f, 0.85f)));
            var inner = Part(PrimitiveType.Sphere, group, new Vector3(0, 0.09f, -0.01f), new Vector3(0.10f, 0.17f, 0.10f), p.Solid(new Color(1f, 0.85f, 0.2f)));
            var side = Part(PrimitiveType.Sphere, group, new Vector3(0.09f, 0.07f, 0.02f), new Vector3(0.10f, 0.15f, 0.10f), p.Glass(new Color(1f, 0.45f, 0.05f, 0.8f)));
            outer.AddComponent<Flicker>();
            inner.AddComponent<Flicker>().phase = 1.3f;
            side.AddComponent<Flicker>().phase = 2.1f;
        }

        // ------------------------------------------------------------------ helpers

        public static GameObject Part(PrimitiveType type, Transform parent, Vector3 pos, Vector3 scale, Material mat, Vector3 euler = default)
        {
            var go = GameObject.CreatePrimitive(type);
            Object.DestroyImmediate(go.GetComponent<Collider>()); // one BoxCollider per option handles taps
            go.transform.SetParent(parent, false);
            go.transform.localPosition = pos;
            go.transform.localEulerAngles = euler;
            go.transform.localScale = scale;
            var r = go.GetComponent<MeshRenderer>();
            r.sharedMaterial = mat;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            r.receiveShadows = false;
            return go;
        }

        /// <summary>
        /// World-space text of a given width (metres). Android: native-shaped texture on a quad
        /// (correct Hindi). Editor: TextMesh fallback. Returns the root transform.
        /// </summary>
        public static Transform TextQuad(Transform parent, string text, Vector3 localPos, float widthM, Color fg, Color bg,
                                         Palette p, int fontPx = 56, bool bold = true, int paddingPx = 0, float radiusPx = 0f, int widthPx = 512)
        {
            var tex = NativeText.Render(text, widthPx, fontPx, fg, bg, bold, NativeText.Align.Center, paddingPx, radiusPx);
            GameObject go;
            if (tex != null)
            {
                go = Part(PrimitiveType.Quad, parent, localPos, new Vector3(widthM, widthM * tex.height / tex.width, 1f), p.Textured(tex));
                go.name = "Text";
            }
            else
            {
                go = new GameObject("Text");
                go.transform.SetParent(parent, false);
                go.transform.localPosition = localPos;
                if (s_Font == null) s_Font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                var tm = go.AddComponent<TextMesh>();
                tm.font = s_Font;
                tm.GetComponent<MeshRenderer>().sharedMaterial = s_Font.material;
                tm.text = text;
                tm.fontSize = 48;
                tm.characterSize = widthM / 12f;
                tm.anchor = TextAnchor.MiddleCenter;
                tm.alignment = TextAlignment.Center;
                tm.color = fg;
                if (bg.a > 0.01f) Part(PrimitiveType.Quad, go.transform, new Vector3(0, 0, 0.002f), new Vector3(widthM, widthM * 0.4f, 1f), p.Glass(bg));
            }
            return go.transform;
        }
    }

    /// <summary>Cheap flame/beacon animation (no particles, no lights).</summary>
    public class Flicker : MonoBehaviour
    {
        public enum Mode { Flame, Blink }
        public Mode mode = Mode.Flame;
        public float phase;
        Vector3 m_Base;
        Renderer m_Renderer;

        void Start()
        {
            m_Base = transform.localScale;
            m_Renderer = GetComponent<Renderer>();
        }

        void Update()
        {
            float t = Time.time * 7f + phase;
            if (mode == Mode.Flame)
                transform.localScale = new Vector3(m_Base.x * (1f + 0.08f * Mathf.Sin(t * 1.3f)), m_Base.y * (1f + 0.18f * Mathf.Sin(t)), m_Base.z);
            else if (m_Renderer != null)
                m_Renderer.enabled = Mathf.Sin(t * 0.8f) > -0.2f;
        }
    }
}
