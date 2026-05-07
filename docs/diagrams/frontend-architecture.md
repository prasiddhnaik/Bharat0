# Frontend Component Architecture

## Component Hierarchy Overview

### Application Entry & Shell

```mermaid
flowchart LR
    subgraph Entry["Application Entry"]
        direction TB
        Main[main.tsx<br/>React Entry Point]
        App[App.tsx<br/>Root Component]
    end

    subgraph Shell["App Shell Layer"]
        direction TB
        AppShell[AppShell.svelte<br/>Layout Container]
        SectionTabs[SectionTabs.svelte<br/>Navigation Tabs]
        SearchCommand[SearchCommand.svelte<br/>Global Search]
    end

    subgraph Layout["Layout Components"]
        direction TB
        FilterBar[FilterBar.svelte<br/>Filter Controls]
        BillDetail[BillDetailPanel.svelte<br/>Side Panel]
    end

    Main --> App
    App --> AppShell

    AppShell --> SectionTabs
    AppShell --> SearchCommand
    AppShell --> FilterBar
    AppShell -.-> BillDetail

    style Entry fill:#f9f9f9
    style Shell fill:#e6f3ff
    style Layout fill:#fff4e6
```

### Section Views (Primary Content Areas)

```mermaid
flowchart LR
    subgraph Sections["Section Views"]
        direction TB

        subgraph Primary["Primary Views"]
            Overview[Overview Section<br/>Dashboard Summary]
            Bills[Bills Section<br/>Bill List + Detail]
            Timeline[Timeline Section<br/>Chronological Events]
            Houses[Houses Section<br/>Parliament Info]
            States[States Section<br/>Governance Map + List]
        end

        subgraph Secondary["Secondary Views"]
            Committees[Committees Section<br/>Committee List]
            Questions[Questions Section<br/>Parliamentary Questions]
            Debates[Debates Section<br/>Debate Records]
            Acts[Acts Section<br/>Enacted Laws]
            Sources[Sources Section<br/>Data Sources]
        end
    end

    Overview --> Bills
    Overview --> Timeline
    Bills --> Acts
    Timeline --> Bills
    Houses --> Overview
    States --> Methodology[Methodology Route]

    Bills --> Committees
    Bills --> Questions
    Bills --> Debates
    Bills --> Acts
    Bills --> Sources

    style Primary fill:#e6f3ff
    style Secondary fill:#f0f0f0
```

### Bill Component Hierarchy

```mermaid
flowchart TB
    subgraph BillTree["Bill Components Tree"]
        direction TB

        BillList[BillList.svelte<br/>List Container]

        subgraph BillItems["Bill Items"]
            BillCard[BillCard.svelte<br/>Individual Bill Card]
            StatusBadge[StatusBadge.svelte<br/>Stage Indicator]
            SourceBadge[SourceBadge.svelte<br/>Source Attribution]
        end

        subgraph BillDetailView["Bill Detail Panel"]
            BillDetail[BillDetailPanel.svelte<br/>Side Panel]
            BillDetailStatus[StatusBadge<br/>Current Stage]
        end
    end

    BillList --> BillCard
    BillCard --> StatusBadge
    BillCard --> SourceBadge

    BillList -.-> BillDetail
    BillDetail --> BillDetailStatus

    style BillTree fill:#f9f9f9
    style BillItems fill:#e6f3ff
    style BillDetailView fill:#fff4e6
```

### Timeline Component Hierarchy

```mermaid
flowchart TB
    subgraph TimelineTree["Timeline Components"]
        direction TB

        TimelineRail[TimelineRail.svelte<br/>Date Rail Sidebar]

        subgraph DateCards["Date Cards"]
            TimelineDayCard[TimelineDayCard.svelte<br/>Day Event Container]
            EventChip[EventChip.svelte<br/>Individual Event]
        end

        subgraph EventTypes["Event Types"]
            BillEvent[Bill Introduced]
            DebateEvent[Debate Held]
            QuestionEvent[Question Listed]
            SittingEvent[Sitting Day]
        end
    end

    TimelineRail --> TimelineDayCard
    TimelineDayCard --> EventChip
    EventChip -.-> BillEvent
    EventChip -.-> DebateEvent
    EventChip -.-> QuestionEvent
    EventChip -.-> SittingEvent

    style TimelineTree fill:#f9f9f9
    style DateCards fill:#e6f3ff
    style EventTypes fill:#f0fff0
```

### Filter Components

```mermaid
flowchart LR
    subgraph FilterTree["Filter Component Tree"]
        direction TB

        FilterBar[FilterBar.svelte<br/>Filter Bar Container]

        subgraph FilterControls["Filter Controls"]
            SessionPicker[SessionPicker.svelte<br/>Session Selector]
            HouseSwitcher[HouseSwitcher.svelte<br/>House Toggle]
        end

        subgraph DerivedFilters["Derived State"]
            URLParams[URL Parameters]
            PMFilter[Prime Minister Filter]
            DateFilter[Date Filter]
            StatusFilter[Bill Stage Filter]
        end
    end

    FilterBar --> SessionPicker
    FilterBar --> HouseSwitcher

    URLParams -.-> PMFilter
    URLParams -.-> DateFilter
    URLParams -.-> StatusFilter

    style FilterTree fill:#f9f9f9
    style FilterControls fill:#fff4e6
    style DerivedFilters fill:#f0f0f0
```

### Shared Components (Reusable UI)

```mermaid
flowchart LR
    subgraph Shared["Shared Component Library"]
        direction TB

        subgraph Badges["Badges & Indicators"]
            StatusBadge[StatusBadge.svelte<br/>Bill Stage Badge]
            SourceBadge[SourceBadge.svelte<br/>Data Source Badge]
        end

        subgraph States["State Components"]
            Loading[LoadingSkeleton.svelte<br/>Loading Placeholder]
            Empty[EmptyState.svelte<br/>Empty State Message]
        end

        subgraph ShellUI["Shell Components"]
            Search[SearchCommand.svelte<br/>Command Palette]
            Tabs[SectionTabs.svelte<br/>Navigation Tabs]
        end
    end

    StatusBadge ~~~ SourceBadge
    Loading ~~~ Empty
    Search ~~~ Tabs

    style Shared fill:#f9f9f9
    style Badges fill:#e6f3ff
    style States fill:#fff4e6
    style ShellUI fill:#f0fff0
```

### Complete Component Map

```mermaid
flowchart TB
    subgraph Root["📦 Application Root"]
        Main[main.tsx]
        App[App.tsx]
    end

    subgraph AppShell["🏗️ App Shell"]
        Shell[AppShell.svelte]
        Tabs[SectionTabs.svelte]
        Search[SearchCommand.svelte]
    end

    subgraph Content["📄 Content Areas"]
        FilterBar[FilterBar.svelte]

        subgraph Sections["Section Views"]
            Overview[Overview]
            Bills[Bills]
            Timeline[Timeline]
            Houses[Houses]
            States[States]
            Committees[Committees]
            Questions[Questions]
            Debates[Debates]
            Acts[Acts]
            Sources[Sources]
        end
    end

    subgraph Components["🧩 Feature Components"]
        subgraph BillFeature["Bill Feature"]
            BillList[BillList.svelte]
            BillCard[BillCard.svelte]
            BillDetail[BillDetailPanel.svelte]
        end

        subgraph TimelineFeature["Timeline Feature"]
            TimelineRail[TimelineRail.svelte]
            TimelineCard[TimelineDayCard.svelte]
            EventChip[EventChip.svelte]
        end

        subgraph FilterFeature["Filter Feature"]
            SessionPicker[SessionPicker.svelte]
            HouseSwitcher[HouseSwitcher.svelte]
        end

        subgraph StatesFeature["States Feature"]
            StatesSection[StatesSection.tsx]
            StateGov[State Governance Data]
            IndiaMap[India Boundary Asset]
        end
    end

    subgraph Shared["🎨 Shared UI"]
        StatusBadge[StatusBadge.svelte]
        SourceBadge[SourceBadge.svelte]
        EmptyState[EmptyState.svelte]
        Loading[LoadingSkeleton.svelte]
    end

    Main --> App
    App --> Shell
    Shell --> Tabs
    Shell --> Search
    Shell --> FilterBar

    Shell --> Overview
    Shell --> Bills
    Shell --> Timeline
    Shell --> Houses
    Shell --> States
    Shell --> Committees
    Shell --> Questions
    Shell --> Debates
    Shell --> Acts
    Shell --> Sources

    Bills --> BillList
    BillList --> BillCard
    Bills -.-> BillDetail

    Overview --> BillList
    Overview --> TimelineRail
    Timeline --> TimelineRail
    TimelineRail --> TimelineCard
    TimelineCard --> EventChip

    FilterBar --> SessionPicker
    FilterBar --> HouseSwitcher

    States --> StatesSection
    StatesSection --> StateGov
    StatesSection --> IndiaMap

    BillCard --> StatusBadge
    BillCard --> SourceBadge
    BillDetail --> StatusBadge

    Committees --> EmptyState
    Questions --> EmptyState
    Debates --> EmptyState

    style Root fill:#f9f9f9
    style AppShell fill:#e6f3ff
    style Content fill:#fff4e6
    style Components fill:#f0fff0
    style Shared fill:#f0f0f0
```

## Data Flow

```mermaid
flowchart TD
    subgraph DataSource["Data Sources"]
        ServerLoad[+page.server.ts]
        API[API Client]
    end

    subgraph StateManagement["State Management"]
        Props[Component Props]
        Derived[$derived stores]
        URL[URL State]
    end

    subgraph Components["Components"]
        Parent[Parent Component]
        Child[Child Components]
        Snippets[Svelte Snippets]
    end

    subgraph Actions["User Actions"]
        Click[Click Events]
        Filter[Filter Changes]
        Navigate[Navigation]
    end

    ServerLoad --> Props
    API --> Props

    Props --> Derived
    URL --> Derived

    Props --> Parent
    Derived --> Parent

    Parent --> Snippets
    Parent --> Child

    Click --> Navigate
    Filter --> Navigate
    Navigate --> URL

    URL --> ServerLoad
```

## State Governance Tab Flow

```mermaid
flowchart LR
    subgraph StaticData["Static Data"]
        StateGov["state-governance.ts<br/>records + palette + field order"]
        Boundary["india-state-boundaries.ts<br/>self-hosted SVG paths"]
    end

    subgraph StatesUI["StatesSection.tsx"]
        Map[Map Hero]
        List[Governance List]
        Detail[Detail Panel]
        Methodology["/methodology"]
    end

    StateGov --> Map
    StateGov --> List
    StateGov --> Detail
    Boundary --> Map
    Map -->|click| List
    List -->|focus/click| Map
    Detail --> Methodology

    style StaticData fill:#f9f9f9
    style StatesUI fill:#e6f3ff
```

## Section Routing

```mermaid
stateDiagram-v2
    [*] --> Overview: Default

    Overview --> Bills: View All Bills
    Overview --> Timeline: View Timeline
    Overview --> Houses: View Houses
    Overview --> States: View States

    Bills --> BillDetail: Select Bill
    BillDetail --> Bills: Back

    Timeline --> DateDetail: Select Date
    DateDetail --> Timeline: Back

    Bills --> Committees: Switch Section
    Bills --> Questions: Switch Section
    Bills --> Debates: Switch Section
    Bills --> Acts: Switch Section
    Bills --> Sources: Switch Section

    Committees --> Bills: Switch Back
    Questions --> Bills: Switch Back
    Debates --> Bills: Switch Back
    Acts --> Bills: Switch Back
    Sources --> Bills: Switch Back

    Houses --> Overview: Switch Back
    States --> Methodology: Open methodology
    Methodology --> States: Back to map
    States --> Overview: Switch Back

    Overview --> [*]: Close
```

## Filter System Architecture

```mermaid
flowchart LR
    subgraph Inputs["Filter Inputs"]
        URLParams[URL Parameters]
        UserInput[User Input]
    end

    subgraph Parsing["Filter Parsing"]
        Parse[parseDashboardFilters]
        Validate{Validation}
        Defaults[Apply Defaults]
    end

    subgraph State["Filter State"]
        Section[section: SectionId]
        House[house: House | 'all']
        PM[primeMinister: PMFilter]
        Status[status: BillStage | 'all']
        Date[date: string]
        Query[query: string]
        Page[page: number]
    end

    subgraph Application["Filter Application"]
        BuildURL[Build Href]
        UpdateState[Update $derived]
        Refetch[Trigger Data Load]
    end

    URLParams --> Parse
    UserInput --> Parse

    Parse --> Validate
    Validate -->|Invalid| Defaults
    Validate -->|Valid| State
    Defaults --> State

    State --> BuildURL
    State --> UpdateState
    UpdateState --> Refetch

    Refetch --> ServerLoad[+page.server.ts]
    BuildURL --> History[History API]
```

## Bill Detail View State

```mermaid
stateDiagram-v2
    [*] --> ListView: Initial Load

    ListView --> Selected: Click Bill
    Selected --> DetailPanel: Show Detail

    DetailPanel --> AnalysisRequested: Request AI Analysis
    AnalysisRequested --> AnalysisLoading: Loading State

    AnalysisLoading --> AnalysisReady: Analysis Complete
    AnalysisLoading --> AnalysisError: Analysis Failed

    AnalysisReady --> DetailPanel: Show Analysis
    AnalysisError --> DetailPanel: Show Error

    DetailPanel --> ListView: Close Detail
    Selected --> ListView: Deselect

    ListView --> [*]: Navigate Away
```
