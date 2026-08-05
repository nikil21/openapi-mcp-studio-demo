import githubOpenApi from "../../examples/github-openapi-subset.json" with { type: "json" };
import unsupportedOpenApi from "../../examples/unsupported-openapi.json" with { type: "json" };
import { describe, expect, it } from "vitest";

import { parseOpenApiDocument } from "../openapi/parse.js";

describe("parseOpenApiDocument", () => {
  it("classifies the GitHub GET operations as supported", () => {
    const catalog = parseOpenApiDocument(githubOpenApi);
    expect(catalog.operations.filter((operation) => operation.supported)).toHaveLength(3);
    expect(catalog.operations.find((operation) => operation.operationId === "issues/list-for-repo")?.parameters).toEqual(expect.arrayContaining([expect.objectContaining({ name: "state", location: "query" })]));
  });

  it("makes write operations visibly unsupported", () => {
    const catalog = parseOpenApiDocument(githubOpenApi);
    const hooks = catalog.operations.find((operation) => operation.operationId === "repos/create-hook");
    expect(hooks?.supported).toBe(false);
    expect(hooks?.reasons).toContain("Only GET operations are supported in this prototype.");
  });

  it("flags referenced parameters from the unsupported fixture", () => {
    const catalog = parseOpenApiDocument(unsupportedOpenApi);
    expect(catalog.operations[0]).toMatchObject({ supported: false, reasons: ["Referenced parameters are not supported."] });
  });
});
