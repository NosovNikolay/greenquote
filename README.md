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

## UI screenshots

Images are stored under [`frontend/static/`](frontend/static/).

### Login

![Login](frontend/static/login-page.png)

### Quote list

![Quote list](frontend/static/quote-list.png)

### Quote creation

![Quote creation](frontend/static/quote-creation-flow.png)

### Quote details

![Quote details](frontend/static/quote-details.png)

### Quote summary doc

![Quote summary PDF / document](frontend/static/quote-summary-doc.png)

### Admin panel

![Admin panel](frontend/static/admin-panel.png)

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

Set `API_URL` to `http://localhost:3001/api` when using the local Nest API. Without `API_URL`, `pnpm run setup` will fail when building the frontend.

### 3. Local setup (Postgres, migrate, seed, builds)

From the **repository root**, run:

```bash
pnpm run setup
```

This script:

- Starts Postgres (`docker compose` in `backend/`)
- Builds `@greenquote/constants` (the seed script imports it; required on a fresh clone before `dist/` exists)
- Runs Drizzle migrations and the seed script (seed is additive / idempotent where noted—it does **not** truncate or drop the database)
- Regenerates and builds `@greenquote/sdk`
- Builds backend and frontend (compile check)

Use this after cloning or when you need migrations, seed data, and fresh workspace builds. To fully discard local Postgres data, stop the container and remove its Docker volume, then run setup again.

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

`pnpm run dev` does **not** migrate or seed; run `pnpm run setup` first after clone (or when the schema or seed data is out of date).

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
| `pnpm run setup` | Postgres up, migrate, seed, generate SDK, build all packages |
| `pnpm run generate:sdk` | Regenerate SDK types from `openapi/openapi.yaml` |
| `pnpm run build:all` | Build constants + SDK generate + build SDK + build backend + build frontend |

Backend-specific scripts (`cd backend`): `pnpm run db:up`, `pnpm run db:migrate`, `pnpm run db:seed`, `pnpm test`, `pnpm run test:e2e`.

## Production readiness

The app is suitable for local development and demos. To run it **in production**, plan for at least the following.

### Packaging & dependencies

- **Published packages:** Today **`@greenquote/constants`** and **`@greenquote/sdk`** are consumed via **`workspace:*`** and built with the repo (`pnpm run build:all`). For production you would typically **publish semver’d packages** to a registry (npm org or private registry) and depend on versions instead of building workspace packages inside every deploy—clearer supply chain and faster CI when only app code changes.

### Containers & runtime

- **Docker for services:** Ship **production Dockerfiles** (multi-stage, non-root user) for the **Nest API** and **Next.js** app, plus **compose/Kubernetes manifests** or your cloud’s equivalent. The repo today only uses Docker for **local Postgres**; production should target **managed PostgreSQL** and wire health checks to **`/api/health`**.

### Data & search

- **Admin quote search:** The admin list uses **`ILIKE`** on name/email. For production scale and relevance, replace this with **PostgreSQL full-text search** (`tsvector` columns, GIN indexes, `websearch_to_tsquery` or similar) or a dedicated search index/service.

### Security & auth

- **JWT lifecycle:** Current access tokens are long-lived by configuration. Production should add **refresh tokens**, **rotation**, and a **revocation** story (server-side blocklist/session store or short-lived access + opaque refresh), and align **Auth.js** session policy with the API.

### CI/CD

- **Pipeline:** Add a **CI/CD pipeline** (e.g. **GitHub Actions**): install with **`pnpm install --frozen-lockfile`**, **lint**, **unit tests**, **`build:all`**, **API e2e** with a **Postgres service container**, then deploy to staging/production. Gate merges on required checks; store test artifacts as needed.

### Operations & quality (recommended)

- **Secrets:** Load from a **secret manager** in the cloud; avoid baking secrets into images; rotate credentials.
- **API edge:** **Rate limiting**, strict **CORS** for known web origins, request size limits.
- **Database:** Automated **backups**, migration rollback strategy, **connection pooling** (pooler or managed offering).
- **Observability:** **Metrics** and **tracing** (e.g. OpenTelemetry) with **alerting** on errors and latency; correlate request IDs across Next route handlers and Nest (Pino logs are a start).
- **Testing:** **Playwright** (or similar) for critical UI flows in CI; **dependency scanning** (Dependabot/Snyk); optional **load testing** on quote creation.

**Local defaults:** web [http://localhost:3000](http://localhost:3000), API [http://localhost:3001](http://localhost:3001) — see [Quick start](#quick-start).
