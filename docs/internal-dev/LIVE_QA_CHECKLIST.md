# Live Product QA Checklist

## Clean Session Setup

1. Use an incognito/private browser window at a desktop width near 1440 x 900.
2. Open the hosted Studio URL from `APPLICATION_LINKS.md`.
3. Sign in with your personal Studio account. For isolation testing, use a separate personal test account in a second private session. Do not use real customer data.
4. Start a timer when the Studio first loads.

## Primary GitHub Repository Briefing Flow

1. Create a named project or use an existing owned GitHub project.
2. Import the public GitHub fixture URL from the README.
3. Confirm Repository Overview, Issues, and Contributors are supported and selected.
4. Change one safe property, such as a result limit or tool description.
5. Confirm Summary Card, Data Table, and Ranked List view bindings.
6. Open Flows and confirm the constrained Repository Briefing path is intact.
7. Save a draft and publish an immutable version.
8. Confirm the Publish workspace shows the stable linked MCP URL.
9. Manually redeploy that same linked Manufact server if the published version changed.
10. Open the stable MCP URL in a supported client and request:

```text
Give me a repository briefing for mcp-use/mcp-use: summarize the project,
show its recent open issues, and list its top contributors.
```

11. Confirm the rendered briefing, trace/order, and MCP URL are correct.
12. Record elapsed time, number of manual steps, deployment wait time, failures, and retries.

## UX And Safety Checks

- Refresh Studio and confirm owned project/version persistence.
- Switch projects and confirm no stale project data appears.
- Confirm a second test account cannot see the first account's projects.
- Check narrow width layout and keyboard focus visibility.
- Verify an invalid OpenAPI URL produces a safe error with no raw stack trace.
- Confirm browser network and console output contain no service-role keys or deployment credentials.

## Record Results

Add the following to `APPLICATION_EVIDENCE.md` after the run:

- Start and end time.
- Exact project/runtime used.
- Manual steps and deployment wait.
- Failures or retries.
- Screenshot names captured during the flow.
