import {
  cancelExport,
  createExport,
  downloadExport,
  estimateExport,
  getExport,
  listExports,
} from '../../controllers/v2/exportControllerV2'
import { isAuth } from '../../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const exportRoutesV2: FastifyPluginAsync = async server => {
  server.post('/v2/exports', {
    schema: {
      tags: ['Exports'],
      summary: 'Create data export',
      description: 'Create a background data export for the current user.',
      security: [{ apiKey: [] }],
      body: Type.Object({
        include_chats: Type.Optional(Type.Boolean()),
        include_media_files: Type.Optional(Type.Boolean()),
        media_types: Type.Optional(
          Type.Array(
            Type.Union([
              Type.Literal('images'),
              Type.Literal('videos'),
              Type.Literal('audio'),
            ]),
          ),
        ),
        agent_ids: Type.Optional(Type.Array(Type.String())),
        created_after: Type.Optional(
          Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
        ),
        created_before: Type.Optional(
          Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
        ),
      }),
      response: {
        200: Type.Object({
          export: Type.Any(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createExport(server, request, reply),
  })

  server.post('/v2/exports/estimate', {
    schema: {
      tags: ['Exports'],
      summary: 'Estimate data export',
      description: 'Estimate counts and size for a data export.',
      security: [{ apiKey: [] }],
      body: Type.Object({
        include_chats: Type.Optional(Type.Boolean()),
        include_media_files: Type.Optional(Type.Boolean()),
        media_types: Type.Optional(
          Type.Array(
            Type.Union([
              Type.Literal('images'),
              Type.Literal('videos'),
              Type.Literal('audio'),
            ]),
          ),
        ),
        agent_ids: Type.Optional(Type.Array(Type.String())),
        created_after: Type.Optional(
          Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
        ),
        created_before: Type.Optional(
          Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
        ),
      }),
      response: {
        200: Type.Object({
          estimate: Type.Any(),
          limits: Type.Any(),
          over_limit: Type.Boolean(),
          over_limit_reason: Type.Optional(
            Type.Union([Type.String(), Type.Null()]),
          ),
          missing_files: Type.Optional(Type.Integer()),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => estimateExport(server, request, reply),
  })

  server.get('/v2/exports', {
    schema: {
      tags: ['Exports'],
      summary: 'List data exports',
      description: 'List data exports for the current user.',
      security: [{ apiKey: [] }],
      querystring: Type.Object({
        status: Type.Optional(
          Type.Union([
            Type.Literal('queued'),
            Type.Literal('running'),
            Type.Literal('completed'),
            Type.Literal('failed'),
            Type.Literal('expired'),
            Type.Literal('cancelled'),
          ]),
        ),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        offset: Type.Optional(Type.Integer({ minimum: 0 })),
      }),
      response: {
        200: Type.Object({
          exports: Type.Array(Type.Any()),
          total_count: Type.Integer(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => listExports(server, request, reply),
  })

  server.get('/v2/exports/:exportId', {
    schema: {
      tags: ['Exports'],
      summary: 'Get export status',
      description: 'Get details for a specific export.',
      security: [{ apiKey: [] }],
      params: Type.Object({
        exportId: Type.String(),
      }),
      response: {
        200: Type.Object({
          export: Type.Any(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => getExport(server, request, reply),
  })

  server.post('/v2/exports/:exportId/download', {
    schema: {
      tags: ['Exports'],
      summary: 'Get export download URL',
      description: 'Generate a presigned URL for a completed export.',
      security: [{ apiKey: [] }],
      params: Type.Object({
        exportId: Type.String(),
      }),
      response: {
        200: Type.Object({
          url: Type.String(),
          expires_in_seconds: Type.Integer(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => downloadExport(server, request, reply),
  })

  server.post('/v2/exports/:exportId/cancel', {
    schema: {
      tags: ['Exports'],
      summary: 'Cancel export',
      description: 'Cancel a queued or running export.',
      security: [{ apiKey: [] }],
      params: Type.Object({
        exportId: Type.String(),
      }),
      response: {
        200: Type.Object({
          exportId: Type.String(),
          status: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => cancelExport(server, request, reply),
  })
}

export default exportRoutesV2
