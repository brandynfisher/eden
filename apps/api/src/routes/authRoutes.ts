import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { receiveUserUpdate } from '../controllers/auth/clerkController'
import { web3login } from '../controllers/auth/web3Controller'
import { migrateCreator } from '../controllers/tempController'
import { isAuth } from '../middleware/authMiddleware'

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
    handler: (request, reply) => web3login(server, request, reply),
  })
  server.post('/auth/clerk/update', {
    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  }),
    server.post('/auth/migrate', {
      schema: {
        body: Type.Object({
          address: Type.String(),
          message: Type.String(),
          signature: Type.String(),
        }),
        response: {
          200: Type.Object({}),
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
      handler: (request, reply) => migrateCreator(request, reply),
    })
}

export default authRoutes
