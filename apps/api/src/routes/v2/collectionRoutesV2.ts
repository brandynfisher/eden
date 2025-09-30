import {
  addCreationsToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  getCollectionCreations,
  getCollectionDownloadZip,
  getUserCollectionsLight,
  removeCreationsFromCollection,
  updateCollection,
} from '../../controllers/v2/collectionControllerV2'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const collectionRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/collections/light', {
    schema: {
      tags: ['Collections'],
      summary: 'Get User Collections Light',
      description:
        'Retrieve a lightweight list of collections owned by the current user with basic information.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: {
          collections: Type.Array(Type.Any()),
        },
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getUserCollectionsLight(request, reply),
  })

  server.get('/v2/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      summary: 'Get Collection Details',
      description:
        'Retrieve detailed information about a specific collection by its ID.',
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
    handler: (request, reply) => getCollection(server, request, reply),
  })

  server.get('/v2/collections/:collectionId/creations', {
    schema: {
      tags: ['Collections'],
      summary: 'Get Collection Creations',
      description:
        'Retrieve all creations that belong to a specific collection.',
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
          creations: Type.Array(Type.Any()),
        },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getCollectionCreations(server, request, reply),
  })

  server.post('/v2/collections', {
    schema: {
      tags: ['Collections'],
      summary: 'Create New Collection',
      description:
        'Create a new collection to organize and group related creations together.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => createCollection(request, reply),
  })

  server.post('/v2/collections/:collectionId/download', {
    schema: {
      tags: ['Collections'],
      summary: 'Download Collection',
      description:
        'Generate and download a ZIP file containing all creations in the collection.',
      security: [
        {
          apiKey: [],
        },
      ],
      params: {
        collectionId: Type.String(),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      getCollectionDownloadZip(server, request, reply),
  })

  server.patch('/v2/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      summary: 'Update Collection',
      description:
        'Modify the name, description, or visibility settings of an existing collection.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => updateCollection(request, reply),
  })

  server.delete('/v2/collections/:collectionId', {
    schema: {
      tags: ['Collections'],
      summary: 'Delete Collection',
      description:
        'Permanently delete a collection and remove all creation associations.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => deleteCollection(request, reply),
  })

  server.patch('/v2/collections/:collectionId/creations/add', {
    schema: {
      tags: ['Collections'],
      summary: 'Add Creations',
      description: 'Add one or more creations to an existing collection.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => addCreationsToCollection(request, reply),
  })

  server.patch('/v2/collections/:collectionId/creations/remove', {
    schema: {
      tags: ['Collections'],
      summary: 'Remove Creations',
      description: 'Remove one or more creations from an existing collection.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => removeCreationsFromCollection(request, reply),
  })
}

export default collectionRoutesV2
