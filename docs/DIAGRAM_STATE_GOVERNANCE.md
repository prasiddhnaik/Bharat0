# State Governance Diagrams

Visual documentation for the States tab. V1 is static and source-backed: the governance records live in TypeScript, the boundary geometry is self-hosted, and the verifier guards coverage and freshness.

## Static Data Flow

```mermaid
flowchart LR
    subgraph Sources["Source Inputs"]
        GovernanceSources["Governance source links<br/>shown per row"]
        BoundarySource["Bharat Maps / Survey of India<br/>boundary service"]
    end

    subgraph StaticFiles["Committed Static Files"]
        Records["state-governance.ts<br/>36 ISO 3166-2:IN records"]
        Boundaries["india-state-boundaries.ts<br/>simplified local SVG paths"]
    end

    subgraph UI["States Tab"]
        StatesSection["StatesSection.tsx"]
        Map["keyboard-focusable SVG map"]
        List["accessible governance list"]
        Detail["detail panel / tooltip copy"]
        Methodology["/methodology"]
    end

    GovernanceSources --> Records
    BoundarySource --> Boundaries
    Records --> StatesSection
    Boundaries --> StatesSection
    StatesSection --> Map
    StatesSection --> List
    StatesSection --> Detail
    StatesSection --> Methodology
```

## Interaction Flow

```mermaid
stateDiagram-v2
    [*] --> DefaultSelection
    DefaultSelection --> MapPreview: SVG focus
    MapPreview --> DefaultSelection: blur
    DefaultSelection --> Selected: map click
    DefaultSelection --> Selected: row click
    DefaultSelection --> Selected: row focus
    Selected --> RowScrolled: map click scrolls row into view
    Selected --> RegionPulse: row click or focus pulses map region
    RowScrolled --> Selected
    RegionPulse --> Selected
    Selected --> Methodology: methodology link
```

Keyboard focus previews/selects without forcing the page to jump; explicit map clicks scroll the matching row.

## Visual Resolution

```mermaid
flowchart TD
    Record["StateGovernanceRecord"] --> Alliance{"alliance"}
    Alliance -->|NDA| Saffron["NDA palette"]
    Alliance -->|INDIA| Blue["INDIA palette"]
    Alliance -->|regional| Teal["Regional palette"]
    Alliance -->|left| Red["Left palette"]
    Alliance -->|none| Grey["None palette"]

    Record --> Status{"status"}
    Status -->|active_majority| Solid["solid fill"]
    Status -->|active_coalition| Stripe["diagonal stripe"]
    Status -->|presidents_rule| Hatch["grey dense hatch"]
    Status -->|caretaker| Dash["alliance color + dashed stroke"]
    Status -->|centrally_administered| Muted["light grey muted style"]

    Saffron --> Visual["getStateGovernanceVisual()"]
    Blue --> Visual
    Teal --> Visual
    Red --> Visual
    Grey --> Visual
    Solid --> Visual
    Stripe --> Visual
    Hatch --> Visual
    Dash --> Visual
    Muted --> Visual
```

All colors resolve through `STATE_GOVERNANCE_VISUAL_PALETTE`; components do not define separate map hex values.

## Verification Flow

```mermaid
flowchart TB
    Command["npm run verify:state-governance"] --> IDs["official ISO state/UT ids appear once"]
    Command --> MapParity["every map feature has one matching record"]
    Command --> Enums["status, alliance, confidence enum checks"]
    Command --> Invariants["per-status governance invariants"]
    Command --> Visuals["palette and status visual checks"]
    Command --> Fields["tooltip/table field order lock"]
    Command --> Freshness["data_as_of and last_verified <= 90 days"]
    Command -. "--check-source-urls" .-> Sources["source URLs respond"]

    IDs --> Pass["pass"]
    MapParity --> Pass
    Enums --> Pass
    Invariants --> Pass
    Visuals --> Pass
    Fields --> Pass
    Freshness --> Pass
    Sources --> Pass
```

`verify:data-pipeline` includes `verify:state-governance`, so the static States tab is checked with the rest of the project verification path.
