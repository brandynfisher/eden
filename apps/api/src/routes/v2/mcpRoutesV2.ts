import { isAllowedAccess } from '../../lib/authorization'
import { signMcpToken } from '../../lib/mcpTokens'
import { isAdmin } from '../../middleware/authMiddleware'
import { User } from '../../models/User'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

const mcpRoutesV2: FastifyPluginAsync = async server => {
  server.post('/v2/mcp/token', {
    schema: {
      tags: ['MCP'],
      summary: 'Create short-lived MCP token',
      description:
        'Mint a short-lived MCP token for acting on behalf of a user (admin only).',
      hide: true,
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        userId: Type.String(),
        ttlSeconds: Type.Optional(Type.Number({ minimum: 60, maximum: 3600 })),
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
          expiresIn: Type.Number(),
          expiresAt: Type.String(),
        }),
        400: Type.Object({
          message: Type.String(),
        }),
        403: Type.Object({
          message: Type.String(),
        }),
        404: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, ttlSeconds } = request.body as {
        userId: string
        ttlSeconds?: number
      }

      if (!userId) {
        return reply.status(400).send({ message: 'userId is required' })
      }

      const user = await User.findById(userId)
      if (!user) {
        return reply.status(404).send({ message: 'User not found' })
      }

      if (!isAllowedAccess(server, user.userId)) {
        return reply.status(403).send({ message: 'User not allowed' })
      }

      const tokenPayload = signMcpToken(server, String(user._id), ttlSeconds)
      return reply.status(200).send(tokenPayload)
    },
  })
}

export default mcpRoutesV2
