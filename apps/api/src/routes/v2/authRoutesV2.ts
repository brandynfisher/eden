import { discordOAuth } from '../../controllers/auth/v2/authControllerV2'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const authRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/auth/discord/callback', {
    schema: {
      tags: ['Auth'],
      description: 'Discord OAuth callback for v2',
      hide: true,
      querystring: Type.Object({
        code: Type.String(),
        state: Type.String(),
      }),
    },
    handler: (request, reply) => discordOAuth(server, request, reply),
  })
}

export default authRoutes
