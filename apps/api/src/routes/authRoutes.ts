import { claimDailyLoginBonus } from '../controllers/auth/authController'
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
