# Sparrow transfer protocol, v1 (QR variant, draft)

Goal: move an already encrypted vault from one device (host) to another (guest).
The relay only forwards opaque binary frames. It never sees keys or plaintext.

## 1. Session setup
1. Host creates `id` (16 random bytes, base64url) and `k` (32 random bytes).
2. Host connects: `wss://<relay>/v1/session/<id>?role=host`.
3. Host shows a QR code: `sparrow://t/1/<id>/<k base64url>/<relay list>`.
4. Guest scans it and connects with `role=guest`. Host gets the text frame `peer-joined`.

Relay text frames (relay to client only): `peer-joined`, `peer-left`, `session-ended`.
Clients must treat `session-ended` as the end of the session. Clients never send text frames.

## 2. Keys
`k` is high-entropy, so no password-based step is needed.
- `k_h2g = HKDF-SHA256(k, salt = id, info = "sparrow/v1/h2g")`, 32 bytes
- `k_g2h = HKDF-SHA256(k, salt = id, info = "sparrow/v1/g2h")`, 32 bytes
Each direction has its own key.

## 3. Frame format (binary)
| bytes | field |
|---|---|
| 1 | version = 0x01 |
| 1 | type |
| 24 | random nonce (XChaCha20-Poly1305) |
| n | ciphertext + 16-byte tag |

AAD = version, type, `id`. Plaintext starts with `seq` (u32, big endian).
Each side only accepts a `seq` greater than the last accepted one (stops replay).

## 4. Types
- `0x01 HELLO` (guest to host): proves the guest knows `k`. Host replies `0x02 READY`.
- `0x03 DATA`: `seq`, `flags` (bit 0 = last chunk), chunk bytes (max 256 KiB).
- `0x04 ACK`: `seq` of the last chunk received.
- `0x05 ERROR`: `seq`, code. Sender closes after it.

Flow: HELLO, READY, DATA..., last DATA, ACK, then host closes.

## 5. Payload
The vault inside DATA is already encrypted under the master password. This layer is a second wrapper only.
Add a SHA-256 of the whole payload in the last chunk and verify it before saving.

## 6. Rules
- A session lasts at most 2 minutes. The guest has 3 connection attempts.
- Any decryption failure: stop, show an error, do not retry silently.
- The relay address list is in the QR. The client tries each address in order.

## 7. Code variant (7 digits)
Code = `NNNSSSS`: `NNN` is the relay session number, `SSSS` is the PAKE secret.
1. Host picks a random `NNN`, connects to `/v1/code/<NNN>?role=host`. On HTTP 409 (number in use) it picks another one.
   Host generates a random `SSSS` and shows the full 7 digits.
2. Guest types the 7 digits, connects to `/v1/code/<NNN>?role=guest`.
3. Both run a PAKE (CPace or SPAKE2) with password `SSSS` and identity `sparrow-v1|<NNN>`.
   PAKE messages are binary frames (type `0x10`, `0x11`). The result is `k`.
4. Key confirmation: each side sends an HMAC over the PAKE transcript (type `0x12`).
   On mismatch the host closes the session at once, so an attacker gets one guess per session.
5. Both screens show a 4-digit check string `HKDF(k, "sparrow/v1/sas")`. The user confirms they match.
6. Continue with sections 2 to 5, using `k` and `NNN` (as ASCII) instead of `id` for the salt and AAD.

Limits of this variant:
- `SSSS` has only 10 000 values. One guess per session means about 0.01% chance for a blind attacker, but an attacker can also burn sessions. The relay limits requests per IP (30 per minute per location on the code route).
- Use the QR variant by default. The code is a fallback when no camera is available.
- The code lives at most 2 minutes and works once.
