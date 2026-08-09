# Product Demo Script

Target duration: 105 seconds. Record with the Studio and Manufact Chat preloaded in a clean browser profile.

## 0:00-0:18 - Problem

Show: `01-studio-overview.png` framing, then the live Studio overview.

Say:

> Manufact makes MCP apps fast to build and operate. This short project explores what happens after scaffolding: a constrained way for a team to turn a curated existing API into safe, versioned tools and views without rebuilding the app.

## 0:18-0:40 - Import and Select

Show: Build in the live Studio, then `02-openapi-operation-selection.png` if a stable visual is needed.

Say:

> The Studio imports a deliberately constrained GitHub API description through a bounded server-side path. It classifies operations it supports and lets the owner choose the repository overview, issues, and contributors capabilities that should become MCP tools.

## 0:40-1:00 - Configure

Show: Tools, adjusting a result limit and showing the Summary Card, Data Table, and Ranked List bindings.

Say:

> Rather than expose raw endpoints, the owner refines tool names and descriptions, applies result limits, and selects the view each result uses in an MCP-capable client.

## 1:00-1:17 - Publish

Show: Publish lifecycle and version history.

Say:

> Publishing creates an immutable version. The client-facing MCP URL stays stable while configuration changes remain traceable. Activation is deliberately a separate deployment step in this prototype, rather than embedding personal deployment credentials in the Studio.

## 1:17-1:45 - Run

Show: Manufact Chat executing the prompt and rendering the Repository Briefing.

Prompt:

> Give me a repository briefing for `mcp-use/mcp-use`: summarize the project, show its recent open issues, and list its top contributors.

Say:

> The dedicated Manufact runtime executes the combined Repository Briefing tool and returns a structured summary with interactive issue and contributor views.

## 1:45-1:58 - Close

Show: Safe deployment-history capture briefly, then the rendered briefing.

Say:

> Manufact remains the runtime, hosting, and operating layer. This proof explores a configurable lifecycle above it. The next experiment would connect publishing to Manufact's authorized deployment control plane and test the workflow with product teams.

## Do Not Show

- Sign-in credentials, account names, personal browser profile details, private deployment identifiers, tokens, or environment variables.
- The optional lead-capture reference flow. It is not the application narrative.
- Unrecorded performance claims, customer metrics, or unsupported compatibility claims.
