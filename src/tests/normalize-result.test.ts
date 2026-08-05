import { describe, expect, it } from "vitest";

import { normalizeGitHubResult } from "../runtime/normalize-result.js";

describe("normalizeGitHubResult", () => {
  it("excludes pull requests from issue results and respects the result limit", () => {
    const result = normalizeGitHubResult("issues/list-for-repo", [
      { number: 1, title: "Issue", labels: [{ name: "bug" }], user: { login: "octo" }, comments: 2, updated_at: "2026-08-05", html_url: "https://example.com/1" },
      { number: 2, pull_request: {}, title: "Pull request" },
    ], 1);
    expect(result).toEqual({ items: [expect.objectContaining({ number: 1, labels: ["bug"], author: "octo" })] });
  });
});
