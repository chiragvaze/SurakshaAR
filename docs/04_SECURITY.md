# Security Specification

## Threat model for prototype
Protect against:
- accidental certificate tampering;
- malformed local data;
- unauthorized UI assumptions;
- accidental leakage of personal information.

Do not claim the prototype's client-side HMAC is production-grade.

## Certificate security
Demo:
- Base64 certificate body.
- HMAC-SHA256 signature.
- first 16 hex characters used for compact demo signature.
- verification recomputes signature locally.

Threat limitation:
The embedded secret can be extracted from the app.

Production:
- server-side asymmetric signing;
- private key never shipped to client;
- public key used for verification;
- HTTPS;
- stronger key management.

## Data minimization
Store only:
- worker name;
- worker ID;
- training/attempt results;
- certificate data;
- local retention state.

Never request Aadhaar for the prototype.

## Camera
Camera frames remain on-device.

## Offline
Core verification must not depend on network.

## Input validation
- validate worker fields;
- validate scenario IDs;
- reject malformed certificate bodies;
- bound timestamps and payload sizes;
- never trust client-derived score when a future server exists.

## Secrets
- no real credentials in repository;
- demo secret may be embedded only for the hackathon demonstration;
- README must explicitly disclose the limitation.

## QR tamper handling
Any body/signature mutation must result in INVALID.

## Future production requirements
- asymmetric signing;
- server-side audit trail;
- role-based authorization;
- secure secret/key storage;
- HTTPS;
- certificate revocation/status strategy.
