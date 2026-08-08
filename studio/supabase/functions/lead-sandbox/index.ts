const maxBodyBytes = 16_384
const maxFieldLength: Record<string, number> = { name: 120, email: 254, company: 120 }

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}

function validateLead(value: unknown) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return 'Lead must be a JSON object.'
  const lead = value as Record<string, unknown>
  if (Object.keys(lead).some((key) => !['name', 'email', 'company'].includes(key))) return 'Lead contains unsupported fields.'
  for (const [field, limit] of Object.entries(maxFieldLength)) {
    const fieldValue = lead[field]
    if (fieldValue !== undefined && (typeof fieldValue !== 'string' || fieldValue.trim().length === 0 || fieldValue.length > limit)) return `${field} is invalid.`
  }
  if (typeof lead.name !== 'string' || typeof lead.email !== 'string') return 'name and email are required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return 'email is invalid.'
  return undefined
}

Deno.serve(async (request) => {
  const url = new URL(request.url)
  if (request.method !== 'POST' || !url.pathname.endsWith('/leads')) return json(404, { error: 'Not found.', demoOnly: true })
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json(415, { error: 'Content-Type must be application/json.', demoOnly: true })
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null && Number(declaredLength) > maxBodyBytes) return json(413, { error: 'Request body is too large.', demoOnly: true })
  let payload: unknown
  try { payload = await request.json() } catch { return json(400, { error: 'Request body must be valid JSON.', demoOnly: true }) }
  const issue = validateLead(payload)
  if (issue !== undefined) return json(400, { error: issue, demoOnly: true })
  const lead = payload as Record<string, string>
  return json(201, { id: `demo_lead_${crypto.randomUUID()}`, name: lead.name.trim(), email: lead.email.trim(), ...(lead.company === undefined ? {} : { company: lead.company.trim() }), demoOnly: true, createdAt: new Date().toISOString() })
})
