import { dummyTaskHandlers } from './lib/taskHandlers/dummy'
import registerAirflow from './plugins/airflowPlugin'
import registerChroma from './plugins/chromaPlugin'
import registerClerk from './plugins/clerkPlugin'
import config from './plugins/config'
import registerElevenLabs from './plugins/elevenLabsPlugin'
import registerEventEmitter from './plugins/eventEmitterPlugin'
import registerLogos from './plugins/logosPlugin'
import registerMinio from './plugins/minioPlugin'
import registerMongo from './plugins/mongoPlugin'
import registerMultipart from './plugins/multipartPlugin'
import registerReplicate from './plugins/replicatePlugin'
import registerS3 from './plugins/s3Plugin'
import registerSentry from './plugins/sentryPlugin'
import registerStripe from './plugins/stripePlugin'
import { TaskHandlers, registerTaskHandlers } from './plugins/tasks'
import { routes } from './routes'
import fastify, { FastifyRequest } from 'fastify'

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
    pluginTimeout: 0,
  })

  await server.register(config)

  server.register(import('@fastify/cors'), () => {
    return (req: FastifyRequest, callback: any) => {
      let corsOptions = {}
      if (req.url.startsWith('/tasks/events')) {
        corsOptions = {
          origin: ['*'],
          methods: ['GET'],
          allowedHeaders: [
            'Content-Type',
            'Authorization',
            'cache-control',
            'X-Api-Key',
            'X-Api-Secret',
          ],
          credentials: true,
        }
      }

      callback(null, corsOptions)
    }
  })

  if (server.config.NODE_ENV !== 'development') {
    await registerSentry(server)
  }

  await registerClerk(server)

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
  await registerEventEmitter(server)

  if (server.config.MINIO_URI) {
    await registerMinio(server)
  } else {
    await registerS3(server)
  }

  if (server.config.REPLICATE_API_TOKEN) {
    await registerReplicate(server)
  }

  if (server.config.ELEVENLABS_API_KEY) {
    await registerElevenLabs(server)
  }

  if (server.config.LOGOS_URL) {
    await registerLogos(server)
  }

  await server.register(import('@fastify/rate-limit'), {
    max: 10000,
    timeWindow: '1 minute',
  })

  await server.register(import('@fastify/swagger'), {
    swagger: {
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'X-Api-Key',
          in: 'header',
        },
        apiSecret: {
          type: 'apiKey',
          name: 'X-Api-Secret',
          in: 'header',
        },
      },
    },
  })

  const swaggerSha = 'tG+x05Hp2iKWfyCNzcCBlraUuB6rEMjtIj/zcnbu/fk='
  const styleSha = 'RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='

  await server.register(import('@fastify/swagger-ui'), {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: header => {
      header = header.replace(
        "script-src 'self'",
        `script-src 'self' 'sha256-${swaggerSha}`,
      )
      header = header.replace(
        "style-src 'self'",
        `style-src 'self' 'sha256-${styleSha}'`,
      )
      return header
    },
  })

  routes.map(async route => {
    await server.register(route)
  })
  await server.ready()
  return server
}

export default createServer
