create or replace function publish_studio_version(project_uuid uuid, version_uuid uuid)
returns studio_config_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  published_version studio_config_versions;
begin
  if not exists (
    select 1 from studio_config_versions
    where id = version_uuid and project_id = project_uuid
  ) then
    raise exception 'Configuration version does not belong to this project.';
  end if;

  update studio_config_versions
  set state = 'superseded'
  where project_id = project_uuid and state = 'published' and id <> version_uuid;

  update studio_config_versions
  set state = 'published', published_at = now()
  where id = version_uuid
  returning * into published_version;

  update studio_projects
  set active_version_id = version_uuid, updated_at = now()
  where id = project_uuid;

  insert into studio_audit_events (project_id, version_id, event_type, metadata)
  values (project_uuid, version_uuid, 'published', jsonb_build_object('version_number', published_version.version_number));

  return published_version;
end;
$$;
