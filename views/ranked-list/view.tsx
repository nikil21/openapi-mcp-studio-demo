import { ThemeProvider, useToolContext } from "mcp-use/react";

import "./view.css";

type Contributor = { login?: string; avatarUrl?: string; contributions?: number; htmlUrl?: string };
type ToolOutput = { result: { items: Contributor[] } };

export default function RankedList() {
  const view = useToolContext();
  if (view.status === "pending") return <main className="ranked-list"><p className="kicker">Contributors</p><h1>Loading contributors...</h1></main>;
  if (view.status === "error") return <main className="ranked-list"><p className="kicker">Contributors</p><h1>Could not load contributors</h1><p>{view.error.message}</p></main>;
  const contributors = (view.toolOutput as ToolOutput).result.items;
  const maximum = Math.max(...contributors.map((contributor) => contributor.contributions ?? 0), 1);
  return <ThemeProvider><main className="ranked-list"><p className="kicker">Top contributors</p><h1>Contribution rank</h1>{contributors.length === 0 ? <p className="empty">No contributors were returned.</p> : <ol>{contributors.map((contributor, index) => <li key={contributor.login}><span className="rank">{String(index + 1).padStart(2, "0")}</span>{contributor.avatarUrl ? <img src={contributor.avatarUrl} alt="" /> : <span className="avatar-placeholder" /> }<div className="person"><a href={contributor.htmlUrl} target="_blank" rel="noreferrer">{contributor.login ?? "Unknown"}</a><span className="bar"><i style={{ width: `${((contributor.contributions ?? 0) / maximum) * 100}%` }} /></span></div><strong>{contributor.contributions?.toLocaleString() ?? 0}</strong></li>)}</ol>}</main></ThemeProvider>;
}
