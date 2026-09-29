# System Architecture

## Principle
Unity is the renderer/AR engine, not the whole application.

The Web app is the business/UI brain.

## Components

### Android shell
- Kotlin
- MainActivity
- WebView
- JavaScript bridge
- launches Unity
- receives Unity result

### Web app
- vanilla HTML/CSS/JS preferred
- language dictionaries
- scenario business logic
- scoring
- certificate/QR
- verification
- retention
- localStorage

### Unity Library
- Unity 2022.3 LTS
- AR Foundation 5.1.x
- ARCore XR Plugin 5.1.x
- one AR scene
- shared scenario engine
- Fire and Gas scenario data

### Dashboard
- static HTML
- seeded data
- simple CSS/Chart.js only if useful
- no backend required for prototype

## Data flow
```text
Web -> Android.launchAR(module, lang)
Android -> Unity
Unity -> result(score, wrong)
Android/Web -> result page
Result -> certificate if passed
Certificate -> local QR
Verify -> local HMAC + expiry check
Dashboard -> local/seeded worker data
```

## Repository
```text
/unity-ar
/android-shell
/web-app
/dashboard
/docs
```

## Build order
1. Unity export.
2. Copy Unity library into Android shell.
3. Copy web app into Android assets.
4. Gradle release build.
5. Dashboard deployment.

## Architecture fallback
If Unity Library integration fails by the hour-10 milestone:
- keep Unity AR as a separate app;
- keep web/PWA as separate app;
- use `surakshaar://result?score=...&wrong=...` deep link;
- demonstrate the linked workflow instead of blocking the entire prototype.
