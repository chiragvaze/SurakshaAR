# Risks and Fallbacks

| Risk | Fallback |
|---|---|
| Unity Library merge fails | two linked apps + deep link |
| Plane detection unreliable | auto-place after timeout |
| Santali audio unavailable | Hindi audio + Santali text |
| Cloud sync buggy | seeded local dashboard |
| QR live scan too slow | paste/use last certificate |
| Frame drops | smaller models, two options, no shadows |
| Device lacks ARCore | supported-device requirement / non-AR demonstration fallback |
| Time runs out | protect Fire AR, offline certificate, Hindi, dashboard risk and demo |
| Scope expands | defer roadmap features |

## Status of fallbacks and open risks (as of 2026-09-30)
- **Unity Library merge:** succeeded, so the two-app deep-link fallback was not needed (D-028).
- **Plane detection:** the auto-place fallback is verified on the phone. P3-M1 used it in both Fire and Gas because no floor plane was found. The presenter should point the phone ahead.
- **Santali audio:** Hindi TTS voice plus Santali text (D-026). Santali text itself still mostly falls back to Hindi; only the greeting and module titles are Santali (D-018).
- **QR live scan:** not built. Paste and Use Last Certificate are in place and verified on the phone.
- **Frame drops:** not needed. About 29.9 FPS sustained (Phase 2 M5).
- **Device lacks ARCore:** the fallback is code-reviewed and unit-tested only. The web app switches to the on-screen trainer after `ar_unsupported`, `camera_denied` or `launch_failed` (D-023).
- **Open risks:**
  - D-032, the ARCore crash when the first camera prompt is denied. The fix is deferred until after the hackathon (D-036). Mitigation: grant camera permission before launching AR.
  - Santali: no approved content exists (D-036). Present the demo in Hindi.
  - Submission gaps (P3-M4, D-037): the **dashboard URL is not deployed**, and the **GitHub repository is private**, although `17_DEPLOYMENT.md` requires a public one. Both need the owner's decision. For the live demo, the in-app dashboard needs neither.
  - After a camera denial, AR stays off until the app restarts.
  - D-034, the offline-cache registration failure (non-blocking).
  - The release APK is signed with a **local, non-production** key (P3-M2, D-035).
    - The keystore exists only on the development machine; if it is lost, later updates can't be installed over this APK without uninstalling first.
    - Store distribution would need a proper release and Play App Signing setup (D-031).
  - Only one phone model has been tested.
  - The ARCore and Hindi TTS dependencies on the demo phone.

## Never cut
- Fire AR
- signed QR offline verification
- Hindi
- dashboard risk column
- demo video

## Can be cut if required
- Gas polish
- Santali audio
- live QR camera scanning
- cloud sync
- adaptive refresher logic
