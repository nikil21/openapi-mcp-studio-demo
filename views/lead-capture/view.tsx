import { ThemeProvider, useDynamicTool, useToolContext } from "mcp-use/react";
import { useState } from "react";

import "./view.css";

type StartOutput = { intentId: string; demoOnly: true };
type SubmitOutput = { leadReference: string; demoOnly: true };

export default function LeadCaptureView() {
  const view = useToolContext();
  const submit = useDynamicTool<{ intentId: string; name: string; email: string; company?: string }, SubmitOutput>("submit_lead_capture");
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [confirming, setConfirming] = useState(false);
  if (view.status === "pending") return <main className="lead-capture"><p>Preparing demo lead form...</p></main>;
  if (view.status === "error") return <main className="lead-capture"><h1>Lead form unavailable</h1><p>{view.error.message}</p></main>;
  const output = view.toolOutput as StartOutput;
  const payload = { name: form.name.trim(), email: form.email.trim(), ...(form.company.trim() === "" ? {} : { company: form.company.trim() }) };
  const valid = payload.name.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
  const submitLead = async () => { await submit.callTool({ intentId: output.intentId, ...payload }); };
  return <ThemeProvider><main className="lead-capture"><p className="lead-kicker">Demo-only lead capture</p>{submit.data ? <section className="lead-success"><h1>Demo lead submitted</h1><p>Reference: <code>{submit.data.structuredContent.leadReference}</code></p><p>No real customer data is retained by this sandbox.</p></section> : confirming ? <section className="lead-confirm"><h1>Review before submission</h1><dl><dt>Name</dt><dd>{payload.name}</dd><dt>Email</dt><dd>{payload.email}</dd>{payload.company && <><dt>Company</dt><dd>{payload.company}</dd></>}</dl>{submit.error && <p className="lead-error">{submit.error.message}</p>}<button type="button" disabled={submit.isPending} onClick={() => void submitLead()}>{submit.isPending ? "Submitting..." : "Confirm and submit demo lead"}</button><button className="secondary" type="button" disabled={submit.isPending} onClick={() => setConfirming(false)}>Back to edit</button></section> : <form onSubmit={(event) => { event.preventDefault(); if (valid) setConfirming(true); }}><h1>Tell us about your demo</h1><p>This sandbox accepts test data only. Review the exact values before submission.</p><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Company <small>Optional</small><input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label><button type="submit" disabled={!valid}>Review submission</button></form>}</main></ThemeProvider>;
}
