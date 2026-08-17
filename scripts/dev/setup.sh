#!/usr/bin/env bash
#
# First-time setup for a local Liveblog development environment (or after a
# reset). Idempotent: safe to run again.
#
# What it does:
#   1. Validates prerequisites (Docker running, pyenv + the liveblog venv,
#      Volta, curl) — it never installs system-level tooling, it only checks
#      and tells you exactly what to install if something is missing.
#   2. Installs Python deps into the pyenv virtualenv and Node deps for the
#      client.
#   3. Brings up the backing services (Redis, Elasticsearch, MongoDB) in
#      Docker and waits for Elasticsearch to answer.
#   4. On first run only, initialises the database (sample data, an
#      admin/admin user, and the local themes) — guarded by a sentinel file.
#
# Usage:
#   ./scripts/dev/setup.sh            # normal first-time setup
#   ./scripts/dev/setup.sh --reinit   # force the DB init step to run again
#
# After this, start the stack day-to-day with ./scripts/dev/up.sh

set -euo pipefail

REINIT=false
for arg in "$@"; do
    case "$arg" in
        --reinit) REINIT=true ;;
        *) echo "unknown argument: $arg" >&2; exit 2 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
CLIENT_DIR="$REPO_ROOT/client"
COMPOSE_FILE="$REPO_ROOT/docker/docker-compose-dev-services.yml"
RUN_DIR="$SCRIPT_DIR/.run"
SETUP_SENTINEL="$RUN_DIR/.setup-done"

# The pyenv virtualenv the backend runs in. Named "liveblog" by default;
# override with LIVEBLOG_VENV if yours is called something else. We resolve
# the venv's bin directory and call its binaries directly, rather than
# relying on `pyenv activate` (which only works in interactive shells).
LIVEBLOG_VENV="${LIVEBLOG_VENV:-liveblog}"

mkdir -p "$RUN_DIR"

log()  { printf '\n[liveblog-setup] %s\n' "$*"; }
fail() { printf '\n[liveblog-setup] ERROR: %s\n' "$*" >&2; exit 1; }

# Returns 0 while Elasticsearch answers HTTP on 9200.
es_reachable() {
    curl -sS -o /dev/null --max-time 2 "http://localhost:9200" 2>/dev/null
}

# ---- Prerequisite checks (validate, never install) ----

[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE not found — run this from inside the liveblog repo."
[ -d "$SERVER_DIR" ]   || fail "$SERVER_DIR not found — run this from inside the liveblog repo."
[ -d "$CLIENT_DIR" ]   || fail "$CLIENT_DIR not found — run this from inside the liveblog repo."

command -v docker > /dev/null || fail "Docker is not installed. Install Docker first."
docker info > /dev/null 2>&1  || fail "Docker is installed but not running. Start Docker and try again."

command -v pyenv > /dev/null || fail "pyenv is not installed. Install it from https://github.com/pyenv/pyenv"

VENV_BIN="$(pyenv root)/versions/$LIVEBLOG_VENV/bin"
if [ ! -x "$VENV_BIN/python" ]; then
    cat >&2 <<EOF

[liveblog-setup] ERROR: the '$LIVEBLOG_VENV' pyenv virtualenv was not found at
[liveblog-setup]   $VENV_BIN

[liveblog-setup] Create it with:

[liveblog-setup]   pyenv install 3.6.15
[liveblog-setup]   pyenv virtualenv 3.6.15 $LIVEBLOG_VENV

[liveblog-setup] (If your virtualenv has a different name, re-run with
[liveblog-setup]  LIVEBLOG_VENV=<name> ./scripts/dev/setup.sh)

EOF
    exit 1
fi

command -v volta > /dev/null || fail "Volta is not installed. See https://volta.sh — the client's Node version is pinned through it."
command -v curl  > /dev/null || fail "curl is not installed."

log "using pyenv virtualenv '$LIVEBLOG_VENV' at $VENV_BIN"

# ---- 1. Python dependencies ----

log "installing Python dependencies into the '$LIVEBLOG_VENV' virtualenv (slow on a cold cache)"
(cd "$SERVER_DIR" && "$VENV_BIN/pip" install -r requirements.txt -r dev-requirements.txt)

# ---- 2. Client dependencies ----

log "installing client dependencies (Volta selects the pinned Node automatically)"
(cd "$CLIENT_DIR" && npm install)

# ---- 3. Backing services ----

log "starting backing services (Redis, Elasticsearch, MongoDB) via docker compose"
docker compose -f "$COMPOSE_FILE" up -d

log "waiting for Elasticsearch on :9200 (cold start can take a minute)"
elapsed=0
until es_reachable; do
    if [ "$elapsed" -ge 120 ]; then
        fail "Elasticsearch didn't come up within 2 minutes — check 'docker compose -f docker/docker-compose-dev-services.yml logs'"
    fi
    sleep 3
    elapsed=$((elapsed + 3))
done
log "Elasticsearch is up"

# app:initialize_data also talks to MongoDB, which `docker compose up -d` does
# not guarantee is accepting connections yet. Mongo boots fast, but on a cold
# start it can lag Elasticsearch — wait for its port so init doesn't race it.
log "waiting for MongoDB on :27017"
elapsed=0
until (exec 3<>/dev/tcp/localhost/27017) 2>/dev/null; do
    if [ "$elapsed" -ge 60 ]; then
        fail "MongoDB didn't come up within 60s — check 'docker compose -f docker/docker-compose-dev-services.yml logs'"
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done
log "MongoDB is up"

# ---- 4. First-run database init (guarded by sentinel) ----

if [ "$REINIT" = true ] || [ ! -f "$SETUP_SENTINEL" ]; then
    log "initialising the database (sample data + admin user + local themes)"

    (cd "$SERVER_DIR" && "$VENV_BIN/python" manage.py app:initialize_data) \
        || fail "app:initialize_data failed — check 'docker compose -f docker/docker-compose-dev-services.yml logs'"

    # users:create exits non-zero if the admin already exists. Tolerate only
    # that case (relevant on --reinit against an existing DB); fail loudly on
    # anything else, so a broken admin can't masquerade as a good setup.
    create_out=""
    if ! create_out=$( (cd "$SERVER_DIR" && "$VENV_BIN/python" manage.py \
            users:create -u admin -p admin -e 'admin@example.com' --admin) 2>&1 ); then
        if printf '%s' "$create_out" | grep -qiE 'already exists|duplicate|E11000'; then
            log "admin user already exists; leaving it as-is"
        else
            printf '%s\n' "$create_out" >&2
            fail "users:create failed (see output above)"
        fi
    fi

    (cd "$SERVER_DIR" && "$VENV_BIN/python" manage.py register_local_themes) \
        || fail "register_local_themes failed"

    touch "$SETUP_SENTINEL"
    log "database initialised — admin user is admin / admin"
else
    log "database already initialised (sentinel at $SETUP_SENTINEL); skipping init"
    log "pass --reinit to force it to run again"
fi

log "setup complete"
log ""
log "  backing services are running."
log "  start the full stack with:  ./scripts/dev/up.sh"
log "  stop everything with:       ./scripts/dev/down.sh"
