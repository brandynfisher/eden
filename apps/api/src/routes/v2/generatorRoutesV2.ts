import {
  getGenerator,
  listGenerators,
} from '../../controllers/v2/generatorControllerV2'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const generatorRoutesV2: FastifyPluginAsync = async server => {
  server.get('/generators/:generatorName', {
    schema: {
      tags: ['Generators'],
      description: 'Get a generator',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        generatorName: Type.String(),
      }),
      response: {
        // @todo: declare expected response
        200: Type.Object({
          generator: Type.Object({
            name: Type.String(),
            title: Type.String(),
            outputType: Type.String(),
            parameters: Type.Array(Type.Any()),
          }),
        }),
      },
    },
    handler: (request, reply) => getGenerator(server, request, reply),
  })

  server.get('/generators', {
    schema: {
      tags: ['Generators'],
      description: 'List generators',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          generators: Type.Array(
            Type.Object({
              name: Type.String(),
              title: Type.String(),
              outputType: Type.String(),
            }),
          ),
        }),
      },
    },
    handler: (request, reply) => listGenerators(server, request, reply),
  })
}

export default generatorRoutesV2
