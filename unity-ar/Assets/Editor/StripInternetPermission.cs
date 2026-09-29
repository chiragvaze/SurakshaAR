using System.IO;
using System.Text.RegularExpressions;
using UnityEditor.Android;
using UnityEngine;

namespace SurakshaAR.EditorTools
{
    /// <summary>
    /// Unity writes android.permission.INTERNET into the generated unityLibrary manifest. The AR
    /// trainer is offline-only (docs/16_PRIVACY.md, no cloud anchors / no network features), so the
    /// permission is removed after the Gradle project is generated.
    /// </summary>
    public class StripInternetPermission : IPostGenerateGradleAndroidProject
    {
        public int callbackOrder => 100;

        static readonly Regex InternetPermission =
            new Regex(@"\s*<uses-permission\s+android:name=""android\.permission\.INTERNET""\s*/>", RegexOptions.Compiled);

        public void OnPostGenerateGradleAndroidProject(string unityLibraryPath)
        {
            string manifest = Path.Combine(unityLibraryPath, "src", "main", "AndroidManifest.xml");
            if (!File.Exists(manifest)) return;
            string xml = File.ReadAllText(manifest);
            string stripped = InternetPermission.Replace(xml, "");
            if (stripped != xml)
            {
                File.WriteAllText(manifest, stripped);
                Debug.Log("[SurakshaBuild] Removed INTERNET permission from " + manifest);
            }
        }
    }
}
