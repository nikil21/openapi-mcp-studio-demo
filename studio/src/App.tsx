import { startTransition, useState } from 'react'
import { classifyOpenApi, type Operation } from './lib/openapi'
import './App.css'

type Section = 'Build' | 'Tools' | 'Views' | 'Flows' | 'Test' | 'Publish'
type ToolDraft = { operationId: string; name: string; description: string; resultLimit: number; view: string }

const sections: Section[] = ['Build', 'Tools', 'Views', 'Flows', 'Test', 'Publish']
const defaultSource = 'https://raw.githubusercontent.com/nikil21/openapi-mcp-studio-demo/main/examples/github-openapi-subset.json'
const initialOperations: Operation[] = [
  { id: 'repos/get', method: 'GET', path: '/repos/{owner}/{repo}', summary: 'Get a repository overview', supported: true, reasons: [], parameters: [] },
  { id: 'issues/list-for-repo', method: 'GET', path: '/repos/{owner}/{repo}/issues', summary: 'List repository issues', supported: true, reasons: [], parameters: [] },
  { id: 'repos/list-contributors', method: 'GET', path: '/repos/{owner}/{repo}/contributors', summary: 'List repository contributors', supported: true, reasons: [], parameters: [] },
  { id: 'repos/create-hook', method: 'POST', path: '/repos/{owner}/{repo}/hooks', summary: 'Create a repository webhook', supported: false, reasons: ['Only GET operations are supported in this draft.'], parameters: [] },
]

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '')
}

function createToolDraft(operation: Operation): ToolDraft {
  const presets: Record<string, Omit<ToolDraft, 'operationId'>> = {
    'repos/get': { name: 'get_repository_overview', description: 'Get a concise overview of a public GitHub repository.', resultLimit: 1, view: 'Summary card' },
    'issues/list-for-repo': { name: 'list_repository_issues', description: 'List issues for a public GitHub repository.', resultLimit: 10, view: 'Data table' },
    'repos/list-contributors': { name: 'list_top_contributors', description: 'List top contributors for a public GitHub repository.', resultLimit: 10, view: 'Ranked list' },
  }
  return { operationId: operation.id, ...(presets[operation.id] ?? { name: toSnakeCase(operation.id), description: operation.summary, resultLimit: 10, view: 'Data table' }) }
}

function App() {
  const [section, setSection] = useState<Section>('Build')
  const [sourceUrl, setSourceUrl] = useState(defaultSource)
  const [apiTitle, setApiTitle] = useState('GitHub Repository API')
  const [apiVersion, setApiVersion] = useState('2026-08-05')
  const [operations, setOperations] = useState(initialOperations)
  const [selected, setSelected] = useState(initialOperations.filter((operation) => operation.supported).map((operation) => operation.id))
  const [tools, setTools] = useState(initialOperations.filter((operation) => operation.supported).map(createToolDraft))
  const [importState, setImportState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const selectSection = (next: Section) => startTransition(() => setSection(next))
  const importSource = async () => {
    setImportState('loading'); setMessage('')
    try {
      const response = await fetch('/api/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: sourceUrl }) })
      const payload = await response.json() as { document?: unknown; sourceUrl?: string; error?: string }
      if (!response.ok || payload.document === undefined) throw new Error(payload.error ?? 'Specification import failed.')
      const catalog = classifyOpenApi(payload.document)
      const nextSelected = catalog.operations.filter((operation) => operation.supported).slice(0, 3).map((operation) => operation.id)
      setApiTitle(catalog.title); setApiVersion(catalog.version); setOperations(catalog.operations); setSelected(nextSelected); setTools(catalog.operations.filter((operation) => nextSelected.includes(operation.id)).map(createToolDraft)); setSourceUrl(payload.sourceUrl ?? sourceUrl); setMessage(`Imported ${catalog.operations.length} operations. ${nextSelected.length} are selected for the draft.`); setImportState('idle')
    } catch (error) { setImportState('error'); setMessage(error instanceof Error ? error.message : 'Specification import failed.') }
  }
  const toggleOperation = (operation: Operation) => {
    if (!operation.supported) return
    if (selected.includes(operation.id)) { setSelected(selected.filter((id) => id !== operation.id)); setTools(tools.filter((tool) => tool.operationId !== operation.id)); return }
    if (selected.length === 3) return setMessage('A draft supports a maximum of three selected tools.')
    setSelected([...selected, operation.id]); setTools([...tools, createToolDraft(operation)])
  }
  const updateTool = (operationId: string, key: keyof Omit<ToolDraft, 'operationId'>, value: string | number) => setTools(tools.map((tool) => tool.operationId === operationId ? { ...tool, [key]: value } : tool))

  return <div className="app-shell"><aside className="sidebar"><a className="brand" href="#build" onClick={() => selectSection('Build')}><span className="brand-mark">M</span><span>mcp studio<small>PHASE 2</small></span></a><nav aria-label="Project sections"><p className="nav-label">Project</p>{sections.map((item, index) => <button className={section === item ? 'nav-item active' : 'nav-item'} key={item} onClick={() => selectSection(item)} type="button"><span>0{index + 1}</span>{item}</button>)}</nav><div className="sidebar-footer"><span className="status-dot" /> Local fixture mode<small>Import API available locally</small></div></aside><main><header className="topbar"><div><p className="eyebrow">Project / {apiTitle}</p><h1>{section}</h1></div><div className="topbar-actions"><span className="draft-pill">Draft v0.2</span><button type="button" onClick={() => selectSection('Publish')}>Publish</button></div></header>{section === 'Build' ? <BuildOverview sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} importSource={importSource} importState={importState} message={message} apiTitle={apiTitle} apiVersion={apiVersion} operations={operations} selected={selected} toggleOperation={toggleOperation} /> : section === 'Tools' ? <ToolEditor tools={tools} operations={operations} updateTool={updateTool} /> : <Placeholder section={section} />}</main></div>
}

function BuildOverview({ sourceUrl, setSourceUrl, importSource, importState, message, apiTitle, apiVersion, operations, selected, toggleOperation }: { sourceUrl: string; setSourceUrl: (value: string) => void; importSource: () => void; importState: 'idle' | 'loading' | 'error'; message: string; apiTitle: string; apiVersion: string; operations: Operation[]; selected: string[]; toggleOperation: (operation: Operation) => void }) {
  return <div className="workspace"><section className="hero-panel"><div><p className="eyebrow">Configuration lifecycle</p><h2>Import an API. Curate a reliable MCP app.</h2><p className="hero-copy">The Studio fetches a remote OpenAPI document through a bounded server-side import path, then creates a safe local draft.</p></div><div className="release-card"><span>ACTIVE RUNTIME</span><strong>v0.1</strong><p>Manufact deployment verified</p><a href="https://keen-forge-ocsbv.run.mcp-use.com/mcp" target="_blank" rel="noreferrer">Open MCP endpoint ↗</a></div></section><section className="import-panel"><p className="eyebrow">01 / Import API</p><div><label htmlFor="source-url">OpenAPI JSON URL</label><div className="import-row"><input id="source-url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://api.example.com/openapi.json" /><button type="button" onClick={importSource} disabled={importState === 'loading'}>{importState === 'loading' ? 'Importing...' : 'Import specification'}</button></div><p className={importState === 'error' ? 'import-message error' : 'import-message'}>{message || 'HTTPS JSON only. Local/private networks, redirects, oversized responses, and unsupported schemas are rejected.'}</p></div></section><section className="progress-strip" aria-label="Build progress">{['Import API', 'Curate tools', 'Bind views', 'Test', 'Publish'].map((step, index) => <div key={step} className={index < 2 ? 'complete' : ''}><span>{index < 2 ? '✓' : index + 1}</span>{step}</div>)}</section><section className="tool-panel"><div className="panel-heading"><div><p className="eyebrow">02 / Curate operations</p><h3>{apiTitle} <small>v{apiVersion}</small></h3></div><span className="selection-counter">{selected.length} / 3 selected</span></div><div className="operation-list">{operations.map((operation) => { const isSelected = selected.includes(operation.id); const enabled = operation.supported && (isSelected || selected.length < 3); return <article className={operation.supported ? '' : 'unsupported'} key={`${operation.method}-${operation.path}`}><div><span className={`method ${operation.method === 'GET' ? 'get' : ''}`}>{operation.method}</span><code>{operation.path}</code><h4>{operation.summary}</h4>{operation.reasons.length > 0 && <p>{operation.reasons.join(' ')}</p>}</div><button className="operation-button" type="button" disabled={!enabled} onClick={() => toggleOperation(operation)}>{isSelected ? 'Remove' : operation.supported ? 'Select' : 'Unsupported'}</button></article> })}</div></section></div>
}

function ToolEditor({ tools, operations, updateTool }: { tools: ToolDraft[]; operations: Operation[]; updateTool: (operationId: string, key: keyof Omit<ToolDraft, 'operationId'>, value: string | number) => void }) {
  return <div className="workspace"><section className="editor-intro"><p className="eyebrow">03 / Tool drafts</p><h2>Give the model and your users a clear contract.</h2><p>These are local drafts. Publishing and runtime activation remain explicit later lifecycle steps.</p></section><section className="tool-editor-list">{tools.map((tool) => { const operation = operations.find((item) => item.id === tool.operationId); return <article className="tool-editor-card" key={tool.operationId}><div className="editor-card-heading"><div><code>{operation?.method} {operation?.path}</code><h3>{operation?.summary}</h3></div><span>{tool.view}</span></div><label>Tool name<input value={tool.name} onChange={(event) => updateTool(tool.operationId, 'name', event.target.value)} /></label><label>Description<textarea value={tool.description} onChange={(event) => updateTool(tool.operationId, 'description', event.target.value)} /></label><div className="editor-grid"><label>Result limit<input type="number" min="1" max="100" value={tool.resultLimit} onChange={(event) => updateTool(tool.operationId, 'resultLimit', Number(event.target.value))} /></label><label>View template<select value={tool.view} onChange={(event) => updateTool(tool.operationId, 'view', event.target.value)}><option>Summary card</option><option>Data table</option><option>Ranked list</option></select></label></div></article> })}</section></div>
}

function Placeholder({ section }: { section: Exclude<Section, 'Build' | 'Tools'> }) { const copy: Record<Exclude<Section, 'Build' | 'Tools'>, string> = { Views: 'Phase 2.2 will bind template properties to API fields and render a live preview.', Flows: 'Phase 2.4 will add constrained linear flows with inputs, tool calls, conditions, and results.', Test: 'Test runs will make input mappings, output data, and errors inspectable before publish.', Publish: 'Phase 2.3 will validate, version, diff, publish, and roll back configurations safely.' }; return <div className="placeholder"><p className="eyebrow">Planned workspace</p><h2>{section} is next in the lifecycle.</h2><p>{copy[section]}</p><span>Phase 2.1 in progress</span></div> }

export default App
