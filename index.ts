import { MCPServer } from "mcp-use";
import { z } from "zod";

import githubOpenApi from "./examples/github-openapi-subset.json" with { type: "json" };
import { loadAppConfig } from "./src/config/load.js";
import { appConfigSchema } from "./src/config/schema.js";
import { parseOpenApiDocument } from "./src/openapi/parse.js";
import { executeGetRequest, SafeExecutionError } from "./src/runtime/execute-http.js";
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
const appConfig = loadAppConfig();

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
        const resultLimit = resolveResultLimit(toolConfig, input as Record<string, unknown>);
        const parameters = mapRequestParameters(operation, toolConfig, input as Record<string, unknown>);
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
        const result = normalizeGitHubResult(operation.operationId, upstream, resultLimit);
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

export default server;
