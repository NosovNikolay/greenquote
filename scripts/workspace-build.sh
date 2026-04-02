#!/usr/bin/env bash
# Migrate + seed + build constants, SDK, backend, frontend. Requires Postgres up and `pnpm install` at repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Building @greenquote/constants (required before db:seed imports it)…"
pnpm run build:constants

echo "Running migrations and seed…"
(
  cd "$ROOT/backend"
  pnpm run db:migrate
  pnpm run db:seed
) || {
  echo "error: db:migrate or db:seed failed." >&2
  exit 1
}
echo "Migrations and seed completed."

echo "Building workspace (constants, SDK, backend, frontend)…"
pnpm run build:all
