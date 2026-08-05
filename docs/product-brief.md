# Product Brief

## OpenAPI-to-MCP Studio

OpenAPI-to-MCP Studio is a narrow workbench for product engineers, solutions engineers, and technical product managers who want to turn a safe subset of an existing API into an AI-client app without hand-writing every MCP tool and view.

The prototype imports a reduced public GitHub Repository API specification, classifies its operations, lets a user select up to three supported read-only GET operations, locally edits/export configuration, executes configured GitHub tools, and renders reusable result views.

## Product Boundary

Manufact provides the development, inspection, deployment, and observability infrastructure. This project explores the configuration layer above it: API operation curation, tool semantics, safety annotations, input design, and view binding.

## Supported Path

- OpenAPI 3.x documents.
- Inline path and query parameters using primitive types or arrays of primitives.
- GET operations with a declared JSON response.
- A maximum of three selected operations.

## Explicit Limits

The first prototype does not support write operations, request bodies, referenced parameters, OpenAPI composition, OAuth setup, cloud persistence, or general workflow composition. Unsupported constructs are shown in the catalog rather than being silently generated.
