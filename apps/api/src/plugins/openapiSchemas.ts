import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import yaml from 'yaml'

const DEFAULT_SPECS: Record<string, string> = {
  'sessions-v3': 'apps/api/openapi/sessions-v3.yaml',
  'artifacts-v3': 'apps/api/openapi/artifacts-v3.yaml',
  'manna-v3': 'apps/api/openapi/manna-v3.yaml',
}

const resolveSpecPath = (id: string, specPath?: string) => {
  const candidates = [
    specPath,
    process.env.EDEN_OPENAPI_PATH,
    resolve(process.cwd(), 'openapi', `${id}.yaml`),
    resolve(process.cwd(), DEFAULT_SPECS[id] ?? ''),
  ].filter((candidate): candidate is string => Boolean(candidate))

  return candidates.find(candidate => existsSync(candidate)) ?? null
}

const registerOpenApiSchemas: FastifyPluginAsync<{
  id: string
  specPath?: string
}> = async (server, opts) => {
  const { id, specPath } = opts
  const openapiPath = resolveSpecPath(id, specPath)
  if (!openapiPath) {
    server.log.warn(
      `[openapi] schema file not found for ${id}; skipping schema registration`,
    )
    return
  }

  const file = readFileSync(openapiPath, 'utf-8')
  const openapi = yaml.parse(file)
  const schemas = openapi?.components?.schemas

  if (!schemas || typeof schemas !== 'object') {
    server.log.warn(`[openapi] schemas not found for ${id}`)
    return
  }

  const schemaId = id
  const schemaPrefix = `${id}#/components/schemas/`

  server.addSchema({
    $id: schemaId,
    components: {
      schemas,
    },
  })

  for (const [name, schema] of Object.entries(schemas)) {
    if (!schema || typeof schema !== 'object') continue
    server.addSchema({
      $id: `${schemaPrefix}${name}`,
      ...(schema as Record<string, unknown>),
    })
  }
}

export default fp(registerOpenApiSchemas, {
  name: 'openapi-schemas',
})
