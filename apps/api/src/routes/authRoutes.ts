import { FastifyPluginAsync } from 'fastify'

import { receiveUserUpdate } from '../controllers/authController'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/update', {
    handler: (request, reply) => receiveUserUpdate(server, request, reply),
  })
}

export default authRoutes
