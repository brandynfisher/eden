import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import { paginatedResponse, paginationProperties } from '.'
import {
  createCharacter,
  deleteCharacter,
  getCharacter,
  listCharacters,
  updateCharacter,
} from '../controllers/characterController'
import { isAuth } from '../middleware/authMiddleware'

const characterRoutes: FastifyPluginAsync = async server => {
  server.post('/characters/create', {
    schema: {
      body: Type.Object({
        name: Type.String(),
      }),
      response: {
        200: Type.Object({
          characterId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => createCharacter(request, reply),
  })

  server.post('/characters/update', {
    schema: {
      body: Type.Object({
        characterId: Type.String(),
        name: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          characterId: Type.String(),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => updateCharacter(request, reply),
  })

  server.post('/characters/delete', {
    schema: {
      body: Type.Object({
        characterId: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => deleteCharacter(request, reply),
  })

  server.get('/characters', {
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
        200: paginatedResponse(
          Type.Object({
            id: Type.String(),
            name: Type.String(),
            capabilities: Type.Array(Type.Any()),
          }),
        ),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => listCharacters(request, reply),
  })

  server.get('/characters/:characterId', {
    schema: {
      params: Type.Object({
        characterId: Type.String(),
      }),
      response: {
        200: Type.Object({
          character: Type.Object({
            id: Type.String(),
            name: Type.String(),
            capabilities: Type.Array(Type.Any()),
          }),
        }),
      },
    },
    preHandler: [async request => isAuth(server, request)],
    handler: (request, reply) => getCharacter(request, reply),
  })
}

export default characterRoutes
