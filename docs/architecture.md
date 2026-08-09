# Architecture

## Product Layers

```text
Vercel-hosted Configurable MCP App Builder
  -> authenticated Studio API
  -> Supabase projects, versions, and audit data
  -> published project configuration
  -> dedicated Manufact runtime per project
  -> MCP App tools and views
```

The browser holds only a Supabase user session. The Studio API validates that bearer token, scopes every project route to `owner_id`, and uses its server-only Supabase service role for persistence.

## Configuration Lifecycle

1. A user creates a project.
2. Foundry saves immutable configuration drafts.
3. Publishing sets one active version and supersedes the previous published version.
4. A project links one stable Manufact runtime URL.
5. Redeploying that same runtime loads the active version at startup.

Publishing and runtime activation are deliberately separate. A browser publish cannot silently alter a live MCP server.

## Runtime Safety

`src/config/schema.ts` validates app identity, HTTPS API base URL, host allowlist, bounded tool count, tool names, annotations, views, and constrained Repository Briefing graph shape.

`src/runtime/execute-http.ts` enforces allowlisted HTTPS upstreams, server-owned headers, manual redirect blocking, timeout, response-size caps, safe errors, request IDs, and structured logs. The lead reference adds a bounded primitive JSON POST executor only for marked lead-capture schemas.

## Project Runtimes

Each project stores `runtime_server_id` and `runtime_url`. Versions do not create new URLs. The Manufact runtime receives `STUDIO_PROJECT_ID` and server-only Supabase credentials, reads that project’s active published version at startup, and registers its configured tools.

## Reference Views

- `summary-card`: repository overview.
- `data-table`: repository issues.
- `ranked-list`: repository contributors.
- `briefing`: combined constrained flow result.
- `lead-capture`: demo-only confirmation-gated form.

## Intentional Limits

This proof is not a general API platform. It excludes arbitrary OpenAPI support, OAuth, generic writes, arbitrary workflow graphs, background jobs, billing, and client-store publishing automation.
