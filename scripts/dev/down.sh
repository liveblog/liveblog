#!/usr/bin/env bash
#
# Stop the local Liveblog dev stack started by up.sh: the client dev server,
# the backend (honcho and its children), and the Docker backing services.
#
# Idempotent and always exits 0 — running it on an already-stopped stack is
# fine. By default your data is preserved (it lives in bind mounts under
# data/). Pass --wipe-data for a full reset.
#
# Usage:
#   ./scripts/dev/down.sh              # stop everything, keep data
#   ./scripts/dev/down.sh --wipe-data  # ALSO delete all local DB/ES/Redis data

set -uo pipefail

WIPE_DATA=false
for arg in "$@"; do
    case "$arg" in
        --wipe-data) WIPE_DATA=true ;;
        *) echo "unknown argument: $arg" >&2; exit 2 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker/docker-compose-dev-services.yml"
DATA_DIR="$REPO_ROOT/data"
RUN_DIR="$SCRIPT_DIR/.run"
HONCHO_PIDFILE="$RUN_DIR/honcho.pid"
GRUNT_PIDFILE="$RUN_DIR/grunt.pid"
SETUP_SENTINEL="$RUN_DIR/.setup-done"

# Resolve PORT identically to up.sh, so the port-based fallback never touches
# macOS's AirPlay listener on :5000 unless the user explicitly forced it.
if [ -n "${PORT:-}" ]; then
    :
elif [ "$(uname -s)" = "Darwin" ]; then
    PORT=5001
else
    PORT=5000
fi
WSPORT="${WSPORT:-5100}"

# Used only to scope the celery-straggler sweep to this project's virtualenv,
# so we never kill an unrelated celery worker on the same machine.
LIVEBLOG_VENV="${LIVEBLOG_VENV:-liveblog}"

log() { printf '\n[liveblog-down] %s\n' "$*"; }

# Kill whatever is listening on a port (best effort).
kill_port() {
    local port="$1" name="$2"
    command -v lsof > /dev/null || return 0
    local pids
    pids=$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null) || return 0
    [ -n "$pids" ] || return 0
    log "stopping $name on :$port (PID(s): $pids)"
    kill $pids 2>/dev/null || true
}

# Kill a process (and its group) from a pidfile, then remove the file.
kill_pidfile() {
    local pidfile="$1" name="$2"
    [ -f "$pidfile" ] || return 0
    local pid
    pid="$(cat "$pidfile" 2>/dev/null)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        log "stopping $name (PID: $pid)"
        kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
}

# 1. Client dev server.
kill_pidfile "$GRUNT_PIDFILE" "client dev server"
kill_port 9000 "client"

# 2. Backend. Killing honcho signals its children (gunicorn, ws, celery
#    worker + beat); give it a moment to shut Celery down cleanly, then sweep
#    the API/websocket ports and any straggler celery processes by name.
kill_pidfile "$HONCHO_PIDFILE" "backend (honcho)"
sleep 2
kill_port "$PORT" "API"
kill_port "$WSPORT" "websocket"

# Celery workers hold no listening port, so a port sweep can miss them.
# Backstop: kill leftover celery workers, but scoped to this project's
# virtualenv path so an unrelated celery worker on the same machine (another
# project also using `celery -A worker`) is never touched.
if command -v pkill > /dev/null; then
    if pkill -f "envs/${LIVEBLOG_VENV}/bin/.*celery -A worker" 2>/dev/null; then
        log "stopped leftover celery worker/beat processes"
    fi
fi

# 3. Backing services (data survives — it lives in data/ bind mounts).
if [ -f "$COMPOSE_FILE" ]; then
    log "stopping backing services (data is preserved)"
    docker compose -f "$COMPOSE_FILE" stop
else
    log "$COMPOSE_FILE not found; nothing to stop for Docker"
fi

# 4. Optional data wipe.
if [ "$WIPE_DATA" = true ]; then
    log "--wipe-data: this deletes ALL local database, Elasticsearch, and Redis"
    log "  state under $DATA_DIR and forces setup.sh to re-init on next run."
    # The containers write these bind mounts as root, so a plain rm may hit
    # permission errors. Try directly, then fall back to a throwaway
    # container that deletes the contents from inside Docker.
    if [ -d "$DATA_DIR" ]; then
        if ! rm -rf "$DATA_DIR"/* "$DATA_DIR"/.[!.]* 2>/dev/null; then
            log "  some files are root-owned; removing them via a Docker container"
            docker run --rm -v "$DATA_DIR:/data" alpine sh -c 'rm -rf /data/* /data/.[!.]*' \
                || log "  WARNING: could not fully wipe $DATA_DIR — remove it manually if needed"
        fi
    fi
    rm -f "$SETUP_SENTINEL"
    log "data wiped — the next ./scripts/dev/setup.sh will re-initialise the DB"
fi

log "stack stopped"
log ""
log "  Note: Docker itself is still running. The backing services are"
log "  stopped, but if you want to fully free resources, quit Docker Desktop"
log "  (or 'docker compose -f docker/docker-compose-dev-services.yml down')."

exit 0
