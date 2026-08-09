alter table studio_projects
  add column if not exists runtime_server_id uuid,
  add column if not exists runtime_url text,
  add column if not exists runtime_deployed_at timestamptz;

alter table studio_projects
  add constraint studio_projects_runtime_url_check
  check (runtime_url is null or runtime_url like 'https://%/mcp');
