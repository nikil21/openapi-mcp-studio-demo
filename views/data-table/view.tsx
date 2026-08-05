import { ThemeProvider, useToolContext } from "mcp-use/react";

import "./view.css";

type Issue = { number?: number; title?: string; labels?: string[]; author?: string; comments?: number; updatedAt?: string; htmlUrl?: string };
type ToolOutput = { result: { items: Issue[] } };

export default function DataTable() {
  const view = useToolContext();
  if (view.status === "pending") return <main className="issue-table"><p className="kicker">Repository issues</p><h1>Loading issues...</h1></main>;
  if (view.status === "error") return <main className="issue-table"><p className="kicker">Repository issues</p><h1>Could not load issues</h1><p>{view.error.message}</p></main>;
  const issues = (view.toolOutput as ToolOutput).result.items;
  return <ThemeProvider><main className="issue-table"><div className="table-heading"><div><p className="kicker">Repository issues</p><h1>Issues <span>{issues.length}</span></h1></div></div>{issues.length === 0 ? <p className="empty">No matching issues were returned.</p> : <div className="table-scroll"><table><thead><tr><th>Issue</th><th>Labels</th><th>Author</th><th>Comments</th><th>Updated</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.number}><td><strong>#{issue.number}</strong>{issue.htmlUrl ? <a href={issue.htmlUrl} target="_blank" rel="noreferrer">{issue.title}</a> : <span>{issue.title}</span>}</td><td><div className="labels">{issue.labels?.map((label) => <span key={label}>{label}</span>)}</div></td><td>{issue.author ?? "-"}</td><td>{issue.comments ?? 0}</td><td>{issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : "-"}</td></tr>)}</tbody></table></div>}</main></ThemeProvider>;
}
