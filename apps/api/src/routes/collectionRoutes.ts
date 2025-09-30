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
import { isAuth, maybeAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const collectionRoutes: FastifyPluginAsync = async server => {
  server.get('/collections', {
    schema: {
      tags: ['Collections'],
      summary: 'List Collections',
      description:
        'Get a paginated list of collections with optional filtering by user ID or creation ID.',
      hide: true,
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => listCollections(request, reply),
  })

  server.get('/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      summary: 'Get Collection Details',
      description:
        'Retrieve detailed information about a specific collection including its creations.',
      hide: true,
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getCollection(request, reply),
  })

  server.patch('/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      summary: 'Update Collection',
      description:
        "Update an existing collection's name, description, or privacy settings.",
      hide: true,
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
        isPrivate: Type.Optional(Type.Boolean()),
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
      summary: 'Add Creations to Collection',
      description: 'Add one or more creations to an existing collection.',
      hide: true,
      security: [
        {
          apiKey: [],
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
      summary: 'Remove Creations from Collection',
      description: 'Remove one or more creations from an existing collection.',
      hide: true,
      security: [
        {
          apiKey: [],
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

  server.delete('/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      summary: 'Delete Collection',
      description:
        'Permanently delete a collection and remove all creation associations.',
      hide: true,
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        conceptId: Type.String(),
      },
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
      summary: 'Create New Collection',
      description:
        'Create a new collection to organize and group related creations.',
      hide: true,
      security: [
        {
          apiKey: [],
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
