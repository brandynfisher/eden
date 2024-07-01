import { getUserIdByClerkUserId } from '../../controllers/v2/userControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const userRoutesV2: FastifyPluginAsync = async server => {
  server.get('/users/own-id', {
    schema: {
      tags: ['Users'],
      hide: true,
      description: 'Get a creator id',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: {
          id: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getUserIdByClerkUserId(request, reply),
  })
}

export default userRoutesV2
