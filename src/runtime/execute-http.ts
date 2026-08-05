import type { AppConfig } from "../config/schema.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000;

export class SafeExecutionError extends Error {
  constructor(
    message: string,
    readonly requestId: string,
    readonly status?: number
  ) {
    super(message);
  }
}

export type ExecuteGetOptions = {
  url: URL;
  api: AppConfig["api"];
  toolName: string;
  pathTemplate: string;
  requestId: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
  environment?: string | undefined;
};

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function assertSafeUpstream(url: URL, api: AppConfig["api"], environment = process.env.NODE_ENV): void {
  const allowsLocalHttp = environment === "development" && isLocalDevelopmentHost(url.hostname);
  if (url.protocol !== "https:" && !allowsLocalHttp) {
    throw new Error("Upstream URL must use HTTPS.");
  }
  if (!api.allowedHosts.includes(url.hostname)) {
    throw new Error("Upstream host is not allowlisted.");
  }
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > maxBytes) {
    throw new Error("Upstream response exceeded the size limit.");
  }

  const reader = response.body?.getReader();
  if (reader === undefined) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Upstream response exceeded the size limit.");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function executeGetRequest(options: ExecuteGetOptions): Promise<unknown> {
  const startedAt = Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  let status: number | undefined;

  try {
    assertSafeUpstream(options.url, options.api, options.environment);
    const headers = new Headers(options.api.defaultHeaders);
    headers.set("Accept", headers.get("Accept") ?? "application/json");
    headers.set("User-Agent", "openapi-mcp-studio-demo/0.1");
    if (options.api.optionalBearerEnv !== undefined) {
      const token = process.env[options.api.optionalBearerEnv];
      if (token !== undefined && token.length > 0) headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetchImpl(options.url, {
      method: "GET",
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    status = response.status;
    if (response.status >= 300 && response.status < 400) throw new Error("Upstream redirects are not permitted.");
    const body = await readBoundedBody(response, maxResponseBytes);
    if (!response.ok) {
      if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
        throw new Error("GitHub rate limit reached. Try again later or configure GITHUB_TOKEN server-side.");
      }
      throw new Error(`Upstream request failed with status ${response.status}.`);
    }
    try {
      return JSON.parse(body) as unknown;
    } catch {
      throw new Error("Upstream response was not valid JSON.");
    }
  } catch (error) {
    const safeMessage = error instanceof Error && error.name === "TimeoutError" ? "Upstream request timed out." : error instanceof Error ? error.message : "Upstream request failed.";
    throw new SafeExecutionError(safeMessage, options.requestId, status);
  } finally {
    console.log(JSON.stringify({ event: "upstream_request", requestId: options.requestId, tool: options.toolName, host: options.url.hostname, pathTemplate: options.pathTemplate, status: status ?? "error", durationMs: Date.now() - startedAt }));
  }
}
