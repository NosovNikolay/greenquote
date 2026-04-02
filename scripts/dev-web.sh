#!/usr/bin/env bash
# Frontend only (Next.js). Set API_URL if the Nest API runs elsewhere.
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/common-env.sh"
cd "$GREENQUOTE_ROOT/frontend"
export PORT="$WEB_PORT"
exec pnpm run dev
