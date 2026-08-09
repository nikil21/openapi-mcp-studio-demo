# Threat Model

## Scope

This document describes the controls and known limits of the Configurable MCP App Builder proof. It is not a claim of comprehensive production security.

## Assets

- User-owned Studio projects and immutable configuration versions.
- Supabase user sessions, project ownership data, and audit records.
- Server-only credentials: Supabase service role, optional GitHub token, and runtime environment values.
- Published MCP configuration and stable project runtime URLs.
- Demo-only lead form payloads and submission references.

## Trust Boundaries

```text
Browser -> Vercel Studio API -> Supabase
                     -> public OpenAPI source
Manufact runtime -> Supabase active version -> allowlisted external API
MCP App view -> MCP client bridge -> configured runtime tools
```

The browser has a Supabase user session only. Service-role credentials, GitHub tokens, and Manufact deployment credentials are server-side only.

## Threats And Controls

| Threat | Current controls | Known limit |
| --- | --- | --- |
| SSRF through OpenAPI import | HTTPS-only URLs, DNS resolution, local/private/link-local address rejection, redirect blocking, timeout, response cap | DNS rebinding after validation is not comprehensively prevented. |
| Unsafe runtime upstream request | HTTPS allowlist, server-owned headers, manual redirects, timeout, response cap, safe errors | Only curated runtime operations are supported. |
| Cross-user project access | Supabase Auth, owner-scoped Studio API checks, RLS policies | Existing legacy unowned projects require explicit assignment. |
| Expired or invalid session | Vercel API validates bearer tokens through Supabase Auth | Password reset/session refresh UX is limited. |
| Secret exposure | `.gitignore`, server-only variable naming, no service-role key in browser bundle, safe logs | Repository history is checked manually; no hosted secret scanner is configured yet. |
| Malicious OpenAPI description | Parser classifies bounded schema features; Studio renders text through React escaping | Descriptions are not a complete prompt-injection defense. |
| Unsafe write operation | Only marked closed primitive lead-capture POST schema; confirmation UI; single-use short-lived demo intent | MCP client annotations are hints, not universal authorization. |
| Replay or altered lead payload | Demo intent is consumed once and payload is hashed | Demo intent storage is in-memory; durable production intent/audit persistence is deferred. |
| Runtime deployment misuse | Stable runtime link is owner-scoped; manual redeploy remains outside browser automation | Automated Manufact deploy integration is intentionally not implemented. |
| Rate-limit abuse | Result limits, bounded upstream requests, optional server-side GitHub token, safe rate-limit error | No per-user application rate limiting exists. |

## Security Decisions

- The primary public proof is read-only GitHub Repository Briefing.
- Lead capture is a demo-only technical reference, not a general write generator.
- Publish and runtime activation remain separate, requiring a deliberate runtime redeploy.
- Per-project runtime URLs are stable; a draft version cannot create a new public runtime.

## Future Controls

- Durable submission intents and audit records.
- Automated deployment service account with explicit owner authorization and deployment audit.
- Rate limiting and abuse monitoring for the hosted Studio API.
- Stable Vercel domain, CSP review, and deployment-preview policy.
- Automated secret scanning and dependency monitoring.
