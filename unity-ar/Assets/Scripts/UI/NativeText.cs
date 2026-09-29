using System;
using UnityEngine;

namespace SurakshaAR
{
    /// <summary>
    /// Renders text to a texture with Android's text engine (correct Devanagari shaping).
    /// Returns null in the editor / on failure; callers then fall back to Unity text.
    /// </summary>
    public static class NativeText
    {
        public enum Align { Left = 0, Center = 1, Right = 2 }

        public static bool Available
        {
            get
            {
#if UNITY_ANDROID && !UNITY_EDITOR
                return true;
#else
                return false;
#endif
            }
        }

        public static Texture2D Render(string text, int widthPx, float textSizePx, Color textColor, Color background,
                                       bool bold = false, Align align = Align.Center, int paddingPx = 0, float cornerRadiusPx = 0f)
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                using (var cls = new AndroidJavaClass("com.surakshaar.unity.SurakshaNative"))
                {
                    sbyte[] png = cls.CallStatic<sbyte[]>("renderText", text ?? "", widthPx, textSizePx,
                        ToArgb(textColor), ToArgb(background), bold, (int)align, paddingPx, cornerRadiusPx);
                    if (png == null || png.Length == 0) return null;
                    var bytes = new byte[png.Length];
                    Buffer.BlockCopy(png, 0, bytes, 0, png.Length);
                    var tex = new Texture2D(2, 2, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp };
                    if (!tex.LoadImage(bytes, true)) { UnityEngine.Object.Destroy(tex); return null; }
                    return tex;
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning("[NativeText] " + e.Message);
                return null;
            }
#else
            return null;
#endif
        }

        static int ToArgb(Color c)
        {
            Color32 c32 = c;
            return (c32.a << 24) | (c32.r << 16) | (c32.g << 8) | c32.b;
        }
    }
}
