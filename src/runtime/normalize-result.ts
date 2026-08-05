function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function normalizeGitHubResult(operationId: string, result: unknown, limit: number): unknown {
  if (operationId === "repos/get") {
    const repository = asRecord(result);
    return {
      fullName: repository.full_name,
      description: repository.description,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      language: repository.language,
      openIssues: repository.open_issues_count,
      htmlUrl: repository.html_url,
    };
  }

  if (operationId === "issues/list-for-repo") {
    const issues = Array.isArray(result) ? result.filter((item) => asRecord(item).pull_request === undefined).slice(0, limit) : [];
    return {
      items: issues.map((item) => {
        const issue = asRecord(item);
        const user = asRecord(issue.user);
        return {
          number: issue.number,
          title: issue.title,
          labels: Array.isArray(issue.labels) ? issue.labels.map((label) => asRecord(label).name).filter((label): label is string => typeof label === "string") : [],
          author: user.login,
          comments: issue.comments,
          updatedAt: issue.updated_at,
          htmlUrl: issue.html_url,
        };
      }),
    };
  }

  if (operationId === "repos/list-contributors") {
    const contributors = Array.isArray(result) ? result.slice(0, limit) : [];
    return {
      items: contributors.map((item) => {
        const contributor = asRecord(item);
        return { login: contributor.login, avatarUrl: contributor.avatar_url, contributions: contributor.contributions, htmlUrl: contributor.html_url };
      }),
    };
  }

  return result;
}
