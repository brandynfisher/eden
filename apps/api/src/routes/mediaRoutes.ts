import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import {
  getMediaDownloadUrl,
  uploadMedia,
} from '../controllers/mediaController'
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

  server.get('/media/download', {
    schema: {
      querystring: {
        url: Type.String(),
      },
      response: {
        200: Type.Object({
          signedUrl: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => getMediaDownloadUrl(server, req, reply),
  })
}

export default mediaRoutes
