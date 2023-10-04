import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import { getUpload, listUploads } from '../controllers/uploadsController'
import { isAuth, maybeAuth } from '../middleware/authMiddleware'

const uploadRoutes: FastifyPluginAsync = async server => {
  server.get('/uploads', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'array'] },
          ...paginationProperties(),
        },
        required: [],
      },
      response: {
        200: paginatedResponse(Type.Any()),
      },
    },
    handler: (request, reply) => listUploads(request, reply),
  })

  server.get('/uploads/:uploadId', {
    schema: {
      params: {
        uploadId: Type.String(),
      },
      response: {
        200: {
          upload: Type.Any(),
        },
      },
    },
    preHandler: [async (request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getUpload(request, reply),
  })
}

export default uploadRoutes
