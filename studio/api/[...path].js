import { studioApiHandler } from '../server/import-api.mjs'

export default function handler(request, response) {
  request.url = `/api${request.url ?? '/'}`
  return studioApiHandler(request, response)
}
