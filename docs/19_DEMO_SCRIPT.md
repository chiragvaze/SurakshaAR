# Official Demo Script

Target length: 3–5 minutes.

## 1. Language
Choose Hindi or Santali.

## 2. Fire AR
- camera opens;
- scan floor;
- tap to place;
- voice instruction;
- 3D hazard/scenario objects;
- worker selects safe actions;
- score appears.

## 3. Gas AR
Repeat the same engine with Gas & Confined Space.

## 4. Certificate
Pass -> signed certificate with QR.

## 5. Offline verification
Turn on airplane mode.
Verify -> VALID.
Change one character.
Verify -> INVALID.

## 6. Dashboard
Show seeded workers, scores and risk.

## 7. Retention
Use +7 days.
Show risk increase and `Refresher Due`.

Anything not needed for these seven steps is secondary.

## Demo runbook (validated in P3-M1, 2026-09-30)
This order ran end-to-end offline on the Redmi Note 11 with the frozen APK (D-033). A timed rehearsal and the demo video are still pending (P3-M5).

### Before the demo
1. Clear app storage: Android **Settings → Apps → SurakshaAR → Storage → Clear storage**, or `adb shell pm clear com.surakshaar.app`. Clearing also removes the camera permission.
2. Grant the camera permission before starting, so the first camera prompt is never denied (D-032).
3. Check that Google Play Services for AR is installed and enabled. Installing or updating it needs internet, so do this before going offline.
4. Check that the Hindi text-to-speech voice is available.
5. Turn airplane mode ON, and check that Wi-Fi is OFF.

### During the demo
6. Choose Hindi, then enter the worker.
7. Open Fire and tap **Start**. A Unity startup screen of about 4 s is expected before the camera view appears.
   - Point the phone **ahead**. Don't hunt for a floor plane: if none is found, the content is placed automatically after about 3 s.
8. Complete Fire, then tap **Finish** (not "Train again") to return to the Result screen.
9. Tap **Get Certificate**. A certificate is only created on request. Show the details and the QR.
10. Verify: **VALID**.
11. **Change 1 character (demo)**, then Verify: **INVALID**.
12. **Use Last Certificate**, then Verify: **VALID** again.
13. Complete Gas the same way.
14. Home → **supervisor dashboard**.
15. **Simulate +7 Days**. Show the risk increase, the red workers, **Refresher Due**, and the Home Retention Guard card.
16. **Reset time**, so the next run starts from today.

### Presenter notes
- The language button in the top bar changes the saved language. Avoid tapping it mid-demo.
- If the camera is ever denied, AR stays off until the app is closed and reopened (D-023, D-032).
- The QR is verified on the same phone. Scanning it with another phone's camera only shows the text payload.
