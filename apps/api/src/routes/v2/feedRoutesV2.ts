import {
  getAgentsFeedCursor,
  getCollectionsFeedCursorV2,
  getCreationsFeedCursorV2,
  getCreatorsFeedCursor,
  getModelsFeedCursorV2,
} from '../../controllers/v2/feedControllerV2'
import { maybeAuth } from '../../middleware/authMiddleware'
import { cursorPaginatedResponse, cursorPaginationProperties } from '../index'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const feedRoutesV2: FastifyPluginAsync = async server => {
  server.get('/v2/feed-cursor/creations', {
    schema: {
      tags: ['Feed'],
      summary: 'Get Creations Feed',
      description:
        'Retrieve a cursor-paginated feed of recent creations sorted by relevance and recency.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) =>
      getCreationsFeedCursorV2(server, request, reply),
  })

  server.get('/v2/feed-cursor/models', {
    schema: {
      tags: ['Feed'],
      summary: 'Get Models Feed',
      description:
        'Retrieve a cursor-paginated feed of recent models sorted by relevance and recency.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getModelsFeedCursorV2(server, request, reply),
  })

  server.get('/v2/feed-cursor/collections', {
    schema: {
      tags: ['Feed'],
      summary: 'Get Collections Feed',
      description:
        'Retrieve a cursor-paginated feed of recent collections sorted by relevance and recency.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) =>
      getCollectionsFeedCursorV2(server, request, reply),
  })

  server.get('/v2/feed-cursor/agents', {
    schema: {
      tags: ['Feed'],
      summary: 'Get Agents Feed',
      description:
        'Retrieve a cursor-paginated feed of recent agents sorted by relevance and recency.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getAgentsFeedCursor(server, request, reply),
  })

  server.get('/v2/feed-cursor/creators', {
    schema: {
      tags: ['Feed'],
      summary: 'Get Creators Feed',
      description:
        'Retrieve a cursor-paginated feed of creators sorted by activity and relevance.',
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
    preHandler: [request => maybeAuth(server, request)],
    handler: (request, reply) => getCreatorsFeedCursor(server, request, reply),
  })
}

export default feedRoutesV2
