#!/usr/bin/env bash
# Full reset: Postgres up → migrate → seed → regenerate SDK → rebuild all packages.
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/common-env.sh"
cd "$GREENQUOTE_ROOT"

ensure_postgres || exit 1

bash "$GREENQUOTE_ROOT/scripts/workspace-build.sh"

echo "Reset complete. Start dev with: pnpm dev — or production-style stack with: pnpm prod"
