# UI / UX Specification

## UX principles
- icon-first;
- voice-first where available;
- high contrast;
- large tap targets;
- one clear action per screen;
- minimal reading burden;
- visible progress;
- no hover-dependent interactions;
- mobile-first.

## Core screens

### Welcome
- Suraksha Drishti
- one-sentence purpose
- Start Training

### Language
Three choices:
- हिन्दी
- Santali
- English

### Worker profile
- name
- worker ID
- Continue

### Training home
Cards:
- Fire & Explosion
- Gas Leak & Confined Space
- Certificate
- Verify

### Module briefing
- module name
- purpose
- three-step indicator
- Start

### Assessment
- step count
- prompt
- three options
- feedback
- Continue

### Result
- score
- pass/fail
- wrong answers
- next action

### Certificate
- worker
- module
- score
- issue/expiry
- QR
- verify action

### Verification
- current certificate or paste payload
- Verify
- VALID / INVALID
- understandable failure reason

### Dashboard
- workers
- scores
- risk
- status
- refresher
- +7-day control

## Visual direction
The supplied deck uses:
- seam black `#0F1419`
- slate `#2D3A45`
- hi-vis amber `#F0A202`
- safe-zone green `#2E7D4F`
- hazard red `#C1292E`
- overburden sand `#EDE6DA`

Use this palette for prototype UI where compatible.

Typography direction from deck:
- headings: Barlow Condensed / equivalent
- body: Inter / equivalent
- figures: IBM Plex Mono / equivalent

## States
Every important screen should have:
- loading
- empty
- success
- validation error
- generic error
- unavailable/offline state

## Accessibility
- readable contrast;
- focus-visible states;
- large buttons;
- avoid color as the only signal;
- provide text labels alongside red/green states.
