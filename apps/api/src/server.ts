import fastifyJWT from '@fastify/jwt'
import fastify, { FastifyReply, FastifyRequest } from 'fastify'

import { dummyTaskHandlers } from './lib/taskHandlers/dummy'
import config from './plugins/config'
import registerLlm from './plugins/llmPlugin'
import registerMinio from './plugins/minioPlugin'
import registerMongo from './plugins/mongoPlugin'
import registerMultipart from './plugins/multipartPlugin'
import registerReplicate from './plugins/replicatePlugin'
import { TaskHandlers, registerTaskHandlers } from './plugins/tasks'
import registerTts from './plugins/ttsPlugin'
import { routes } from './routes'

export interface CreateServerOpts {
  mongoUri?: string
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
        useDefaults: true,
      },
    },
    logger: {
      level: process.env.LOG_LEVEL,
    },
  })

  await server.register(config)

  await registerMongo(server, opts.mongoUri)
  await registerMultipart(server)
  await registerTaskHandlers(server, opts.taskHandlers)

  await server.register(fastifyJWT, {
    secret: server.config.JWT_SECRET,
  })

  await server.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    },
  )

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
