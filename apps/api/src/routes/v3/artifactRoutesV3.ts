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
import { ArtifactsV3Domain } from '../../domain/v3/artifacts'
import { isAuth, maybeAuth } from '../../middleware/authMiddleware'
import { FastifyPluginAsync } from 'fastify'

const artifactRoutesV3: FastifyPluginAsync = async server => {
  server.get('/v3/artifacts', {
    schema: {
      tags: ['Artifacts'],
      summary: 'List Artifacts V3',
      description:
        'Retrieve a paginated list of artifacts, optionally filtered by owner, type, or session.',
      security: [{ apiKey: [] }],
      querystring: ArtifactsV3Domain.query.list,
      response: {
        200: ArtifactsV3Domain.response.paginated,
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => listArtifactsV3(server, request, reply),
  })

  server.get('/v3/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Get Artifact V3 Details',
      description:
        'Retrieve detailed information about a specific artifact by its ID.',
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      response: {
        200: ArtifactsV3Domain.response.artifact,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getArtifactV3(request, reply),
  })

  server.post('/v3/artifacts', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Create Artifact V3',
      description: 'Create a new artifact.',
      security: [{ apiKey: [] }],
      body: ArtifactsV3Domain.request.create,
      response: {
        201: ArtifactsV3Domain.response.artifact,
        401: ArtifactsV3Domain.response.error,
        422: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createArtifactV3(request, reply),
  })

  server.patch('/v3/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Update Artifact V3',
      description: "Update an existing artifact's properties.",
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      body: ArtifactsV3Domain.request.update,
      response: {
        200: ArtifactsV3Domain.response.artifact,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateArtifactV3(request, reply),
  })

  server.patch('/v3/artifacts/:artifactId/items', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Patch Artifact Items',
      description:
        'Apply JSON Patch operations (RFC 6902) to artifact items. Supports add, remove, and replace operations.',
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      body: ArtifactsV3Domain.request.patchItems,
      response: {
        200: ArtifactsV3Domain.response.artifact,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
        422: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => patchArtifactItemsV3(request, reply),
  })

  server.delete('/v3/artifacts/:artifactId', {
    schema: {
      tags: ['Artifacts'],
      summary: 'Delete Artifact V3',
      description: 'Soft delete an artifact.',
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      response: {
        200: ArtifactsV3Domain.response.message,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteArtifactV3(request, reply),
  })

  server.get('/v3/artifacts/:artifactId/permissions', {
    schema: {
      tags: ['Artifacts - Permissions'],
      summary: 'Get Artifact Permissions',
      description: 'Retrieve permissions for an artifact.',
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      response: {
        200: ArtifactsV3Domain.response.permissions,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getArtifactPermissionsV3(request, reply),
  })

  server.put('/v3/artifacts/:artifactId/permissions', {
    schema: {
      tags: ['Artifacts - Permissions'],
      summary: 'Update Artifact Permissions',
      description: 'Replace permissions for an artifact (artifact-level only).',
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      body: ArtifactsV3Domain.request.permissionsUpdate,
      response: {
        200: ArtifactsV3Domain.response.permissions,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateArtifactPermissionsV3(request, reply),
  })

  server.get('/v3/artifacts/:artifactId/history', {
    schema: {
      tags: ['Artifacts - History'],
      summary: 'List Artifact History',
      description: 'Retrieve a paginated list of artifact edit history.',
      security: [{ apiKey: [] }],
      params: ArtifactsV3Domain.params.artifactId,
      querystring: ArtifactsV3Domain.query.history,
      response: {
        200: ArtifactsV3Domain.response.history,
        401: ArtifactsV3Domain.response.error,
        404: ArtifactsV3Domain.response.error,
      },
    },
    preHandler: [async (request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listArtifactHistoryV3(request, reply),
  })
}

export default artifactRoutesV3
