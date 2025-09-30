import { paginatedResponse, paginationProperties } from '.'
import {
  conceptDelete,
  conceptReact,
  conceptUnreact,
  conceptUpdate,
  getConcept,
  listConcepts,
} from '../controllers/conceptsController'
import { isAuth, maybeAuth } from '../middleware/authMiddleware'
import { ReactionType } from '@edenlabs/eden-sdk'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const conceptRoutes: FastifyPluginAsync = async server => {
  server.get('/concepts', {
    schema: {
      hide: true,
      tags: ['Concepts'],
      summary: 'List Concepts',
      description:
        'Get a paginated list of trained concepts with optional filtering by user ID or name.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          name: { type: 'string' },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    handler: (request, reply) => listConcepts(request, reply),
  })

  server.get('/concepts/:conceptId', {
    schema: {
      hide: true,
      tags: ['Concepts'],
      summary: 'Get Concept Details',
      description:
        'Retrieve detailed information about a specific trained concept including training status and metadata.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        conceptId: Type.String(),
      },
      response: {
        200: {
          concept: Type.Any(),
        },
        400: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        401: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        404: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
        500: {
          // error: Type.Optional(Type.String()),
          message: Type.Optional(Type.String()),
        },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getConcept(request, reply),
  })

  server.patch('/concepts/:conceptId', {
    schema: {
      hide: true,
      tags: ['Concepts'],
      summary: 'Update Concept',
      description:
        "Update an existing concept's privacy settings or description.",
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        conceptId: Type.String(),
      },
      body: Type.Object({
        isPrivate: Type.Optional(Type.Boolean()),
        description: Type.Optional(Type.String()),
      }),
      response: {
        200: {
          concept: Type.Any(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => conceptUpdate(request, reply),
  })

  server.delete('/concepts/:conceptId', {
    schema: {
      hide: true,
      tags: ['Concepts'],
      summary: 'Delete Concept',
      description:
        'Permanently delete a trained concept and all associated training data.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        conceptId: Type.String(),
      },
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => conceptDelete(request, reply),
  })

  server.post('/concepts/reactions/add', {
    schema: {
      hide: true,
      tags: ['Concepts'],
      summary: 'React to Concept',
      description: 'Add a reaction (like, dislike, etc.) to a concept.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      body: Type.Object({
        conceptId: Type.String(),
        reaction: Type.Enum(ReactionType),
      }),
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => conceptReact(request, reply),
  })

  server.post('/concepts/reactions/remove', {
    schema: {
      hide: true,
      tags: ['Concepts'],
      summary: 'Remove Concept Reaction',
      description: 'Remove a previously added reaction from a concept.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      body: Type.Object({
        conceptId: Type.String(),
        reaction: Type.Enum(ReactionType),
      }),
      response: {
        200: {
          success: Type.Boolean(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => conceptUnreact(request, reply),
  })
}

export default conceptRoutes
