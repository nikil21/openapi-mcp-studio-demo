import { studioApiHandler } from '../server/import-api.mjs'

export default function handler(request, response) {
  if (!request.url?.startsWith('/api/')) request.url = `/api${request.url ?? '/'}`
  return studioApiHandler(request, response)
}
