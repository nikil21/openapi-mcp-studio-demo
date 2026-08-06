import { createServer } from 'node:http'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const maxRequestBytes = 16_000
const maxResponseBytes = 2_000_000

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

async function readJson(response) {
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
    if (size > maxResponseBytes) {
      await reader.cancel()
      throw new Error('Specification exceeds the 2 MB import limit.')
    }
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
  return { document: await readJson(response), sourceUrl: url.toString() }
}

function respond(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/api/import') return respond(response, 404, { error: 'Not found.' })
  let body = ''
  request.setEncoding('utf8')
  for await (const chunk of request) {
    body += chunk
    if (body.length > maxRequestBytes) return respond(response, 413, { error: 'Request is too large.' })
  }
  try {
    const { url } = JSON.parse(body)
    if (typeof url !== 'string') throw new Error('A specification URL is required.')
    respond(response, 200, await importSpecification(url))
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError' ? 'Specification request timed out.' : error instanceof Error ? error.message : 'Specification import failed.'
    respond(response, 400, { error: message })
  }
}).listen(8787, '127.0.0.1', () => console.log('Studio import API listening on http://127.0.0.1:8787'))
