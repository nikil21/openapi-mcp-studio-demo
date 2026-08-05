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
