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

## 7. Next: code variant (7 digits)
Short code = relay-issued session number + PAKE secret (CPace or SPAKE2). It needs a relay change:
the relay issues the short number. After PAKE, both screens show a short check string to compare.
