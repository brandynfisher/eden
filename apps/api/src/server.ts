import fastify from 'fastify'

import { dummyTaskHandlers } from './lib/taskHandlers/dummy'
import registerChroma from './plugins/chromaPlugin'
import { registerClerk } from './plugins/clerkPlugin'
import config from './plugins/config'
import registerJwt from './plugins/jwtPlugin'
import registerLlm from './plugins/llmPlugin'
import registerMinio from './plugins/minioPlugin'
import registerMongo from './plugins/mongoPlugin'
import registerMultipart from './plugins/multipartPlugin'
import registerReplicate from './plugins/replicatePlugin'
import registerStripe from './plugins/stripePlugin'
import { TaskHandlers, registerTaskHandlers } from './plugins/tasks'
import registerTts from './plugins/ttsPlugin'
import { routes } from './routes'

export interface CreateServerOpts {
  mongoUri?: string
  chromaUri?: string
  taskHandlers?: TaskHandlers
}

const createServer = async (
  opts: CreateServerOpts = {
    taskHandlers: dummyTaskHandlers,
  },
) => {
  const server = fastify({
    ajv: {
      customOptions: {
        keywords: ['kind', 'modifier'],
        removeAdditional: 'all',
        coerceTypes: 'array',
        allowUnionTypes: true,
        useDefaults: true,
      },
    },
    logger: {
      level: process.env.LOG_LEVEL,
    },
  })

  await server.register(config)

  if (server.config.CLERK_PUBLISHABLE_KEY) {
    await registerClerk(server)
  } else if (server.config.JWT_SECRET) {
    await registerJwt(server)
  }
  await server.register(import('fastify-raw-body'), {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: [],
  })

  await registerMongo(server, opts.mongoUri)
  await registerChroma(server, opts.chromaUri)
  await registerMultipart(server)
  await registerTaskHandlers(server, opts.taskHandlers)
  await registerStripe(server)

  if (server.config.REPLICATE_API_TOKEN) {
    await registerReplicate(server)
  }

  if (server.config.OPENAI_API_KEY) {
    await registerLlm(server)
  }

  if (server.config.PLAYHT_API_KEY) {
    await registerTts(server)
  }

  if (server.config.MINIO_HOST) {
    await registerMinio(server)
  }

  await server.register(import('@fastify/rate-limit'), {
    max: 10000,
    timeWindow: '1 minute',
  })

  routes.map(async route => {
    await server.register(route)
  })
  await server.ready()
  return server
}

export default createServer
