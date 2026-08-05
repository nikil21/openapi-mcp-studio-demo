# Phase 2 Direction

Phase 1 proves a configuration-driven path from a curated OpenAPI subset to safe MCP tools and reusable views. Phase 2 should validate whether this can become a self-serve product rather than expand every MCP feature at once.

## Highest-Value Additions

1. Separate hosted Studio with project persistence and versioned configuration.
2. Remote OpenAPI URL import with loading, validation, and clear unsupported-construct feedback.
3. View gallery, field bindings, sample-data preview, and per-view configuration.
4. Safe flow configuration for explicit tool sequences, confirmations, conditions, and error handling.
5. Review-and-deploy flow that produces a config diff and deploys through Manufact.

## Flow Configuration Boundary

The first flow builder should be deliberately narrow: sequential calls, field mapping, an explicit user confirmation step, simple conditions, and a terminal result view. Each step must use registered configured tools, expose its input/output mapping, enforce the same host and permission policy, and have an inspectable execution trace.

Do not start with arbitrary code execution, background jobs, arbitrary writes, general OAuth, visual DAG editing, or autonomous looping. Those capabilities require durable execution state, permissions, retries, audit history, and stronger product security than this prototype needs.
