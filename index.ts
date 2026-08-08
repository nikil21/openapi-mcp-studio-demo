import { MCPServer } from "mcp-use";
import { z } from "zod";

import githubOpenApi from "./examples/github-openapi-subset.json" with { type: "json" };
import { loadAppConfig } from "./src/config/load.js";
import { appConfigSchema } from "./src/config/schema.js";
import type { AppConfig } from "./src/config/schema.js";
import { parseOpenApiDocument } from "./src/openapi/parse.js";
import { executeGetRequest, SafeExecutionError } from "./src/runtime/execute-http.js";
import { executeJsonPostRequest } from "./src/runtime/execute-http.js";
import { consumeLeadIntent, createLeadIntent, validateLeadPayload } from "./src/runtime/lead-intents.js";
import { normalizeGitHubResult } from "./src/runtime/normalize-result.js";
import { buildRequestUrl, mapRequestParameters, resolveResultLimit, upstreamPageSize } from "./src/runtime/parameters.js";

const server = new MCPServer({
  name: "openapi-mcp-studio-demo",
  title: "OpenAPI-to-MCP Studio",
  version: "0.1.0",
  description: "Curate a supported OpenAPI subset into safe MCP tools.",
  instructions: "Use open-studio to browse the supported GitHub API operations.",
  icons: [{ src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] }],
});

const catalog = parseOpenApiDocument(githubOpenApi);
const appConfig = await loadAppConfig();

const operationSchema = z.object({
  operationId: z.string(),
  method: z.string(),
  path: z.string(),
  summary: z.string(),
  parameters: z.array(
    z.object({
      name: z.string(),
      location: z.enum(["path", "query"]),
      required: z.boolean(),
      type: z.string(),
      description: z.string().optional(),
    })
  ),
  supported: z.boolean(),
  reasons: z.array(z.string()),
});

const openStudioOutputSchema = z.object({
  title: z.string(),
  version: z.string(),
  source: z.string(),
  operations: z.array(operationSchema),
  config: appConfigSchema,
});

export const openStudio = server.tool(
  {
    name: "open-studio",
    title: "Open OpenAPI Studio",
    description: "Browse the bundled GitHub OpenAPI subset and select supported operations.",
    inputSchema: z.object({}),
    outputSchema: openStudioOutputSchema,
    view: { name: "studio", prefersBorder: false },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async () => ({
    content: [
      {
        type: "text",
        text: `${catalog.operations.filter((operation) => operation.supported).length} supported operations are ready to configure.`,
      },
    ],
    structuredContent: { ...catalog, config: appConfig },
  })
);

const configuredToolOutputSchema = z.object({
  requestId: z.string(),
  operationId: z.string(),
  result: z.unknown(),
});

function viewNameFor(type: (typeof appConfig.tools)[number]["view"]["type"]): string {
  if (type === "summary-card") return "summary-card";
  if (type === "data-table") return "data-table";
  return "ranked-list";
}

function createInputSchema(operation: (typeof catalog.operations)[number], tool: (typeof appConfig.tools)[number]) {
  const shape: Record<string, z.ZodType> = {};
  for (const parameter of operation.parameters) {
    const inputName = Object.entries(tool.parameterMappings).find(([, upstream]) => upstream === parameter.name)?.[0] ?? parameter.name;
    let schema: z.ZodType;
    if (parameter.type === "integer") schema = z.number().int();
    else if (parameter.type === "number") schema = z.number();
    else if (parameter.type === "boolean") schema = z.boolean();
    else schema = z.string();
    shape[inputName] = parameter.required
      ? schema.describe(tool.inputLabels[inputName] ?? parameter.description ?? inputName)
      : schema.optional().describe(tool.inputLabels[inputName] ?? parameter.description ?? inputName);
  }
  return z.object(shape);
}

async function executeConfiguredOperation(
  operation: (typeof catalog.operations)[number],
  toolConfig: (typeof appConfig.tools)[number],
  input: Record<string, unknown>,
  requestId: string
) {
  const resultLimit = resolveResultLimit(toolConfig, input);
  const parameters = mapRequestParameters(operation, toolConfig, input);
  if (operation.parameters.some((parameter) => parameter.name === "per_page")) {
    parameters.query.set("per_page", String(upstreamPageSize(operation.operationId, resultLimit)));
  }
  const url = buildRequestUrl(appConfig.api.baseUrl, operation.path, parameters);
  const upstream = await executeGetRequest({
    url,
    api: appConfig.api,
    toolName: toolConfig.name,
    pathTemplate: operation.path,
    requestId,
  });
  return normalizeGitHubResult(operation.operationId, upstream, resultLimit);
}

for (const toolConfig of appConfig.tools) {
  const operation = catalog.operations.find((candidate) => candidate.operationId === toolConfig.operationId);
  if (operation === undefined || !operation.supported) {
    throw new Error(`Configured operation ${toolConfig.operationId} is not supported.`);
  }

  server.tool(
    {
      name: toolConfig.name,
      title: toolConfig.name.replaceAll("_", " "),
      description: toolConfig.description,
      inputSchema: createInputSchema(operation, toolConfig),
      outputSchema: configuredToolOutputSchema,
      view: {
        name: viewNameFor(toolConfig.view.type),
        prefersBorder: false,
        csp: { resourceDomains: ["https://avatars.githubusercontent.com"] },
      },
      annotations: {
        readOnlyHint: toolConfig.annotations.readOnly,
        destructiveHint: toolConfig.annotations.destructive,
        openWorldHint: toolConfig.annotations.openWorld,
      },
    },
    async (input) => {
        const requestId = crypto.randomUUID();
      try {
        const result = await executeConfiguredOperation(operation, toolConfig, input as Record<string, unknown>, requestId);
        return {
          content: [{ type: "text", text: `${toolConfig.name} completed. Request ID: ${requestId}` }],
          structuredContent: { requestId, operationId: operation.operationId, result },
        };
      } catch (error) {
        const safeError = error instanceof SafeExecutionError ? error : new SafeExecutionError("Tool execution failed.", requestId);
        return {
          content: [{ type: "text", text: `${safeError.message} Request ID: ${safeError.requestId}` }],
          structuredContent: { requestId: safeError.requestId, operationId: operation.operationId, result: null },
          isError: true,
        };
      }
    }
  );
}

const briefingOutputSchema = z.object({
  requestId: z.string(),
  overview: z.unknown(),
  issues: z.unknown().optional(),
  contributors: z.unknown().optional(),
  executionTrace: z.array(z.string()),
});

const leadSandboxUrl = process.env.LEAD_SANDBOX_URL;

server.tool(
  { name: "start_lead_capture", title: "Start demo lead capture", description: "Open a demo-only lead form. Do not use real customer data.", inputSchema: z.object({}), outputSchema: z.object({ intentId: z.string(), demoOnly: z.literal(true) }), view: { name: "lead-capture", prefersBorder: false }, annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } },
  async () => ({ content: [{ type: "text", text: "Complete the demo lead form, review it, then confirm submission." }], structuredContent: { intentId: createLeadIntent(), demoOnly: true as const } })
);

server.tool(
  { name: "submit_lead_capture", title: "Submit confirmed demo lead", description: "Submit the reviewed demo lead form once.", inputSchema: z.object({ intentId: z.string().uuid(), name: z.string(), email: z.string(), company: z.string().optional() }), outputSchema: z.object({ leadReference: z.string(), demoOnly: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } },
  async ({ intentId, ...input }) => {
    const requestId = crypto.randomUUID();
    try {
      if (leadSandboxUrl === undefined) throw new Error("Demo lead sandbox is not configured.");
      const payload = validateLeadPayload(input);
      consumeLeadIntent(intentId, payload);
      const url = new URL("/leads", leadSandboxUrl);
      const api = { baseUrl: `${url.protocol}//${url.host}`, allowedHosts: [url.hostname], defaultHeaders: {} };
      const result = await executeJsonPostRequest({ url, api, toolName: "submit_lead_capture", pathTemplate: "/leads", requestId, body: payload, environment: process.env.NODE_ENV });
      const leadReference = result !== null && typeof result === "object" && "id" in result && typeof result.id === "string" ? result.id : undefined;
      if (leadReference === undefined) throw new Error("Demo lead sandbox returned an invalid response.");
      console.log(JSON.stringify({ event: "lead_submission_succeeded", requestId, intentId, leadReference }));
      return { content: [{ type: "text", text: `Demo lead submitted. Reference: ${leadReference}` }], structuredContent: { leadReference, demoOnly: true as const } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo lead submission failed.";
      console.log(JSON.stringify({ event: "lead_submission_failed", requestId, intentId }));
      return { content: [{ type: "text", text: `${message} Request ID: ${requestId}` }], structuredContent: { leadReference: "", demoOnly: true as const }, isError: true };
    }
  }
);

function briefingExecutionSteps(flow: AppConfig["flows"][number]) {
  const nodes = ["input", "overview", ...(flow.includeIssues ? ["issues"] : []), ...(flow.includeContributors ? ["contributors"] : []), "condition", "result"];
  const edges = flow.edges ?? nodes.slice(1).map((target, index) => ({ source: nodes[index], target }));
  const nextBySource = new Map(edges.map((edge) => [edge.source, edge.target]));
  const ordered: string[] = [];
  let current = "input";
  while (nextBySource.has(current)) {
    current = nextBySource.get(current)!;
    ordered.push(current);
  }
  return ordered;
}

for (const flow of appConfig.flows) {
  const overviewTool = appConfig.tools.find((tool) => tool.operationId === "repos/get");
  const overviewOperation = catalog.operations.find((operation) => operation.operationId === "repos/get");
  const issuesTool = appConfig.tools.find((tool) => tool.operationId === "issues/list-for-repo");
  const issuesOperation = catalog.operations.find((operation) => operation.operationId === "issues/list-for-repo");
  const contributorsTool = appConfig.tools.find((tool) => tool.operationId === "repos/list-contributors");
  const contributorsOperation = catalog.operations.find((operation) => operation.operationId === "repos/list-contributors");
  if (overviewTool === undefined || overviewOperation === undefined) throw new Error("Repository briefing requires the repository overview tool.");
  if (flow.includeIssues && (issuesTool === undefined || issuesOperation === undefined)) throw new Error("Repository briefing requires the issues tool.");
  if (flow.includeContributors && (contributorsTool === undefined || contributorsOperation === undefined)) throw new Error("Repository briefing requires the contributors tool.");
  const executionSteps = briefingExecutionSteps(flow);

  server.tool(
    {
      name: flow.name,
      title: "Get repository briefing",
      description: flow.description,
      inputSchema: z.object({ owner: z.string().min(1), repo: z.string().min(1) }),
      outputSchema: briefingOutputSchema,
      view: { name: "briefing", prefersBorder: false, csp: { resourceDomains: ["https://avatars.githubusercontent.com"] } },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    },
    async ({ owner, repo }) => {
      const requestId = crypto.randomUUID();
      try {
        let overview: unknown;
        let issues: unknown;
        let contributors: unknown;
        const executionTrace: string[] = [];
        for (const step of executionSteps) {
          if (step === "overview") { overview = await executeConfiguredOperation(overviewOperation, overviewTool, { owner, repo }, requestId); executionTrace.push(step); }
          if (step === "issues" && issuesOperation !== undefined && issuesTool !== undefined) { issues = await executeConfiguredOperation(issuesOperation, issuesTool, { owner, repo }, requestId); executionTrace.push(step); }
          if (step === "contributors" && contributorsOperation !== undefined && contributorsTool !== undefined) { contributors = await executeConfiguredOperation(contributorsOperation, contributorsTool, { owner, repo }, requestId); executionTrace.push(step); }
        }
        executionTrace.push("condition", "result");
        return {
          content: [{ type: "text", text: `Repository briefing completed. Request ID: ${requestId}` }],
          structuredContent: { requestId, overview, ...(issues === undefined ? {} : { issues }), ...(contributors === undefined ? {} : { contributors }), executionTrace },
        };
      } catch (error) {
        const safeError = error instanceof SafeExecutionError ? error : new SafeExecutionError("Flow execution failed.", requestId);
        return { content: [{ type: "text", text: `${safeError.message} Request ID: ${safeError.requestId}` }], structuredContent: { requestId: safeError.requestId, overview: null }, isError: true };
      }
    }
  );
}

export default server;
