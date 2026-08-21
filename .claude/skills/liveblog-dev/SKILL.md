---
name: liveblog-dev
description: |
  Run a local Liveblog development environment. Wraps the dev scripts under
  scripts/dev/ (setup, up, down) so someone can bring the app up, stop it, or
  check its status without knowing the Docker / honcho / grunt commands
  underneath.

  Invoke when the user wants to do any of:
  — "set me up", "first-time setup", "I just cloned this, get me running"
  — "start liveblog", "run the app locally", "spin up the dev environment"
  — "stop liveblog", "shut down the local environment"
  — "is it running?", "what's the status of the local stack?"

  Do not invoke for: production deploys, running the test suites, or backend /
  client code changes. This skill only starts, stops, and reports on the local
  dev stack.
---

# Running Liveblog locally

You are helping someone bring up (or stop, or check) a local Liveblog dev
environment. The person may not be technical — they might be a PM or a
designer who just needs the app running so they can click around. Talk in
plain language: no Docker / honcho / grunt / pyenv jargon unless they raise it
first. Explain what's happening, and hand off with "here's where you can
click."

This skill does not write code, commit, or open PRs. Its whole job is to run
one of three scripts and relay the result. **The scripts own all behaviour and
all error messages.** Your job is to route the user's intent to the right
script and pass its output along — never to reimplement its checks, guess at
fixes, or quote error text back from memory.

## The golden rule: relay, don't reinterpret

The scripts print their own errors with their own fix-it instructions (Docker
not running, virtualenv missing, "run setup first", port conflicts, and so
on). When a script fails:

- Relay its message to the user **verbatim** and stop.
- Do **not** try to install tooling, kill processes, edit files, or
  otherwise "fix" the underlying problem yourself.
- Do **not** paraphrase or predict the error — show them what the script
  actually said.

If a script's output is confusing to a non-technical user, you may add a
one-line plain-language summary *underneath* the verbatim output — but never
replace it.

## Pre-approved commands

The project ships `.claude/settings.json` with an allow-list covering the
three dev scripts and a small set of read-only diagnostics (docker compose
`ps` / `logs`, `lsof` on the relevant ports, `curl` health checks, and
reading the log files under `scripts/dev/.run/`). Those run without a prompt.

If you want to run something **not** on that list, stop and ask the user
first. Don't broaden what you do to work around a missing permission.

## Workflow

### 1. Pick the mode

The user's message maps to one of four modes:

- **setup** — first time, or after a reset. Runs `./scripts/dev/setup.sh`.
- **up** — start the stack for normal day-to-day use. Runs
  `./scripts/dev/up.sh`.
- **down** — stop the running stack. Runs `./scripts/dev/down.sh`.
- **status** — check what's currently running. Read-only, no script.

If the intent is genuinely ambiguous — for example "get me set up" from
someone who already ran setup last week (do they want setup again, or just
`up`?) — use `AskUserQuestion` with concrete options before doing anything.

### 2. Confirm only when it matters

- **up** and **status** on a clear request: just do it. A plain "start
  liveblog" is its own confirmation — don't add a round-trip.
- **setup**: confirm first (it's slow and does a lot). State plainly what it
  will do.
- **down**: a normal stop is safe — proceed. But if the user asked for
  `--wipe-data` or `--reinit` (or said "wipe everything" / "fresh start" /
  "re-initialise"), spell out in plain language that this **deletes their
  local data** (or re-runs DB init) and confirm with `AskUserQuestion`
  before running it.

If the user would rather skip the confirmation next time, mention the slash
commands exist: `/liveblog-setup`, `/liveblog-up`, `/liveblog-down`. Typing
those is itself the confirmation.

### 3. Run the script and hand off

Run the one script for the chosen mode with the appropriate flags, and relay
its output. Then close with a short, plain-language hand-off:

- **After up**: "The app is running — open http://localhost:9000 and log in
  with **admin / admin**." Mention that stopping is `/liveblog-down`, and that
  the logs live under `scripts/dev/.run/` if they want to watch progress.
- **After setup**: "Setup's done. Next, start the app with `/liveblog-up`."
- **After down**: relay the script's reminder that Docker itself keeps
  running after the stack stops.

### status mode (read-only)

No script, no confirmation. Report what's actually running using only
allow-listed commands:

- `docker compose -f docker/docker-compose-dev-services.yml ps` — are the
  backing services up?
- `lsof -i :5000` (or `:5001` on macOS) — the API. `lsof -i :5100` — the
  websocket. `lsof -i :9000` — the client dev server.
- `curl` the API (`http://localhost:5000/api/`, or `:5001` on macOS) and the
  client (`http://localhost:9000/`) to confirm they answer.

Summarise in plain language: what's up, what's down, and (if nothing is
running) that `/liveblog-up` will start it.

## Known issue: MongoDB fails to restart on macOS

Some Mac setups hit a MongoDB failure that has nothing to do with the scripts
themselves. `docker logs mongodb` shows:

```
WiredTiger error (1) ... file:WiredTiger.wt, connection: /data/db/WiredTiger.wt: handle-open: open: Operation not permitted
```

Mongo starts fine the very first time (it's creating its files), then breaks
on every restart after that (`down` + `up`, or `up` twice). This comes from
how Docker Desktop shares the host filesystem into the container on macOS.
MongoDB's WiredTiger storage engine can't reopen an existing data file across
that bind mount. It doesn't happen on every machine, and it doesn't happen at
all outside macOS.

Because it's not universal, **don't change `docker/docker-compose-dev-services.yml`
in the repo to work around it**. Switching Mongo to a different volume type
there would move the data path for everyone, including people it doesn't
affect, and could quietly break their existing local data. If you hit this,
fix it locally instead, on your own machine only:

1. Edit your local (uncommitted) copy of
   `docker/docker-compose-dev-services.yml`: change the `mongodb-3.4.23`
   service's volume from `../data/mongodb:/data/db` to `mongodb_data:/data/db`,
   and add a top-level `volumes:` section with `mongodb_data:` under it. This
   moves Mongo's storage into a Docker-managed volume instead of the host
   bind mount, which sidesteps the file-sharing issue entirely.
2. `docker compose -f docker/docker-compose-dev-services.yml down` to drop
   the old container, then re-run setup so the database gets initialised into
   the new volume.

Leave those two lines as local, uncommitted changes. Don't stage or commit
them.

## Notes

- **Ports.** The API is on 5000 (5001 on macOS, where AirPlay holds 5000).
  The websocket is on 5100, the client on 9000. The scripts handle the port
  choice; you only need this for the `lsof` / `curl` checks in status mode.
- **Data.** A normal `down` keeps the user's local blogs and users. Only
  `--wipe-data` deletes them — treat it as destructive.
- **Don't start Docker for the user.** If a script says Docker isn't running,
  ask them to start it; don't try to start it yourself.
- **When a script genuinely breaks** (crashes, prints something the fix-it
  text doesn't cover): relay it verbatim and stop. Don't paper over it.
