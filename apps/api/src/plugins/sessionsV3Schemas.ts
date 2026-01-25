import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import yaml from 'yaml'

const SCHEMA_ID_PREFIX = 'sessions-v3#/components/schemas/'

const findOpenApiPath = () => {
  const candidates = [
    process.env.EDEN_OPENAPI_PATH,
    resolve(process.cwd(), 'openapi', 'sessions-v3.yaml'),
    resolve(process.cwd(), 'apps', 'api', 'openapi', 'sessions-v3.yaml'),
  ].filter((candidate): candidate is string => Boolean(candidate))

  return candidates.find(candidate => existsSync(candidate)) ?? null
}

const registerSessionsV3Schemas: FastifyPluginAsync = async server => {
  const openapiPath = findOpenApiPath()
  if (!openapiPath) {
    server.log.warn(
      'Sessions v3 OpenAPI schema file not found; skipping schema registration',
    )
    return
  }
  const file = readFileSync(openapiPath, 'utf-8')
  const openapi = yaml.parse(file)
  const schemas = openapi?.components?.schemas

  if (!schemas || typeof schemas !== 'object') {
    server.log.warn('Sessions v3 OpenAPI schemas not found')
    return
  }

  server.addSchema({
    $id: 'sessions-v3',
    components: {
      schemas,
    },
  })

  for (const [name, schema] of Object.entries(schemas)) {
    if (!schema || typeof schema !== 'object') continue
    server.addSchema({
      $id: `${SCHEMA_ID_PREFIX}${name}`,
      ...(schema as Record<string, unknown>),
    })
  }
}

export default fp(registerSessionsV3Schemas, {
  name: 'sessions-v3-schemas',
})
