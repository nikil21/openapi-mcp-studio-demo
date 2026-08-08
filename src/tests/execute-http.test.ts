import { describe, expect, it, vi } from "vitest";

import { appConfigSchema } from "../config/schema.js";
import { assertSafeUpstream, executeGetRequest, executeJsonPostRequest, SafeExecutionError } from "../runtime/execute-http.js";

const api = appConfigSchema.parse({
  app: { name: "Test", version: "0.1.0" },
  api: { baseUrl: "https://api.github.com", allowedHosts: ["api.github.com"], defaultHeaders: { Accept: "application/vnd.github+json" } },
  tools: [{
    operationId: "repos/get",
    name: "get_repository_overview",
    description: "Get a repository.",
    resultLimit: 1,
    annotations: { readOnly: true, destructive: false, openWorld: true },
    view: { type: "summary-card" },
  }],
}).api;

describe("safe HTTP execution", () => {
  it("uses GET, stable headers, and manual redirects", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ name: "mcp-use" }), { status: 200 }));
    await expect(executeGetRequest({ url: new URL("https://api.github.com/repos/mcp-use/mcp-use"), api, toolName: "get_repository_overview", pathTemplate: "/repos/{owner}/{repo}", requestId: "request-1", fetchImpl })).resolves.toEqual({ name: "mcp-use" });
    expect(fetchImpl).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ method: "GET", redirect: "manual" }));
    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("user-agent")).toBe("openapi-mcp-studio-demo/0.1");
  });

  it("rejects non-allowlisted and non-HTTPS hosts", () => {
    expect(() => assertSafeUpstream(new URL("https://example.com/data"), api)).toThrow("not allowlisted");
    expect(() => assertSafeUpstream(new URL("http://api.github.com/data"), api)).toThrow("must use HTTPS");
  });

  it("reports rate limiting without exposing response data", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ message: "rate limit" }), { status: 403, headers: { "x-ratelimit-remaining": "0" } }));
    await expect(executeGetRequest({ url: new URL("https://api.github.com/rate_limit"), api, toolName: "test", pathTemplate: "/rate_limit", requestId: "request-2", fetchImpl })).rejects.toMatchObject({ message: expect.stringContaining("rate limit"), requestId: "request-2" } satisfies Partial<SafeExecutionError>);
  });

  it("sends bounded primitive JSON with server-owned headers", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: "demo_lead_1" }), { status: 201 }));
    await expect(executeJsonPostRequest({ url: new URL("https://api.github.com/leads"), api, toolName: "capture_lead", pathTemplate: "/leads", requestId: "request-3", body: { name: "Demo", email: "demo@example.test" }, fetchImpl })).resolves.toEqual({ id: "demo_lead_1" });
    expect(fetchImpl).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Demo", email: "demo@example.test" }), redirect: "manual" }));
    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("content-type")).toBe("application/json");
  });
});
