# Green Quote

A **solar panel quote and financing calculator** monorepo: users submit installation and consumption details, the API runs pricing and risk logic, and the UI shows terms, APR, payments, and amortization. An admin area lists and inspects quotes across customers.

## What’s in the repo

| Area | Role |
|------|------|
| **`frontend/`** | [Next.js](https://nextjs.org/) App Router UI, [Tailwind CSS](https://tailwindcss.com/), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/), [Auth.js](https://authjs.dev/) (NextAuth v5) for sessions |
| **`backend/`** | [NestJS](https://nestjs.com/) HTTP API, [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL, JWT auth, [Pino](https://getpino.io/) logging |
| **`packages/sdk/`** | Typed API client generated from `openapi/openapi.yaml` ([openapi-typescript](https://github.com/drwpow/openapi-typescript) + [openapi-fetch](https://github.com/drwpow/openapi-fetch)) |
| **`openapi/`** | OpenAPI spec shared by backend and SDK generation |
| **`packages/constants/`** | Shared constants (e.g. pricing) used by API and UI |

## Prerequisites

- **Node.js** 20+ (see package engines if pinned elsewhere)
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9.15.9 --activate` or install per [pnpm.io](https://pnpm.io/installation))
- **Docker** (for PostgreSQL via `backend/docker-compose.yml`; host port **5433** → container 5432 to avoid clashing with a local Postgres on 5432)

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

**Backend** — copy and edit:

```bash
cp backend/.env.example backend/.env
```

Ensure `DATABASE_URL` matches Docker (`127.0.0.1:5433` by default) or your own Postgres.

**Frontend** — copy and set `AUTH_SECRET` and **`API_URL`** (required at build time by `next.config.ts`):

```bash
cp frontend/.env.example frontend/.env.local
# Or use `frontend/.env` — Next loads `.env*` from `frontend/`.
# Generate AUTH_SECRET: openssl rand -base64 32
```

Set `API_URL` to `http://localhost:3001/api` when using the local Nest API. Without `API_URL`, `pnpm run reset` will fail when building the frontend.

### 3. Full reset (database + SDK + builds)

From the **repository root**, run:

```bash
pnpm run reset
```

This script:

- Starts Postgres (`docker compose` in `backend/`)
- Runs Drizzle migrations and seeds the database
- Regenerates and builds `@greenquote/sdk`
- Builds backend and frontend (compile check)

Use this after cloning or when you need a clean DB and fresh artifacts.

### 4. Production-style local stack (full setup + prod servers)

From the **repository root**, after `pnpm install` and env files (same as above):

```bash
pnpm run prod
```

This runs **`scripts/prod-stack.sh`**: starts Postgres, migrates, seeds, runs `build:all`, then starts the **Nest** process (`node dist/src/main.js`, no watch) and **Next.js** (`next start`, no React dev overlay). Defaults for `DATABASE_URL`, `JWT_SECRET`, `AUTH_SECRET`, and `API_URL` come from `scripts/common-env.sh` if you have not set `backend/.env` / `frontend/.env.local`.

### 5. Development servers

```bash
pnpm run dev
```

Starts:

- **API** on [http://localhost:3001](http://localhost:3001) (Nest watch; health check at `/health`)
- **Next.js** on [http://localhost:3000](http://localhost:3000) by default (set **`WEB_PORT`** to use another port)

`pnpm run dev` does **not** migrate or seed; use `pnpm run reset` first (or when the schema/data is out of date).

**Frontend only** (API already running elsewhere):

```bash
pnpm run dev:web
```

**Before you submit:** use the pre-submission checklist and testing plan in [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md).

## Useful scripts (root `package.json`)

| Script | Purpose |
|--------|---------|
| `pnpm run dev` | Postgres up + Nest `start:dev` + Next `dev` |
| `pnpm run prod` | Postgres up → migrate → seed → `build:all` → Nest + Next in **production** mode |
| `pnpm run reset` | Migrate, seed, generate SDK, build all packages |
| `pnpm run generate:sdk` | Regenerate SDK types from `openapi/openapi.yaml` |
| `pnpm run build:all` | Build constants + SDK generate + build SDK + build backend + build frontend |

Backend-specific scripts (`cd backend`): `pnpm run db:up`, `pnpm run db:migrate`, `pnpm run db:seed`, `pnpm test`, `pnpm run test:e2e`.

## Design notes

### Why this stack and architecture? What trade-offs?

- **pnpm workspace** — one lockfile, fast installs, shared `@greenquote/sdk` without publishing; clear boundary between UI and API.
- **Next.js + NestJS** — separates SSR/BFF concerns from domain and persistence; the API can be scaled or deployed independently and keeps business rules out of the edge bundle.
- **Drizzle + PostgreSQL** — SQL-first migrations and typed queries without a heavy codegen step; good fit for a small, explicit schema.
- **OpenAPI → TypeScript SDK** — single source of truth for request/response shapes; reduces drift between frontend and backend compared to hand-written DTOs on both sides.
- **Trade-offs** — more moving parts than a single Next.js app with server actions only; e2e tests require a running DB. The BFF pattern (Next calling Nest) adds a network hop locally but mirrors production and keeps auth/session logic clear.

### If you had another day, what would you add or change first?

Priorities would likely be: **GitHub Actions** (lint, typecheck, unit + e2e against Postgres service), **Playwright or expanded API e2e** for critical user journeys through the UI, and **observability** (structured logs already; add metrics/tracing IDs end-to-end). Secondary: rate limiting and admin audit logs for quote access.

### How would you implement CI/CD and what would you test?

- **On every PR / push to main:** `pnpm install --frozen-lockfile`, **ESLint** (frontend + backend as configured), **TypeScript** `tsc --noEmit` or `next build` / `nest build` in CI, **unit tests** (`jest` in `backend/test/unit/**/*.spec.ts`).
- **Integration / e2e:** run **Postgres** as a service container, set `DATABASE_URL`, run **Drizzle migrate**, then **Jest e2e** (`backend/test/e2e/*.e2e-spec.ts`) against the Nest app (Supertest).
- **Optional nightly or pre-release:** full `pnpm run build:all`, and **smoke** against a deployed staging URL.

Artifacts: test reports and coverage uploaded; block merge on required checks.

### Where would you deploy on GCP and why?

- **Cloud Run** is a strong default: containerize Nest and Next (or Next standalone + API as two services), scale to zero for low traffic, HTTPS and IAM integration, simple rollouts. Fits this stack without operating Kubernetes.
- **GKE** if you later need DaemonSets, custom networking, or multi-tenant clusters at scale — usually overkill for this app initially.
- **App Engine** (standard) is viable for Node but is more opinionated and less portable than containers; **Cloud Run** stays the usual pick for HTTP APIs and Next on GCP unless you have specific App Engine constraints.

Data: **Cloud SQL for PostgreSQL** (private IP + connector from Cloud Run), secrets in **Secret Manager**.

### How did you approach testing, and what would you add for production readiness?

- **Unit tests** in Nest (`backend/test/unit/**/*.spec.ts`) for pricing, quote service behavior, money helpers, and storage mapping.
- **API e2e** (Jest + Supertest) for happy paths and error/validation behavior against a real Postgres schema.

**Production readiness additions:** staged migrations with backups, **health/readiness** probes (already have `/health` conceptually — wire in orchestrator), **secrets rotation**, **CORS and rate limits**, **dependency scanning** (Dependabot/Snyk), **SLOs** and alerting on error rate and latency, and **load testing** on quote creation under concurrency.

---

## Evaluation (project requirements)

| Criterion | Notes |
|-----------|--------|
| **1. Correctness** | Core flow: quote inputs → persisted quote + deterministic pricing/result payload; validation at DTO and API layers. Edge cases covered incrementally in tests. |
| **2. Documentation** | This README describes setup, scripts, and intent; **prefer clear commits and OpenAPI** over long inline comments in application code. |
| **3. Testing** | Mix of **unit** (services, utils, filters) and **API e2e** (lifecycle, errors); expand UI e2e if product scope grows. |
| **4. Readability** | Nest modules by domain (`quotes`, auth), shared types for quote results, SDK for API shapes; avoid duplicating validation between client and server where Zod/DTOs align. |
| **5. Application architecture** | Conventional **Nest** modular structure, **Next** app routes + route handlers proxying to API, **Drizzle** repositories; boundaries: UI ↔ SDK ↔ HTTP ↔ services ↔ DB. |

---

## Live demo (optional)

If a public deployment exists, link it here. Local development uses `http://localhost:3000` and `http://localhost:3001` as above.
