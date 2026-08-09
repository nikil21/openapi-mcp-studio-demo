# Decisions

## 2026-08-05: Use the official MCP Apps template

The project was scaffolded with the required official command:

```bash
npx -y create-mcp-use-app@latest openapi-mcp-studio-demo --template mcp-apps
```

This keeps the prototype on the current mcp-use v2 server and React view workflow.

## 2026-08-05: Use Node 24 for project commands

The generated project requires Node `>=22.22.2`. The default shell runtime is Node 18.20.8, which cannot execute the current scaffolder. Node 24.9.0 is available through Homebrew and was used by prepending `/opt/homebrew/opt/node/bin` to `PATH` for scaffold, install, development, and verification commands. No global runtime configuration was changed.

## 2026-08-05: Require owner approval before Manufact authentication and deployment

Manufact deployment requires CLI login. The project owner approved the login and a managed-source deployment. No GitHub organization repository was created or authorized.

## 2026-08-05: Keep Milestone 0 unmodified

No product code has been added. The stock template remains intact so the first deployment will verify the platform toolchain independently of Studio implementation work.

## 2026-08-05: Initialize local source control only

A local Git repository was initialized on `main` to establish the clean-room project history. No remote repository, organization, or commit has been created; those remain outside the pre-authentication boundary.

## 2026-08-05: Use Manufact-managed source for the first deployment

The unmodified template was deployed with `mcp-use deploy --no-github -y` to validate Manufact independently of GitHub setup. The resulting deployment is running at `https://keen-forge-ocsbv.run.mcp-use.com/mcp`. The local Git repository remains the planned source of record and can be pushed to a personal GitHub repository later.

## 2026-08-05: Support a narrow OpenAPI subset first

Milestone 1 supports OpenAPI 3.x GET operations with inline path/query parameters, primitive schemas, and declared JSON responses. Write operations, request bodies, referenced parameters, and composition are shown as unsupported. This keeps the first end-to-end path secure and testable instead of implying broad OpenAPI compatibility.

## 2026-08-05: Keep configuration declarative and bounded

`data/app-config.json` separates API settings, tool semantics, and view bindings. The schema requires HTTPS, an allowlist containing the base API host, unique lowercase snake_case tool names, and no more than three tools. Runtime loading and execution are deferred to Milestone 2.

## 2026-08-05: Register runtime tools from validated configuration

At startup, the runtime validates the checked-in config and matches each configured operation to the parser catalog. It refuses an unknown or unsupported operation before tool registration. The current config maps the user-facing `limit` input to GitHub's `per_page` query parameter.

## 2026-08-05: Constrain all upstream HTTP calls

The executor accepts only configured allowlisted HTTPS hosts, uses GET with server-owned headers, does not follow redirects, has a 10-second timeout and 1 MB body cap, and keeps optional bearer tokens exclusively in the environment. It logs request ID, tool, host, path template, status, and duration without credentials or request data.

## 2026-08-05: Keep Studio edits local and explicit

The Studio validates its working configuration using the same Zod schema as the server, persists it only in browser local storage, and exports a JSON file. It does not mutate the running server or deployed configuration. This makes the prototype boundary explicit and avoids presenting an unsafe browser-to-runtime configuration write path as production ready.

## 2026-08-05: Bind three reusable result views

The configured view type maps to a summary card, issue table, or ranked contributor list. Views consume the shared normalized runtime result envelope and handle pending, error, empty, narrow, and dark-mode states without duplicating GitHub response parsing in the browser.

## 2026-08-05: Keep browser views independent of server modules

The Inspector renders views in an iframe with a distinct origin. The Studio therefore must not import executable files from `src/`, which are server-side implementation modules. It uses a focused browser-local validator for save/export, while the server-side Zod schema remains authoritative for startup and runtime configuration.

## 2026-08-05: Over-fetch GitHub issues before filtering pull requests

GitHub's issues endpoint also returns pull requests. For the issue tool, the executor requests a bounded larger page, filters pull requests during normalization, then applies the user-facing result limit. This preserves the requested issue count without exceeding the 100-item GitHub page cap.

## 2026-08-05: Defer flow configuration to Phase 2

Phase 2 will test a constrained flow builder for sequences of configured tools, field mappings, conditions, and explicit confirmations. Arbitrary workflows, background work, autonomous loops, and write paths remain out of scope until durable execution, authorization, and audit requirements are designed.

## 2026-08-05: Use an optional server-side GitHub token in production

Unauthenticated GitHub requests from the shared Manufact egress IP reached GitHub's rate limit. The optional `GITHUB_TOKEN` environment variable was configured in Manufact Cloud and is not stored in this repository, emitted by the Studio, or logged by the runtime. The public deployment was then verified with all three configured tools.

## 2026-08-05: Separate the Phase 2 Studio from the MCP runtime

Phase 2 will create a standalone Studio application. The current MCP App Studio remains a useful Phase 1 proof and runtime-facing surface, but a standalone app is required for projects, durable configuration, preview, and a safe publish lifecycle. The browser edits drafts only; server-side validation and versioning control runtime changes.

## 2026-08-06: Start the standalone Studio in local fixture mode

The Phase 2.0 Studio uses a separate React/Vite application under `studio/`. It establishes the project lifecycle and release vocabulary before external persistence is introduced. This avoids prematurely committing to a database provider or exposing credentials in browser code; Supabase or Neon becomes necessary at the publish-lifecycle milestone.

## 2026-08-06: Import remote specifications through a local API boundary

The standalone Studio does not fetch arbitrary URLs in browser code. Its local import API requires HTTPS, resolves and rejects private/local network targets, disallows redirects, limits response size, and uses a timeout. This is a development implementation of the server-side import boundary; it must be hosted with the Studio before public use.

## 2026-08-06: Use constrained templates before a drag-and-drop canvas

The Phase 2 View workspace offers three controlled templates and editable field-path bindings with fixture previews. This demonstrates intentional UI binding without presenting a generic page builder as an MCP product capability. Response-schema field discovery, component reordering, and a drag-and-drop editor remain later enhancements after persistence and publish lifecycle work.

## 2026-08-06: Publish immutable Studio versions through Supabase

The Studio API uses the server-only Supabase service-role key to create projects, save immutable configuration versions, validate draft shape, and publish versions transactionally. Publishing supersedes the prior published Studio version, sets one active-version pointer, and records an audit event. The browser never receives privileged database credentials.

## 2026-08-06: Separate Studio publish from runtime activation

The active Studio version is not yet loaded by the Manufact-hosted MCP runtime. Keeping those boundaries separate prevents a browser-triggered configuration edit from silently altering a public runtime. The next slice must define a controlled runtime activation and rollback path before a published version affects tools or views.

## 2026-08-07: Activate runtime configuration only at process startup

The runtime reads the active published Studio configuration only when the process starts. A Studio publish changes the desired active version, but a deliberate runtime redeploy applies it. If activation settings are absent, the checked-in configuration remains the fallback. If activation settings are present but the published configuration is unavailable or incompatible, startup fails rather than silently falling back.

## 2026-08-07: Verify Studio activation in Manufact Cloud

The Manufact-hosted runtime successfully loaded the active published Studio `v3` configuration at startup and executed all three configured GitHub tools with their assigned views. This establishes the controlled path from Studio draft, to published version, to deliberate runtime redeploy.

## 2026-08-07: Constrain the first flow builder to a linear read-only briefing

The first visual flow is a Repository Briefing composed of shared inputs, configured read-only tools, one condition, and a terminal result. React Flow provides visual layout only; the product contract still limits the flow to five executable nodes, no writes, no loops, no arbitrary code, and no background execution. Fixture traces demonstrate sequencing before any runtime flow execution is introduced.

## 2026-08-07: Execute published briefing flows through configured tools

The published GitHub flow registers `get_repository_briefing` at runtime. It calls only the configured overview, issues, and contributor operations through the existing allowlisted executor, preserves result limits and safe error behavior, and returns one combined briefing view. Flow publication still requires deliberate runtime redeploy to apply publicly.

## 2026-08-09: Use one stable runtime per Studio project

Each Studio project can link one dedicated Manufact server ID and MCP URL. Publishing selects that project’s desired configuration version; a deliberate redeploy of the same runtime activates it. This prevents a shared runtime from selecting arbitrary user projects and keeps Manufact credentials out of the hosted Studio browser.

## 2026-08-09: Freeze core product scope for portfolio packaging

The original proof requirements are complete and the hosted product exceeds the initial local-only scope. Further generic write generation, automated deployment, and workflow expansion are deferred in favor of screenshots, demo video, documentation, memo, and application artifacts.
