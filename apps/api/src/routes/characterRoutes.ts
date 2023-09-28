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
        image: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        greeting: Type.Optional(Type.String()),
        dialogue: Type.Optional(
          Type.Array(
            Type.Object({
              sender: Type.String(),
              message: Type.String(),
            }),
          ),
        ),
      }),
      response: {
        200: Type.Object({
          characterId: Type.String(),
          slug: Type.String(),
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
        image: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        greeting: Type.Optional(Type.String()),
        dialogue: Type.Optional(
          Type.Array(
            Type.Object({
              sender: Type.String(),
              message: Type.String(),
            }),
          ),
        ),
      }),
      response: {
        200: Type.Object({}),
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
            user: Type.String(),
            name: Type.String(),
            slug: Type.String(),
            image: Type.Optional(Type.Any()),
            voice: Type.Optional(Type.String()),
            description: Type.Optional(Type.String()),
            greeting: Type.Optional(Type.String()),
            dialogue: Type.Optional(
              Type.Array(
                Type.Object({
                  sender: Type.String(),
                  message: Type.String(),
                }),
              ),
            ),
          }),
        ),
      },
    },
    handler: (request, reply) => listCharacters(request, reply),
  })

  server.get('/characters/:slug', {
    schema: {
      params: Type.Object({
        slug: Type.String(),
      }),
      response: {
        200: Type.Object({
          character: Type.Object({
            id: Type.String(),
            user: Type.String(),
            name: Type.String(),
            slug: Type.String(),
            image: Type.Optional(Type.Any()),
            voice: Type.Optional(Type.String()),
            description: Type.Optional(Type.String()),
            greeting: Type.Optional(Type.String()),
            dialogue: Type.Optional(
              Type.Array(
                Type.Object({
                  sender: Type.String(),
                  message: Type.String(),
                }),
              ),
            ),
          }),
        }),
      },
    },
    handler: (request, reply) => getCharacter(request, reply),
  })
}

export default characterRoutes
