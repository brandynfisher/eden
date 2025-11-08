import {
  createConcept,
  deleteConcept,
  getConcept,
  listUserConcepts,
  updateConcept,
} from '../../controllers/v2/conceptControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const conceptRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/concepts', {
    schema: {
      tags: ['Concepts V2'],
      summary: 'List User Concepts',
      description:
        'Get all concepts for the current user, or all concepts for a specific agent if agent query parameter is provided.',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: Type.Object({
        agent: Type.Optional(Type.String()),
      }),
      response: {
        200: {
          concepts: Type.Array(Type.Any()),
        },
        400: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listUserConcepts(request, reply),
  })

  server.get('/v2/concepts/:conceptId', {
    schema: {
      tags: ['Concepts V2'],
      summary: 'Get Concept',
      description: 'Get a specific concept by ID.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        conceptId: Type.String(),
      }),
      response: {
        200: {
          concept: Type.Any(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getConcept(request, reply),
  })

  server.post('/v2/concepts', {
    schema: {
      tags: ['Concepts V2'],
      summary: 'Create Concept',
      description: 'Create a new concept with images and usage instructions.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        name: Type.String(),
        agent: Type.Optional(Type.String()),
        usage_instructions: Type.Optional(Type.String()),
        images: Type.Array(
          Type.Object({
            image: Type.String(),
            usage_instructions: Type.String(),
          }),
          { minItems: 1, maxItems: 25 },
        ),
      }),
      response: {
        201: {
          concept: Type.Any(),
        },
        400: {
          message: Type.String(),
        },
        422: {
          message: Type.String(),
        },
        500: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createConcept(server, request, reply),
  })

  server.patch('/v2/concepts/:conceptId', {
    schema: {
      tags: ['Concepts V2'],
      summary: 'Update Concept',
      description: 'Update an existing concept.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        conceptId: Type.String(),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        agent: Type.Optional(Type.String()),
        usage_instructions: Type.Optional(Type.String()),
        images: Type.Optional(
          Type.Array(
            Type.Object({
              image: Type.String(),
              usage_instructions: Type.String(),
            }),
            { minItems: 1, maxItems: 25 },
          ),
        ),
      }),
      response: {
        200: {
          concept: Type.Any(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
        422: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateConcept(server, request, reply),
  })

  server.delete('/v2/concepts/:conceptId', {
    schema: {
      tags: ['Concepts V2'],
      summary: 'Delete Concept',
      description: 'Delete a concept (soft delete).',
      security: [
        {
          apiKey: [],
        },
      ],
      params: Type.Object({
        conceptId: Type.String(),
      }),
      response: {
        200: {
          success: Type.Boolean(),
        },
        400: {
          message: Type.String(),
        },
        404: {
          message: Type.String(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteConcept(request, reply),
  })
}

export default conceptRoutesV2
