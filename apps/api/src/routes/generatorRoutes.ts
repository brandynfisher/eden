import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  getGenerator,
  listGenerators,
} from '../controllers/generatorController'
import { parameterType } from '../types/routeTypes'

const generatorRoutes: FastifyPluginAsync = async server => {
  server.get('/generators', {
    schema: {
      tags: ['Generators'],
      description: 'List generators',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(
          Type.Object({
            generatorName: Type.String(),
            description: Type.String(),
            output: Type.String(),
            defaultVersionId: Type.Optional(Type.String()),
            versions: Type.Array(
              Type.Object({
                versionId: Type.String(),
                parameters: parameterType,
              }),
            ),
          }),
        ),
      },
    },
    handler: (request, reply) => listGenerators(request, reply),
  })

  server.get('/generators/:generatorName', {
    schema: {
      tags: ['Generators'],
      description: 'Get a generator',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      params: Type.Object({
        generatorName: Type.String(),
      }),
      response: {
        200: Type.Object({
          generator: Type.Object({
            generatorName: Type.String(),
            output: Type.String(),
            description: Type.String(),
            defaultVersionId: Type.Optional(Type.String()),
            versions: Type.Array(
              Type.Object({
                versionId: Type.String(),
                parameters: parameterType,
              }),
            ),
          }),
        }),
      },
    },
    handler: (request, reply) => getGenerator(request, reply),
  })
}

export default generatorRoutes
