import { z } from "zod";

export const viewTypeSchema = z.enum(["summary-card", "data-table", "ranked-list"]);

const annotationSchema = z.object({
  readOnly: z.boolean(),
  destructive: z.boolean(),
  openWorld: z.boolean(),
});

const toolConfigSchema = z.object({
  operationId: z.string().min(1),
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, "Use a lowercase snake_case tool name."),
  description: z.string().min(1),
  inputLabels: z.record(z.string(), z.string().min(1)).default({}),
  parameterMappings: z.record(z.string(), z.string().min(1)).default({}),
  defaults: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  resultLimit: z.number().int().min(1).max(100),
  annotations: annotationSchema,
  view: z.object({ type: viewTypeSchema }),
});

const flowConfigSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, "Use a lowercase snake_case flow name."),
  description: z.string().min(1),
  kind: z.literal("repository-briefing"),
  includeIssues: z.boolean(),
  includeContributors: z.boolean(),
  edges: z.array(z.object({ id: z.string().min(1), source: z.string().min(1), target: z.string().min(1) })).max(6).optional(),
  view: z.object({ type: z.literal("briefing") }),
});

export const appConfigSchema = z
  .object({
    app: z.object({ name: z.string().min(1), version: z.string().min(1) }),
    api: z.object({
      baseUrl: z.url().refine((value) => new URL(value).protocol === "https:", "API base URL must use HTTPS."),
      allowedHosts: z.array(z.string().min(1)).min(1),
      defaultHeaders: z.record(z.string(), z.string()).default({}),
      optionalBearerEnv: z.string().min(1).optional(),
    }),
    tools: z.array(toolConfigSchema).min(1).max(3),
    flows: z.array(flowConfigSchema).max(1).default([]),
  })
  .superRefine((config, context) => {
    const baseHost = new URL(config.api.baseUrl).hostname;
    if (!config.api.allowedHosts.includes(baseHost)) {
      context.addIssue({
        code: "custom",
        path: ["api", "allowedHosts"],
        message: "allowedHosts must include the API base URL host.",
      });
    }

    const names = new Set<string>();
    for (const [index, tool] of config.tools.entries()) {
      if (names.has(tool.name)) {
        context.addIssue({
          code: "custom",
          path: ["tools", index, "name"],
          message: "Tool names must be unique.",
        });
      }
      names.add(tool.name);
    }

    for (const [index, flow] of config.flows.entries()) {
      if (flow.edges === undefined) continue;
      const required = ["input", "overview", ...(flow.includeIssues ? ["issues"] : []), ...(flow.includeContributors ? ["contributors"] : []), "condition", "result"];
      if (flow.edges.length !== required.length - 1) {
        context.addIssue({ code: "custom", path: ["flows", index, "edges"], message: "Flow graph must connect every enabled step exactly once." });
        continue;
      }
      const nextBySource = new Map<string, string>();
      const incoming = new Set<string>();
      for (const edge of flow.edges) {
        if (!required.includes(edge.source) || !required.includes(edge.target) || edge.source === edge.target || nextBySource.has(edge.source) || incoming.has(edge.target)) {
          context.addIssue({ code: "custom", path: ["flows", index, "edges"], message: "Flow graph must be a single linear path." });
          break;
        }
        nextBySource.set(edge.source, edge.target);
        incoming.add(edge.target);
      }
      const ordered = ["input"];
      while (nextBySource.has(ordered.at(-1)!)) {
        const next = nextBySource.get(ordered.at(-1)!)!;
        if (ordered.includes(next)) break;
        ordered.push(next);
      }
      const optional = new Set(required.slice(2, -2));
      if (ordered.length !== required.length || ordered[1] !== "overview" || ordered.at(-2) !== "condition" || ordered.at(-1) !== "result" || ordered.slice(2, -2).some((node) => !optional.has(node))) context.addIssue({ code: "custom", path: ["flows", index, "edges"], message: "Flow graph must start with overview and end with condition then result." });
    }
  });

export type AppConfig = z.infer<typeof appConfigSchema>;
