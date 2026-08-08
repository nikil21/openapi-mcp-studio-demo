create table lead_submission_intents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references studio_projects(id) on delete cascade,
  version_id uuid not null references studio_config_versions(id) on delete cascade,
  payload_hash text not null check (char_length(payload_hash) = 64),
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (consumed_at is null or confirmed_at is not null)
);

create table lead_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references studio_projects(id) on delete cascade,
  version_id uuid not null references studio_config_versions(id) on delete cascade,
  intent_id uuid not null unique references lead_submission_intents(id) on delete restrict,
  lead_reference text not null unique check (lead_reference like 'demo_lead_%'),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table lead_capture_audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references studio_projects(id) on delete cascade,
  version_id uuid references studio_config_versions(id) on delete set null,
  intent_id uuid references lead_submission_intents(id) on delete set null,
  event_type text not null check (event_type in ('intent_created', 'intent_confirmed', 'submission_started', 'submission_succeeded', 'submission_failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_submission_intents_project_created_idx on lead_submission_intents(project_id, created_at desc);
create index lead_capture_audit_events_project_created_idx on lead_capture_audit_events(project_id, created_at desc);

alter table lead_submission_intents enable row level security;
alter table lead_submissions enable row level security;
alter table lead_capture_audit_events enable row level security;

-- The server-side Studio API is the sole writer until authenticated users exist.
