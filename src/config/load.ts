import appConfig from "../../data/app-config.json" with { type: "json" };
import { appConfigSchema } from "./schema.js";

type PublishedVersion = { id: string; config: { runtimeConfig?: unknown } };

async function loadPublishedConfig(): Promise<unknown | undefined> {
  const projectId = process.env.STUDIO_PROJECT_ID;
  if (projectId === undefined) return undefined;

  const baseUrl = process.env.STUDIO_SUPABASE_URL;
  const serviceRoleKey = process.env.STUDIO_SUPABASE_SERVICE_ROLE_KEY;
  if (baseUrl === undefined || serviceRoleKey === undefined) {
    throw new Error("Studio runtime activation requires Supabase server credentials.");
  }
  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
  const projectResponse = await fetch(`${baseUrl}/rest/v1/studio_projects?id=eq.${projectId}&select=active_version_id`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!projectResponse.ok) throw new Error("Could not load the active Studio project version.");
  const [project] = (await projectResponse.json()) as Array<{ active_version_id: string | null }>;
  if (project?.active_version_id === null || project === undefined) throw new Error("Studio project has no published version.");

  const versionResponse = await fetch(`${baseUrl}/rest/v1/studio_config_versions?id=eq.${project.active_version_id}&state=eq.published&select=id,config`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!versionResponse.ok) throw new Error("Could not load the active Studio configuration.");
  const [version] = (await versionResponse.json()) as PublishedVersion[];
  if (version?.config.runtimeConfig === undefined) throw new Error("Published Studio version is not runtime-compatible.");
  console.log(JSON.stringify({ event: "runtime_config_loaded", source: "studio", versionId: version.id }));
  return version.config.runtimeConfig;
}

export async function loadAppConfig() {
  const publishedConfig = await loadPublishedConfig();
  return appConfigSchema.parse(publishedConfig ?? appConfig);
}
