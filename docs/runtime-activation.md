# Runtime Activation

The MCP runtime can load the active published Studio version at startup when all three environment variables are configured:

```env
STUDIO_PROJECT_ID=d0bc37c2-0623-42b2-b7cf-0fe58d2325cd
STUDIO_SUPABASE_URL=https://your-project.supabase.co
STUDIO_SUPABASE_SERVICE_ROLE_KEY=server-only-secret
```

`STUDIO_PROJECT_ID` identifies the Studio project. `STUDIO_SUPABASE_URL` is the project URL. `STUDIO_SUPABASE_SERVICE_ROLE_KEY` is secret and must be configured only in the server environment.

At startup, the runtime reads the project's active published version, requires a `runtimeConfig` payload compatible with the Phase 1 GitHub runtime schema, validates it with Zod, and registers tools from it. If `STUDIO_PROJECT_ID` is absent, the runtime safely uses the checked-in `data/app-config.json` fallback. If it is present but the Studio configuration cannot be loaded or validated, startup fails rather than silently deploying an unexpected fallback.

This activation path is currently limited to the supported GitHub demo operations. Other imported APIs can be drafted and versioned in Studio but cannot activate the runtime until generic runtime generation is implemented.

## Verified Deployment

The active Studio version `v3` was deployed and verified on Manufact Cloud. The startup log emitted `runtime_config_loaded`, and repository overview, issue list, and contributor list tools all executed successfully with their configured MCP App views.
