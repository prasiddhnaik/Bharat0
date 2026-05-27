# BharatZero

BharatZero is an India-focused legislative explorer for bills, Acts, Parliament timelines, House composition, Prime Minister terms, and public source coverage.

It combines generated public legislative datasets with a Prisma/PostgreSQL-backed data layer, then presents them through a fast Vite/React interface.

## What It Shows

- Bills moving through Parliament, with stage, house, ministry, and source context.
- Prime Minister term history with bill counts by Lok Sabha window.
- Lok Sabha and Rajya Sabha composition context.
- Parliament timeline events and sitting-day activity.
- Acts, debates, committees, and source coverage views.
- State and Union Territory governance status.
- Source links and badges for auditability.
- English/Hindi shell labels and bill title support.

## Data Coverage

Current generated datasets include:

- `4,708` bill records
- `7,268` bill action records
- `7,253` timeline events
- `2,560` sitting days
- `217` Act records
- `15` Prime Minister profile records
- `16` Lok Sabha power snapshots

Main source families:

- Sansad legislation data, as of `2026-04-25`
- PRS Legislative Research historical bill data, `1992-2019`
- Parliament Digital Library bill/proceeding data, `1947-2003`
- Curated Prime Minister profile data from PM India
- Curated Lok Sabha power snapshots from election/IPU-style summaries
- Bharat Maps / Survey of India state boundary data

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Node HTTP production server
- Prisma 7
- PostgreSQL, tested with Neon
- pnpm 10

## Run Locally

Prerequisites:

- Node.js 22.x
- pnpm 10.x
- PostgreSQL, or a hosted `DATABASE_URL`

Install dependencies:

```bash
pnpm install
```

Create local environment config:

```bash
cp .env.example .env
```

Generate the Prisma client:

```bash
pnpm run db:generate
```

Start the app:

```bash
pnpm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

## Useful Commands

```bash
pnpm run check
pnpm run build
pnpm run verify:production
```

For local PostgreSQL:

```bash
docker compose up -d
pnpm run db:push
pnpm run db:seed
pnpm run verify:db
```

## Deployment

The repository includes:

- `Dockerfile` for a Node host that serves the production frontend and API server.
- `vercel.json` for static Vercel frontend hosting with `/api/*` rewritten to an external API host.

Vercel should detect `pnpm-lock.yaml` and `packageManager: pnpm@10.12.1`, install with pnpm, then run:

```bash
pnpm run db:generate && pnpm run build
```

To check the linked Vercel project locally without deploying:

```bash
pnpm exec vercel pull --yes --environment=preview
pnpm exec vercel build

pnpm exec vercel pull --yes --environment=production
pnpm exec vercel build --prod
```

## Project Layout

```text
src/App.tsx                         Main React application
src/main.tsx                        React app entrypoint
src/lib/domain/                     Domain model, filters, localization, PM terms
src/lib/data/                       Generated datasets and seed-backed view model
src/lib/server/api/                 Node API route handler
src/lib/server/repositories/        Seed and Prisma repository implementations
src/lib/server/ai/                  AI analysis and persistent analysis cache
src/generated/prisma/               Generated Prisma client
prisma/schema.prisma                Database schema
prisma/seed.ts                      Seed loader
scripts/                            Sync, upsert, discovery, and verification scripts
server.ts                           Production static/API server
vercel.json                         Vercel static frontend config
Dockerfile                          Node production container
docker-compose.yml                  Local PostgreSQL service
```

## Notes

- Do not commit `.env`, `.env.local`, or real API keys.
- Generated data files are committed because they provide the app's offline/source-backed read data.
- The public frontend can run statically; API routes are served by the Node backend or rewritten to a deployed API host.
