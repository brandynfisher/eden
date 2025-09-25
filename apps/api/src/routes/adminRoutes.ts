import { paginatedResponse, paginationProperties } from '.'
import { adminListApiKeys } from '../controllers/apiKeyController'
import {
  conceptExportToHF,
  removeConceptFromHF,
} from '../controllers/conceptsController'
import { createMannaVoucher, modifyManna } from '../controllers/mannaController'
import { uploadMediaAdmin } from '../controllers/mediaController'
import { createTask } from '../controllers/taskController'
import { isAdmin } from '../middleware/authMiddleware'
import { configType } from '../types/routeTypes'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

export interface MannaModifyRequestBody {
  userId: string
  amount: number
}

const adminRoutes: FastifyPluginAsync = async server => {
  server.post('/admin/manna/modify', {
    schema: {
      tags: ['Admin'],
      summary: 'Modify User Manna Balance',
      description:
        'Adjust the manna balance for a specific user account. This allows administrators to add or subtract manna from user accounts.',
      hide: true,
      request: {
        body: Type.Object({
          userId: Type.String(),
          amount: Type.Number(),
        }),
      },
      response: {
        200: Type.Object({
          userId: Type.String(),
          manna: Type.Number(),
          transactionId: Type.String(),
        }),
      },
      // security: [
      //   {
      //     apiKey: [],
      //   },
      // ],
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => modifyManna(request, reply),
  })

  server.post('/admin/manna/vouchers/create', {
    schema: {
      tags: ['Admin'],
      summary: 'Create Manna Vouchers',
      description:
        'Generate redeemable manna voucher codes with configurable restrictions such as allowed users, usage limits, and associated actions.',
      hide: true,
      request: {
        body: Type.Object({
          amount: Type.Number(),
          allowedUserIds: Type.Optional(Type.Array(Type.String())),
          numberOfUses: Type.Optional(Type.Number()),
          code: Type.Optional(Type.String()),
          action: Type.Optional(Type.String()),
        }),
      },
      response: {
        200: Type.Object({
          code: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => createMannaVoucher(request, reply),
  })

  server.post('/admin/media/upload', {
    schema: {
      tags: ['Admin'],
      summary: 'Upload Media Files',
      description:
        'Upload media files (images, videos, etc.) to the server with administrative privileges.',
      hide: true,
      response: {
        200: Type.Object({
          url: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (req, reply) => uploadMediaAdmin(server, req, reply),
  })

  server.post('/admin/tasks/create', {
    schema: {
      tags: ['Admin'],
      summary: 'Create Task',
      description:
        'Create a new task with administrative privileges, including generator configuration and webhook settings.',
      hide: true,
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(configType),
        webhooks: Type.Optional(Type.Array(Type.String())),
        attributes: Type.Optional(
          Type.Object({
            discordId: Type.Optional(Type.String()),
            delegateUserId: Type.Optional(Type.String()),
          }),
        ),
      },
      response: {
        200: Type.Object({
          taskId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => createTask(server, request, reply),
  })

  server.post('/admin/concepts/export/hf', {
    schema: {
      tags: ['Admin'],
      summary: 'Export Concept to HuggingFace',
      description:
        'Export a trained concept or LoRA model to HuggingFace model repository for public sharing and distribution.',
      security: [
        {
          apiKey: [],
        },
      ],
      hide: true,
      body: Type.Object({
        userId: Type.String(),
        conceptId: Type.String(),
      }),
      response: {
        200: {
          url: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => conceptExportToHF(server, request, reply),
  })

  server.post('/admin/concepts/remove/hf', {
    schema: {
      tags: ['Admin'],
      summary: 'Remove Concept from HuggingFace',
      description:
        'Delete a previously exported concept or LoRA model from HuggingFace model repository.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      hide: true,
      body: Type.Object({
        userId: Type.String(),
        conceptId: Type.String(),
      }),
      response: {
        200: {
          url: Type.String(),
        },
      },
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => removeConceptFromHF(server, request, reply),
  })

  server.get('/admin/apikeys', {
    schema: {
      tags: ['Admin'],
      summary: 'List All API Keys',
      description:
        'Retrieve a paginated list of all API keys in the system with optional filtering by character.',
      hide: true,
      querystring: {
        type: 'object',
        properties: {
          character: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(
          Type.Object({
            apiKey: Type.String(),
            apiSecret: Type.Optional(Type.String()),
            note: Type.Optional(Type.String()),
            createdAt: Type.String(),
          }),
        ),
      },
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => adminListApiKeys(request, reply),
  })
}

export default adminRoutes
