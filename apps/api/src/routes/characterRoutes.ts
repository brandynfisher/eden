import { paginatedResponse, paginationProperties } from '.'
import {
  createCharacter,
  deleteCharacter,
  getCharacter,
  interactCharacter,
  listCharacters,
  testCharacter,
  updateCharacter,
} from '../controllers/characterController'
import { createTask } from '../controllers/taskController'
import { isAuth, isCharacter, maybeAuth } from '../middleware/authMiddleware'
import { configType } from '../types/routeTypes'
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const logosType = Type.Optional(
  Type.Object({
    abilities: Type.Optional(Type.Record(Type.String(), Type.Boolean())),
    capabilities: Type.Optional(Type.Array(Type.String())),
    identity: Type.Optional(Type.String()),
    knowledge: Type.Optional(Type.String()),
    knowledgeSummary: Type.Optional(Type.String()),
    concept: Type.Optional(Type.String()),
    chatModel: Type.Optional(Type.String()),
  }),
)

const characterRoutes: FastifyPluginAsync = async server => {
  server.post('/characters', {
    schema: {
      hide: true,
      tags: ['Characters'],
      summary: 'Create New Character',
      description:
        'Create a new AI character with personality, traits, and configuration settings.',
      body: Type.Object({
        name: Type.String(),
        image: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        greeting: Type.Optional(Type.String()),
        dialogue: Type.Optional(
          Type.Array(
            Type.Object({
              sender: Type.String(),
              message: Type.String(),
            }),
          ),
        ),
        logosData: Type.Optional(logosType),
        isPrivate: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          characterId: Type.String(),
          slug: Type.String(),
        }),
      },
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => createCharacter(request, reply),
  })

  server.patch('/characters/:characterId', {
    schema: {
      hide: true,
      tags: ['Characters'],
      summary: 'Update Character',
      description:
        "Update an existing character's name, image, voice, dialogue, or other properties.",
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: {
        characterId: Type.String(),
      },
      body: Type.Object({
        name: Type.Optional(Type.String()),
        image: Type.Optional(Type.String()),
        voice: Type.Optional(Type.String()),
        greeting: Type.Optional(Type.String()),
        dialogue: Type.Optional(
          Type.Array(
            Type.Object({
              sender: Type.String(),
              message: Type.String(),
            }),
          ),
        ),
        logosData: Type.Optional(logosType),
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
      hide: true,
      tags: ['Characters'],
      summary: 'Delete Character',
      description: 'Permanently delete a character and all associated data.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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
      hide: true,
      tags: ['Characters'],
      summary: 'Get Character Details',
      description:
        'Retrieve detailed information about a specific character including personality and configuration.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
      params: Type.Object({
        characterId: Type.String(),
      }),
      response: {
        200: Type.Object({
          character: Type.Object({
            _id: Type.String(),
            user: Type.Object({
              userId: Type.String(),
              username: Type.String(),
              userImage: Type.String(),
            }),
            name: Type.String(),
            slug: Type.String(),
            image: Type.Optional(Type.String()),
            voice: Type.Optional(Type.String()),
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
            logosData: Type.Optional(logosType),
            isPrivate: Type.Optional(Type.Boolean()),
          }),
        }),
      },
    },
    preHandler: [async request => maybeAuth(server, request)],
    handler: (request, reply) => getCharacter(request, reply),
  })

  server.get('/characters', {
    schema: {
      hide: true,
      tags: ['Characters'],
      summary: 'List Characters',
      description:
        'Get a paginated list of characters with optional filtering by user ID.',
      security: [
        {
          apiKey: [],
          // apiSecret: [],
        },
      ],
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
            _id: Type.String(),
            user: Type.Object({
              userId: Type.String(),
              username: Type.String(),
              userImage: Type.String(),
            }),
            name: Type.String(),
            slug: Type.String(),
            image: Type.Optional(Type.String()),
            voice: Type.Optional(Type.String()),
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
            logosData: Type.Optional(logosType),
            isPrivate: Type.Optional(Type.Boolean()),
          }),
        ),
      },
    },
    preHandler: [async request => maybeAuth(server, request)],
    handler: (request, reply) => listCharacters(request, reply),
  })

  server.post('/characters/test', {
    schema: {
      hide: true,
      tags: ['Characters'],
      summary: 'Test Character Response',
      description:
        "Test a character's response to a message without creating a persistent conversation session.",
      body: Type.Object({
        name: Type.String(),
        identity: Type.String(),
        message: Type.String(),
        knowledge: Type.Optional(Type.String()),
        knowledge_summary: Type.Optional(Type.String()),
        attachments: Type.Optional(Type.Array(Type.String())),
      }),
      response: {
        200: Type.Object({
          message: Type.String(),
          config: Type.Optional(Type.Any()),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => testCharacter(server, request, reply),
  })

  server.post('/characters/interact', {
    schema: {
      hide: true,
      tags: ['Characters'],
      summary: 'Interact with Character',
      description:
        'Send a message to a character and receive a response within an ongoing conversation session.',
      body: {
        character_id: Type.String(),
        session_id: Type.String(),
        message: Type.String(),
        attachments: Type.Optional(Type.Array(Type.String())),
      },
      response: {
        200: Type.Object({
          message: Type.String(),
          config: Type.Optional(Type.Any()),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) => interactCharacter(server, request, reply),
  })

  server.post('/characters/tasks/create', {
    schema: {
      hide: true,
      tags: ['Characters'],
      summary: 'Create Character Task',
      description:
        'Create a new task with the character as the acting user, allowing character-initiated operations.',
      body: {
        generatorName: Type.String(),
        versionId: Type.Optional(Type.String()),
        config: Type.Optional(configType),
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
