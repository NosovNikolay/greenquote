#!/usr/bin/env bash
# Frontend only (Next.js). Set API_URL if the Nest API runs elsewhere.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"
if [[ -z "${AUTH_SECRET:-}" ]]; then
  export AUTH_SECRET="dev-local-secret-change-in-production-min-32-chars"
fi
export AUTH_URL="${AUTH_URL:-http://localhost:3000}"
export API_URL="${API_URL:-}"
exec pnpm run dev
