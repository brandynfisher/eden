import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  addCreationsToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeCreationsFromCollection,
  updateCollection,
} from '../controllers/collectionsController'
import { isAuth } from '../middleware/authMiddleware'

const collectionRoutes: FastifyPluginAsync = async server => {
  server.get('/collections', {
    schema: {
      tags: ['Collections'],
      description: 'List collections',
      security: [
        {
          apiKey: [],
          apiSecret: [],
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
    handler: (request, reply) => listCollections(request, reply),
  })

  server.get('/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      description: 'Get a collection',
      security: [
        {
          apiKey: [],
          apiSecret: [],
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
    handler: (request, reply) => getCollection(request, reply),
  })

  server.post('/collections/update', {
    schema: {
      tags: ['Collections'],
      description: 'Update a collection',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      body: Type.Object({
        collectionId: Type.Optional(Type.String()),
        name: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateCollection(request, reply),
  })

  server.post('/collections/creations/add', {
    schema: {
      tags: ['Collections'],
      description: 'Add creations to a collection',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      body: Type.Object({
        collectionId: Type.Optional(Type.String()),
        creationIds: Type.Array(Type.String()),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => addCreationsToCollection(request, reply),
  })

  server.post('/collections/creations/remove', {
    schema: {
      tags: ['Collections'],
      description: 'Remove creations from a collection',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      body: Type.Object({
        collectionId: Type.Optional(Type.String()),
        creationIds: Type.Array(Type.String()),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => removeCreationsFromCollection(request, reply),
  })

  server.post('/collections/delete', {
    schema: {
      tags: ['Collections'],
      description: 'Delete a collection',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      body: Type.Object({
        collectionId: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteCollection(request, reply),
  })

  server.post('/collections/create', {
    schema: {
      tags: ['Collections'],
      description: 'Create a collection',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      body: Type.Object({
        name: Type.String(),
        description: Type.Optional(Type.String()),
        creationIds: Type.Optional(Type.Array(Type.String())),
      }),
      response: {
        200: {
          collectionId: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createCollection(request, reply),
  })
}

export default collectionRoutes
