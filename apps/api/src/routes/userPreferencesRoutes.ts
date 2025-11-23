import { getUserPreferences } from '../controllers/userPreferencesController'
import { isAuth } from '../middleware/authMiddleware'
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
}

export default userPreferencesRoutes
