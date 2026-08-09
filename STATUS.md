# Status

## Current Release

MCP Foundry is a hosted clean-room product proof built on mcp-use v2, Manufact Cloud, Supabase, and Vercel.

## Verified

- Public shared MCP demo: `https://keen-forge-ocsbv.run.mcp-use.com/mcp`.
- Hosted MCP Foundry frontend and API on Vercel.
- Supabase email confirmation, sign-in, owner-scoped projects, RLS policies, immutable versions, publish lifecycle, and refresh persistence.
- Safe GitHub OpenAPI import, bounded tool curation, reusable views, and constrained Repository Briefing flow.
- Published flow order changes verified after deliberate redeploy.
- Demo-only confirmation-gated lead capture through a Supabase Edge Function.
- One stable project runtime URL linked to one dedicated Manufact server:
  `https://bold-zero-mrmgz.run.mcp-use.com/mcp`.

## Release Model

Publishing sets a project’s active configuration version. The owner manually redeploys that project’s linked Manufact server to activate it. The MCP URL remains stable across drafts and versions.

## Intentional Limits

- One dedicated runtime can be tested at a time on the current Manufact server limit.
- Runtime redeploy remains manual for the demo.
- Lead capture is a fixed reference safety pattern, not a Studio-generated generic write flow.
- No arbitrary OpenAPI, OAuth, arbitrary workflow DAGs, billing, or client-store automation.

## Next Work

1. Capture screenshots and record the two-minute demo.
2. Write the one-page product experiment memo.
3. Prepare application artifacts: tailored resume, short introduction video, and founder outreach.
4. Optionally automate redeploys with a server-side Manufact integration after the demo proof is evaluated.
