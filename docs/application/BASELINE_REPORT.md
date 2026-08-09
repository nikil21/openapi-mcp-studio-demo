# Phase 0 Baseline Report

Date: 2026-08-09 19:42 IST

## Architecture Summary

Configurable MCP App Builder combines a Vercel-hosted React/Vite Studio and Node-compatible serverless API with Supabase authentication, owner-scoped project persistence, immutable configuration versions, and audit data. Published project configuration is loaded by a dedicated Manufact MCP runtime at process startup. The shared GitHub proof remains the primary public demo; lead capture is a demo-only constrained reference.

## Public Product Flow

```text
GitHub OpenAPI import -> tool curation -> view binding -> constrained briefing flow
-> draft -> publish -> stable project runtime link -> deliberate Manufact redeploy
```

## Deployments Verified

- Shared MCP endpoint: `https://keen-forge-ocsbv.run.mcp-use.com/mcp` returned HTTP 204 to safe GET health probing.
- Dedicated MCP endpoint: `https://bold-zero-mrmgz.run.mcp-use.com/mcp` returned HTTP 204 to safe GET health probing.
- Hosted Studio API: `https://openapi-mcp-studio-demo-82ptvk1y0-nikil22.vercel.app/api/health` returned `{"importApi":"ready","persistence":"ready"}`.

The Vercel URL above is a verified deployment URL. A stable production alias or custom domain has not yet been recorded.

## Quality Baseline

- Root tests: 17 passing across 6 test files.
- Root typecheck: passed.
- Root production build: passed.
- mcp-use v2 compatibility check: passed.
- Studio lint: passed with one non-blocking Fast Refresh warning in `studio/src/AuthGate.tsx` because it exports a hook and component.
- Studio production build: passed.
- Production dependency audit: 0 vulnerabilities.

## Repository Hygiene

- No tracked `.env`, `.env.local`, Vercel local metadata, or Supabase temporary metadata files.
- `.gitignore` covers environment files, build output, `.mcp-use`, Vite cache, and Supabase temporary output.
- The only service-role key match in public documentation is the placeholder in `docs/runtime-activation.md`; no value is present.
- No `Fletch` or `fletch` references were found in tracked public source/documentation files.
- No CI workflow currently exists.

## Public-Facing Naming

- Product name in documentation: Configurable MCP App Builder.
- Internal package, database, and environment-variable names remain unchanged to avoid deployment risk.

## Documentation Gaps

- No threat model document.
- No `BUILD_REPORT.md`.
- No CI workflow.
- Screenshot and demo video artifacts are not yet captured.
- Existing README and application documents require Phase 1 positioning review before founder-facing use.

## Blockers

- None for Phase 0.

## Phase 1 Recommendation

Freeze product features, choose the public-facing title, make GitHub Repository Briefing the only hero narrative, move lead capture to a clearly optional technical reference, and add clean-room/scope notices.
