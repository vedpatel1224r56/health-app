# Telemedicine TURN Setup

This app now supports server-driven WebRTC ICE configuration through:

- `GET /api/teleconsults/rtc-config`

Doctor and patient teleconsult screens will use the backend-provided ICE servers when available, and fall back to public STUN only when no TURN configuration is set.

## Recommended production shape

Use:

1. browser WebRTC in the patient app
2. browser WebRTC in the doctor app
3. SehatSaathi backend for signaling
4. your own `coturn` server for relay reliability

This keeps the telemedicine stack in-house while still supporting hard networks.

## Backend env vars

Add these to the backend environment:

```bash
WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
WEBRTC_TURN_URLS=turn:YOUR_DOMAIN_OR_IP:3478?transport=udp,turn:YOUR_DOMAIN_OR_IP:3478?transport=tcp
WEBRTC_TURN_USERNAME=sehatsaathi-turn
WEBRTC_TURN_CREDENTIAL=replace-with-strong-secret
```

Optional:

```bash
# Use this only while validating relay behavior explicitly.
WEBRTC_ICE_TRANSPORT_POLICY=relay
```

Notes:

- `WEBRTC_TURN_URLS` may include both UDP and TCP relay URLs.
- Use a strong TURN credential.
- Leave `WEBRTC_ICE_TRANSPORT_POLICY` unset for normal operation.

## Local testing without paying

You can test TURN locally or on a small private VM.

### Option 1: local Docker test

If Docker is available, run a local coturn instance:

```bash
docker run --name sehatsaathi-coturn \
  -p 3478:3478 \
  -p 3478:3478/udp \
  -e TURN_USERNAME=sehatsaathi-turn \
  -e TURN_PASSWORD=replace-with-strong-secret \
  -d instrumentisto/coturn \
  -n \
  --lt-cred-mech \
  --fingerprint \
  --realm=sehatsaathi.local \
  --user=sehatsaathi-turn:replace-with-strong-secret
```

Then point backend env to:

```bash
WEBRTC_TURN_URLS=turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp
WEBRTC_TURN_USERNAME=sehatsaathi-turn
WEBRTC_TURN_CREDENTIAL=replace-with-strong-secret
WEBRTC_ICE_TRANSPORT_POLICY=relay
```

### Option 2: Ubuntu VM with coturn

Install:

```bash
sudo apt update
sudo apt install -y coturn
```

Edit `/etc/turnserver.conf`:

```text
listening-port=3478
fingerprint
use-auth-secret=0
lt-cred-mech
realm=sehatsaathi.co
user=sehatsaathi-turn:replace-with-strong-secret
total-quota=100
bps-capacity=0
stale-nonce
no-loopback-peers
no-multicast-peers
```

Then enable and restart:

```bash
sudo systemctl enable coturn
sudo systemctl restart coturn
```

Open firewall for:

- `3478/tcp`
- `3478/udp`

## How to verify the app is using TURN config

After backend restart, authenticated requests to:

```text
/api/teleconsults/rtc-config
```

should return JSON like:

```json
{
  "iceServers": [
    { "urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    {
      "urls": ["turn:YOUR_DOMAIN_OR_IP:3478?transport=udp", "turn:YOUR_DOMAIN_OR_IP:3478?transport=tcp"],
      "username": "sehatsaathi-turn",
      "credential": "replace-with-strong-secret"
    }
  ]
}
```

If `WEBRTC_ICE_TRANSPORT_POLICY=relay` is set, the response should also include:

```json
{
  "iceTransportPolicy": "relay"
}
```

## Final smoke test

Run this after TURN is configured:

1. Sign in as doctor in ops.
2. Sign in as patient in patient app.
3. Book one video consult.
4. Schedule it.
5. Open doctor live video window.
6. Accept patient teleconsult notice and join.
7. Confirm:
   - doctor sees patient
   - patient sees doctor
   - audio works both ways
   - mute/camera toggles work
   - end call closes the doctor live window
8. Repeat once for audio mode.

## Rollout standard

Call telemedicine complete only after:

1. TURN is configured
2. video passes on two separate devices
3. audio passes on two separate devices
4. both pass on at least two different network conditions

Without TURN, the code can be correct and still fail on real hospital, home, or mobile networks.
