import { describe, expect, it } from "vitest";

import { appConfigSchema } from "../config/schema.js";

const validConfig = {
  app: { name: "GitHub Repository Assistant", version: "0.1.0" },
  api: { baseUrl: "https://api.github.com", allowedHosts: ["api.github.com"] },
  tools: [{
    operationId: "repos/get",
    name: "get_repository_overview",
    description: "Get a repository.",
    resultLimit: 1,
    annotations: { readOnly: true, destructive: false, openWorld: true },
    view: { type: "summary-card" },
  }],
};

describe("appConfigSchema", () => {
  it("accepts a bounded HTTPS GitHub configuration", () => {
    expect(appConfigSchema.parse(validConfig).tools).toHaveLength(1);
  });

  it("rejects an API host that is not allowlisted", () => {
    const result = appConfigSchema.safeParse({ ...validConfig, api: { ...validConfig.api, allowedHosts: ["example.com"] } });
    expect(result.success).toBe(false);
  });

  it("rejects more than three configured tools", () => {
    const tools = Array.from({ length: 4 }, (_, index) => ({ ...validConfig.tools[0], name: `tool_${index}` }));
    expect(appConfigSchema.safeParse({ ...validConfig, tools }).success).toBe(false);
  });
});
