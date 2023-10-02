import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { uploadMedia } from '../controllers/mediaController'
import { isAuth } from '../middleware/authMiddleware'

const mediaRoutes: FastifyPluginAsync = async server => {
  server.post('/media/upload', {
    schema: {
      response: {
        200: Type.Object({
          url: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => uploadMedia(server, req, reply),
  })
}

export default mediaRoutes
