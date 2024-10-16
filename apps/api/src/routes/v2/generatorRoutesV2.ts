import {
  getGenerator,
  listGenerators,
} from '../../controllers/v2/generatorControllerV2'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const generatorRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/generators/:generatorKey', {
    schema: {
      tags: ['Generators'],
      description: 'Get a generator',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        generatorKey: Type.String(),
      }),
      response: {
        200: Type.Object({
          generator: Type.Object({
            key: Type.String(),
            name: Type.String(),
            private: Type.Optional(Type.Boolean()),
            description: Type.Optional(Type.String()),
            outputType: Type.String(),
            costEstimate: Type.Optional(Type.String()),
            parameters: Type.Optional(Type.Array(Type.Any())),
            resolutions: Type.Optional(Type.Array(Type.String())),
            baseModel: Type.Optional(Type.String()),
          }),
        }),
      },
    },
    handler: (request, reply) => getGenerator(server, request, reply),
  })

  server.get('/v2/generators', {
    schema: {
      tags: ['Generators'],
      description: 'List generators',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        hideParams: Type.Optional(Type.String()),
      },
      response: {
        200: Type.Object({
          generators: Type.Array(
            Type.Object({
              key: Type.String(),
              name: Type.String(),
              private: Type.Boolean(),
              description: Type.Optional(Type.String()),
              outputType: Type.String(),
              costEstimate: Type.Optional(Type.String()),
              parameters: Type.Optional(Type.Array(Type.Any())),
              resolutions: Type.Optional(Type.Array(Type.String())),
              baseModel: Type.Optional(Type.String()),
            }),
          ),
        }),
      },
    },
    handler: (request, reply) => listGenerators(server, request, reply),
  })
}

export default generatorRoutesV2
