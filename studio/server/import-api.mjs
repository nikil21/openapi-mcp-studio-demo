import { createServer } from 'node:http'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { readFileSync } from 'node:fs'

const maxRequestBytes = 256_000
const maxResponseBytes = 2_000_000
function localEnvValue(name) {
  if (process.env[name]) return process.env[name]
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').find((entry) => entry.startsWith(`${name}=`))
    return line?.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, '')
  } catch { return undefined }
}

const supabaseUrl = localEnvValue('VITE_SUPABASE_URL')
const serviceRoleKey = localEnvValue('SUPABASE_SERVICE_ROLE_KEY')

function isPrivateAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  }
  const normalized = address.toLowerCase()
  return normalized === '::1' || normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')
}

async function assertPublicHttpsUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Only public HTTPS URLs are supported.')
  const addresses = await lookup(url.hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('Private or local network hosts are not supported.')
  return url
}

async function readBoundedJson(response) {
  const declaredLength = response.headers.get('content-length')
  if (declaredLength !== null && Number(declaredLength) > maxResponseBytes) throw new Error('Specification exceeds the 2 MB import limit.')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Specification response has no body.')
  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxResponseBytes) { await reader.cancel(); throw new Error('Specification exceeds the 2 MB import limit.') }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try { return JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new Error('The URL did not return valid JSON.') }
}

async function importSpecification(value) {
  const url = await assertPublicHttpsUrl(value)
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'openapi-mcp-studio-import/0.2' }, redirect: 'manual', signal: AbortSignal.timeout(10_000) })
  if (response.status >= 300 && response.status < 400) throw new Error('Redirects are not supported during import.')
  if (!response.ok) throw new Error(`Specification request failed with status ${response.status}.`)
  return { document: await readBoundedJson(response), sourceUrl: url.toString() }
}

function assertDatabaseConfigured() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Studio persistence is not configured.')
}

function validateStudioConfig(config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) return ['Configuration must be an object.']
  const issues = []
  const app = config.app
  const tools = config.tools
  const views = config.views
  const flow = config.flow
  if (app === null || typeof app !== 'object' || typeof app.name !== 'string' || app.name.length === 0) issues.push('Application name is required.')
  if (!Array.isArray(tools) || tools.length < 1 || tools.length > 3) issues.push('Configuration must contain one to three tools.')
  if (views === null || typeof views !== 'object' || Array.isArray(views)) issues.push('Configuration must include view bindings.')
  if (flow !== undefined && (flow === null || typeof flow !== 'object' || typeof flow.name !== 'string' || typeof flow.owner !== 'string' || typeof flow.repo !== 'string' || typeof flow.includeIssues !== 'boolean' || typeof flow.includeContributors !== 'boolean')) issues.push('Flow configuration is invalid.')
  return issues
}

async function supabase(path, options = {}) {
  assertDatabaseConfigured()
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}), ...options.headers },
  })
  if (!response.ok) throw new Error('Studio persistence request failed.')
  return response.status === 204 ? null : response.json()
}

async function readRequest(request) {
  let body = ''
  request.setEncoding('utf8')
  for await (const chunk of request) {
    body += chunk
    if (body.length > maxRequestBytes) throw new Error('Request is too large.')
  }
  try { return body ? JSON.parse(body) : {} } catch { throw new Error('Request body must be valid JSON.') }
}

function respond(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function projectPath(url) {
  const match = url.match(/^\/api\/projects\/([0-9a-f-]+)(?:\/(versions|publish|audit))?$/i)
  return match ? { id: match[1], action: match[2] } : undefined
}

createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/api/import') {
      const { url } = await readRequest(request)
      if (typeof url !== 'string') throw new Error('A specification URL is required.')
      return respond(response, 200, await importSpecification(url))
    }

    if (request.method === 'GET' && request.url === '/api/health') {
      await supabase('studio_projects?select=id&limit=1')
      return respond(response, 200, { importApi: 'ready', persistence: 'ready' })
    }

    if (request.method === 'GET' && request.url === '/api/projects') {
      const projects = await supabase('studio_projects?select=*&order=updated_at.desc')
      const withVersions = await Promise.all(projects.map(async (project) => ({ ...project, versions: await supabase(`studio_config_versions?project_id=eq.${project.id}&select=*&order=version_number.desc`) })))
      return respond(response, 200, { projects: withVersions })
    }

    if (request.method === 'POST' && request.url === '/api/projects') {
      const { name, apiSourceUrl, config } = await readRequest(request)
      if (typeof name !== 'string' || name.trim().length === 0 || !config || typeof config !== 'object') throw new Error('Project name and configuration are required.')
      const validation = validateStudioConfig(config)
      if (validation.length > 0) throw new Error(`Configuration validation failed: ${validation.join(' ')}`)
      const [project] = await supabase('studio_projects', { method: 'POST', body: JSON.stringify({ name: name.trim(), api_source_url: typeof apiSourceUrl === 'string' ? apiSourceUrl : null }) })
      const [version] = await supabase('studio_config_versions', { method: 'POST', body: JSON.stringify({ project_id: project.id, version_number: 1, state: 'draft', config, validation }) })
      await supabase('studio_audit_events', { method: 'POST', body: JSON.stringify({ project_id: project.id, version_id: version.id, event_type: 'draft_saved' }) })
      return respond(response, 201, { project, version })
    }

    const project = projectPath(request.url ?? '')
    if (project && request.method === 'POST' && project.action === 'versions') {
      const { config } = await readRequest(request)
      if (!config || typeof config !== 'object') throw new Error('Configuration is required.')
      const validation = validateStudioConfig(config)
      if (validation.length > 0) throw new Error(`Configuration validation failed: ${validation.join(' ')}`)
      const versions = await supabase(`studio_config_versions?project_id=eq.${project.id}&select=version_number&order=version_number.desc&limit=1`)
      const versionNumber = (versions[0]?.version_number ?? 0) + 1
      const [version] = await supabase('studio_config_versions', { method: 'POST', body: JSON.stringify({ project_id: project.id, version_number: versionNumber, state: 'draft', config, validation }) })
      await supabase('studio_audit_events', { method: 'POST', body: JSON.stringify({ project_id: project.id, version_id: version.id, event_type: 'draft_saved' }) })
      return respond(response, 201, { version })
    }

    if (project && request.method === 'POST' && project.action === 'publish') {
      const { versionId } = await readRequest(request)
      if (typeof versionId !== 'string') throw new Error('Version ID is required.')
      const published = await supabase('rpc/publish_studio_version', { method: 'POST', body: JSON.stringify({ project_uuid: project.id, version_uuid: versionId }) })
      return respond(response, 200, { version: published })
    }

    if (project && request.method === 'GET' && project.action === 'audit') {
      const events = await supabase(`studio_audit_events?project_id=eq.${project.id}&select=*&order=created_at.desc`)
      return respond(response, 200, { events })
    }

    return respond(response, 404, { error: 'Not found.' })
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError' ? 'Specification request timed out.' : error instanceof Error ? error.message : 'Studio API request failed.'
    return respond(response, 400, { error: message })
  }
}).listen(8787, '127.0.0.1', () => console.log('Studio API listening on http://127.0.0.1:8787'))
