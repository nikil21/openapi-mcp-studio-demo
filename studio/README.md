# OpenAPI-to-MCP Studio

The standalone Phase 2 Studio for importing APIs, curating tools, configuring views, testing drafts, and publishing validated MCP application configurations.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local import API in one terminal:

```bash
npm run dev:api
```

Start Vite in another terminal:

```bash
npm run dev
```

The import API accepts public HTTPS OpenAPI JSON documents. It rejects local/private hosts and redirects, and applies request timeout and response-size limits.

## Checks

```bash
npm run lint
npm run build
```

This local Studio currently uses in-memory drafts. Persistent projects, versioned publishing, and hosted API deployment are planned Phase 2 milestones.
