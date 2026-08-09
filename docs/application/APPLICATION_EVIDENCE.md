# Application Evidence

Evidence is recorded during each application-packaging phase. No customer metrics or unmeasured claims are included.

## Phase 0 baseline

Claim: The current technical proof builds, tests, and has reachable hosted endpoints.

Command or user flow: Root test, typecheck, build, mcp-use v2 check; Studio lint/build; safe HTTP checks of shared, dedicated, and Studio endpoints.

Observed result: 17 tests passed; root and Studio builds passed; production audit reported 0 vulnerabilities; verified endpoint results are recorded in `BASELINE_REPORT.md`.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: `docs/application/BASELINE_REPORT.md`.

Limitations: The Vercel URL is a deployment URL, not a stable production alias. Studio lint has one non-blocking Fast Refresh warning.

## Phase 1 public-positioning check

Claim: The public hero narrative is the GitHub Repository Briefing proof, with clear clean-room and scope boundaries.

Command or user flow: Reviewed README, product brief, architecture, demo script, browser title, and sidebar title after public-facing copy changes.

Observed result: Configurable MCP App Builder is the public title; GitHub Repository Briefing is the primary workflow; lead capture is documented only as an optional technical reference.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: Repository documentation and Studio production build.

Limitations: The lead-capture runtime tools remain available as technical reference code; they are not part of the intended application demo.

## Phase 2 quality and hygiene check

Claim: The public repository has reproducible credential-free quality checks and documented threat boundaries.

Command or user flow: Root tests, typecheck, build, mcp-use v2 check; Studio lint/build; production dependency audit; tracked-file and Git-history token-marker scans.

Observed result: 17 tests passed, builds passed, production audit reported 0 vulnerabilities, and no tracked environment or local deployment metadata files were found. The only current token-like source match is the documented `server-only-secret` placeholder.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: `.github/workflows/quality.yml`, `docs/threat-model.md`, and terminal baseline output.

Limitations: The lint warning in `studio/src/AuthGate.tsx` is non-blocking. CI does not run authenticated Supabase or Manufact integration tests.
