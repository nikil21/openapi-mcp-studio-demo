import { ThemeProvider, useToolContext } from "mcp-use/react";
import { startTransition, useEffect, useState } from "react";

import type { AppConfig } from "../../src/config/schema.js";
import type { CatalogOperation } from "../../src/openapi/parse.js";
import "./view.css";

type StudioOutput = {
  title: string;
  version: string;
  source: string;
  operations: CatalogOperation[];
  config: AppConfig;
};

const storageKey = "openapi-mcp-studio-config";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function validateBrowserConfig(value: unknown): { data?: AppConfig; error?: string } {
  const config = asRecord(value);
  const app = asRecord(config?.app);
  const api = asRecord(config?.api);
  const tools = config?.tools;
  if (config === undefined || app === undefined || api === undefined || !Array.isArray(tools)) return { error: "Configuration has an invalid shape." };
  if (typeof app.name !== "string" || app.name.length === 0 || typeof app.version !== "string" || app.version.length === 0) return { error: "App name and version are required." };
  if (typeof api.baseUrl !== "string" || !api.baseUrl.startsWith("https://")) return { error: "API base URL must use HTTPS." };
  if (!Array.isArray(api.allowedHosts) || !api.allowedHosts.every((host) => typeof host === "string")) return { error: "At least one allowed host is required." };
  let host: string;
  try { host = new URL(api.baseUrl).hostname; } catch { return { error: "API base URL is invalid." }; }
  if (!api.allowedHosts.includes(host)) return { error: "allowedHosts must include the API base URL host." };
  if (tools.length < 1 || tools.length > 3) return { error: "Select between one and three tools." };
  const names = new Set<string>();
  for (const value of tools) {
    const tool = asRecord(value);
    const annotations = asRecord(tool?.annotations);
    const view = asRecord(tool?.view);
    if (tool === undefined || typeof tool.operationId !== "string" || typeof tool.name !== "string" || !/^[a-z][a-z0-9_]*$/.test(tool.name) || typeof tool.description !== "string" || tool.description.length === 0) return { error: "Each tool needs a lowercase snake_case name and description." };
    if (names.has(tool.name)) return { error: "Tool names must be unique." };
    names.add(tool.name);
    if (typeof tool.resultLimit !== "number" || !Number.isInteger(tool.resultLimit) || tool.resultLimit < 1 || tool.resultLimit > 100) return { error: "Result limits must be integers from 1 to 100." };
    if (annotations === undefined || typeof annotations.readOnly !== "boolean" || typeof annotations.destructive !== "boolean" || typeof annotations.openWorld !== "boolean") return { error: "Tool annotations are invalid." };
    if (view === undefined || !["summary-card", "data-table", "ranked-list"].includes(String(view.type))) return { error: "Select a supported view type." };
  }
  return { data: value as AppConfig };
}

function defaultTool(operation: CatalogOperation): AppConfig["tools"][number] {
  const names: Record<string, { name: string; view: AppConfig["tools"][number]["view"]["type"] }> = {
    "repos/get": { name: "get_repository_overview", view: "summary-card" },
    "issues/list-for-repo": { name: "list_repository_issues", view: "data-table" },
    "repos/list-contributors": { name: "list_top_contributors", view: "ranked-list" },
  };
  const preset = names[operation.operationId] ?? { name: operation.operationId.replaceAll(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""), view: "data-table" as const };
  return {
    operationId: operation.operationId,
    name: preset.name,
    description: operation.summary,
    inputLabels: Object.fromEntries(operation.parameters.map((parameter) => [parameter.name, parameter.description ?? parameter.name])),
    parameterMappings: operation.parameters.some((parameter) => parameter.name === "per_page") ? { limit: "per_page" } : {},
    defaults: {},
    resultLimit: 10,
    annotations: { readOnly: true, destructive: false, openWorld: true },
    view: { type: preset.view },
  };
}

function inputName(tool: AppConfig["tools"][number], parameter: CatalogOperation["parameters"][number]): string {
  return Object.entries(tool.parameterMappings).find(([, upstream]) => upstream === parameter.name)?.[0] ?? parameter.name;
}

export default function StudioView() {
  const view = useToolContext<"open-studio">();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [notice, setNotice] = useState<string>("");

  const output = view.status === "ready" ? (view.toolOutput as StudioOutput) : undefined;
  useEffect(() => {
    if (output === undefined || config !== null) return;
    const saved = window.localStorage.getItem(storageKey);
    let parsed: ReturnType<typeof validateBrowserConfig> | undefined;
    try {
      parsed = saved === null ? undefined : validateBrowserConfig(JSON.parse(saved));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    startTransition(() => setConfig(parsed?.data ?? output.config));
  }, [config, output]);

  if (view.status === "error") {
    return <main className="studio"><p className="eyebrow">OpenAPI-to-MCP Studio</p><h1>Studio unavailable</h1><p>{view.error.message}</p></main>;
  }
  if (view.status === "pending" || config === null || output === undefined) {
    return <main className="studio"><p className="eyebrow">OpenAPI-to-MCP Studio</p><h1>Loading configuration...</h1></main>;
  }

  const validation = validateBrowserConfig(config);
  const selected = new Set(config.tools.map((tool) => tool.operationId));
  const updateTool = (operationId: string, update: (tool: AppConfig["tools"][number]) => AppConfig["tools"][number]) => {
    setConfig((current) => current === null ? current : { ...current, tools: current.tools.map((tool) => tool.operationId === operationId ? update(tool) : tool) });
    setNotice("");
  };
  const toggleOperation = (operation: CatalogOperation) => {
    if (!operation.supported) return;
    setConfig((current) => {
      if (current === null) return current;
      if (current.tools.some((tool) => tool.operationId === operation.operationId)) {
        return { ...current, tools: current.tools.filter((tool) => tool.operationId !== operation.operationId) };
      }
      if (current.tools.length === 3) return current;
      return { ...current, tools: [...current.tools, defaultTool(operation)] };
    });
    setNotice("");
  };
  const save = () => {
    if (validation.data === undefined) {
      setNotice(validation.error ?? "Configuration is invalid.");
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(validation.data));
    setNotice("Saved in this browser. Export the file to update the server configuration.");
  };
  const download = () => {
    if (validation.data === undefined) return setNotice(validation.error ?? "Configuration is invalid.");
    const blob = new Blob([JSON.stringify(validation.data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "app-config.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice("Exported app-config.json.");
  };

  return (
    <ThemeProvider>
      <main className="studio">
        <header className="studio-header">
          <div><p className="eyebrow">OpenAPI-to-MCP Studio</p><h1>{output.title}</h1><p className="subhead">{output.source} · v{output.version} · Configure a maximum of three safe GET tools.</p></div>
          <div className="selection-count"><strong>{config.tools.length}</strong><span>/ 3 selected</span></div>
        </header>

        <section className="notice-panel"><strong>Prototype persistence:</strong> saved edits stay in this browser. The running server uses the checked-in configuration until the exported file is applied and restarted.</section>

        <section className="operation-list" aria-label="OpenAPI operations">
          {output.operations.map((operation) => {
            const isSelected = selected.has(operation.operationId);
            const canSelect = operation.supported && (isSelected || config.tools.length < 3);
            return <article className={`operation ${operation.supported ? "" : "operation-disabled"}`} key={`${operation.method}-${operation.path}`}>
              <div className="operation-topline"><span className={`method method-${operation.method.toLowerCase()}`}>{operation.method}</span><code>{operation.path}</code><span className={`status ${operation.supported ? "status-supported" : "status-unsupported"}`}>{operation.supported ? "Supported" : "Unsupported"}</span></div>
              <h2>{operation.summary}</h2>
              {operation.reasons.length > 0 && <p className="reason">{operation.reasons.join(" ")}</p>}
              <button type="button" disabled={!canSelect} onClick={() => toggleOperation(operation)}>{isSelected ? "Remove" : operation.supported ? "Select operation" : "Unavailable"}</button>
            </article>;
          })}
        </section>

        <section className="editor" aria-label="Tool editor"><div className="section-heading"><p className="eyebrow">Tool editor</p><h2>Refine selected operations</h2></div>
          {config.tools.map((tool) => {
            const operation = output.operations.find((item) => item.operationId === tool.operationId);
            if (operation === undefined) return null;
            return <article className="tool-editor" key={tool.operationId}>
              <h3>{operation.summary}</h3>
              <label>Tool name<input value={tool.name} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, name: event.target.value }))} /></label>
              <label>Description<textarea value={tool.description} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, description: event.target.value }))} /></label>
              <label>Result limit<input type="number" min="1" max="100" value={tool.resultLimit} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, resultLimit: Number(event.target.value) }))} /></label>
              <label>View<select value={tool.view.type} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, view: { type: event.target.value as AppConfig["tools"][number]["view"]["type"] } }))}><option value="summary-card">Summary card</option><option value="data-table">Data table</option><option value="ranked-list">Ranked list</option></select></label>
              <fieldset><legend>Inputs</legend>{operation.parameters.map((parameter) => { const name = inputName(tool, parameter); const defaultValue = tool.defaults[name]; return <div className="input-editor" key={parameter.name}><span>{name}<small>{parameter.location} · {parameter.type}{parameter.required ? " · required" : ""}</small></span><label>Label<input value={tool.inputLabels[name] ?? ""} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, inputLabels: { ...current.inputLabels, [name]: event.target.value } }))} /></label><label>Default<input value={defaultValue === undefined ? "" : String(defaultValue)} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, defaults: { ...current.defaults, [name]: parameter.type === "integer" || parameter.type === "number" ? Number(event.target.value) : event.target.value } }))} /></label></div>; })}</fieldset>
              <fieldset className="annotations"><legend>Annotations</legend>{(["readOnly", "destructive", "openWorld"] as const).map((annotation) => <label key={annotation}><input type="checkbox" checked={tool.annotations[annotation]} onChange={(event) => updateTool(tool.operationId, (current) => ({ ...current, annotations: { ...current.annotations, [annotation]: event.target.checked } }))} />{annotation}</label>)}</fieldset>
            </article>;
          })}
        </section>

        <footer className="studio-footer"><div>{notice || (validation.data !== undefined ? "Configuration is valid." : validation.error)}</div><div><button type="button" onClick={save}>Save locally</button><button type="button" className="secondary" onClick={download}>Export JSON</button></div></footer>
      </main>
    </ThemeProvider>
  );
}
