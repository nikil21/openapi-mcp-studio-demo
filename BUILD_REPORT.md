# Build Report

## Outcome

Configurable MCP App Builder is a clean-room product proof for turning a curated GitHub OpenAPI subset into safe MCP tools, reusable MCP App views, immutable configuration versions, and stable Manufact-hosted project runtimes.

## What Was Built

- Safe server-side OpenAPI import and support classification.
- Configurable GitHub repository overview, issues, and contributors tools.
- Summary Card, Data Table, Ranked List, Repository Briefing, and reference lead-capture views.
- Supabase Auth, owner-scoped projects, immutable draft/published versions, and audit data.
- Constrained flow canvas with persisted execution order and trace.
- Vercel-hosted Studio frontend/API and dedicated stable Manufact runtime per project.
- Constrained demo-only confirmation-gated lead submission reference.

## Verification

- 17 tests across 6 files passed during the application baseline.
- Root typecheck, production build, and mcp-use v2 compatibility check passed.
- Studio lint/build passed with one non-blocking Fast Refresh warning.
- Production dependency audit reported 0 vulnerabilities.
- Shared MCP, dedicated MCP, and hosted Studio API endpoints were verified reachable.

## Intentional Limits

- Curated OpenAPI support, not general OpenAPI compatibility.
- Read-only GitHub Repository Briefing is the primary proof.
- Lead capture is a fixed sandbox safety reference, not generic write generation.
- Runtime activation remains a deliberate manual redeploy.
- No OAuth, arbitrary workflow graphs, billing, or app-store automation.

## Application Context

This is a personal clean-room product exploration using public APIs, public documentation, and personal accounts. It is not affiliated with or endorsed by Manufact and contains no proprietary employer source material.
