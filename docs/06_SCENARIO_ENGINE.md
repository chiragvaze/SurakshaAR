# Scenario Engine Specification

## Goal
One reusable engine must drive both Fire and Gas modules.

## Scenario object
Each module:
- id
- localized title
- steps[]

Each step:
- id
- localized prompt
- optional audio key
- options[]
- correct option
- localized feedback/hazard metadata as required.

## Interaction
1. Load scenario.
2. Render prompt.
3. Render options.
4. Worker selects.
5. Determine correct/incorrect.
6. Increment wrong if incorrect.
7. Show feedback.
8. Advance.
9. Compute final score using shared function.

## Fire
- exit sign
- CO2
- crawl low

## Gas
- red leak zone
- detector + breathing set
- standby attendant

## Unity contract
Unity consumes the same conceptual scenario source so content does not diverge between Web and AR.

## Validation
A scenario validator should ensure:
- unique step IDs;
- exactly 3 steps for prototype;
- exactly 3 options per step;
- exactly one correct option;
- every required language has a value or valid fallback.
