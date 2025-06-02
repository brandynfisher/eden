import {
  createAgent,
  createAgentTrigger,
  deleteAgent,
  deleteAgentDeployment,
  deleteAgentTrigger,
  deployAgent,
  getAgent,
  getAgentDeployments,
  getAgentTriggers,
  likeAgent,
  unlikeAgent,
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
        models: Type.Optional(
          Type.Array(
            Type.Object({
              lora: Type.String(),
              use_when: Type.Optional(Type.String()),
            }),
          ),
        ),
        persona: Type.Optional(Type.String()),
        isPersonaPublic: Type.Optional(Type.Boolean()),
        greeting: Type.Optional(Type.String()),
        knowledge: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        suggestions: Type.Optional(
          Type.Array(
            Type.Object({
              label: Type.String(),
              prompt: Type.String(),
            }),
          ),
        ),
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
        models: Type.Optional(
          Type.Array(
            Type.Object({
              lora: Type.String(),
              use_when: Type.Optional(Type.String()),
            }),
          ),
        ),
        persona: Type.Optional(Type.String()),
        isPersonaPublic: Type.Optional(Type.Boolean()),
        greeting: Type.Optional(Type.String()),
        knowledge: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        suggestions: Type.Optional(
          Type.Array(
            Type.Object({
              label: Type.String(),
              prompt: Type.String(),
            }),
          ),
        ),
        owner_pays: Type.Optional(Type.Boolean()),
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

  server.get('/v2/agents/:agentId/triggers', {
    schema: {
      tags: ['Agents'],
      description: 'Get agent triggers',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentTriggers(request, reply),
  })

  server.post('/v2/agents/:agentId/triggers', {
    schema: {
      tags: ['Agents'],
      description: 'Create an agent trigger',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createAgentTrigger(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/triggers/:triggerId', {
    schema: {
      tags: ['Agents'],
      description: 'Delete an agent trigger',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteAgentTrigger(server, request, reply),
  })

  server.get('/v2/agents/:agentId/deployments', {
    schema: {
      tags: ['Agents'],
      description: 'Get agent deployments',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getAgentDeployments(request, reply),
  })

  server.post('/v2/agents/:agentId/deployments', {
    schema: {
      tags: ['Agents'],
      description: 'Deploys or updates an agent deployment',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        agentId: Type.String(),
      },
      response: {
        200: Type.Object({
          deploymentId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deployAgent(server, request, reply),
  })

  server.patch('/v2/agents/:agentId/deployments', {
    schema: {
      tags: ['Agents'],
      description: 'Update an agent deployment',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateAgentDeployment(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/deployments/:platform', {
    schema: {
      tags: ['Agents'],
      description: 'Delete an agent deployment',
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteAgentDeployment(server, request, reply),
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

  server.post('/v2/agents/:agentId/like', {
    schema: {
      tags: ['Agents'],
      description: 'Like an agent',
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
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => likeAgent(server, request, reply),
  })

  server.delete('/v2/agents/:agentId/like', {
    schema: {
      tags: ['Agents'],
      description: 'Unlike an agent',
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
          message: Type.String(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => unlikeAgent(server, request, reply),
  })
}

export default agentRoutes
