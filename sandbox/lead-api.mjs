import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const maxBodyBytes = 16_384
const maxFieldLength = { name: 120, email: 254, company: 120 }

function respond(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body) > maxBodyBytes) throw new Error('Request body is too large.')
  }
  try { return JSON.parse(body) } catch { throw new Error('Request body must be valid JSON.') }
}

function validateLead(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return 'Lead must be a JSON object.'
  const lead = value
  if (Object.keys(lead).some((key) => !['name', 'email', 'company'].includes(key))) return 'Lead contains unsupported fields.'
  for (const [field, limit] of Object.entries(maxFieldLength)) {
    const fieldValue = lead[field]
    if (fieldValue !== undefined && (typeof fieldValue !== 'string' || fieldValue.trim().length === 0 || fieldValue.length > limit)) return `${field} is invalid.`
  }
  if (typeof lead.name !== 'string' || typeof lead.email !== 'string') return 'name and email are required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return 'email is invalid.'
  return undefined
}

export function createLeadApiServer() {
  const leads = new Map()
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      if (request.method === 'POST' && url.pathname === '/leads') {
        if (!request.headers['content-type']?.startsWith('application/json')) return respond(response, 415, { error: 'Content-Type must be application/json.', demoOnly: true })
        const payload = await readJson(request)
        const issue = validateLead(payload)
        if (issue !== undefined) return respond(response, 400, { error: issue, demoOnly: true })
        const id = `demo_lead_${randomUUID()}`
        const lead = { id, name: payload.name.trim(), email: payload.email.trim(), ...(typeof payload.company === 'string' ? { company: payload.company.trim() } : {}), demoOnly: true, createdAt: new Date().toISOString() }
        leads.set(id, lead)
        return respond(response, 201, lead)
      }
      if (request.method === 'GET' && /^\/leads\/demo_lead_[0-9a-f-]+$/i.test(url.pathname)) {
        const lead = leads.get(url.pathname.slice('/leads/'.length))
        return lead === undefined ? respond(response, 404, { error: 'Demo lead was not found.', demoOnly: true }) : respond(response, 200, lead)
      }
      return respond(response, 404, { error: 'Not found.', demoOnly: true })
    } catch (error) {
      return respond(response, 400, { error: error instanceof Error ? error.message : 'Invalid demo lead request.', demoOnly: true })
    }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.LEAD_SANDBOX_PORT ?? 8788)
  createLeadApiServer().listen(port, '127.0.0.1', () => console.log(JSON.stringify({ event: 'lead_sandbox_ready', port, demoOnly: true })))
}
