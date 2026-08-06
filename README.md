# OpenAPI-to-MCP Studio Demo

A clean-room product proof for configuring a safe OpenAPI subset as MCP tools and interactive MCP Apps. It uses mcp-use v2 and Manufact Cloud rather than rebuilding MCP infrastructure.

## Current Scope

The Studio imports the bundled GitHub Repository API subset, classifies supported operations, and locally edits a bounded `app-config.json`. The runtime registers the resulting checked-in configuration as three safe GitHub tools with interactive summary, table, and ranking views.

## Getting Started

This project requires Node `>=22.22.2`. On this machine, use the Homebrew Node 24 runtime:

```bash
export PATH="/opt/homebrew/opt/node/bin:$PATH"
npm install
npm run dev
```

Open [http://localhost:3000/mcp/inspector](http://localhost:3000/mcp/inspector), then invoke `open-studio` to browse the catalog.

The Studio saves edits to browser local storage and can export `app-config.json`. This is intentionally prototype-only: exported changes do not modify the running server until they are reviewed, copied into `data/app-config.json`, and the server is restarted.

The three configured GitHub tools are also available locally:

```bash
npx mcp-use client connect local http://localhost:3000/mcp
npx mcp-use client local tools call get_repository_overview owner=mcp-use repo=mcp-use
npx mcp-use client local tools call list_repository_issues owner=mcp-use repo=mcp-use state=open limit:=10
npx mcp-use client local tools call list_top_contributors owner=mcp-use repo=mcp-use limit:=10
```

`GITHUB_TOKEN` is optional. Copy `.env.example` to `.env.local` and set it only when GitHub's unauthenticated rate limit becomes restrictive.

## Quality Checks

```bash
npm run test
npm run typecheck
npm run build
node .agents/skills/mcp-apps-builder/scripts/check-v2.mjs .
```

## Project Layout

- `data/app-config.json`: checked-in example configuration.
- `examples/`: reduced GitHub OpenAPI document and unsupported fixture.
- `src/config/`: Zod configuration schema.
- `src/openapi/`: OpenAPI parsing and support classification.
- `views/studio/`: catalog MCP App view.
- `views/summary-card/`, `views/data-table/`, `views/ranked-list/`: normalized GitHub result views.
- `src/tests/`: configuration and parser tests.

## Deployment

The completed Studio is deployed at:

- MCP URL: `https://keen-forge-ocsbv.run.mcp-use.com/mcp`
- Chat URL: `https://keen-forge-ocsbv.run.mcp-use.com/chat`

All three configured GitHub tools and their assigned MCP App views have been verified against this public endpoint.

## Security Boundary

- The prototype will support only explicit allowlisted HTTPS hosts at runtime.
- Optional bearer credentials remain server-side and must never be committed.
- Requests are GET-only, do not accept caller-provided headers, reject redirects, enforce a timeout and 1 MB response cap, and log only safe request metadata.
- Unsupported OpenAPI constructs are classified visibly instead of being generated.
- The project contains only public GitHub API examples and clean-room code.

## Current Limitations

- The Studio currently starts from the bundled spec; remote URL import is a future enhancement.
- Browser persistence and JSON export are not cloud persistence or collaborative configuration.
- Only the bundled GET operations are registered at runtime; editing the browser config does not hot-reload server tools.
- The current Manufact deployment contains the unmodified Milestone 0 template and will be updated only after final review.

## Phase 2 Direction

The next validated product slice is a separately hosted Studio with remote spec import, visual view bindings and preview, versioned configuration, and a constrained flow builder for sequential tools, field mapping, conditions, and explicit user confirmations. See [`docs/phase-2.md`](docs/phase-2.md).

### Standalone Studio Foundation

Phase 2's standalone Studio lives in `studio/` and currently runs with local fixture data:

```bash
cd studio
npm install
npm run dev:api
```

In a second terminal:

```bash
cd studio
npm run dev
```

Open `http://127.0.0.1:5173` to import a public OpenAPI JSON URL, curate up to three supported GET operations, and edit local tool drafts. The import API is local-only at this stage; it is intentionally separate from the Manufact-hosted MCP runtime.
