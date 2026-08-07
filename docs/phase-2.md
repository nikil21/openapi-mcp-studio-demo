# Phase 2 Plan

## Outcome

Phase 1 proves a configuration-driven path from a curated OpenAPI subset to safe MCP tools and reusable views. Phase 2 tests the self-serve product thesis: a user should be able to create a project, import an API, configure tools and views, test the result, publish an immutable configuration version, and observe that version in the deployed MCP runtime.

## Architecture

```text
Standalone Studio (React/Vite)
  -> Studio API and configuration persistence
  -> draft and published configuration versions
  -> existing Manufact-hosted MCP runtime
  -> Inspector, Manufact Chat, and MCP-compatible clients
```

The Studio is deliberately separate from the runtime. Browser code owns only draft editing and preview. Server-side code validates and publishes configurations. The MCP runtime loads only a published configuration version. No browser token may directly mutate the runtime.

## Milestones

### 2.0: Studio Foundation

- Scaffold a standalone React/Vite application under `studio/`.
- Establish product navigation: Projects, Build, Tools, Views, Flows, Test, Publish.
- Define project, draft, published-version, tool, view, and flow models.
- Use local fixture persistence only while the product contract is still changing.

Exit: A separate local Studio app loads a sample project and shows its build lifecycle.

### 2.1: API Import and Tool Curation

- Paste a remote OpenAPI URL and fetch it through a server-side boundary.
- Validate OpenAPI 3.x, show parse status, and classify supported operations.
- Add operation search, selection, parameter mapping, annotations, and safe defaults.
- Generate candidate tool names/descriptions deterministically; use AI assistance only as optional drafting.

Exit: A user can import a supported API and create a bounded tool draft without hand-writing schemas.

Local implementation note: Phase 2.1 includes a local Studio import API at `studio/server/import-api.mjs`. It accepts public HTTPS JSON only, rejects private/local targets and redirects, applies a timeout and response-size cap, and returns safe import errors. Hosting this API belongs to Phase 2.5.

### 2.2: View Builder and Preview

- Provide a gallery for Summary Card, Data Table, Ranked List, Lead Form, Confirmation, and Success templates.
- Bind returned fields to template properties using controlled property panels.
- Support column ordering and simple field layout with `dnd-kit`.
- Preview loading, empty, success, and error states against fixture or test-tool data.

Exit: A user can see and configure the UI attached to every tool before publishing.

Local implementation note: Phase 2.2 provides a controlled template gallery, editable field-path bindings, and fixture-backed previews for the three initial templates. It does not yet infer fields from arbitrary response schemas, persist edits, reorder components by drag-and-drop, or apply the draft to the deployed runtime.

### 2.3: Publish Lifecycle

- Persist projects, drafts, versions, and audit metadata in Supabase or Neon/Postgres.
- Validate config server-side before publish.
- Show configuration diff, required environment variables, validation findings, and rollback target.
- Publish immutable versions and expose the currently active version to the runtime.

Exit: Publishing a config version changes the runtime only through a validated, traceable release path.

Implementation note: the initial Supabase schema and local environment contract are in `studio/supabase/` and `studio/.env.example`. See [`supabase-setup.md`](supabase-setup.md) for the account setup boundary.

Local implementation note: Phase 2.3 now persists projects and immutable draft/published/superseded versions through the server-side Studio API. Publishing transactionally updates the active Studio version and audit log. It does not yet make the Manufact-hosted runtime load that version; that requires the next runtime activation integration.

Runtime activation note: the GitHub demo runtime can now load the active published Studio version on process startup. See [`runtime-activation.md`](runtime-activation.md). Deployment remains an explicit operation after environment variables are set in Manufact Cloud.

### 2.4: Constrained Flow Builder

- Build linear flows with a maximum of five nodes using React Flow / XYFlow.
- Support collect-input, tool-call, condition, confirmation, and result-view nodes.
- Bind step inputs from user input, constants, and prior output fields.
- Add a test run with a visible execution trace.
- Ship one reference flow: Repository Briefing or Lead Capture.

Exit: A configured flow can be tested and rendered as one MCP-facing experience.

Local implementation note: Phase 2.4 now includes a Repository Briefing flow built with React Flow / XYFlow. It supports shared repository inputs, optional issues/contributors steps, one success condition, a terminal briefing view, draggable canvas layout, and a fixture execution trace. Flow persistence and runtime execution are intentionally deferred until the Studio flow contract is added to published runtime configurations.

### 2.5: Production Proof

- Host the standalone Studio.
- Connect it to the deployed Manufact runtime.
- Add screenshots, demo video, architecture update, limitations, and security review.
- Run a five-user interview or usability test focused on time-to-first-tool and publish comprehension.

Exit: A founder can use one URL to understand the self-serve lifecycle and one live MCP URL to test the result.

## Scope Guardrails

Include only controlled templates, bounded flows, server-side validation, versioned publish, and read-only examples first. The Lead Capture reference may introduce one confirmation-gated write action after the rest of the lifecycle is proven.

Do not build arbitrary code blocks, arbitrary workflow DAGs, background jobs, autonomous loops, broad OAuth support, full OpenAPI compatibility, a generic drag-and-drop website builder, or multi-tenant billing in Phase 2.

## Required Resources

- A free Vercel or Netlify account for hosting the standalone Studio when it is ready.
- A free Supabase or Neon project for persistent projects and configuration versions at Milestone 2.3.
- Existing Manufact Cloud project for the runtime.
- A Manufact API key only if automated release/deploy is added.
- GitHub OAuth/App approval only if the Studio creates commits or pull requests.

No external account or secret is needed for Milestone 2.0.
