import { FeatureFlag } from '@edenlabs/eden-sdk'
import {
  createAgent,
  deleteAgent,
  getAgent,
  updateAgent,
} from '../controllers/agentController'
import { isAuthEden2 } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const agentRoutes: FastifyPluginAsync = async server => {
  server.get('/agents/:agentId', {
    schema: {
      tags: ['Agents'],
      description: 'Get an agent',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: {
          agent: Type.Any(),
        },
      },
    },
    preHandler: [
      (request, reply) =>
        isAuthEden2(server, request, reply, [FeatureFlag.AssistantAccess]),
    ],
    handler: (request, reply) => getAgent(server, request, reply),
  })

  server.post('/agents', {
    schema: {
      tags: ['Agents'],
      description: 'Create an agent',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        name: Type.String(),
        key: Type.String(),
        description: Type.String(),
        image: Type.String(),
        instructions: Type.String(),
        tools: Type.Optional(Type.Array(Type.String())),
        discordId: Type.Optional(Type.String()),
      }),
      response: {
        200: {
          agentId: Type.String(),
        },
      },
    },
    preHandler: [
      (request, reply) =>
        isAuthEden2(server, request, reply, [FeatureFlag.AssistantAccess]),
    ],
    handler: (request, reply) => createAgent(server, request, reply),
  })

  server.patch('/agents/:agentId', {
    schema: {
      tags: ['Agents'],
      description: 'Update an agent',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      body: Type.Object({
        name: Type.Optional(Type.String()),
        key: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        image: Type.Optional(Type.String()),
        instructions: Type.Optional(Type.String()),
        tools: Type.Optional(Type.Array(Type.String())),
        discordId: Type.Optional(Type.String()),
        public: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          agentId: Type.String(),
        }),
      },
    },
    preHandler: [
      (request, reply) =>
        isAuthEden2(server, request, reply, [FeatureFlag.AssistantAccess]),
    ],
    handler: (request, reply) => updateAgent(server, request, reply),
  })

  server.delete('/agents/:agentId', {
    schema: {
      tags: ['Agents'],
      description: 'Delete an agent',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [
      (request, reply) =>
        isAuthEden2(server, request, reply, [FeatureFlag.AssistantAccess]),
    ],
    handler: (request, reply) => deleteAgent(request, reply),
  })
}

export default agentRoutes
