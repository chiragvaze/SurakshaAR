using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

namespace SurakshaAR
{
    /// <summary>
    /// Places content in AR (docs/11_UNITY_AR_SPEC.md "Placement"):
    ///  - tap on a detected horizontal plane -> raycast -> anchor attached to that plane;
    ///  - no usable horizontal plane within ~3 s of tracking -> auto-place ~1.5 m ahead.
    /// A later tap on a real plane re-places the content, so fallback never blocks the demo.
    /// Milestone 1 places a simple test object; Milestone 2 will place the scenario root.
    /// </summary>
    public class ARPlacementController : MonoBehaviour
    {
        public enum PlacementMode { None, Plane, Fallback }

        [Header("AR Foundation")]
        public ARRaycastManager raycastManager;
        public ARPlaneManager planeManager;
        public ARAnchorManager anchorManager;
        public Camera arCamera;

        [Header("Content")]
        public GameObject contentPrefab;

        [Header("Fallback")]
        public float fallbackDelaySeconds = 3f;
        public float fallbackDistance = 1.5f;
        [Tooltip("How far below the camera the fallback content is placed (camera is ~hand height).")]
        public float fallbackDrop = 0.6f;

        public PlacementMode Mode { get; private set; } = PlacementMode.None;
        public GameObject PlacedContent { get; private set; }
        public bool FallbackOnlyTest { get; private set; }

        static readonly List<ARRaycastHit> s_Hits = new List<ARRaycastHit>();
        ARAnchor m_Anchor;
        float m_TrackingSince = -1f;

        public int HorizontalPlaneCount
        {
            get
            {
                if (planeManager == null || !planeManager.enabled) return 0;
                int n = 0;
                foreach (var plane in planeManager.trackables)
                {
                    if (plane.alignment == PlaneAlignment.HorizontalUp && plane.trackingState == TrackingState.Tracking) n++;
                }
                return n;
            }
        }

        /// <summary>Seconds left before automatic fallback placement (negative when not counting).</summary>
        public float FallbackCountdown =>
            Mode == PlacementMode.None && m_TrackingSince >= 0f ? fallbackDelaySeconds - (Time.time - m_TrackingSince) : -1f;

        void Update()
        {
            if (ARSession.state != ARSessionState.SessionTracking)
            {
                m_TrackingSince = -1f;
                return;
            }
            if (m_TrackingSince < 0f) m_TrackingSince = Time.time;

            if (!FallbackOnlyTest && TryGetTap(out Vector2 screenPos)) TryPlaceOnPlane(screenPos);

            if (Mode == PlacementMode.None && HorizontalPlaneCount == 0 && Time.time - m_TrackingSince >= fallbackDelaySeconds)
            {
                PlaceFallback();
            }
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

        bool TryPlaceOnPlane(Vector2 screenPos)
        {
            if (!raycastManager.Raycast(screenPos, s_Hits, TrackableType.PlaneWithinPolygon)) return false;
            foreach (var hit in s_Hits)
            {
                var plane = planeManager.GetPlane(hit.trackableId);
                if (plane == null || plane.alignment != PlaneAlignment.HorizontalUp) continue;

                ARAnchor anchor = anchorManager != null ? anchorManager.AttachAnchor(plane, hit.pose) : null;
                if (anchor == null) anchor = CreateFreeAnchor(hit.pose);
                SetContent(anchor, PlacementMode.Plane);
                return true;
            }
            return false;
        }

        void PlaceFallback()
        {
            Transform cam = arCamera.transform;
            Vector3 forward = Vector3.ProjectOnPlane(cam.forward, Vector3.up);
            if (forward.sqrMagnitude < 1e-4f) forward = Vector3.ProjectOnPlane(cam.up, Vector3.up); // looking straight down/up
            forward.Normalize();
            Vector3 position = cam.position + forward * fallbackDistance + Vector3.down * fallbackDrop;
            SetContent(CreateFreeAnchor(new Pose(position, Quaternion.identity)), PlacementMode.Fallback);
            Debug.Log("[Placement] fallback placement at " + position);
        }

        static ARAnchor CreateFreeAnchor(Pose pose)
        {
            var go = new GameObject("Anchor (free)");
            go.transform.SetPositionAndRotation(pose.position, pose.rotation);
            return go.AddComponent<ARAnchor>();
        }

        void SetContent(ARAnchor anchor, PlacementMode mode)
        {
            if (m_Anchor != null && m_Anchor != anchor) Destroy(m_Anchor.gameObject);
            m_Anchor = anchor;

            if (PlacedContent == null) PlacedContent = Instantiate(contentPrefab);
            PlacedContent.transform.SetParent(anchor.transform, false);
            PlacedContent.transform.localPosition = Vector3.zero;

            // Face the user (yaw only) so labels/options are readable.
            Vector3 toCamera = Vector3.ProjectOnPlane(arCamera.transform.position - anchor.transform.position, Vector3.up);
            if (toCamera.sqrMagnitude > 1e-4f) PlacedContent.transform.rotation = Quaternion.LookRotation(-toCamera.normalized, Vector3.up);

            Mode = mode;
            Debug.Log($"[Placement] placed via {mode}");
        }

        /// <summary>Clear placement; optionally hide planes to exercise the fallback path.</summary>
        public void ResetPlacement(bool fallbackOnlyTest)
        {
            FallbackOnlyTest = fallbackOnlyTest;
            if (m_Anchor != null) Destroy(m_Anchor.gameObject);
            m_Anchor = null;
            PlacedContent = null; // destroyed with its anchor parent
            Mode = PlacementMode.None;
            m_TrackingSince = ARSession.state == ARSessionState.SessionTracking ? Time.time : -1f;

            planeManager.enabled = !fallbackOnlyTest;
            foreach (var plane in planeManager.trackables) plane.gameObject.SetActive(!fallbackOnlyTest);
        }
    }
}
