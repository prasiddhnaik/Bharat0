# BharatZero Diagrams

Visual documentation of the BharatZero architecture, data flows, and system design.

## Available Diagrams

### [Bill Lifecycle](./bill-lifecycle.md)

State machine diagrams showing the legislative journey of bills through Parliament.

- **Ordinary Bill Flow**: Complete lifecycle from draft to enacted law
- **Money Bill Flow**: Special procedure for money bills (Lok Sabha only)
- **Stage Transitions Detail**: Visual flowchart of all possible stage transitions

### [API Flows](./api-flows.md)

Sequence and flow diagrams for API request handling.

- **Dashboard API Flow**: Complete request/response sequence with caching
- **Bill Detail API Flow**: Single bill retrieval with relations
- **AI Analysis API Flow**: Multi-step AI analysis with persistence
- **Filter Application Flow**: How dashboard filters are parsed and applied
- **Error Handling Flow**: Error classification and response handling

### [Frontend Architecture](./frontend-architecture.md)

Component hierarchy and data flow for the React/Svelte frontend.

- **Component Hierarchy**: Full component tree from App to individual widgets
- **Data Flow**: How data flows from server to components
- **Section Routing**: State transitions between different views
- **Filter System Architecture**: Filter state management and URL synchronization
- **Bill Detail View State**: UI state machine for bill selection and analysis

### [State Governance](./state-governance.md)

Static state and Union territory governance model, map/list synchronization, visual cue resolution, and verifier coverage.

- **Static Data Flow**: Governance records plus self-hosted boundary asset into the States tab
- **Interaction Flow**: Map click, row focus, detail panel, and methodology route
- **Visual System**: Alliance palette plus status pattern overlays
- **Verifier Flow**: ISO coverage, map/record parity, invariants, freshness, and optional source URL checks

## Diagram Format

All diagrams use [Mermaid](https://mermaid.js.org/) syntax and can be:

- Viewed directly in GitHub/GitLab (native Mermaid support)
- Rendered in VS Code with the Mermaid extension
- Exported to PNG/SVG using the Mermaid CLI
- Embedded in other Markdown documents

## Rendering Locally

### VS Code

Install the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension for live preview.

### CLI

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Render a diagram to PNG
mmdc -i bill-lifecycle.md -o bill-lifecycle.png

# Render to SVG
mmdc -i api-flows.md -o api-flows.svg
```

### Online

Paste diagram code into:
- [Mermaid Live Editor](https://mermaid.live/)
- [GitHub Markdown preview](https://github.com/github/markup)

## Adding New Diagrams

1. Create a new `.md` file in this directory
2. Use Mermaid syntax within code blocks (```mermaid)
3. Add a link to the new diagram in this README
4. Reference it from relevant documentation files

## Diagram Style Guide

- **Flowcharts**: Top-to-bottom (TD) or left-to-right (LR) based on complexity
- **State Diagrams**: Use `stateDiagram-v2` for clarity
- **Sequence Diagrams**: Left-to-right participant order (Client → Server → DB)
- **Colors**:
  - Success/Complete: `#90EE90` (light green)
  - Error/Failure: `#FFB6C1` (light pink)
  - Neutral/Default: `#f9f9f9` (light gray)
  - Accent: Use brand colors from the application

## Related Documentation

- [Architecture Overview](../ARCHITECTURE.md)
- [API Reference](../API_REFERENCE.md)
- [Developer Guide](../DEVELOPER_GUIDE.md)
