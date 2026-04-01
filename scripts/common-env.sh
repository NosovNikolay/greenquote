#!/usr/bin/env bash
# Shared env + helpers for repo scripts (source this file, do not execute directly).
# shellcheck disable=SC2034

GREENQUOTE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export GREENQUOTE_ROOT

export AUTH_SECRET="${AUTH_SECRET:-dev-local-secret-change-in-production-min-32-chars}"
export AUTH_URL="${AUTH_URL:-http://localhost:3000}"
export API_URL="${API_URL:-http://localhost:3001/api}"
export JWT_SECRET="${JWT_SECRET:-dev-jwt-secret-min-32-chars-long!!}"
export DATABASE_URL="${DATABASE_URL:-postgresql://greenquote:greenquote@127.0.0.1:5433/greenquote}"

COMPOSE_FILE="${GREENQUOTE_ROOT}/backend/docker-compose.yml"
export COMPOSE_FILE

wait_for_postgres() {
  echo "Waiting for Postgres to accept connections…"
  local ready=0
  for ((i = 0; i < 60; i++)); do
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U greenquote -d greenquote >/dev/null 2>&1; then
      ready=1
      echo "Postgres is ready."
      break
    fi
    sleep 1
  done
  if [[ "$ready" != 1 ]]; then
    echo "error: Postgres did not become ready within 60s. Try: docker compose -f \"$COMPOSE_FILE\" logs postgres" >&2
    return 1
  fi
  return 0
}

ensure_postgres() {
  echo "Starting Postgres (docker compose)…"
  docker compose -f "$COMPOSE_FILE" up -d
  wait_for_postgres || return 1
}
