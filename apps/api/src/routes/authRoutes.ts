import { FastifyPluginAsync } from 'fastify'

import { receiveUserUpdate } from '../controllers/auth/clerkController'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/clerk/update', {
    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  })
}

export default authRoutes
