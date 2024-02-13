import {
  getMediaDownloadUrl,
  uploadMedia,
} from '../controllers/mediaController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const mediaRoutes: FastifyPluginAsync = async server => {
  server.post('/media/upload', {
    schema: {
      tags: ['Media'],
      description: 'Upload media',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
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
      tags: ['Media'],
      description: 'Get media download url',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      querystring: {
        url: Type.String(),
        fileName: Type.Optional(Type.String()),
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
