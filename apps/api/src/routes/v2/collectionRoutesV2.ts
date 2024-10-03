import { paginatedResponse, paginationProperties } from '..'
import {
  addCreationsToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeCreationsFromCollection,
  updateCollection,
} from '../../controllers/v2/collectionControllerV2'
import { isAuthEden2, maybeAuthEden2 } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const collectionRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/collections', {
    schema: {
      tags: ['Collections'],
      description: 'List collections',
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          creationId: Type.Optional(Type.String()),
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuthEden2(server, request)],
    handler: (request, reply) => listCollections(request, reply),
  })

  server.get('/v2/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      description: 'Get a collection',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        collectionId: Type.String(),
      },
      response: {
        200: {
          collection: Type.Any(),
        },
      },
    },
    preHandler: [request => maybeAuthEden2(server, request)],
    handler: (request, reply) => getCollection(request, reply),
  })

  server.post('/v2/collections', {
    schema: {
      tags: ['Collections'],
      description: 'Create a collection',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        name: Type.String(),
        description: Type.Optional(Type.String()),
        creationIds: Type.Optional(Type.Array(Type.String())),
        public: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: {
          collectionId: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => createCollection(request, reply),
  })

  server.patch('/v2/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      description: 'Update a collection',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        collectionId: Type.String(),
      },
      body: Type.Object({
        name: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        public: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          collectionId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => updateCollection(request, reply),
  })

  server.delete('/v2/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      description: 'Delete a collection',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        collectionId: Type.String(),
      },
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => deleteCollection(request, reply),
  })

  server.patch('/v2/collections/:collectionId/creations/add', {
    schema: {
      tags: ['Collections'],
      description: 'Add creations to a collection',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        collectionId: Type.String(),
      },
      body: Type.Object({
        creationIds: Type.Array(Type.String()),
      }),
      response: {
        200: Type.Object({
          collectionId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => addCreationsToCollection(request, reply),
  })

  server.patch('/v2/collections/:collectionId/creations/remove', {
    schema: {
      tags: ['Collections'],
      description: 'Remove creations from a collection',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        collectionId: Type.String(),
      },
      body: Type.Object({
        creationIds: Type.Array(Type.String()),
      }),
      response: {
        200: Type.Object({
          collectionId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuthEden2(server, request, reply)],
    handler: (request, reply) => removeCreationsFromCollection(request, reply),
  })
}

export default collectionRoutesV2
