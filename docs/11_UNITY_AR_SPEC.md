# Unity AR Specification

## Unity stack
- Unity 2022.3 LTS
- AR Foundation 5.1.x
- ARCore XR Plugin 5.1.x
- IL2CPP
- ARM64
- minimum API 29
- OpenGLES3
- no Vulkan

## Scene
One scene:
`AR_Trainer`

## Placement
- first tap raycasts against detected plane;
- creates anchor;
- options arranged in a ~0.7m arc;
- options ~0.4m above floor;
- touch raycast against BoxCollider;
- if plane detection fails, auto-place ~1.5m ahead after ~3 seconds.

## Scripts
Expected conceptual scripts:
- `Scenario.cs`
- `ARScenarioController.cs`
- `AndroidBridge.cs`
- `OptionTag.cs`
- `ScenarioValidator.cs`

## Data
Scenario files can be read from StreamingAssets via UnityWebRequest.

## Performance
- models <5k tris
- textures <=1024
- no realtime lights
- mono OGG
- 30 FPS target
- 24 FPS minimum
- Unity assets <60 MB

## AR content
### Fire
Exit sign, extinguisher/electrical-fire context, smoke response.

### Gas
Leak zone, confined-space PPE, standby attendant.

## Fallback
Auto-placement if plane detection is flaky.

If AR library merge fails, use the two-app deep-link architecture.
