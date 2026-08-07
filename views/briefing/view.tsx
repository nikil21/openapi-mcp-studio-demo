import { ThemeProvider, useToolContext } from "mcp-use/react";

import "./view.css";

type Overview = { fullName?: string; description?: string; stars?: number; language?: string; openIssues?: number };
type ToolOutput = { overview: Overview; issues?: { items: Array<{ number?: number; title?: string }> }; contributors?: { items: Array<{ login?: string; contributions?: number }> } };

export default function BriefingView() {
  const view = useToolContext();
  if (view.status === "pending") return <main className="briefing"><p className="kicker">Repository briefing</p><h1>Collecting configured signals...</h1></main>;
  if (view.status === "error") return <main className="briefing"><p className="kicker">Repository briefing</p><h1>Briefing unavailable</h1><p>{view.error.message}</p></main>;
  const output = view.toolOutput as ToolOutput;
  const overview = output.overview;
  return <ThemeProvider><main className="briefing"><header><p className="kicker">Repository briefing</p><h1>{overview.fullName ?? "Repository"}</h1><p>{overview.description ?? "No description available."}</p></header><section className="briefing-metrics"><div><span>Stars</span><strong>{overview.stars?.toLocaleString() ?? "-"}</strong></div><div><span>Language</span><strong>{overview.language ?? "-"}</strong></div><div><span>Open issues</span><strong>{overview.openIssues?.toLocaleString() ?? "-"}</strong></div></section><section className="briefing-columns">{output.issues && <article><p className="kicker">Recent issues</p>{output.issues.items.slice(0, 3).map((issue) => <div key={issue.number}><b>#{issue.number}</b><span>{issue.title}</span></div>)}</article>}{output.contributors && <article><p className="kicker">Top contributors</p>{output.contributors.items.slice(0, 3).map((contributor) => <div key={contributor.login}><span>{contributor.login}</span><b>{contributor.contributions?.toLocaleString()}</b></div>)}</article>}</section></main></ThemeProvider>;
}
