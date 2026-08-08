alter table studio_projects add column if not exists owner_id uuid references auth.users(id) on delete cascade;
create index if not exists studio_projects_owner_updated_idx on studio_projects(owner_id, updated_at desc);

create policy "Users manage their own Studio projects"
  on studio_projects for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users read versions for their own projects"
  on studio_config_versions for select
  using (exists (select 1 from studio_projects where studio_projects.id = studio_config_versions.project_id and studio_projects.owner_id = auth.uid()));

create policy "Users read audit events for their own projects"
  on studio_audit_events for select
  using (exists (select 1 from studio_projects where studio_projects.id = studio_audit_events.project_id and studio_projects.owner_id = auth.uid()));

-- Existing projects remain unowned until an administrator assigns owner_id.
-- The Studio API uses service-role access only after validating the caller JWT
-- and checking this ownership boundary itself.
