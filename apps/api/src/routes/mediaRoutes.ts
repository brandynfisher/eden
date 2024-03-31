import {
  getMediaDownloadUrl,
  receiveMediaTranscodeUpdate,
  uploadMedia,
  uploadMediaRequest,
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
      body: Type.Object({
        filename: Type.String(),
        contentType: Type.String(),
      }),
      response: {
        200: Type.Object({
          url: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => uploadMedia(server, req, reply),
  })

  server.post('/media/upload/request', {
    schema: {
      tags: ['Media'],
      description: 'Upload media request',
      security: [
        {
          apiKey: [],
          apiSecret: [],
        },
      ],
      response: {
        200: Type.Object({
          signedUrl: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => uploadMediaRequest(server, req, reply),
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

  server.post('/media/update/transcode', {
    schema: {
      tags: ['Tasks'],
      description: 'Update a task',
      hide: true,
      querystring: {
        secret: Type.String(),
      },
      body: Type.Object({
        s3key: Type.String(),
      }),
    },
    handler: (request, reply) =>
      receiveMediaTranscodeUpdate(server, request, reply),
  })
}

export default mediaRoutes
