import { extractAgentPrompts } from '../controllers/agentCreationController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

interface AgentPromptsExtractionRequest {
  session_id: string
}

const agentCreationRoutes: FastifyPluginAsync = async server => {
  server.post<{ Body: AgentPromptsExtractionRequest }>(
    '/agent_creation/extract_prompts',
    {
      schema: {
        tags: ['Agent Creation'],
        summary: 'Extract Agent Prompts',
        description:
          'Extract agent persona, description, and memory instructions from a conversation session',
        security: [
          {
            apiKey: [],
          },
        ],
        body: Type.Object({
          session_id: Type.String(),
        }),
        response: {
          200: Type.Object({
            agent_instructions: Type.String(),
            agent_description: Type.String(),
            memory_instructions: Type.String(),
            cost: Type.Number(),
          }),
        },
      },
      preHandler: [(request, reply) => isAuth(server, request, reply)],
      handler: (request, reply) => extractAgentPrompts(server, request, reply),
    },
  )
}

export default agentCreationRoutes
