#!/usr/bin/env bash
# Full local "production" stack: Postgres → migrate → seed → build everything → Nest (node) + Next (next start).
# No dev overlay; use after `pnpm install`. Env defaults: scripts/common-env.sh (override with backend/.env, frontend/.env.local, or exports).
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/common-env.sh"
cd "$GREENQUOTE_ROOT"

ensure_postgres || exit 1

bash "$GREENQUOTE_ROOT/scripts/workspace-build.sh"

echo ""
echo "Starting API (production, port 3001) and Next.js (production, port ${WEB_PORT})…"
echo "Open ${AUTH_URL} — stop with Ctrl+C."
echo "Port in use? See README (troubleshooting) or run: WEB_PORT=3002 AUTH_URL=http://localhost:3002 pnpm prod"
echo ""
exec pnpm exec concurrently -k -n api,web -c blue,green \
  "cd \"$GREENQUOTE_ROOT/backend\" && NODE_ENV=production PORT=3001 JWT_SECRET=\"$JWT_SECRET\" DATABASE_URL=\"$DATABASE_URL\" pnpm run start:prod" \
  "cd \"$GREENQUOTE_ROOT/frontend\" && NODE_ENV=production PORT=\"$WEB_PORT\" AUTH_SECRET=\"$AUTH_SECRET\" AUTH_URL=\"$AUTH_URL\" API_URL=\"$API_URL\" pnpm run start"
