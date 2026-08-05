import type { AppConfig } from "../config/schema.js";
import type { CatalogOperation } from "../openapi/parse.js";

type ToolConfig = AppConfig["tools"][number];

export type RequestParameters = {
  path: Record<string, string>;
  query: URLSearchParams;
};

export function resolveResultLimit(tool: ToolConfig, input: Record<string, unknown>): number {
  const limitInput = Object.entries(tool.parameterMappings).find(([, upstream]) => upstream === "per_page")?.[0];
  const requested = limitInput === undefined ? undefined : input[limitInput];
  return typeof requested === "number" && Number.isInteger(requested) && requested > 0
    ? Math.min(requested, tool.resultLimit)
    : tool.resultLimit;
}

export function upstreamPageSize(operationId: string, resultLimit: number): number {
  // GitHub's issues endpoint includes pull requests, so fetch enough rows to filter them safely.
  return operationId === "issues/list-for-repo" ? Math.min(Math.max(resultLimit * 4, 30), 100) : resultLimit;
}

function stringifyParameter(value: string | number | boolean | Array<string | number | boolean>): string {
  return Array.isArray(value) ? value.map(String).join(",") : String(value);
}

export function mapRequestParameters(
  operation: CatalogOperation,
  tool: ToolConfig,
  input: Record<string, unknown>
): RequestParameters {
  const path: Record<string, string> = {};
  const query = new URLSearchParams();

  for (const parameter of operation.parameters) {
    const inputName = Object.entries(tool.parameterMappings).find(([, upstream]) => upstream === parameter.name)?.[0] ?? parameter.name;
    const value = input[inputName] ?? tool.defaults[inputName];
    if (value === undefined) continue;
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean" && !Array.isArray(value)) {
      throw new Error(`Parameter ${inputName} must be a primitive value or array.`);
    }
    const serialized = stringifyParameter(value as string | number | boolean | Array<string | number | boolean>);
    if (parameter.location === "path") path[parameter.name] = serialized;
    else query.set(parameter.name, serialized);
  }

  if (operation.parameters.some((parameter) => parameter.name === "per_page") && !query.has("per_page")) {
    query.set("per_page", String(tool.resultLimit));
  }

  return { path, query };
}

export function buildRequestUrl(baseUrl: string, pathTemplate: string, parameters: RequestParameters): URL {
  const resolvedPath = pathTemplate.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = parameters.path[name];
    if (value === undefined) throw new Error(`Missing required path parameter: ${name}.`);
    return encodeURIComponent(value);
  });
  const url = new URL(resolvedPath, baseUrl);
  url.search = parameters.query.toString();
  return url;
}
