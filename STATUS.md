# Status

## Milestone 0: Toolchain

Status: Phase 1 complete and publicly deployed. Phase 2.3 Studio persistence and publish lifecycle complete locally.

Completed on 2026-08-05:

- Read the current mcp-use v2 and Manufact Cloud documentation.
- Scaffolded the official MCP Apps template with `create-mcp-use-app`.
- Initialized a local Git repository on the `main` branch; no remote or commit has been created.
- Installed dependencies and ran the unmodified development server.
- Verified the Inspector endpoint at `http://localhost:3000/mcp/inspector`.
- Connected the headless Inspector client and invoked the stock `show-app` tool successfully.
- Ran `npm run typecheck` and `npm run build` successfully.
- Authenticated the Manufact CLI and deployed the unmodified template using Manufact-managed source.
- Verified the live endpoint with the headless Inspector client.
- Added a Zod-validated declarative app configuration with HTTPS, allowlist, tool-count, and unique-name validation.
- Added the bundled public GitHub OpenAPI subset and an unsupported OpenAPI fixture.
- Implemented GET-focused support classification and the `open-studio` catalog tool with a bound Studio MCP App view.
- Added Vitest coverage for configuration validation and parser classification.
- Load and validate the checked-in configuration before registering tools.
- Registered `get_repository_overview`, `list_repository_issues`, and `list_top_contributors` from configuration.
- Added safe GET execution, path/query mapping, result normalization, request IDs, and structured logs.
- Added parameter mapping, HTTP execution, and normalization tests.
- Added browser-local Studio configuration editing, schema validation, save, and JSON export.
- Bound configured runtime tools to SummaryCard, DataTable, and RankedList views.
- Added responsive, loading, empty, error, and dark-mode states to all result views.

Verification results:

- Inspector endpoint: HTTP 200.
- Registered tools: `show-app`, `say-hello`.
- `show-app` returned structured content and the `my-view` UI resource.
- Production build output: `.mcp-use/build/index.js`.
- The stock template defines no `lint` or `test` scripts.
- Milestone 2 tests: 12 passing.
- `npm run typecheck`, `npm run build`, and the mcp-use v2 compatibility check pass.
- The local `open-studio` tool returns three supported operations, one explicitly unsupported write operation, and `ui://views/studio.html`.
- All three configured GitHub tools executed successfully in the local Inspector client against `mcp-use/mcp-use`.
- Inspector responses confirm the configured view resources: `summary-card`, `data-table`, and `ranked-list`.
- Fixed Studio browser loading by removing its direct import of the server-side schema, which caused a cross-origin request in the Inspector iframe.
- Final dependency audit: zero production vulnerabilities.
- Fixed issue result limiting by over-fetching GitHub issue rows before filtering pull requests; the table now returns the requested number of actual issues.
- Final test suite: 13 passing tests.
- Published the project at `https://github.com/nikil21/openapi-mcp-studio-demo`.
- Deployed the completed Studio to Manufact Cloud at `https://keen-forge-ocsbv.run.mcp-use.com/mcp`.
- Verified all three public GitHub tools and their SummaryCard, DataTable, and RankedList UI resources after configuring the optional server-side GitHub token.
- Added a standalone React/Vite Studio application in `studio/` with project lifecycle navigation, draft/published-version framing, runtime contract visibility, and local fixture mode.
- Studio foundation verification: lint and production build pass; local shell responds at `http://127.0.0.1:5173`.
- Added a local Studio import API with public-HTTPS validation, private-network rejection, redirect blocking, timeout, and response cap.
- Added remote OpenAPI import, focused support classification, three-tool selection, and editable local tool drafts to the standalone Studio.
- Verified import of the public GitHub fixture and rejection of a localhost HTTP URL; Studio lint and production build pass.
- Added a standalone Views workspace with Summary Card, Data Table, and Ranked List template selection.
- Added controlled draft field bindings and fixture-backed previews for each template mode.
- Studio lint and production build pass after the Phase 2.2 view-builder work.
- Connected the local Studio API to Supabase through a server-only service-role key.
- Added persisted projects, immutable draft/published/superseded configuration versions, active-version pointer updates, and audit events.
- Verified project creation, invalid-config rejection, draft version creation, transactional publish, automatic supersession, audit retrieval, and persistence health.
- Screenshot rendering through the mcp-use CLI timed out waiting for readiness; the tool and bound view resource were verified, but visual screenshot verification remains outstanding.
- Deployment status: running.
- Live MCP URL: `https://keen-forge-ocsbv.run.mcp-use.com/mcp`.
- Live chat URL: `https://keen-forge-ocsbv.run.mcp-use.com/chat`.
- Manufact server ID: `0a56bdee-9c8a-46e8-a51a-07a08f72579d`.

Next tasks:

1. Integrate the published Studio version into a controlled runtime activation path for the Manufact-hosted MCP server.
2. Implement Phase 2.4 constrained flow builder after activation semantics are defined.
3. Capture manual Inspector screenshots; the framework screenshot CLI still times out waiting for view readiness.
