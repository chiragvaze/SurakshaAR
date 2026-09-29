using UnityEngine;

namespace SurakshaAR
{
    /// <summary>
    /// Marks a spatial answer object. A touch raycast against its BoxCollider maps directly to
    /// the scenario option ID (docs/11_UNITY_AR_SPEC.md "touch raycast against BoxCollider").
    /// Also owns the option's label and correct/incorrect feedback visuals.
    /// </summary>
    [RequireComponent(typeof(BoxCollider))]
    public class OptionTag : MonoBehaviour
    {
        public enum State { Idle, Correct, Wrong, Safe, Dimmed }

        public string optionId;
        public Transform label;          // billboard label quad (or TextMesh in the editor)
        public Transform prop;           // 3D prop root
        public State CurrentState { get; private set; } = State.Idle;

        System.Action<OptionTag, State> m_Relabel;
        Vector3 m_PropScale;
        float m_PulseUntil;

        public void Init(string id, Transform propRoot, Transform labelRoot, System.Action<OptionTag, State> relabel)
        {
            optionId = id;
            prop = propRoot;
            label = labelRoot;
            m_Relabel = relabel;
            m_PropScale = prop != null ? prop.localScale : Vector3.one;
        }

        public void SetState(State state)
        {
            CurrentState = state;
            m_Relabel?.Invoke(this, state);
            if (prop != null) prop.localScale = m_PropScale * (state == State.Dimmed ? 0.8f : 1f);
            if (state == State.Correct || state == State.Wrong) m_PulseUntil = Time.time + 0.6f;
        }

        void LateUpdate()
        {
            var cam = Camera.main;
            if (cam != null && label != null)
            {
                // Yaw-only billboard so labels stay upright and readable.
                Vector3 toCam = cam.transform.position - label.position;
                toCam.y = 0f;
                if (toCam.sqrMagnitude > 1e-4f) label.rotation = Quaternion.LookRotation(-toCam.normalized, Vector3.up);
            }
            if (prop != null && m_PulseUntil > 0f)
            {
                if (Time.time < m_PulseUntil)
                {
                    float t = 1f - (m_PulseUntil - Time.time) / 0.6f;
                    prop.localScale = m_PropScale * (1f + 0.25f * Mathf.Sin(t * Mathf.PI));
                }
                else
                {
                    prop.localScale = m_PropScale;
                    m_PulseUntil = 0f;
                }
            }
        }
    }
}
