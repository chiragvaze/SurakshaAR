using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

namespace SurakshaAR
{
    /// <summary>
    /// Places the training area in AR (docs/11_UNITY_AR_SPEC.md "Placement"):
    ///  - TryPlaceAt(screen point): raycast on a horizontal plane -> anchor attached to that plane;
    ///  - no horizontal plane within ~3 s of tracking -> auto-place ~1.5 m ahead (fallback).
    /// Verified on device in Milestone 1. Taps are routed here by ARScenarioController so that
    /// a tap on an answer option never moves the training area.
    /// </summary>
    public class ARPlacementController : MonoBehaviour
    {
        public enum PlacementMode { None, Plane, Fallback }

        [Header("AR Foundation")]
        public ARRaycastManager raycastManager;
        public ARPlaneManager planeManager;
        public ARAnchorManager anchorManager;
        public Camera arCamera;

        [Header("Content (re-parented under the anchor)")]
        public Transform content;

        [Header("Fallback")]
        public float fallbackDelaySeconds = 3f;
        public float fallbackDistance = 1.5f;
        [Tooltip("How far below the camera the fallback content is placed (camera is ~hand height).")]
        public float fallbackDrop = 1.0f;

        public PlacementMode Mode { get; private set; } = PlacementMode.None;
        public event Action<PlacementMode> Placed;

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
                    if (plane.alignment == PlaneAlignment.HorizontalUp && plane.trackingState == TrackingState.Tracking) n++;
                return n;
            }
        }

        /// <summary>Seconds left before automatic fallback placement (negative when not counting).</summary>
        public float FallbackCountdown =>
            Mode == PlacementMode.None && m_TrackingSince >= 0f && HorizontalPlaneCount == 0
                ? fallbackDelaySeconds - (Time.time - m_TrackingSince) : -1f;

        void Update()
        {
            if (ARSession.state != ARSessionState.SessionTracking)
            {
                if (Mode == PlacementMode.None) m_TrackingSince = -1f;
                return;
            }
            if (m_TrackingSince < 0f) m_TrackingSince = Time.time;

            if (Mode == PlacementMode.None && HorizontalPlaneCount == 0 && Time.time - m_TrackingSince >= fallbackDelaySeconds)
            {
                PlaceFallback();
            }
        }

        /// <summary>Place (or move) the content onto a horizontal plane under a screen point.</summary>
        public bool TryPlaceAt(Vector2 screenPos)
        {
            if (ARSession.state != ARSessionState.SessionTracking) return false;
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
            content.SetParent(anchor.transform, false);
            content.localPosition = Vector3.zero;
            if (m_Anchor != null && m_Anchor != anchor) Destroy(m_Anchor.gameObject);
            m_Anchor = anchor;

            // Face away from the user (yaw only): local -Z points at the user, +Z is "further away".
            Vector3 away = Vector3.ProjectOnPlane(anchor.transform.position - arCamera.transform.position, Vector3.up);
            if (away.sqrMagnitude > 1e-4f) content.rotation = Quaternion.LookRotation(away.normalized, Vector3.up);
            content.gameObject.SetActive(true);

            Mode = mode;
            Debug.Log($"[Placement] placed via {mode}");
            Placed?.Invoke(mode);
        }
    }
}
