# BharatZero Documentation

Welcome to the BharatZero documentation. BharatZero is an India-focused legislative explorer for bills, Acts, Parliament timelines, House power, Prime Minister terms, state governance, and official source coverage.

## Documentation Index

| Document | Description |
|----------|-------------|
| [API Reference](./API_REFERENCE.md) | Complete API documentation for all endpoints |
| [Architecture Overview](./ARCHITECTURE.md) | System architecture, data flows, and component relationships |
| [Database Schema](./DATABASE.md) | Complete database schema documentation |
| [Data Pipeline](./DATA_PIPELINE.md) | Data ingestion, sync, and verification pipeline |
| [Developer Guide](./DEVELOPER_GUIDE.md) | Setup, development workflow, and deployment |
| Visual Diagrams (`DIAGRAM_*.md`) | Mermaid diagrams for architecture, flows, and lifecycle |

## Visual Diagrams

Browse our comprehensive diagram collection:

- **[Bill Lifecycle](./DIAGRAM_BILL_LIFECYCLE.md)** - State machines showing how bills progress through Parliament
- **[API Flows](./DIAGRAM_API_FLOWS.md)** - Sequence diagrams for all API endpoints
- **[Frontend Architecture](./DIAGRAM_FRONTEND_ARCHITECTURE.md)** - Component hierarchy and data flow
- **[State Governance](./DIAGRAM_STATE_GOVERNANCE.md)** - Static state/UT governance map, list sync, and verifier flow

All diagrams are written in [Mermaid](https://mermaid.js.org/) syntax and render directly in GitHub, VS Code, and most modern Markdown viewers.

## Quick Links

### For API Consumers

- [API Endpoints](./API_REFERENCE.md#endpoints)
- [Authentication](./API_REFERENCE.md#authentication)
- [Error Handling](./API_REFERENCE.md#error-responses)
- [Examples](./API_REFERENCE.md#examples)

### For Developers

- [Getting Started](./DEVELOPER_GUIDE.md#getting-started)
- [Development Workflow](./DEVELOPER_GUIDE.md#development-workflow)
- [Scripts Reference](./DEVELOPER_GUIDE.md#scripts-reference)
- [Troubleshooting](./DEVELOPER_GUIDE.md#troubleshooting)

### For Data Engineers

- [Data Pipeline Overview](./DATA_PIPELINE.md#overview)
- [Source Adapters](./DATA_PIPELINE.md#source-adapters)
- [Upsert Logic](./DATA_PIPELINE.md#data-flow-details)
- [Verification Workflow](./DATA_PIPELINE.md#verification-workflow)

### For Architects

- [System Overview](./ARCHITECTURE.md#system-overview)
- [Component Architecture](./ARCHITECTURE.md#component-architecture)
- [Data Flow Diagrams](./ARCHITECTURE.md#data-flow)
- [Deployment Architecture](./ARCHITECTURE.md#deployment-architecture)
- [Bill Lifecycle Diagrams](./DIAGRAM_BILL_LIFECYCLE.md) - Legislative state machines
- [API Flow Diagrams](./DIAGRAM_API_FLOWS.md) - Request/response sequences
- [Frontend Diagrams](./DIAGRAM_FRONTEND_ARCHITECTURE.md) - Component architecture
- [State Governance Diagrams](./DIAGRAM_STATE_GOVERNANCE.md) - Map/list interaction and verification

## Project Overview

### Features

- Overview, Houses, States, Timeline, Bills, Committees, Questions, Debates, Acts, and Sources tabs
- Left-side Prime Minister history panel with bill counts per PM term
- Houses tab with PM-term-specific Lok Sabha power charts
- States tab with India governance map, synchronized accessible list, methodology route, and verified source links
- Prime Minister profile panel with source links
- Bill list, bill detail, local fallback analysis, and Gemma 4 AI analysis cached in PostgreSQL
- Persisted Debate and DebateTranscript models for Neon-backed debate metadata and future transcript extraction
- Source badges on records for auditability
- English/Hindi shell labels and bill title support

### Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js HTTP server
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Gemma 4 (`gemma-4-31b-it`) via the Gemini API for bill analysis

### Data Coverage

| Data Type | Count |
|-----------|-------|
| Bills | 4,708 |
| Bill Actions | 7,268 |
| Timeline Events | 7,253 |
| Sitting Days | 2,560 |
| Acts | 217 |
| State/UT Governance Records | 36 |
| Prime Minister Profiles | 15 |
| Lok Sabha Power Snapshots | 16 |

Counts above describe the current generated/static dataset shape. Runtime counts can differ by database branch after upserts.

### Data Sources

- Sansad portal (current legislation)
- PRS Legislative Research (historical 1992-2019)
- Parliament Digital Library (pre-2004 records)
- Data.gov.in (questions and debates)
- Bharat Maps / Survey of India (self-hosted, simplified state boundary asset)
- Source-backed static state governance records (current v1 record source shown per row)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npm run db:generate

# Start development
npm run dev -- --host 127.0.0.1 --port 5173
```

## API Quick Reference

```bash
# Health check
curl http://127.0.0.1:5173/api/health

# Dashboard data
curl "http://127.0.0.1:5173/api/dashboard?section=overview&lang=en"

# Bills list
curl "http://127.0.0.1:5173/api/dashboard?section=bills&page=1"

# Debates list
curl "http://127.0.0.1:5173/api/dashboard?section=debates&q=tribhuvan&page=1&pageSize=10"

# Bill detail
curl http://127.0.0.1:5173/api/bills/{bill-id}

# AI analysis
curl "http://127.0.0.1:5173/api/bills/{bill-id}/ai-analysis?lang=en"

# Prime Ministers
curl http://127.0.0.1:5173/api/prime-ministers
```

The States tab is a client-side static governance view. Open `/?section=states` and `/methodology` in the browser rather than calling a separate API endpoint.

## Contributing

1. Read the [Developer Guide](./DEVELOPER_GUIDE.md)
2. Follow the [Coding Standards](./DEVELOPER_GUIDE.md#coding-standards)
3. Run verification tests before committing
4. Update documentation for any API changes

## License

[Add license information here]

---

For detailed information, see the individual documentation files linked above.
