import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import {
  disconnectDiscord,
  discordOAuth,
} from '../controllers/auth/authController'
import { receiveUserUpdate } from '../controllers/auth/clerkController'
import { isAuth } from '../middleware/authMiddleware'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/clerk/update', {
    schema: {
      tags: ['Auth'],
      description: 'Receive user update from Clerk',
      hide: true,
    },

    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  })
  server.get('/auth/discord/callback', {
    schema: {
      tags: ['Auth'],
      description: 'Discord OAuth callback',
      hide: true,
      querystring: Type.Object({
        code: Type.String(),
        state: Type.String(),
      }),
    },
    handler: (request, reply) => discordOAuth(server, request, reply),
  })
  server.get('/auth/discord/disconnect', {
    schema: {
      tags: ['Auth'],
      description: 'Disconnect Discord',
      hide: true,
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => disconnectDiscord(request, reply),
  })
}

export default authRoutes
