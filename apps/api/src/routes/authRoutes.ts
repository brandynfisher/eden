import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { discordOAuth } from '../controllers/auth/authController'
import { receiveUserUpdate } from '../controllers/auth/clerkController'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/clerk/update', {
    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  })
  server.get('/auth/discord/callback', {
    schema: {
      querystring: Type.Object({
        code: Type.String(),
        state: Type.String(),
      }),
    },
    handler: (request, reply) => discordOAuth(server, request, reply),
  })
}

export default authRoutes
