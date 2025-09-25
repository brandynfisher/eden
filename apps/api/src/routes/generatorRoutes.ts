import { paginatedResponse, paginationProperties } from '.'
import {
  getGenerator,
  listGenerators,
} from '../controllers/generatorController'
import { parameterType } from '../types/routeTypes'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const generatorRoutes: FastifyPluginAsync = async server => {
  server.get('/generators', {
    schema: {
      hide: true,
      tags: ['Generators'],
      summary: 'List Generators',
      description:
        'Get a paginated list of available AI generators with their configurations and parameters.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          visible: Type.Optional(Type.Boolean()),
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(
          Type.Object({
            _id: Type.Optional(Type.String()),
            generatorName: Type.String(),
            description: Type.String(),
            output: Type.String(),
            defaultVersionId: Type.Optional(Type.String()),
            deployment: Type.Optional(Type.String()),
            versions: Type.Array(
              Type.Object({
                versionId: Type.String(),
                parameters: parameterType,
              }),
            ),
            visible: Type.Optional(Type.Boolean()),
          }),
        ),
      },
    },
    handler: (request, reply) => listGenerators(request, reply),
  })

  server.get('/generators/:generatorName', {
    schema: {
      hide: true,
      tags: ['Generators'],
      summary: 'Get Generator Details',
      description:
        'Retrieve detailed information about a specific AI generator including available versions and parameters.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: Type.Object({
        generatorName: Type.String(),
      }),
      response: {
        200: Type.Object({
          generator: Type.Object({
            _id: Type.Optional(Type.String()),
            generatorName: Type.String(),
            output: Type.String(),
            description: Type.String(),
            defaultVersionId: Type.Optional(Type.String()),
            deployment: Type.Optional(Type.String()),
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
