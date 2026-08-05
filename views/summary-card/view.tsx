import { ThemeProvider, useToolContext } from "mcp-use/react";

import "./view.css";

type Repository = { fullName?: string; description?: string | null; stars?: number; forks?: number; language?: string | null; openIssues?: number; htmlUrl?: string };
type ToolOutput = { result: Repository };

export default function SummaryCard() {
  const view = useToolContext();
  if (view.status === "pending") return <main className="summary-card"><p className="kicker">Repository overview</p><h1>Loading repository...</h1><div className="skeleton" /></main>;
  if (view.status === "error") return <main className="summary-card"><p className="kicker">Repository overview</p><h1>Could not load repository</h1><p>{view.error.message}</p></main>;
  const repository = (view.toolOutput as ToolOutput).result;
  return <ThemeProvider><main className="summary-card"><p className="kicker">Repository overview</p><h1>{repository.fullName ?? "Repository"}</h1><p className="description">{repository.description || "No repository description is available."}</p><dl><div><dt>Stars</dt><dd>{repository.stars?.toLocaleString() ?? "-"}</dd></div><div><dt>Forks</dt><dd>{repository.forks?.toLocaleString() ?? "-"}</dd></div><div><dt>Language</dt><dd>{repository.language ?? "Not specified"}</dd></div><div><dt>Open issues</dt><dd>{repository.openIssues?.toLocaleString() ?? "-"}</dd></div></dl>{repository.htmlUrl && <a href={repository.htmlUrl} target="_blank" rel="noreferrer">Open on GitHub</a>}</main></ThemeProvider>;
}
