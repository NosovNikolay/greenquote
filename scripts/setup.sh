#!/usr/bin/env bash
# Local setup: Postgres up → migrate → seed → regenerate SDK → rebuild all packages.
# Does not wipe the database; it applies migrations and runs the seed script (which may skip if data already exists).
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/common-env.sh"
cd "$GREENQUOTE_ROOT"

ensure_postgres || exit 1

bash "$GREENQUOTE_ROOT/scripts/workspace-build.sh"

echo "Setup complete. Start dev with: pnpm dev — or production-style stack with: pnpm prod"
