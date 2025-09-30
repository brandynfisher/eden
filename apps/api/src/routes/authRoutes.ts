import {
  claimDailyLoginBonus,
  disconnectDiscord,
  discordOAuth,
} from '../controllers/auth/authController'
import { receiveUserUpdate } from '../controllers/auth/clerkController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/clerk/update', {
    schema: {
      tags: ['Auth'],
      summary: 'Receive Clerk User Update',
      description:
        'Webhook endpoint to receive user update notifications from Clerk authentication service.',
      hide: true,
    },

    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  })
  server.get('/auth/discord/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Discord OAuth Callback',
      description:
        'Handle Discord OAuth2 authentication callback to link Discord account with user profile.',
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
      summary: 'Disconnect Discord Account',
      description:
        'Unlink Discord account from the authenticated user profile.',
      hide: true,
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => disconnectDiscord(request, reply),
  })
  server.post('/auth/daily-login', {
    schema: {
      tags: ['Auth'],
      summary: 'Claim Daily Login Bonus',
      description:
        'Claim daily login manna bonus for the authenticated user. Can only be claimed once per day.',
      hide: true,
      response: {
        200: Type.Object({
          claimed: Type.Number(),
          lastDailyLogin: Type.Optional(Type.String()),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => claimDailyLoginBonus(server, request, reply),
  })
}

export default authRoutes
