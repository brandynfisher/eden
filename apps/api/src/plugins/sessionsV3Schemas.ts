import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import yaml from 'yaml'

const SCHEMA_ID_PREFIX = 'sessions-v3#/components/schemas/'

const loadOpenApi = () => {
  const openapiPath = resolve(process.cwd(), 'openapi', 'sessions-v3.yaml')
  const file = readFileSync(openapiPath, 'utf-8')
  return yaml.parse(file)
}

const registerSessionsV3Schemas: FastifyPluginAsync = async server => {
  const openapi = loadOpenApi()
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
