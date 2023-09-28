import { mongoose } from '@lucia-auth/adapter-mongoose'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { lucia } from 'lucia'
import { fastify } from 'lucia/middleware'

import { User } from '../models/Creator'
import { Key } from '../models/Key'
import { UserSession } from '../models/UserSession'

const auth = lucia({
  env: 'DEV',
  middleware: fastify(),
  adapter: mongoose({
    User,
    Key,
    Session: UserSession,
  }),
  getUserAttributes: data => {
    return {
      username: data.username,
    }
  },
})

export const registerLucia = async (server: FastifyInstance) => {
  try {
    server.auth = auth
    server.decorate(
      'verifyUser',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const authRequest = auth.handleRequest(request, reply)
        const session = await authRequest.validate()
        if (!session) {
          throw new Error('Not authorized')
        }

        request.user.isAdmin = session.user.isAdmin || false
      },
    )

    server.log.info('Successfully registered LuciaPlugin')
  } catch (err) {
    server.log.error('Plugin: Lucia, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    auth: typeof auth
  }
}

export default registerLucia
