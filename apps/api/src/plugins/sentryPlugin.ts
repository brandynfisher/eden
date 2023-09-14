import type { FastifyInstance } from 'fastify'

export const registerSentry = async (fastify: FastifyInstance) => {
  try {
    fastify.register(import('@immobiliarelabs/fastify-sentry'), {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === 'production',
      release: '1.0.0',
    })
    fastify.log.info('Successfully registered Sentry Plugin')
  } catch (err) {
    fastify.log.error(err)
    fastify.log.error('Plugin: Sentry, error on register', err)
  }
}

export default registerSentry
