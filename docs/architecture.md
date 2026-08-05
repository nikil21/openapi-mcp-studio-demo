# Architecture

## Milestone 1 Flow

```text
Bundled OpenAPI 3.x JSON
  -> parseOpenApiDocument
  -> support classification
  -> open-studio MCP tool
  -> Studio MCP App catalog view
```

`src/openapi/parse.ts` accepts a focused OpenAPI 3.x subset. It classifies an operation as supported only when it is a GET operation with inline path/query parameters, primitive parameter schemas, no request body, and a declared JSON response. The parser preserves unsupported operations with clear reasons so the Studio never silently creates a broken tool.

`src/config/schema.ts` owns the declarative application model. It validates the application identity, HTTPS API base URL, explicit host allowlist, up to three uniquely named tools, MCP-style annotations, result limits, and a supported view type.

`index.ts` parses the bundled GitHub fixture at startup and exposes it through the statically registered `open-studio` MCP tool. `views/studio/view.tsx` renders the returned structured content and permits local selection of up to three supported operations. Persistence and config export are intentionally deferred to Milestone 3.

## Next Runtime Boundary

`src/config/load.ts` validates the checked-in configuration before server registration. The runtime maps friendly inputs such as `limit` to upstream parameters such as `per_page`, encodes path values, applies configured defaults and result limits, and builds a request against the configured API base URL.

`src/runtime/execute-http.ts` is the network boundary. It permits only allowlisted HTTPS hosts, except explicitly configured localhost in development; uses GET requests with a stable User-Agent; accepts no caller-provided headers; keeps an optional bearer token server-side; rejects redirects; enforces a 10-second timeout and 1 MB response cap; emits request-ID structured logs; and returns safe errors.

`src/runtime/normalize-result.ts` converts GitHub API output into stable view-ready repository, issue, and contributor shapes. Milestone 3 binds those three result shapes to reusable React views and completes the editable Studio flow.

## Studio and Views

`open-studio` returns the catalog plus the validated startup configuration. `views/studio` maintains a browser-local working copy, validates it with the same Zod schema, saves it to local storage, and exports it as `app-config.json`. It deliberately does not change the server's in-memory configuration: production persistence and safe config rollout are outside this prototype milestone.

Configured tools bind to one of three React views:

- `summary-card` renders repository description, stars, forks, language, open issue count, and repository link.
- `data-table` renders a horizontally scrollable issue table to preserve narrow layouts.
- `ranked-list` renders contributors with avatar, rank, proportional contribution bar, and profile link.

Each view handles pending, error, and empty states and supplies dark-mode styling.
