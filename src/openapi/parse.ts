type Parameter = {
  name?: unknown;
  in?: unknown;
  required?: unknown;
  description?: unknown;
  schema?: unknown;
  $ref?: unknown;
};

type OpenApiOperation = {
  operationId?: unknown;
  summary?: unknown;
  description?: unknown;
  parameters?: unknown;
  requestBody?: unknown;
  responses?: unknown;
};

type PathItem = { parameters?: unknown } & Record<string, unknown>;

export type CatalogOperation = {
  operationId: string;
  method: string;
  path: string;
  summary: string;
  parameters: Array<{
    name: string;
    location: "path" | "query";
    required: boolean;
    type: string;
    description?: string;
  }>;
  supported: boolean;
  reasons: string[];
  requestBody?: { fields: Array<{ name: string; required: boolean; type: string }> };
};

export type OpenApiCatalog = {
  title: string;
  version: string;
  source: string;
  operations: CatalogOperation[];
};

const httpMethods = ["get", "put", "post", "delete", "patch", "head", "options", "trace"] as const;
const primitiveTypes = new Set(["string", "number", "integer", "boolean"]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function parameterSupport(parameter: Parameter): { reason?: string; type?: string } {
  if (typeof parameter.$ref === "string") return { reason: "Referenced parameters are not supported." };
  if (parameter.in !== "path" && parameter.in !== "query") return { reason: "Only path and query parameters are supported." };

  const schema = asRecord(parameter.schema);
  const type = schema?.type;
  if (typeof type !== "string") return { reason: "Parameters require an inline primitive schema." };
  if (type === "array") {
    const itemType = asRecord(schema?.items)?.type;
    return primitiveTypes.has(itemType as string)
      ? { type: `array<${itemType}>` }
      : { reason: "Array parameters require primitive items." };
  }
  return primitiveTypes.has(type) ? { type } : { reason: `Unsupported parameter type: ${type}.` };
}

function hasJsonResponse(operation: OpenApiOperation): boolean {
  const responses = asRecord(operation.responses);
  if (responses === undefined) return false;
  return Object.values(responses).some((response) => {
    const content = asRecord(asRecord(response)?.content);
    return content !== undefined && "application/json" in content;
  });
}

function leadCaptureBodySupport(value: unknown): { reason?: string; fields?: Array<{ name: string; required: boolean; type: string }> } {
  const requestBody = asRecord(value);
  const content = asRecord(requestBody?.content);
  const schema = asRecord(asRecord(content?.["application/json"])?.schema);
  if (requestBody?.$ref !== undefined || content === undefined || Object.keys(content).length !== 1 || schema === undefined) return { reason: "Lead capture requires one inline application/json request body." };
  if (schema.$ref !== undefined || schema.type !== "object" || schema.additionalProperties !== false || schema.oneOf !== undefined || schema.anyOf !== undefined || schema.allOf !== undefined) return { reason: "Lead capture requires a closed inline JSON object schema." };
  const properties = asRecord(schema.properties);
  const required = schema.required;
  if (properties === undefined || (required !== undefined && (!Array.isArray(required) || required.some((field) => typeof field !== "string")))) return { reason: "Lead capture requires named inline fields." };
  const requiredNames = new Set(required ?? []);
  const fields: NonNullable<CatalogOperation["requestBody"]>["fields"] = [];
  for (const [name, value] of Object.entries(properties)) {
    const field = asRecord(value);
    if (field === undefined || field.$ref !== undefined || typeof field.type !== "string" || !primitiveTypes.has(field.type) || field.oneOf !== undefined || field.anyOf !== undefined || field.allOf !== undefined) return { reason: "Lead capture fields must use inline primitive schemas." };
    fields.push({ name, required: requiredNames.has(name), type: field.type });
  }
  if (fields.length === 0 || [...requiredNames].some((name) => !properties.hasOwnProperty(name))) return { reason: "Lead capture required fields must be declared." };
  return { fields };
}

export function classifyOperation(method: string, operation: OpenApiOperation, pathParameters: unknown): CatalogOperation {
  const reasons: string[] = [];
  const isLeadCapture = method === "post" && asRecord(operation)?.["x-mcp-studio-template"] === "lead-capture";
  const bodySupport = isLeadCapture ? leadCaptureBodySupport(operation.requestBody) : undefined;
  if (method !== "get" && !isLeadCapture) reasons.push("Only GET operations and marked lead capture POST operations are supported.");
  if (operation.requestBody !== undefined && !isLeadCapture) reasons.push("Request bodies are not supported.");
  if (bodySupport?.reason !== undefined) reasons.push(bodySupport.reason);
  if (!hasJsonResponse(operation)) reasons.push("A JSON response is required.");

  const parameters = [...(Array.isArray(pathParameters) ? pathParameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])];
  const parsedParameters: CatalogOperation["parameters"] = [];
  for (const value of parameters) {
    const parameter = asRecord(value) as Parameter | undefined;
    if (parameter !== undefined && typeof parameter.$ref === "string") {
      reasons.push("Referenced parameters are not supported.");
      continue;
    }
    if (parameter === undefined || typeof parameter.name !== "string") {
      reasons.push("Parameters must be inline objects with names.");
      continue;
    }
    const support = parameterSupport(parameter);
    if (support.reason !== undefined) {
      reasons.push(support.reason);
      continue;
    }
    parsedParameters.push({
      name: parameter.name,
      location: parameter.in as "path" | "query",
      required: parameter.required === true,
      type: support.type ?? "string",
      ...(typeof parameter.description === "string" ? { description: parameter.description } : {}),
    });
  }

  return {
    operationId: typeof operation.operationId === "string" ? operation.operationId : `${method}_operation`,
    method: method.toUpperCase(),
    path: "",
    summary:
      typeof operation.summary === "string"
        ? operation.summary
        : typeof operation.description === "string"
          ? operation.description
          : "Untitled operation",
    parameters: parsedParameters,
    supported: reasons.length === 0,
    reasons: [...new Set(reasons)],
    ...(bodySupport?.fields === undefined ? {} : { requestBody: { fields: bodySupport.fields } }),
  };
}

export function parseOpenApiDocument(document: unknown): OpenApiCatalog {
  const root = asRecord(document);
  if (root === undefined || typeof root.openapi !== "string" || !root.openapi.startsWith("3.")) {
    throw new Error("Expected an OpenAPI 3.x document.");
  }
  const info = asRecord(root.info);
  const paths = asRecord(root.paths);
  if (paths === undefined) throw new Error("OpenAPI document must contain paths.");

  const operations: CatalogOperation[] = [];
  for (const [path, value] of Object.entries(paths)) {
    const pathItem = asRecord(value) as PathItem | undefined;
    if (pathItem === undefined) continue;
    for (const method of httpMethods) {
      const operation = asRecord(pathItem[method]) as OpenApiOperation | undefined;
      if (operation === undefined) continue;
      const classified = classifyOperation(method, operation, pathItem.parameters);
      classified.path = path;
      operations.push(classified);
    }
  }

  return {
    title: typeof info?.title === "string" ? info.title : "Untitled OpenAPI document",
    version: typeof info?.version === "string" ? info.version : "unknown",
    source: typeof root.openapi === "string" ? `OpenAPI ${root.openapi}` : "OpenAPI",
    operations,
  };
}
