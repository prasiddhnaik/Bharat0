# Technical Research: A Next.js Bill-Tracker for Sansad.in

This report covers seven technical areas for a small-team Next.js application that scrapes, parses, normalizes, and serves Indian parliamentary bill data from Sansad.in. Recommendations consistently bias toward open-source, low-cost, low-ops solutions that a solo developer can keep running.

---

## 1. PDF Link Discovery from Sansad.in HTML

### The shape of the problem on Sansad.in

Sansad.in renders most legislation lists (e.g., `https://sansad.in/ls/legislation/bills` and the Rajya Sabha equivalent at `https://sansad.in/rs/legislation/bills`) as a server-rendered Angular/React-style SPA shell with JSON-driven tables. PDF URLs typically appear in one of three places:

1. As `<a href="...pdf">` tags inside the page after hydration.
2. Embedded as an attribute (`data-file`, `data-pdf`, `data-url`) on a "View" or "Download" button.
3. As a JSON payload in an internal API call the page makes (often visible in the Network tab as `/api/Legislation/...` or similar) — these are usually the cleanest source of truth.

### Recommended approach (in order of preference)

**(a) Hit the underlying JSON API directly.** Open the page in Chrome DevTools, find the XHR/fetch that populates the table, and call it from your scraper. This bypasses HTML parsing entirely and gives you the bill ID, ministry, dates, and PDF file path as structured JSON. For Sansad.in these endpoints typically return a `filePath` or similar field that you concatenate with a known base. This is by far the most reliable and least brittle option for government sites whose front ends rotate frequently.

**(b) Static HTML scrape with Cheerio when the API is unavailable.** Cheerio is the right default for Node/Next.js — it's a fast, jQuery-style parser with no browser overhead. Use a layered selector strategy:
- First, anchor on stable structural cues (table IDs, role attributes, captioned `<caption>` text) rather than CSS classes, which change.
- Then extract every `<a>` whose `href` ends in `.pdf` (case-insensitive) or contains `/file/` or `/uploads/` — government CMSs (NIC's `cms.rajyasabha.nic.in`, `prsindia.org`, and `sansad.in`'s file paths) almost always route PDFs through one of those segments.
- Resolve relative URLs with Node's `URL` constructor against the page URL.
- Always also check `data-*` attributes and `onclick` handlers with a regex like `/['"]([^'"]+\.pdf)['"]/i` — many sites build the URL inside JS handlers.

**(c) Headless browser fallback for fully JS-rendered pages.** When the HTML is an empty shell, use Playwright (preferred over Puppeteer in 2026 for its built-in network interception and `page.waitForResponse` API). Run it against `chromium` with `--disable-gpu --no-sandbox` in your scraper container. Two patterns work well:
- `page.waitForResponse(r => r.url().includes('/api/') && r.ok())` to capture the same JSON the page consumes.
- `await page.locator('a[href$=".pdf"]').evaluateAll(...)` to read links after hydration.

JSDOM is *not* recommended for this because it doesn't run scripts reliably enough for modern frameworks; reach for Playwright or `playwright-core` when you genuinely need a browser.

### Pagination of document lists

Sansad.in tables paginate via either query-string offsets (`?pageNumber=2&pageSize=20`) or POST bodies with a similar shape. The robust pattern:
1. Make the first request, parse total record count from the response (or from the pagination control text).
2. Loop in parallel (3–5 concurrent requests max — government sites throttle aggressively) using a small queue library like `p-limit` or `p-queue`.
3. Persist a "last-seen-page-hash" in your DB so reruns can short-circuit when nothing has changed.

### Redirects, sessions, and other government-site quirks

- Use a real `User-Agent` and an `Accept-Language: en-IN,en;q=0.9` header. Many `*.nic.in` endpoints return 403 to default `node-fetch` UAs.
- Allow redirects (`fetch` does this by default; if you switch to `undici` use `redirect: 'follow'`).
- Persist cookies between requests if the first request issues a `JSESSIONID` — `got` with a `CookieJar` from `tough-cookie` is the cleanest way.
- Treat the **PDF download as a separate step** with retry/backoff: stream `arrayBuffer` to disk or S3, validate the magic bytes (`%PDF-`) before passing to your parser. PDFs sometimes return HTML error pages with a 200 status.
- Build a **fallback chain**: if the JSON API fails → Cheerio HTML scrape → Playwright headless. Log which path was taken per bill so you can monitor when Sansad.in changes shape.

### Concrete tools

- **HTTP**: `undici` (built into Node) or `got` for cookie/retry support.
- **HTML**: `cheerio` (https://cheerio.js.org/).
- **Browser**: `playwright` (https://playwright.dev/).
- **Concurrency**: `p-limit`, `p-queue`.
- **Reference**: PRS India (https://prsindia.org/billtrack) is a high-quality secondary source you can cross-validate against — it has cleaner stage data than Sansad.in.

---

## 2. Structured PDF Parsing of Indian Bills

### What an Indian bill PDF looks like

A typical Government Bill PDF from Sansad.in has a stable internal structure: a cover page; a "long title" beginning with "A Bill to ..."; a numbered "Statement of Objects and Reasons"; the operative clauses (numbered 1, 2, 3 ...); often a "Notes on Clauses"; and a "Memorandum regarding delegated legislation" / "Financial Memorandum." Many bills are bilingual (English + Hindi), with the Hindi version typically following the English version on later pages or in a parallel column. Definitions appear under clause 2, and amendment bills enumerate affected sections of parent Acts.

### Library choice — node vs python

Comparative results from the 2024 arXiv survey of PDF parsers ("A Comparative Study of PDF Parsing Tools Across Diverse Document Categories") and the more recent Strapi/PkgPulse benchmarks converge on the same conclusion: for **layout-faithful structured extraction of legal/government documents**, PyMuPDF (Python `pymupdf`/`fitz`) and `pdfplumber` outperform Node-native parsers, while in pure Node `pdfjs-dist` is the most capable and `pdf-parse` is fine only for plain text. Trade-offs:

| Library | Runtime | Strength | Weakness |
|---|---|---|---|
| `pdf-parse` | Node | Trivial API, fast text dump | No coordinates, no layout, abandoned-ish maintenance |
| `pdfjs-dist` | Node/Browser | Per-glyph coords, fonts, annotations, link extraction | Lower-level API, must reconstruct lines yourself |
| `pdf2json` | Node | JSON with x/y per text run | Verbose output, ugly to work with |
| `unpdf` | Node/Edge | Modern TS, edge-runtime safe wrapper over pdf.js | Newer, smaller community |
| `pdfplumber` | Python | Best-in-class layout/table extraction, character-level filters | Adds a Python service to your stack |
| `pymupdf` (fitz) | Python | Highest BLEU/structure scores on legal docs in benchmarks | AGPL license — check before using |

### Recommended architecture

Run a **two-pass extraction** rather than trying to do everything with one library.

**Pass 1: text-flow extraction** with `pdfjs-dist` inside your Next.js API route (or a separate worker) for the full searchable text and a quick token count. Use `getTextContent()` and group items by their `transform[5]` (Y coordinate, rounded) to recover line breaks correctly — naive `.join(' ')` collapses paragraphs.

**Pass 2: structural extraction** using regex/heuristics on the cleaned text. Indian bill PDFs are remarkably uniform:

- **Long title**: first paragraph after "A Bill" / "A BILL" up to the first period or "BE it enacted".
- **Statement of Objects and Reasons**: text between the literal headers `STATEMENT OF OBJECTS AND REASONS` and `NEW DELHI;` (the signature line) or the start of the bill body.
- **Clauses**: regex `^\s*(\d+)\.\s+([A-Z][^.]+\.)` at line start typically captures clause number and short title; everything until the next match is the clause body.
- **Definitions**: locate clause 2 (almost always "Definitions"), then split on `(\([a-z]\))` for sub-clauses.
- **Affected Acts**: regex `(the\s+[A-Z][\w\s,]+Act,\s*\d{4})` deduplicated.
- **Penalties**: search for `imprisonment`, `fine which may extend to`, `punishable with` and capture the surrounding sentence.
- **Commencement**: clause 1(2) or 1(3) almost always reads "It shall come into force on such date as the Central Government may, by notification in the Official Gazette, appoint" — pattern-match it.

**Pass 3 (optional): LLM-assisted extraction** for the messy fields. Send only the relevant slice (e.g., Statement of Objects and Reasons, or one clause at a time) to Groq with a strict JSON schema. This is dramatically more reliable than asking an LLM to extract the whole bill at once, and it caps tokens.

### Coordinate-based vs text-flow

Use coordinate-based parsing only when you have multi-column layouts (rare in main bill text but common in notes-on-clauses tables) or bilingual side-by-side pages. With `pdfjs-dist`, sort items by `(round(y/lineHeight), x)` to reconstruct reading order. For bilingual PDFs where Hindi runs in a parallel column, detect Devanagari Unicode blocks (`/[\u0900-\u097F]/`) on a per-line basis and split into two streams.

If you need real table extraction (rare for bills, more common for budget documents), call out to a small Python sidecar running `pdfplumber` — it pays for itself the moment you have one stubborn document.

### Practical recommendation for your stack

Start with `pdfjs-dist` (https://github.com/mozilla/pdf.js) plus regex heuristics in an API route or a separate background worker. Reserve LLM extraction for the long-title and objects-and-reasons fields where the surface form varies most. If you hit accuracy problems on amendment bills (which reference parent Acts heavily), add a Python service running PyMuPDF and call it via HTTP from Next.js.

---

## 3. AI Analysis Quality for Legislative Documents

### The core principle: never let the LLM see anything you don't want quoted back

LegalBench-style evaluations and recent literature on legal RAG ("HalluGraph" arXiv:2512.01659, "Towards Reliable Retrieval in RAG Systems for Large Legal Datasets" arXiv:2510.06999) consistently report 17–33% hallucination rates even on RAG-augmented systems for legal text. The defenses below are listed in roughly ascending order of cost.

### Prompting strategies that move the needle

1. **Decompose, don't summarize.** Ask one question at a time with the *minimum* relevant text. Instead of "summarize this bill," run separate calls for "what changes," "who is affected," "key clauses," "current stage," each with a tightly scoped context window.
2. **Ground every output to a clause number.** Require the model to return `{"claim": "...", "clause": "Section 4(2)(b)", "evidence_quote": "..."}` and validate after the fact that the `evidence_quote` is a substring of the source clause. Reject and retry if not. This is the single highest-leverage hallucination defense.
3. **Force structured output with strict JSON schema.** Groq supports `response_format: {type: "json_schema", json_schema: {strict: true, schema: ...}}` on its OpenAI-OSS models (https://console.groq.com/docs/structured-outputs). Strict mode does token-level constrained decoding and guarantees schema conformance. Use it.
4. **Add an explicit "uncertainty" output.** Make the model emit `confidence: "high"|"medium"|"low"` and `unknowns: [...]`. Bills routinely contain "as may be prescribed" — having the model flag those rather than guess is the key to source-grounded analysis.
5. **Use few-shot examples drawn from already-passed bills.** Two annotated examples (e.g., the DPDP Act and a recent Finance Bill) materially improve consistency, and you can store them in your DB once, not per call.
6. **System prompt should explicitly forbid fabrication.** "If a field cannot be supported by a direct quote from the provided text, return `null` and add the field name to `missing_information`." Direct Preference Optimization papers (e.g., arXiv:2603.19251 on legal LLMs) show that abstention-trained models hallucinate less; you can simulate this in prompting.

### RAG specifics for bill text

For a bill-tracker, full-document context is usually viable (Indian bills are typically 5–60 pages; well within Llama 3.3 70B's 128K context). True RAG mostly matters when you want **cross-bill** Q&A ("which bills affect the IT Act, 2000?"). When you do need RAG:

- Chunk by **clause boundary**, not by token count — you already extracted clauses in section 2. Each chunk's metadata should carry `bill_id, clause_number, parent_act, heading`.
- Embed with `text-embedding-3-small` (OpenAI, $0.02/M tokens) or BGE-small via Hugging Face inference for an open-source path. Store vectors in pgvector (see Section 5).
- **Summary-Augmented Chunking** (the SAC technique from the 2510.06999 paper) materially improves retrieval — prepend a one-line auto-summary of the bill to each chunk so chunks from the right document score higher, mitigating Document-Level Retrieval Mismatch.
- Always include the bill's **canonical metadata** (title, year, ministry) as a system message so the model can cite it correctly.

### Provider comparison for this use case

| Model | Strength | Weakness | Use for |
|---|---|---|---|
| **Groq (Llama 3.3 70B, GPT-OSS 120B)** | 250+ tok/s, very cheap, strict JSON-schema mode | Slightly weaker on multi-hop reasoning vs Claude (NeuraPulse benchmarks: ~3–5% worse on extraction; 12–18% worse on creative reasoning) | Default extractor; "what changes" / "who is affected" / clause classification |
| **Anthropic Claude Sonnet 4.5/4.6** | Best legal reasoning, best at following formatting instructions, 200K+ context, parallel tool calls | $3/$15 per M tokens — 10–20× Groq | Final review pass on flagship bills, ambiguous clauses, comparing against parent Act |
| **OpenAI GPT-4.1 / GPT-5** | Best general accuracy; broadest tool ecosystem; structured outputs mature | Costlier than Groq; higher latency than Groq | Fallback when Groq output fails validation; embeddings |
| **Gemini 2.5 Pro** | 1M context (whole bill + parent Act in one call); cheap input | Tool-calling less battle-tested; content moderation can fire on bills mentioning sensitive topics (e.g., terrorism law) | Long-context comparisons across multiple bills |

**Recommended pattern**: Groq as the workhorse for per-bill extraction and per-clause classification (cheap, fast, JSON-schema-strict), with a Claude or GPT-5 "audit" pass triggered by (a) low-confidence outputs, (b) bills with high public interest, or (c) randomly sampled 5% for QA. This keeps marginal cost low while preserving a quality safety net.

### Hallucination mitigation checklist

- [ ] Strict JSON schema with `strict: true` on Groq.
- [ ] Every claim carries a clause reference and evidence quote.
- [ ] Post-generation validator that (a) parses JSON, (b) verifies evidence quote substring-matches source, (c) verifies clause numbers exist in the parsed bill.
- [ ] `temperature: 0` for extraction, `0.2–0.4` only for narrative summaries.
- [ ] Cache outputs keyed by `(model, prompt_version, source_text_hash)` — bills don't change, so an extraction is a one-time cost.
- [ ] Log prompt and response to your DB so you can re-evaluate when you change the prompt template.

---

## 4. Server-Side Caching, Windowing, and Performance

### The Next.js layer

In the App Router (Next.js 15+), use **Cache Components** (`cacheComponents: true`) with the `'use cache'` directive plus `cacheLife` and `cacheTag` (https://nextjs.org/docs/app/getting-started/caching-and-revalidating). Pattern:

```ts
async function getBill(id: string) {
  'use cache'
  cacheLife({ stale: 3600, revalidate: 21600, expire: 86400 }) // 1h/6h/1d
  cacheTag(`bill:${id}`, 'bills:all')
  return db.bills.findFirst({ where: { id } })
}
```

When your scraper finds an update, call `revalidateTag('bill:'+id)` from a server action — stale-while-revalidate keeps the page fast for visitors while regeneration happens in the background.

For list pages and the timeline/date-rail, prefer **time-based ISR with `export const revalidate = 1800`** (30 minutes) plus on-demand `revalidateTag('bills:list')` from your scraper job. ISR's stale-while-revalidate model is exactly right for parliamentary data, where staleness of an hour is acceptable.

Caveats from the Next.js community: when running multiple instances behind a load balancer, file-system caching is per-instance. If you deploy on Vercel, it's handled. If you self-host on Railway/Fly with multiple replicas, configure a shared cache handler (Redis-backed) — see https://nextjs.org/docs/app/guides/how-revalidation-works.

### The Postgres layer

**Materialized views for aggregations.** Your "timeline / date-rail" data — counts of bills introduced/passed per week, per ministry, per session — is a textbook materialized view use case. Define it with `CREATE MATERIALIZED VIEW bill_timeline_daily AS ...`, index it, and `REFRESH MATERIALIZED VIEW CONCURRENTLY bill_timeline_daily` from your nightly cron. Concurrent refresh requires a unique index but doesn't block readers.

**Cache computed JSON in a `cache` table.** For derived data that's expensive to compute but doesn't fit in a view (e.g., the AI analysis JSON, or a bill's normalized stage history), use a `bill_cache(bill_id, key, value jsonb, computed_at, version)` table with a `(bill_id, key)` unique index. Bump `version` to invalidate.

**Redis is optional, not required at your scale.** For an indie/small-team app serving Indian parliamentary data (a few thousand bills, low five-figure DAU at most), Postgres alone — with proper indexes and ISR — handles it. Reach for Redis (Upstash free tier is generous) only when you start doing expensive aggregations on every request that you can't materialize.

### Pagination: cursor vs offset

For lists ordered by date (which is essentially every list in your app), use **keyset/cursor pagination**:

```sql
SELECT * FROM bills
WHERE (introduced_on, id) < ($1, $2)
ORDER BY introduced_on DESC, id DESC
LIMIT 20;
```

Offset pagination is acceptable if your list pages are small (<100 pages), but it gets prohibitively slow on filtered+sorted queries because Postgres must still read and discard skipped rows. Keyset pagination is constant-time. For the API surface, return a `nextCursor` token (base64-encoded `(introduced_on, id)`) the client passes back.

`COUNT(*)` over filtered queries is the silent killer at this scale (the Nomadz blog post on Postgres FTS at 400K rows highlights this). Strategy: don't show exact counts on filtered list pages. Show "20+" or use a cached approximate count from `pg_class.reltuples` or a materialized count.

### Concrete recommendations

- ISR on bill pages, 30–60 min `revalidate`, on-demand `revalidateTag` from your scraper.
- Materialized view for the date-rail; refresh nightly + on-demand after big imports.
- Keyset pagination with `(date, id)` composite.
- A `bill_cache` table for AI analysis JSON, keyed by `(bill_id, model, prompt_version)`.
- Skip Redis until you actually have a workload that needs it.

---

## 5. Search Architecture

### Sizing the problem

You have at most a few tens of thousands of bills, with bill text totaling perhaps a few hundred MB after extraction. Searchable fields: title, ministry, bill text, action/event history, introducer name. This is *small* — the choice between Postgres FTS, Meilisearch, Typesense, and Elasticsearch is mostly about UX expectations, not scale.

### Recommended approach: Postgres FTS first, Meilisearch when UX matters

**Tier 1: Postgres `tsvector` + `pg_trgm` + pgvector (recommended starting point).**

```sql
ALTER TABLE bills ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(ministry,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(extracted_text,'')), 'C')
  ) STORED;

CREATE INDEX bills_search_idx ON bills USING GIN(search_tsv);
CREATE INDEX bills_title_trgm ON bills USING GIN(title gin_trgm_ops);
```

This handles 90% of your queries: `WHERE search_tsv @@ websearch_to_tsquery('english', $1) ORDER BY ts_rank(search_tsv, ...) DESC`. Use `pg_trgm` for typo tolerance on titles and ministry names. This costs you zero additional infrastructure and zero sync complexity — a real consideration for a small team.

**Tier 2: add pgvector for semantic search.**

Embed bill titles, summaries, and clause-level chunks with `text-embedding-3-small` or BGE. Store in pgvector with HNSW indexes. Use **Reciprocal Rank Fusion (RRF)** to combine BM25/tsvector ranking with vector cosine ranking — there are two production-quality patterns documented:

- Pedro Alonso's tutorial on `pg_textsearch` + pgvector with RRF: https://www.pedroalonso.net/blog/postgres-bm25-search/
- Jonathan Katz's reference implementation: https://jkatz05.com/post/postgres/hybrid-search-postgres-pgvector/
- TigerData/Timescale's `pg_textsearch` extension brings true BM25 ranking inside Postgres (https://www.tigerdata.com/blog/introducing-pg_textsearch-true-bm25-ranking-hybrid-retrieval-postgres) — better than `ts_rank` for relevance, and avoids the long-document-bias problem of standard tsvector.

For RRF, the canonical SQL pattern is:

```sql
WITH bm25 AS (SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(...) DESC) rk FROM bills LIMIT 50),
     vec  AS (SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $emb) rk FROM bills LIMIT 50)
SELECT id, COALESCE(1.0/(60+bm25.rk), 0) + COALESCE(1.0/(60+vec.rk), 0) AS score
FROM bm25 FULL OUTER JOIN vec USING(id)
ORDER BY score DESC LIMIT 20;
```

`k=60` is the canonical RRF constant from Cormack et al. (SIGIR 2009).

**Tier 3: Meilisearch only if UX demands typo tolerance and instant-search.**

If your users expect Algolia-grade search (sub-50ms response, typo tolerance baked in, faceted filters), Meilisearch is the best fit for a small team — Rust binary, MIT-licensed, runs in 50MB of RAM, and has a clean Postgres sync story (binary or `meilisync`). It outranks Typesense for indexing speed and storage efficiency (Meilisearch keeps index on disk; Typesense keeps it in RAM, which becomes a cost issue). Skip Elasticsearch — it's massive overkill at your scale and a real ops burden.

**Cost/complexity ranking for indie:**

| Option | Cost | Complexity | When to choose |
|---|---|---|---|
| Postgres tsvector + pg_trgm | $0 | Trivial | Your starting point. |
| Postgres + pgvector + RRF | $0 + embedding API costs | Low | When semantic queries help (cross-bill Q&A). |
| `pg_textsearch` (BM25 in Postgres) | $0, but extension may not be on every host | Low | If `ts_rank` proves insufficient. |
| Meilisearch self-hosted | ~$5/mo for a small VPS | Medium (sync layer) | When users expect Algolia UX. |
| Typesense Cloud | $19+/mo | Medium | Same; minor edge for some search-as-you-type cases. |
| Elasticsearch / OpenSearch | $30+/mo, ops-heavy | High | Avoid at this scale. |

**Concrete recommendation**: Start with Postgres FTS + pgvector + RRF. Only graduate to Meilisearch when you have measured user complaints about search relevance.

---

## 6. Production Postgres for Next.js

### Hosted provider comparison (April 2026)

| Provider | Free tier | Paid entry | Best for | Notes |
|---|---|---|---|---|
| **Neon** (https://neon.tech) | 0.5 GB storage, 191.5 compute-hours/project, 10 branches, scale-to-zero | Launch ~$19/mo | Vercel-deployed Next.js apps; bursty traffic | Serverless driver (`@neondatabase/serverless`) eliminates the connection-pooling problem in serverless functions. Branching is O(1) (copy-on-write). Acquired by Databricks early 2026 but operating independently. |
| **Supabase** (https://supabase.com) | 500MB DB, 50K MAU, pauses after 7d inactivity | Pro $25/mo | If you also need auth + storage + realtime | Pgbouncer + Supavisor pooler bundled. Good Drizzle/Prisma support. Pauses on free tier hurts a scraping app that runs nightly. |
| **Railway** | $5 trial credit, no permanent free tier | $5/mo Hobby + usage; $20/mo Pro + usage | Same-platform deploys (run scraper + DB together) | Per-second billing; minimal extensions (no PostGIS/pgvector by default — use community templates). |
| **Render** | 90-day free trial, then deletes | $7/mo Starter | Predictable-cost simple deploys | Smaller region footprint; no branching. |
| **AWS RDS** | 12-month free tier (t3.micro) | $15+/mo at smallest reasonable size | Long-term scale, compliance | Heavy operational overhead; not worth it unless you already live in AWS. |
| **Fly.io Postgres / managed by Supabase on Fly** | n/a | $1.94+/mo per 256MB volume | Edge-colocation with your Fly app | Ops-light but you manage backups. |

**Recommendation for your stack**: **Neon** is the right default for a Next.js app. The serverless driver removes the #1 footgun of running Postgres behind serverless functions (connection exhaustion), branching gives you per-PR preview databases for free, and scale-to-zero means a side project costs literally cents per month. Move to Supabase if you want bundled auth + storage; move to RDS only when you have a compliance reason.

### Migrations

For a Next.js + TypeScript stack, the realistic field is `drizzle-kit`, `prisma migrate`, and `node-pg-migrate`. Quick comparison:

- **Drizzle Migrate** (https://orm.drizzle.team) — TypeScript-first; SQL migrations generated from schema or hand-written; minimal runtime overhead; works perfectly with Neon's serverless driver. **Recommended** for new Next.js projects in 2026.
- **Prisma Migrate** — most mature ecosystem; great DX; runtime ~14MB and historically heavier on serverless cold starts (improved with Prisma 5+ and the Driver Adapter pattern, including a Neon adapter).
- **node-pg-migrate** — pure SQL/JS, no ORM coupling; best when you want full control and are happy writing migrations by hand.
- **Flyway / Liquibase** — Java-based, enterprise-grade; overkill for a small team but appropriate if you have polyglot services.

For your project, pick **Drizzle**. It plays best with Neon's HTTP/serverless driver, has zero runtime cost, and the schema-as-TypeScript story makes the data model self-documenting alongside your scraper code.

### Backup strategy

- **Automated daily snapshots**: every hosted provider above does this; verify retention (Neon WAL keeps 7–30 days, Supabase 7 days on Free, longer on Pro).
- **Logical dumps to S3/R2 weekly**: `pg_dump --format=custom | gzip | aws s3 cp -` from a GitHub Actions cron. Cloudflare R2 has zero egress fees, making this near-free.
- **Test the restore quarterly.** A backup you've never restored is not a backup.
- **Schema-only backup** at every migration so you can rebuild structure without data.

### Environment separation

Standard pattern with Neon: one project, three branches — `main` (production), `staging`, `dev`. Each branch is an independent Postgres database via copy-on-write. Wire `DATABASE_URL` per Vercel environment (Production / Preview / Development). On Supabase/Railway, create three separate projects.

### Seed and sync jobs for parliamentary data

- **Run scraping jobs separately from your web tier.** Don't run scrapers inside Next.js API routes that share a serverless container with user requests. Options:
  - GitHub Actions cron (free, simplest, fine for hourly/daily jobs).
  - Vercel Cron + a dedicated Edge/Node function with a longer `maxDuration`.
  - A small worker on Railway / Fly running a Node script with `node-cron` or `bullmq`.
- **Idempotency**: every scraper run computes a hash of (bill_id, last_action_date, pdf_url) and only rewrites if changed. Use `INSERT ... ON CONFLICT DO UPDATE`.
- **Backpressure**: respect Sansad.in by capping concurrency to ~3 requests and using exponential backoff on 429/5xx.
- **Provenance columns**: `source_url, scraped_at, scraper_version, source_payload jsonb`. This is non-negotiable — it lets you replay extraction when your parser improves.

### Connection pooling

Three viable patterns:

1. **Neon serverless driver** (`@neondatabase/serverless`) — uses HTTP/WebSocket, no pool needed, perfect for Vercel. **Use this if you're on Neon + Vercel.**
2. **PgBouncer / Supavisor in transaction mode** — for traditional pooling. Supabase exposes a pooler URL on port 6543; connect to it from serverless functions, leave the direct port for migrations.
3. **Self-hosted PgBouncer** — only if you self-host Postgres.

The key rule: **never connect a serverless function directly to Postgres on the standard 5432 port without a pooler.** A modest spike in traffic will exhaust connections.

---

## 7. Data Normalization for Scraped Government Data

### Canonical taxonomy of Indian bill stages

Based on the Rajya Sabha legislative procedure handbook (https://cms.rajyasabha.nic.in/UploadedFiles/Procedure/PracticeAndProcedure/English/6/legislative_procedure.pdf) and Sansad.in's own categorization, the canonical pipeline is:

1. `pending_introduction` — listed in business but not yet introduced
2. `introduced_lok_sabha` / `introduced_rajya_sabha`
3. `referred_to_standing_committee` (optional)
4. `committee_report_presented` (optional)
5. `passed_lok_sabha`
6. `passed_rajya_sabha`
7. `returned_with_amendments` (optional, ping-pong)
8. `joint_sitting_summoned` (rare — only 3 historical instances)
9. `assented_by_president` → `act`
10. `lapsed` — on dissolution of Lok Sabha (Rajya Sabha bills do not lapse)
11. `withdrawn`

Special tracks: **Money Bills** can only originate in Lok Sabha and bypass Rajya Sabha after 14 days; **Constitution Amendment Bills** require special majorities and (for federal provisions) state ratification; **Ordinances** become bills that must be passed within 6 weeks of reassembly. Model these as a `bill_type` enum (`ordinary`, `money`, `financial_a`, `financial_b`, `constitution_amendment`, `private_member`, `ordinance_replacement`) so your stage logic can branch correctly.

Your `bill_stages` table should be **event-sourced**: every status change is a row with `(bill_id, stage, event_date, source_url, source_text, confidence, evidence_quote)`. The current stage is derived by ordering events. This makes data drift recoverable — when Sansad.in reclassifies something, you append a new event rather than mutate history.

### Ministry name normalization

Sansad.in is famously inconsistent: "Ministry of Electronics & Information Technology", "MeitY", "Min. of Electronics and IT", "Department of Electronics and Information Technology" all appear. Approach:

1. **Maintain a canonical `ministries` table** with `id, canonical_name, short_name, aliases text[]`. Seed from the Cabinet Secretariat list of ministries (~55 ministries, ~20 stable departments).
2. **Two-stage resolver** when ingesting a scraped string:
   - Exact-match (case- and whitespace-normalized) against `aliases`. → high confidence.
   - Fuzzy match using `fuzzball` (https://github.com/nol13/fuzzball.js) `token_set_ratio` against canonical names + aliases; threshold ≥ 90 → medium confidence; 75–89 → suggest-match (queue for human review).
   - Below 75 → unresolved; insert a row in `ministry_review_queue` and assign a tentative bucket of `Other`.
3. **Override table**. A simple `ministry_overrides(scraped_string PRIMARY KEY, ministry_id)` lets you fix any problematic mapping with a single SQL insert that takes precedence over fuzzy matching. This is the indie-developer's most important data-cleaning tool.
4. **Confidence scoring**. Persist a `match_method` (`exact|alias|fuzzy|override|unresolved`) and `match_score` so you can surface "tentative" badges in the UI and re-run the resolver after improving aliases.

`fast-fuzzy` (https://www.npmjs.com/package/fast-fuzzy) is a smaller alternative if you want a tinier dep. For Postgres-side fuzzy matching, `pg_trgm`'s `similarity()` with a 0.4 threshold gives you a reasonable in-database fallback.

### Category mapping

Same pattern: maintain canonical categories (e.g., `Finance`, `Health`, `Telecom & IT`, `Defence`, `Environment`, `Personal Laws`, `Criminal Justice`) and an alias/override table. Use the LLM (Groq) as a *suggester* for unresolved bills — feed it the long title and the canonical taxonomy with a strict JSON schema returning `{category_id, confidence, reasoning}`. Always require a human review step for confidence < 0.8 — store the suggestion in a `category_suggestions` table for one-click acceptance in an admin UI.

### Handling source data drift

Sansad.in updates without notice — column orders shift, new statuses appear, ministry names change after cabinet reshuffles. Defenses:

- **Snapshot raw payloads.** Every scrape stores the raw HTML/JSON in `source_snapshots(scraped_at, url, payload)`. When something breaks, you can replay parsers against history.
- **Schema version per scraper.** `scraper_version` column on every bill row. When you bump the parser, you can selectively re-process old data.
- **Daily diff alerts.** A small cron job that compares yesterday's vs today's parser output and emails/Discord-pings if more than 5% of bills have changed unexpectedly. This catches breakages within hours.
- **Loose foreign keys, not enums for live data.** Define `bill_stage` and `ministry` as foreign keys to lookup tables rather than Postgres enums — adding a new value to a Postgres enum requires a migration, but inserting a row into a lookup table is a runtime operation.
- **Cross-reference with PRS India.** PRS Legislative Research (https://prsindia.org/billtrack) maintains an editorially curated parallel dataset; periodic cross-checks expose Sansad.in glitches. Build it into a weekly diff report.

### Recommended data model sketch

```
bills(id, sansad_id, type, title, long_title, ministry_id, introduced_house, introduced_on,
      current_stage, scraper_version, source_url, last_seen_at)
bill_stages(id, bill_id, stage, event_date, source_url, evidence_quote, confidence, created_at)
ministries(id, canonical_name, short_name, aliases text[])
ministry_overrides(scraped_string PK, ministry_id)
categories(id, name, parent_id)
bill_categories(bill_id, category_id, source enum('manual','llm','rule'), confidence)
bill_pdfs(id, bill_id, kind enum('original','as_passed','as_introduced'), pdf_url, sha256, fetched_at)
bill_extracts(bill_id, version, long_title, statement_objects, clauses jsonb, definitions jsonb,
              affected_acts text[], penalties jsonb, parser_version, extracted_at)
bill_ai_analyses(bill_id, model, prompt_version, output jsonb, confidence, created_at)
source_snapshots(id, scraped_at, url, payload jsonb, hash)
```

This shape supports replay, versioning, and confidence-aware UI rendering across all seven concerns above.

---

## Putting it together: a recommended stack

For a solo/small-team build in 2026:

- **Hosting**: Vercel for the Next.js app; Neon for Postgres (free tier or $19/mo Launch); Cloudflare R2 for PDF storage; GitHub Actions for scrape crons.
- **ORM/migrations**: Drizzle + drizzle-kit.
- **Scraping**: Cheerio default, Playwright fallback; persist raw payloads.
- **Parsing**: pdfjs-dist + regex heuristics; optional Python sidecar with PyMuPDF for amendment bills.
- **AI**: Groq (Llama 3.3 70B) with strict JSON schema for the bulk of extraction; Claude Sonnet for sampled audits and ambiguous bills; OpenAI `text-embedding-3-small` (or BGE) for semantic search.
- **Search**: Postgres `tsvector` + `pg_trgm` + pgvector + RRF; consider `pg_textsearch` if you need true BM25; defer Meilisearch until UX requires it.
- **Caching**: Next.js `cacheTag`/`cacheLife` with on-demand revalidation triggered by your scraper; a `bill_cache` table for AI outputs; materialized views for timeline aggregations.
- **Normalization**: canonical ministries/categories tables + override table + fuzzball for fuzzy matching; LLM as a suggester, never as an authority.

This stack costs roughly $0–25/month at indie scale, scales smoothly to mid-five-figure DAU, and avoids the operational complexity (Elasticsearch clusters, Kubernetes, custom embedding infra) that kills small-team projects.