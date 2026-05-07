# BharatZero Developer Guide

Complete guide for developing, testing, and deploying BharatZero.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Scripts Reference](#scripts-reference)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 22.x
- npm 10.x
- PostgreSQL 15+ (or Docker for local PostgreSQL)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bharatzero

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev -- --host 127.0.0.1 --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173)

### Local PostgreSQL Setup

```bash
# Start PostgreSQL container
docker compose up -d

# Push schema and seed data
npm run db:push
npm run db:seed

# Verify database
npm run verify:db
```

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `HOST` | No | Server bind address | `127.0.0.1` |
| `PORT` | No | Server port | `5173` |
| `GEMMA_API_KEY` | No | Gemma 4 / Gemini API key (alias: `GEMINI_API_KEY`) | `AIza...` |
| `GEMMA_MODEL` | No | Gemma model | `gemma-4-31b-it` |
| `GEMMA_BASE_URL` | No | Gemini OpenAI-compatible endpoint | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `AI_ANALYSIS_PROVIDER` | No | AI provider (only `gemma` supported) | `gemma` |

---

## Development Workflow

### Standard Development Cycle

```mermaid
graph LR
    A[Code Changes] --> B[Type Check]
    B --> C{Pass?}
    C -->|No| D[Fix Errors]
    D --> B
    C -->|Yes| E[Run Verification]
    E --> F{Pass?}
    F -->|No| G[Fix Issues]
    G --> E
    F -->|Yes| H[Build]
    H --> I{Pass?}
    I -->|No| J[Fix Build]
    J --> H
    I -->|Yes| K[Commit]
```

### Step-by-Step Workflow

```bash
# 1. Make code changes
# ... edit files ...

# 2. Type check
npm run check

# 3. Quick verification (sources + generated + repos + mappers + AI)
npm run verify:quick

# State governance static map/list verifier
npm run verify:state-governance

# 4. Build
npm run build

# 5. Verify production build
npm run verify:production

# 6. Commit
git add .
git commit -m "feat: your changes"
```

### Pre-Commit Checklist

- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `npm run verify:quick` passes
- [ ] `npm run verify:state-governance` passes when touching States tab data, map, palette, or methodology
- [ ] Code follows project conventions
- [ ] No `console.log` statements (except in scripts)
- [ ] Environment variables are not hardcoded

---

## Project Structure

```
bharatzero/
├── src/
│   ├── App.tsx                    # Main React application
│   ├── main.tsx                   # React entry point
│   ├── app.d.ts                   # App-level type declarations
│   ├── vite-env.d.ts              # Vite environment types
│   ├── routes/                    # SvelteKit route shell
│   │   ├── +page.server.ts       # Server-side data loading
│   │   └── bills/[billId]/        # Bill detail routes
│   └── lib/
│       ├── index.ts               # Library exports
│       ├── domain/                # Domain models & logic
│       │   ├── types.ts          # Core type definitions
│       │   ├── dashboard-filters.ts
│       │   ├── prime-ministers.ts
│       │   ├── prime-minister-profiles.ts
│       │   ├── parliament-houses.ts
│       │   ├── timeline-view.ts
│       │   ├── bill-stage-machine.ts
│       │   ├── indian-legislature.ts
│       │   ├── economic-impact.ts
│       │   ├── party-positions.ts
│       │   ├── source-filters.ts
│       │   ├── navigation-links.ts
│       │   ├── state-governance.ts
│       │   └── localization.ts
│       ├── assets/                # Self-hosted browser assets
│       │   └── india-state-boundaries.ts
│       ├── components/            # Feature and shared UI
│       │   ├── bills/
│       │   ├── filters/
│       │   ├── shell/
│       │   ├── states/            # States tab and methodology
│       │   └── timeline/
│       ├── data/                  # Data layer
│       │   ├── view-model.ts      # View model types
│       │   ├── seed.ts            # Seed data loader
│       │   ├── manual-debates.ts  # Manual debate data
│       │   └── generated/         # Generated datasets
│       │       ├── sansad-legislation.ts
│       │       ├── prs-legislation.ts
│       │       ├── pdl-pre2004-legislation.ts
│       │       └── data-gov-questions.ts
│       ├── server/                # Backend code
│       │   ├── api/
│       │   │   └── bharatzero-api.ts
│       │   ├── repositories/
│       │   │   ├── legislative.ts
│       │   │   └── prisma-mappers.ts
│       │   ├── ai/
│       │   │   ├── gemma-bill-analysis.ts
│       │   │   ├── persistent-analysis-cache.ts
│       │   │   └── source-text.ts
│       │   ├── db/
│       │   │   └── prisma.ts
│       │   └── env.ts
│       └── ingestion/             # Data ingestion
│           ├── source-adapters.ts
│           ├── source-discovery.ts
│           └── source-metadata.ts
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Database seed script
├── scripts/                       # Sync and verification scripts
│   ├── sync-*.ts                  # Data sync scripts
│   ├── upsert-*.ts                # Data upsert scripts
│   └── verify-*.ts                # Verification scripts
├── docs/                          # Documentation
├── server.ts                      # Production HTTP server
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json                    # Vercel deployment config
├── Dockerfile                     # Docker production build
└── docker-compose.yml             # Local PostgreSQL
```

---

## Coding Standards

### TypeScript Conventions

1. **Use explicit types:**
   ```typescript
   // Good
   function getBill(id: string): Promise<Bill | null> {
     // ...
   }

   // Avoid
   function getBill(id) {
     // ...
   }
   ```

2. **Prefer interfaces for object shapes:**
   ```typescript
   interface Bill {
     id: string;
     title: string;
   }
   ```

3. **Use const assertions for literals:**
   ```typescript
   export const SECTIONS = [
     'overview',
     'bills',
     // ...
   ] as const;
   ```

4. **Type guard functions:**
   ```typescript
   function isValidHouse(value: string): value is House {
     return HOUSES.includes(value as House);
   }
   ```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables/functions | camelCase | `getBillDetail`, `billCount` |
| Types/interfaces | PascalCase | `Bill`, `DashboardData` |
| Enums | PascalCase | `BillStage`, `House` |
| Enum values | UPPER_SNAKE_CASE | `LOK_SABHA`, `INTRODUCED` |
| Constants | camelCase or UPPER_SNAKE | `PRIME_MINISTER_TERMS` |
| File names | kebab-case | `dashboard-filters.ts` |

### Import Organization

```typescript
// 1. Node built-ins
import type { IncomingMessage } from 'node:http';

// 2. External dependencies
import { PrismaClient } from '@prisma/client';

// 3. Internal imports (grouped by path depth)
import type { Bill } from '$lib/domain/types';
import { parseFilters } from '$lib/domain/dashboard-filters';
import { createClient } from '$lib/server/db/prisma';
```

### Error Handling

```typescript
// Use try/catch for async operations
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw new Error(`Data fetch failed: ${(error as Error).message}`);
}

// Type guard for error handling
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}
```

---

## Testing

### Verification Tests

The project uses verification scripts instead of traditional unit tests:

```bash
# Type checking
npm run check

# Repository tests
npm run verify:repositories
npm run verify:prisma-repository

# Data pipeline tests
npm run verify:data-pipeline

# States tab static data, map parity, and freshness
npm run verify:state-governance

# Full test suite
npm run verify:full
```

### Writing Verification Scripts

Template for new verification scripts:

```typescript
#!/usr/bin/env tsx
// scripts/verify-feature.ts

import { createPrismaClient } from '../src/lib/server/db/prisma';

interface VerificationResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
}

async function verifyFeature(): Promise<VerificationResult> {
  const prisma = createPrismaClient();
  const checks = [];

  try {
    // Check 1: Database connectivity
    const billCount = await prisma.bill.count();
    checks.push({
      name: 'Database connectivity',
      passed: billCount >= 0,
      message: `Found ${billCount} bills`
    });

    // Check 2: Data integrity
    const billsWithActions = await prisma.bill.count({
      where: { actions: { some: {} } }
    });
    checks.push({
      name: 'Bills with actions',
      passed: billsWithActions > 0,
      message: `${billsWithActions} bills have actions`
    });

    // ... more checks

    return {
      passed: checks.every(c => c.passed),
      checks
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('Running verification...\n');
  const result = await verifyFeature();

  for (const check of result.checks) {
    const status = check.passed ? '✓' : '✗';
    console.log(`${status} ${check.name}`);
    if (check.message) {
      console.log(`  ${check.message}`);
    }
  }

  console.log(`\n${result.passed ? 'All checks passed!' : 'Some checks failed.'}`);
  process.exit(result.passed ? 0 : 1);
}

main();
```

### Manual Testing

```bash
# Test API endpoints
curl http://127.0.0.1:5173/api/health
curl "http://127.0.0.1:5173/api/dashboard?section=overview"

# Test with filters
curl "http://127.0.0.1:5173/api/dashboard?section=bills&pm=nehru&page=1"

# Test AI analysis (requires API key)
curl "http://127.0.0.1:5173/api/bills/{bill-id}/ai-analysis?lang=en"

# Test States tab in browser
# http://127.0.0.1:5173/?section=states&lang=en
# http://127.0.0.1:5173/methodology
```

---

## Scripts Reference

### Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:local` | Dev server on 127.0.0.1:5173 |
| `npm run check` | TypeScript type checking |
| `npm run check:watch` | Type checking in watch mode |

### Build

| Script | Description |
|--------|-------------|
| `npm run build` | Build for production (frontend + SSR) |
| `npm run preview` | Preview production build |
| `npm run start` | Run production server |
| `npm run start:local` | Build and run locally |

### Database

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:deploy` | Generate + push |
| `npm run db:seed` | Seed with demo data |
| `npm run db:setup` | Full setup (generate + push + seed + verify) |

### Data Sync

| Script | Description |
|--------|-------------|
| `npm run sync:all` | Sync all sources |
| `npm run sync:sansad` | Sync Sansad legislation |
| `npm run sync:prs` | Sync PRS data |
| `npm run sync:pdl-pre2004` | Sync PDL pre-2004 |
| `npm run sync:data-gov` | Sync data.gov.in |
| `npm run discover:sources` | Discover source catalogs |
| `npm run discover:sources:write` | Discover and write results |

### Data Upsert

| Script | Description |
|--------|-------------|
| `npm run db:upsert:all` | Upsert all data sources |
| `npm run db:upsert:all:dry-run` | Preview all upserts |
| `npm run db:upsert:prs` | Upsert PRS legislation |
| `npm run db:upsert:pdl-pre2004` | Upsert PDL legislation |
| `npm run db:upsert:data-gov` | Upsert data.gov questions |
| `npm run db:upsert:debates` | Upsert debates |
| `npm run db:upsert:pm` | Upsert PM data |

### Verification

| Script | Description |
|--------|-------------|
| `npm run verify:quick` | Quick verification (core pipeline) |
| `npm run verify:full` | Full verification suite |
| `npm run verify:production` | Production smoke test |
| `npm run verify:data-pipeline` | Data pipeline verification |
| `npm run verify:db` | Database connectivity |
| `npm run verify:repositories` | Repository layer |
| `npm run verify:prisma-repository` | Prisma repository |
| `npm run verify:prisma-mappers` | Prisma mappers |
| `npm run verify:sources` | Source discovery |
| `npm run verify:generated` | Generated data |
| `npm run verify:ingestion` | Ingestion contracts |
| `npm run verify:timeline` | Timeline view |
| `npm run verify:localization` | Localization |
| `npm run verify:data-gov` | Data.gov ingestion |
| `npm run verify:ai` | AI analysis |
| `npm run verify:debate-upsert-rules` | Debate upsert rules |
| `npm run verify:debate-transcripts` | Debate transcripts |
| `npm run verify:state-governance` | Static States tab data/map verifier |

---

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t bharatzero .

# Run with environment
 docker run -p 5174:5174 \
  -e DATABASE_URL="postgresql://..." \
  -e HOST="0.0.0.0" \
  -e PORT="5174" \
  bharatzero
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

**Vercel Configuration:**

```json
// vercel.json
{
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/(.*)", "dest": "https://your-api-server.com/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

For serverless deployment on Vercel, use:

```bash
# Build command
npm run db:generate && npm run build

# Output directory
dist
```

### Environment-Specific Settings

#### Development
```bash
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bharatzero"
HOST="127.0.0.1"
PORT="5173"
GEMMA_API_KEY=""  # Optional for dev — without it, AI analysis falls back to local heuristics
```

#### Production
```bash
# .env
DATABASE_URL="postgresql://...neon.tech/..."
HOST="0.0.0.0"
PORT="5174"
GEMMA_API_KEY="AIza..."
GEMMA_MODEL="gemma-4-31b-it"
GEMMA_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"
AI_ANALYSIS_PROVIDER="gemma"
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```
Error: Can't reach database server at `...`
```

**Solutions:**
1. Check `DATABASE_URL` in `.env`
2. Verify PostgreSQL is running: `docker ps`
3. Check network connectivity to database host
4. For Neon: ensure `sslmode=require` in connection string

#### Prisma Client Not Generated

```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
npm run db:generate
```

#### Type Errors After Changes

```bash
# Full type check
npm run check

# Watch mode for ongoing development
npm run check:watch
```

#### Build Failures

```bash
# Clean build
rm -rf dist dist-server
npm run build

# Check for TypeScript errors first
npm run check
```

#### AI Analysis Not Working

**Check:**
1. `GEMMA_API_KEY` (or alias `GEMINI_API_KEY`) is set
2. Provider is configured: `AI_ANALYSIS_PROVIDER=gemma`
3. API key has available quota on Google AI Studio

**Test:**
```bash
curl "http://127.0.0.1:5173/api/bills/{bill-id}/ai-analysis?lang=en"
```

#### Memory Issues During Build

```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Debug Mode

Enable verbose logging:

```bash
# Prisma queries
DEBUG="prisma:*" npm run dev

# Full debug
DEBUG="*" npm run dev
```

### Getting Help

1. Check existing verification scripts for similar issues
2. Review `scripts/verify-*.ts` for diagnostic patterns
3. Check logs in `logs.*.json` files
4. Run `npm run verify:production` for smoke test

---

## Related Documentation

- [API Reference](./API_REFERENCE.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [Data Pipeline](./DATA_PIPELINE.md)
- Visual Diagrams
  - [Frontend Architecture](./DIAGRAM_FRONTEND_ARCHITECTURE.md) - Component hierarchy and data flow
  - [Bill Lifecycle](./DIAGRAM_BILL_LIFECYCLE.md) - Bill stage state machines
  - [API Flows](./DIAGRAM_API_FLOWS.md) - Request/response sequences
  - [State Governance](./DIAGRAM_STATE_GOVERNANCE.md) - States tab map and verifier flow
