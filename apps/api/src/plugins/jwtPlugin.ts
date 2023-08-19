import fastifyJWT from '@fastify/jwt'
import type { FastifyInstance, FastifyRequest } from 'fastify'

export const registerJwt = async (fastify: FastifyInstance) => {
  try {
    await fastify.register(fastifyJWT, {
      secret: fastify.config.JWT_SECRET,
    })

    fastify.decorate('verifyUser', async (request: FastifyRequest) => {
      await request.jwtVerify()
    })
    fastify.log.info('Successfully registered JWT Plugin')
  } catch (err) {
    fastify.log.error('Plugin: JWT, error on register', err)
  }
}

export default registerJwt
