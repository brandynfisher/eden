import type { FastifyInstance } from 'fastify'
import disableCache from 'fastify-disablecache'

export const registerDisableCache = async (fastify: FastifyInstance) => {
  try {
    await fastify.register(disableCache)
    fastify.log.info('Successfully registered DisableCachePlugin')
  } catch (err) {
    fastify.log.error('Plugin: DisableCachePlugin, error on register', err)
  }
}

export default registerDisableCache
