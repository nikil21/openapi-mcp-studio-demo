# Application Decisions

## 2026-08-09 - Package the existing proof before adding features

Decision: Freeze core product development and use the `application-packaging` branch for application artifacts.

Reason: The public proof already exceeds the original narrow brief. The application playbook prioritizes clarity, reliability, evidence, and outreach over further platform features.

Alternatives considered: Continue configurable lead-capture generation and automated Manufact deployment.

Risk or tradeoff: Deferred features may be discussed as future work rather than shown live.

Revisit when: A founder conversation, paid trial, or clear user evidence requests them.

## 2026-08-09 - Use a descriptive application-facing title

Decision: Present the product publicly as `Configurable MCP App Builder` with the subtitle `A personal product exploration that turns a curated API into a versioned MCP App while Manufact provides the runtime and operating infrastructure.`

Reason: The title is clear to a founder evaluating a proof-of-work artifact and avoids presenting a permanent startup brand.

Alternatives considered: Continue public use of MCP Foundry.

Risk or tradeoff: Internal names remain unchanged to avoid deployment, database, and environment-variable risk.

Revisit when: A product role, paid trial, or external product decision requires a lasting brand.

## 2026-08-09 - Add credential-free quality CI

Decision: Add a GitHub Actions workflow that installs dependencies and runs root and Studio tests, typechecks, builds, lint, and the mcp-use v2 compatibility check without production credentials.

Reason: The application package needs reproducible public quality evidence without exposing secrets or coupling normal CI to external services.

Alternatives considered: Depend on Vercel deployment status only or add a larger security platform.

Risk or tradeoff: CI does not exercise authenticated Supabase, Manufact, or browser flows; those remain documented live QA steps.

Revisit when: A future project adds integration-test credentials or protected deployment checks.
