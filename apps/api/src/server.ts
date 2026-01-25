import { closeInactiveSessions } from './controllers/realtimeSessionBillingController'
import { subscribeWebSocketUpdates } from './controllers/v2/taskControllerV2'
import registerAssetUpload from './plugins/assetUploadPlugin'
import registerChroma from './plugins/chromaPlugin'
import registerClerk from './plugins/clerkPlugin'
import registerCloudinary from './plugins/cloudinaryPlugin'
import config from './plugins/config'
import registerEden2SessionUpdates from './plugins/eden2SessionUpdatePlugin'
import registerEden2TaskUpdates from './plugins/eden2TaskUpdatePlugin'
import registerEden2ThreadUpdates from './plugins/eden2ThreadUpdatePlugin'
import registerElevenLabs from './plugins/elevenLabsPlugin'
import registerEventEmitter from './plugins/eventEmitterPlugin'
import { registerInternalMessages } from './plugins/internalMessagesPlugin'
import registerLogos from './plugins/logosPlugin'
import registerMailgun from './plugins/mailgunPlugin'
import registerMcp from './plugins/mcpPlugin'
import registerMongo from './plugins/mongoPlugin'
import registerMultipart from './plugins/multipartPlugin'
import { registerRedis } from './plugins/redisPlugin'
import registerReplicate from './plugins/replicatePlugin'
import registerS3 from './plugins/s3Plugin'
import registerSentry from './plugins/sentryPlugin'
import registerSSE from './plugins/ssePlugin'
import registerStripe from './plugins/stripePlugin'
import { TaskHandlers, registerTaskHandlers } from './plugins/tasks'
import registerWebSocket from './plugins/webSocketPlugin'
import { routes } from './routes'
import { routes as routesV2 } from './routes/v2'
import { routes as routesV3 } from './routes/v3'
import fastify, { FastifyRequest } from 'fastify'

export interface CreateServerOpts {
  mongoUri?: string
  chromaUri?: string
  redisUri?: string
  taskHandlers?: TaskHandlers
}

const createServer = async (opts: CreateServerOpts) => {
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
      level: process.env.LOG_LEVEL || 'info',
    },
    disableRequestLogging: true,
    pluginTimeout: 0,
    connectionTimeout: 60000,
    keepAliveTimeout: 30000,
    maxRequestsPerSocket: 0,
  })

  server.addHook('onResponse', async (request, reply) => {
    const statusCode = reply.statusCode

    if (statusCode >= 400) {
      if (statusCode >= 500) {
        request.log.error(
          { method: request.method, url: request.url, statusCode },
          'request completed with error status',
        )
      } else {
        request.log.warn(
          { method: request.method, url: request.url, statusCode },
          'request completed with client error status',
        )
      }
    }
  })

  await server.register(config)

  server.register(import('@fastify/cors'), () => {
    return (req: FastifyRequest, callback: any) => {
      let corsOptions = {}
      if (server.config.NODE_ENV === 'development') {
        corsOptions = {
          origin: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: [
            'Content-Type',
            'Authorization',
            'cache-control',
            'baggage',
            'sentry-trace',
            'X-Api-Key',
            'X-Api-Secret',
          ],
          credentials: true,
        }
      }
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
      if (req.url.startsWith('/v3/sessions/prompt')) {
        corsOptions = {
          origin: true,
          methods: ['POST', 'OPTIONS'],
          allowedHeaders: [
            'Content-Type',
            'Authorization',
            'baggage',
            'sentry-trace',
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

  const fastifyJwt = await import('@fastify/jwt')
  await server.register(fastifyJwt.default ?? fastifyJwt, {
    secret: server.config.MCP_TOKEN_SECRET,
    sign: {
      iss: 'eden-mcp',
    },
  })

  await server.register(import('fastify-raw-body'), {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: [],
  })

  await registerMongo(server, opts.mongoUri)
  await registerChroma(server, opts.chromaUri)
  await registerRedis(server, { url: opts.redisUri })
  await registerMultipart(server)
  await registerMcp(server)
  await registerWebSocket(server, opts)
  await registerSSE(server)
  await registerEventEmitter(server)
  await registerInternalMessages(server, opts)
  await registerStripe(server)
  await registerAssetUpload(server)
  await registerS3(server)
  await registerEden2TaskUpdates(server, opts)
  await registerEden2ThreadUpdates(server, opts)
  await registerEden2SessionUpdates(server, opts)

  registerTaskHandlers(server, opts.taskHandlers)

  if (
    server.config.CLOUDINARY_API_SECRET &&
    server.config.CLOUDINARY_API_KEY &&
    server.config.CLOUDINARY_CLOUD_NAME
  ) {
    await registerCloudinary(server)
  }

  if (server.config.REPLICATE_API_TOKEN) {
    await registerReplicate(server)
  }

  await registerMailgun(server)

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
        // apiSecret: {
        //   type: 'apiKey',
        //   name: 'X-Api-Secret',
        //   in: 'header',
        // },
      },
    },
  })

  const swaggerSha = 'tG+x05Hp2iKWfyCNzcCBlraUuB6rEMjtIj/zcnbu/fk='
  const styleSha = 'RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='

  await server.register(import('fastify-healthcheck'), {})

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

  // Register Routes 1
  // websocket route before all others
  server.get(
    '/ws/updates',
    {
      websocket: true,
      schema: {
        hide: true,
      },
    },
    subscribeWebSocketUpdates,
  )

  // all other routes
  routes.map(async route => {
    await server.register(route)
  })

  // eden2 specific - routes
  routesV2.map(async route => {
    await server.register(route)
  })

  // eden3 specific - routes
  routesV3.map(async route => {
    await server.register(route)
  })

  await server.ready()

  // Periodically close inactive realtime sessions (every 2 minutes)
  setInterval(async () => {
    try {
      const closed = await closeInactiveSessions()
      if (closed > 0) {
        server.log.info(`Closed ${closed} inactive realtime sessions`)
      }
    } catch (err) {
      server.log.error(err, 'Failed to close inactive sessions')
    }
  }, 120_000)

  return server
}

export default createServer
