import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { modifyManna } from '../controllers/mannaController'
import { isAdmin } from '../middleware/authMiddleware'

export interface MannaModifyRequestBody {
  userId: string
  amount: number
}

const mannaRoutes: FastifyPluginAsync = async server => {
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
    preHandler: [request => isAdmin(server, request)],
    handler: (request, reply) => modifyManna(request, reply),
  })
}

export default mannaRoutes
