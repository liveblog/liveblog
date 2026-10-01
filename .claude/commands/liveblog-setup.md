---
description: First-time setup of the local Liveblog dev environment (installs deps, starts services, initialises the database).
---

Run `./scripts/dev/setup.sh $ARGUMENTS` and relay its output to the user.

This is the first-time / after-reset step: it installs Python and client
dependencies, brings up the backing services in Docker, and on first run
initialises the database with sample data and an `admin` / `admin` user. It
can take several minutes on a cold cache.

The script accepts `--reinit` to force the database-init step to run again —
pass it through only if the user explicitly asked to re-initialise.

The script validates its own prerequisites and prints exact fix-it
instructions if something is missing (Docker not running, the pyenv
virtualenv missing, Volta not installed). If it errors, relay the script's
message verbatim and stop — do not try to install tooling or fix it yourself.

On success: tell the user setup is done and the next step is `/liveblog-up`
(or just asking to "start liveblog"). Mention the login is `admin` / `admin`.
