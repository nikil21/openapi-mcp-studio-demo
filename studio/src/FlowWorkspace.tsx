import { addEdge, applyEdgeChanges, Background, Controls, Handle, Position, ReactFlow, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react'
import { useState } from 'react'
import '@xyflow/react/dist/style.css'
import './flow.css'

type Tool = { name: string }
type FlowNodeData = { label: string; detail: string; tone: 'input' | 'tool' | 'condition' | 'result' }
type FlowEdge = { id: string; source: string; target: string }
type FlowDraft = { name: string; owner: string; repo: string; includeIssues: boolean; includeContributors: boolean; positions?: Record<string, { x: number; y: number }>; edges?: FlowEdge[] }

const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function defaultEdges(includeIssues: boolean, includeContributors: boolean): FlowEdge[] {
  const nodes = ['input', 'overview', ...(includeIssues ? ['issues'] : []), ...(includeContributors ? ['contributors'] : []), 'condition', 'result']
  return nodes.slice(1).map((target, index) => ({ id: `${nodes[index]}-${target}`, source: nodes[index], target }))
}

function graphIssue(edges: Edge[], includeIssues: boolean, includeContributors: boolean) {
  const required = ['input', 'overview', ...(includeIssues ? ['issues'] : []), ...(includeContributors ? ['contributors'] : []), 'condition', 'result']
  if (edges.length !== required.length - 1) return 'Connect every enabled step before running or saving.'
  const nextBySource = new Map<string, string>()
  const incoming = new Set<string>()
  for (const edge of edges) {
    if (!required.includes(edge.source) || !required.includes(edge.target) || nextBySource.has(edge.source) || incoming.has(edge.target)) return 'The flow must stay a single linear path.'
    nextBySource.set(edge.source, edge.target)
    incoming.add(edge.target)
  }
  const ordered = ['input']
  while (nextBySource.has(ordered.at(-1)!)) {
    const next = nextBySource.get(ordered.at(-1)!)!
    if (ordered.includes(next)) return 'The flow cannot contain a cycle.'
    ordered.push(next)
  }
  if (ordered.length !== required.length || ordered[1] !== 'overview' || ordered.at(-2) !== 'condition' || ordered.at(-1) !== 'result') return 'Overview must be first, and condition must lead to the result.'
  return undefined
}

function FlowNode({ data }: { data: FlowNodeData }) {
  return <div className={`flow-node ${data.tone}`}><Handle type="target" position={Position.Left} /><span>{data.tone}</span><strong>{data.label}</strong><small>{data.detail}</small><Handle type="source" position={Position.Right} /></div>
}

const nodeTypes = { flow: FlowNode }

export function FlowWorkspace({ tools, flow, onFlowChange, onSaveDraft, message }: { tools: Tool[]; flow: FlowDraft; onFlowChange: (flow: FlowDraft) => void; onSaveDraft: () => void; message: string }) {
  const [trace, setTrace] = useState<Array<{ label: string; status: 'waiting' | 'running' | 'complete' }>>([])
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const steps = [
    { id: 'input', label: 'Collect repository', detail: 'owner, repo', tone: 'input' as const },
    { id: 'overview', label: tools.find((tool) => tool.name === 'get_repository_overview')?.name ?? 'get_repository_overview', detail: 'Repository summary', tone: 'tool' as const },
    ...(flow.includeIssues ? [{ id: 'issues', label: tools.find((tool) => tool.name === 'list_repository_issues')?.name ?? 'list_repository_issues', detail: 'Open issues', tone: 'tool' as const }] : []),
    ...(flow.includeContributors ? [{ id: 'contributors', label: tools.find((tool) => tool.name === 'list_top_contributors')?.name ?? 'list_top_contributors', detail: 'Top contributors', tone: 'tool' as const }] : []),
    { id: 'condition', label: 'Repository found?', detail: 'Continue only on success', tone: 'condition' as const },
    { id: 'result', label: 'Repository briefing', detail: 'Combined result view', tone: 'result' as const },
  ]
  const nodes: Node<FlowNodeData>[] = steps.map((step, index) => ({ id: step.id, type: 'flow', position: flow.positions?.[step.id] ?? { x: index * 215, y: step.tone === 'condition' ? 120 : 30 }, data: { label: step.label, detail: step.detail, tone: step.tone } }))
  const edges: Edge[] = flow.edges ?? defaultEdges(flow.includeIssues, flow.includeContributors)
  const allowedTargets: Record<string, string[]> = { input: ['overview'], overview: [...(flow.includeIssues ? ['issues'] : []), ...(flow.includeContributors ? ['contributors'] : []), ...(!flow.includeIssues && !flow.includeContributors ? ['condition'] : [])], issues: [...(flow.includeContributors ? ['contributors'] : []), 'condition'], contributors: [...(flow.includeIssues ? ['issues'] : []), 'condition'], condition: ['result'], result: [] }
  const validationMessage = graphIssue(edges, flow.includeIssues, flow.includeContributors)
  const isValidConnection = (connection: Connection | Edge) => connection.source !== null && connection.target !== null && connection.source !== connection.target && (allowedTargets[connection.source]?.includes(connection.target) ?? false) && !edges.some((edge) => edge.source === connection.source || edge.target === connection.target)
  const onConnect = (connection: Connection) => {
    if (!isValidConnection(connection)) return
    const next = addEdge({ ...connection, id: `${connection.source}-${connection.target}` }, edges).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target }))
    onFlowChange({ ...flow, edges: next })
  }
  const onEdgesChange = (changes: EdgeChange[]) => onFlowChange({ ...flow, edges: applyEdgeChanges(changes, edges).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })) })
  const removeSelectedEdge = () => {
    if (selectedEdgeId === null) return
    onFlowChange({ ...flow, edges: edges.filter((edge) => edge.id !== selectedEdgeId).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })) })
    setSelectedEdgeId(null)
  }
  const onNodesChange = (changes: NodeChange[]) => {
    const positions = { ...(flow.positions ?? {}) }
    let changed = false
    for (const change of changes) if (change.type === 'position' && change.position !== undefined) { positions[change.id] = change.position; changed = true }
    if (changed) onFlowChange({ ...flow, positions })
  }
  const updateSteps = (key: 'includeIssues' | 'includeContributors', value: boolean) => {
    const next = { ...flow, [key]: value }
    onFlowChange({ ...next, edges: defaultEdges(next.includeIssues, next.includeContributors) })
  }
  const runFixture = async () => {
    const ordered = ['input', ...walkPath(edges)].map((id) => steps.find((step) => step.id === id)).filter((step): step is (typeof steps)[number] => step !== undefined)
    const nextTrace = ordered.map((step) => ({ label: step.label, status: 'waiting' as const }))
    setTrace(nextTrace)
    for (let index = 0; index < nextTrace.length; index += 1) { setTrace((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'running' } : step)); await delay(450); setTrace((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'complete' } : step)) }
  }

  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId)
  return <div className="workspace flow-workspace"><section className="editor-intro"><p className="eyebrow">05 / Constrained flow</p><h2>Compose a brief, not an opaque agent.</h2><p>Reconnect eligible steps to alter execution order. A valid graph keeps overview first, one condition, and one terminal result.</p></section><section className="flow-layout"><aside className="flow-controls"><p className="eyebrow">Flow settings</p><h3>{flow.name}</h3><label>Owner<input value={flow.owner} onChange={(event) => onFlowChange({ ...flow, owner: event.target.value })} /></label><label>Repository<input value={flow.repo} onChange={(event) => onFlowChange({ ...flow, repo: event.target.value })} /></label><fieldset><legend>Include steps</legend><label><input type="checkbox" checked={flow.includeIssues} onChange={(event) => updateSteps('includeIssues', event.target.checked)} />Issues</label><label><input type="checkbox" checked={flow.includeContributors} onChange={(event) => updateSteps('includeContributors', event.target.checked)} />Contributors</label></fieldset><div className="flow-guardrail"><strong>Graph rules</strong><span>Click a connecting line once, then remove it here before reconnecting the path.</span></div><button type="button" disabled={selectedEdge === undefined} onClick={removeSelectedEdge}>Remove selected connection</button><p className="flow-save-message">{selectedEdge === undefined ? 'Select a connecting line in the canvas.' : `Selected: ${selectedEdge.source} to ${selectedEdge.target}`}</p><button type="button" disabled={validationMessage !== undefined} onClick={() => void runFixture()}>Run fixture flow</button><button className="save-flow" type="button" disabled={validationMessage !== undefined} onClick={onSaveDraft}>Save flow as draft</button><p className="flow-save-message">{validationMessage ?? message}</p></aside><section className="flow-canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)} onConnect={onConnect} isValidConnection={isValidConnection} fitView nodesDraggable panOnDrag deleteKeyCode={['Backspace', 'Delete']}><Background color="#d7dfd5" gap={18} /><Controls showInteractive={false} /></ReactFlow></section></section><section className="trace-panel"><div><p className="eyebrow">Execution trace</p><h3>{trace.length === 0 ? 'No run yet' : `${flow.owner}/${flow.repo} fixture run`}</h3></div>{trace.length === 0 ? <p>Run the fixture to inspect each tool call and terminal result in persisted graph order.</p> : <ol>{trace.map((step) => <li className={step.status} key={step.label}><span>{step.status === 'complete' ? '✓' : step.status === 'running' ? '...' : '○'}</span>{step.label}<small>{step.status}</small></li>)}</ol>}</section></div>
}

function walkPath(edges: Edge[]): string[] {
  const ordered: string[] = []
  let current = 'input'
  const visited = new Set<string>([current])
  while (true) {
    const next = edges.find((edge) => edge.source === current)?.target
    if (next === undefined || visited.has(next)) return ordered
    ordered.push(next)
    visited.add(next)
    current = next
  }
}
