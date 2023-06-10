import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createScenario,
  deleteScenario,
  getScenario,
  listScenarios,
  updateScenario,
} from '../controllers/scenarioController'
import { isAuth } from '../middleware/authMiddleware'

const scenarioRoutes: FastifyPluginAsync = async server => {
  server.post('/scenarios/create', {
    schema: {
      body: Type.Object({
        name: Type.String(),
        description: Type.String(),
        type: Type.String(),
        data: Type.Any(),
      }),
      response: {
        200: Type.Object({
          ScenarioId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => createScenario(request, reply),
  })

  server.post('/scenarios/update', {
    schema: {
      body: Type.Object({
        scenarioId: Type.String(),
        name: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        data: Type.Optional(Type.Any()),
      }),
      response: {
        200: Type.Object({
          scenarioId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => updateScenario(request, reply),
  })

  server.post('/scenarios/delete', {
    schema: {
      body: Type.Object({
        scenarioId: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => deleteScenario(request, reply),
  })

  server.get('/scenarios', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(
          Type.Object({
            name: Type.String(),
            description: Type.String(),
            type: Type.String(),
            data: Type.Any(),
          }),
        ),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => listScenarios(request, reply),
  })

  server.get('/scenarios/:scenarioId', {
    schema: {
      params: Type.Object({
        ScenarioId: Type.String(),
      }),
      response: {
        200: Type.Object({
          scenario: Type.Object({
            name: Type.String(),
            description: Type.String(),
            type: Type.String(),
            data: Type.Any(),
          }),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => getScenario(request, reply),
  })
}

export default scenarioRoutes
