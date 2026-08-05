import githubOpenApi from "../../examples/github-openapi-subset.json" with { type: "json" };
import { describe, expect, it } from "vitest";

import { appConfigSchema } from "../config/schema.js";
import { parseOpenApiDocument } from "../openapi/parse.js";
import { buildRequestUrl, mapRequestParameters, resolveResultLimit, upstreamPageSize } from "../runtime/parameters.js";

const catalog = parseOpenApiDocument(githubOpenApi);
const config = appConfigSchema.parse({
  app: { name: "Test", version: "0.1.0" },
  api: { baseUrl: "https://api.github.com", allowedHosts: ["api.github.com"] },
  tools: [{
    operationId: "issues/list-for-repo",
    name: "list_repository_issues",
    description: "List issues.",
    parameterMappings: { limit: "per_page" },
    defaults: { state: "open" },
    resultLimit: 10,
    annotations: { readOnly: true, destructive: false, openWorld: true },
    view: { type: "data-table" },
  }],
});

describe("request parameter mapping", () => {
  it("maps friendly inputs to encoded path and query parameters", () => {
    const operation = catalog.operations.find((item) => item.operationId === "issues/list-for-repo");
    if (operation === undefined) throw new Error("Missing issues operation.");
    const parameters = mapRequestParameters(operation, config.tools[0], { owner: "mcp use", repo: "mcp-use", limit: 5 });
    const url = buildRequestUrl(config.api.baseUrl, operation.path, parameters);
    expect(url.toString()).toBe("https://api.github.com/repos/mcp%20use/mcp-use/issues?state=open&per_page=5");
  });

  it("uses the configured result limit when no limit input is supplied", () => {
    const operation = catalog.operations.find((item) => item.operationId === "issues/list-for-repo");
    if (operation === undefined) throw new Error("Missing issues operation.");
    const parameters = mapRequestParameters(operation, config.tools[0], { owner: "mcp-use", repo: "mcp-use" });
    expect(parameters.query.get("per_page")).toBe("10");
  });

  it("caps requested output and over-fetches issues before filtering pull requests", () => {
    expect(resolveResultLimit(config.tools[0], { limit: 3 })).toBe(3);
    expect(resolveResultLimit(config.tools[0], { limit: 50 })).toBe(10);
    expect(upstreamPageSize("issues/list-for-repo", 3)).toBe(30);
    expect(upstreamPageSize("repos/list-contributors", 3)).toBe(3);
  });
});
