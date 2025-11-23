import { FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import Redis from 'ioredis'
import type { Redis as RedisClient } from 'ioredis'

interface RedisPluginOptions {
  url?: string
}

const redisPlugin: FastifyPluginAsync<RedisPluginOptions> = async (
  fastify,
  options,
) => {
  const redisUrl = options.url || fastify.config.REDIS_URL
  const envPrefix = process.env.NODE_ENV === 'production' ? 'prod' : 'staging'

  if (redisUrl) {
    try {
      const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })

      client.on('error', (err: Error) => {
        console.error('Redis connection error:', err)
        fastify.log.error({ err }, 'Redis connection error:')
      })

      client.on('ready', () => {})

      fastify.decorate('redis', client)
      fastify.decorate('redisEnvPrefix', envPrefix)

      // Cleanup on close
      fastify.addHook('onClose', async () => {
        await client.quit()
      })
    } catch (error) {
      fastify.log.error({ err: error }, 'Failed to initialize Redis client:')
      fastify.decorate('redis', null)
    }
  } else {
    fastify.log.warn(
      '⚠️  REDIS_URL not set - session tracking disabled (notifications will be created for all messages)',
    )
    fastify.decorate('redis', null)
    fastify.decorate('redisEnvPrefix', envPrefix)
  }
}

export const registerRedis: FastifyPluginAsync = async (fastify, options) => {
  try {
    await fastify.register(fastifyPlugin(redisPlugin, options))
    fastify.log.info('Successfully registered plugin: Redis')
  } catch (err) {
    fastify.log.error({ err }, 'Failed to register plugin: Redis')
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClient | null
    redisEnvPrefix: string
  }
}

export default fastifyPlugin(redisPlugin)
