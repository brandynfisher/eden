import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

import {
  login,
  luciaLogin,
  luciaLogout,
  luciaSignup,
} from '../controllers/authController'

const authRoutes: FastifyPluginAsync = async server => {
  server.post('/auth/login', {
    schema: {
      body: Type.Object({
        address: Type.String(),
        message: Type.String(),
        signature: Type.String(),
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
        }),
      },
    },
    handler: (request, reply) => login(server, request, reply),
  })
  server.post('/auth/lucia/signup', {
    schema: {
      body: Type.Object({
        username: Type.String(),
        password: Type.String(),
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
        }),
      },
    },
    handler: (request, reply) => luciaSignup(server, request, reply),
  })
  server.post('/auth/lucia/login', {
    schema: {
      body: Type.Object({
        username: Type.String(),
        password: Type.String(),
      }),
      response: {
        200: Type.Object({
          token: Type.String(),
        }),
      },
    },
    handler: (request, reply) => luciaLogin(server, request, reply),
  })
  server.post('/auth/lucia/logout', {
    schema: {
      body: Type.Object({
        username: Type.String(),
      }),
      response: {
        200: Type.Object({}),
      },
    },
    handler: (request, reply) => luciaLogout(server, request, reply),
  })
}

export default authRoutes
