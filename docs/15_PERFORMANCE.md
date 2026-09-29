# Performance Specification

## Targets
- AR: 30 FPS target, 24 FPS minimum.
- cold start: <5 seconds target.
- APK: <=150 MB.
- Unity assets: <60 MB.
- models: <5k tris.
- textures: <=1024.
- no realtime lights.
- mono OGG audio.

## Optimization order
1. Remove unnecessary assets.
2. Reduce model polygons.
3. Reduce texture sizes.
4. Reduce number of simultaneously rendered options.
5. Remove shadows/realtime lighting.
6. Simplify audio.
7. Only then consider deeper architectural changes.

## Frame-drop fallback
- two options instead of three where the scenario permits a safe prototype simplification;
- smaller models;
- no shadows.
