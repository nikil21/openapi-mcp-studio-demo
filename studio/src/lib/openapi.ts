export type Operation = {
  id: string
  method: string
  path: string
  summary: string
  supported: boolean
  reasons: string[]
  parameters: Array<{ name: string; location: 'path' | 'query'; required: boolean; type: string }>
}

const methods = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace']
const primitiveTypes = new Set(['string', 'number', 'integer', 'boolean'])

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function hasJsonResponse(operation: Record<string, unknown>) {
  const responses = record(operation.responses)
  return responses !== undefined && Object.values(responses).some((response) => 'application/json' in (record(record(response)?.content) ?? {}))
}

export function classifyOpenApi(document: unknown): { title: string; version: string; operations: Operation[] } {
  const root = record(document)
  const info = record(root?.info)
  const paths = record(root?.paths)
  if (!root?.openapi || typeof root.openapi !== 'string' || !root.openapi.startsWith('3.') || paths === undefined) throw new Error('Expected an OpenAPI 3.x document with paths.')
  const operations: Operation[] = []
  for (const [path, pathValue] of Object.entries(paths)) {
    const pathItem = record(pathValue)
    if (!pathItem) continue
    for (const method of methods) {
      const operation = record(pathItem[method])
      if (!operation) continue
      const reasons: string[] = []
      if (method !== 'get') reasons.push('Only GET operations are supported in this draft.')
      if (operation.requestBody !== undefined) reasons.push('Request bodies are not supported in this draft.')
      if (!hasJsonResponse(operation)) reasons.push('A JSON response is required.')
      const parameters: Operation['parameters'] = []
      const parameterValues = [...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])]
      for (const value of parameterValues) {
        const parameter = record(value)
        const schema = record(parameter?.schema)
        if (!parameter || typeof parameter.name !== 'string' || parameter.$ref) { reasons.push('Referenced or unnamed parameters are not supported.'); continue }
        if (parameter.in !== 'path' && parameter.in !== 'query') { reasons.push('Only path and query parameters are supported.'); continue }
        if (typeof schema?.type !== 'string' || !primitiveTypes.has(schema.type)) { reasons.push('Parameters require primitive inline schemas.'); continue }
        parameters.push({ name: parameter.name, location: parameter.in, required: parameter.required === true, type: schema.type })
      }
      operations.push({ id: typeof operation.operationId === 'string' ? operation.operationId : `${method}-${path}`, method: method.toUpperCase(), path, summary: typeof operation.summary === 'string' ? operation.summary : 'Untitled operation', supported: reasons.length === 0, reasons: [...new Set(reasons)], parameters })
    }
  }
  return { title: typeof info?.title === 'string' ? info.title : 'Untitled API', version: typeof info?.version === 'string' ? info.version : 'unknown', operations }
}
