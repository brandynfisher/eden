import {
  ArtifactHistoryEntrySchema,
  ArtifactSchema,
  ArtifactsV3Domain,
} from '../src/domain/v3/artifacts'
import {
  ErrorResponseSchema,
  MessageResponseSchema,
} from '../src/domain/v3/common'
import { MannaV3Domain } from '../src/domain/v3/manna'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'yaml'

const toSchema = (schema: unknown) =>
  JSON.parse(JSON.stringify(schema)) as Record<string, unknown>

const securitySchemes = {
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'X-Api-Key',
  },
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
}

const authSecurity = [{ apiKey: [] }, { bearerAuth: [] }]

const artifactsSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Eden Artifacts V3 API',
    version: '0.1.0',
    description: 'v3 artifact endpoints',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Artifacts' }],
  components: {
    schemas: {
      ErrorResponse: toSchema(ErrorResponseSchema),
      MessageResponse: toSchema(MessageResponseSchema),
      Artifact: toSchema(ArtifactSchema),
      ArtifactResponse: toSchema(ArtifactsV3Domain.response.artifact),
      PaginatedArtifactsResponse: toSchema(
        ArtifactsV3Domain.response.paginated,
      ),
      ArtifactHistoryEntry: toSchema(ArtifactHistoryEntrySchema),
      PaginatedArtifactsHistoryResponse: toSchema(
        ArtifactsV3Domain.response.history,
      ),
      ArtifactCreateRequest: toSchema(ArtifactsV3Domain.request.create),
      ArtifactUpdateRequest: toSchema(ArtifactsV3Domain.request.update),
      ArtifactPatchItemsRequest: toSchema(ArtifactsV3Domain.request.patchItems),
      ArtifactPermissionsUpdateRequest: toSchema(
        ArtifactsV3Domain.request.permissionsUpdate,
      ),
      ArtifactPermissionsResponse: toSchema(
        ArtifactsV3Domain.response.permissions,
      ),
      ArtifactIdParam: toSchema(ArtifactsV3Domain.params.artifactId),
      ArtifactsListQuery: toSchema(ArtifactsV3Domain.query.list),
      ArtifactsHistoryQuery: toSchema(ArtifactsV3Domain.query.history),
    },
    responses: {
      ErrorResponse: {
        description: 'Error response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    parameters: {
      artifactId: {
        in: 'path',
        name: 'artifactId',
        required: true,
        schema: { type: 'string' },
      },
      ownerId: { in: 'query', name: 'ownerId', schema: { type: 'string' } },
      type: { in: 'query', name: 'type', schema: { type: 'string' } },
      sessionId: { in: 'query', name: 'sessionId', schema: { type: 'string' } },
      page: { in: 'query', name: 'page', schema: { type: 'integer' } },
      limit: { in: 'query', name: 'limit', schema: { type: 'integer' } },
      orderBy: { in: 'query', name: 'orderBy', schema: { type: 'string' } },
      direction: {
        in: 'query',
        name: 'direction',
        schema: { type: 'integer' },
      },
    },
    securitySchemes,
  },
  paths: {
    '/v3/artifacts': {
      get: {
        tags: ['Artifacts'],
        summary: 'List artifacts',
        description: 'Retrieve a paginated list of artifacts.',
        operationId: 'artifacts.list',
        'x-eden': { method: 'artifacts.list' },
        security: authSecurity,
        parameters: [
          { $ref: '#/components/parameters/ownerId' },
          { $ref: '#/components/parameters/type' },
          { $ref: '#/components/parameters/sessionId' },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/orderBy' },
          { $ref: '#/components/parameters/direction' },
        ],
        responses: {
          '200': {
            description: 'A paginated list of artifacts',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedArtifactsResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Artifacts'],
        summary: 'Create artifact',
        description: 'Create a new artifact.',
        operationId: 'artifacts.create',
        'x-eden': { method: 'artifacts.create' },
        security: authSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ArtifactCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Artifact created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArtifactResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '422': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/v3/artifacts/{artifactId}': {
      get: {
        tags: ['Artifacts'],
        summary: 'Get artifact',
        description: 'Retrieve a specific artifact.',
        operationId: 'artifacts.get',
        'x-eden': { method: 'artifacts.get' },
        security: authSecurity,
        parameters: [{ $ref: '#/components/parameters/artifactId' }],
        responses: {
          '200': {
            description: 'Artifact details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArtifactResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
      patch: {
        tags: ['Artifacts'],
        summary: 'Update artifact',
        description: 'Update an existing artifact.',
        operationId: 'artifacts.update',
        'x-eden': { method: 'artifacts.update' },
        security: authSecurity,
        parameters: [{ $ref: '#/components/parameters/artifactId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ArtifactUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Artifact updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArtifactResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
      delete: {
        tags: ['Artifacts'],
        summary: 'Delete artifact',
        description: 'Soft delete an artifact.',
        operationId: 'artifacts.delete',
        'x-eden': { method: 'artifacts.delete' },
        security: authSecurity,
        parameters: [{ $ref: '#/components/parameters/artifactId' }],
        responses: {
          '200': {
            description: 'Artifact deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/v3/artifacts/{artifactId}/items': {
      patch: {
        tags: ['Artifacts'],
        summary: 'Patch artifact items',
        description:
          'Apply JSON Patch operations (RFC 6902) to artifact items.',
        operationId: 'artifacts.patchItems',
        'x-eden': { method: 'artifacts.patchItems' },
        security: authSecurity,
        parameters: [{ $ref: '#/components/parameters/artifactId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ArtifactPatchItemsRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Artifact updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArtifactResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
          '422': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/v3/artifacts/{artifactId}/permissions': {
      get: {
        tags: ['Artifacts'],
        summary: 'Get artifact permissions',
        description: 'Retrieve permissions for an artifact.',
        operationId: 'artifacts.getPermissions',
        'x-eden': { method: 'artifacts.getPermissions' },
        security: authSecurity,
        parameters: [{ $ref: '#/components/parameters/artifactId' }],
        responses: {
          '200': {
            description: 'Permissions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ArtifactPermissionsResponse',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
      put: {
        tags: ['Artifacts'],
        summary: 'Update artifact permissions',
        description: 'Replace permissions for an artifact.',
        operationId: 'artifacts.updatePermissions',
        'x-eden': { method: 'artifacts.updatePermissions' },
        security: authSecurity,
        parameters: [{ $ref: '#/components/parameters/artifactId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ArtifactPermissionsUpdateRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Permissions updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ArtifactPermissionsResponse',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/v3/artifacts/{artifactId}/history': {
      get: {
        tags: ['Artifacts'],
        summary: 'List artifact history',
        description: 'Retrieve a paginated list of artifact edit history.',
        operationId: 'artifacts.history',
        'x-eden': { method: 'artifacts.history' },
        security: authSecurity,
        parameters: [
          { $ref: '#/components/parameters/artifactId' },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { $ref: '#/components/parameters/orderBy' },
          { $ref: '#/components/parameters/direction' },
        ],
        responses: {
          '200': {
            description: 'Artifact history',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedArtifactsHistoryResponse',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/ErrorResponse' },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
  },
}

const mannaSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Eden Manna V3 API',
    version: '0.1.0',
    description: 'v3 manna endpoints',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Manna' }],
  components: {
    schemas: {
      ErrorResponse: toSchema(ErrorResponseSchema),
      MannaVoucherRedeemRequest: toSchema(MannaV3Domain.request.redeemVoucher),
      MannaVoucherRedeemResponse: toSchema(
        MannaV3Domain.response.redeemVoucher,
      ),
    },
    responses: {
      ErrorResponse: {
        description: 'Error response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    securitySchemes,
  },
  paths: {
    '/v3/manna/vouchers/redeem': {
      post: {
        tags: ['Manna'],
        summary: 'Redeem manna voucher',
        description:
          "Redeem a manna voucher code to add manna to the authenticated user's account.",
        operationId: 'manna.redeemVoucher',
        'x-eden': { method: 'manna.redeemVoucher' },
        security: authSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MannaVoucherRedeemRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Voucher redeemed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MannaVoucherRedeemResponse',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ErrorResponse' },
          '401': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
  },
}

const writeSpec = (target: string, spec: unknown) => {
  const outPath = resolve(process.cwd(), target)
  writeFileSync(outPath, yaml.stringify(spec))
  // eslint-disable-next-line no-console
  console.log(`[openapi] wrote ${outPath}`)
}

writeSpec('openapi/artifacts-v3.yaml', artifactsSpec)
writeSpec('openapi/manna-v3.yaml', mannaSpec)
