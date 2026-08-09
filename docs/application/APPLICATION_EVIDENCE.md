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

## Phase 3 documentation package

Claim: A founder can understand the product, boundary, live proof, and verification posture without reading the codebase.

Command or user flow: Reviewed README first screen, architecture, threat model, build report, demo script, product brief, and application link tracker.

Observed result: README provides live Studio/MCP links, a concise product narrative, three-minute flow, Mermaid diagram, clean-room notice, scope statement, and links to detailed documents.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: `README.md`, `BUILD_REPORT.md`, and `docs/` documentation set.

Limitations: Screenshot and video links remain intentionally marked pending until captured in later phases.

## Phase 4 live GitHub Repository Briefing QA

Claim: A clean-session user can configure, publish, activate, and invoke the GitHub Repository Briefing through a stable dedicated MCP URL.

Command or user flow: Private-browser Studio sign-in -> final-test project -> GitHub OpenAPI import -> tool/view/flow review -> draft save -> publish v3 -> dedicated Manufact runtime restart -> Repository Briefing invocation.

Observed result: Completed successfully with no reported failures or retries. Total elapsed time was approximately 5.3 minutes. Dedicated runtime deployment wait was approximately 2.3 minutes.

Date verified: 2026-08-09

Project and runtime: `final-test`; Manufact server `d61d5fc6-0bf8-418f-a80d-59af6c22345e`; stable MCP URL `https://bold-zero-mrmgz.run.mcp-use.com/mcp`.

Screenshot, CI run, log, or URL: User-provided private QA captures show Build, Tools, Flows, and Publish/Runtime states. Public screenshot recapture is required because these captures include a personal email, deployment identifiers, and the former MCP Foundry branding.

Limitations: Manual step count was not recorded. The Vercel deployment URL remains non-stable. The dedicated runtime restart remains a deliberate manual activation step.

## Phase 5 screenshot evidence

Claim: Public application evidence will be captured consistently without exposing personal, credential, or deployment data.

Command or user flow: Use a clean 1440 x 900 browser profile and the required capture list in `docs/assets/screenshots/README.md`.

Observed result: Six public-safe PNGs were captured, reviewed, and recorded. They show Studio overview, operation selection, tool/view configuration, version history, rendered Repository Briefing output, and Manufact deployment history.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: `docs/assets/screenshots/README.md`.

Limitations: Screenshots document one successful state at a time. They do not replace the live QA checklist or a recorded demo.

## Phase 6 product demo video

Claim: A founder can watch a concise end-to-end demonstration of the Configurable MCP App Builder without signing in.

Command or user flow: Open the Drive viewer link without an authenticated Google session.

Observed result: Google Drive returned the public viewer for `mcp-app-builder-demo.mov` without authentication.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: `https://drive.google.com/file/d/1jRvy0yR9_62vx6_vMXqhlR_VB--8MpKz/view?usp=sharing`

Limitations: Hosting is Google Drive rather than a dedicated video platform. The video is a recorded demonstration and does not replace live product verification.

## Phase 7 founder-facing product memo

Claim: The product experiment, its limits, and a measurable next test can be understood in a concise Manufact-specific memo.

Command or user flow: Review `docs/application/MANUFACT_PRODUCT_MEMO.md` with its linked live product, video, repository, architecture, threat model, and build report.

Observed result: An 807-word memo explains the configuration layer above Manufact, the constrained GitHub proof, explicit limits, a three-to-five-team experiment, and the author's clean-room contribution.

Date verified: 2026-08-09

Screenshot, CI run, log, or URL: `docs/application/MANUFACT_PRODUCT_MEMO.md`.

Limitations: Proposed improvement metrics are hypotheses to measure, not results claimed by the prototype.
