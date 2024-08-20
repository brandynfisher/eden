import {
  getCreationsFeedCursorV2,
  getModelsFeedCursorV2,
} from '../../controllers/v2/feedControllerV2'
import { maybeAuthEden2 } from '../../middleware/authMiddleware'
import { cursorPaginatedResponse, cursorPaginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const feedRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/feed-cursor/creations', {
    schema: {
      tags: ['Feed'],
      description: 'Get creations feed',
      hide: true,
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          ...cursorPaginationProperties(),
        },
        required: [],
      },
      response: {
        200: cursorPaginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuthEden2(server, request)],
    handler: (request, reply) =>
      getCreationsFeedCursorV2(server, request, reply),
  })

  server.get('/v2/feed-cursor/models', {
    schema: {
      tags: ['Feed'],
      description: 'Get models feed',
      hide: true,
      security: [
        {
          apiKey: [],
        },
      ],
      querystring: {
        type: 'object',
        properties: {
          ...cursorPaginationProperties(),
        },
        required: [],
      },
      response: {
        200: cursorPaginatedResponse(Type.Any()),
      },
    },
    preHandler: [request => maybeAuthEden2(server, request)],
    handler: (request, reply) => getModelsFeedCursorV2(server, request, reply),
  })
}

export default feedRoutesV2
