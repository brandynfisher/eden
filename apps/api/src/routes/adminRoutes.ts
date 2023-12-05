import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { createMannaVoucher, modifyManna } from '../controllers/mannaController'
import { uploadMediaAdmin } from '../controllers/mediaController'
import { createTask } from '../controllers/taskController'
import { isAdmin } from '../middleware/authMiddleware'

export interface MannaModifyRequestBody {
  userId: string
  amount: number
}

const adminRoutes: FastifyPluginAsync = async server => {
  server.post('/admin/manna/modify', {
    schema: {
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
    },
    preHandler: [(request, reply) => isAdmin(server, request, reply)],
    handler: (request, reply) => modifyManna(request, reply),
  })

  server.post('/admin/manna/vouchers/create', {
    schema: {
      request: {
        body: Type.Object({
          amount: Type.Number(),
          allowedUserIds: Type.Optional(Type.Array(Type.String())),
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
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(Type.Any()),
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
}

export default adminRoutes
