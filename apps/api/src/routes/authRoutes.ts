import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { createChallenge, login } from '../controllers/authController'

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
    handler: (request, reply) => login(request, reply),
  })

  server.post('/auth/challenge', {
    schema: {
      body: Type.Object({
        address: Type.String(),
        isWeb2: Type.Boolean(),
      }),
      response: {
        200: Type.Object({
          nonce: Type.String(),
        }),
      },
    },
    handler: (request, reply) => createChallenge(request, reply),
  })
}

export default authRoutes
