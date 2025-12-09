import {
  getNotificationPreferences,
  getUserPreferences,
  updateNotificationPreferences,
} from '../controllers/userPreferencesController'
import { isAuth } from '../middleware/authMiddleware'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

async function userPreferencesRoutes(server: FastifyInstance) {
  server.get<{ Querystring: { populateOwner?: string } }>(
    '/user-preferences',
    {
      preHandler: [(request, reply) => isAuth(server, request, reply)],
    },
    async (request, reply) => {
      return getUserPreferences(server, request, reply)
    },
  )

  // Get notification preferences
  server.get('/user-preferences/notifications', {
    schema: {
      tags: ['User Preferences'],
      summary: 'Get Notification Preferences',
      description: 'Get notification preferences for the current user',
      security: [
        {
          apiKey: [],
        },
      ],
      response: {
        200: Type.Object({
          notification_preferences: Type.Object({
            new_creation: Type.Boolean(),
            new_message: Type.Boolean(),
            session_permissions: Type.Boolean(),
            agent_permissions: Type.Boolean(),
          }),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      getNotificationPreferences(server, request, reply),
  })

  // Update notification preferences
  server.patch('/user-preferences/notifications', {
    schema: {
      tags: ['User Preferences'],
      summary: 'Update Notification Preferences',
      description: 'Update notification preferences for the current user',
      security: [
        {
          apiKey: [],
        },
      ],
      body: Type.Object({
        notification_preferences: Type.Object({
          new_creation: Type.Optional(Type.Boolean()),
          new_message: Type.Optional(Type.Boolean()),
          session_permissions: Type.Optional(Type.Boolean()),
          agent_permissions: Type.Optional(Type.Boolean()),
        }),
      }),
      response: {
        200: Type.Object({
          notification_preferences: Type.Object({
            new_creation: Type.Boolean(),
            new_message: Type.Boolean(),
            session_permissions: Type.Boolean(),
            agent_permissions: Type.Boolean(),
          }),
          message: Type.String(),
        }),
      },
    },
    preHandler: [(request, reply) => isAuth(server, request, reply)],
    handler: (request, reply) =>
      updateNotificationPreferences(server, request, reply),
  })
}

export default userPreferencesRoutes
