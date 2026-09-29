using System;
using System.IO;
using System.Linq;
using Unity.XR.CoreUtils;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEditor.XR.ARCore;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Rendering;
using UnityEngine.SpatialTracking;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;
using UnityEngine.XR.Management;

namespace SurakshaAR.EditorTools
{
    /// <summary>
    /// Reproducible project setup + builds (menu "SurakshaAR" or batch mode -executeMethod).
    ///
    ///   Unity -batchmode -quit -projectPath unity-ar -executeMethod SurakshaAR.EditorTools.SurakshaBuild.CI_Setup
    ///   Unity -batchmode -quit -projectPath unity-ar -executeMethod SurakshaAR.EditorTools.SurakshaBuild.CI_BuildStandaloneApk
    ///   Unity -batchmode -quit -projectPath unity-ar -executeMethod SurakshaAR.EditorTools.SurakshaBuild.CI_ExportAndroidLibrary
    ///
    /// Settings follow docs/11_UNITY_AR_SPEC.md: Android, min API 29, IL2CPP, ARM64, OpenGLES3 only
    /// (no Vulkan), ARCore via XR Plug-in Management, no realtime shadows.
    /// </summary>
    public static class SurakshaBuild
    {
        public const string ScenePath = "Assets/Scenes/AR_Trainer.unity";
        const string StandaloneApkPath = "Builds/SurakshaAR-ARTrainer-smoketest.apk";
        const string ExportPath = "Builds/AndroidExport";
        const string ApplicationId = "com.surakshaar.artrainer";

        // ------------------------------------------------------------------ settings

        [MenuItem("SurakshaAR/1. Configure Project Settings")]
        public static void ConfigureProject()
        {
            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.Android)
            {
                EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
            }

            PlayerSettings.companyName = "SurakshaAR";
            PlayerSettings.productName = "SurakshaAR AR Trainer";
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, ApplicationId);
            PlayerSettings.bundleVersion = "0.2.0";
            PlayerSettings.Android.bundleVersionCode = 2;

            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel29;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevelAuto;
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android, false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android, new[] { GraphicsDeviceType.OpenGLES3 });
            PlayerSettings.Android.forceInternetPermission = false;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.Android, ManagedStrippingLevel.Low);

            // No realtime shadows on any quality level (docs/15_PERFORMANCE.md).
            int current = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.shadows = ShadowQuality.Disable;
            }
            QualitySettings.SetQualityLevel(current, false);

            EnableARCoreLoader();

            var arcore = ARCoreSettings.GetOrCreateSettings();
            arcore.requirement = ARCoreSettings.Requirement.Required;
            arcore.depth = ARCoreSettings.Requirement.Optional;
            EditorUtility.SetDirty(arcore);

            AssetDatabase.SaveAssets();
            Debug.Log("[SurakshaBuild] Project configured for Android/ARCore.");
        }

        static void EnableARCoreLoader()
        {
            if (!EditorBuildSettings.TryGetConfigObject(XRGeneralSettings.k_SettingsKey, out XRGeneralSettingsPerBuildTarget perBuild) || perBuild == null)
            {
                Directory.CreateDirectory("Assets/XR");
                perBuild = ScriptableObject.CreateInstance<XRGeneralSettingsPerBuildTarget>();
                AssetDatabase.CreateAsset(perBuild, "Assets/XR/XRGeneralSettingsPerBuildTarget.asset");
                EditorBuildSettings.AddConfigObject(XRGeneralSettings.k_SettingsKey, perBuild, true);
            }
            if (!perBuild.HasSettingsForBuildTarget(BuildTargetGroup.Android)) perBuild.CreateDefaultSettingsForBuildTarget(BuildTargetGroup.Android);
            if (!perBuild.HasManagerSettingsForBuildTarget(BuildTargetGroup.Android)) perBuild.CreateDefaultManagerSettingsForBuildTarget(BuildTargetGroup.Android);

            var general = perBuild.SettingsForBuildTarget(BuildTargetGroup.Android);
            general.InitManagerOnStart = true;
            bool ok = XRPackageMetadataStore.AssignLoader(general.Manager, "UnityEngine.XR.ARCore.ARCoreLoader", BuildTargetGroup.Android);
            EditorUtility.SetDirty(general);
            EditorUtility.SetDirty(perBuild);
            Debug.Log("[SurakshaBuild] ARCore loader assigned: " + ok + " (loaders: " +
                      string.Join(", ", general.Manager.activeLoaders.Select(l => l.GetType().Name)) + ")");
        }

        // ------------------------------------------------------------------ scene

        [MenuItem("SurakshaAR/2. Create AR_Trainer Scene")]
        public static void CreateScene()
        {
            Directory.CreateDirectory("Assets/Scenes");
            Directory.CreateDirectory("Assets/Prefabs");
            Directory.CreateDirectory("Assets/Materials");

            var planeFill = Material("PlaneFill", "Sprites/Default", new Color(0.94f, 0.64f, 0.01f, 0.25f));
            var planeEdge = Material("PlaneEdge", "Sprites/Default", new Color(0.94f, 0.64f, 0.01f, 0.9f));
            var cubeMat = Material("TestCube", "Unlit/Color", new Color(0.94f, 0.64f, 0.01f, 1f));
            var stripeMat = Material("TestCubeStripe", "Unlit/Color", new Color(0.06f, 0.08f, 0.10f, 1f));

            var planePrefab = CreatePlanePrefab(planeFill, planeEdge);
            var cubePrefab = CreateTestObjectPrefab(cubeMat, stripeMat);

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // AR Session (enabled by ARBootstrap after permission/availability checks).
            var sessionGo = new GameObject("AR Session");
            var session = sessionGo.AddComponent<ARSession>();
            sessionGo.AddComponent<ARInputManager>();
            session.enabled = false;

            // XR Origin + AR Camera.
            var originGo = new GameObject("XR Origin");
            var origin = originGo.AddComponent<XROrigin>();
            var offsetGo = new GameObject("Camera Offset");
            offsetGo.transform.SetParent(originGo.transform, false);
            var camGo = new GameObject("AR Camera") { tag = "MainCamera" };
            camGo.transform.SetParent(offsetGo.transform, false);
            var cam = camGo.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Color.black;
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 20f;
            camGo.AddComponent<AudioListener>();
            camGo.AddComponent<ARCameraManager>();
            camGo.AddComponent<ARCameraBackground>();
            var poseDriver = camGo.AddComponent<TrackedPoseDriver>();
            poseDriver.SetPoseSource(TrackedPoseDriver.DeviceType.GenericXRDevice, TrackedPoseDriver.TrackedPose.ColorCamera);
            poseDriver.trackingType = TrackedPoseDriver.TrackingType.RotationAndPosition;
            poseDriver.updateType = TrackedPoseDriver.UpdateType.UpdateAndBeforeRender;
            poseDriver.UseRelativeTransform = false;

            origin.Camera = cam;
            origin.CameraFloorOffsetObject = offsetGo;

            var planeManager = originGo.AddComponent<ARPlaneManager>();
            planeManager.requestedDetectionMode = PlaneDetectionMode.Horizontal;
            planeManager.planePrefab = planePrefab;
            var raycastManager = originGo.AddComponent<ARRaycastManager>();
            var anchorManager = originGo.AddComponent<ARAnchorManager>();

            // Trainer logic + HUD.
            var trainerGo = new GameObject("AR Trainer");
            var placement = trainerGo.AddComponent<ARPlacementController>();
            placement.raycastManager = raycastManager;
            placement.planeManager = planeManager;
            placement.anchorManager = anchorManager;
            placement.arCamera = cam;
            placement.contentPrefab = cubePrefab;
            var hud = trainerGo.AddComponent<SmokeTestHUD>();
            hud.placement = placement;
            var bootstrap = trainerGo.AddComponent<ARBootstrap>();
            bootstrap.session = session;
            bootstrap.hud = hud;

            var eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<EventSystem>();
            eventSystem.AddComponent<StandaloneInputModule>();

            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            AssetDatabase.SaveAssets();
            Debug.Log("[SurakshaBuild] Scene created: " + ScenePath);
        }

        static Material Material(string name, string shaderName, Color color)
        {
            string path = "Assets/Materials/" + name + ".mat";
            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            var shader = Shader.Find(shaderName);
            if (shader == null) throw new Exception("Shader not found: " + shaderName);
            if (mat == null)
            {
                mat = new Material(shader);
                AssetDatabase.CreateAsset(mat, path);
            }
            mat.shader = shader;
            mat.color = color;
            EditorUtility.SetDirty(mat);
            return mat;
        }

        static GameObject CreatePlanePrefab(Material fill, Material edge)
        {
            var go = new GameObject("ARPlaneVisual");
            go.AddComponent<ARPlane>();
            go.AddComponent<MeshFilter>();
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = fill;
            mr.shadowCastingMode = ShadowCastingMode.Off;
            mr.receiveShadows = false;
            var lr = go.AddComponent<LineRenderer>();
            lr.useWorldSpace = false;
            lr.loop = true;
            lr.widthMultiplier = 0.01f;
            lr.sharedMaterial = edge;
            lr.shadowCastingMode = ShadowCastingMode.Off;
            lr.receiveShadows = false;
            go.AddComponent<ARPlaneMeshVisualizer>();
            var prefab = PrefabUtility.SaveAsPrefabAsset(go, "Assets/Prefabs/ARPlaneVisual.prefab");
            UnityEngine.Object.DestroyImmediate(go);
            return prefab;
        }

        /// <summary>20 cm amber cube with a dark stripe (so rotation/stability is visible), resting on the surface.</summary>
        static GameObject CreateTestObjectPrefab(Material cubeMat, Material stripeMat)
        {
            var root = new GameObject("TestObject");
            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.name = "Cube";
            cube.transform.SetParent(root.transform, false);
            cube.transform.localScale = Vector3.one * 0.2f;
            cube.transform.localPosition = new Vector3(0, 0.1f, 0);
            Unlit(cube, cubeMat);
            var stripe = GameObject.CreatePrimitive(PrimitiveType.Cube);
            stripe.name = "Stripe";
            UnityEngine.Object.DestroyImmediate(stripe.GetComponent<BoxCollider>());
            stripe.transform.SetParent(root.transform, false);
            stripe.transform.localScale = new Vector3(0.205f, 0.04f, 0.205f);
            stripe.transform.localPosition = new Vector3(0, 0.1f, 0);
            Unlit(stripe, stripeMat);
            var prefab = PrefabUtility.SaveAsPrefabAsset(root, "Assets/Prefabs/TestObject.prefab");
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        static void Unlit(GameObject go, Material mat)
        {
            var mr = go.GetComponent<MeshRenderer>();
            mr.sharedMaterial = mat;
            mr.shadowCastingMode = ShadowCastingMode.Off;
            mr.receiveShadows = false;
        }

        // ------------------------------------------------------------------ builds

        [MenuItem("SurakshaAR/3. Build Standalone Smoke-Test APK")]
        public static void BuildStandaloneApk()
        {
            EditorUserBuildSettings.exportAsGoogleAndroidProject = false;
            EditorUserBuildSettings.buildAppBundle = false;
            Build(StandaloneApkPath, BuildOptions.None);
        }

        [MenuItem("SurakshaAR/4. Export Android Library (for android-shell)")]
        public static void ExportAndroidLibrary()
        {
            EditorUserBuildSettings.exportAsGoogleAndroidProject = true;
            EditorUserBuildSettings.buildAppBundle = false;
            if (Directory.Exists(ExportPath)) Directory.Delete(ExportPath, true);
            Build(ExportPath, BuildOptions.None);
            EditorUserBuildSettings.exportAsGoogleAndroidProject = false;
        }

        static void Build(string path, BuildOptions options)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path)));
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = path,
                target = BuildTarget.Android,
                targetGroup = BuildTargetGroup.Android,
                options = options
            });
            var s = report.summary;
            Debug.Log($"[SurakshaBuild] {s.result}: {path} size={s.totalSize / (1024f * 1024f):0.0} MB errors={s.totalErrors} time={s.totalTime}");
            if (s.result != BuildResult.Succeeded) throw new Exception("Build failed: " + s.result);
        }

        // ------------------------------------------------------------------ batch mode entry points

        public static void CI_Setup()
        {
            ConfigureProject();
            CreateScene();
        }

        public static void CI_BuildStandaloneApk()
        {
            CI_Setup();
            BuildStandaloneApk();
        }

        public static void CI_ExportAndroidLibrary()
        {
            CI_Setup();
            ExportAndroidLibrary();
        }
    }
}
