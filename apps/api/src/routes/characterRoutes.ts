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
import { createTask } from '../controllers/taskController'
import { isAuth, isCharacter, maybeAuth } from '../middleware/authMiddleware'

const characterRoutes: FastifyPluginAsync = async server => {
  server.post('/characters', {
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
        isPrivate: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          characterId: Type.String(),
          slug: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createCharacter(request, reply),
  })

  server.patch('/characters/:characterId', {
    schema: {
      params: {
        characterId: Type.String(),
      },
      body: Type.Object({
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
        isPrivate: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => updateCharacter(request, reply),
  })

  server.post('/characters/delete', {
    schema: {
      body: {
        characterId: Type.String(),
      },
      response: {
        200: Type.Object({}),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => deleteCharacter(request, reply),
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
            user: Type.Any(),
            name: Type.String(),
            slug: Type.String(),
            image: Type.Optional(Type.String()),
            voice: Type.Optional(Type.String()),
            description: Type.Optional(Type.String()),
            creationCount: Type.Optional(Type.Number()),
            greeting: Type.Optional(Type.String()),
            dialogue: Type.Optional(
              Type.Array(
                Type.Object({
                  sender: Type.String(),
                  message: Type.String(),
                }),
              ),
            ),
            isPrivate: Type.Optional(Type.Boolean()),
          }),
        }),
      },
    },
    preHandler: [async (request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => getCharacter(request, reply),
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
            user: Type.Any(),
            name: Type.String(),
            slug: Type.String(),
            image: Type.Optional(Type.String()),
            voice: Type.Optional(Type.String()),
            description: Type.Optional(Type.String()),
            creationCount: Type.Optional(Type.Number()),
            greeting: Type.Optional(Type.String()),
            dialogue: Type.Optional(
              Type.Array(
                Type.Object({
                  sender: Type.String(),
                  message: Type.String(),
                }),
              ),
            ),
            isPrivate: Type.Optional(Type.Boolean()),
          }),
        ),
      },
    },
    preHandler: [async (request, reply) => maybeAuth(server, request, reply)],
    handler: (request, reply) => listCharacters(request, reply),
  })

  server.post('/characters/tasks/create', {
    schema: {
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(Type.Any()),
        webhooks: Type.Optional(Type.Array(Type.String())),
        attributes: Type.Optional(
          Type.Object({
            discordId: Type.Optional(Type.String()),
            delegateUserId: Type.Optional(Type.String()),
          }),
        ),
      },
      response: {
        200: Type.Object({
          taskId: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isCharacter(server, request, reply)],
    handler: (request, reply) => createTask(server, request, reply),
  })
}

export default characterRoutes
