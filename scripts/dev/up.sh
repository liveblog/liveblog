#!/usr/bin/env bash
#
# Start the local Liveblog dev stack, in three layers:
#   1. Backing services (Redis, Elasticsearch, MongoDB) in Docker.
#   2. Backend: honcho running gunicorn (API), the websocket server, and the
#      Celery worker + beat — natively, in the pyenv virtualenv.
#   3. Client: the grunt/webpack dev server.
#
# Idempotent: each layer is skipped if it's already healthy, so re-running
# this on a live stack is a quick no-op. The backend and client run in the
# background (logs in scripts/dev/.run/); this script exits once everything
# answers, and the stack keeps running until you call down.sh.
#
# Usage:
#   ./scripts/dev/up.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
CLIENT_DIR="$REPO_ROOT/client"
COMPOSE_FILE="$REPO_ROOT/docker/docker-compose-dev-services.yml"
RUN_DIR="$SCRIPT_DIR/.run"

HONCHO_PIDFILE="$RUN_DIR/honcho.pid"
HONCHO_LOGFILE="$RUN_DIR/honcho.log"
GRUNT_PIDFILE="$RUN_DIR/grunt.pid"
GRUNT_LOGFILE="$RUN_DIR/grunt.log"

LIVEBLOG_VENV="${LIVEBLOG_VENV:-liveblog}"

mkdir -p "$RUN_DIR"

log()  { printf '\n[liveblog-up] %s\n' "$*"; }
fail() { printf '\n[liveblog-up] ERROR: %s\n' "$*" >&2; exit 1; }

# Resolve the venv bin dir. Guard the pyenv call so a machine without pyenv
# gets the friendly "run setup first" message instead of a cryptic set -e
# abort on the command substitution below.
command -v pyenv > /dev/null || fail "pyenv isn't installed — run ./scripts/dev/setup.sh first (it lists what to install)."
VENV_BIN="$(pyenv root)/versions/$LIVEBLOG_VENV/bin"

# --- Resolve configuration -------------------------------------------------
#
# PORT: the API port gunicorn binds. Default 5000 everywhere except macOS,
# where :5000 is taken by AirPlay Receiver (it answers HTTP and would fool a
# naive "is the API up?" check), so we default to 5001 there. An explicit
# PORT in the environment or .env wins.
if [ -n "${PORT:-}" ]; then
    :
elif [ "$(uname -s)" = "Darwin" ]; then
    PORT=5001
else
    PORT=5000
fi
WSPORT="${WSPORT:-5100}"

# Personal overrides / secrets: source an optional .env at the repo root
# (after defaults, so it wins). errexit is disabled around it so a stray
# `pyenv activate` line in someone's existing .env can't abort this script —
# we don't depend on it, we resolve the venv ourselves.
if [ -f "$REPO_ROOT/.env" ]; then
    log "loading overrides from .env"
    set +e
    set -a
    # shellcheck disable=SC1091
    . "$REPO_ROOT/.env"
    set +a
    set -e
fi

# Derive the URLs the client needs from the final PORT/WSPORT. The client's
# webpack config reads SUPERDESK_URL / SUPERDESK_WS_URL from the environment
# and falls back to localhost:5000 — so exporting these keeps the client
# pointed at the right backend even when PORT isn't 5000 (e.g. on macOS).
export PORT
export SUPERDESK_URL="http://localhost:$PORT/api"
export SUPERDESK_WS_URL="ws://localhost:$WSPORT"

API_URL="http://localhost:$PORT/api/"
CLIENT_URL="http://localhost:9000/"

# --- Reachability helpers --------------------------------------------------

reachable() {
    curl -sS -o /dev/null --max-time 2 "$1" 2>/dev/null
}

# Stricter check for the backend: a healthy server answers with a non-5xx
# status. A lingering half-dead gunicorn returning 5xx (or a dead socket)
# must NOT count as "already up", or up.sh would skip restarting it and leave
# the developer with a broken backend it refuses to fix.
backend_up() {
    local status
    status=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 "$1" 2>/dev/null) || return 1
    case "$status" in
        5??|000) return 1 ;;
        *) return 0 ;;
    esac
}

wait_until_reachable() {
    local url="$1" name="$2" timeout="${3:-120}" log_hint="${4:-}" check="${5:-reachable}"
    local elapsed=0
    until "$check" "$url"; do
        if [ "$elapsed" -ge "$timeout" ]; then
            local msg="$name not reachable at $url after ${timeout}s"
            [ -n "$log_hint" ] && msg="$msg (check $log_hint)"
            fail "$msg"
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    log "$name is up ($url)"
}

# Warn (don't fail) if something unexpected already holds a port we need.
warn_if_port_busy() {
    local port="$1" name="$2"
    command -v lsof > /dev/null || return 0
    local pids
    pids=$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null) || return 0
    [ -n "$pids" ] || return 0
    log "note: port $port ($name) is already in use by PID(s): $pids"
    log "  if that isn't part of this stack, it may conflict."
}

# --- Preflight -------------------------------------------------------------

[ -d "$VENV_BIN" ] && [ -x "$VENV_BIN/honcho" ] \
    || fail "the '$LIVEBLOG_VENV' virtualenv isn't ready — run ./scripts/dev/setup.sh first."
[ -d "$CLIENT_DIR/node_modules" ] \
    || fail "client dependencies aren't installed — run ./scripts/dev/setup.sh first."

log "API port: $PORT (API URL: $API_URL)"
case "$PORT" in
    5001) log "  (auto-picked 5001 on macOS to avoid AirPlay Receiver on :5000)" ;;
esac

# --- Layer 1: backing services --------------------------------------------

log "ensuring backing services are up (Redis, Elasticsearch, MongoDB)"
docker compose -f "$COMPOSE_FILE" up -d
wait_until_reachable "http://localhost:9200" "Elasticsearch" 120 \
    "docker compose -f docker/docker-compose-dev-services.yml logs"

# --- Layer 2: backend (honcho) --------------------------------------------

warn_if_port_busy "$PORT" "API"
warn_if_port_busy "$WSPORT" "websocket"

if backend_up "$API_URL"; then
    log "backend already answering; skipping honcho start"
else
    log "starting backend (honcho: API + websocket + celery) in the background"
    log "  logs: $HONCHO_LOGFILE"
    # Prepend the venv bin to PATH so honcho's child processes (bare
    # gunicorn / python3 / celery in the Procfile) resolve to the venv.
    ( cd "$SERVER_DIR" \
        && PATH="$VENV_BIN:$PATH" nohup "$VENV_BIN/honcho" -f ../docker/Procfile-dev start \
            > "$HONCHO_LOGFILE" 2>&1 & echo $! > "$HONCHO_PIDFILE" )
    wait_until_reachable "$API_URL" "backend API" 120 "$HONCHO_LOGFILE" backend_up
fi

# --- Layer 3: client (grunt) ----------------------------------------------

warn_if_port_busy 9000 "client"

if reachable "$CLIENT_URL"; then
    log "client already answering; skipping grunt start"
else
    log "starting client dev server in the background (first build is slow: ~2-5 min)"
    log "  logs: $GRUNT_LOGFILE"
    log "  client will talk to backend at: $SUPERDESK_URL"
    ( cd "$CLIENT_DIR" \
        && nohup ./node_modules/.bin/grunt --debug-mode=true \
            > "$GRUNT_LOGFILE" 2>&1 & echo $! > "$GRUNT_PIDFILE" )
    wait_until_reachable "$CLIENT_URL" "client" 300 "$GRUNT_LOGFILE"

    # The PID captured above is the nohup/subshell wrapper, which exits once
    # grunt forks. Overwrite the pidfile with the real listener on :9000 so
    # down.sh can find it.
    if command -v lsof > /dev/null; then
        listener_pid=$(lsof -ti:9000 -sTCP:LISTEN 2>/dev/null | head -1) || true
        [ -n "${listener_pid:-}" ] && echo "$listener_pid" > "$GRUNT_PIDFILE"
    fi
fi

# --- Done ------------------------------------------------------------------

log "ready — the Liveblog dev stack is running"
log ""
log "  Open the app:  http://localhost:9000     (log in with  admin / admin)"
log "  API:           $API_URL"
log "  Websocket:     ws://localhost:$WSPORT"
log ""
log "  Backend log:   $HONCHO_LOGFILE"
log "  Client log:    $GRUNT_LOGFILE"
log ""
log "  Stop everything with:  ./scripts/dev/down.sh"
