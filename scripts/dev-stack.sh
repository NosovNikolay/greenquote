#!/usr/bin/env bash
# Dev: Postgres up (no migrate/seed), then API + Next with watch. Use after `pnpm reset` when DB is already migrated.
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/common-env.sh"
cd "$GREENQUOTE_ROOT"

ensure_postgres || exit 1

echo "Starting API (3001) and Next.js (3000) — no migrate/seed…"
exec pnpm exec concurrently -k -n api,web -c blue,green \
  "cd \"$GREENQUOTE_ROOT/backend\" && PORT=3001 JWT_SECRET=\"$JWT_SECRET\" DATABASE_URL=\"$DATABASE_URL\" pnpm run start:dev" \
  "cd \"$GREENQUOTE_ROOT/frontend\" && AUTH_SECRET=\"$AUTH_SECRET\" AUTH_URL=\"$AUTH_URL\" API_URL=\"$API_URL\" pnpm run dev"
