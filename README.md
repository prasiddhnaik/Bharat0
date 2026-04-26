# BharatZero

BharatZero is a first working prototype for an India-specific civic legislative explorer. It is visually inspired by the category of serious legislative intelligence dashboards: dark, compact, source-linked, timeline-driven, and filterable. It does not copy ChamberZero assets, source code, logos, private API behavior, or proprietary design files.

## What This Prototype Does

The current app lets you explore demo legislative activity through:

- `/?section=overview`
- `/?section=timeline&house=lok-sabha&date=2026-07-20`
- `/?section=bills&status=all`
- `/?section=bills&lang=hi`
- `/bills/[billId]`

The UI includes overview metrics, a sitting-day timeline rail, compact Bill cards, a Bill detail panel, committees, questions, debates, Acts, and a Sources section for future official ingestion.

## Demo Data Notice

All records in this prototype are visibly labeled as demo seed data. They are realistic fixtures for product development, not official live Parliament data and not public records. Source URLs point to official source families that BharatZero is prepared to ingest later; they are not claims that the exact demo record exists at that URL.

## How BharatZero Differs From ChamberZero

BharatZero borrows only the broad interaction idea of a clean, timeline-driven legislative explorer with section-based navigation. It is an original Indian implementation with its own data model, visual treatment, routing, components, and seed data.

It is also not a lazy U.S. Congress clone. India needs a different legislative model because Parliament is constituted by the President, Lok Sabha, and Rajya Sabha, and because Bill movement differs across ordinary Bills, Money Bills, financial legislation, committee processes, assent, publication, and lapse rules.

## India-Specific Legislative Model

The prototype is structured to model:

- Parliament of India as President + Lok Sabha + Rajya Sabha.
- Ordinary Bills that may originate in either House.
- Money Bills that originate in Lok Sabha and go to Rajya Sabha for recommendations within the constitutional window.
- President assent before enactment.
- Joint sittings as rare exception paths.
- Lok Sabha dissolution and Bill lapse rules as explicit future rule logic.
- Parliamentary sessions and sitting days.
- Ministries, committees, questions, debates, and Acts.
- India Code linkage after assent and publication.
- Future state-legislature support through NeVA and state sources.
- English and Hindi fields from the start.

## Tech Stack

- SvelteKit 2
- Svelte 5
- TypeScript with strict checking
- Tailwind CSS via the official Svelte add-on flow
- PostgreSQL-ready Prisma schema
- Server-side repository boundary for future database-backed reads
- Prisma-to-domain mappers for future PostgreSQL read models
- Typed demo seed data for the current UI

## Run Locally

```bash
npm install
npm run check
npm run build
npm run dev -- --open
```

The UI does not require a database yet. To prepare a local PostgreSQL database later, copy `.env.example` to `.env`, set `DATABASE_URL`, then use Prisma commands.

```bash
cp .env.example .env
npm run db:generate
npm run db:seed
```

## Project Structure

```text
src/lib/components/     Reusable shell, filter, timeline, Bill, and shared UI components
src/lib/data/           Typed demo seed data and view-model helpers
src/lib/domain/         India-specific types, labels, stage machine, and model notes
src/lib/ingestion/      Official-source adapter contracts without live scraping
src/lib/server/         Server-side repository boundary and database readiness metadata
src/routes/             SvelteKit routes for the dashboard and Bill detail page
prisma/schema.prisma    PostgreSQL-ready schema for future database-backed reads
prisma/seed.ts          Demo database seed script for future Prisma usage
```

## Current Limitations

- No scraping or official ingestion has been built yet.
- No authentication, payments, or user accounts.
- Server routes read through a seed-backed repository, not live Parliament data.
- The Prisma schema is ready for PostgreSQL, and a Prisma repository mode is contract-tested with an injected client, but the active app mode is still demo seed.
- Financial Bills are represented in the type system but not fully modeled in the UI stage machine.
- Hindi support currently covers the main shell, section navigation, filters, Bill titles, stage labels, House labels, and Bill detail labels. Longer narrative summaries remain English demo fixtures.

Verify the repository contract with:

```bash
npm run verify:repositories
npm run verify:prisma-mappers
npm run verify:prisma-repository
```

## Future Ingestion Roadmap

BharatZero is prepared for official source adapters, but they are intentionally out of scope for this first prototype.

Planned source families:

- `sansad.in` for unified Parliament surfaces.
- Lok Sabha official pages for Bills, agenda, questions, debates, and committees.
- Rajya Sabha official pages for Bills, items of business, questions, debates, and Money Bill recommendation tracking.
- India Code for Acts and final legal text linkage.
- `data.gov.in` for supplemental official datasets where available.
- eGazette for notifications and post-assent publication trail.
- NeVA for future State Assembly and State Council expansion.

The intended ingestion architecture is source capture first, normalization second, and UI read models third. That keeps official-source auditability separate from product presentation.

The current adapter contract pipeline is:

1. `source_capture`
2. `normalization`
3. `stage_resolution`
4. `read_model_publish`

You can verify that no live scraping adapter is registered with:

```bash
npm run verify:ingestion
```
