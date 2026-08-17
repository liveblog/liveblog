---
description: Start the local Liveblog dev stack (backing services, backend, and client dev server).
---

Run `./scripts/dev/up.sh $ARGUMENTS` and relay its output to the user.

This starts the full stack in three layers — backing services in Docker, the
backend (honcho: API + websocket + celery), and the client dev server — and
waits until each one answers. It's idempotent: if the stack is already up,
it's a quick no-op. The backend and client run in the background; the script
returns once everything is reachable.

If the script tells the user to run setup first, route them to
`/liveblog-setup`. For any other error, relay the script's message verbatim
and stop.

On success: tell the user the app is at `http://localhost:9000`, login
`admin` / `admin`. Mention that they can stop everything with `/liveblog-down`,
and that the backend and client logs live under `scripts/dev/.run/`.
