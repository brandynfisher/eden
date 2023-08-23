import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { login, receiveUserUpdate } from '../controllers/authController'

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
  server.post('/auth/update', {
    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  })
}

export default authRoutes
