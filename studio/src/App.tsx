import { startTransition, useEffect, useState } from "react";
import { classifyOpenApi, type Operation } from "./lib/openapi";
import { FlowWorkspace } from "./FlowWorkspace";
import { useStudioAuth } from "./AuthGate";
import "./App.css";
import "./views.css";
import "./publish.css";
import "./polish.css";

type Section = "Build" | "Tools" | "Views" | "Flows" | "Test" | "Publish";
type ToolDraft = {
  operationId: string;
  name: string;
  description: string;
  resultLimit: number;
  view: string;
};
type ViewDraft = {
  template: string;
  titleField: string;
  detailField: string;
  metricField: string;
};
type FlowDraft = {
  name: string;
  owner: string;
  repo: string;
  includeIssues: boolean;
  includeContributors: boolean;
  positions?: Record<string, { x: number; y: number }>;
  edges?: Array<{ id: string; source: string; target: string }>;
};
type PersistedProject = {
  id: string;
  name: string;
  api_source_url: string | null;
  active_version_id: string | null;
  runtime_server_id?: string | null;
  runtime_url?: string | null;
};
type PersistedVersion = {
  id: string;
  version_number: number;
  state: "draft" | "published" | "superseded";
  created_at: string;
  published_at: string | null;
  config: unknown;
};

const sections: Section[] = [
  "Build",
  "Tools",
  "Views",
  "Flows",
  "Test",
  "Publish",
];
const defaultSource =
  "https://raw.githubusercontent.com/nikil21/openapi-mcp-studio-demo/main/examples/github-openapi-subset.json";
const initialOperations: Operation[] = [
  {
    id: "repos/get",
    method: "GET",
    path: "/repos/{owner}/{repo}",
    summary: "Get a repository overview",
    supported: true,
    reasons: [],
    parameters: [],
  },
  {
    id: "issues/list-for-repo",
    method: "GET",
    path: "/repos/{owner}/{repo}/issues",
    summary: "List repository issues",
    supported: true,
    reasons: [],
    parameters: [],
  },
  {
    id: "repos/list-contributors",
    method: "GET",
    path: "/repos/{owner}/{repo}/contributors",
    summary: "List repository contributors",
    supported: true,
    reasons: [],
    parameters: [],
  },
  {
    id: "repos/create-hook",
    method: "POST",
    path: "/repos/{owner}/{repo}/hooks",
    summary: "Create a repository webhook",
    supported: false,
    reasons: ["Only GET operations are supported in this draft."],
    parameters: [],
  },
];

const previewData = {
  full_name: "acme/atlas",
  description: "A compact MCP application platform for customer operations.",
  stars: "1,428",
  forks: "219",
  language: "TypeScript",
  issues: [
    {
      title: "Add customer intake template",
      author: "maya",
      updatedAt: "Today",
      labels: "enhancement",
    },
    {
      title: "Support published draft rollbacks",
      author: "sam",
      updatedAt: "Yesterday",
      labels: "runtime",
    },
  ],
  contributors: [
    { login: "mira", contributions: "184" },
    { login: "alex", contributions: "129" },
    { login: "leo", contributions: "73" },
  ],
};

function createViewDraft(template: string): ViewDraft {
  if (template === "Data table")
    return {
      template,
      titleField: "title",
      detailField: "author",
      metricField: "updatedAt",
    };
  if (template === "Ranked list")
    return {
      template,
      titleField: "login",
      detailField: "contributions",
      metricField: "contributions",
    };
  return {
    template: "Summary card",
    titleField: "full_name",
    detailField: "description",
    metricField: "stars",
  };
}

function defaultFlowEdges(
  includeIssues: boolean,
  includeContributors: boolean,
) {
  const nodes = [
    "input",
    "overview",
    ...(includeIssues ? ["issues"] : []),
    ...(includeContributors ? ["contributors"] : []),
    "condition",
    "result",
  ];
  return nodes
    .slice(1)
    .map((target, index) => ({
      id: `${nodes[index]}-${target}`,
      source: nodes[index],
      target,
    }));
}

function buildConfig(
  apiTitle: string,
  sourceUrl: string,
  tools: ToolDraft[],
  views: Record<string, ViewDraft>,
  flow: FlowDraft,
) {
  const supportedGitHubOperations = new Set([
    "repos/get",
    "issues/list-for-repo",
    "repos/list-contributors",
  ]);
  const runtimeCompatible =
    tools.length > 0 &&
    tools.every((tool) => supportedGitHubOperations.has(tool.operationId));
  const runtimeConfig = runtimeCompatible
    ? {
        app: { name: apiTitle, version: "0.2.0" },
        api: {
          baseUrl: "https://api.github.com",
          allowedHosts: ["api.github.com"],
          defaultHeaders: { Accept: "application/vnd.github+json" },
          optionalBearerEnv: "GITHUB_TOKEN",
        },
        tools: tools.map((tool) => ({
          operationId: tool.operationId,
          name: tool.name,
          description: tool.description,
          inputLabels: {},
          parameterMappings:
            tool.operationId === "repos/get" ? {} : { limit: "per_page" },
          defaults:
            tool.operationId === "issues/list-for-repo"
              ? { state: "open" }
              : {},
          resultLimit: tool.resultLimit,
          annotations: { readOnly: true, destructive: false, openWorld: true },
          view: {
            type:
              tool.view === "Summary card"
                ? "summary-card"
                : tool.view === "Ranked list"
                  ? "ranked-list"
                  : "data-table",
          },
        })),
        flows: [
          {
            name: "get_repository_briefing",
            description:
              "Build a concise public GitHub repository briefing from configured read-only tools.",
            kind: "repository-briefing",
            includeIssues: flow.includeIssues,
            includeContributors: flow.includeContributors,
            edges:
              flow.edges ??
              defaultFlowEdges(flow.includeIssues, flow.includeContributors),
            view: { type: "briefing" },
          },
        ],
      }
    : undefined;
  return {
    app: { name: apiTitle, version: "0.2.0" },
    apiSourceUrl: sourceUrl,
    tools,
    views,
    flow,
    runtimeConfig,
    generatedAt: new Date().toISOString(),
  };
}

function runtimeCompatibility(tools: ToolDraft[]) {
  const supportedGitHubOperations = new Set([
    "repos/get",
    "issues/list-for-repo",
    "repos/list-contributors",
  ]);
  return (
    tools.length > 0 &&
    tools.every((tool) => supportedGitHubOperations.has(tool.operationId))
  );
}

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase()
    .replace(/^_+|_+$/g, "");
}

function createToolDraft(operation: Operation): ToolDraft {
  const presets: Record<string, Omit<ToolDraft, "operationId">> = {
    "repos/get": {
      name: "get_repository_overview",
      description: "Get a concise overview of a public GitHub repository.",
      resultLimit: 1,
      view: "Summary card",
    },
    "issues/list-for-repo": {
      name: "list_repository_issues",
      description: "List issues for a public GitHub repository.",
      resultLimit: 10,
      view: "Data table",
    },
    "repos/list-contributors": {
      name: "list_top_contributors",
      description: "List top contributors for a public GitHub repository.",
      resultLimit: 10,
      view: "Ranked list",
    },
  };
  return {
    operationId: operation.id,
    ...(presets[operation.id] ?? {
      name: toSnakeCase(operation.id),
      description: operation.summary,
      resultLimit: 10,
      view: "Data table",
    }),
  };
}

function App() {
  const { apiFetch } = useStudioAuth();
  const [section, setSection] = useState<Section>("Build");
  const [sourceUrl, setSourceUrl] = useState(defaultSource);
  const [apiTitle, setApiTitle] = useState("GitHub Repository API");
  const [apiVersion, setApiVersion] = useState("2026-08-05");
  const [operations, setOperations] = useState(initialOperations);
  const [selected, setSelected] = useState(
    initialOperations
      .filter((operation) => operation.supported)
      .map((operation) => operation.id),
  );
  const [tools, setTools] = useState(
    initialOperations
      .filter((operation) => operation.supported)
      .map(createToolDraft),
  );
  const [views, setViews] = useState<Record<string, ViewDraft>>(() =>
    Object.fromEntries(
      initialOperations
        .filter((operation) => operation.supported)
        .map((operation) => [
          operation.id,
          createViewDraft(createToolDraft(operation).view),
        ]),
    ),
  );
  const [flow, setFlow] = useState<FlowDraft>({
    name: "Repository Briefing",
    owner: "mcp-use",
    repo: "mcp-use",
    includeIssues: true,
    includeContributors: true,
    positions: {},
    edges: defaultFlowEdges(true, true),
  });
  const [project, setProject] = useState<PersistedProject | null>(null);
  const [projects, setProjects] = useState<PersistedProject[]>([]);
  const [projectName, setProjectName] = useState("GitHub Repository API");
  const [projectDialog, setProjectDialog] = useState<"create" | "rename" | "delete" | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [versions, setVersions] = useState<PersistedVersion[]>([]);
  const [persistenceMessage, setPersistenceMessage] = useState("");
  const [importState, setImportState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    void apiFetch("/api/projects")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as {
          projects: Array<PersistedProject & { versions: PersistedVersion[] }>;
        };
        setProjects(payload.projects);
        const existing = payload.projects[0];
        if (existing) {
          setProject(existing);
          setProjectName(existing.name);
          setVersions(existing.versions);
          const active = existing.versions.find(
            (version) => version.id === existing.active_version_id,
          );
          const savedFlow =
            active?.config && typeof active.config === "object"
              ? (active.config as { flow?: FlowDraft }).flow
              : undefined;
          if (savedFlow) setFlow(savedFlow);
        }
      })
      .catch(() => undefined);
  }, [apiFetch]);
  const selectSection = (next: Section) =>
    startTransition(() => setSection(next));
  const chooseProject = (id: string) => {
    const next = projects.find((item) => item.id === id);
    if (!next) return;
    setProject(next);
    setProjectName(next.name);
    setVersions(
      (next as PersistedProject & { versions?: PersistedVersion[] }).versions ??
        [],
    );
  };
  const createProject = async (name: string) => {
    name = name.trim();
    if (!name) return;
    setPersistenceMessage("Creating project...");
    try {
      const response = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, apiSourceUrl: sourceUrl }),
      });
      const payload = (await response.json()) as {
        project?: PersistedProject;
        error?: string;
      };
      if (!response.ok || !payload.project)
        throw new Error(payload.error ?? "Could not create project.");
      setProject(payload.project);
      setProjects([payload.project, ...projects]);
      setProjectName(payload.project.name);
      setVersions([]);
      setPersistenceMessage(
        "Project created. Configure it, then save its first draft.",
      );
    } catch (error) {
      setPersistenceMessage(
        error instanceof Error ? error.message : "Could not create project.",
      );
    }
  };
  const openRenameProject = () => {
    if (!project) return;
    setDialogName(project.name); setProjectDialog("rename");
  };
  const renameProject = async (name = projectName) => {
    if (!project || name.trim() === "" || name === project.name) return;
    const response = await apiFetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const payload = (await response.json()) as { project?: PersistedProject };
    if (response.ok && payload.project) {
      setProject(payload.project);
      setProjects(
        projects.map((item) =>
          item.id === payload.project?.id ? payload.project : item,
        ),
      );
    }
  };
  const deleteProject = async () => {
    if (!project) return;
    try {
      const response = await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const payload = response.status === 204 ? {} : ((await response.json()) as { error?: string });
      if (!response.ok) throw new Error(payload.error ?? "Could not delete project.");
      const remaining = projects.filter((item) => item.id !== project.id);
      const next = remaining[0] ?? null;
      setProjects(remaining); setProject(next); setProjectName(next?.name ?? ""); setVersions((next as (PersistedProject & { versions?: PersistedVersion[] }) | null)?.versions ?? []);
      setPersistenceMessage(next ? `Deleted project. Switched to ${next.name}.` : "Project deleted.");
    } catch (error) { setPersistenceMessage(error instanceof Error ? error.message : "Could not delete project."); }
  };
  const connectRuntime = async (serverId: string, runtimeUrl: string) => {
    if (!project) return;
    const response = await apiFetch(`/api/projects/${project.id}/runtime`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ serverId, runtimeUrl }) });
    const payload = (await response.json()) as { project?: PersistedProject; error?: string };
    if (!response.ok || !payload.project) throw new Error(payload.error ?? "Could not link runtime.");
    setProject(payload.project); setProjects(projects.map((item) => item.id === payload.project?.id ? payload.project : item));
    setPersistenceMessage("Runtime linked. Publish a version, then redeploy this project server.");
  };
  const importSource = async () => {
    setImportState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      });
      const payload = (await response.json()) as {
        document?: unknown;
        sourceUrl?: string;
        error?: string;
      };
      if (!response.ok || payload.document === undefined)
        throw new Error(payload.error ?? "Specification import failed.");
      const catalog = classifyOpenApi(payload.document);
      const nextSelected = catalog.operations
        .filter((operation) => operation.supported)
        .slice(0, 3)
        .map((operation) => operation.id);
      const nextTools = catalog.operations
        .filter((operation) => nextSelected.includes(operation.id))
        .map(createToolDraft);
      setApiTitle(catalog.title);
      setApiVersion(catalog.version);
      setOperations(catalog.operations);
      setSelected(nextSelected);
      setTools(nextTools);
      setViews(
        Object.fromEntries(
          nextTools.map((tool) => [
            tool.operationId,
            createViewDraft(tool.view),
          ]),
        ),
      );
      setSourceUrl(payload.sourceUrl ?? sourceUrl);
      setMessage(
        `Imported ${catalog.operations.length} operations. ${nextSelected.length} are selected for the draft.`,
      );
      setImportState("idle");
    } catch (error) {
      setImportState("error");
      setMessage(
        error instanceof Error ? error.message : "Specification import failed.",
      );
    }
  };
  const toggleOperation = (operation: Operation) => {
    if (!operation.supported) return;
    if (selected.includes(operation.id)) {
      setSelected(selected.filter((id) => id !== operation.id));
      setTools(tools.filter((tool) => tool.operationId !== operation.id));
      setViews(({ [operation.id]: _, ...remaining }) => remaining);
      return;
    }
    if (selected.length === 3)
      return setMessage("A draft supports a maximum of three selected tools.");
    const draft = createToolDraft(operation);
    setSelected([...selected, operation.id]);
    setTools([...tools, draft]);
    setViews({ ...views, [operation.id]: createViewDraft(draft.view) });
  };
  const updateTool = (
    operationId: string,
    key: keyof Omit<ToolDraft, "operationId">,
    value: string | number,
  ) =>
    setTools(
      tools.map((tool) =>
        tool.operationId === operationId ? { ...tool, [key]: value } : tool,
      ),
    );
  const updateView = (
    operationId: string,
    key: keyof ViewDraft,
    value: string,
  ) =>
    setViews({
      ...views,
      [operationId]: {
        ...(views[operationId] ?? createViewDraft("Summary card")),
        [key]: value,
      },
    });
  const compatible = runtimeCompatibility(tools);
  const saveDraft = async () => {
    setPersistenceMessage("Saving draft...");
    try {
      const config = buildConfig(apiTitle, sourceUrl, tools, views, flow);
      if (!project && projectName.trim() === "")
        throw new Error("Enter a project name before saving its first draft.");
      const response = await apiFetch(
        project ? `/api/projects/${project.id}/versions` : "/api/projects",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            project
              ? { config }
              : { name: projectName, apiSourceUrl: sourceUrl, config },
          ),
        },
      );
      const payload = (await response.json()) as {
        project?: PersistedProject;
        version?: PersistedVersion;
        error?: string;
      };
      if (!response.ok || !payload.version)
        throw new Error(payload.error ?? "Could not save draft.");
      if (payload.project) {
        setProject(payload.project);
        setProjectName(payload.project.name);
        setProjects([
          payload.project,
          ...projects.filter((item) => item.id !== payload.project?.id),
        ]);
      }
      setVersions([payload.version, ...versions]);
      setPersistenceMessage(
        `Draft v${payload.version.version_number} saved in Supabase.`,
      );
    } catch (error) {
      setPersistenceMessage(
        error instanceof Error ? error.message : "Could not save draft.",
      );
    }
  };
  const publishVersion = async (version: PersistedVersion) => {
    if (!project) return;
    setPersistenceMessage(`Publishing v${version.version_number}...`);
    try {
      const response = await apiFetch(`/api/projects/${project.id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      const payload = (await response.json()) as {
        version?: PersistedVersion;
        error?: string;
      };
      if (!response.ok || !payload.version)
        throw new Error(payload.error ?? "Could not publish version.");
      setVersions(
        versions.map((item) =>
          item.id === payload.version?.id
            ? payload.version
            : item.state === "published"
              ? { ...item, state: "superseded" }
              : item,
        ),
      );
      setProject({ ...project, active_version_id: payload.version.id });
      setPersistenceMessage(
        `Published v${payload.version.version_number}. Runtime activation is the next controlled step.`,
      );
    } catch (error) {
      setPersistenceMessage(
        error instanceof Error ? error.message : "Could not publish version.",
      );
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#build"
          onClick={() => selectSection("Build")}
        >
          <span className="brand-mark">M</span>
          <span>
            mcp studio<small>PHASE 2</small>
          </span>
        </a>
        <section className="sidebar-projects">
          <div>
            <p className="nav-label">Projects</p>
            <button
              aria-label="Create project"
              type="button"
               onClick={() => { setDialogName(""); setProjectDialog("create"); }}
            >
              +
            </button>
          </div>
          {projects.length > 0 && (
            <div className="sidebar-project-picker">
              <select
                aria-label="Studio project"
                value={project?.id ?? ""}
                onChange={(event) => chooseProject(event.target.value)}
              >
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button className="project-icon" title="Rename project" aria-label="Rename project" type="button" disabled={!project} onClick={openRenameProject}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Zm12.7-12.7 1.6-1.6a1.4 1.4 0 0 1 2 2l-1.6 1.6-2-2Z" /></svg></button>
              <button className="project-icon delete" title="Delete project" aria-label="Delete project" type="button" disabled={!project} onClick={() => setProjectDialog("delete")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l1 2h3v2H4V6h3l1-2Zm0 6h8v10H8V10Zm2 2v6h2v-6h-2Zm4 0v6h2v-6h-2Z" /></svg></button>
            </div>
          )}
        </section>
        <nav aria-label="Project sections">
          <p className="nav-label">Project</p>
          {sections.map((item, index) => (
            <button
              className={section === item ? "nav-item active" : "nav-item"}
              key={item}
              onClick={() => selectSection(item)}
              type="button"
            >
              <span>0{index + 1}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" /> Local fixture mode
          <small>Import API available locally</small>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              Project / {project?.name ?? (projectName || apiTitle)}
            </p>
            <h1>{section}</h1>
            <span className="draft-pill">Draft v0.2</span>
          </div>
        </header>
        {section === "Build" ? (
          <BuildOverview
            sourceUrl={sourceUrl}
            setSourceUrl={setSourceUrl}
            importSource={importSource}
            importState={importState}
            message={message}
            apiTitle={apiTitle}
            apiVersion={apiVersion}
            operations={operations}
            selected={selected}
            toggleOperation={toggleOperation}
          />
        ) : section === "Tools" ? (
          <ToolEditor
            tools={tools}
            operations={operations}
            updateTool={updateTool}
          />
        ) : section === "Views" ? (
          <ViewEditor
            tools={tools}
            views={views}
            updateTool={updateTool}
            updateView={updateView}
          />
        ) : section === "Flows" ? (
          <FlowWorkspace
            tools={tools}
            flow={flow}
            onFlowChange={setFlow}
            onSaveDraft={saveDraft}
            message={persistenceMessage}
          />
        ) : section === "Publish" ? (
          <PublishWorkspace
            project={project}
            versions={versions}
            message={persistenceMessage}
            saveDraft={saveDraft}
            publishVersion={publishVersion}
            runtimeCompatible={compatible}
            connectRuntime={connectRuntime}
          />
        ) : (
          <Placeholder section={section} />
        )}
      </main>
      {projectDialog && <div className="project-dialog-backdrop" role="presentation"><section className="project-dialog" role="dialog" aria-modal="true"><p className="eyebrow">{projectDialog === "create" ? "New project" : projectDialog === "rename" ? "Rename project" : "Delete project"}</p>{projectDialog === "delete" ? <><h2>Delete {project?.name}?</h2><p>This removes all drafts. Published runtime projects remain protected.</p><div><button type="button" onClick={() => void deleteProject().then(() => setProjectDialog(null))}>Delete project</button><button className="secondary" type="button" onClick={() => setProjectDialog(null)}>Cancel</button></div></> : <><h2>{projectDialog === "create" ? "Name your workspace" : "Choose a new name"}</h2><input autoFocus value={dialogName} onChange={(event) => setDialogName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { if (projectDialog === "create") void createProject(dialogName); else void renameProject(dialogName); setProjectDialog(null) } }} /><div><button type="button" onClick={() => { if (projectDialog === "create") void createProject(dialogName); else void renameProject(dialogName); setProjectDialog(null) }}>{projectDialog === "create" ? "Create project" : "Save name"}</button><button className="secondary" type="button" onClick={() => setProjectDialog(null)}>Cancel</button></div></>}</section></div>}
    </div>
  );
}

function BuildOverview({
  sourceUrl,
  setSourceUrl,
  importSource,
  importState,
  message,
  apiTitle,
  apiVersion,
  operations,
  selected,
  toggleOperation,
}: {
  sourceUrl: string;
  setSourceUrl: (value: string) => void;
  importSource: () => void;
  importState: "idle" | "loading" | "error";
  message: string;
  apiTitle: string;
  apiVersion: string;
  operations: Operation[];
  selected: string[];
  toggleOperation: (operation: Operation) => void;
}) {
  return (
    <div className="workspace">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Configuration lifecycle</p>
          <h2>Import an API. Curate a reliable MCP app.</h2>
          <p className="hero-copy">
            The Studio fetches a remote OpenAPI document through a bounded
            server-side import path, then creates a safe local draft.
          </p>
        </div>
        <div className="release-card">
          <span>ACTIVE RUNTIME</span>
          <strong>v0.1</strong>
          <p>Manufact deployment verified</p>
          <a
            href="https://keen-forge-ocsbv.run.mcp-use.com/mcp"
            target="_blank"
            rel="noreferrer"
          >
            Open MCP endpoint ↗
          </a>
        </div>
      </section>
      <section className="import-panel">
        <p className="eyebrow">01 / Import API</p>
        <div>
          <label htmlFor="source-url">OpenAPI JSON URL</label>
          <div className="import-row">
            <input
              id="source-url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://api.example.com/openapi.json"
            />
            <button
              type="button"
              onClick={importSource}
              disabled={importState === "loading"}
            >
              {importState === "loading"
                ? "Importing..."
                : "Import specification"}
            </button>
          </div>
          <p
            className={
              importState === "error"
                ? "import-message error"
                : "import-message"
            }
          >
            {message ||
              "HTTPS JSON only. Local/private networks, redirects, oversized responses, and unsupported schemas are rejected."}
          </p>
        </div>
      </section>
      <section className="progress-strip" aria-label="Build progress">
        {["Import API", "Curate tools", "Bind views", "Test", "Publish"].map(
          (step, index) => (
            <div key={step} className={index < 2 ? "complete" : ""}>
              <span>{index < 2 ? "✓" : index + 1}</span>
              {step}
            </div>
          ),
        )}
      </section>
      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">02 / Curate operations</p>
            <h3>
              {apiTitle} <small>v{apiVersion}</small>
            </h3>
          </div>
          <span className="selection-counter">
            {selected.length} / 3 selected
          </span>
        </div>
        <div className="operation-list">
          {operations.map((operation) => {
            const isSelected = selected.includes(operation.id);
            const enabled =
              operation.supported && (isSelected || selected.length < 3);
            return (
              <article
                className={operation.supported ? "" : "unsupported"}
                key={`${operation.method}-${operation.path}`}
              >
                <div>
                  <span
                    className={`method ${operation.method === "GET" ? "get" : ""}`}
                  >
                    {operation.method}
                  </span>
                  <code>{operation.path}</code>
                  <h4>{operation.summary}</h4>
                  {operation.reasons.length > 0 && (
                    <p>{operation.reasons.join(" ")}</p>
                  )}
                </div>
                <button
                  className="operation-button"
                  type="button"
                  disabled={!enabled}
                  onClick={() => toggleOperation(operation)}
                >
                  {isSelected
                    ? "Remove"
                    : operation.supported
                      ? "Select"
                      : "Unsupported"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ToolEditor({
  tools,
  operations,
  updateTool,
}: {
  tools: ToolDraft[];
  operations: Operation[];
  updateTool: (
    operationId: string,
    key: keyof Omit<ToolDraft, "operationId">,
    value: string | number,
  ) => void;
}) {
  return (
    <div className="workspace">
      <section className="editor-intro">
        <p className="eyebrow">03 / Tool drafts</p>
        <h2>Give the model and your users a clear contract.</h2>
        <p>
          These are local drafts. Publishing and runtime activation remain
          explicit later lifecycle steps.
        </p>
      </section>
      <section className="tool-editor-list">
        {tools.map((tool) => {
          const operation = operations.find(
            (item) => item.id === tool.operationId,
          );
          return (
            <article className="tool-editor-card" key={tool.operationId}>
              <div className="editor-card-heading">
                <div>
                  <code>
                    {operation?.method} {operation?.path}
                  </code>
                  <h3>{operation?.summary}</h3>
                </div>
                <span>{tool.view}</span>
              </div>
              <label>
                Tool name
                <input
                  value={tool.name}
                  onChange={(event) =>
                    updateTool(tool.operationId, "name", event.target.value)
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  value={tool.description}
                  onChange={(event) =>
                    updateTool(
                      tool.operationId,
                      "description",
                      event.target.value,
                    )
                  }
                />
              </label>
              <div className="editor-grid">
                <label>
                  Result limit
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tool.resultLimit}
                    onChange={(event) =>
                      updateTool(
                        tool.operationId,
                        "resultLimit",
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  View template
                  <select
                    value={tool.view}
                    onChange={(event) =>
                      updateTool(tool.operationId, "view", event.target.value)
                    }
                  >
                    <option>Summary card</option>
                    <option>Data table</option>
                    <option>Ranked list</option>
                  </select>
                </label>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function ViewEditor({
  tools,
  views,
  updateTool,
  updateView,
}: {
  tools: ToolDraft[];
  views: Record<string, ViewDraft>;
  updateTool: (
    operationId: string,
    key: keyof Omit<ToolDraft, "operationId">,
    value: string | number,
  ) => void;
  updateView: (
    operationId: string,
    key: keyof ViewDraft,
    value: string,
  ) => void;
}) {
  const [selectedToolId, setSelectedToolId] = useState(
    tools[0]?.operationId ?? "",
  );
  const tool =
    tools.find((item) => item.operationId === selectedToolId) ?? tools[0];
  if (tool === undefined)
    return (
      <div className="placeholder">
        <p className="eyebrow">View builder</p>
        <h2>Select a tool first.</h2>
        <p>
          Return to Build and select an eligible operation to configure its
          result view.
        </p>
      </div>
    );
  const view = views[tool.operationId] ?? createViewDraft(tool.view);
  const chooseTemplate = (template: string) => {
    updateTool(tool.operationId, "view", template);
    updateView(tool.operationId, "template", template);
  };
  return (
    <div className="workspace view-workspace">
      <section className="editor-intro">
        <p className="eyebrow">04 / Configure views</p>
        <h2>Attach an intentional UI to every result.</h2>
        <p>
          Template fields below bind to fixture paths for preview. Published
          runtime binding remains a later lifecycle step.
        </p>
      </section>
      <div className="view-tool-picker">
        {tools.map((item) => (
          <button
            type="button"
            className={item.operationId === tool.operationId ? "selected" : ""}
            key={item.operationId}
            onClick={() => setSelectedToolId(item.operationId)}
          >
            {item.name}
            <small>{item.view}</small>
          </button>
        ))}
      </div>
      <section className="template-gallery">
        <p className="eyebrow">Template gallery</p>
        <div>
          {["Summary card", "Data table", "Ranked list"].map((template) => (
            <button
              type="button"
              className={
                view.template === template ? "template selected" : "template"
              }
              key={template}
              onClick={() => chooseTemplate(template)}
            >
              <span
                className={`template-art ${template.replaceAll(" ", "-").toLowerCase()}`}
              >
                <i />
                <i />
                <i />
              </span>
              <strong>{template}</strong>
              <small>
                {template === "Summary card"
                  ? "Single object and key metrics"
                  : template === "Data table"
                    ? "Rows, metadata, and labels"
                    : "Sorted people or entities"}
              </small>
            </button>
          ))}
        </div>
      </section>
      <section className="binding-grid">
        <div className="binding-panel">
          <p className="eyebrow">Field bindings</p>
          <h3>{tool.name}</h3>
          <label>
            Primary label
            <select
              value={view.titleField}
              onChange={(event) =>
                updateView(tool.operationId, "titleField", event.target.value)
              }
            >
              {["full_name", "title", "login"].map((field) => (
                <option key={field}>{field}</option>
              ))}
            </select>
          </label>
          <label>
            Supporting detail
            <select
              value={view.detailField}
              onChange={(event) =>
                updateView(tool.operationId, "detailField", event.target.value)
              }
            >
              {["description", "author", "contributions"].map((field) => (
                <option key={field}>{field}</option>
              ))}
            </select>
          </label>
          <label>
            {view.template === "Summary card"
              ? "Primary metric"
              : "Secondary metadata"}
            <select
              value={view.metricField}
              onChange={(event) =>
                updateView(tool.operationId, "metricField", event.target.value)
              }
            >
              {["stars", "updatedAt", "contributions", "language"].map(
                (field) => (
                  <option key={field}>{field}</option>
                ),
              )}
            </select>
          </label>
          <p className="binding-note">
            Binding discovery from response schemas is intentionally deferred.
            These controlled paths make the preview and configuration contract
            visible now.
          </p>
        </div>
        <ViewPreview view={view} />
      </section>
    </div>
  );
}

function summaryValue(field: string, fallback: string) {
  const values: Record<string, string> = {
    full_name: previewData.full_name,
    description: previewData.description,
    stars: previewData.stars,
    forks: previewData.forks,
    language: previewData.language,
  };
  return values[field] ?? fallback;
}

function ViewPreview({ view }: { view: ViewDraft }) {
  if (view.template === "Data table")
    return (
      <section className="preview-panel">
        <p className="eyebrow">Live fixture preview</p>
        <div className="preview-table">
          <header>
            <strong>Issues</strong>
            <span>2 rows</span>
          </header>
          {previewData.issues.map((issue) => (
            <article key={issue.title}>
              <div>
                <strong>
                  {issue[view.titleField as keyof typeof issue] ?? issue.title}
                </strong>
                <span>
                  {issue[view.detailField as keyof typeof issue] ??
                    issue.author}
                </span>
              </div>
              <em>
                {issue[view.metricField as keyof typeof issue] ??
                  issue.updatedAt}
              </em>
            </article>
          ))}
        </div>
      </section>
    );
  if (view.template === "Ranked list")
    return (
      <section className="preview-panel">
        <p className="eyebrow">Live fixture preview</p>
        <div className="preview-rank">
          <h3>Top contributors</h3>
          {previewData.contributors.map((person, index) => (
            <article key={person.login}>
              <b>0{index + 1}</b>
              <span>
                {person[view.titleField as keyof typeof person] ?? person.login}
              </span>
              <strong>
                {person[view.metricField as keyof typeof person] ??
                  person.contributions}
              </strong>
            </article>
          ))}
        </div>
      </section>
    );
  return (
    <section className="preview-panel">
      <p className="eyebrow">Live fixture preview</p>
      <div className="preview-summary">
        <span>Repository overview</span>
        <h3>{summaryValue(view.titleField, previewData.full_name)}</h3>
        <p>{summaryValue(view.detailField, previewData.description)}</p>
        <strong>
          {summaryValue(view.metricField, previewData.stars)}
          <small>{view.metricField}</small>
        </strong>
      </div>
    </section>
  );
}

function PublishWorkspace({
  project,
  versions,
  message,
  saveDraft,
  publishVersion,
  runtimeCompatible,
  connectRuntime,
}: {
  project: PersistedProject | null;
  versions: PersistedVersion[];
  message: string;
  saveDraft: () => void;
  publishVersion: (version: PersistedVersion) => void;
  runtimeCompatible: boolean;
  connectRuntime: (serverId: string, runtimeUrl: string) => Promise<void>;
}) {
  const [serverId, setServerId] = useState(project?.runtime_server_id ?? "");
  const [runtimeUrl, setRuntimeUrl] = useState(project?.runtime_url ?? "");
  const [runtimeMessage, setRuntimeMessage] = useState("");
  return (
    <div className="workspace publish-workspace">
      <section className="editor-intro">
        <p className="eyebrow">06 / Publish lifecycle</p>
        <h2>Make configuration changes traceable.</h2>
        <p>
          Drafts persist in Supabase. Publishing changes the active Studio
          version, while runtime activation remains a separately controlled
          release boundary.
        </p>
      </section>
      <section className="publish-summary">
        <div>
          <span>PROJECT</span>
          <strong>{project?.name ?? "Not persisted yet"}</strong>
        </div>
        <div>
          <span>ACTIVE VERSION</span>
          <strong>
            {versions.find(
              (version) => version.id === project?.active_version_id,
            )?.version_number
              ? `v${versions.find((version) => version.id === project?.active_version_id)?.version_number}`
              : "None"}
          </strong>
        </div>
        <button type="button" onClick={saveDraft}>
          Save new draft
        </button>
      </section>
      <div
        className={
          runtimeCompatible ? "compatibility ready" : "compatibility blocked"
        }
      >
        <strong>
          {runtimeCompatible ? "Runtime compatible" : "Studio-only draft"}
        </strong>
        <span>
          {runtimeCompatible
            ? "This GitHub configuration can activate after publish and deliberate Manufact redeploy."
            : "Imported operations can be drafted and previewed, but generic runtime generation is not available yet."}
        </span>
      </div>
      <p className="publish-message">
        {message ||
          "Save the current local configuration as an immutable draft version."}
      </p>
      <section className="runtime-panel">
        <p className="eyebrow">Project runtime</p>
        <h3>{project?.runtime_url ? "Stable MCP server linked" : "Link a dedicated MCP server"}</h3>
        <p>{project?.runtime_url ? `This project keeps ${project.runtime_url} across draft and published versions.` : "Provision one Manufact server for this project, then link its server ID and MCP URL here."}</p>
        <p className="runtime-project-id">Project deployment ID: <code>{project?.id ?? "Save the project first"}</code></p>
        <label>Manufact server ID<input value={serverId} onChange={(event) => setServerId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" /></label>
        <label>Stable MCP URL<input value={runtimeUrl} onChange={(event) => setRuntimeUrl(event.target.value)} placeholder="https://your-server.run.mcp-use.com/mcp" /></label>
        <button type="button" disabled={!project || !serverId || !runtimeUrl} onClick={() => void connectRuntime(serverId, runtimeUrl).then(() => setRuntimeMessage("Runtime linked to this project.")).catch((error) => setRuntimeMessage(error instanceof Error ? error.message : "Could not link runtime."))}>{project?.runtime_url ? "Update runtime link" : "Link runtime"}</button>
        <p className="runtime-message">{runtimeMessage || "After publishing, redeploy this same Manufact server with STUDIO_PROJECT_ID set to this project ID."}</p>
      </section>
      <section className="version-list">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Version history</p>
            <h3>Configuration releases</h3>
          </div>
        </div>
        {versions.length === 0 ? (
          <p className="empty-version">No versions saved yet.</p>
        ) : (
          versions.map((version) => (
            <article key={version.id}>
              <div>
                <strong>v{version.version_number}</strong>
                <span>{new Date(version.created_at).toLocaleString()}</span>
              </div>
              <span className={`version-state ${version.state}`}>
                {version.state}
              </span>
              {version.state === "draft" ? (
                <button type="button" onClick={() => publishVersion(version)}>
                  Publish version
                </button>
              ) : (
                <span className="version-action">
                  {version.state === "published"
                    ? "Active Studio version"
                    : "Superseded"}
                </span>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Placeholder({
  section,
}: {
  section: Exclude<Section, "Build" | "Tools" | "Views" | "Flows" | "Publish">;
}) {
  const copy: Record<
    Exclude<Section, "Build" | "Tools" | "Views" | "Flows" | "Publish">,
    string
  > = {
    Test: "Test runs will make input mappings, output data, and errors inspectable before publish.",
  };
  return (
    <div className="placeholder">
      <p className="eyebrow">Planned workspace</p>
      <h2>{section} is next in the lifecycle.</h2>
      <p>{copy[section]}</p>
      <span>Phase 2.4 in progress</span>
    </div>
  );
}

export default App;
