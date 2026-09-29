# Test Strategy

## Test layers

### Unit
- score calculation
- risk calculation
- certificate encode/decode
- HMAC verify
- scenario validation
- language fallback

### Integration
- worker persistence
- module -> result
- result -> certificate
- certificate -> verification
- +7 -> dashboard

### AR
- plane detection
- anchor placement
- option tap
- wrong/correct feedback
- Unity result bridge

### Device
- Android 10+
- ARCore supported phone
- low-end device where available
- portrait/landscape behavior as defined
- airplane mode

### Security
- tampered QR
- expired certificate
- malformed payload
- unexpected module ID
- local storage corruption handling

### Performance
- startup
- FPS
- memory
- APK size
- asset size

## Regression principle
A shared scenario engine means every change to scoring/content must run both Fire and Gas tests.
