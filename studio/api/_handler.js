import { studioApiHandler } from '../server/import-api.mjs'

export default function handler(request, response) {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  request.url = pathname.startsWith('/api/') ? pathname : `/api${pathname}`
  return studioApiHandler(request, response)
}
