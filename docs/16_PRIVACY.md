# Privacy Specification

## Prototype data
Only:
- worker name
- worker ID
- training attempts/results
- certificate information
- local retention state

## Camera
Camera frames never leave the device.

## Connectivity
Core training and certificate verification must work without network.

## Data architecture
Local-first. Any future sync is optional and non-blocking.

## Production considerations
If deployed beyond the hackathon:
- define lawful purpose/consent;
- secure transport;
- access control;
- retention/deletion policy;
- audit logs;
- server-side certificate trust;
- privacy review for any future computer vision.
