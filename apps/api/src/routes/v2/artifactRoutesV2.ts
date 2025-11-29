import { paginatedResponse, paginationProperties } from '..'
import {
  addCreationToArtifact,
  createArtifact,
  deleteArtifact,
  getArtifact,
  listArtifacts,
  removeCreationFromArtifact,
  updateArtifact,
} from '../../controllers/v2/artifactControllerV2'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const artifactRoutesV2: FastifyPluginAsync = async server => {
  // List artifacts
  server.get('/v2/artifacts', {
    schema: {
      tags: ['Artifacts'],
      summary: 'List Artifacts',
      description:
        'Retrieve a paginated list of artifacts, optionally filtered by user ID, type, agent, or session.',
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          type: { type: 'string' },
          agentId: { type: 'string' },
          sessionId: { type: 'string' },
          ...paginationProperties(),
        },
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => listArtifacts(server, request, reply),
  })

  // Get single artifact
  server.get('/v2/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Get Artifact Details',
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
    handler: (request, reply) => getArtifact(server, request, reply),
  })

  // Create artifact
  server.post('/v2/artifacts', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Create Artifact',
      description: 'Create a new artifact with optional creations and agents.',
      security: [{ apiKey: [] }],
      body: Type.Object({
        title: Type.String(),
        type: Type.String(),
        parent: Type.Optional(Type.String()),
        agents: Type.Optional(Type.Array(Type.String())),
        public: Type.Optional(Type.Boolean()),
        description: Type.Optional(Type.String()),
        session: Type.Optional(Type.String()),
        creations: Type.Optional(
          Type.Array(
            Type.Object({
              creation: Type.String(),
              caption: Type.Optional(Type.String()),
            }),
          ),
        ),
      }),
      response: {
        201: { artifact: Type.Any() },
        401: { message: Type.String() },
        422: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createArtifact(server, request, reply),
  })

  // Update artifact
  server.patch('/v2/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Update Artifact',
      description: "Update an existing artifact's properties.",
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      body: Type.Object({
        title: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        parent: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        agents: Type.Optional(Type.Array(Type.String())),
        public: Type.Optional(Type.Boolean()),
        description: Type.Optional(Type.String()),
        session: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        creations: Type.Optional(
          Type.Array(
            Type.Object({
              creation: Type.String(),
              caption: Type.Optional(Type.String()),
            }),
          ),
        ),
        deleted: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: { artifact: Type.Any() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateArtifact(server, request, reply),
  })

  // Delete artifact
  server.delete('/v2/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Delete Artifact',
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
    handler: (request, reply) => deleteArtifact(server, request, reply),
  })

  // Add creation to artifact
  server.post('/v2/artifacts/:artifactId/creations', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Add Creation to Artifact',
      description: 'Add a creation to an artifact with optional caption.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
      },
      body: Type.Object({
        creationId: Type.String(),
        caption: Type.Optional(Type.String()),
      }),
      response: {
        200: { artifact: Type.Any() },
        400: { message: Type.String() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => addCreationToArtifact(server, request, reply),
  })

  // Remove creation from artifact
  server.delete('/v2/artifacts/:artifactId/creations/:creationId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Remove Creation from Artifact',
      description: 'Remove a creation from an artifact.',
      security: [{ apiKey: [] }],
      params: {
        artifactId: Type.String(),
        creationId: Type.String(),
      },
      response: {
        200: { message: Type.String() },
        401: { message: Type.String() },
        404: { message: Type.String() },
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      removeCreationFromArtifact(server, request, reply),
  })
}

export default artifactRoutesV2
