# MCP Foundry

MCP Foundry is a clean-room product proof for turning a curated OpenAPI subset into safe MCP tools, reusable MCP App views, versioned configurations, and stable project runtimes. It uses mcp-use v2 and Manufact Cloud rather than rebuilding MCP infrastructure.

## Live Proof

- Shared MCP demo: `https://keen-forge-ocsbv.run.mcp-use.com/mcp`
- Shared chat: `https://keen-forge-ocsbv.run.mcp-use.com/chat`
- Hosted Foundry: deployed on Vercel; the current deployment URL is managed in Vercel.

## Primary Demo

Import the public GitHub fixture:

```text
https://raw.githubusercontent.com/nikil21/openapi-mcp-studio-demo/main/examples/github-openapi-subset.json
```

The workflow is:

```text
Import -> curate up to three tools -> bind views -> compose a constrained flow
-> save immutable draft -> publish -> link stable project runtime -> redeploy runtime
```

The reference runtime exposes repository overview, issues, contributors, and a combined Repository Briefing flow. Publishing changes the desired version; a deliberate redeploy of the same project runtime activates it.

## Hosted Foundry

Foundry provides:

- Supabase email/password authentication and user-owned projects.
- Immutable draft, published, and superseded configuration versions.
- Project create, rename, switch, and protected delete controls.
- Safe public OpenAPI import with HTTPS, DNS, redirect, timeout, and response-size controls.
- A constrained linear Repository Briefing flow with execution trace.
- A stable Manufact MCP server connection per project.

Each project has one stable MCP URL. Draft and published versions do not create new servers. The project owner manually redeploys that linked server to activate a published version.

## Lead Capture Reference

The repository also includes a deliberately constrained demo-only lead capture pattern:

- A marked closed JSON POST schema.
- Primitive fields only; no generic write body editor.
- Form review before submission.
- Short-lived single-use demo intent.
- Supabase Edge Function sandbox returning `demo_lead_*` references.

This is a reference safety pattern, not a general POST generator or CRM integration. Do not submit real customer data.

## Local Development

Node `>=22.22.2` is required. This workspace uses Node 24:

```bash
export PATH="/opt/homebrew/bin:$PATH"
npm install
npm run test
npm run typecheck
npm run build
```

Run the MCP runtime:

```bash
npm run dev
```

Run Foundry locally in separate terminals:

```bash
npm --prefix studio run dev:api
npm --prefix studio run dev
```

For the local lead sandbox:

```bash
npm run sandbox:leads
NODE_ENV=development LEAD_SANDBOX_URL=http://127.0.0.1:8788 npm run dev
```

## Security Boundary

- Clean-room code, public APIs, and no committed secrets.
- Explicit HTTPS host allowlists, redirect blocking, timeouts, and bounded responses.
- Server-owned authorization headers and server-only Supabase service credentials.
- Supabase Auth, owner-scoped Studio API routes, and RLS policies.
- No arbitrary code, workflow DAGs, OAuth, generic writes, or production CRM connections.

## Documentation

- [`docs/product-brief.md`](docs/product-brief.md): product boundary and supported path.
- [`docs/architecture.md`](docs/architecture.md): hosted architecture and release boundary.
- [`docs/demo-script.md`](docs/demo-script.md): two-minute demo walkthrough.
- [`docs/phase-2.md`](docs/phase-2.md) and [`docs/phase-3.md`](docs/phase-3.md): original plans and deferred scope.
