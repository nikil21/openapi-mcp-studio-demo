import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node } from '@xyflow/react'
import { useState } from 'react'
import '@xyflow/react/dist/style.css'
import './flow.css'

type Tool = { name: string }
type FlowNodeData = { label: string; detail: string; tone: 'input' | 'tool' | 'condition' | 'result' }

const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function FlowNode({ data }: { data: FlowNodeData }) {
  return <div className={`flow-node ${data.tone}`}><Handle type="target" position={Position.Left} /><span>{data.tone}</span><strong>{data.label}</strong><small>{data.detail}</small><Handle type="source" position={Position.Right} /></div>
}

const nodeTypes = { flow: FlowNode }

export function FlowWorkspace({ tools }: { tools: Tool[] }) {
  const [includeIssues, setIncludeIssues] = useState(true)
  const [includeContributors, setIncludeContributors] = useState(true)
  const [owner, setOwner] = useState('mcp-use')
  const [repo, setRepo] = useState('mcp-use')
  const [trace, setTrace] = useState<Array<{ label: string; status: 'waiting' | 'running' | 'complete' }>>([])

  const steps = [
    { id: 'input', label: 'Collect repository', detail: 'owner, repo', tone: 'input' as const },
    { id: 'overview', label: tools.find((tool) => tool.name === 'get_repository_overview')?.name ?? 'get_repository_overview', detail: 'Repository summary', tone: 'tool' as const },
    ...(includeIssues ? [{ id: 'issues', label: tools.find((tool) => tool.name === 'list_repository_issues')?.name ?? 'list_repository_issues', detail: 'Open issues', tone: 'tool' as const }] : []),
    ...(includeContributors ? [{ id: 'contributors', label: tools.find((tool) => tool.name === 'list_top_contributors')?.name ?? 'list_top_contributors', detail: 'Top contributors', tone: 'tool' as const }] : []),
    { id: 'condition', label: 'Repository found?', detail: 'Continue only on success', tone: 'condition' as const },
    { id: 'result', label: 'Repository briefing', detail: 'Combined result view', tone: 'result' as const },
  ]
  const nodes: Node<FlowNodeData>[] = steps.map((step, index) => ({ id: step.id, type: 'flow', position: { x: index * 215, y: step.tone === 'condition' ? 120 : 30 }, data: { label: step.label, detail: step.detail, tone: step.tone } }))
  const edges: Edge[] = steps.slice(1).map((step, index) => ({ id: `${steps[index].id}-${step.id}`, source: steps[index].id, target: step.id, animated: trace.some((item) => item.status === 'running'), style: { stroke: '#5d8975', strokeWidth: 2 } }))

  const runFixture = async () => {
    const nextTrace = steps.map((step) => ({ label: step.label, status: 'waiting' as const }))
    setTrace(nextTrace)
    for (let index = 0; index < nextTrace.length; index += 1) {
      setTrace((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'running' } : step))
      await delay(450)
      setTrace((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'complete' } : step))
    }
  }

  return <div className="workspace flow-workspace"><section className="editor-intro"><p className="eyebrow">05 / Constrained flow</p><h2>Compose a brief, not an opaque agent.</h2><p>Each node is explicit, inspectable, and bound to a configured tool. This first version permits only one linear read-only path.</p></section><section className="flow-layout"><aside className="flow-controls"><p className="eyebrow">Flow settings</p><h3>Repository Briefing</h3><label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} /></label><label>Repository<input value={repo} onChange={(event) => setRepo(event.target.value)} /></label><fieldset><legend>Include steps</legend><label><input type="checkbox" checked={includeIssues} onChange={(event) => setIncludeIssues(event.target.checked)} />Issues</label><label><input type="checkbox" checked={includeContributors} onChange={(event) => setIncludeContributors(event.target.checked)} />Contributors</label></fieldset><div className="flow-guardrail"><strong>Guardrail</strong><span>Maximum 5 executable nodes. No writes, loops, code, or background jobs.</span></div><button type="button" onClick={() => void runFixture()}>Run fixture flow</button></aside><section className="flow-canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView nodesDraggable panOnDrag><Background color="#d7dfd5" gap={18} /><Controls showInteractive={false} /></ReactFlow></section></section><section className="trace-panel"><div><p className="eyebrow">Execution trace</p><h3>{trace.length === 0 ? 'No run yet' : `${owner}/${repo} fixture run`}</h3></div>{trace.length === 0 ? <p>Run the fixture to inspect each tool call and terminal result in sequence.</p> : <ol>{trace.map((step) => <li className={step.status} key={step.label}><span>{step.status === 'complete' ? '✓' : step.status === 'running' ? '...' : '○'}</span>{step.label}<small>{step.status}</small></li>)}</ol>}</section></div>
}
