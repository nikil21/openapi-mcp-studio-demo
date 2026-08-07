import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeChange } from '@xyflow/react'
import { useState } from 'react'
import '@xyflow/react/dist/style.css'
import './flow.css'

type Tool = { name: string }
type FlowNodeData = { label: string; detail: string; tone: 'input' | 'tool' | 'condition' | 'result' }
type FlowDraft = { name: string; owner: string; repo: string; includeIssues: boolean; includeContributors: boolean; positions?: Record<string, { x: number; y: number }> }

const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function FlowNode({ data }: { data: FlowNodeData }) {
  return <div className={`flow-node ${data.tone}`}>
    <Handle type="target" position={Position.Left} />
    <span>{data.tone}</span>
    <strong>{data.label}</strong>
    <small>{data.detail}</small>
    <Handle type="source" position={Position.Right} />
  </div>
}

const nodeTypes = { flow: FlowNode }

export function FlowWorkspace({ tools, flow, onFlowChange, onSaveDraft, message }: { tools: Tool[]; flow: FlowDraft; onFlowChange: (flow: FlowDraft) => void; onSaveDraft: () => void; message: string }) {
  const [trace, setTrace] = useState<Array<{ label: string; status: 'waiting' | 'running' | 'complete' }>>([])
  const steps = [
    { id: 'input', label: 'Collect repository', detail: 'owner, repo', tone: 'input' as const },
    { id: 'overview', label: tools.find((tool) => tool.name === 'get_repository_overview')?.name ?? 'get_repository_overview', detail: 'Repository summary', tone: 'tool' as const },
    ...(flow.includeIssues ? [{ id: 'issues', label: tools.find((tool) => tool.name === 'list_repository_issues')?.name ?? 'list_repository_issues', detail: 'Open issues', tone: 'tool' as const }] : []),
    ...(flow.includeContributors ? [{ id: 'contributors', label: tools.find((tool) => tool.name === 'list_top_contributors')?.name ?? 'list_top_contributors', detail: 'Top contributors', tone: 'tool' as const }] : []),
    { id: 'condition', label: 'Repository found?', detail: 'Continue only on success', tone: 'condition' as const },
    { id: 'result', label: 'Repository briefing', detail: 'Combined result view', tone: 'result' as const },
  ]
  const nodes: Node<FlowNodeData>[] = steps.map((step, index) => ({
    id: step.id,
    type: 'flow',
    position: flow.positions?.[step.id] ?? { x: index * 215, y: step.tone === 'condition' ? 120 : 30 },
    data: { label: step.label, detail: step.detail, tone: step.tone },
  }))
  const edges: Edge[] = steps.slice(1).map((step, index) => ({ id: `${steps[index].id}-${step.id}`, source: steps[index].id, target: step.id, animated: trace.some((item) => item.status === 'running'), style: { stroke: '#5d8975', strokeWidth: 2 } }))
  const onNodesChange = (changes: NodeChange[]) => {
    const positions = { ...(flow.positions ?? {}) }
    let changed = false
    for (const change of changes) {
      if (change.type === 'position' && change.position !== undefined) {
        positions[change.id] = change.position
        changed = true
      }
    }
    if (changed) onFlowChange({ ...flow, positions })
  }
  const runFixture = async () => {
    const nextTrace = steps.map((step) => ({ label: step.label, status: 'waiting' as const }))
    setTrace(nextTrace)
    for (let index = 0; index < nextTrace.length; index += 1) {
      setTrace((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'running' } : step))
      await delay(450)
      setTrace((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'complete' } : step))
    }
  }

  return <div className="workspace flow-workspace">
    <section className="editor-intro"><p className="eyebrow">05 / Constrained flow</p><h2>Compose a brief, not an opaque agent.</h2><p>Each node is explicit, inspectable, and bound to a configured tool. This first version permits only one linear read-only path.</p></section>
    <section className="flow-layout">
      <aside className="flow-controls">
        <p className="eyebrow">Flow settings</p><h3>{flow.name}</h3>
        <label>Owner<input value={flow.owner} onChange={(event) => onFlowChange({ ...flow, owner: event.target.value })} /></label>
        <label>Repository<input value={flow.repo} onChange={(event) => onFlowChange({ ...flow, repo: event.target.value })} /></label>
        <fieldset><legend>Include steps</legend><label><input type="checkbox" checked={flow.includeIssues} onChange={(event) => onFlowChange({ ...flow, includeIssues: event.target.checked })} />Issues</label><label><input type="checkbox" checked={flow.includeContributors} onChange={(event) => onFlowChange({ ...flow, includeContributors: event.target.checked })} />Contributors</label></fieldset>
        <div className="flow-guardrail"><strong>Guardrail</strong><span>Maximum 5 executable nodes. No writes, loops, code, or background jobs.</span></div>
        <button type="button" onClick={() => void runFixture()}>Run fixture flow</button><button className="save-flow" type="button" onClick={onSaveDraft}>Save flow as draft</button><p className="flow-save-message">{message}</p>
      </aside>
      <section className="flow-canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView nodesDraggable panOnDrag><Background color="#d7dfd5" gap={18} /><Controls showInteractive={false} /></ReactFlow></section>
    </section>
    <section className="trace-panel"><div><p className="eyebrow">Execution trace</p><h3>{trace.length === 0 ? 'No run yet' : `${flow.owner}/${flow.repo} fixture run`}</h3></div>{trace.length === 0 ? <p>Run the fixture to inspect each tool call and terminal result in sequence.</p> : <ol>{trace.map((step) => <li className={step.status} key={step.label}><span>{step.status === 'complete' ? '✓' : step.status === 'running' ? '...' : '○'}</span>{step.label}<small>{step.status}</small></li>)}</ol>}</section>
  </div>
}
