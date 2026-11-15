# Relay wire protocol

The relay forwards frames between two devices. It cannot read them. The end-to-end transfer protocol (keys, PAKE, frames) is in the `sparrow-core` repo, `docs/protocol.md`.

## Routes
- `GET /` info page, `GET /health` returns `ok`.
- WebSocket `/v1/session/<id>?role=host|guest`: `id` is base64url, 22 to 64 characters.
- WebSocket `/v1/code/<NNN>?role=host|guest`: `NNN` is 3 digits (short-code flow).

## Rules
- Only the host creates a session. A busy session (or number) answers 409. The guest on a missing session gets 404.
- One host and one guest per session. The guest has 3 connection attempts, then the session is destroyed (429).
- A session lives 2 minutes. When the host leaves, the session ends.
- Clients send binary frames only (max 2 MiB each). A text frame closes the connection (1003), a too large frame closes it (1009).
- The relay sends text frames: `peer-joined` (to host), `peer-left` (to host), `session-ended` (to everyone, right before it closes).
- Rate limit per IP: 120 requests per minute on `/v1/session`, 30 on `/v1/code` (counted per data center, so approximate). Over the limit: 429.
