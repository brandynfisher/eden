import { testDiscordNotification } from '../../controllers/v2/testController'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const testRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/test/discord', {
    schema: {
      tags: ['test'],
      summary: 'Test Discord Notification',
      description:
        'Send a test notification to Discord to verify integration functionality.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Any(),
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      testDiscordNotification(server, request, reply),
  })
}

export default testRoutes
