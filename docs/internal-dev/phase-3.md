# Phase 3 Plan: Confirmation-Gated Lead Capture

## Product Goal

Prove that OpenAPI-to-MCP Studio can turn a business write API into a safe, UI-driven, conversational funnel. The reference application is a Lead Capture Assistant:

```text
Lead API schema
  -> configured lead form
  -> field validation
  -> human confirmation
  -> controlled POST submission
  -> success or safe error view
```

The feature is a deliberately constrained vertical slice, not broad arbitrary POST support.

## Delivery Sequence

### Phase 3A: Editable Read-Only Flow Graph

Phase 3A makes the existing Repository Briefing flow semantically editable. It supports a limited linear graph with one input node, required repository overview, optional configured read-only tool nodes, one condition, and one terminal result.

- Users can remove and reconnect allowed edges in React Flow.
- Users can reorder optional tool steps, and the graph becomes the execution contract.
- The graph must stay acyclic, connected, linear, and within five executable nodes.
- The overview step remains first because the condition depends on it.
- The condition remains before the terminal result.
- The runtime derives the allowed tool sequence from the published graph and records the actual execution trace.
- Shared `owner` and `repo` inputs remain the only supported field mapping in this milestone.

Exit: A user can visually reorder eligible read-only steps, publish the graph, redeploy, and observe the changed live execution order in the trace.

This turns the flow canvas from visual decoration into a real product configuration surface, while staying substantially smaller and safer than arbitrary graph execution.

### Phase 3B: Confirmation-Gated Lead Capture

Phase 3B adds the lead capture write path below. It reuses Phase 3A's persisted graph, publish lifecycle, runtime trace, and terminal result pattern, but introduces a constrained POST node with a form and explicit confirmation.

## Product Contract

The first supported write operation is a JSON `POST` with an inline object body containing primitive fields. The Studio can configure labels, required fields, defaults, field order, validation copy, confirmation copy, and success copy.

The generated application exposes two distinct actions:

1. `start_lead_capture` renders the form and creates a server-side submission intent.
2. `submit_lead_capture` accepts a short-lived, payload-bound confirmed intent and sends the POST request.

The model must not receive a generic raw body editor or a simple `confirmed: true` bypass. The form UI collects the data, displays a confirmation summary, and calls the final submission tool only after a user action.

## Milestones

### 3B.0: Sandbox and Data Model

- Add a dedicated sandbox lead API with `POST /leads` and `GET /leads/{id}`.
- Publish a small OpenAPI 3.x lead fixture.
- Add Supabase tables for lead submissions, submission intents, and audit events.
- Store no real customer data; label all submitted data as demo-only.

Exit: A controlled demo API accepts validated test leads and records an audit trace.

### 3B.1: Safe POST Parsing and Runtime Execution

- Classify supported `POST` operations with JSON object bodies.
- Support required and optional primitive fields only.
- Reject references, composition, multipart, arbitrary content types, arbitrary headers, PUT/PATCH/DELETE, and unknown hosts.
- Extend the executor to send bounded JSON POST bodies with server-owned headers, timeout, response cap, redirect blocking, request IDs, and structured logs.

Exit: A runtime can execute one allowlisted, schema-validated JSON POST without exposing a generic write primitive.

### 3B.2: Lead Form and Confirmation View

- Add a Lead Form template to the Studio view gallery.
- Bind schema fields to labels, placeholders, validation messages, and field order.
- Render field validation, loading, confirmation, success, and error states.
- Create a short-lived submission intent bound to the draft version and canonical payload hash.
- Require UI confirmation before final submit.

Exit: A user completes a lead form and visibly confirms the exact payload before submission.

### 3B.3: Publish and Runtime Activation

- Add write-policy metadata to Studio versions: `confirmationRequired`, allowed operation, field schema, and success/error copy.
- Mark write flows as requiring explicit review in Publish.
- Preserve the existing publish -> deliberate Manufact redeploy activation path.
- Show write-flow configuration diff and audit metadata before publish.

Exit: A published lead flow is versioned, reviewable, and loaded by the runtime only after explicit deployment.

### 3B.4: Conversational Funnel Demo

- Add a configured `capture_lead` flow that renders the form from chat/MCP context.
- Use Studio-selected tone for UI copy only: strict, friendly, or conversational.
- Return a success card with lead reference ID and safe next steps.
- Show runtime logs and audit events in the demo.

Exit: A user can begin in chat, complete a form, confirm, submit, and see the completed lead lifecycle.

### 3C: Hosted Product Proof

- Host the standalone Studio frontend and Studio API.
- Add Studio authentication and per-user project isolation before accepting non-demo data.
- Deploy the sandbox lead runtime to Manufact.
- Capture screenshots, a two-minute product demo, and a short write-safety walkthrough.

Exit: A shareable product proof demonstrates both read-only API apps and a confirmation-gated business action.

## Security Requirements

- No real customer lead API or personal data in the demo.
- Explicit host allowlist and HTTPS only.
- Server-owned headers and secrets only.
- Strict request body schema validation and body-size limits.
- Short-lived, single-use submission intents.
- Payload hash binding: confirmation applies only to the reviewed payload.
- Server-side audit event for intent creation, confirmation, submission, success, and failure.
- Safe errors; never return token, raw authorization values, or internal exception details.
- Write operations cannot be generated from unsupported schema constructs.

## Important Limitation

MCP tool annotations are client hints, not hard authorization. An interactive form and separate confirmation tool make the intended human-in-the-loop path explicit, but production-grade guarantees require authenticated users, server-side policy enforcement, and client capabilities that support trusted confirmation. Phase 3 demonstrates the product pattern safely; it does not claim universal authorization control across every external MCP client.

## Non-Goals

- General POST support for arbitrary APIs.
- OAuth setup or real CRM integration.
- PUT, PATCH, DELETE, or bulk writes.
- File upload, multipart forms, nested/composed request bodies, or payment collection.
- Automatic retries for write requests.
- Background jobs, arbitrary workflow graphs, or autonomous follow-up actions.
- Generic chatbot personality control in external clients.

## Demo Narrative

```text
Import lead API
  -> Studio recognizes POST /leads as a supported confirmation-gated template
  -> configure form labels and friendly/strict/conversational UI copy
  -> preview the form
  -> publish version
  -> redeploy runtime
  -> invoke capture_lead in MCP client
  -> fill form, review summary, confirm
  -> see safe success card, audit record, and runtime logs
```
