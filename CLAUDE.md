# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Type checking and app/ingestion regression tests
pnpm run check
pnpm run verify:app

# Development server (API + frontend on same port via Vite SSR middleware)
pnpm run dev:local          # http://127.0.0.1:5173

# Production build (two outputs: dist/ for static, dist-server/ for Node server)
pnpm run build
pnpm run start              # serves dist/ + API on $HOST:$PORT

# Database
pnpm run db:generate        # regenerate Prisma client after schema changes
pnpm run db:push            # push schema to DB (no migration history)
pnpm run db:seed            # load generated seed data
pnpm run db:setup           # generate + push + seed + verify

# Data pipeline verification (run after any data/repository changes)
pnpm run verify:data-pipeline   # comprehensive: sources, generated files, repos, mappers, AI, debates
pnpm run verify:repositories    # seed + Prisma repository smoke checks
pnpm run verify:prisma-mappers  # domain ↔ Prisma enum/type mapping coverage
pnpm run verify:prisma-repository
pnpm run verify:ai-analysis

# Upsert additional historical data into DB
pnpm run db:upsert:all          # PRS + PDL + data.gov + debates + PM data
pnpm run db:upsert:pm           # PrimeMinisterProfile + LokSabhaPowerSnapshot only

# Regenerate generated TypeScript datasets (source-controlled)
pnpm run sync:sansad
pnpm run sync:prs
pnpm run sync:pdl-pre2004
```

Correctness is validated through `pnpm run check` (tsc), Node test-runner regression tests in `verify:app` / `verify:refresh`, and the remaining `verify:*` scripts. Use pnpm 10.12.1 and Node 22.

## Architecture

### Dual-mode server

In **development**, Vite serves both the React app and API routes. The `bharatZeroApiPlugin` in `vite.config.ts` intercepts `/api/*` requests and SSR-loads `src/lib/server/api/bharatzero-api.ts` on each request.

In **production**, `pnpm run build` emits two bundles:
- `dist/` — static frontend (Vite default build)
- `dist-server/server.js` — Node HTTP server SSR bundle (`vite build --ssr server.ts`)

`server.ts` handles `/api/health` itself and delegates all other `/api/*` to `handleBharatZeroApi`. Static assets in `dist/assets/` get `cache-control: immutable`.

### Repository abstraction

`src/lib/server/repositories/legislative.ts` exports `createLegislativeRepository({ mode })`:
- `mode: 'seed'` — reads from in-memory arrays imported from `src/lib/data/seed.ts` (populated from generated TypeScript files in `src/lib/data/generated/`)
- `mode: 'prisma'` — reads from PostgreSQL via the Prisma client

The API handler always uses `mode: 'prisma'`. The seed mode exists for offline/CI use without a DB. Domain types live in `src/lib/domain/types.ts`; `src/lib/server/repositories/prisma-mappers.ts` converts between Prisma enums and domain string literals.

### Path alias

`$lib` → `src/lib` (defined in both `tsconfig.json` paths and `vite.config.ts` resolve.alias). All imports inside `src/` use `$lib/...`.

### Data flow

```
Generated TS files (src/lib/data/generated/)
  → seed.ts (aggregates into arrays)
    → view-model.ts (seed-mode query/filter functions)
    → prisma/seed.ts (loads into PostgreSQL)

Scripts (scripts/sync-*.ts) → regenerate generated TS files
Scripts (scripts/upsert-*.ts) → upsert records directly into DB

API request → bharatzero-api.ts
  → parseDashboardFilters (domain/dashboard-filters.ts)
  → LegislativeRepository.getDashboardData()
  → shapeDashboardForClient() (trims large arrays before JSON response)
  → short-lived in-memory cache (20 s dashboard, 60 s bill detail, keyed on serialised filter string)
```

### In-memory caches

`bharatzero-api.ts` attaches caches to `globalThis` (prefixed `__bharatZero*`) so they survive Vite HMR module reloads. Dashboard TTL is 20 s; bill detail TTL is 60 s. Both use a deduplication map (`__bharatZeroDashboardRequests`) to coalesce concurrent identical requests.

### AI analysis

Provider is `gemma` (Gemini/OpenAI-compatible endpoint). `gemma-bill-analysis.ts` calls the Gemma API with prompt version `bill-analysis-v6-gdp-impact-rubric`. Results are persisted to the `AiBillAnalysis` table via `persistent-analysis-cache.ts`. `getServerEnv()` in `src/lib/server/env.ts` reads both `process.env` and `.env` / `.env.local` files for server-side env vars.

### Prisma

Client is generated into `src/generated/prisma/` (non-default location, set in `prisma/schema.prisma` generator block). Run `pnpm run db:generate` after any schema edit. `prisma.config.ts` at the repo root configures `tsx` as the migration engine runner.

### Known structural oddities

- SvelteKit route files remain in `src/routes/` but are vestigial — the actual app is `src/App.tsx` (React 19).
- Weekly ingestion imports individual Rajya Sabha questions from the newest two sessions; OGD catalog references remain separate metadata coverage.
- Node 22 is required for local and GitHub execution; the production build emits both client and Node server bundles.
