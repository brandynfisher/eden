import {
  createAgent,
  deleteAgent,
  getAgent,
  updateAgent,
  updateAgentDeployment,
} from '../../controllers/agentController'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const agentRoutes: FastifyPluginAsync = async server => {
  server.get('/v2/agents/:agentId', {
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getAgent(server, request, reply),
  })

  server.post('/v2/agents', {
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
        modelId: Type.Optional(Type.String()),
      }),
      response: {
        200: {
          agentId: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createAgent(server, request, reply),
  })

  server.patch('/v2/agents/:agentId', {
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
        public: Type.Optional(Type.Boolean()),
        modelId: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          agentId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgent(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/deployment', {
    schema: {
      tags: ['Agents'],
      description: 'Update agent deployment settings',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      body: Type.Object({
        discord: Type.Object({
          enabled: Type.Boolean(),
          config: Type.Optional(
            Type.Object({
              token: Type.String(),
              allowedChannels: Type.Array(
                Type.Object({
                  id: Type.String(),
                  note: Type.Optional(Type.String()),
                }),
              ),
            }),
          ),
        }),
        telegram: Type.Object({
          enabled: Type.Boolean(),
          config: Type.Optional(
            Type.Object({
              token: Type.String(),
              allowedChannels: Type.Array(
                Type.Object({
                  id: Type.String(),
                  note: Type.Optional(Type.String()),
                }),
              ),
            }),
          ),
        }),
        farcaster: Type.Object({
          enabled: Type.Boolean(),
          config: Type.Optional(
            Type.Object({
              token: Type.String(),
              allowedChannels: Type.Array(
                Type.Object({
                  id: Type.String(),
                  note: Type.Optional(Type.String()),
                }),
              ),
            }),
          ),
        }),
      }),
      response: {
        200: Type.Object({
          agentId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgentDeployment(server, request, reply),
  })

  server.delete('/v2/agents/:agentId', {
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
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteAgent(request, reply),
  })
}

export default agentRoutes
