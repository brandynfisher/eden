import {
  getMediaDownloadUrl,
  getMediaDownloadZip,
  receiveMediaTranscodeUpdate,
  uploadMedia,
  uploadMediaRequestCloudinary,
  uploadS3MediaRequest,
} from '../controllers/mediaController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const mediaRoutes: FastifyPluginAsync = async server => {
  server.post('/media/upload', {
    schema: {
      hide: true,
      tags: ['Media'],
      summary: 'Upload Media File',
      description:
        'Upload a media file (image, video, audio) to the server for use in creations.',
      security: [
        {
          apiKey: [],
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

  server.post('/media/upload/request', {
    schema: {
      hide: true,
      tags: ['Media'],
      summary: 'Request Media Upload URL',
      description:
        'Get a signed URL for uploading media files directly to cloud storage.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        filename: Type.String(),
        contentType: Type.String(),
      }),
      response: {
        200: Type.Object({
          signedUrl: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => uploadS3MediaRequest(server, req, reply),
  })

  server.get('/media/upload/sign-request', {
    schema: {
      hide: true,
      tags: ['Media'],
      summary: 'Get Cloudinary Upload Signature',
      description:
        'Get a signed request for uploading media files directly to Cloudinary.',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          signature: Type.String(),
          timestamp: Type.Number(),
          cloudName: Type.String(),
          apiKey: Type.String(),
        }),
        500: Type.Object({
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => uploadMediaRequestCloudinary(server, req, reply),
  })

  server.get('/media/download', {
    schema: {
      hide: true,
      tags: ['Media'],
      summary: 'Get Media Download URL',
      description:
        'Generate a signed URL for downloading a specific media file.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      querystring: Type.Object({
        url: Type.String(),
        fileName: Type.Optional(Type.String()),
        fileExtension: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          signedUrl: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => getMediaDownloadUrl(server, req, reply),
  })

  server.post('/media/download/bulk', {
    schema: {
      hide: true,
      tags: ['Media'],
      summary: 'Bulk Download Media',
      description:
        'Download multiple media files packaged together as a ZIP archive.',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        files: Type.Array(
          Type.Object({
            url: Type.String({ format: 'uri' }),
            fileName: Type.Optional(Type.String()),
            fileExtension: Type.Optional(Type.String()),
          }),
        ),
      }),
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (req, reply) => getMediaDownloadZip(server, req, reply),
  })

  server.post('/media/update/transcode', {
    schema: {
      hide: true,
      tags: ['Tasks'],
      summary: 'Update Media Transcode Status',
      description:
        'Webhook endpoint to receive media transcoding completion notifications.',
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
