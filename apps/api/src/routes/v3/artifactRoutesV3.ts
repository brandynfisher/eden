import { paginatedResponse, paginationProperties } from '..'
import {
  createArtifactV3,
  deleteArtifactV3,
  getArtifactPermissionsV3,
  getArtifactV3,
  listArtifactHistoryV3,
  listArtifactsV3,
  patchArtifactItemsV3,
  updateArtifactPermissionsV3,
  updateArtifactV3,
} from '../../controllers/v3/artifactControllerV3'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const artifactRoutesV3: FastifyPluginAsync = async server => {
  server.get('/v3/artifacts', {
    schema: {
      tags: ['Artifacts V3'],
      summary: 'List Artifacts V3',
      description:
        'Retrieve a paginated list of artifacts, optionally filtered by owner, type, or session.',
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          ownerId: { type: 'string' },
          type: { type: 'string' },
          sessionId: { type: 'string' },
          ...paginationProperties(),
        },
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => listArtifactsV3(server, request, reply),
  })

  server.get('/v3/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts V3'],
      summary: 'Get Artifact V3 Details',
      description:
        'Retrieve detailed information about a specific artifact by its ID.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      response: {
        200: { artifact: Type.Any() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getArtifactV3(request, reply),
  })

  server.post('/v3/artifacts', {
    schema: {
      tags: ['Artifacts V3'],
      summary: 'Create Artifact V3',
      description: 'Create a new artifact.',
      security: [{ apiKey: [] }],
      body: Type.Object({
        title: Type.String(),
        type: Type.String(),
        public: Type.Optional(Type.Boolean()),
        session: Type.Optional(Type.String()),
        items: Type.Optional(Type.Record(Type.String(), Type.Any())),
        content: Type.Optional(Type.String()),
      }),
      response: {
        201: { artifact: Type.Any() },
        401: { message: Type.String() },
        422: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createArtifactV3(request, reply),
  })

  server.patch('/v3/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts V3'],
      summary: 'Update Artifact V3',
      description: "Update an existing artifact's properties.",
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      body: Type.Object({
        title: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        public: Type.Optional(Type.Boolean()),
        session: Type.Optional(Type.Union([Type.String(), Type.Null()])),
      }),
      response: {
        200: { artifact: Type.Any() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateArtifactV3(request, reply),
  })

  server.patch('/v3/artifacts/:artifactId/items', {
    schema: {
      tags: ['Artifacts V3'],
      summary: 'Patch Artifact Items',
      description:
        'Apply JSON Patch operations (RFC 6902) to artifact items. Supports add, remove, and replace operations.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      body: Type.Object({
        operations: Type.Array(
          Type.Object({
            op: Type.Union([
              Type.Literal('add'),
              Type.Literal('remove'),
              Type.Literal('replace'),
            ]),
            path: Type.String({
              description: 'JSON Pointer path (e.g., /characters/0/name)',
            }),
            value: Type.Optional(Type.Any()),
          }),
        ),
        reason: Type.Optional(Type.String()),
      }),
      response: {
        200: { artifact: Type.Any() },
        401: { message: Type.String() },
        404: { message: Type.String() },
        422: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => patchArtifactItemsV3(request, reply),
  })

  server.delete('/v3/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts V3'],
      summary: 'Delete Artifact V3',
      description: 'Soft delete an artifact.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      response: {
        200: { message: Type.String() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteArtifactV3(request, reply),
  })

  server.get('/v3/artifacts/:artifactId/permissions', {
    schema: {
      tags: ['Artifacts V3 - Permissions'],
      summary: 'Get Artifact Permissions',
      description: 'Retrieve permissions for an artifact.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      response: {
        200: { permissions: Type.Any() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getArtifactPermissionsV3(request, reply),
  })

  server.put('/v3/artifacts/:artifactId/permissions', {
    schema: {
      tags: ['Artifacts V3 - Permissions'],
      summary: 'Update Artifact Permissions',
      description: 'Replace permissions for an artifact (artifact-level only).',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      body: Type.Object({
        permissions: Type.Array(
          Type.Object({
            subjectId: Type.String(),
            level: Type.Union([
              Type.Literal('viewer'),
              Type.Literal('editor'),
              Type.Literal('owner'),
            ]),
          }),
        ),
      }),
      response: {
        200: { permissions: Type.Any() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateArtifactPermissionsV3(request, reply),
  })

  server.get('/v3/artifacts/:artifactId/history', {
    schema: {
      tags: ['Artifacts V3 - History'],
      summary: 'List Artifact History',
      description: 'Retrieve a paginated list of artifact edit history.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      querystring: {
        type: 'object',
        properties: {
          ...paginationProperties(),
        },
      },
      response: {
        200: paginatedResponse(Type.Any()),
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listArtifactHistoryV3(request, reply),
  })
}

export default artifactRoutesV3
