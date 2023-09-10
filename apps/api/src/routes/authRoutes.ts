import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { createChallenge, login } from '../controllers/authController'
import { isAdmin } from '../middleware/authMiddleware'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/login', {
    schema: {
      body: Type.Object({
        address: Type.String(),
        message: Type.String(),
        signature: Type.String(),
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
        }),
      },
    },
    handler: (request, reply) => login(server, request, reply),
  })
}

export default authRoutes
