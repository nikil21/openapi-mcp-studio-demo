# From Existing API to Versioned MCP App: A Product Experiment Built on Manufact

**Live product:** [Configurable MCP App Builder](https://openapi-mcp-studio-demo-82ptvk1y0-nikil22.vercel.app)  
**Demo:** [Product video](https://drive.google.com/file/d/1jRvy0yR9_62vx6_vMXqhlR_VB--8MpKz/view?usp=sharing)  
**Source:** [GitHub repository](https://github.com/nikil21/openapi-mcp-studio-demo)

## Observation

Manufact provides a strong foundation for building, deploying, inspecting, and operating MCP applications. A separate problem begins once a team has an API and an initial application: deciding which capabilities should become agent tools, how those tools should be constrained, how results should render, and how the application should change after its first implementation.

This project explores a narrow lifecycle layer above Manufact. The premise is not that every OpenAPI document should automatically become an MCP server. Instead, a product team should be able to curate a known-safe subset, define the contract and presentation for each capability, and version those decisions without requiring code changes for every implementation detail.

## Prototype

Configurable MCP App Builder is a personal clean-room proof built with public APIs, personal accounts, and Manufact tooling. It uses a curated GitHub API subset as its concrete example. A Studio user can:

- Import the approved API description through a bounded server-side path and review supported operations.
- Select repository overview, issues, and contributors as read-only MCP capabilities.
- Refine tool names, descriptions, result limits, and view bindings.
- Bind results to Summary Card, Data Table, and Ranked List MCP App views.
- Compose a constrained Repository Briefing flow.
- Save drafts, publish immutable versions, and review version/audit state.
- Run the result through a stable Manufact-hosted MCP URL.

The Studio handles the configuration and release-lifecycle layer. Manufact remains the MCP runtime, deployment, inspection, and operations layer. Publishing creates an immutable desired configuration; activation is intentionally a separate, auditable runtime redeploy in this proof rather than an automated deployment action backed by a personal credential.

## What It Proves

The proof demonstrates that a small API surface can be represented as editable configuration rather than one-off tool code. Tool semantics, result limits, and UI behavior can change while the client-facing runtime URL remains stable. Immutable versions and explicit activation create a clear boundary between editing configuration and changing a running application.

It also demonstrates the practical seams between a configuration experience and the Manufact platform: Studio projects are owner-scoped, changes are versioned, the runtime stays dedicated to the project, and the final briefing runs through Manufact Chat with rendered results. The public repository includes the architecture, security boundary, test results, live QA checklist, and a short demo video.

## What It Does Not Prove

This is deliberately not a general OpenAPI-to-MCP product claim. It does not prove arbitrary specification compatibility, general OAuth mapping, generic write-action generation, enterprise team administration, automated store publishing, or paying-customer demand. The GitHub example is intentionally read-only and bounded to three curated GET operations. The optional lead-capture flow is a fixed sandbox safety reference, not the primary product narrative or a generic CRM integration.

The proof also does not automate runtime activation. Doing that correctly requires authorized Manufact deployment control, account permissions, and audit handling. Keeping that step explicit makes the boundary visible rather than embedding a personal deployment secret in the Studio.

## Why This Could Matter to Manufact

Manufact can remain the system responsible for runtime, hosting, testing, inspection, deployment, and operational visibility. A constrained configuration layer could complement that infrastructure for teams that already have an API but need help turning selected capabilities into a product-ready MCP application.

The hypothesis is that this could reduce the distance between an existing API and a first useful MCP interaction, while making post-launch changes easier to reason about. It may improve signup-to-first-deployment conversion, time to first successful tool call, publishing-check success, and the number of changes a team can ship without repeated implementation work. These are hypotheses to measure, not outcomes claimed by this prototype.

## Proposed Experiment

Test the workflow with three to five product teams that already have an API and want a ChatGPT or Claude application. Start with an intentionally constrained set of read-only operations and a standard view vocabulary. Measure time from API import to first live tool call, percentage of successful configurations completed without code edits, number of operations curated successfully, support time per application, publishing-check pass rate, post-launch configuration changes, and production tool-call volume.

The goal is not to prescribe a new product direction prematurely. It is to learn whether configuration and versioning are a meaningful layer for teams using Manufact, where the workflow fails, and which parts should remain deliberately code- or permission-controlled.

## Why Me

I built this clean-room proof personally to make the question concrete: a hosted Studio, constrained API import, owner-scoped versioning, an explicit release boundary, and a dedicated Manufact runtime. I am interested in testing the workflow with users, learning from the results, and earning broader product ownership through execution.

For detailed technical context, see the [architecture](../architecture.md), [threat model](../threat-model.md), and [build report](../../BUILD_REPORT.md).
