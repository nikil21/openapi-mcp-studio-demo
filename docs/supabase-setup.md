# Supabase Setup

Phase 2.3 uses Supabase Postgres for Studio projects, immutable configuration versions, and audit events.

1. Create a free project at https://supabase.com/dashboard.
2. Choose a project name such as `openapi-mcp-studio` and a region near you.
3. Keep the database password private. Do not paste it into chat or source control.
4. Open the SQL Editor and run `studio/supabase/migrations/20260806_phase2_projects.sql`.
5. Run `studio/supabase/migrations/20260806_publish_version.sql` to add the transactional publish function.
6. In Project Settings -> API, copy the project URL and publishable/anon key into `studio/.env.local` using `studio/.env.example` as the template.
7. Keep the service-role key server-side only. It is read exclusively by the local Studio API.

The migration enables row-level security and deliberately creates no anonymous browser policies. Until Studio authentication is added, persistence is performed only through the server-side API.
