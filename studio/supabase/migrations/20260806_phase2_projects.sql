create extension if not exists pgcrypto;

create table studio_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  api_source_url text,
  active_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table studio_config_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references studio_projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  state text not null check (state in ('draft', 'published', 'superseded')),
  config jsonb not null,
  validation jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (project_id, version_number)
);

alter table studio_projects
  add constraint studio_projects_active_version_fk
  foreign key (active_version_id) references studio_config_versions(id) on delete set null;

create table studio_audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references studio_projects(id) on delete cascade,
  version_id uuid references studio_config_versions(id) on delete set null,
  event_type text not null check (event_type in ('draft_saved', 'published', 'rolled_back')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index studio_config_versions_project_created_idx on studio_config_versions(project_id, created_at desc);
create index studio_audit_events_project_created_idx on studio_audit_events(project_id, created_at desc);

alter table studio_projects enable row level security;
alter table studio_config_versions enable row level security;
alter table studio_audit_events enable row level security;

-- No public policies are intentionally created. The server-side Studio API owns
-- persistence until authenticated per-user access is introduced.
