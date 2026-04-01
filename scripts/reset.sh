#!/usr/bin/env bash
# Full reset: Postgres up → migrate → seed → regenerate SDK → rebuild all packages.
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/common-env.sh"
cd "$GREENQUOTE_ROOT"

ensure_postgres || exit 1

echo "Running migrations and seed…"
(
  cd "$GREENQUOTE_ROOT/backend"
  pnpm run db:migrate
  pnpm run db:seed
) || {
  echo "error: db:migrate or db:seed failed." >&2
  exit 1
}
echo "Migrations and seed completed."

echo "Generating and building SDK…"
pnpm run generate:sdk
pnpm run build:sdk

echo "Building backend…"
pnpm run build:backend

echo "Building frontend…"
pnpm run build:frontend

echo "Reset complete. Start dev with: pnpm dev"
