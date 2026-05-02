# BharatZero

BharatZero is an India-focused legislative explorer for bills, Acts, Parliament timelines, House power, Prime Minister terms, and official source coverage. It is built as a Vite/React frontend with a small Node API server, Prisma, and PostgreSQL/Neon.

The current app is no longer just a static prototype. It uses generated legislative datasets plus a Prisma-backed repository path for runtime data.

## Current Coverage

Generated local datasets currently include:

- `4,708` Bill records
- `7,268` Bill action records
- `7,253` timeline events
- `2,560` sitting days
- `217` Act records
- `15` Prime Minister profile records
- `16` Lok Sabha power snapshots

Main source families:

- Sansad legislation data, as of `2026-04-25`
- PRS historical bill data, `1992-2019`
- Parliament Digital Library bill/proceeding data, `1947-2003`
- Curated Prime Minister profile data from PM India
- Curated Lok Sabha power snapshots from ECI/IPU-style election summaries

The PDL sync now covers older Prime Ministers, including Nehru, Shastri, Nanda, and Indira Gandhi-era windows where source records exist.

## Features

- Overview, Houses, Timeline, Bills, Committees, Debates, Acts, and Sources tabs.
- Left-side Prime Minister history panel with bill counts per PM term.
- Houses tab with PM-term-specific Lok Sabha power charts and Rajya Sabha context.
- Prime Minister profile panel with source links.
- Bill list, bill detail, local fallback analysis, and optional AI analysis.
- Source badges on records for auditability.
- English/Hindi shell labels and bill title support.
- Section URLs preserve the selected PM term when switching tabs.
- API payload shaping and short-lived dashboard/detail caches to avoid sending huge arrays to the client.

## Tech Stack

- React 19
- Vite
- TypeScript
- SvelteKit route files still exist for the server/build integration
- Tailwind CSS
- Node HTTP production server
- Prisma 7
- PostgreSQL, tested with Neon
- Optional Groq or NVIDIA-compatible AI analysis provider

## Repository Layout

```text
src/App.tsx                         Main React application and UI sections
src/main.tsx                        React app entrypoint
src/routes/                         SvelteKit route shell and legacy/server route files
src/routes/layout.css               Global design tokens and Tailwind layer
src/lib/domain/                     Domain model, filters, localization, PM terms, House power
src/lib/data/                       Generated datasets and seed-backed view model
src/lib/data/generated/             Sansad, PRS, and PDL generated legislation files
src/lib/server/api/                 Node API route handler
src/lib/server/repositories/        Seed and Prisma repository implementations
src/lib/server/ai/                  AI analysis, source text, and persistent analysis cache
src/lib/ingestion/                  Source adapter contracts and discovery metadata parsing
src/generated/prisma/               Generated Prisma client
prisma/schema.prisma                Database schema
prisma/seed.ts                      Loads generated seed data into PostgreSQL
scripts/                            Sync, upsert, discovery, and verification scripts
server.ts                           Production static/API server
vercel.json                         Vercel static frontend config with API rewrite
Dockerfile                          Node production container
docker-compose.yml                  Local PostgreSQL service
```

## Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Important variables:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
HOST="127.0.0.1"
PORT="5173"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.3-70b-versatile"
NVIDIA_API_KEY=""
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL="meta/llama-3.3-70b-instruct"
AI_ANALYSIS_PROVIDER="groq"
```

Never commit `.env`, `.env.local`, or real API keys.

## Local Development

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run db:generate
```

Start the development server:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

## Local PostgreSQL

Start local Postgres:

```bash
docker compose up -d
```

Push the schema and seed data:

```bash
npm run db:push
npm run db:seed
```

Verify database access:

```bash
npm run verify:db
```

## Neon PostgreSQL

Set `DATABASE_URL` to the Neon connection string, then run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Load additional generated historical data:

```bash
npm run db:upsert:prs
npm run db:upsert:pdl-pre2004
npx tsx scripts/upsert-prime-minister-data.ts
```

The PM data upsert writes:

- `PrimeMinisterProfile`
- `LokSabhaPowerSnapshot`

The PDL upsert replaces prior `pdl-*` records before inserting the regenerated historical slice.

## Data Sync Scripts

Regenerate generated datasets:

```bash
npm run sync:sansad
npm run sync:prs
npm run sync:pdl-pre2004
```

The PDL script currently searches Parliament Digital Library from `1947-2003` and emits:

```text
src/lib/data/generated/pdl-pre2004-legislation.ts
```

The generated files are source-controlled because they are the app's offline/source-backed read data.

## API Routes

The production Node server and dev API handler expose:

```text
GET /api/health
GET /api/dashboard?...filters
GET /api/bills/:billId
GET /api/bills/:billId/ai-analysis?lang=en
GET /api/prime-ministers
GET /api/prime-ministers/:termId
GET /api/houses/power?pm=:termId
GET /api/sources
```

Common dashboard filters:

```text
section=overview|houses|timeline|bills|committees|questions|debates|acts|sources
lang=en|hi
house=all|lok-sabha|rajya-sabha
pm=all|nehru|lal-bahadur-shastri|modi-2|...
date=YYYY-MM-DD
status=all|introduced|passed_origin_house|...
area=all|Ministry of Finance|...
source=all|source-pdl|source-prs|source-sansad|...
page=1
pageSize=60
```

Example:

```bash
curl "http://127.0.0.1:5173/api/dashboard?section=houses&lang=en&pm=nehru&page=1&pageSize=60"
curl "http://127.0.0.1:5173/api/houses/power?pm=vajpayee-2"
curl "http://127.0.0.1:5173/api/prime-ministers/nehru"
```

## Verification

Core checks:

```bash
npm run check
npm run verify:repositories
npm run verify:prisma-mappers
npm run verify:prisma-repository
npm run verify:timeline
npm run verify:localization
```

Data/API checks:

```bash
npx tsx scripts/verify-pm-data-api.ts
npx tsx scripts/verify-prime-minister-data-db.ts
npx tsx scripts/verify-prime-minister-profiles.ts
npx tsx scripts/verify-house-power.ts
npx tsx scripts/verify-navigation-links.ts
npx tsx scripts/verify-older-prime-minister-coverage.ts
```

Source discovery checks:

```bash
npm run discover:sources
npm run verify:source-discovery
npm run verify:ingestion
```

Production smoke check:

```bash
npm run verify:production
```

## Production Build

Build:

```bash
npm run build
```

Run production server:

```bash
HOST=127.0.0.1 PORT=5174 npm run start
```

Health check:

```bash
curl http://127.0.0.1:5174/api/health
```

## Deployment Notes

The repo includes two deployment paths:

- `Dockerfile` for a Node host that can run the production server.
- `vercel.json` for a static Vercel frontend with `/api/*` rewritten to an external API host.

For a single full-stack Node deployment:

```text
Build command: npm ci && npm run db:generate && npm run build
Start command: npm run start
Health path: /api/health
```

For Vercel static hosting:

```text
Build command: npm run db:generate && npm run build
Output directory: dist
API rewrite: configured in vercel.json
```

If the API backend URL changes, update the `/api/:path*` rewrite in `vercel.json`.

## Data Model

Primary database tables:

- `Bill`
- `BillAction`
- `SittingDay`
- `TimelineEvent`
- `Committee`
- `Question`
- `Act`
- `AiBillAnalysis`
- `BillSourceText`
- `PrimeMinisterProfile`
- `LokSabhaPowerSnapshot`

The Prisma repository filters bills by:

- House
- Bill stage
- Ministry/policy area
- Source family
- Prime Minister date window
- Search query
- Pagination

The Houses tab intentionally hides policy-area and bill-stage filters because that view is about PM-term House power, not bill list narrowing.

## Source Strategy

BharatZero keeps source discovery, normalization, and read models separate:

1. `source_capture`
2. `normalization`
3. `stage_resolution`
4. `read_model_publish`

Prepared/current source contracts:

- Sansad portal
- PRS Legislative Research
- Parliament Digital Library
- data.gov.in catalog discovery

Planned source adapters:

- Lok Sabha official pages
- Rajya Sabha official pages
- India Code
- eGazette
- NeVA

## Known Limits

- PDL historical records are proceeding-derived; some entries are bill mentions, continuing debate records, returned-message records, or committee/report references rather than clean official bill master rows.
- Some short acting PM windows can still show zero if no source record falls inside the exact term dates.
- `questions` currently has schema and UI support, but generated question rows are not yet populated.
- Svelte route files remain in the repo, while the primary app surface is the React app in `src/App.tsx`.
- AI analysis is optional and depends on server-only provider keys.

## Useful URLs

```text
/?section=overview&lang=en
/?section=houses&lang=en&pm=nehru
/?section=bills&lang=en&page=1&pageSize=60
/?section=timeline&lang=en
/?section=sources&lang=en
```
