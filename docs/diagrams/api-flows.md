# API Request/Response Flows

## Dashboard API Flow

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Vite as Vite Dev Server
    participant API as API Handler
    participant Filters as Filter Parser
    participant Cache as Response Cache
    participant Repo as Repository
    participant Prisma as Prisma Client
    participant DB as PostgreSQL

    Client->>Vite: GET /api/dashboard?section=bills&pm=modi
    Vite->>API: Route to handler

    API->>Filters: parseDashboardFilters()
    Filters-->>API: DashboardFilters object

    API->>Cache: Check cache key
    alt Cache Hit
        Cache-->>API: Cached response
    else Cache Miss
        API->>Repo: getDashboardData(filters)

        Repo->>Prisma: Build where clause
        Prisma->>DB: Execute query
        DB-->>Prisma: Raw results

        Prisma-->>Repo: Prisma rows
        Repo->>Repo: toDomainBill(), toDomainAction()
        Repo-->>API: DashboardData

        API->>API: shapeDashboardForClient()
        API->>Cache: Store with TTL
    end

    API-->>Vite: JSON response
    Vite-->>Client: 200 OK + data
```

## Bill Detail API Flow

```mermaid
sequenceDiagram
    participant Client as React Client
    participant API as API Handler
    participant Repo as Repository
    participant Prisma as Prisma Client
    participant DB as PostgreSQL

    Client->>API: GET /api/bills/{id}

    API->>Repo: getBillDetail(billId)

    Repo->>Prisma: bill.findUnique({
        include: {
            actions: true,
            timeline_events: true,
            acts: true,
            debates: true
        }
    })

    Prisma->>DB: JOIN query
    DB-->>Prisma: Bill + relations

    Prisma-->>Repo: PrismaBill with relations
    Repo->>Repo: toDomainBill(), map relations
    Repo-->>API: BillDetailData

    API-->>Client: JSON response
```

## AI Analysis API Flow

```mermaid
sequenceDiagram
    participant Client as React Client
    participant API as API Handler
    participant SourceText as Source Text Service
    participant AICache as AI Analysis Cache
    participant AI as AI Provider (Groq/NVIDIA)
    participant DB as PostgreSQL

    Client->>API: GET /api/bills/{id}/ai-analysis

    API->>API: getBillDetail(billId)

    API->>SourceText: getBillSourceTextForAnalysis()
    SourceText->>SourceText: Fetch PDF/HTML
    SourceText->>SourceText: Extract text
    SourceText-->>API: Source text or error

    API->>AICache: readPersistedBillAnalysis()
    AICache->>DB: Query AiBillAnalysis
    DB-->>AICache: Cached analysis or null

    alt Analysis Cached
        AICache-->>API: Return cached
    else Not Cached
        API->>API: Build analysis prompt
        API->>AI: analyzeBillWithConfiguredProvider()
        AI-->>API: AI-generated analysis JSON
        API->>AICache: persistBillAnalysis()
        AICache->>DB: Upsert AiBillAnalysis
    end

    API-->>Client: Analysis JSON response
```

## States Tab Static Flow

```mermaid
sequenceDiagram
    participant Client as React Client
    participant StateData as state-governance.ts
    participant Boundary as india-state-boundaries.ts
    participant Verifier as verify-state-governance.ts

    Client->>StateData: Import governance records, palette, field order
    Client->>Boundary: Import self-hosted map features
    Client->>Client: Render map, list, detail panel, data_as_of banner
    Client->>Client: Sync map click, row focus, and selected detail

    Verifier->>StateData: Check ISO ids, enums, invariants, freshness
    Verifier->>Boundary: Check every feature has a matching record
```

The States tab does not call `/api/dashboard`; `section=states` is a URL/navigation state for the browser UI.

## Filter Application Flow

```mermaid
flowchart TD
    Request[HTTP Request] --> Parse[Parse URL Parameters]

    Parse --> Validate{Validate}

    Validate -->|section| S[Section ID]
    Validate -->|house| H[House Filter]
    Validate -->|pm| PM[PM Term Filter]
    Validate -->|status| ST[Bill Stage]
    Validate -->|date| D[Date Filter]
    Validate -->|q| Q[Search Query]

    S --> BuildQuery
    H --> BuildQuery
    PM --> BuildQuery
    ST --> BuildQuery
    D --> BuildQuery
    Q --> BuildQuery

    BuildQuery[Build Prisma Where] --> Apply[Apply to Repository Query]

    Apply --> Counts[Calculate Facet Counts]
    Counts --> StageCounts[Stage Counts]
    Counts --> AreaCounts[Area Counts]
    Counts --> PMCounts[PM Counts]

    Apply --> Pagination[Apply Pagination]
    Pagination --> Shape[Shape Response]

    Shape --> Response[JSON Response]

    style Request fill:#f9f9f9
    style Response fill:#90EE90
```

## Error Handling Flow

```mermaid
flowchart TD
    Request[API Request] --> Route[Route Handler]

    Route --> Try{Try Block}

    Try -->|Success| Process[Process Request]
    Process --> Response[200 OK + JSON]

    Try -->|Error| Catch{Error Type}

    Catch -->|Validation| ValError[400 Bad Request]
    Catch -->|Not Found| NFError[404 Not Found]
    Catch -->|Database| DBError[500 Internal Error]
    Catch -->|AI Service| AIError[503 Service Unavailable]
    Catch -->|Unexpected| UnkError[500 Internal Error]

    ValError --> ErrorResponse[Error JSON Response]
    NFError --> ErrorResponse
    DBError --> ErrorResponse
    AIError --> ErrorResponse
    UnkError --> ErrorResponse

    ErrorResponse --> Log[Log Error]

    style Response fill:#90EE90
    style ErrorResponse fill:#FFB6C1
```
